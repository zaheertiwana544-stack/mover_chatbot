import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { trackingAPI } from '../../services/api';
import { Icon } from '../../components/ui/Icons';
import toast from 'react-hot-toast';
import styles from './TrackPage.module.css';

const STATUS_ORDER = ['pending_approval', 'confirmed', 'crew_assigned', 'packing', 'loading', 'in_transit', 'delivered'];

const STATUS_META = {
  pending_approval: { label: 'Awaiting Confirmation', icon: 'clock',       color: '#D97706', bg: '#FFFBEB' },
  confirmed:     { label: 'Confirmed',      icon: 'checkCircle', color: '#2563EB', bg: '#EFF6FF' },
  crew_assigned: { label: 'Crew Assigned',  icon: 'users',       color: '#7C3AED', bg: '#F5F3FF' },
  packing:       { label: 'Packing',        icon: 'box',         color: '#D97706', bg: '#FFFBEB' },
  loading:       { label: 'Loading',        icon: 'package',     color: '#EA580C', bg: '#FFF7ED' },
  in_transit:    { label: 'In Transit',     icon: 'truck',       color: '#059669', bg: '#F0FDF4' },
  delivered:     { label: 'Delivered',      icon: 'home',        color: '#15803D', bg: '#F0FDF4' },
  cancelled:     { label: 'Cancelled',      icon: 'alertCircle', color: '#DC2626', bg: '#FEF2F2' },
};

function StepBar({ currentStatus }) {
  const currentIdx = STATUS_ORDER.indexOf(currentStatus);
  return (
    <div className={styles.stepBar}>
      {STATUS_ORDER.map((s, i) => {
        const meta = STATUS_META[s];
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <div key={s} className={styles.stepItem}>
            <div className={styles.stepConnectorRow}>
              {i > 0 && <div className={`${styles.stepLine} ${done || active ? styles.stepLineDone : ''}`} />}
              <div
                className={`${styles.stepDot} ${done ? styles.stepDone : active ? styles.stepActive : styles.stepPending}`}
                style={active ? { background: meta.color, borderColor: meta.color } : done ? { background: meta.color, borderColor: meta.color } : {}}
              >
                {done
                  ? <Icon name="check" size={11} color="#fff" strokeWidth={3} />
                  : <Icon name={meta.icon} size={12} color={active ? '#fff' : '#9CA3AF'} strokeWidth={1.5} />
                }
              </div>
              {i < STATUS_ORDER.length - 1 && <div className={`${styles.stepLine} ${done ? styles.stepLineDone : ''}`} />}
            </div>
            <div className={`${styles.stepLabel} ${active ? styles.stepLabelActive : done ? styles.stepLabelDone : ''}`}>
              {meta.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Timeline({ history }) {
  const reversed = [...history].reverse();
  return (
    <div className={styles.timeline}>
      {reversed.map((t, i) => {
        const meta = STATUS_META[t.status] || STATUS_META.confirmed;
        const isFirst = i === 0;
        return (
          <div key={i} className={styles.timelineItem}>
            <div className={styles.timelineLeft}>
              <div className={styles.timelineIconWrap} style={{ background: isFirst ? meta.bg : '#F3F4F6', borderColor: isFirst ? meta.color + '40' : '#E5E7EB' }}>
                <Icon name={meta.icon} size={14} color={isFirst ? meta.color : '#9CA3AF'} strokeWidth={1.5} />
              </div>
              {i < reversed.length - 1 && <div className={styles.timelineConnector} />}
            </div>
            <div className={styles.timelineBody}>
              <div className={styles.timelineStatus} style={{ color: isFirst ? meta.color : '#374151' }}>
                {meta.label}
              </div>
              {t.message && <div className={styles.timelineMsg}>{t.message}</div>}
              {t.location && (
                <div className={styles.timelineLoc}>
                  <Icon name="mapPin" size={11} color="#9CA3AF" strokeWidth={1.5} />
                  {t.location}
                </div>
              )}
              <div className={styles.timelineTime}>
                {new Date(t.timestamp).toLocaleString('en-US', {
                  weekday: 'short', month: 'short', day: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function TrackPage() {
  const [params] = useSearchParams();
  const [ref, setRef] = useState(params.get('ref') || '');
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (params.get('ref')) doTrack(params.get('ref'));
  }, []);

  const doTrack = async (overrideRef) => {
    const searchRef = (overrideRef || ref).trim().toUpperCase();
    if (!searchRef) return;
    setLoading(true);
    try {
      const res = await trackingAPI.track(searchRef);
      setTracking(res.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'No booking found with that reference number.');
      setTracking(null);
    } finally { setLoading(false); }
  };

  const handleSubmit = (e) => { e.preventDefault(); doTrack(); };

  const meta = tracking ? (STATUS_META[tracking.status] || STATUS_META.confirmed) : null;

  return (
    <div className={styles.page}>
      <div className={styles.pageInner}>

        {/* Header */}
        <div className={styles.pageHeader}>
          <h1 className={styles.title}>Track Your Move</h1>
          <p className={styles.sub}>Enter your booking reference number for real-time status updates.</p>
        </div>

        {/* Search */}
        <div className={styles.searchCard}>
          <form onSubmit={handleSubmit} className={styles.searchForm}>
            <div className={styles.searchInputWrap}>
              <Icon name="search" size={16} color="#9CA3AF" strokeWidth={1.5} className={styles.searchIcon} />
              <input
                className={styles.searchInput}
                value={ref}
                onChange={e => setRef(e.target.value.toUpperCase())}
                placeholder="e.g. MV-ABC12345"
                required
                autoFocus
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '10px 24px', whiteSpace: 'nowrap' }}>
              {loading
                ? <><Icon name="clock" size={14} /> Searching...</>
                : <><Icon name="search" size={14} /> Track Move</>
              }
            </button>
          </form>
          <p className={styles.searchHint}>
            Your reference number was emailed when you booked. Format: MV-XXXXXXXX
          </p>
        </div>

        {/* Results */}
        {tracking && (
          <div className={styles.results}>

            {/* Status Banner */}
            <div className={styles.statusBanner} style={{ borderColor: meta.color + '30', background: meta.bg }}>
              <div className={styles.statusBannerLeft}>
                <div className={styles.statusIconWrap} style={{ background: meta.color }}>
                  <Icon name={meta.icon} size={20} color="#fff" strokeWidth={1.5} />
                </div>
                <div>
                  <div className={styles.statusRef}>Booking {tracking.referenceNumber}</div>
                  <div className={styles.statusLabel} style={{ color: meta.color }}>{meta.label}</div>
                </div>
              </div>
              <div className={styles.statusRoute}>
                <div className={styles.statusRouteItem}>
                  <Icon name="mapPin" size={13} color="#6B7280" strokeWidth={1.5} />
                  <span>{tracking.origin?.city}, {tracking.origin?.state}</span>
                </div>
                <Icon name="arrowRight" size={14} color="#9CA3AF" strokeWidth={1.5} />
                <div className={styles.statusRouteItem}>
                  <Icon name="mapPin" size={13} color={meta.color} strokeWidth={2} />
                  <span style={{ fontWeight: 600 }}>{tracking.destination?.city}, {tracking.destination?.state}</span>
                </div>
              </div>
            </div>

            {/* Crew info */}
            {tracking.crew?.leadName && (
              <div className={styles.crewCard}>
                <Icon name="users" size={15} color="#2563EB" strokeWidth={1.5} />
                <div>
                  <div className={styles.crewLabel}>Your Crew Lead</div>
                  <div className={styles.crewName}>{tracking.crew.leadName}</div>
                </div>
                {tracking.crew.phone && (
                  <a href={`tel:${tracking.crew.phone}`} className={styles.crewPhone}>
                    <Icon name="phone" size={13} color="#2563EB" strokeWidth={1.5} />
                    {tracking.crew.phone}
                  </a>
                )}
                {tracking.crew.truckNumber && (
                  <div className={styles.crewTruck}>
                    <Icon name="truck" size={13} color="#6B7280" strokeWidth={1.5} />
                    Truck #{tracking.crew.truckNumber}
                  </div>
                )}
              </div>
            )}

            {/* Progress stepper */}
            {tracking.status !== 'cancelled' && (
              <div className={styles.section}>
                <div className={styles.sectionTitle}>Progress</div>
                <StepBar currentStatus={tracking.status} />
              </div>
            )}

            {/* Move date */}
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <Icon name="calendar" size={14} color="#6B7280" strokeWidth={1.5} />
                <div>
                  <div className={styles.infoLabel}>Move Date</div>
                  <div className={styles.infoValue}>
                    {new Date(tracking.moveDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>
              </div>
              <div className={styles.infoItem}>
                <Icon name="user" size={14} color="#6B7280" strokeWidth={1.5} />
                <div>
                  <div className={styles.infoLabel}>Customer</div>
                  <div className={styles.infoValue}>{tracking.customer?.name}</div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            {tracking.trackingHistory?.length > 0 && (
              <div className={styles.section}>
                <div className={styles.sectionTitle}>Activity Timeline</div>
                <Timeline history={tracking.trackingHistory} />
              </div>
            )}

            {/* CTA */}
            <div className={styles.trackCta}>
              <Link to="/quote" className="btn-outline" style={{ fontSize: 13 }}>
                <Icon name="fileText" size={14} />
                Get Another Quote
              </Link>
              <button onClick={() => { setTracking(null); setRef(''); }} className="btn-ghost" style={{ fontSize: 13 }}>
                Track a Different Move
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!tracking && !loading && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <Icon name="truck" size={32} color="#D1D5DB" strokeWidth={1} />
            </div>
            <div className={styles.emptyTitle}>No move loaded yet</div>
            <div className={styles.emptySub}>Enter your reference number above to see live updates</div>
          </div>
        )}

      </div>
    </div>
  );
}
