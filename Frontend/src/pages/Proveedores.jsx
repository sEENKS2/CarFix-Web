import { useEffect, useState } from 'react';
import api from '../api/axiosClient';
import { Plus, RefreshCw, X, Truck, Edit, Trash2, Phone, Mail, MapPin } from 'lucide-react';

export default function Proveedores() {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);

  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    email: '',
    direccion: '',
    cuit: ''
  });

  const cargarProveedores = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/proveedores');
      setProveedores(res.data);
    } catch {
      setError('Error al sincronizar la lista de proveedores.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarProveedores();
  }, []);

  const abrirModalNuevo = () => {
    setEditando(null);
    setFormData({ nombre: '', telefono: '', email: '', direccion: '', cuit: '' });
    setShowModal(true);
  };

  const abrirModalEditar = (prov) => {
    setEditando(prov);
    setFormData({
      nombre: prov.nombre || prov.razonSocial || '',
      telefono: prov.telefono || '',
      email: prov.email || '',
      direccion: prov.direccion || '',
      cuit: prov.cuit || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editando) {
        await api.put(`/proveedores/${editando.id}`, formData);
      } else {
        await api.post('/proveedores', formData);
      }
      setShowModal(false);
      cargarProveedores();
    } catch (err) {
      alert(err.response?.data || 'Error al guardar el proveedor');
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Seguro que deseas dar de baja este proveedor?')) return;
    try {
      await api.delete(`/proveedores/${id}`);
      cargarProveedores();
    } catch (err) {
      alert(err.response?.data || 'Error al eliminar');
    }
  };

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Proveedores</h1>
          <p style={styles.subtitle}>Directorio y control de proveedores de repuestos e insumos</p>
        </div>
        <div style={styles.headerActions}>
          <button onClick={cargarProveedores} style={styles.btnSecondary}>
            <RefreshCw size={15} /> Refrescar
          </button>
          <button onClick={abrirModalNuevo} style={styles.btnPrimary}>
            <Plus size={16} /> Nuevo Proveedor
          </button>
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.card}>
        {loading ? (
          <div style={styles.emptyState}>Cargando proveedores...</div>
        ) : proveedores.length === 0 ? (
          <div style={styles.emptyState}>No hay proveedores registrados.</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>CUIT</th>
                <th style={styles.th}>Razón Social</th>
                <th style={styles.th}>Contacto</th>
                <th style={styles.th}>Dirección</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {proveedores.map((p, idx) => (
                <tr key={p.id} style={{ ...styles.tr, backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                  <td style={styles.td}><strong>{p.cuit || 'S/D'}</strong></td>
                  <td style={styles.td}>
                    <div style={styles.cellFlex}>
                      <Truck size={15} color="#0284c7" />
                      <strong style={{ color: '#0f172a' }}>{p.nombre || p.razonSocial || '—'}</strong>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '0.8rem' }}>
                      {p.telefono && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#475569' }}>
                          <Phone size={13} color="#64748b" /> {p.telefono}
                        </span>
                      )}
                      {p.email && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#475569' }}>
                          <Mail size={13} color="#64748b" /> {p.email}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={styles.td}>
                    {p.direccion ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', color: '#475569' }}>
                        <MapPin size={14} color="#64748b" /> {p.direccion}
                      </span>
                    ) : '—'}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>
                    <button onClick={() => abrirModalEditar(p)} style={styles.actionBtn} title="Editar">
                      <Edit size={16} color="#0284c7" />
                    </button>
                    <button onClick={() => handleEliminar(p.id)} style={styles.actionBtn} title="Eliminar">
                      <Trash2 size={16} color="#ef4444" />
                    </button>
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
                <Truck size={20} color="#0284c7" /> {editando ? 'Modificar Proveedor' : 'Nuevo Proveedor'}
              </h3>
              <button onClick={() => setShowModal(false)} style={styles.iconBtn}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formRow}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>CUIT</label>
                  <input
                    type="text"
                    required
                    placeholder="20-12345678-9"
                    value={formData.cuit}
                    onChange={(e) => setFormData({ ...formData, cuit: e.target.value })}
                    style={styles.input}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Razón Social / Nombre</label>
                  <input
                    type="text"
                    required
                    placeholder="Distribuidora Repuestos S.A."
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Teléfono</label>
                  <input
                    type="text"
                    placeholder="341 555-4321"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    style={styles.input}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Email</label>
                  <input
                    type="email"
                    placeholder="ventas@proveedor.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Dirección</label>
                <input
                  type="text"
                  placeholder="Av. Pellegrini 1234"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  style={styles.input}
                />
              </div>

              <div style={styles.modalActions}>
                <button type="button" onClick={() => setShowModal(false)} style={styles.btnSecondary}>Cancelar</button>
                <button type="submit" style={styles.btnPrimary}>
                  {editando ? 'Guardar Cambios' : 'Crear Proveedor'}
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
  btnPrimary: { display: 'flex', alignItems: 'center', gap: '0.45rem', backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' },
  btnSecondary: { display: 'flex', alignItems: 'center', gap: '0.45rem', backgroundColor: '#ffffff', color: '#334155', border: '1px solid #cbd5e1', padding: '0.5rem 0.9rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' },
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
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: '#64748b' },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: '#ffffff', borderRadius: '12px', padding: '1.5rem', width: '100%', maxWidth: '520px', boxSizing: 'border-box', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '0.85rem' },
  formRow: { display: 'flex', gap: '0.65rem' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, minWidth: 0 },
  label: { fontSize: '0.8rem', fontWeight: '600', color: '#334155' },
  input: { width: '100%', boxSizing: 'border-box', padding: '0.5rem 0.65rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', backgroundColor: '#ffffff', color: '#0f172a', outline: 'none' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem' }
};