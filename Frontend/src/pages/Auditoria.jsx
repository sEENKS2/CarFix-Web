import { useEffect, useState } from 'react';
import api from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { RefreshCw, User, Calendar, Shield, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

export default function Auditoria() {
  const { tieneRol } = useAuth();
  const esAdmin = tieneRol([]);

  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState('TODOS');

  const cargarAuditoria = async (mostrarToast = false) => {
    if (!esAdmin) return;

    setLoading(true);
    try {
      const res = await api.get('/auditoria');
      setRegistros(res.data || []);
      if (mostrarToast) {
        toast.success('Bitácora de auditoría actualizada');
      }
    } catch {
      toast.error('Error al obtener los registros de auditoría');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (esAdmin) {
      cargarAuditoria();
    }
  }, [esAdmin]);

  if (!esAdmin) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center' }}>
        <ShieldAlert size={64} color="#ef4444" />
        <h2 style={{ marginTop: '1rem', fontSize: '1.5rem', color: '#0f172a' }}>Acceso Restringido</h2>
        <p style={{ color: '#64748b', marginTop: '0.5rem', maxWidth: '400px' }}>
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
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Auditoría del Sistema</h1>
          <p className="page-subtitle">Trazabilidad de operaciones, accesos y eventos de seguridad</p>
        </div>
        <div className="header-actions">
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="form-select"
            style={{ width: 'auto', minWidth: '200px' }}
          >
            <option value="TODOS">Todos los eventos</option>
            <option value="CREATE">Creaciones / Altas</option>
            <option value="UPDATE">Modificaciones / Cambios</option>
            <option value="DELETE">Eliminaciones</option>
            <option value="LOGIN">Inicios de sesión</option>
          </select>
          <button onClick={() => cargarAuditoria(true)} className="btn-secondary">
            <RefreshCw size={15} /> Refrescar
          </button>
        </div>
      </div>

      <div className="ui-card">
        {loading ? (
          <div className="empty-state">Cargando bitácora de auditoría...</div>
        ) : registrosFiltrados.length === 0 ? (
          <div className="empty-state">No se encontraron registros de auditoría.</div>
        ) : (
          <div className="ui-table-container">
            <table className="ui-table">
              <thead>
                <tr>
                  <th style={{ width: '180px' }}>Fecha y Hora</th>
                  <th style={{ width: '150px' }}>Usuario</th>
                  <th style={{ width: '160px' }}>Acción / Evento</th>
                  <th style={{ width: '160px' }}>Entidad / Módulo</th>
                  <th>Detalle</th>
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
                    <tr key={`${r.modulo || r.entidad || 'aud'}-${r.id ?? 'row'}-${idx}`}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem', color: '#475569' }}>
                          <Calendar size={14} color="#64748b" />
                          <span>{fechaTexto}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <User size={14} color="#0284c7" />
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>{usuarioNombre}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          backgroundColor: badge.bg,
                          color: badge.text,
                          border: `1px solid ${badge.border}`
                        }}>
                          {accion}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <Shield size={14} color="#64748b" />
                          <strong style={{ color: '#1e293b' }}>{r.modulo || r.entidad || 'General'}</strong>
                        </div>
                      </td>
                      <td style={{ color: '#334155' }}>
                        {detalleTexto}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}