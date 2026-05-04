import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { bookingsAPI } from '../../services/api';
import { Icon } from '../../components/ui/Icons';
import toast from 'react-hot-toast';
import styles from './FormPage.module.css';

export default function BookingPage() {
  const location      = useLocation();
  const existingQuote = location.state?.quote;

  const [form, setForm] = useState({
    name:     '',
    email:    '',
    phone:    '',
    originAddress:      '',
    destinationAddress: '',
    moveDate: existingQuote?.moveDate?.split('T')[0] || ''
  });
  const [booking, setBooking]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Build origin/destination from quote data + addresses user typed
      const origin = {
        address: form.originAddress,
        zip:     existingQuote?.origin?.zip  || '',
        city:    existingQuote?.origin?.city || '',
        state:   existingQuote?.origin?.state || '',
      };
      const destination = {
        address: form.destinationAddress,
        zip:     existingQuote?.destination?.zip  || '',
        city:    existingQuote?.destination?.city || '',
        state:   existingQuote?.destination?.state || '',
      };

      const payload = {
        customer:    { name: form.name, email: form.email, phone: form.phone },
        origin,
        destination,
        moveDate:    form.moveDate,
        items:       existingQuote?.items    || [],
        services:    existingQuote?.services || [],
        pricing:     existingQuote?.pricing  || {},
        quoteId:     existingQuote?._id      || null,
      };

      const res = await bookingsAPI.create(payload);
      setBooking(res.data.booking);
      toast.success('Move booked successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Booking failed. Please try again.');
    } finally { setLoading(false); }
  };

  if (booking) return (
    <div className={styles.page}>
      <div className={styles.resultCard}>
        <div className={styles.resultHeader}>
          <div style={{ marginBottom: 12 }}>
            <Icon name="checkCircle" size={48} color="#15803D" strokeWidth={1} />
          </div>
          <h2>Move Confirmed!</h2>
          <p style={{ fontSize: 14, color: '#6B7280', marginTop: 6 }}>Your reference number</p>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: '#2563EB', margin: '10px 0', letterSpacing: '-0.02em' }}>
            {booking.referenceNumber}
          </div>
          <p style={{ fontSize: 13, color: '#9CA3AF' }}>Save this to track your move</p>
        </div>

        {existingQuote?.pricing?.total && (
          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '12px 16px', fontSize: 14, color: '#15803D', textAlign: 'center', margin: '16px 0', fontWeight: 500 }}>
            Estimated total: ${existingQuote.pricing.total.toLocaleString()}
          </div>
        )}

        <div className={styles.resultActions}>
          <Link to={`/track?ref=${booking.referenceNumber}`} className="btn-primary">
            <Icon name="mapPin" size={15} />
            Track My Move
          </Link>
          <Link to="/" className="btn-outline">Back to Home</Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className={styles.page}>
      <div className={styles.formWrap}>
        <div className={styles.formHeader}>
          <h1>Book Your Move</h1>
          <p>Confirm your details and lock in your moving date.</p>
          {existingQuote?.pricing?.total && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: '#EFF6FF', borderRadius: 10, fontSize: 13, color: '#2563EB', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="checkCircle" size={14} color="#2563EB" strokeWidth={2} />
              Based on your quote — Estimated total: <strong>${existingQuote.pricing.total.toLocaleString()}</strong>
            </div>
          )}
        </div>

        <form onSubmit={submit} className={styles.form}>
          <div className={styles.section}>
            <h3>Your Information</h3>
            <div className={styles.grid2}>
              <div><label className="label">Full Name</label><input className="input-field" value={form.name} onChange={set('name')} required placeholder="John Smith" /></div>
              <div><label className="label">Phone</label><input className="input-field" value={form.phone} onChange={set('phone')} placeholder="+1 (555) 000-0000" /></div>
            </div>
            <div style={{ marginTop: 12 }}><label className="label">Email</label><input className="input-field" type="email" value={form.email} onChange={set('email')} required placeholder="john@email.com" /></div>
          </div>

          <div className={styles.section}>
            <h3>Addresses</h3>
            <div style={{ marginBottom: 14 }}>
              <label className="label">Full Pickup Address</label>
              <input className="input-field" value={form.originAddress} onChange={set('originAddress')} required placeholder="123 Main St, New York, NY 10001" />
              {existingQuote?.origin?.zip && <p style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>Zip from quote: {existingQuote.origin.zip}</p>}
            </div>
            <div>
              <label className="label">Full Delivery Address</label>
              <input className="input-field" value={form.destinationAddress} onChange={set('destinationAddress')} required placeholder="456 Oak Ave, Los Angeles, CA 90001" />
              {existingQuote?.destination?.zip && <p style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>Zip from quote: {existingQuote.destination.zip}</p>}
            </div>
          </div>

          <div className={styles.section}>
            <h3>Move Date</h3>
            <input className="input-field" type="date" value={form.moveDate} onChange={set('moveDate')} required min={new Date().toISOString().split('T')[0]} />
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15 }}>
            {loading
              ? <><Icon name="clock" size={16} /> Confirming...</>
              : <><Icon name="checkCircle" size={16} /> Confirm Booking</>
            }
          </button>
        </form>
      </div>
    </div>
  );
}
