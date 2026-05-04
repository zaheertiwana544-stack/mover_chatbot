import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Icon } from '../../components/ui/Icons';
import toast from 'react-hot-toast';
import styles from './AuthPage.module.css';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/dashboard';
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      navigate(user.role === 'admin' ? '/admin' : from);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid email or password');
    } finally { setLoading(false); }
  };

  return (
    <div className={styles.splitPage}>
      {/* Left panel — branding */}
      <div className={styles.splitLeft}>
        <Link to="/" className={styles.splitLogo}>
          <div className={styles.splitLogoIcon}>
            <Icon name="truck" size={20} color="#fff" strokeWidth={1.5} />
          </div>
          <span>MoveEasy</span>
        </Link>
        <div className={styles.splitContent}>
          <h2 className={styles.splitHeadline}>Your move,<br />managed simply.</h2>
          <p className={styles.splitTagline}>Track your shipment, view quotes, and manage your bookings — all in one place.</p>
          <div className={styles.splitStats}>
            {[['50K+','Moves completed'],['50','States covered'],['4.9★','Customer rating']].map(([v,l]) => (
              <div key={l} className={styles.splitStat}>
                <div className={styles.splitStatVal}>{v}</div>
                <div className={styles.splitStatLabel}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.splitFooter}>
          <Icon name="shieldCheck" size={13} color="rgba(255,255,255,0.4)" strokeWidth={1.5} />
          USDOT #1234567 · Licensed & Insured
        </div>
      </div>

      {/* Right panel — form */}
      <div className={styles.splitRight}>
        <div className={styles.formCard}>
          <div className={styles.formTop}>
            <h1 className={styles.formTitle}>Sign in</h1>
            <p className={styles.formSub}>Access your MoveEasy account</p>
          </div>

          <form onSubmit={submit} className={styles.form}>
            <div className={styles.field}>
              <label className="label">Email address</label>
              <div className={styles.inputWrap}>
                <Icon name="mail" size={15} color="#9CA3AF" strokeWidth={1.5} className={styles.inputIcon} />
                <input
                  className={`input-field ${styles.inputWithIcon}`}
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  required
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className="label">Password</label>
              <div className={styles.inputWrap}>
                <Icon name="shield" size={15} color="#9CA3AF" strokeWidth={1.5} className={styles.inputIcon} />
                <input
                  className={`input-field ${styles.inputWithIcon} ${styles.inputWithAction}`}
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  required
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button type="button" className={styles.inputAction} onClick={() => setShowPass(s => !s)}>
                  <Icon name="eye" size={14} color="#9CA3AF" strokeWidth={1.5} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 15, borderRadius: 10, marginTop: 4 }}
            >
              {loading
                ? <><Icon name="clock" size={15} /> Signing in...</>
                : <>Sign In <Icon name="arrowRight" size={15} /></>
              }
            </button>
          </form>

          <div className={styles.dividerRow}>
            <div className={styles.divider} />
            <span className={styles.dividerText}>or</span>
            <div className={styles.divider} />
          </div>

          <Link to="/track" className={styles.trackLink}>
            <Icon name="mapPin" size={14} color="#6B7280" strokeWidth={1.5} />
            Track a move without signing in
          </Link>

          <p className={styles.formFooter}>
            Don't have an account?{' '}
            <Link to="/register" className={styles.authLink}>Create one free</Link>
          </p>

          <div className={styles.adminHint}>
            <Icon name="settings" size={12} color="#9CA3AF" strokeWidth={1.5} />
            <span>Admin? <Link to="/admin/login" className={styles.adminLink}>Use the admin portal</Link></span>
          </div>
        </div>
      </div>
    </div>
  );
}
