const Quote       = require('../models/Quote');
const { calculatePrice } = require('../config/pricing');
const { ITEMS }   = require('../config/itemCatalog');

exports.createQuote = async (req, res) => {
  try {
    const { name, email, phone, origin, destination, homeSize, moveDate, services, items } = req.body;

    if (!moveDate)         return res.status(400).json({ error: 'Move date is required' });
    if (!origin?.zip && !origin?.city)           return res.status(400).json({ error: 'Pickup location is required' });
    if (!destination?.zip && !destination?.city) return res.status(400).json({ error: 'Delivery location is required' });

    const isItemBased = items && items.length > 0;
    if (!isItemBased) return res.status(400).json({ error: 'Please add at least one item to move' });

    // Enrich items with labels
    const enrichedItems = items.map(i => ({
      id:    i.id,
      qty:   i.qty || 1,
      label: ITEMS[i.id]?.label || i.id
    }));

    // Calculate price — this also geocodes zip → city/state
    const pricing = await calculatePrice({ origin, destination, items });

    // Use geocoded city/state if not provided
    const enrichedOrigin = {
      zip:   origin.zip   || '',
      city:  origin.city  || pricing.originInfo?.city  || '',
      state: origin.state || pricing.originInfo?.state || '',
    };
    const enrichedDest = {
      zip:   destination.zip   || '',
      city:  destination.city  || pricing.destInfo?.city  || '',
      state: destination.state || pricing.destInfo?.state || '',
    };

    const quote = await Quote.create({
      user:        req.user._id,
      name:        name  || req.user.name,
      email:       email || req.user.email,
      phone:       phone || req.user.phone || '',
      origin:      enrichedOrigin,
      destination: enrichedDest,
      pricingMode: 'item_based',
      homeSize:    homeSize || '',
      items:       enrichedItems,
      services:    services || [],
      moveDate,
      pricing,
    });

    res.status(201).json({ quote });
  } catch (err) {
    console.error('Quote error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.getMyQuotes = async (req, res) => {
  try {
    const quotes = await Quote.find({ user: req.user._id }).sort('-createdAt');
    res.json({ quotes });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getQuote = async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ error: 'Quote not found' });
    // Ownership check
    if (quote.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to view this quote' });
    }
    res.json({ quote });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getItemCatalog = (req, res) => {
  const { ITEMS, ITEM_CATEGORIES } = require('../config/itemCatalog');
  res.json({ items: ITEMS, categories: ITEM_CATEGORIES });
};
