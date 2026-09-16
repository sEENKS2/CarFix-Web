import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  TrendingUp, 
  Wrench, 
  Package, 
  Truck, 
  ShoppingCart, 
  ShieldCheck, 
  LogOut, 
  UserCircle2,
  Car,
  Lock,
  Users
} from 'lucide-react';

export default function MainLayout() {
  const navigate = useNavigate();
  const { user, logout, tieneRol } = useAuth();
  
  // Tomamos el nombre del usuario desde el contexto
  const usuario = user?.nombreUsuario || user?.usuario || 'Operador';

  const handleLogout = () => {
    logout(); // Limpia el localStorage y el estado global
    navigate('/login', { replace: true });
  };

  // Definimos a qué roles está permitida cada ruta
  // Un arreglo vacío [] significa que SOLO el Administrador (por el bypass) puede verla
  const todasLasRutas = [
    { to: '/dashboard', label: 'Panel / Métricas', icon: <TrendingUp size={18} />, roles: ['Operadores'] },
    { to: '/tickets', label: 'Tickets de Taller', icon: <Wrench size={18} />, roles: ['Operadores', 'Tecnicos'] },
    { to: '/clientes-vehiculos', label: 'Clientes y Vehículos', icon: <Car size={18} />, roles: ['Operadores'] },
    { to: '/tecnicos', label: 'Equipo Técnico', icon: <Users size={18} />, roles: ['Operadores'] },
    { to: '/productos', label: 'Productos / Stock', icon: <Package size={18} />, roles: ['Operadores', 'Tecnicos'] },
    { to: '/proveedores', label: 'Proveedores', icon: <Truck size={18} />, roles: ['Operadores'] },
    { to: '/ordenes-compra', label: 'Órdenes de Compra', icon: <ShoppingCart size={18} />, roles: ['Operadores'] },
    { to: '/usuarios', label: 'Usuarios / Seguridad', icon: <Lock size={18} />, roles: [] },
    { to: '/auditoria', label: 'Auditoría', icon: <ShieldCheck size={18} />, roles: [] },
  ];

  // Filtramos el menú para mostrar solo lo que el usuario logueado tiene permitido
  const navItems = todasLasRutas.filter(item => tieneRol(item.roles));

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.brand}>
          <div style={styles.brandIcon}>
            <Car size={22} color="#ffffff" />
          </div>
          <span style={styles.brandName}>CarFix</span>
        </div>

        <nav style={styles.nav}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                ...styles.navLink,
                backgroundColor: isActive ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                color: isActive ? '#38bdf8' : '#94a3b8',
                fontWeight: isActive ? '600' : '500',
                borderLeft: isActive ? '3px solid #38bdf8' : '3px solid transparent',
              })}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Area */}
      <div style={styles.mainWrapper}>
        <header style={styles.topbar}>
          <div style={styles.userBadge}>
            <UserCircle2 size={20} color="#0284c7" />
            <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Usuario:</span>
            <strong style={{ fontSize: '0.875rem', color: '#0f172a' }}>{usuario}</strong>
          </div>

          <button onClick={handleLogout} style={styles.btnLogout}>
            <LogOut size={16} /> Cerrar Sesión
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
  container: { display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' },
  sidebar: { width: '260px', backgroundColor: '#0f172a', display: 'flex', flexDirection: 'column', borderRight: '1px solid #1e293b', flexShrink: 0 },
  brand: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1.5rem 1.25rem', borderBottom: '1px solid #1e293b' },
  brandIcon: { backgroundColor: '#0284c7', padding: '0.5rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  brandName: { fontSize: '1.25rem', fontWeight: '700', color: '#ffffff', letterSpacing: '-0.025em' },
  nav: { display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '1rem 0.75rem' },
  navLink: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '6px', textDecoration: 'none', fontSize: '0.9rem', transition: 'all 0.15s ease' },
  mainWrapper: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  topbar: { height: '64px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 2rem' },
  userBadge: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  btnLogout: { display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', padding: '0.45rem 0.9rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' },
  content: { flex: 1, padding: '2rem', maxWidth: '1300px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }
};