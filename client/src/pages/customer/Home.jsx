import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../../components/ui/Icons';
import styles from './Home.module.css';

const services = [
  { icon: 'home', title: 'Residential Moving', desc: 'White-glove home relocation from studio apartments to estate properties, handled with care across all 50 states.' },
  { icon: 'building', title: 'Commercial Relocation', desc: 'End-to-end office and business moves. Planned, coordinated, and executed with minimal operational downtime.' },
  { icon: 'box', title: 'Professional Packing', desc: 'Expert packing and custom crating for every item — fragile, high-value, or oversized. All materials supplied.' },
  { icon: 'warehouse', title: 'Secure Storage', desc: 'Climate-controlled, GPS-monitored short and long-term storage facilities at 40+ locations nationwide.' },
  { icon: 'car', title: 'Vehicle Transport', desc: 'Door-to-door auto transport with open and enclosed carriers. Full insurance on every vehicle we move.' },
  { icon: 'globe', title: 'International Moving', desc: 'Customs clearance, freight forwarding, and global relocation logistics handled by certified specialists.' },
];

const steps = [
  { icon: 'messageSquare', num: '01', title: 'Request a Quote', desc: 'Chat with our AI agent or fill out the form. Get an itemized estimate in under 60 seconds, 24/7.' },
  { icon: 'calendar', num: '02', title: 'Confirm Your Date', desc: 'Review pricing, choose your move date, and lock in your dedicated crew — no phone calls needed.' },
  { icon: 'truck', num: '03', title: 'We Handle Everything', desc: 'Licensed crews arrive on time, pack and load with care, and keep you updated at every step.' },
  { icon: 'checkCircle', num: '04', title: 'Delivered & Settled', desc: 'Delivery confirmed, items placed, and your satisfaction verified before we close out the job.' },
];

const stats = [
  { value: '50,000+', label: 'Moves Completed' },
  { value: '50 States', label: 'Nationwide Coverage' },
  { value: '4.9 / 5.0', label: 'Customer Rating' },
  { value: '24 / 7', label: 'AI Support' },
];

const reviews = [
  { text: 'The quote was accurate to the dollar. The crew was professional, efficient, and handled our antiques with exceptional care. Not a single item damaged.', name: 'Jessica M.', role: 'VP Operations', route: 'New York, NY to Chicago, IL' },
  { text: 'We relocated our entire 40-person office over a weekend. MoveEasy coordinated everything — from IT equipment to furniture — with zero interruption to our Monday operations.', name: 'David R.', role: 'COO, TechScale Inc.', route: 'Houston, TX to Los Angeles, CA' },
  { text: 'I tracked every stage of my move in real time. Transparent pricing, professional crew, on-time delivery. This is what moving should feel like.', name: 'Sarah P.', role: 'Senior Director', route: 'Miami, FL to Atlanta, GA' },
];

const trustBadges = [
  { icon: 'shieldCheck', label: 'Licensed & Insured', sub: 'USDOT #1234567' },
  { icon: 'award', label: 'BBB Accredited', sub: 'A+ Rating' },
  { icon: 'users', label: '50K+ Moves', sub: 'Since 2010' },
  { icon: 'star', label: '4.9 Star Rated', sub: 'Google & Yelp' },
];

export default function Home() {
  const revealRefs = useRef([]);

  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add(styles.visible); });
    }, { threshold: 0.08 });
    revealRefs.current.forEach(el => el && obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const addRef = el => { if (el && !revealRefs.current.includes(el)) revealRefs.current.push(el); };

  return (
    <main>
      {/* ── HERO ── */}
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.heroContent}>
            <div className={styles.heroEyebrow}>
              <span className={styles.eyebrowDot} />
              Trusted by 50,000+ families across the USA
            </div>
            <h1 className={styles.heroTitle}>
              The Professional<br />
              <span className={styles.heroAccent}>Moving Standard</span><br />
              for America.
            </h1>
            <p className={styles.heroSub}>
              Residential, commercial, and international relocation services across all 50 states. Licensed, bonded, and fully insured.
            </p>
            <div className={styles.heroActions}>
              <Link to="/quote" className={`btn-primary ${styles.heroCta}`}>
                Get Instant Quote
                <Icon name="arrowRight" size={16} />
              </Link>
              <a href="#how" className="btn-outline">
                How It Works
              </a>
            </div>
            <div className={styles.trustRow}>
              {trustBadges.map(b => (
                <div key={b.label} className={styles.trustItem}>
                  <Icon name={b.icon} size={14} color="var(--blue)" strokeWidth={2} />
                  <span>{b.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.heroVisual}>
            <div className={styles.quoteCard}>
              <div className={styles.qcHeader}>
                <div className={styles.qcIconWrap}>
                  <Icon name="fileText" size={18} color="var(--blue)" />
                </div>
                <div>
                  <div className={styles.qcTitle}>Move Estimate</div>
                  <div className={styles.qcSub}>2-Bedroom · Cross-country</div>
                </div>
                <span className="badge badge-green" style={{ marginLeft: 'auto' }}>Ready</span>
              </div>
              <div className={styles.routeBlock}>
                <div className={styles.routeRow}>
                  <div className={styles.routeNodeBlue} />
                  <div>
                    <div className={styles.routeLabel}>Origin</div>
                    <div className={styles.routeCity}>New York, NY</div>
                  </div>
                </div>
                <div className={styles.routeTrack}>
                  <div className={styles.routeTrackLine} />
                  <Icon name="truck" size={14} color="var(--blue)" />
                  <div className={styles.routeTrackLine} />
                </div>
                <div className={styles.routeRow}>
                  <div className={styles.routeNodeOrange} />
                  <div>
                    <div className={styles.routeLabel}>Destination</div>
                    <div className={styles.routeCity}>Los Angeles, CA</div>
                  </div>
                </div>
              </div>
              <div className={styles.qcDivider} />
              <div className={styles.qcPriceRow}>
                {[['Base Rate', '$1,800'], ['Fuel', '$144'], ['Labor', '$270'], ['Insurance', '$90']].map(([l, v]) => (
                  <div key={l} className={styles.qcLineItem}>
                    <span className={styles.qcLineLabel}>{l}</span>
                    <span className={styles.qcLineVal}>{v}</span>
                  </div>
                ))}
                <div className={styles.qcTotal}>
                  <span>Total Estimate</span>
                  <span className={styles.qcTotalVal}>$2,304</span>
                </div>
              </div>
            </div>
            <div className={styles.heroFloatBadge}>
              <Icon name="shieldCheck" size={14} color="#15803D" strokeWidth={2} />
              <span>Quote valid 7 days · No card required</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <div className={styles.statsStrip}>
        <div className="container">
          <div className={styles.statsGrid}>
            {stats.map(s => (
              <div key={s.label} className={styles.statItem}>
                <div className={styles.statValue}>{s.value}</div>
                <div className={styles.statLabel}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SERVICES ── */}
      <section id="services" className={styles.services}>
        <div className="container">
          <div className={styles.sectionHead}>
            <div>
              <div className="section-eyebrow">
                <Icon name="layers" size={12} strokeWidth={2} />
                Services
              </div>
              <h2 className="section-title">Full-Spectrum Moving<br />Solutions</h2>
            </div>
            <p className="section-sub" style={{ maxWidth: 340 }}>From studio apartments to multinational corporate relocations — one trusted partner for every move.</p>
          </div>
          <div className={styles.servicesGrid}>
            {services.map((s, i) => (
              <div key={s.title} className={`${styles.serviceCard} ${styles.reveal}`} ref={addRef} style={{ transitionDelay: `${(i % 3) * 0.08}s` }}>
                <div className={styles.serviceIconWrap}>
                  <Icon name={s.icon} size={20} color="var(--blue)" strokeWidth={1.5} />
                </div>
                <h3 className={styles.serviceTitle}>{s.title}</h3>
                <p className={styles.serviceDesc}>{s.desc}</p>
                <div className={styles.serviceLink}>
                  <span>Learn more</span>
                  <Icon name="arrowRight" size={13} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className={styles.how}>
        <div className="container">
          <div className={styles.sectionHeadCenter}>
            <div className="section-eyebrow">
              <Icon name="route" size={12} strokeWidth={2} />
              Process
            </div>
            <h2 className="section-title">Four Steps to a<br />Stress-Free Move</h2>
            <p className="section-sub" style={{ margin: '0 auto' }}>Our AI-powered platform handles the complexity so you can focus on what matters.</p>
          </div>
          <div className={styles.stepsGrid}>
            {steps.map((s, i) => (
              <div key={s.num} className={`${styles.step} ${styles.reveal}`} ref={addRef} style={{ transitionDelay: `${i * 0.08}s` }}>
                <div className={styles.stepHeader}>
                  <div className={styles.stepIconWrap}>
                    <Icon name={s.icon} size={18} color="var(--blue)" strokeWidth={1.5} />
                  </div>
                  <span className={styles.stepNum}>{s.num}</span>
                </div>
                <h3 className={styles.stepTitle}>{s.title}</h3>
                <p className={styles.stepDesc}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REVIEWS ── */}
      <section className={styles.reviews}>
        <div className="container">
          <div className={styles.sectionHeadCenter}>
            <div className="section-eyebrow" style={{ color: '#93C5FD' }}>
              <Icon name="star" size={12} strokeWidth={2} color="#93C5FD" />
              Client Testimonials
            </div>
            <h2 className="section-title" style={{ color: '#fff' }}>Trusted by Families<br />and Enterprises Alike</h2>
          </div>
          <div className={styles.reviewsGrid}>
            {reviews.map((r, i) => (
              <div key={r.name} className={`${styles.reviewCard} ${styles.reveal}`} ref={addRef} style={{ transitionDelay: `${i * 0.08}s` }}>
                <div className={styles.reviewStars}>
                  {[...Array(5)].map((_, i) => <Icon key={i} name="star" size={13} color="#F97316" strokeWidth={0} style={{ fill: '#F97316' }} />)}
                </div>
                <p className={styles.reviewText}>"{r.text}"</p>
                <div className={styles.reviewAuthor}>
                  <div className={styles.reviewAvatarWrap}>
                    <Icon name="user" size={15} color="#93C5FD" strokeWidth={1.5} />
                  </div>
                  <div>
                    <div className={styles.reviewName}>{r.name}</div>
                    <div className={styles.reviewMeta}>{r.role}</div>
                    <div className={styles.reviewRoute}>
                      <Icon name="mapPin" size={11} color="#64748B" strokeWidth={1.5} />
                      {r.route}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={styles.ctaBand}>
        <div className="container">
          <div className={styles.ctaInner}>
            <div>
              <h2 className={styles.ctaTitle}>Ready to Move?</h2>
              <p className={styles.ctaSub}>Get a precise, itemized quote in under 60 seconds. No commitment required.</p>
            </div>
            <div className={styles.ctaActions}>
              <Link to="/quote" className={`btn-primary ${styles.ctaBtn}`}>
                Get Free Quote
                <Icon name="arrowRight" size={16} />
              </Link>
              <Link to="/track" className={styles.ctaSecondary}>
                <Icon name="mapPin" size={15} />
                Track a Move
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.footerGrid}>
            <div className={styles.footerBrand}>
              <div className={styles.footerLogo}>
                <div className={styles.footerLogoIcon}><Icon name="truck" size={16} color="#fff" strokeWidth={1.5} /></div>
                <span>MoveEasy</span>
              </div>
              <p className={styles.footerTagline}>Professional moving services across all 50 US states. Licensed, bonded, and fully insured since 2010.</p>
              <div className={styles.footerLicense}>
                <Icon name="shieldCheck" size={13} color="#475569" strokeWidth={1.5} />
                USDOT #1234567 · MC-789012
              </div>
            </div>
            {[
              { head: 'Services', links: ['Residential Moving', 'Commercial Relocation', 'Packing Services', 'Storage Solutions', 'Vehicle Transport'] },
              { head: 'Company', links: ['About Us', 'Careers', 'Press', 'Blog', 'Contact'] },
              { head: 'Support', links: ['Track a Move', 'Get a Quote', 'Insurance Info', 'Claims', 'Privacy Policy'] },
            ].map(col => (
              <div key={col.head} className={styles.footerCol}>
                <h4 className={styles.footerColHead}>{col.head}</h4>
                {col.links.map(l => <a key={l} href="#" className={styles.footerLink}>{l}</a>)}
              </div>
            ))}
          </div>
          <div className={styles.footerBottom}>
            <span>© 2025 MoveEasy Inc. All rights reserved.</span>
            <div className={styles.footerSocials}>
              {['X', 'in', 'f'].map(s => (
                <div key={s} className={styles.socialBtn}>{s}</div>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
