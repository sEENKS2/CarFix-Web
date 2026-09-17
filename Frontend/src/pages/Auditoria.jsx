import { useEffect, useState } from 'react';
import api from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { RefreshCw, User, Calendar, Shield, ShieldAlert } from 'lucide-react';

export default function Auditoria() {
  const { tieneRol } = useAuth();
  
  // Como enviamos un arreglo vacío [], solo devolverá true si el usuario
  // entra por el bypass de Administrador configurado en el AuthContext.
  const esAdmin = tieneRol([]);

  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('TODOS');

  const cargarAuditoria = async () => {
    // Si no es admin, ni siquiera intentamos hacer la petición a la API
    if (!esAdmin) return;

    setLoading(true);
    setError('');
    try {
      const res = await api.get('/auditoria');
      setRegistros(res.data);
    } catch {
      setError('Error al obtener los registros de auditoría.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (esAdmin) {
      cargarAuditoria();
    }
  }, [esAdmin]);

  // Pantalla de bloqueo si el rol no tiene permisos
  if (!esAdmin) {
    return (
      <div style={styles.deniedContainer}>
        <ShieldAlert size={64} color="#ef4444" />
        <h2 style={styles.deniedTitle}>Acceso Restringido</h2>
        <p style={styles.deniedText}>
          Tu perfil de usuario no cuenta con los privilegios necesarios para acceder a los registros de auditoría del sistema.
        </p>
      </div>
    );
  }

  const registrosFiltrados = registros.filter((r) => {
    if (filtroTipo === 'TODOS') return true;
    const accion = String(r.accion || r.tipo || '').toUpperCase();
    const modulo = String(r.modulo || r.entidad || '').toUpperCase();
    
    if (filtroTipo === 'LOGIN') return accion.includes('LOGIN') || modulo.includes('SEGURIDAD');
    if (filtroTipo === 'CREATE') return accion.includes('CREATE') || accion.includes('ALTA');
    if (filtroTipo === 'UPDATE') return accion.includes('UPDATE') || accion.includes('STATUS') || accion.includes('MODIFICACION');
    if (filtroTipo === 'DELETE') return accion.includes('DELETE') || accion.includes('BAJA') || accion.includes('ELIMINADA');
    
    return accion.includes(filtroTipo);
  });

  const getBadgeStyle = (tipo) => {
    const t = String(tipo || '').toUpperCase();
    if (t.includes('CREATE') || t.includes('ALTA') || t === 'LOGIN') {
      return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' };
    }
    if (t.includes('UPDATE') || t.includes('CHANGE_STATUS') || t.includes('MODIFICACION')) {
      return { bg: '#fffbeb', text: '#d97706', border: '#fde68a' };
    }
    if (t.includes('DELETE') || t.includes('FALLIDO') || t.includes('BAJA')) {
      return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' };
    }
    return { bg: '#f8fafc', text: '#475569', border: '#e2e8f0' };
  };

  return (
    <div>
      {/* Header con alineación limpia */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Auditoría del Sistema</h1>
          <p style={styles.subtitle}>Trazabilidad de operaciones, accesos y eventos de seguridad</p>
        </div>
        <div style={styles.headerActions}>
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            style={styles.selectFilter}
          >
            <option value="TODOS">Todos los eventos</option>
            <option value="CREATE">Creaciones / Altas</option>
            <option value="UPDATE">Modificaciones / Cambios</option>
            <option value="DELETE">Eliminaciones</option>
            <option value="LOGIN">Inicios de sesión</option>
          </select>
          <button onClick={cargarAuditoria} style={styles.btnRefresh}>
            <RefreshCw size={15} /> Refrescar
          </button>
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {/* Card contenedor de tabla */}
      <div style={styles.card}>
        {loading ? (
          <div style={styles.emptyState}>Cargando bitácora de auditoría...</div>
        ) : registrosFiltrados.length === 0 ? (
          <div style={styles.emptyState}>No se encontraron registros de auditoría.</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>Fecha y Hora</th>
                <th style={styles.th}>Usuario</th>
                <th style={styles.th}>Acción / Evento</th>
                <th style={styles.th}>Entidad / Módulo</th>
                <th style={styles.th}>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {registrosFiltrados.map((r, idx) => {
                const accion = r.accion || r.tipo || 'Evento';
                const badge = getBadgeStyle(accion);
                const fechaRaw = r.fechaHora || r.fecha;
                const fechaTexto = fechaRaw ? new Date(fechaRaw).toLocaleString('es-AR') : '—';
                const usuarioNombre = r.usuario || r.nombreUsuario || 'Sistema';

                const detalleTexto = r.observaciones 
                  || (r.valorNuevo ? (r.campo ? `${r.campo}: ${r.valorNuevo}` : r.valorNuevo) : '')
                  || r.detalle 
                  || '—';

                return (
                  <tr 
                    key={`${r.modulo || r.entidad || 'aud'}-${r.id ?? 'row'}-${idx}`}
                    style={{ ...styles.tr, backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}
                  >
                    <td style={styles.td}>
                      <div style={styles.cellFlex}>
                        <Calendar size={14} color="#64748b" />
                        <span>{fechaTexto}</span>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.cellFlex}>
                        <User size={14} color="#0284c7" />
                        <span style={{ fontWeight: '600', color: '#0f172a' }}>{usuarioNombre}</span>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        backgroundColor: badge.bg,
                        color: badge.text,
                        border: `1px solid ${badge.border}`
                      }}>
                        {accion}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.cellFlex}>
                        <Shield size={14} color="#64748b" />
                        <strong style={{ color: '#1e293b' }}>{r.modulo || r.entidad || 'General'}</strong>
                      </div>
                    </td>
                    <td style={{ ...styles.td, color: '#334155' }}>
                      {detalleTexto}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1.75rem'
  },
  title: {
    margin: 0,
    fontSize: '1.625rem',
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: '-0.025em'
  },
  subtitle: {
    margin: '0.25rem 0 0 0',
    fontSize: '0.875rem',
    color: '#64748b'
  },
  headerActions: {
    display: 'flex',
    gap: '0.65rem'
  },
  selectFilter: {
    padding: '0.5rem 0.85rem',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '0.85rem',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    outline: 'none',
    cursor: 'pointer',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
  },
  btnRefresh: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.45rem',
    backgroundColor: '#ffffff',
    color: '#334155',
    border: '1px solid #cbd5e1',
    padding: '0.5rem 0.9rem',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.07), 0 1px 2px -1px rgba(0, 0, 0, 0.07)',
    overflow: 'hidden'
  },
  error: {
    padding: '0.75rem 1rem',
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    marginBottom: '1rem',
    fontSize: '0.875rem'
  },
  emptyState: {
    padding: '3rem',
    textAlign: 'center',
    color: '#64748b',
    fontSize: '0.9rem'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '0.875rem'
  },
  thRow: {
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #e2e8f0'
  },
  th: {
    padding: '0.85rem 1rem',
    color: '#475569',
    fontWeight: '600',
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    letterSpacing: '0.04em'
  },
  tr: {
    borderBottom: '1px solid #f1f5f9',
    transition: 'background-color 0.15s'
  },
  td: {
    padding: '0.9rem 1rem',
    fontSize: '0.875rem',
    verticalAlign: 'middle'
  },
  cellFlex: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.45rem'
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.2rem 0.55rem',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '600',
    letterSpacing: '0.02em'
  },
  deniedContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '60vh',
    textAlign: 'center'
  },
  deniedTitle: {
    marginTop: '1rem',
    fontSize: '1.5rem',
    color: '#0f172a'
  },
  deniedText: {
    color: '#64748b',
    marginTop: '0.5rem',
    maxWidth: '400px'
  }
};