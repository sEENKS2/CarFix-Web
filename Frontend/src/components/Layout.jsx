import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Wrench, 
  Ticket, 
  Package, 
  Truck, 
  ShoppingCart, 
  ShieldCheck, 
  LogOut,
  Users,
  Calendar,
  Receipt,
  DollarSign,
  LayoutDashboard,
  ShieldAlert
} from 'lucide-react';

export default function Layout() {
  const { user, logout, tieneRol } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Tickets de Taller', path: '/tickets', icon: Ticket },
    { name: 'Turnos', path: '/turnos', icon: Calendar },
    { name: 'Clientes y Autos', path: '/clientes-vehiculos', icon: Users },
    { name: 'Facturación', path: '/facturacion', icon: Receipt },
    { name: 'Caja Diaria', path: '/caja', icon: DollarSign },
    { name: 'Stock / Depósito', path: '/productos', icon: Package },
    { name: 'Inventario Kardex', path: '/inventario', icon: Package },
    { name: 'Órdenes de Compra', path: '/ordenes-compra', icon: ShoppingCart },
    { name: 'Proveedores', path: '/proveedores', icon: Truck },
    { name: 'Equipo Técnico', path: '/tecnicos', icon: Wrench },
    { name: 'Seguridad / Usuarios', path: '/seguridad', icon: ShieldAlert },
    { name: 'Auditoría', path: '/auditoria', icon: ShieldCheck },
  ];

  return (
    <div className="layout-wrapper">
      {/* Barra lateral */}
      <aside className="layout-sidebar">
        <div className="layout-brand">
          <Wrench size={26} color="#38bdf8" />
          <h2 className="layout-brand-text">CarFix</h2>
        </div>

        <nav className="layout-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => 
                  `layout-nav-link ${isActive ? 'layout-nav-link-active' : ''}`
                }
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* Contenido principal */}
      <div className="layout-main">
        <header className="layout-topbar">
          <div className="layout-user-info">
            <span className="layout-user-label">Usuario: </span>
            <strong className="layout-user-name">{user?.nombreUsuario || 'Operador'}</strong>
          </div>
          
          <button onClick={handleLogout} className="btn-logout">
            <LogOut size={16} />
            <span>Cerrar Sesión</span>
          </button>
        </header>

        <main className="layout-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}