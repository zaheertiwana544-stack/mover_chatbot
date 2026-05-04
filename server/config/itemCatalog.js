/**
 * MoveEasy Item Catalog
 * Each item: { weight (lbs), volume (cu ft), tier, label }
 *
 * Tiers:
 *   standard  - normal handling
 *   fragile   - extra wrapping, slower handling
 *   specialty - requires special equipment or crew skill
 */

const ITEMS = {
  // ── LIVING ROOM ──────────────────────────────────────────────────────────
  sofa_2seat:        { weight: 180, volume: 40, tier: 'standard',  label: '2-Seat Sofa' },
  sofa_3seat:        { weight: 250, volume: 55, tier: 'standard',  label: '3-Seat Sofa' },
  sectional:         { weight: 350, volume: 90, tier: 'standard',  label: 'Sectional Sofa' },
  loveseat:          { weight: 140, volume: 32, tier: 'standard',  label: 'Loveseat' },
  armchair:          { weight:  80, volume: 18, tier: 'standard',  label: 'Armchair' },
  coffee_table:      { weight:  50, volume: 12, tier: 'standard',  label: 'Coffee Table' },
  end_table:         { weight:  25, volume:  6, tier: 'standard',  label: 'End Table' },
  tv_stand:          { weight:  60, volume: 16, tier: 'standard',  label: 'TV Stand' },
  tv_small:          { weight:  15, volume:  8, tier: 'fragile',   label: 'TV (under 50")' },
  tv_large:          { weight:  35, volume: 20, tier: 'fragile',   label: 'TV (50"+)' },
  bookshelf:         { weight:  55, volume: 18, tier: 'standard',  label: 'Bookshelf' },
  entertainment_unit:{ weight: 120, volume: 35, tier: 'standard',  label: 'Entertainment Unit' },
  lamp:              { weight:  10, volume:  5, tier: 'fragile',   label: 'Floor Lamp' },
  rug_small:         { weight:  15, volume:  6, tier: 'standard',  label: 'Area Rug (small)' },
  rug_large:         { weight:  40, volume: 15, tier: 'standard',  label: 'Area Rug (large)' },

  // ── BEDROOM ──────────────────────────────────────────────────────────────
  bed_twin:          { weight: 120, volume: 30, tier: 'standard',  label: 'Twin Bed + Frame' },
  bed_full:          { weight: 160, volume: 45, tier: 'standard',  label: 'Full Bed + Frame' },
  bed_queen:         { weight: 200, volume: 58, tier: 'standard',  label: 'Queen Bed + Frame' },
  bed_king:          { weight: 250, volume: 75, tier: 'standard',  label: 'King Bed + Frame' },
  dresser_small:     { weight:  90, volume: 20, tier: 'standard',  label: 'Small Dresser' },
  dresser_large:     { weight: 160, volume: 35, tier: 'standard',  label: 'Large Dresser' },
  nightstand:        { weight:  30, volume:  6, tier: 'standard',  label: 'Nightstand' },
  wardrobe:          { weight: 180, volume: 50, tier: 'standard',  label: 'Wardrobe / Armoire' },
  mirror_lg:         { weight:  40, volume: 12, tier: 'fragile',   label: 'Large Mirror' },
  vanity:            { weight:  80, volume: 18, tier: 'fragile',   label: 'Vanity with Mirror' },

  // ── DINING ───────────────────────────────────────────────────────────────
  dining_table_sm:   { weight: 100, volume: 22, tier: 'standard',  label: 'Dining Table (4-seat)' },
  dining_table_lg:   { weight: 180, volume: 40, tier: 'standard',  label: 'Dining Table (6-8 seat)' },
  dining_chair:      { weight:  20, volume:  5, tier: 'standard',  label: 'Dining Chair' },
  china_cabinet:     { weight: 200, volume: 45, tier: 'fragile',   label: 'China Cabinet' },
  buffet_sideboard:  { weight: 140, volume: 30, tier: 'standard',  label: 'Buffet / Sideboard' },
  bar_stool:         { weight:  18, volume:  4, tier: 'standard',  label: 'Bar Stool' },

  // ── KITCHEN ──────────────────────────────────────────────────────────────
  refrigerator:      { weight: 300, volume: 50, tier: 'specialty', label: 'Refrigerator' },
  fridge_mini:       { weight:  60, volume: 12, tier: 'standard',  label: 'Mini Fridge' },
  washer:            { weight: 200, volume: 30, tier: 'specialty', label: 'Washing Machine' },
  dryer:             { weight: 130, volume: 28, tier: 'specialty', label: 'Dryer' },
  dishwasher:        { weight:  90, volume: 18, tier: 'specialty', label: 'Dishwasher' },
  microwave:         { weight:  30, volume:  5, tier: 'standard',  label: 'Microwave' },
  kitchen_island:    { weight: 200, volume: 30, tier: 'standard',  label: 'Kitchen Island' },
  boxes_kitchen:     { weight:  30, volume:  5, tier: 'fragile',   label: 'Box of Kitchen Items' },

  // ── OFFICE ───────────────────────────────────────────────────────────────
  desk_small:        { weight:  80, volume: 20, tier: 'standard',  label: 'Small Desk' },
  desk_large:        { weight: 160, volume: 40, tier: 'standard',  label: 'Large Desk / L-shape' },
  office_chair:      { weight:  45, volume: 12, tier: 'standard',  label: 'Office Chair' },
  filing_cabinet:    { weight:  80, volume: 14, tier: 'standard',  label: 'Filing Cabinet' },
  monitor:           { weight:  12, volume:  6, tier: 'fragile',   label: 'Computer Monitor' },
  bookshelf_office:  { weight:  55, volume: 16, tier: 'standard',  label: 'Office Bookshelf' },
  printer:           { weight:  25, volume:  6, tier: 'fragile',   label: 'Printer / Copier' },

  // ── SPECIALTY / HIGH-VALUE ────────────────────────────────────────────────
  piano_upright:     { weight: 500, volume: 60, tier: 'specialty', label: 'Upright Piano' },
  piano_grand:       { weight:1200, volume:160, tier: 'specialty', label: 'Grand Piano' },
  pool_table:        { weight: 700, volume:120, tier: 'specialty', label: 'Pool Table' },
  safe_small:        { weight: 150, volume:  8, tier: 'specialty', label: 'Safe (under 200 lbs)' },
  safe_large:        { weight: 500, volume: 20, tier: 'specialty', label: 'Safe (200+ lbs)' },
  hot_tub:           { weight: 800, volume:200, tier: 'specialty', label: 'Hot Tub / Spa' },
  exercise_equipment:{ weight: 200, volume: 35, tier: 'specialty', label: 'Exercise Equipment' },
  artwork_sm:        { weight:  10, volume:  4, tier: 'fragile',   label: 'Artwork / Painting (small)' },
  artwork_lg:        { weight:  25, volume: 12, tier: 'fragile',   label: 'Artwork / Painting (large)' },
  antique_furniture: { weight: 150, volume: 30, tier: 'fragile',   label: 'Antique / Heirloom Furniture' },

  // ── BOXES / MISC ──────────────────────────────────────────────────────────
  box_small:         { weight:  20, volume:  1.5, tier: 'standard', label: 'Small Box' },
  box_medium:        { weight:  30, volume:  3,   tier: 'standard', label: 'Medium Box' },
  box_large:         { weight:  40, volume:  4.5, tier: 'standard', label: 'Large Box' },
  box_wardrobe:      { weight:  35, volume:  9,   tier: 'standard', label: 'Wardrobe Box' },
  bike:              { weight:  30, volume: 18,   tier: 'standard', label: 'Bicycle' },
  motorcycle:        { weight: 450, volume: 60,   tier: 'specialty', label: 'Motorcycle' },
  kayak_canoe:       { weight:  60, volume: 50,   tier: 'standard', label: 'Kayak / Canoe' },
  lawn_mower:        { weight:  90, volume: 18,   tier: 'standard', label: 'Lawn Mower' },
  patio_set:         { weight: 120, volume: 35,   tier: 'standard', label: 'Patio Furniture Set' },
};

// Grouped for UI display
const ITEM_CATEGORIES = {
  'Living Room':  ['sofa_2seat','sofa_3seat','sectional','loveseat','armchair','coffee_table','end_table','tv_stand','tv_small','tv_large','bookshelf','entertainment_unit','lamp','rug_small','rug_large'],
  'Bedroom':      ['bed_twin','bed_full','bed_queen','bed_king','dresser_small','dresser_large','nightstand','wardrobe','mirror_lg','vanity'],
  'Dining Room':  ['dining_table_sm','dining_table_lg','dining_chair','china_cabinet','buffet_sideboard','bar_stool'],
  'Kitchen':      ['refrigerator','fridge_mini','washer','dryer','dishwasher','microwave','kitchen_island','boxes_kitchen'],
  'Office':       ['desk_small','desk_large','office_chair','filing_cabinet','monitor','bookshelf_office','printer'],
  'Specialty':    ['piano_upright','piano_grand','pool_table','safe_small','safe_large','hot_tub','exercise_equipment','artwork_sm','artwork_lg','antique_furniture'],
  'Boxes & Misc': ['box_small','box_medium','box_large','box_wardrobe','bike','motorcycle','kayak_canoe','lawn_mower','patio_set'],
};

module.exports = { ITEMS, ITEM_CATEGORIES };
