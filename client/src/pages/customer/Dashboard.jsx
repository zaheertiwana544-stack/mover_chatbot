// Dashboard.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bookingsAPI, quotesAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import styles from './Dashboard.module.css';

const STATUS_COLORS = { confirmed:'blue', crew_assigned:'purple', packing:'orange', loading:'orange', in_transit:'green', delivered:'green', cancelled:'red' };
const STATUS_LABELS = { confirmed:'Confirmed', crew_assigned:'Crew Assigned', packing:'Packing', loading:'Loading', in_transit:'In Transit', delivered:'Delivered ✓', cancelled:'Cancelled' };

export default function Dashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [tab, setTab] = useState('bookings');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([bookingsAPI.getMy(), quotesAPI.getMy()])
      .then(([b, q]) => { setBookings(b.data.bookings); setQuotes(q.data.quotes); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.header}>
          <div><h1>My Moves</h1><p>Welcome back, {user?.name?.split(' ')[0]}!</p></div>
          <div style={{display:'flex',gap:10}}>
            <Link to="/quote" className="btn-outline">New Quote</Link>
            <Link to="/book" className="btn-primary">Book a Move</Link>
          </div>
        </div>
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab==='bookings'?styles.active:''}`} onClick={()=>setTab('bookings')}>Bookings ({bookings.length})</button>
          <button className={`${styles.tab} ${tab==='quotes'?styles.active:''}`} onClick={()=>setTab('quotes')}>Quotes ({quotes.length})</button>
        </div>
        {loading ? <div className={styles.empty}>Loading...</div> : (
          tab==='bookings' ? (
            bookings.length === 0 ? (
              <div className={styles.empty}><div style={{fontSize:48,marginBottom:12}}>🚛</div><h3>No bookings yet</h3><p>Ready to move?</p><Link to="/quote" className="btn-primary" style={{marginTop:16,display:'inline-flex'}}>Get a Quote</Link></div>
            ) : bookings.map(b => (
              <div key={b._id} className={styles.bookingCard}>
                <div className={styles.bookingTop}>
                  <div>
                    <div className={styles.refNum}>{b.referenceNumber}</div>
                    <div className={styles.route}>{b.origin.city}, {b.origin.state} → {b.destination.city}, {b.destination.state}</div>
                    <div className={styles.date}>{new Date(b.moveDate).toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <span className={`badge badge-${STATUS_COLORS[b.status]||'gray'}`}>{STATUS_LABELS[b.status]||b.status}</span>
                    {b.pricing?.total && <div className={styles.total}>${b.pricing.total.toLocaleString()}</div>}
                  </div>
                </div>
                <div className={styles.bookingActions}>
                  <Link to={`/track?ref=${b.referenceNumber}`} className="btn-outline" style={{fontSize:13,padding:'7px 16px'}}>📍 Track Move</Link>
                </div>
              </div>
            ))
          ) : (
            quotes.length === 0 ? <div className={styles.empty}><h3>No quotes yet</h3><Link to="/quote" className="btn-primary" style={{marginTop:16,display:'inline-flex'}}>Get a Quote</Link></div> :
            quotes.map(q => (
              <div key={q._id} className={styles.bookingCard}>
                <div className={styles.bookingTop}>
                  <div>
                    <div className={styles.route}>{q.origin.city}, {q.origin.state} → {q.destination.city}, {q.destination.state}</div>
                    <div className={styles.date}>{q.homeSize?.toUpperCase()} · {new Date(q.moveDate).toLocaleDateString()}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <span className={`badge badge-${q.status==='accepted'?'green':q.status==='expired'?'red':'blue'}`}>{q.status}</span>
                    {q.pricing?.total && <div className={styles.total}>${q.pricing.total.toLocaleString()}</div>}
                  </div>
                </div>
                {q.status==='pending'&&<Link to="/book" state={{quote:q}} className="btn-primary" style={{fontSize:13,padding:'7px 16px',marginTop:12,display:'inline-flex'}}>Book This Move</Link>}
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
}
