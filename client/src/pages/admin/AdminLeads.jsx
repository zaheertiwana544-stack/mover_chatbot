import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import styles from './Admin.module.css';

const INTENT_COLORS = { quote: 'blue', booking: 'green', tracking: 'orange', general: 'gray' };

export default function AdminLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    adminAPI.getLeads()
      .then(res => setLeads(res.data.leads))
      .catch(() => toast.error('Failed to load leads'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageTitle}>Chat Leads</div>
          <div className={styles.pageSub}>{leads.length} leads captured from AI chat</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: 20 }}>
        <div className={styles.table}>
          <div className={styles.tableInner}>
            {loading ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#6B7280' }}>Loading...</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Contact</th>
                    <th>Intent</th>
                    <th>Messages</th>
                    <th>Converted</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {leads.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#6B7280' }}>No leads yet. Chat conversations will appear here once users interact with the AI agent.</td></tr>
                  ) : leads.map(l => (
                    <tr key={l._id} style={{ cursor: 'pointer' }} onClick={() => setSelected(l)}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{l.leadData?.name || 'Anonymous'}</div>
                        <div style={{ fontSize: 12, color: '#6B7280' }}>{l.leadData?.email || '—'}</div>
                        {l.leadData?.phone && <div style={{ fontSize: 12, color: '#6B7280' }}>{l.leadData.phone}</div>}
                      </td>
                      <td>{l.leadData?.intent ? <span className={`badge badge-${INTENT_COLORS[l.leadData.intent] || 'gray'}`}>{l.leadData.intent}</span> : '—'}</td>
                      <td style={{ fontSize: 13 }}>{l.messages?.length || 0} msgs</td>
                      <td><span className={`badge badge-${l.convertedToBooking ? 'green' : 'gray'}`}>{l.convertedToBooking ? 'Yes' : 'No'}</span></td>
                      <td style={{ fontSize: 12, color: '#6B7280' }}>{new Date(l.createdAt).toLocaleDateString()}</td>
                      <td><button style={{ fontSize: 12, padding: '4px 10px', borderRadius: 8, border: '0.5px solid rgba(17,24,39,0.18)', background: 'transparent', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {selected && (
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <div className={styles.tableTitle}>Chat Transcript</div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: 18 }}>✕</button>
            </div>
            <div style={{ padding: '14px', maxHeight: 520, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, background: '#FAFAFA' }}>
              {selected.messages?.map((m, i) => (
                <div key={i} style={{ maxWidth: '85%', alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    padding: '8px 13px',
                    borderRadius: 12,
                    fontSize: 13,
                    lineHeight: 1.5,
                    background: m.role === 'user' ? '#2563EB' : '#fff',
                    color: m.role === 'user' ? '#fff' : '#111827',
                    border: m.role === 'assistant' ? '0.5px solid #E5E7EB' : 'none',
                    borderBottomRightRadius: m.role === 'user' ? 4 : 12,
                    borderBottomLeftRadius: m.role === 'assistant' ? 4 : 12,
                  }}>
                    {m.content}
                  </div>
                  <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 3, textAlign: m.role === 'user' ? 'right' : 'left' }}>
                    {m.role === 'user' ? 'Customer' : 'AI'} · {m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
