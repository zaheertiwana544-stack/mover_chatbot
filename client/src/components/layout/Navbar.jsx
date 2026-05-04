import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Icon } from '../ui/Icons';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const handleLogout = async () => { await logout(); navigate('/'); };

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}>
      <Link to="/" className={styles.logo}>
        <div className={styles.logoIcon}>
          <Icon name="truck" size={16} color="#fff" strokeWidth={1.5} />
        </div>
        <span className={styles.logoText}>MoveEasy</span>
      </Link>

      <div className={`${styles.links} ${menuOpen ? styles.open : ''}`}>
        <a href="/#services" className={styles.link} onClick={() => setMenuOpen(false)}>Services</a>
        <a href="/#how" className={styles.link} onClick={() => setMenuOpen(false)}>Process</a>
        <Link to="/track" className={styles.link} onClick={() => setMenuOpen(false)}>Track Move</Link>
        {isAdmin && <Link to="/admin" className={styles.link} onClick={() => setMenuOpen(false)}>Admin</Link>}
        {user ? (
          <>
            <Link to="/dashboard" className={styles.link} onClick={() => setMenuOpen(false)}>My Moves</Link>
            <button onClick={handleLogout} className={styles.btnGhost}>
              <Icon name="logOut" size={14} />
              Sign Out
            </button>
          </>
        ) : (
          <Link to="/login" className={styles.btnGhost} onClick={() => setMenuOpen(false)}>Sign In</Link>
        )}
        <Link to="/quote" className={styles.btnCta} onClick={() => setMenuOpen(false)}>
          Get a Quote
          <Icon name="arrowRight" size={14} />
        </Link>
      </div>

      <button className={styles.hamburger} onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
        <Icon name={menuOpen ? 'close' : 'menu'} size={20} color="var(--text)" />
      </button>
    </nav>
  );
}
