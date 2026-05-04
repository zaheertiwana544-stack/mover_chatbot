// RegisterPage.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import styles from './AuthPage.module.css';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:'', email:'', phone:'', password:'' });
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters');
    setLoading(true);
    try {
      const user = await register(form);
      toast.success('Account created!');
      navigate('/dashboard');
    } catch(err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <Link to="/" className={styles.logo}><div className={styles.logoIcon}>🚛</div><span>MoveEasy</span></Link>
        <h1 className={styles.title}>Create account</h1>
        <p className={styles.sub}>Track your quotes and bookings in one place</p>
        <form onSubmit={submit} className={styles.form}>
          <div><label className="label">Full Name</label><input className="input-field" value={form.name} onChange={set('name')} required placeholder="John Smith" /></div>
          <div><label className="label">Email</label><input className="input-field" type="email" value={form.email} onChange={set('email')} required placeholder="john@email.com" /></div>
          <div><label className="label">Phone (optional)</label><input className="input-field" value={form.phone} onChange={set('phone')} placeholder="+1 (555) 000-0000" /></div>
          <div><label className="label">Password</label><input className="input-field" type="password" value={form.password} onChange={set('password')} required placeholder="Min. 8 characters" minLength={8} /></div>
          <button type="submit" className="btn-orange" disabled={loading} style={{width:'100%',justifyContent:'center',padding:'13px'}}>
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>
        <p className={styles.footer}>Already have an account? <Link to="/login" className={styles.authLink}>Sign in</Link></p>
      </div>
    </div>
  );
}
