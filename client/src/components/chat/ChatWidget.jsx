import { useState, useRef, useEffect } from 'react';
import { nanoid } from 'nanoid';
import { chatAPI } from '../../services/api';
import { Icon } from '../ui/Icons';
import styles from './ChatWidget.module.css';

function getQuickReplies(reply) {
  const r = reply.toLowerCase();
  if (r.includes('total estimate')) return ['Book this move', 'I have a question', 'Get another quote'];
  if (r.includes('reference number') || r.includes('mv-')) return ['Track my move', 'What should I pack first?'];
  if ((r.includes('moving to') || r.includes('destination')) && !r.includes('total')) return ['New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX'];
  if ((r.includes('bedroom') || r.includes('home size') || r.includes('size of')) && !r.includes('total')) return ['1 Bedroom', '2 Bedrooms', '3 Bedrooms', '4+ Bedrooms'];
  if ((r.includes('move date') || r.includes('when are you')) && !r.includes('total')) return ['This week', 'Next week', 'This month', 'Flexible'];
  if (r.includes('alex from moveeasy') || r.includes('planning a move') || r.includes('can i help')) return ['Get a quote', 'Book a move', 'Track a shipment'];
  return [];
}

function Message({ msg }) {
  const isBot = msg.role === 'assistant';
  return (
    <div className={`${styles.msg} ${isBot ? styles.bot : styles.user}`}>
      {isBot && (
        <div className={styles.botAvatar}>
          <Icon name="bot" size={13} color="var(--blue)" strokeWidth={1.5} />
        </div>
      )}
      <div className={styles.msgContent}>
        <div
          className={`${styles.bubble} ${msg.isError ? styles.bubbleError : ''}`}
          dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br>') }}
        />
        {msg.quickReplies?.length > 0 && (
          <div className={styles.quickBtns}>
            {msg.quickReplies.map(q => (
              <button key={q} className={styles.qBtn} onClick={() => msg.onQuickReply?.(q)}>{q}</button>
            ))}
          </div>
        )}
        <span className={styles.time}>{msg.time}</span>
      </div>
    </div>
  );
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{
    id: '0', role: 'assistant',
    content: "Hi there! I'm Alex from MoveEasy. Are you planning a move? I can get you an accurate quote in just a couple of minutes.",
    time: formatTime(), quickReplies: ['Get a quote', 'Book a move', 'Track a shipment']
  }]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [sessionId] = useState(() => nanoid());
  const [history, setHistory] = useState([]);
  const [badge, setBadge] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (open) { setBadge(false); setTimeout(() => inputRef.current?.focus(), 300); }
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  function formatTime() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const autoResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 80) + 'px';
    }
  };

  const sendMessage = async (text) => {
    const userText = (text || input).trim();
    if (!userText || typing) return;
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const userMsg = { id: nanoid(), role: 'user', content: userText, time: formatTime() };
    const newHistory = [...history, { role: 'user', content: userText }];
    setMessages(prev => [...prev, userMsg]);
    setHistory(newHistory);
    setTyping(true);

    try {
      const res = await chatAPI.send(newHistory, sessionId);
      const reply = res.data.reply;
      const assistantHistory = [...newHistory, { role: 'assistant', content: reply }];
      setHistory(assistantHistory);

      const quick = getQuickReplies(reply);
      const msgId = nanoid();
      const botMsg = {
        id: msgId, role: 'assistant', content: reply, time: formatTime(),
        quickReplies: quick,
        onQuickReply: (q) => {
          setMessages(prev => prev.map(m => m.id === msgId ? { ...m, quickReplies: [] } : m));
          sendMessage(q);
        }
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      const serverMsg = err.response?.data?.error;
      const status = err.response?.status;

      console.error('[Chat Error]', { status, serverMsg, raw: err.message });

      let displayMsg = 'Something went wrong. Please try again.';
      if (status === 429) displayMsg = 'I am handling a lot of requests right now. Please give me a moment and try again.';
      else if (status === 500 && serverMsg?.includes('not configured')) displayMsg = 'The AI service is not configured yet. Please add your GROQ_API_KEY to server/.env';
      else if (status === 500 && serverMsg?.includes('Invalid Groq')) displayMsg = 'Invalid API key. Please check your GROQ_API_KEY in server/.env';
      else if (!err.response) displayMsg = 'Cannot reach the server. Make sure the backend is running on port 5000.';

      setMessages(prev => [...prev, {
        id: nanoid(), role: 'assistant', content: displayMsg, time: formatTime(), isError: true
      }]);
    } finally { setTyping(false); }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <>
      <div className={`${styles.window} ${open ? styles.open : ''}`}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.agentIcon}>
              <Icon name="truck" size={16} color="#fff" strokeWidth={1.5} />
            </div>
            <div>
              <div className={styles.agentName}>Alex — MoveEasy</div>
              <div className={styles.agentStatus}>
                <span className={styles.dot} />
                Online · Replies instantly
              </div>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={() => setOpen(false)} aria-label="Close chat">
            <Icon name="close" size={14} color="#fff" strokeWidth={2} />
          </button>
        </div>

        <div className={styles.messages}>
          {messages.map(msg => <Message key={msg.id} msg={msg} />)}
          {typing && (
            <div className={`${styles.msg} ${styles.bot}`}>
              <div className={styles.botAvatar}>
                <Icon name="bot" size={13} color="var(--blue)" strokeWidth={1.5} />
              </div>
              <div className={styles.msgContent}>
                <div className={styles.bubble}>
                  <span className={styles.typingDot} />
                  <span className={styles.typingDot} />
                  <span className={styles.typingDot} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className={styles.inputArea}>
          <textarea
            ref={el => { inputRef.current = el; textareaRef.current = el; }}
            className={styles.input}
            value={input}
            onChange={e => { setInput(e.target.value); autoResize(); }}
            onKeyDown={handleKey}
            placeholder="Type your message..."
            rows={1}
          />
          <button
            className={styles.sendBtn}
            onClick={() => sendMessage()}
            disabled={typing || !input.trim()}
            aria-label="Send"
          >
            <Icon name="send" size={14} color="#fff" strokeWidth={2} />
          </button>
        </div>
      </div>

      <button className={styles.fab} onClick={() => setOpen(o => !o)} aria-label={open ? 'Close chat' : 'Open chat'}>
        {open
          ? <Icon name="close" size={20} color="#fff" strokeWidth={2.5} />
          : <Icon name="messageSquare" size={22} color="#fff" strokeWidth={1.5} />
        }
        {badge && !open && <span className={styles.badge}>1</span>}
      </button>
    </>
  );
}
