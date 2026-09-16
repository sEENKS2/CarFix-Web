import { useEffect, useState } from 'react';
import api from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { Plus, RefreshCw, X, Shield, UserCheck, Key, Lock, CheckCircle2, XCircle, ShieldAlert } from 'lucide-react';

export default function SeguridadUsuarios() {
  const { tieneRol } = useAuth();
  
  // Solo los administradores (bypass de rol vacío) pueden gestionar seguridad y usuarios
  const esAdmin = tieneRol([]);

  const [usuarios, setUsuarios] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showModalNuevo, setShowModalNuevo] = useState(false);
  const [showModalPassword, setShowModalPassword] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);

  const [formNuevo, setFormNuevo] = useState({ nombreUsuario: '', email: '', password: '', grupoId: '' });
  const [nuevoPassword, setNuevoPassword] = useState('');

  const cargarSeguridad = async () => {
    if (!esAdmin) return;

    setLoading(true);
    setError('');
    try {
      const [resUsers, resGrupos] = await Promise.all([
        api.get('/seguridad/usuarios'),
        api.get('/seguridad/grupos')
      ]);
      setUsuarios(resUsers.data);
      setGrupos(resGrupos.data);
    } catch {
      setError('Error al consultar usuarios y grupos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (esAdmin) {
      cargarSeguridad();
    }
  }, [esAdmin]);

  // Pantalla de bloqueo si un Operador o Técnico intenta entrar por URL directa
  if (!esAdmin) {
    return (
      <div style={styles.deniedContainer}>
        <ShieldAlert size={64} color="#ef4444" />
        <h2 style={styles.deniedTitle}>Acceso Restringido</h2>
        <p style={styles.deniedText}>
          Este módulo está reservado exclusivamente para el Administrador del sistema.
        </p>
      </div>
    );
  }

  const handleCrearUsuario = async (e) => {
    e.preventDefault();
    try {
      await api.post('/seguridad/usuarios', {
        ...formNuevo,
        grupoId: formNuevo.grupoId ? parseInt(formNuevo.grupoId, 10) : null
      });
      setShowModalNuevo(false);
      setFormNuevo({ nombreUsuario: '', email: '', password: '', grupoId: '' });
      cargarSeguridad();
    } catch (err) {
      alert(err.response?.data || 'Error al crear usuario');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/seguridad/usuarios/${usuarioSeleccionado.id}/password`, { passwordNuevo: nuevoPassword });
      setShowModalPassword(false);
      setNuevoPassword('');
      alert('Contraseña actualizada exitosamente');
    } catch (err) {
      alert(err.response?.data || 'Error al actualizar contraseña');
    }
  };

  const handleDesactivar = async (id) => {
    if (!window.confirm('¿Deseas revocar el acceso a este usuario?')) return;
    try {
      await api.delete(`/seguridad/usuarios/${id}`);
      cargarSeguridad();
    } catch (err) {
      alert(err.response?.data || 'Error al desactivar usuario');
    }
  };

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Usuarios y Seguridad</h1>
          <p style={styles.subtitle}>Gestión de operadores, roles y políticas de acceso</p>
        </div>
        <div style={styles.headerActions}>
          <button onClick={cargarSeguridad} style={styles.btnSecondary}>
            <RefreshCw size={15} /> Refrescar
          </button>
          <button onClick={() => setShowModalNuevo(true)} style={styles.btnPrimary}>
            <Plus size={16} /> Nuevo Usuario
          </button>
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.card}>
        {loading ? (
          <div style={styles.emptyState}>Cargando usuarios...</div>
        ) : usuarios.length === 0 ? (
          <div style={styles.emptyState}>No hay usuarios activos.</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>Usuario</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Grupos / Rol</th>
                <th style={styles.th}>Estado</th>
                <th style={styles.th}>Último Acceso</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u, idx) => (
                <tr key={u.id} style={{ ...styles.tr, backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                  <td style={styles.td}>
                    <div style={styles.cellFlex}>
                      <UserCheck size={15} color="#0284c7" />
                      <strong style={{ color: '#0f172a' }}>{u.nombreUsuario}</strong>
                    </div>
                  </td>
                  <td style={styles.td}>{u.email || '—'}</td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {u.grupos.map((g, i) => (
                        <span key={i} style={styles.roleTag}><Shield size={11} /> {g}</span>
                      ))}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.badge,
                      backgroundColor: u.activo ? '#ecfdf5' : '#fef2f2',
                      color: u.activo ? '#059669' : '#dc2626',
                      border: `1px solid ${u.activo ? '#a7f3d0' : '#fecaca'}`
                    }}>
                      {u.activo ? <CheckCircle2 size={12} style={{ marginRight: '4px' }} /> : <XCircle size={12} style={{ marginRight: '4px' }} />}
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ ...styles.td, color: '#64748b', fontSize: '0.8rem' }}>
                    {u.ultimoAcceso ? new Date(u.ultimoAcceso).toLocaleString('es-AR') : 'Nunca'}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>
                    <button onClick={() => { setUsuarioSeleccionado(u); setShowModalPassword(true); }} style={styles.actionBtn} title="Cambiar Contraseña">
                      <Key size={16} color="#0284c7" />
                    </button>
                    {u.activo && (
                      <button onClick={() => handleDesactivar(u.id)} style={styles.actionBtn} title="Desactivar Acceso">
                        <Lock size={16} color="#ef4444" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL NUEVO USUARIO */}
      {showModalNuevo && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}><Shield size={18} color="#0284c7" /> Registrar Nuevo Usuario</h3>
              <button onClick={() => setShowModalNuevo(false)} style={styles.iconBtn}><X size={20} /></button>
            </div>
            <form onSubmit={handleCrearUsuario} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Nombre de Usuario (Login)</label>
                <input required placeholder="carlos_mecanico" value={formNuevo.nombreUsuario} onChange={e => setFormNuevo({ ...formNuevo, nombreUsuario: e.target.value })} style={styles.input} />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Email</label>
                <input type="email" required placeholder="carlos@carfix.com" value={formNuevo.email} onChange={e => setFormNuevo({ ...formNuevo, email: e.target.value })} style={styles.input} />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Contraseña Temporal</label>
                <input type="password" required placeholder="••••••••" value={formNuevo.password} onChange={e => setFormNuevo({ ...formNuevo, password: e.target.value })} style={styles.input} />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Rol / Grupo de Seguridad</label>
                <select value={formNuevo.grupoId} onChange={e => setFormNuevo({ ...formNuevo, grupoId: e.target.value })} style={styles.select}>
                  <option value="">-- Sin Grupo / Básico --</option>
                  {grupos.map(g => <option key={g.id} value={g.id}>{g.nombre} - {g.descripcion}</option>)}
                </select>
              </div>
              <div style={styles.modalActions}>
                <button type="button" onClick={() => setShowModalNuevo(false)} style={styles.btnSecondary}>Cancelar</button>
                <button type="submit" style={styles.btnPrimary}>Crear Usuario</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL RESET PASSWORD */}
      {showModalPassword && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}><Key size={18} color="#0284c7" /> Cambiar Contraseña: {usuarioSeleccionado?.nombreUsuario}</h3>
              <button onClick={() => setShowModalPassword(false)} style={styles.iconBtn}><X size={20} /></button>
            </div>
            <form onSubmit={handleResetPassword} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Nueva Contraseña</label>
                <input type="password" required placeholder="Ingresá la nueva clave" value={nuevoPassword} onChange={e => setNuevoPassword(e.target.value)} style={styles.input} />
              </div>
              <div style={styles.modalActions}>
                <button type="button" onClick={() => setShowModalPassword(false)} style={styles.btnSecondary}>Cancelar</button>
                <button type="submit" style={styles.btnPrimary}>Actualizar Clave</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem' },
  title: { margin: 0, fontSize: '1.625rem', fontWeight: '700', color: '#0f172a', letterSpacing: '-0.025em' },
  subtitle: { margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#64748b' },
  headerActions: { display: 'flex', gap: '0.65rem' },
  btnPrimary: { display: 'flex', alignItems: 'center', gap: '0.45rem', backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' },
  btnSecondary: { display: 'flex', alignItems: 'center', gap: '0.45rem', backgroundColor: '#ffffff', color: '#334155', border: '1px solid #cbd5e1', padding: '0.5rem 0.9rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' },
  actionBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '0.35rem' },
  card: { backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.07)', overflow: 'hidden' },
  error: { padding: '0.75rem 1rem', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' },
  emptyState: { padding: '3rem', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' },
  thRow: { backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
  th: { padding: '0.85rem 1rem', color: '#475569', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '0.9rem 1rem', fontSize: '0.875rem', verticalAlign: 'middle' },
  cellFlex: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  roleTag: { display: 'inline-flex', alignItems: 'center', gap: '3px', backgroundColor: '#f1f5f9', color: '#334155', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '500' },
  badge: { display: 'inline-flex', alignItems: 'center', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: '#64748b' },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: '#ffffff', borderRadius: '12px', padding: '1.5rem', width: '100%', maxWidth: '480px', boxSizing: 'border-box' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' },
  modalTitle: { display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: '#0f172a', fontSize: '1.1rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '0.85rem' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '0.25rem' },
  label: { fontSize: '0.8rem', fontWeight: '600', color: '#334155' },
  input: { width: '100%', boxSizing: 'border-box', padding: '0.5rem 0.65rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', outline: 'none' },
  select: { width: '100%', boxSizing: 'border-box', padding: '0.5rem 0.65rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem' },
  deniedContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center' },
  deniedTitle: { marginTop: '1rem', fontSize: '1.5rem', color: '#0f172a' },
  deniedText: { color: '#64748b', marginTop: '0.5rem', maxWidth: '400px' }
};