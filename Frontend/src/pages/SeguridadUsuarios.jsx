import { useEffect, useState } from 'react';
import api from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { Plus, RefreshCw, X, Shield, UserCheck, Key, Lock, CheckCircle2, XCircle, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

export default function SeguridadUsuarios() {
  const { tieneRol } = useAuth();
  const esAdmin = tieneRol([]);

  const [usuarios, setUsuarios] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModalNuevo, setShowModalNuevo] = useState(false);
  const [showModalPassword, setShowModalPassword] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);

  const [formNuevo, setFormNuevo] = useState({ nombreUsuario: '', email: '', password: '', grupoId: '' });
  const [nuevoPassword, setNuevoPassword] = useState('');

  const cargarSeguridad = async (mostrarToast = false) => {
    if (!esAdmin) return;

    setLoading(true);
    try {
      const [resUsers, resGrupos] = await Promise.all([
        api.get('/seguridad/usuarios'),
        api.get('/seguridad/grupos')
      ]);
      setUsuarios(resUsers.data || []);
      setGrupos(resGrupos.data || []);
      if (mostrarToast) {
        toast.success('Padrón de usuarios y grupos actualizado');
      }
    } catch {
      toast.error('Error al consultar usuarios y grupos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (esAdmin) {
      cargarSeguridad();
    }
  }, [esAdmin]);

  if (!esAdmin) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center' }}>
        <ShieldAlert size={64} color="#ef4444" />
        <h2 style={{ marginTop: '1rem', fontSize: '1.5rem', color: '#0f172a' }}>Acceso Restringido</h2>
        <p style={{ color: '#64748b', marginTop: '0.5rem', maxWidth: '400px' }}>
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
      toast.success(`Usuario ${formNuevo.nombreUsuario} creado exitosamente`);
      setShowModalNuevo(false);
      setFormNuevo({ nombreUsuario: '', email: '', password: '', grupoId: '' });
      cargarSeguridad();
    } catch (err) {
      toast.error(err.response?.data || 'Error al crear usuario');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/seguridad/usuarios/${usuarioSeleccionado.id}/password`, { passwordNuevo: nuevoPassword });
      toast.success(`Contraseña actualizada para ${usuarioSeleccionado.nombreUsuario}`);
      setShowModalPassword(false);
      setNuevoPassword('');
    } catch (err) {
      toast.error(err.response?.data || 'Error al actualizar contraseña');
    }
  };

  const handleDesactivar = async (id) => {
    if (!window.confirm('¿Deseas revocar el acceso a este usuario?')) return;
    try {
      await api.delete(`/seguridad/usuarios/${id}`);
      toast.success('Acceso revocado correctamente');
      cargarSeguridad();
    } catch (err) {
      toast.error(err.response?.data || 'Error al desactivar usuario');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Usuarios y Seguridad</h1>
          <p className="page-subtitle">Gestión de operadores, roles y políticas de acceso</p>
        </div>
        <div className="header-actions">
          <button onClick={() => cargarSeguridad(true)} className="btn-secondary">
            <RefreshCw size={15} /> Refrescar
          </button>
          <button onClick={() => setShowModalNuevo(true)} className="btn-primary">
            <Plus size={16} /> Nuevo Usuario
          </button>
        </div>
      </div>

      <div className="ui-card">
        {loading ? (
          <div className="empty-state">Cargando usuarios...</div>
        ) : usuarios.length === 0 ? (
          <div className="empty-state">No hay usuarios activos.</div>
        ) : (
          <div className="ui-table-container">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Grupos / Rol</th>
                  <th>Estado</th>
                  <th>Último Acceso</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <UserCheck size={15} color="#0284c7" />
                        <strong style={{ color: '#0f172a' }}>{u.nombreUsuario}</strong>
                      </div>
                    </td>
                    <td>{u.email || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {u.grupos && u.grupos.map((g, i) => (
                          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', backgroundColor: '#f1f5f9', color: '#334155', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 500 }}>
                            <Shield size={11} /> {g}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className={`ui-badge ${u.activo ? 'ui-badge-success' : 'ui-badge-warning'}`} style={!u.activo ? { backgroundColor: '#fef2f2', color: '#dc2626', borderColor: '#fecaca' } : {}}>
                        {u.activo ? <CheckCircle2 size={12} style={{ marginRight: '4px' }} /> : <XCircle size={12} style={{ marginRight: '4px' }} />}
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ color: '#64748b', fontSize: '0.8rem' }}>
                      {u.ultimoAcceso ? new Date(u.ultimoAcceso).toLocaleString('es-AR') : 'Nunca'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <button 
                          onClick={() => { setUsuarioSeleccionado(u); setShowModalPassword(true); }} 
                          className="btn-ghost-icon" 
                          title="Cambiar Contraseña"
                        >
                          <Key size={16} color="#0284c7" />
                        </button>
                        {u.activo && (
                          <button 
                            onClick={() => handleDesactivar(u.id)} 
                            className="btn-ghost-icon" 
                            title="Desactivar Acceso"
                          >
                            <Lock size={16} color="#ef4444" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModalNuevo && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield size={18} color="#0284c7" /> Registrar Nuevo Usuario
              </h3>
              <button onClick={() => setShowModalNuevo(false)} className="btn-ghost-icon"><X size={20} /></button>
            </div>
            <form onSubmit={handleCrearUsuario} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div className="form-group">
                <label className="form-label">Nombre de Usuario (Login)</label>
                <input 
                  required 
                  placeholder="carlos_mecanico" 
                  value={formNuevo.nombreUsuario} 
                  onChange={e => setFormNuevo({ ...formNuevo, nombreUsuario: e.target.value })} 
                  className="form-input" 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input 
                  type="email" 
                  required 
                  placeholder="carlos@carfix.com" 
                  value={formNuevo.email} 
                  onChange={e => setFormNuevo({ ...formNuevo, email: e.target.value })} 
                  className="form-input" 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Contraseña Temporal</label>
                <input 
                  type="password" 
                  required 
                  placeholder="••••••••" 
                  value={formNuevo.password} 
                  onChange={e => setFormNuevo({ ...formNuevo, password: e.target.value })} 
                  className="form-input" 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Rol / Grupo de Seguridad</label>
                <select 
                  value={formNuevo.grupoId} 
                  onChange={e => setFormNuevo({ ...formNuevo, grupoId: e.target.value })} 
                  className="form-select"
                >
                  <option value="">-- Sin Grupo / Básico --</option>
                  {grupos.map(g => <option key={g.id} value={g.id}>{g.nombre} - {g.descripcion}</option>)}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModalNuevo(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">Crear Usuario</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModalPassword && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
                <Key size={18} color="#0284c7" /> Cambiar Contraseña: {usuarioSeleccionado?.nombreUsuario}
              </h3>
              <button onClick={() => setShowModalPassword(false)} className="btn-ghost-icon"><X size={20} /></button>
            </div>
            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div className="form-group">
                <label className="form-label">Nueva Contraseña</label>
                <input 
                  type="password" 
                  required 
                  placeholder="Ingresá la nueva clave" 
                  value={nuevoPassword} 
                  onChange={e => setNuevoPassword(e.target.value)} 
                  className="form-input" 
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModalPassword(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">Actualizar Clave</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}