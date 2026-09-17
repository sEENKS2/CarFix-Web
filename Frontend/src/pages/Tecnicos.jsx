import { useEffect, useState } from 'react';
import api from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { Plus, RefreshCw, X, Wrench, Edit, Trash2, Mail, BadgeCheck, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

export default function Tecnicos() {
  const { tieneRol } = useAuth();
  
  const tieneAccesoGeneral = tieneRol(['Operadores']);
  const esAdmin = tieneRol(['Administradores']);

  const [tecnicos, setTecnicos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    correo: '',
    especialidad: 0
  });

  const ESPECIALIDADES = [
    'Mecánica General',
    'Electricidad / Electrónica',
    'Chapa y Pintura',
    'Inyección / Diagnóstico',
    'Frenos y Suspensión'
  ];

  const cargarTecnicos = async (mostrarToast = false) => {
    if (!tieneAccesoGeneral) return;

    setLoading(true);
    try {
      const res = await api.get('/tecnicos');
      setTecnicos(res.data || []);
      if (mostrarToast) {
        toast.success('Equipo técnico actualizado');
      }
    } catch {
      toast.error('Error al sincronizar el personal técnico');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tieneAccesoGeneral) {
      cargarTecnicos();
    }
  }, [tieneAccesoGeneral]);

  if (!tieneAccesoGeneral) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center' }}>
        <ShieldAlert size={64} color="#ef4444" />
        <h2 style={{ marginTop: '1rem', fontSize: '1.5rem', color: '#0f172a' }}>Acceso Restringido</h2>
        <p style={{ color: '#64748b', marginTop: '0.5rem', maxWidth: '400px' }}>
          Tu perfil no cuenta con los permisos necesarios para gestionar el personal técnico del taller.
        </p>
      </div>
    );
  }

  const abrirModalNuevo = () => {
    setEditando(null);
    setFormData({ nombre: '', apellido: '', dni: '', correo: '', especialidad: 0 });
    setShowModal(true);
  };

  const abrirModalEditar = (tec) => {
    setEditando(tec);
    setFormData({
      nombre: tec.nombre || '',
      apellido: tec.apellido || '',
      dni: tec.dni || '',
      correo: tec.correo || '',
      especialidad: typeof tec.especialidad === 'number' ? tec.especialidad : 0
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        dni: parseInt(formData.dni, 10),
        especialidad: parseInt(formData.especialidad, 10)
      };

      if (editando) {
        await api.put(`/tecnicos/${editando.id}`, payload);
        toast.success('Técnico actualizado con éxito');
      } else {
        await api.post('/tecnicos', payload);
        toast.success('Técnico registrado con éxito');
      }
      setShowModal(false);
      cargarTecnicos();
    } catch (err) {
      toast.error(err.response?.data || 'Error al guardar el técnico');
    }
  };

  const handleEliminar = async (id) => {
    if (!esAdmin) return;
    if (!window.confirm('¿Seguro que deseas dar de baja este técnico?')) return;
    try {
      await api.delete(`/tecnicos/${id}`);
      toast.success('Técnico dado de baja');
      cargarTecnicos();
    } catch (err) {
      toast.error(err.response?.data || 'Error al eliminar el técnico');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Equipo Técnico</h1>
          <p className="page-subtitle">Mecánicos y especialistas asignados al taller</p>
        </div>
        <div className="header-actions">
          <button onClick={() => cargarTecnicos(true)} className="btn-secondary">
            <RefreshCw size={15} /> Refrescar
          </button>
          <button onClick={abrirModalNuevo} className="btn-primary">
            <Plus size={16} /> Nuevo Técnico
          </button>
        </div>
      </div>

      <div className="ui-card">
        {loading ? (
          <div className="empty-state">Cargando equipo técnico...</div>
        ) : tecnicos.length === 0 ? (
          <div className="empty-state">No hay técnicos registrados.</div>
        ) : (
          <div className="ui-table-container">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Nombre y Apellido</th>
                  <th style={{ width: '130px' }}>DNI</th>
                  <th>Correo Electrónico</th>
                  <th>Especialidad</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tecnicos.map((t) => (
                  <tr key={t.id || t.dni}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Wrench size={15} color="#0284c7" />
                        <strong style={{ color: '#0f172a' }}>{t.nombre} {t.apellido}</strong>
                      </div>
                    </td>
                    <td>{t.dni}</td>
                    <td>
                      {t.correo ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#475569' }}>
                          <Mail size={13} color="#64748b" /> {t.correo}
                        </span>
                      ) : '—'}
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0.2rem 0.55rem', backgroundColor: '#eff6ff', color: '#0284c7', border: '1px solid #bae6fd', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                        <BadgeCheck size={13} style={{ marginRight: '4px' }} />
                        {ESPECIALIDADES[t.especialidad] || t.especialidad || 'General'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <button onClick={() => abrirModalEditar(t)} className="btn-ghost-icon" title="Editar">
                          <Edit size={16} color="#0284c7" />
                        </button>
                        
                        {esAdmin && (
                          <button onClick={() => handleEliminar(t.id)} className="btn-ghost-icon" title="Eliminar">
                            <Trash2 size={16} color="#ef4444" />
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

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Wrench size={20} color="#0284c7" /> {editando ? 'Modificar Técnico' : 'Nuevo Técnico'}
              </h3>
              <button onClick={() => setShowModal(false)} className="btn-ghost-icon"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Nombre</label>
                  <input
                    type="text"
                    required
                    placeholder="Carlos"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Apellido</label>
                  <input
                    type="text"
                    required
                    placeholder="Gómez"
                    value={formData.apellido}
                    onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">DNI</label>
                  <input
                    type="number"
                    required
                    placeholder="35123456"
                    value={formData.dni}
                    onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Correo Electrónico</label>
                  <input
                    type="email"
                    placeholder="carlos@taller.com"
                    value={formData.correo}
                    onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Especialidad</label>
                <select
                  value={formData.especialidad}
                  onChange={(e) => setFormData({ ...formData, especialidad: parseInt(e.target.value, 10) })}
                  className="form-select"
                >
                  {ESPECIALIDADES.map((esp, i) => (
                    <option key={i} value={i}>{esp}</option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">
                  {editando ? 'Guardar Cambios' : 'Registrar Técnico'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}