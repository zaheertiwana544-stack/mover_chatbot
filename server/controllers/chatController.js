const Groq        = require('groq-sdk');
const ChatSession = require('../models/ChatSession');
const Booking     = require('../models/Booking');
const { calculatePrice, formatQuoteForAI } = require('../config/pricing');
const { ITEMS } = require('../config/itemCatalog');
const { nanoid } = require('nanoid');

let _groq = null;
const getGroq = () => {
  if (!_groq) {
    const key = process.env.GROQ_API_KEY;
    if (!key || key === 'your_groq_api_key_here' || !key.trim()) throw new Error('GROQ_API_KEY not set');
    _groq = new Groq({ apiKey: key });
  }
  return _groq;
};

const MODEL = 'openai/gpt-oss-120b';

const ITEM_REFERENCE = Object.entries(ITEMS)
  .map(([id, v]) => `${id}: ${v.label} (${v.weight}lbs)`)
  .join('\n');

// Robust extractor — strips markdown code fences before parsing
function extractQuoteIntent(text) {
  try {
    // Strip markdown code fences the model sometimes adds
    const cleaned = text.replace(/```json/gi, '').replace(/```/g, '');
    const match = cleaned.match(/\[QUOTE_READY\]([\s\S]*?)\[\/QUOTE_READY\]/);
    if (!match) return null;
    return JSON.parse(match[1].trim());
  } catch (e) {
    console.error('extractQuoteIntent parse error:', e.message);
    return null;
  }
}

function extractZipFromAddress(address) {
  const match = address?.match(/\b(\d{5})(?:-\d{4})?\b/);
  return match ? match[1] : null;
}

// In-memory pending quotes per session — so "confirm" can save to DB
const pendingQuotes = new Map(); // sessionId → { pricing, origin, destination, items, customer, intent }

const SYSTEM_PROMPT = `You are Alex, a professional moving consultant at MoveEasy.

FORMAT RULES:
- Plain sentences only. Zero markdown. No **, no *, no bullet dashes, no numbered lists, no code blocks.
- One question at a time. Never ask multiple questions at once.
- Remember everything the customer said. Never ask again for info already given.
- Keep replies under 60 words except when delivering a quote.
- Off-topic questions: reply only "I can only help with moving questions. What can I help you with today?"

QUOTE FLOW — collect in this exact order:
1. Items they want to move
2. Pickup location (full address with city, state and zip if possible — but accept city name alone)
3. Delivery location (same rule)
4. Move date
5. Name, phone, and email — ask for all three together: "Could I get your name, phone number, and email to complete the quote?"

Once you have all five, output the QUOTE_READY block immediately. Do not ask for zip separately if the customer already gave an address.

ITEM MAPPING — map customer descriptions to catalog IDs:
- table / dining table = dining_table_sm (default), dining_table_lg if "large" or "6+ seat"
- chair / dining chair = dining_chair
- office chair = office_chair
- bicycle / bike = bike
- sofa / couch = sofa_3seat (default), sofa_2seat if "small/2-seat"
- bed = bed_queen (default), bed_king if "king", bed_twin if "twin/single", bed_full if "double/full"
- fridge / refrigerator = refrigerator
- washer = washer, dryer = dryer
- TV = tv_large (default), tv_small if "small/under 50"
- dresser = dresser_large (default)
- boxes = box_medium per box
- piano = piano_upright (default)
- desk = desk_small (default)
For counts: "4 chairs" → { "id": "dining_chair", "qty": 4 }

ITEM CATALOG (use exact IDs):
${ITEM_REFERENCE}

QUOTE_READY FORMAT — output this exact block, no code fences, nothing after it:
[QUOTE_READY]
{
  "originAddress": "full address customer gave",
  "originCity": "city",
  "originState": "state abbreviation e.g. CA",
  "originZip": "5-digit zip or null",
  "destAddress": "full address customer gave",
  "destCity": "city",
  "destState": "state abbreviation",
  "destZip": "5-digit zip or null",
  "moveDate": "date as given",
  "customerName": "full name",
  "customerPhone": "phone",
  "customerEmail": "email",
  "items": [ { "id": "...", "qty": 1 } ],
  "itemSummary": "brief plain English list"
}
[/QUOTE_READY]

IMPORTANT: If customer gave a city without zip, set originZip/destZip to null — do NOT ask for it again. The system handles city-name geocoding automatically.
NEVER use code fences (backticks) around the QUOTE_READY block. Output it as plain text only.

AFTER QUOTE IS SHOWN:
If the customer says "confirm", "book", "yes", or "book this move" — reply ONLY with this exact line and nothing else:
[BOOKING_CONFIRMED]

TRACKING: Ask for reference number. Reply: "Booking [ref] is currently [status]. [One sentence]. Anything else?"

GREETING: "Hi there, I am Alex from MoveEasy. What items are you looking to move today?"`;

exports.chat = async (req, res) => {
  try {
    const { messages, sessionId } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const validMessages = messages
      .filter(m => m.role && m.content && ['user', 'assistant'].includes(m.role))
      .slice(-30)
      .map(m => ({ role: m.role, content: String(m.content).slice(0, 2000) }));

    const groq = getGroq();
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...validMessages],
      max_tokens: 600,
      temperature: 0.3,
    });

    let reply = completion.choices[0]?.message?.content || 'Sorry, could not process that.';

    // ── 1. Check if customer is confirming a booking ──────────────────────
    if (reply.trim() === '[BOOKING_CONFIRMED]' || reply.includes('[BOOKING_CONFIRMED]')) {
      const pending = pendingQuotes.get(sessionId);
      if (pending) {
        try {
          const refNumber = `MV-${nanoid(8).toUpperCase()}`;
          await Booking.create({
            referenceNumber: refNumber,
            customer: {
              name:  pending.customerName  || 'Customer',
              email: pending.customerEmail || '',
              phone: pending.customerPhone || ''
            },
            origin:      pending.origin,
            destination: pending.destination,
            moveDate:    pending.moveDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            items:       pending.items    || [],
            pricing:     pending.pricing  || {},
            trackingHistory: [{
              status:    'pending_approval',
              message:   'Booking request received via AI chat. Awaiting admin confirmation.',
              timestamp: new Date()
            }]
          });
          pendingQuotes.delete(sessionId);
          reply = `Your move is confirmed and saved. Reference number: ${refNumber}\n\nA confirmation will be sent to ${pending.customerEmail}. Your crew will contact you 48 hours before move day. You can track your move anytime using this reference number.`;
        } catch (bookingErr) {
          console.error('Auto-booking error:', bookingErr.message);
          reply = `I have all your details ready. Please use the Book a Move page to finalize your booking, or call us directly.`;
        }
      } else {
        reply = `To confirm a booking, please first get a quote by telling me what you would like to move.`;
      }
    }

    // ── 2. Intercept QUOTE_READY → real pricing ──────────────────────────
    else {
      const intent = extractQuoteIntent(reply);
      if (intent) {
        try {
          const originZip = intent.originZip || extractZipFromAddress(intent.originAddress);
          const destZip   = intent.destZip   || extractZipFromAddress(intent.destAddress);

          const origin = {
            zip:     originZip     || null,
            city:    intent.originCity  || '',
            state:   intent.originState || '',
            address: intent.originAddress || ''
          };
          const destination = {
            zip:     destZip         || null,
            city:    intent.destCity   || '',
            state:   intent.destState  || '',
            address: intent.destAddress || ''
          };

          const pricing = await calculatePrice({ origin, destination, items: intent.items || [] });

          // Enrich city/state from geocoding
          const finalOrigin = {
            ...origin,
            city:  origin.city  || pricing.originInfo?.city  || originZip || '',
            state: origin.state || pricing.originInfo?.state || '',
          };
          const finalDest = {
            ...destination,
            city:  destination.city  || pricing.destInfo?.city  || destZip || '',
            state: destination.state || pricing.destInfo?.state || '',
          };

          // Store pending quote so "confirm" can save it to DB
          if (sessionId) {
            pendingQuotes.set(sessionId, {
              pricing,
              origin:      finalOrigin,
              destination: finalDest,
              items:       intent.items || [],
              moveDate:    parseMoveDate(intent.moveDate),
              customerName:  intent.customerName,
              customerPhone: intent.customerPhone,
              customerEmail: intent.customerEmail,
            });
          }

          reply = formatQuoteForAI(pricing, {
            origin:      finalOrigin,
            destination: finalDest,
            itemSummary: intent.itemSummary,
          });

          reply += `\n\nI have your details on file, ${intent.customerName || 'there'}. Just reply "confirm" or "book this move" to lock it in.`;

        } catch (err) {
          console.error('Pricing error:', err.message);
          reply = `I have your details. Could you confirm the cities you are moving between so I can calculate the price?`;
        }
      } else {
        // Strip any markdown that slipped through
        reply = reply
          .replace(/```json[\s\S]*?```/g, '')
          .replace(/```[\s\S]*?```/g, '')
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .replace(/\*(.*?)\*/g, '$1')
          .replace(/#{1,6}\s/g, '')
          .replace(/^\s*[-•]\s+/gm, '')
          .replace(/^\s*\d+\.\s+/gm, '')
          .replace(/\n{3,}/g, '\n\n')
          .trim();
      }
    }

    // Persist session
    if (sessionId) {
      const lastUser = validMessages[validMessages.length - 1];
      ChatSession.findOneAndUpdate(
        { sessionId },
        { $push: { messages: [{ role: 'user', content: lastUser?.content || '' }, { role: 'assistant', content: reply }] } },
        { upsert: true, new: true }
      ).catch(e => console.error('Session save:', e.message));
    }

    res.json({ reply, model: MODEL });

  } catch (err) {
    console.error('=== CHAT ERROR ===', err.message);
    if (err.message?.includes('GROQ_API_KEY')) return res.status(500).json({ error: 'AI not configured. Add GROQ_API_KEY to server/.env' });
    if (err.status === 429) return res.status(429).json({ error: 'AI is busy. Please try again.' });
    if (err.status === 401) return res.status(500).json({ error: 'Invalid Groq API key.' });
    res.status(500).json({ error: 'Chat unavailable.', debug: process.env.NODE_ENV === 'development' ? err.message : undefined });
  }
};

// Parse move date strings like "next week", "July 3", "03/july/2026"
function parseMoveDate(str) {
  if (!str) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  if (/next week/i.test(str)) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  if (/this week/i.test(str)) return new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  if (/this month/i.test(str)) return new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  if (/next month/i.test(str)) return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const d = new Date(str);
  return isNaN(d.getTime()) ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : d;
}
