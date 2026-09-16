import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Wrench, 
  Ticket, 
  Package, 
  Truck, 
  ShoppingCart, 
  ShieldCheck, 
  LogOut 
} from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Tickets de Taller', path: '/tickets', icon: Ticket },
    { name: 'Productos / Stock', path: '/productos', icon: Package },
    { name: 'Proveedores', path: '/proveedores', icon: Truck },
    { name: 'Órdenes de Compra', path: '/ordenes-compra', icon: ShoppingCart },
    { name: 'Auditoría', path: '/auditoria', icon: ShieldCheck },
  ];

  return (
    <div style={styles.wrapper}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.brand}>
          <Wrench size={28} color="#38bdf8" />
          <h2 style={styles.brandText}>CarFix</h2>
        </div>

        <nav style={styles.nav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  ...styles.navLink,
                  backgroundColor: isActive ? '#1e293b' : 'transparent',
                  color: isActive ? '#38bdf8' : '#94a3b8',
                }}
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div style={styles.mainContent}>
        <header style={styles.topbar}>
          <div>
            <span style={styles.greeting}>Usuario: </span>
            <strong style={{ color: '#0f172a' }}>{user?.nombreUsuario || 'Operador'}</strong>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            <LogOut size={18} />
            <span>Cerrar Sesión</span>
          </button>
        </header>

        <main style={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

const styles = {
  wrapper: { display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' },
  sidebar: { width: '250px', backgroundColor: '#0f172a', color: '#ffffff', display: 'flex', flexDirection: 'column' },
  brand: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1.5rem', borderBottom: '1px solid #1e293b' },
  brandText: { margin: 0, fontSize: '1.25rem', color: '#f8fafc' },
  nav: { display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '1rem' },
  navLink: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '6px', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500' },
  mainContent: { flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' },
  topbar: { height: '60px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem' },
  greeting: { color: '#64748b', fontSize: '0.9rem' },
  logoutBtn: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' },
  content: { padding: '2rem', flex: 1 }
};