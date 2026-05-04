import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../services/api';
import { Icon } from '../../components/ui/Icons';
import toast from 'react-hot-toast';
import styles from './Admin.module.css';

const STATUS_OPTIONS = ['pending_approval','confirmed','crew_assigned','packing','loading','in_transit','delivered','cancelled'];

const STATUS_META = {
  pending_approval: { label: 'Pending Approval', color: 'orange',  icon: 'clock'       },
  confirmed:        { label: 'Confirmed',         color: 'blue',    icon: 'checkCircle' },
  crew_assigned:    { label: 'Crew Assigned',      color: 'purple',  icon: 'users'       },
  packing:          { label: 'Packing',            color: 'orange',  icon: 'box'         },
  loading:          { label: 'Loading',            color: 'orange',  icon: 'package'     },
  in_transit:       { label: 'In Transit',         color: 'green',   icon: 'truck'       },
  delivered:        { label: 'Delivered',          color: 'green',   icon: 'home'        },
  cancelled:        { label: 'Cancelled',          color: 'red',     icon: 'alertCircle' },
};

const DEFAULT_MESSAGES = {
  pending_approval: 'Your booking request is under review.',
  confirmed:        'Your booking has been confirmed. We will be in touch shortly.',
  crew_assigned:    'Your moving crew has been assigned and will contact you 48 hours before move day.',
  packing:          'Our crew has arrived and packing has begun.',
  loading:          'Items are being loaded onto the truck.',
  in_transit:       'Your belongings are on the way.',
  delivered:        'Move complete. All items have been delivered successfully.',
  cancelled:        'This booking has been cancelled. Please contact us if you have questions.',
};

export default function AdminBookings() {
  const [bookings, setBookings]       = useState([]);
  const [total, setTotal]             = useState(0);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage]               = useState(1);
  const [pages, setPages]             = useState(1);
  const [selected, setSelected]       = useState(null);
  const [updating, setUpdating]       = useState(false);
  const [tab, setTab]                 = useState('all'); // 'pending' | 'all'
  const [updateForm, setUpdateForm]   = useState({
    status: '', message: '', location: '',
    adminNotes: '', paymentStatus: '',
    crewLeadName: '', crewPhone: '', crewTruck: '',
    contactMethod: 'none'
  });

  const pendingCount = bookings.filter(b => b.status === 'pending_approval').length;

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (statusFilter)                      params.status = statusFilter;
      else if (tab === 'pending')            params.status = 'pending_approval';
      if (search)                            params.search = search;
      const res = await adminAPI.getBookings(params);
      setBookings(res.data.bookings);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch { toast.error('Failed to load bookings'); }
    finally { setLoading(false); }
  }, [page, statusFilter, search, tab]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const openDetail = (booking) => {
    setSelected(booking);
    setUpdateForm({
      status:        booking.status,
      message:       DEFAULT_MESSAGES[booking.status] || '',
      location:      '',
      adminNotes:    booking.adminNotes || '',
      paymentStatus: booking.paymentStatus || 'pending',
      crewLeadName:  booking.crew?.leadName    || '',
      crewPhone:     booking.crew?.phone       || '',
      crewTruck:     booking.crew?.truckNumber || '',
      contactMethod: booking.contactMethod     || 'none',
    });
  };

  const handleStatusChange = (status) => {
    setUpdateForm(f => ({ ...f, status, message: DEFAULT_MESSAGES[status] || '' }));
  };

  // Quick approve — one click from pending_approval → confirmed
  const quickApprove = async (booking) => {
    try {
      const res = await adminAPI.updateBooking(booking._id, {
        status:        'confirmed',
        message:       DEFAULT_MESSAGES.confirmed,
        paymentStatus: booking.paymentStatus,
        contactMethod: 'call',
      });
      setBookings(prev => prev.map(b => b._id === booking._id ? res.data.booking : b));
      toast.success(`Booking ${booking.referenceNumber} approved`);
    } catch { toast.error('Approval failed'); }
  };

  const submitUpdate = async () => {
    setUpdating(true);
    try {
      const payload = {
        status:        updateForm.status,
        message:       updateForm.message,
        location:      updateForm.location,
        adminNotes:    updateForm.adminNotes,
        paymentStatus: updateForm.paymentStatus,
        contactMethod: updateForm.contactMethod,
        crew: {
          leadName:    updateForm.crewLeadName,
          phone:       updateForm.crewPhone,
          truckNumber: updateForm.crewTruck,
        }
      };
      const res = await adminAPI.updateBooking(selected._id, payload);
      setBookings(prev => prev.map(b => b._id === selected._id ? res.data.booking : b));
      setSelected(null);
      toast.success('Booking updated successfully');
    } catch { toast.error('Update failed'); }
    finally { setUpdating(false); }
  };

  return (
    <div>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageTitle}>Bookings</div>
          <div className={styles.pageSub}>{total} total · {pendingCount} pending approval</div>
        </div>
      </div>

      {/* Pending alert banner */}
      {pendingCount > 0 && tab !== 'pending' && (
        <div style={{ background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:12, padding:'12px 18px', marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, fontSize:14, color:'#92400E', fontWeight:500 }}>
            <Icon name="alertCircle" size={16} color="#D97706" strokeWidth={2} />
            {pendingCount} booking{pendingCount > 1 ? 's' : ''} waiting for your approval
          </div>
          <button onClick={() => { setTab('pending'); setStatusFilter(''); }} style={{ fontSize:13, fontWeight:600, color:'#D97706', background:'transparent', border:'1px solid #FCD34D', borderRadius:8, padding:'5px 14px', cursor:'pointer', fontFamily:'var(--font-sans)' }}>
            Review Now
          </button>
        </div>
      )}

      {/* Tab bar */}
      <div style={{ display:'flex', gap:4, marginBottom:16, background:'#fff', border:'1px solid var(--border)', borderRadius:10, padding:4, width:'fit-content' }}>
        {[['all','All Bookings'],['pending','Pending Approval']].map(([t,l]) => (
          <button key={t} onClick={() => { setTab(t); setStatusFilter(''); setPage(1); }}
            style={{ padding:'7px 18px', borderRadius:8, border:'none', fontSize:13, fontWeight:t===tab?700:400, background:t===tab?'var(--blue)':'transparent', color:t===tab?'#fff':'var(--text-muted)', cursor:'pointer', fontFamily:'var(--font-sans)', display:'flex', alignItems:'center', gap:7 }}>
            {l}
            {t==='pending' && pendingCount>0 && <span style={{ background:t===tab?'rgba(255,255,255,0.25)':'#F97316', color:'#fff', borderRadius:50, padding:'1px 7px', fontSize:11, fontWeight:700 }}>{pendingCount}</span>}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className={styles.table}>
        <div className={styles.filterRow}>
          <input className={styles.searchInput} placeholder="Search by ref, name or email..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          {tab === 'all' && (
            <select className={styles.selectFilter} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_META[s]?.label || s}</option>)}
            </select>
          )}
        </div>

        <div className={styles.tableInner}>
          {loading ? (
            <div style={{ padding:40, textAlign:'center', color:'var(--text-muted)' }}>Loading...</div>
          ) : bookings.length === 0 ? (
            <div style={{ padding:48, textAlign:'center', color:'var(--text-muted)' }}>
              <Icon name="calendar" size={32} color="#D1D5DB" strokeWidth={1} />
              <div style={{ marginTop:12, fontSize:14 }}>{tab === 'pending' ? 'No pending bookings — all caught up!' : 'No bookings found'}</div>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Customer</th>
                  <th>Route</th>
                  <th>Move Date</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => {
                  const meta = STATUS_META[b.status] || STATUS_META.confirmed;
                  const isPending = b.status === 'pending_approval';
                  return (
                    <tr key={b._id} style={{ background: isPending ? '#FFFBEB' : '' }}>
                      <td>
                        <div style={{ fontFamily:'var(--font-display)', fontWeight:700, color:'var(--blue)', fontSize:13 }}>{b.referenceNumber}</div>
                        <div style={{ fontSize:11, color:'var(--text-hint)', marginTop:2 }}>{new Date(b.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight:500, fontSize:13 }}>{b.customer?.name}</div>
                        <div style={{ fontSize:12, color:'var(--text-muted)' }}>{b.customer?.email}</div>
                        {b.customer?.phone && <div style={{ fontSize:12, color:'var(--text-hint)' }}>{b.customer?.phone}</div>}
                      </td>
                      <td style={{ fontSize:12, color:'var(--text-muted)' }}>
                        <div>{b.origin?.city || b.origin?.zip || '—'}, {b.origin?.state}</div>
                        <div style={{ color:'var(--text-hint)' }}>→ {b.destination?.city || b.destination?.zip || '—'}, {b.destination?.state}</div>
                        {b.pricing?.estimatedMiles && <div style={{ color:'var(--text-hint)', fontSize:11 }}>{b.pricing.estimatedMiles} mi · {b.pricing.truckSize || ''}</div>}
                      </td>
                      <td style={{ fontSize:13 }}>{b.moveDate ? new Date(b.moveDate).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '—'}</td>
                      <td style={{ fontWeight:600, fontSize:14, color:'var(--blue)' }}>{b.pricing?.total ? `$${b.pricing.total.toLocaleString()}` : '—'}</td>
                      <td>
                        <span className={`badge badge-${meta.color}`} style={{ display:'inline-flex', alignItems:'center', gap:5 }}>
                          <Icon name={meta.icon} size={11} strokeWidth={2} />
                          {meta.label}
                        </span>
                      </td>
                      <td>
                        <div style={{ display:'flex', gap:6 }}>
                          {isPending && (
                            <button onClick={() => quickApprove(b)}
                              style={{ fontSize:12, padding:'5px 12px', borderRadius:7, border:'none', background:'#2563EB', color:'#fff', cursor:'pointer', fontFamily:'var(--font-sans)', fontWeight:600, display:'flex', alignItems:'center', gap:5 }}>
                              <Icon name="check" size={12} color="#fff" strokeWidth={3} /> Approve
                            </button>
                          )}
                          <button onClick={() => openDetail(b)}
                            style={{ fontSize:12, padding:'5px 12px', borderRadius:7, border:'1px solid var(--border-mid)', background:'transparent', cursor:'pointer', fontFamily:'var(--font-sans)' }}>
                            Manage
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div style={{ padding:'14px 20px', display:'flex', gap:6, justifyContent:'center', borderTop:'1px solid var(--border)' }}>
            {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                style={{ width:32, height:32, borderRadius:8, border:'1px solid var(--border-mid)', background:p===page?'var(--blue)':'transparent', color:p===page?'#fff':'var(--text)', cursor:'pointer', fontSize:13, fontFamily:'var(--font-sans)' }}>{p}</button>
            ))}
          </div>
        )}
      </div>

      {/* Detail / Edit Modal */}
      {selected && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }} onClick={e => e.target===e.currentTarget&&setSelected(null)}>
          <div style={{ background:'#fff', borderRadius:20, padding:32, maxWidth:600, width:'100%', maxHeight:'90vh', overflowY:'auto', boxShadow:'0 32px 80px rgba(0,0,0,0.25)' }}>

            {/* Modal header */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
              <div>
                <div style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:800, color:'var(--blue)' }}>{selected.referenceNumber}</div>
                <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:2 }}>{selected.customer?.name} · {selected.customer?.email} · {selected.customer?.phone}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background:'var(--bg-light)', border:'none', borderRadius:8, width:32, height:32, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon name="close" size={16} color="var(--text-muted)" strokeWidth={2} />
              </button>
            </div>

            {/* Move summary */}
            <div style={{ background:'var(--bg-light)', borderRadius:12, padding:'14px 16px', marginBottom:20, fontSize:13 }}>
              <div style={{ display:'flex', gap:24, flexWrap:'wrap' }}>
                <div><div style={{ fontSize:11, fontWeight:700, color:'var(--text-hint)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:3 }}>From</div><div style={{ fontWeight:600 }}>{selected.origin?.address || `${selected.origin?.city || ''}, ${selected.origin?.state || ''} ${selected.origin?.zip || ''}`}</div></div>
                <div><div style={{ fontSize:11, fontWeight:700, color:'var(--text-hint)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:3 }}>To</div><div style={{ fontWeight:600 }}>{selected.destination?.address || `${selected.destination?.city || ''}, ${selected.destination?.state || ''} ${selected.destination?.zip || ''}`}</div></div>
                <div><div style={{ fontSize:11, fontWeight:700, color:'var(--text-hint)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:3 }}>Move Date</div><div style={{ fontWeight:600 }}>{selected.moveDate ? new Date(selected.moveDate).toLocaleDateString('en-US',{weekday:'short',month:'long',day:'numeric',year:'numeric'}) : '—'}</div></div>
                {selected.pricing?.total && <div><div style={{ fontSize:11, fontWeight:700, color:'var(--text-hint)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:3 }}>Total</div><div style={{ fontWeight:700, color:'var(--blue)', fontSize:16 }}>${selected.pricing.total.toLocaleString()}</div></div>}
              </div>
              {selected.items?.length > 0 && (
                <div style={{ marginTop:10, paddingTop:10, borderTop:'1px solid var(--border)' }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'var(--text-hint)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:5 }}>Items</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    {selected.items.map((item,i) => (
                      <span key={i} style={{ fontSize:12, background:'#fff', border:'1px solid var(--border)', borderRadius:6, padding:'2px 8px', color:'var(--text-mid)' }}>{item.label || item.id} ×{item.qty}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Contact method */}
            <div style={{ marginBottom:16 }}>
              <label style={{ display:'block', fontSize:13, fontWeight:600, color:'var(--text-mid)', marginBottom:8 }}>Contact Method Used</label>
              <div style={{ display:'flex', gap:8 }}>
                {[['call','Phone Call'],['email','Email'],['whatsapp','WhatsApp'],['none','Not Yet']].map(([v,l]) => (
                  <label key={v} style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, cursor:'pointer', padding:'6px 12px', border:`1px solid ${updateForm.contactMethod===v?'var(--blue)':'var(--border-mid)'}`, borderRadius:8, background:updateForm.contactMethod===v?'var(--blue-light)':'transparent', color:updateForm.contactMethod===v?'var(--blue)':'var(--text-muted)', fontWeight:updateForm.contactMethod===v?600:400 }}>
                    <input type="radio" name="contactMethod" value={v} checked={updateForm.contactMethod===v} onChange={() => setUpdateForm(f=>({...f, contactMethod:v}))} style={{ display:'none' }} />
                    {l}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:16 }}>
              {/* Status */}
              <div>
                <label className="label">Update Status</label>
                <select className="input-field" value={updateForm.status} onChange={e => handleStatusChange(e.target.value)}>
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_META[s]?.label || s}</option>)}
                </select>
              </div>
              {/* Payment */}
              <div>
                <label className="label">Payment Status</label>
                <select className="input-field" value={updateForm.paymentStatus} onChange={e => setUpdateForm(f=>({...f, paymentStatus:e.target.value}))}>
                  <option value="pending">Pending</option>
                  <option value="deposit_paid">Deposit Paid</option>
                  <option value="fully_paid">Fully Paid</option>
                </select>
              </div>
            </div>

            {/* Customer message */}
            <div style={{ marginBottom:14 }}>
              <label className="label">Message to Customer <span style={{ fontWeight:400, color:'var(--text-hint)' }}>(visible in tracking)</span></label>
              <textarea className="input-field" rows={2} value={updateForm.message} onChange={e => setUpdateForm(f=>({...f, message:e.target.value}))} style={{ resize:'vertical' }} />
            </div>

            {/* Location */}
            <div style={{ marginBottom:14 }}>
              <label className="label">Current Location <span style={{ fontWeight:400, color:'var(--text-hint)' }}>(optional)</span></label>
              <input className="input-field" value={updateForm.location} onChange={e => setUpdateForm(f=>({...f, location:e.target.value}))} placeholder="e.g. I-80, Nevada" />
            </div>

            {/* Crew */}
            <div style={{ marginBottom:14 }}>
              <label className="label">Assign Crew</label>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
                <input className="input-field" placeholder="Lead name" value={updateForm.crewLeadName} onChange={e => setUpdateForm(f=>({...f, crewLeadName:e.target.value}))} />
                <input className="input-field" placeholder="Phone" value={updateForm.crewPhone} onChange={e => setUpdateForm(f=>({...f, crewPhone:e.target.value}))} />
                <input className="input-field" placeholder="Truck #" value={updateForm.crewTruck} onChange={e => setUpdateForm(f=>({...f, crewTruck:e.target.value}))} />
              </div>
            </div>

            {/* Admin notes */}
            <div style={{ marginBottom:24 }}>
              <label className="label">Internal Admin Notes <span style={{ fontWeight:400, color:'var(--text-hint)' }}>(not shown to customer)</span></label>
              <textarea className="input-field" rows={2} value={updateForm.adminNotes} onChange={e => setUpdateForm(f=>({...f, adminNotes:e.target.value}))} placeholder="Notes for internal use only..." style={{ resize:'vertical' }} />
            </div>

            {/* Tracking history */}
            {selected.trackingHistory?.length > 0 && (
              <div style={{ marginBottom:24, background:'var(--bg-light)', borderRadius:12, padding:'14px 16px' }}>
                <div style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:12 }}>Tracking History</div>
                {[...selected.trackingHistory].reverse().map((t,i) => (
                  <div key={i} style={{ display:'flex', gap:10, marginBottom:10, fontSize:13 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--blue)', marginTop:5, flexShrink:0 }} />
                    <div>
                      <div style={{ fontWeight:600, color:'var(--text)', textTransform:'capitalize' }}>{STATUS_META[t.status]?.label || t.status}</div>
                      {t.message && <div style={{ color:'var(--text-muted)' }}>{t.message}</div>}
                      <div style={{ fontSize:11, color:'var(--text-hint)' }}>{new Date(t.timestamp).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={() => setSelected(null)} className="btn-outline">Cancel</button>
              <button onClick={submitUpdate} className="btn-primary" disabled={updating}>
                {updating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
