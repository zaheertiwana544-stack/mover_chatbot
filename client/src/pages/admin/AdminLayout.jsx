import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Icon } from '../../components/ui/Icons';
import styles from './Admin.module.css';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: 'barChart', end: true },
  { to: '/admin/bookings', label: 'Bookings', icon: 'calendar' },
  { to: '/admin/quotes', label: 'Quotes', icon: 'fileText' },
  { to: '/admin/users', label: 'Users', icon: 'users' },
  { to: '/admin/leads', label: 'Chat Leads', icon: 'messageSquare' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/'); };
  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <div className={styles.logoIcon}><Icon name="truck" size={15} color="#fff" strokeWidth={1.5} /></div>
          <span>MoveEasy</span>
          <div className={styles.adminBadge}>Admin</div>
        </div>
        <nav className={styles.sidebarNav}>
          {navItems.map(n => (
            <NavLink key={n.to} to={n.to} end={n.end}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navActive : ''}`}>
              <Icon name={n.icon} size={16} strokeWidth={1.5} />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className={styles.sidebarFooter}>
          <div className={styles.adminUser}>
            <div className={styles.adminAvatar}>{user?.name?.[0]?.toUpperCase()}</div>
            <div>
              <div className={styles.adminName}>{user?.name}</div>
              <div className={styles.adminEmail}>{user?.email}</div>
            </div>
          </div>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            <Icon name="logOut" size={14} strokeWidth={1.5} />
            Sign Out
          </button>
        </div>
      </aside>
      <main className={styles.main}><Outlet /></main>
    </div>
  );
}
