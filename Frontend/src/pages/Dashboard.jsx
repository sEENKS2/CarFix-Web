import { useEffect, useState } from 'react';
import api from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { 
  Wrench, 
  ShoppingCart, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  RefreshCw,
  Award,
  CalendarCheck,
  ShieldAlert
} from 'lucide-react';

export default function Dashboard() {
  const { tieneRol } = useAuth();
  
  // Validamos si el usuario puede acceder a la pantalla (Operador o Admin)
  const tieneAccesoGeneral = tieneRol(['Operadores']);
  // Validamos si el usuario tiene acceso financiero total (Solo Admin)
  const esAdmin = tieneRol([]);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const cargarMetricas = async () => {
    if (!tieneAccesoGeneral) return;

    setLoading(true);
    setError('');
    try {
      const res = await api.get('/reportes/dashboard');
      setData(res.data);
    } catch {
      setError('Error al sincronizar métricas del sistema.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tieneAccesoGeneral) {
      cargarMetricas();
    }
  }, [tieneAccesoGeneral]);

  // Pantalla de bloqueo si entra un Técnico por URL directa
  if (!tieneAccesoGeneral) {
    return (
      <div style={styles.deniedContainer}>
        <ShieldAlert size={64} color="#ef4444" />
        <h2 style={styles.deniedTitle}>Acceso Restringido</h2>
        <p style={styles.deniedText}>
          Tu perfil técnico no cuenta con permisos para visualizar métricas, finanzas ni estadísticas generales del taller.
        </p>
      </div>
    );
  }

  if (loading) {
    return <div style={styles.centerText}>Cargando panel de control y métricas...</div>;
  }

  const stats = data?.estadisticas || {};
  const bajoStock = data?.productosBajoStock || [];
  const topProveedores = data?.topProveedores || [];
  const productividad = data?.productividadTecnicos || [];

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Panel General y Métricas</h1>
          <p style={styles.subtitle}>Visión consolidada del rendimiento de taller e inventario</p>
        </div>
        <button onClick={cargarMetricas} style={styles.btnRefresh}>
          <RefreshCw size={15} /> Actualizar
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {/* KPI CARDS */}
      <div style={styles.kpiGrid}>
        <div style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>Tickets Este Mes</span>
            <div style={{ ...styles.kpiIcon, backgroundColor: '#eff6ff', color: '#0284c7' }}>
              <CalendarCheck size={20} />
            </div>
          </div>
          <div style={styles.kpiValue}>{stats.TicketsEsteMes || 0}</div>
          <span style={styles.kpiSub}>Total histórico: {stats.TotalTickets || 0}</span>
        </div>

        <div style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>Tickets Ingresados Hoy</span>
            <div style={{ ...styles.kpiIcon, backgroundColor: '#f0fdf4', color: '#16a34a' }}>
              <Wrench size={20} />
            </div>
          </div>
          <div style={styles.kpiValue}>{stats.TicketsHoy || 0}</div>
          <span style={styles.kpiSub}>Órdenes de trabajo abiertas</span>
        </div>

        <div style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>Mecánico Destacado</span>
            <div style={{ ...styles.kpiIcon, backgroundColor: '#fefce8', color: '#ca8a04' }}>
              <Award size={20} />
            </div>
          </div>
          <div style={{ ...styles.kpiValue, fontSize: '1.25rem' }}>{stats.TecnicoMasProductivo || 'N/A'}</div>
          <span style={styles.kpiSub}>Mayor volumen de finalizaciones</span>
        </div>

        <div style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>Alertas de Reposición</span>
            <div style={{ ...styles.kpiIcon, backgroundColor: '#fef2f2', color: '#dc2626' }}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <div style={{ ...styles.kpiValue, color: bajoStock.length > 0 ? '#dc2626' : '#0f172a' }}>
            {bajoStock.length}
          </div>
          <span style={styles.kpiSub}>Ítems con stock crítico</span>
        </div>
      </div>

      {/* SECCIÓN 2 COLUMNAS */}
      <div style={styles.gridTwoCols}>
        {/* Productividad Técnicos */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={18} color="#0284c7" />
              <h3 style={styles.cardTitle}>Rendimiento de Técnicos</h3>
            </div>
          </div>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>Técnico</th>
                <th style={styles.th}>Especialidad</th>
                <th style={styles.th}>Finalizados</th>
                <th style={styles.th}>% Éxito</th>
              </tr>
            </thead>
            <tbody>
              {productividad.length === 0 ? (
                <tr><td colSpan="4" style={styles.emptyTable}>Sin datos registrados</td></tr>
              ) : (
                productividad.map((tec, i) => (
                  <tr key={i} style={styles.tr}>
                    <td style={{ ...styles.td, fontWeight: '600', color: '#0f172a' }}>{tec.nombreTecnico}</td>
                    <td style={styles.td}><span style={styles.badgeMuted}>{tec.especialidad}</span></td>
                    <td style={styles.td}>{tec.ticketsFinalizados} / {tec.totalTickets}</td>
                    <td style={styles.td}>
                      <span style={styles.badgeSuccess}>{tec.porcentajeFinalizados}%</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Reposición Stock Crítico */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShoppingCart size={18} color="#dc2626" />
              <h3 style={styles.cardTitle}>Repuestos con Stock Crítico</h3>
            </div>
          </div>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>Código</th>
                <th style={styles.th}>Producto</th>
                <th style={styles.th}>Stock Actual</th>
                <th style={styles.th}>Mínimo</th>
              </tr>
            </thead>
            <tbody>
              {bajoStock.length === 0 ? (
                <tr><td colSpan="4" style={styles.emptyTable}>Inventario en niveles óptimos</td></tr>
              ) : (
                bajoStock.map((prod) => (
                  <tr key={prod.id} style={styles.tr}>
                    <td style={styles.td}><strong>{prod.codigo}</strong></td>
                    <td style={{ ...styles.td, color: '#0f172a', fontWeight: '500' }}>{prod.nombre}</td>
                    <td style={styles.td}>
                      <span style={styles.badgeDanger}>{prod.stockActual} u.</span>
                    </td>
                    <td style={{ ...styles.td, color: '#64748b' }}>{prod.stockMinimo} u.</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* TOP PROVEEDORES - RESTRINGIDO A ADMINISTRADORES */}
      {esAdmin && (
        <div style={{ ...styles.card, marginTop: '1.5rem' }}>
          <div style={styles.cardHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={18} color="#0284c7" />
              <h3 style={styles.cardTitle}>Principales Proveedores (Últimos 6 Meses)</h3>
            </div>
          </div>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>Proveedor</th>
                <th style={styles.th}>Órdenes Emitidas</th>
                <th style={styles.th}>Monto Comprado</th>
                <th style={styles.th}>Participación</th>
              </tr>
            </thead>
            <tbody>
              {topProveedores.length === 0 ? (
                <tr><td colSpan="4" style={styles.emptyTable}>No hay historial de compras reciente</td></tr>
              ) : (
                topProveedores.map((prov, i) => (
                  <tr key={i} style={styles.tr}>
                    <td style={{ ...styles.td, fontWeight: '600', color: '#0f172a' }}>{prov.nombreProveedor}</td>
                    <td style={styles.td}>{prov.cantidadOrdenes} órdenes</td>
                    <td style={{ ...styles.td, fontWeight: '600' }}>
                      ${Number(prov.montoTotal || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={styles.td}>
                      <span style={styles.badgeInfo}>{Number(prov.porcentajeTotal || 0).toFixed(1)}%</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem' },
  title: { margin: 0, fontSize: '1.625rem', fontWeight: '700', color: '#0f172a', letterSpacing: '-0.025em' },
  subtitle: { margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#64748b' },
  btnRefresh: { display: 'flex', alignItems: 'center', gap: '0.45rem', backgroundColor: '#ffffff', color: '#334155', border: '1px solid #cbd5e1', padding: '0.5rem 0.9rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' },
  centerText: { textAlign: 'center', padding: '4rem', color: '#64748b', fontSize: '1rem' },
  error: { padding: '0.75rem 1rem', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', marginBottom: '1rem' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' },
  kpiCard: { backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.07)' },
  kpiHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' },
  kpiLabel: { fontSize: '0.8rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' },
  kpiIcon: { padding: '0.45rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  kpiValue: { fontSize: '1.75rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.25rem' },
  kpiSub: { fontSize: '0.75rem', color: '#94a3b8' },
  gridTwoCols: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.25rem' },
  card: { backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.07)', overflow: 'hidden' },
  cardHeader: { padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9' },
  cardTitle: { margin: 0, fontSize: '1rem', fontWeight: '600', color: '#0f172a' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' },
  thRow: { backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
  th: { padding: '0.75rem 1.25rem', color: '#475569', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' },
  tr: { borderBottom: '1px solid #f8fafc' },
  td: { padding: '0.8rem 1.25rem', color: '#334155' },
  emptyTable: { textAlign: 'center', padding: '2rem', color: '#94a3b8' },
  badgeSuccess: { padding: '0.2rem 0.5rem', backgroundColor: '#ecfdf5', color: '#059669', borderRadius: '6px', fontWeight: '600', fontSize: '0.75rem' },
  badgeDanger: { padding: '0.2rem 0.5rem', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '6px', fontWeight: '600', fontSize: '0.75rem' },
  badgeInfo: { padding: '0.2rem 0.5rem', backgroundColor: '#eff6ff', color: '#0284c7', borderRadius: '6px', fontWeight: '600', fontSize: '0.75rem' },
  badgeMuted: { padding: '0.2rem 0.5rem', backgroundColor: '#f1f5f9', color: '#475569', borderRadius: '4px', fontSize: '0.75rem' },
  deniedContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center' },
  deniedTitle: { marginTop: '1rem', fontSize: '1.5rem', color: '#0f172a' },
  deniedText: { color: '#64748b', marginTop: '0.5rem', maxWidth: '400px' }
};