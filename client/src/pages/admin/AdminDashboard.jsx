import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell, Legend
} from 'recharts';
import { adminAPI } from '../../services/api';
import { Icon } from '../../components/ui/Icons';
import styles from './AdminDashboard.module.css';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const STATUS_COLORS = {
  confirmed: '#2563EB', crew_assigned: '#7C3AED', packing: '#D97706',
  loading: '#EA580C', in_transit: '#059669', delivered: '#16A34A', cancelled: '#DC2626'
};
const STATUS_LABELS = {
  confirmed:'Confirmed', crew_assigned:'Crew Assigned', packing:'Packing',
  loading:'Loading', in_transit:'In Transit', delivered:'Delivered', cancelled:'Cancelled'
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:10, padding:'10px 14px', fontSize:13, boxShadow:'0 4px 16px rgba(0,0,0,0.08)' }}>
      <div style={{ fontWeight:700, marginBottom:6, color:'#111827' }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color, marginBottom:2 }}>
          {p.name}: <strong>{typeof p.value === 'number' && p.name.toLowerCase().includes('revenue') ? `$${p.value.toLocaleString()}` : p.value}</strong>
        </div>
      ))}
    </div>
  );
};

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    adminAPI.getStats()
      .then(r => setData(r.data))
      .catch(() => setError('Failed to load dashboard data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:400, color:'#6B7280', gap:10 }}>
      <Icon name="clock" size={18} color="#6B7280" /> Loading dashboard...
    </div>
  );
  if (error) return <div style={{ padding:40, color:'#DC2626' }}>{error}</div>;

  const bookingChartData = data.bookingsByMonth.map(m => ({
    month: MONTHS[(m._id - 1) % 12],
    Bookings: m.count,
    Revenue: Math.round(m.revenue)
  }));

  const pieData = data.statusBreakdown
    .filter(s => s._id)
    .map(s => ({ name: STATUS_LABELS[s._id] || s._id, value: s.count, color: STATUS_COLORS[s._id] || '#9CA3AF' }));

  const chatChartData = data.chatByDay.map(d => ({
    day: new Date(d._id).toLocaleDateString('en-US', { weekday:'short' }),
    Sessions: d.sessions,
    Messages: d.messages
  }));

  const topRoutes = data.topRoutes || [];
  const s = data.stats;

  const kpis = [
    { label: 'Total Revenue', value: `$${(s.totalRevenue||0).toLocaleString()}`, sub: 'All confirmed bookings', icon: 'dollarSign', color: '#2563EB', bg: '#EFF6FF' },
    { label: 'Active Moves', value: s.activeBookings, sub: 'Currently in progress', icon: 'truck', color: '#059669', bg: '#F0FDF4' },
    { label: 'Quote Conversion', value: `${s.conversionRate}%`, sub: 'Quotes → Bookings', icon: 'trendingUp', color: '#7C3AED', bg: '#F5F3FF' },
    { label: 'Chat Sessions', value: s.totalSessions, sub: `${s.recentSessions} this week`, icon: 'messageSquare', color: '#D97706', bg: '#FFFBEB' },
    { label: 'Total Bookings', value: s.totalBookings, sub: `${s.recentBookings} this month`, icon: 'calendar', color: '#0891B2', bg: '#ECFEFF' },
    { label: 'Total Quotes', value: s.totalQuotes, sub: `${s.recentQuotes} this month`, icon: 'fileText', color: '#EA580C', bg: '#FFF7ED' },
    { label: 'Customers', value: s.totalUsers, sub: 'Registered accounts', icon: 'users', color: '#374151', bg: '#F3F4F6' },
    { label: 'Avg Chat Length', value: `${s.avgMessagesPerSession}`, sub: 'Messages per session', icon: 'bot', color: '#BE185D', bg: '#FDF2F8' },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Analytics Dashboard</h1>
          <p className={styles.sub}>Live data from your AI agent and booking system</p>
        </div>
        <div className={styles.refreshBadge}>
          <Icon name="clock" size={13} color="#6B7280" />
          Live
        </div>
      </div>

      {/* KPI Grid */}
      <div className={styles.kpiGrid}>
        {kpis.map(k => (
          <div key={k.label} className={styles.kpiCard}>
            <div className={styles.kpiIcon} style={{ background: k.bg }}>
              <Icon name={k.icon} size={16} color={k.color} strokeWidth={1.5} />
            </div>
            <div className={styles.kpiValue}>{k.value}</div>
            <div className={styles.kpiLabel}>{k.label}</div>
            <div className={styles.kpiSub}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className={styles.chartsRow}>
        <div className={styles.chartCard} style={{ flex: 2 }}>
          <div className={styles.chartHeader}>
            <div className={styles.chartTitle}>Bookings & Revenue</div>
            <div className={styles.chartSub}>Last 6 months</div>
          </div>
          {bookingChartData.length === 0 ? (
            <div className={styles.empty}>No booking data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={bookingChartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize:12, fill:'#9AA3B2' }} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize:12, fill:'#9AA3B2' }} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize:12, fill:'#9AA3B2' }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar yAxisId="left" dataKey="Bookings" fill="#2563EB" radius={[4,4,0,0]} maxBarSize={32} />
                <Bar yAxisId="right" dataKey="Revenue" fill="#F97316" radius={[4,4,0,0]} maxBarSize={32} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className={styles.chartCard} style={{ flex: 1 }}>
          <div className={styles.chartHeader}>
            <div className={styles.chartTitle}>Move Status</div>
            <div className={styles.chartSub}>All bookings</div>
          </div>
          {pieData.length === 0 ? (
            <div className={styles.empty}>No data yet</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={2}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius:10, border:'1px solid #E5E7EB', fontSize:12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className={styles.pieLegend}>
                {pieData.map(d => (
                  <div key={d.name} className={styles.pieLegendItem}>
                    <span className={styles.pieDot} style={{ background: d.color }} />
                    <span>{d.name}</span>
                    <span className={styles.pieLegendVal}>{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Charts Row 2 — Agent analytics */}
      <div className={styles.chartsRow}>
        <div className={styles.chartCard} style={{ flex: 1 }}>
          <div className={styles.chartHeader}>
            <div className={styles.chartTitle}>
              <Icon name="messageSquare" size={14} color="#2563EB" />
              AI Agent Activity
            </div>
            <div className={styles.chartSub}>Chat sessions · last 7 days</div>
          </div>
          {chatChartData.length === 0 ? (
            <div className={styles.empty}>No chat data yet — start a conversation with the agent</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chatChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize:12, fill:'#9AA3B2' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize:12, fill:'#9AA3B2' }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="Sessions" stroke="#2563EB" strokeWidth={2} dot={{ r:4, fill:'#2563EB' }} activeDot={{ r:6 }} />
                <Line type="monotone" dataKey="Messages" stroke="#F97316" strokeWidth={2} dot={{ r:4, fill:'#F97316' }} activeDot={{ r:6 }} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className={styles.chartCard} style={{ flex: 1 }}>
          <div className={styles.chartHeader}>
            <div className={styles.chartTitle}>
              <Icon name="route" size={14} color="#2563EB" />
              Top Routes
            </div>
            <div className={styles.chartSub}>Most booked state-to-state moves</div>
          </div>
          {topRoutes.length === 0 ? (
            <div className={styles.empty}>No route data yet</div>
          ) : (
            <div className={styles.routeList}>
              {topRoutes.map((r, i) => {
                const maxCount = topRoutes[0].count;
                const pct = Math.round((r.count / maxCount) * 100);
                return (
                  <div key={i} className={styles.routeItem}>
                    <div className={styles.routeItemHeader}>
                      <span className={styles.routeRank}>#{i + 1}</span>
                      <span className={styles.routeName}>{r._id.from} → {r._id.to}</span>
                      <span className={styles.routeCount}>{r.count} moves</span>
                      <span className={styles.routeAvg}>${Math.round(r.avgRevenue || 0).toLocaleString()} avg</span>
                    </div>
                    <div className={styles.routeBar}>
                      <div className={styles.routeBarFill} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <div className={styles.chartTitle}>
            <Icon name="zap" size={14} color="#2563EB" />
            Recent Chat Sessions
          </div>
          <a href="/admin/leads" className={styles.viewAll}>View all <Icon name="arrowRight" size={12} /></a>
        </div>
        <ChatSessionsTable />
      </div>
    </div>
  );
}

function ChatSessionsTable() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getLeads()
      .then(r => setLeads(r.data.leads.slice(0, 8)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding:'20px', color:'#9AA3B2', fontSize:13 }}>Loading sessions...</div>;
  if (!leads.length) return <div style={{ padding:'20px', color:'#9AA3B2', fontSize:13 }}>No chat sessions yet. When users talk to the agent, their sessions will appear here.</div>;

  return (
    <div style={{ overflowX:'auto' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
        <thead>
          <tr>
            {['Session ID','Messages','Lead Name','Lead Email','Converted','Date'].map(h => (
              <th key={h} style={{ padding:'8px 16px', textAlign:'left', fontSize:11, fontWeight:700, color:'#9AA3B2', textTransform:'uppercase', letterSpacing:'0.05em', borderBottom:'1px solid #F3F4F6', background:'#FAFAFA' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {leads.map(l => (
            <tr key={l._id} style={{ borderBottom:'1px solid #F9FAFB' }}>
              <td style={{ padding:'10px 16px', color:'#6B7280', fontFamily:'monospace', fontSize:12 }}>{l.sessionId?.slice(0, 12)}...</td>
              <td style={{ padding:'10px 16px' }}>
                <span style={{ background:'#EFF6FF', color:'#2563EB', padding:'2px 8px', borderRadius:50, fontSize:12, fontWeight:600 }}>
                  {l.messages?.length || 0} msgs
                </span>
              </td>
              <td style={{ padding:'10px 16px', fontWeight:500 }}>{l.leadData?.name || <span style={{color:'#9AA3B2'}}>—</span>}</td>
              <td style={{ padding:'10px 16px', color:'#6B7280' }}>{l.leadData?.email || <span style={{color:'#9AA3B2'}}>—</span>}</td>
              <td style={{ padding:'10px 16px' }}>
                <span style={{ background: l.convertedToBooking ? '#F0FDF4' : '#F3F4F6', color: l.convertedToBooking ? '#15803D' : '#6B7280', padding:'2px 8px', borderRadius:50, fontSize:12, fontWeight:600 }}>
                  {l.convertedToBooking ? 'Yes' : 'No'}
                </span>
              </td>
              <td style={{ padding:'10px 16px', color:'#9AA3B2', fontSize:12 }}>{new Date(l.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
