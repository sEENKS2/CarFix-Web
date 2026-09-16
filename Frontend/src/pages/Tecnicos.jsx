import { useEffect, useState } from 'react';
import api from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { Plus, RefreshCw, X, Wrench, Edit, Trash2, Mail, BadgeCheck, ShieldAlert } from 'lucide-react';

export default function Tecnicos() {
  const { tieneRol } = useAuth();
  
  // Validamos acceso general (Solo Operadores y Admins)
  const tieneAccesoGeneral = tieneRol(['Operadores']);
  // Validamos permiso destructivo (Solo Admins)
  const esAdmin = tieneRol([]);

  const [tecnicos, setTecnicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const cargarTecnicos = async () => {
    if (!tieneAccesoGeneral) return;

    setLoading(true);
    setError('');
    try {
      const res = await api.get('/tecnicos');
      setTecnicos(res.data);
    } catch {
      setError('Error al sincronizar el personal técnico.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tieneAccesoGeneral) {
      cargarTecnicos();
    }
  }, [tieneAccesoGeneral]);

  // Pantalla de bloqueo si un técnico intenta entrar por URL directa
  if (!tieneAccesoGeneral) {
    return (
      <div style={styles.deniedContainer}>
        <ShieldAlert size={64} color="#ef4444" />
        <h2 style={styles.deniedTitle}>Acceso Restringido</h2>
        <p style={styles.deniedText}>
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
      } else {
        await api.post('/tecnicos', payload);
      }
      setShowModal(false);
      cargarTecnicos();
    } catch (err) {
      alert(err.response?.data || 'Error al guardar el técnico');
    }
  };

  const handleEliminar = async (id) => {
    if (!esAdmin) return;
    if (!window.confirm('¿Seguro que deseas dar de baja este técnico?')) return;
    try {
      await api.delete(`/tecnicos/${id}`);
      cargarTecnicos();
    } catch (err) {
      alert(err.response?.data || 'Error al eliminar');
    }
  };

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Equipo Técnico</h1>
          <p style={styles.subtitle}>Mecánicos y especialistas asignados al taller</p>
        </div>
        <div style={styles.headerActions}>
          <button onClick={cargarTecnicos} style={styles.btnSecondary}>
            <RefreshCw size={15} /> Refrescar
          </button>
          <button onClick={abrirModalNuevo} style={styles.btnPrimary}>
            <Plus size={16} /> Nuevo Técnico
          </button>
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.card}>
        {loading ? (
          <div style={styles.emptyState}>Cargando equipo técnico...</div>
        ) : tecnicos.length === 0 ? (
          <div style={styles.emptyState}>No hay técnicos registrados.</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>Nombre y Apellido</th>
                <th style={styles.th}>DNI</th>
                <th style={styles.th}>Correo Electrónico</th>
                <th style={styles.th}>Especialidad</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tecnicos.map((t, idx) => (
                <tr key={t.id || t.dni} style={{ ...styles.tr, backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                  <td style={styles.td}>
                    <div style={styles.cellFlex}>
                      <Wrench size={15} color="#0284c7" />
                      <strong style={{ color: '#0f172a' }}>{t.nombre} {t.apellido}</strong>
                    </div>
                  </td>
                  <td style={styles.td}>{t.dni}</td>
                  <td style={styles.td}>
                    {t.correo ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#475569' }}>
                        <Mail size={13} color="#64748b" /> {t.correo}
                      </span>
                    ) : '—'}
                  </td>
                  <td style={styles.td}>
                    <span style={styles.badgeEspecialidad}>
                      <BadgeCheck size={13} style={{ marginRight: '4px' }} />
                      {ESPECIALIDADES[t.especialidad] || t.especialidad || 'General'}
                    </span>
                  </td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>
                    <button onClick={() => abrirModalEditar(t)} style={styles.actionBtn} title="Editar">
                      <Edit size={16} color="#0284c7" />
                    </button>
                    
                    {/* Solo el Administrador ve el botón de eliminar */}
                    {esAdmin && (
                      <button onClick={() => handleEliminar(t.id)} style={styles.actionBtn} title="Eliminar">
                        <Trash2 size={16} color="#ef4444" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL ALTA/EDICIÓN */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: '#0f172a' }}>
                <Wrench size={20} color="#0284c7" /> {editando ? 'Modificar Técnico' : 'Nuevo Técnico'}
              </h3>
              <button onClick={() => setShowModal(false)} style={styles.iconBtn}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formRow}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Nombre</label>
                  <input
                    type="text"
                    required
                    placeholder="Carlos"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    style={styles.input}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Apellido</label>
                  <input
                    type="text"
                    required
                    placeholder="Gómez"
                    value={formData.apellido}
                    onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>DNI</label>
                  <input
                    type="number"
                    required
                    placeholder="35123456"
                    value={formData.dni}
                    onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                    style={styles.input}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Correo Electrónico</label>
                  <input
                    type="email"
                    placeholder="carlos@taller.com"
                    value={formData.correo}
                    onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Especialidad</label>
                <select
                  value={formData.especialidad}
                  onChange={(e) => setFormData({ ...formData, especialidad: parseInt(e.target.value, 10) })}
                  style={styles.select}
                >
                  {ESPECIALIDADES.map((esp, i) => (
                    <option key={i} value={i}>{esp}</option>
                  ))}
                </select>
              </div>

              <div style={styles.modalActions}>
                <button type="button" onClick={() => setShowModal(false)} style={styles.btnSecondary}>Cancelar</button>
                <button type="submit" style={styles.btnPrimary}>
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
  badgeEspecialidad: { display: 'inline-flex', alignItems: 'center', padding: '0.2rem 0.55rem', backgroundColor: '#eff6ff', color: '#0284c7', border: '1px solid #bae6fd', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: '#64748b' },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: '#ffffff', borderRadius: '12px', padding: '1.5rem', width: '100%', maxWidth: '520px', boxSizing: 'border-box' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '0.85rem' },
  formRow: { display: 'flex', gap: '0.65rem' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, minWidth: 0 },
  label: { fontSize: '0.8rem', fontWeight: '600', color: '#334155' },
  input: { width: '100%', boxSizing: 'border-box', padding: '0.5rem 0.65rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', outline: 'none' },
  select: { width: '100%', boxSizing: 'border-box', padding: '0.5rem 0.65rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem' },
  deniedContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center' },
  deniedTitle: { marginTop: '1rem', fontSize: '1.5rem', color: '#0f172a' },
  deniedText: { color: '#64748b', marginTop: '0.5rem', maxWidth: '400px' }
};