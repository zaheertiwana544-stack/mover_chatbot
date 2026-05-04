import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import styles from './Admin.module.css';

const STATUS_COLORS = { pending: 'blue', sent: 'gray', accepted: 'green', rejected: 'red', expired: 'gray' };

export default function AdminQuotes() {
  const [quotes, setQuotes] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminAPI.getQuotes({ page, limit: 15 })
      .then(res => { setQuotes(res.data.quotes); setTotal(res.data.total); setPages(res.data.pages); })
      .catch(() => toast.error('Failed to load quotes'))
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageTitle}>Quotes</div>
          <div className={styles.pageSub}>{total} quotes generated</div>
        </div>
      </div>

      <div className={styles.table}>
        <div className={styles.tableInner}>
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#6B7280' }}>Loading...</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Contact</th>
                  <th>Route</th>
                  <th>Home Size</th>
                  <th>Move Date</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {quotes.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#6B7280' }}>No quotes yet</td></tr>
                ) : quotes.map(q => (
                  <tr key={q._id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{q.name}</div>
                      <div style={{ fontSize: 12, color: '#6B7280' }}>{q.email}</div>
                      {q.phone && <div style={{ fontSize: 12, color: '#6B7280' }}>{q.phone}</div>}
                    </td>
                    <td style={{ fontSize: 12 }}>{q.origin?.city}, {q.origin?.state} → {q.destination?.city}, {q.destination?.state}</td>
                    <td><span style={{ textTransform: 'uppercase', fontSize: 12, fontWeight: 600 }}>{q.homeSize}</span></td>
                    <td style={{ fontSize: 12 }}>{q.moveDate ? new Date(q.moveDate).toLocaleDateString() : '—'}</td>
                    <td style={{ fontWeight: 600, color: '#2563EB' }}>${q.pricing?.total?.toLocaleString() || '—'}</td>
                    <td><span className={`badge badge-${STATUS_COLORS[q.status] || 'gray'}`}>{q.status}</span></td>
                    <td style={{ fontSize: 12, color: '#6B7280' }}>{new Date(q.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {pages > 1 && (
          <div style={{ padding: '14px 20px', display: 'flex', gap: 8, justifyContent: 'center', borderTop: '0.5px solid rgba(17,24,39,0.08)' }}>
            {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} style={{ width: 32, height: 32, borderRadius: 8, border: '0.5px solid rgba(17,24,39,0.18)', background: p === page ? '#2563EB' : 'transparent', color: p === page ? '#fff' : '#374151', cursor: 'pointer', fontSize: 13, fontFamily: 'DM Sans, sans-serif' }}>{p}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
