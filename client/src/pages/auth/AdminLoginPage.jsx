import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Icon } from '../../components/ui/Icons';
import toast from 'react-hot-toast';
import styles from './AuthPage.module.css';

export default function AdminLoginPage() {
  const { login, user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  // Already logged in as admin — redirect
  useEffect(() => {
    if (user && isAdmin) navigate('/admin');
  }, [user, isAdmin]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      if (user.role !== 'admin') {
        toast.error('This account does not have admin access.');
        return;
      }
      toast.success('Welcome to the admin portal.');
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid credentials');
    } finally { setLoading(false); }
  };

  return (
    <div className={styles.adminLoginPage}>
      <div className={styles.adminLoginCard}>
        {/* Logo */}
        <div className={styles.adminLoginLogo}>
          <div className={styles.adminLogoIcon}>
            <Icon name="truck" size={18} color="#fff" strokeWidth={1.5} />
          </div>
          <div>
            <div className={styles.adminLogoName}>MoveEasy</div>
            <div className={styles.adminLogoBadge}>Admin Portal</div>
          </div>
        </div>

        <div className={styles.adminLoginDivider} />

        <h1 className={styles.adminTitle}>Administrator Sign In</h1>
        <p className={styles.adminSub}>Restricted access. Authorized personnel only.</p>

        <form onSubmit={submit} className={styles.form} style={{ marginTop: 24 }}>
          <div className={styles.field}>
            <label className="label">Admin Email</label>
            <div className={styles.inputWrap}>
              <Icon name="mail" size={15} color="#9CA3AF" strokeWidth={1.5} className={styles.inputIcon} />
              <input
                className={`input-field ${styles.inputWithIcon}`}
                type="email"
                value={form.email}
                onChange={set('email')}
                required
                placeholder="admin@moveeasy.com"
                autoComplete="email"
                autoFocus
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

          <div className={styles.adminWarning}>
            <Icon name="alertCircle" size={13} color="#D97706" strokeWidth={2} />
            All admin actions are logged and monitored.
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 15, borderRadius: 10, background: '#0F172A', marginTop: 4 }}
          >
            {loading
              ? <><Icon name="clock" size={15} /> Verifying...</>
              : <>Access Dashboard <Icon name="arrowRight" size={15} /></>
            }
          </button>
        </form>

        <p className={styles.adminBackLink}>
          <Link to="/" className={styles.authLink}>
            <Icon name="arrowLeft" size={13} />
            Back to MoveEasy
          </Link>
        </p>
      </div>
    </div>
  );
}
