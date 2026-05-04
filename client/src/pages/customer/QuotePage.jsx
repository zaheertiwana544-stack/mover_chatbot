import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { quotesAPI } from '../../services/api';
import { Icon } from '../../components/ui/Icons';
import toast from 'react-hot-toast';
import styles from './QuotePage.module.css';

export default function QuotePage() {
  const [catalog, setCatalog] = useState({ items: {}, categories: {} });
  const [selectedItems, setSelectedItems] = useState({});
  const [activeCategory, setActiveCategory] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  const [form, setForm] = useState({ name:'', email:'', phone:'', originZip:'', destZip:'', moveDate:'' });
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [zipError, setZipError] = useState({ origin:'', dest:'' });

  useEffect(() => {
    quotesAPI.getCatalog()
      .then(r => { setCatalog(r.data); setActiveCategory(Object.keys(r.data.categories)[0] || ''); })
      .catch(() => toast.error('Failed to load item catalog'));
  }, []);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const totalItemCount = Object.values(selectedItems).reduce((s, q) => s + q, 0);

  const setItemQty = (id, qty) => {
    setSelectedItems(prev => {
      if (qty <= 0) { const n = { ...prev }; delete n[id]; return n; }
      return { ...prev, [id]: qty };
    });
  };

  const validateZip = z => /^\d{5}$/.test(z.trim());

  const submit = async (e) => {
    e.preventDefault();
    const errors = { origin: '', dest: '' };
    if (!validateZip(form.originZip)) errors.origin = 'Enter a valid 5-digit zipcode';
    if (!validateZip(form.destZip))   errors.dest   = 'Enter a valid 5-digit zipcode';
    if (errors.origin || errors.dest) { setZipError(errors); return; }
    setZipError({ origin: '', dest: '' });
    if (totalItemCount === 0) { toast.error('Add at least one item'); return; }

    setLoading(true);
    try {
      const items = Object.entries(selectedItems).map(([id, qty]) => ({ id, qty }));
      const res = await quotesAPI.create({
        name: form.name, email: form.email, phone: form.phone,
        origin:      { zip: form.originZip.trim() },
        destination: { zip: form.destZip.trim() },
        moveDate: form.moveDate,
        items,
      });
      setQuote(res.data.quote);
      toast.success('Quote generated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to generate quote');
    } finally { setLoading(false); }
  };

  const filteredItems = itemSearch.trim()
    ? Object.entries(catalog.items).filter(([, v]) => v?.label.toLowerCase().includes(itemSearch.toLowerCase()))
    : (catalog.categories[activeCategory] || []).map(id => [id, catalog.items[id]]).filter(([, v]) => v);

  if (quote) return <QuoteResult quote={quote} onReset={() => { setQuote(null); setSelectedItems({}); }} />;

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.pageHeader}>
          <h1 className={styles.title}>Get Your Free Quote</h1>
          <p className={styles.sub}>Select your items and enter your zipcodes for an instant, accurate price.</p>
        </div>

        <form onSubmit={submit} className={styles.formGrid}>
          {/* LEFT — contact + location + date */}
          <div className={styles.formLeft}>
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Contact Information</div>
              <div className={styles.fieldGrid2}>
                <div className={styles.field}><label className="label">Full Name</label><input className="input-field" value={form.name} onChange={set('name')} required placeholder="John Smith" /></div>
                <div className={styles.field}><label className="label">Email</label><input className="input-field" type="email" value={form.email} onChange={set('email')} required placeholder="john@email.com" /></div>
              </div>
              <div className={styles.field}><label className="label">Phone (optional)</label><input className="input-field" value={form.phone} onChange={set('phone')} placeholder="+1 (555) 000-0000" /></div>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionTitle}>Move Locations</div>
              <div className={styles.fieldGrid2}>
                <div className={styles.field}>
                  <label className="label">Pickup Zipcode</label>
                  <input className="input-field" value={form.originZip} onChange={set('originZip')} required placeholder="e.g. 10001" maxLength={5} inputMode="numeric" />
                  {zipError.origin && <p className={styles.fieldError}>{zipError.origin}</p>}
                </div>
                <div className={styles.field}>
                  <label className="label">Delivery Zipcode</label>
                  <input className="input-field" value={form.destZip} onChange={set('destZip')} required placeholder="e.g. 90001" maxLength={5} inputMode="numeric" />
                  {zipError.dest && <p className={styles.fieldError}>{zipError.dest}</p>}
                </div>
              </div>
              <p className={styles.fieldHint}><Icon name="mapPin" size={11} color="#9CA3AF" strokeWidth={1.5} /> Zipcodes give exact distance for accurate pricing</p>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionTitle}>Move Date</div>
              <input className="input-field" type="date" value={form.moveDate} onChange={set('moveDate')} required min={new Date().toISOString().split('T')[0]} />
            </div>

            <div className={styles.section}>
              <div className={styles.sectionTitle}>Selected Items</div>
              {totalItemCount === 0
                ? <p className={styles.itemCountEmpty}>No items selected yet — use the picker on the right</p>
                : (
                  <div className={styles.selectedList}>
                    {Object.entries(selectedItems).map(([id, qty]) => {
                      const item = catalog.items[id];
                      if (!item) return null;
                      return (
                        <div key={id} className={styles.selectedRow}>
                          <span className={styles.selectedName}>{item.label}</span>
                          <div className={styles.itemQty}>
                            <button type="button" className={styles.qtyBtn} onClick={() => setItemQty(id, qty - 1)}><Icon name="minus" size={11} color="var(--blue)" strokeWidth={2.5} /></button>
                            <span className={styles.qtyVal}>{qty}</span>
                            <button type="button" className={styles.qtyBtn} onClick={() => setItemQty(id, qty + 1)}><Icon name="plus" size={11} color="var(--blue)" strokeWidth={2.5} /></button>
                          </div>
                        </div>
                      );
                    })}
                    <div className={styles.selectedTotal}>{totalItemCount} item{totalItemCount !== 1 ? 's' : ''} selected</div>
                  </div>
                )
              }
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15, borderRadius: 10 }}>
              {loading
                ? <><Icon name="clock" size={16} /> Calculating price...</>
                : <><Icon name="arrowRight" size={16} /> Get Instant Quote</>
              }
            </button>
          </div>

          {/* RIGHT — item picker */}
          <div className={styles.itemPicker}>
            <div className={styles.itemPickerHeader}>
              <div className={styles.sectionTitle} style={{ marginBottom: 0 }}>Item Catalog</div>
              {totalItemCount > 0 && <span className={styles.itemBadge}>{totalItemCount}</span>}
            </div>

            <div className={styles.itemSearch}>
              <Icon name="search" size={14} color="#9CA3AF" strokeWidth={1.5} className={styles.itemSearchIcon} />
              <input className={styles.itemSearchInput} placeholder="Search items..." value={itemSearch} onChange={e => setItemSearch(e.target.value)} />
              {itemSearch && <button type="button" className={styles.itemSearchClear} onClick={() => setItemSearch('')}><Icon name="close" size={12} color="#9CA3AF" strokeWidth={2} /></button>}
            </div>

            {!itemSearch && (
              <div className={styles.catTabs}>
                {Object.keys(catalog.categories).map(cat => (
                  <button type="button" key={cat} onClick={() => setActiveCategory(cat)} className={`${styles.catTab} ${activeCategory === cat ? styles.catTabActive : ''}`}>
                    {cat}
                  </button>
                ))}
              </div>
            )}

            <div className={styles.itemList}>
              {filteredItems.map(([id, item]) => {
                if (!item) return null;
                const qty = selectedItems[id] || 0;
                return (
                  <div key={id} className={`${styles.itemRow} ${qty > 0 ? styles.itemRowSelected : ''}`}>
                    <div className={styles.itemInfo}>
                      <div className={styles.itemName}>{item.label}</div>
                      <div className={styles.itemMeta}>
                        {item.weight} lbs · {item.volume} cu ft
                        {item.tier !== 'standard' && (
                          <span className={`${styles.itemTier} ${item.tier === 'fragile' ? styles.tierFragile : styles.tierSpecialty}`}>{item.tier}</span>
                        )}
                      </div>
                    </div>
                    <div className={styles.itemQty}>
                      <button type="button" className={styles.qtyBtn} onClick={() => setItemQty(id, qty - 1)} disabled={qty === 0}><Icon name="minus" size={11} color={qty > 0 ? 'var(--blue)' : '#D1D5DB'} strokeWidth={2.5} /></button>
                      <span className={styles.qtyVal}>{qty}</span>
                      <button type="button" className={styles.qtyBtn} onClick={() => setItemQty(id, qty + 1)}><Icon name="plus" size={11} color="var(--blue)" strokeWidth={2.5} /></button>
                    </div>
                  </div>
                );
              })}
              {filteredItems.length === 0 && <div className={styles.itemEmpty}>No items found for "{itemSearch}"</div>}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function QuoteResult({ quote, onReset }) {
  const p = quote.pricing;
  return (
    <div className={styles.page}>
      <div className={styles.resultWrap}>
        <div className={styles.resultTop}>
          <div className={styles.resultCheck}><Icon name="checkCircle" size={32} color="#15803D" strokeWidth={1.5} /></div>
          <h2 className={styles.resultTitle}>Your Quote is Ready</h2>
          <p className={styles.resultMeta}>{p.estimatedMiles} miles · {p.truckSize} · {p.moveType === 'local' ? 'Local (hourly)' : p.moveType === 'regional' ? 'Regional' : 'Long Distance'}</p>
        </div>

        <div className={styles.truckBanner}>
          <Icon name="truck" size={14} color="var(--blue)" strokeWidth={1.5} />
          <span>{p.truckSize} · {p.crewSize} movers · {p.totalWeight?.toLocaleString()} lbs</span>
        </div>

        {p.isLocal && (
          <div className={styles.localBanner}>
            <Icon name="clock" size={14} color="#D97706" strokeWidth={1.5} />
            <span>${p.hourlyRate}/hr · Est. {p.estHours} hrs · {p.minHours}-hr minimum</span>
          </div>
        )}

        <div className={styles.breakdown}>
          {p.isLocal
            ? <div className={styles.bRow}><span>Base charge ({p.estHours} hrs × ${p.hourlyRate})</span><span>${p.baseRate?.toLocaleString()}</span></div>
            : <div className={styles.bRow}><span>Base rate</span><span>${p.baseRate?.toLocaleString()}</span></div>
          }
          <div className={styles.bRow}><span>Fuel surcharge</span><span>${p.fuelSurcharge}</span></div>
          {!p.isLocal && p.labor > 0 && <div className={styles.bRow}><span>Labor</span><span>${p.labor}</span></div>}
          <div className={styles.bRow}><span>Insurance</span><span>${p.insurance}</span></div>
          {p.specialtySurcharge > 0 && <div className={styles.bRow}><span>Specialty handling</span><span>${p.specialtySurcharge}</span></div>}
          {p.packingSurcharge > 0 && <div className={styles.bRow}><span>Fragile item packing</span><span>${p.packingSurcharge}</span></div>}
          <div className={styles.bTotal}><span>Total Estimate</span><span>${p.total?.toLocaleString()}</span></div>
        </div>

        {p.isLocal && <p className={styles.resultNote}>Final charge based on actual hours, billed in 15-min increments after the {p.minHours}-hr minimum.</p>}

        <div className={styles.resultActions}>
          <Link to="/book" state={{ quote }} className="btn-primary">Book This Move</Link>
          <button onClick={onReset} className="btn-outline">New Quote</button>
        </div>
        <p className={styles.resultNote} style={{ textAlign: 'center', marginTop: 8 }}>Valid 7 days · No card required</p>
      </div>
    </div>
  );
}
