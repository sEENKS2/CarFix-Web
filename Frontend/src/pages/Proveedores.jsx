import { useEffect, useState } from 'react';
import api from '../api/axiosClient';
import { Plus, RefreshCw, X, Truck, Edit, Trash2, Phone, Mail, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import ConfirmModal from '../components/ConfirmModal';

export default function Proveedores() {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [proveedorAEliminar, setProveedorAEliminar] = useState(null);

  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    email: '',
    direccion: '',
    cuit: ''
  });

  const cargarProveedores = async (mostrarToast = false) => {
    setLoading(true);
    try {
      const res = await api.get('/proveedores');
      setProveedores(res.data || []);
      if (mostrarToast) {
        toast.success('Lista de proveedores actualizada');
      }
    } catch {
      toast.error('Error al sincronizar la lista de proveedores');
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
        toast.success('Proveedor actualizado con éxito');
      } else {
        await api.post('/proveedores', formData);
        toast.success('Proveedor registrado con éxito');
      }
      setShowModal(false);
      cargarProveedores();
    } catch (err) {
      toast.error(err.response?.data || 'Error al guardar el proveedor');
    }
  };

  const confirmarEliminacion = async () => {
    if (!proveedorAEliminar) return;
    try {
      await api.delete(`/proveedores/${proveedorAEliminar.id}`);
      toast.success('Proveedor eliminado correctamente');
      cargarProveedores();
    } catch (err) {
      toast.error(err.response?.data || 'Error al eliminar el proveedor');
    } finally {
      setProveedorAEliminar(null);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Proveedores</h1>
          <p className="page-subtitle">Directorio y control de proveedores de repuestos e insumos</p>
        </div>
        <div className="header-actions">
          <button onClick={() => cargarProveedores(true)} className="btn-secondary">
            <RefreshCw size={15} /> Refrescar
          </button>
          <button onClick={abrirModalNuevo} className="btn-primary">
            <Plus size={16} /> Nuevo Proveedor
          </button>
        </div>
      </div>

      <div className="ui-card">
        {loading ? (
          <div className="empty-state">Cargando proveedores...</div>
        ) : proveedores.length === 0 ? (
          <div className="empty-state">No hay proveedores registrados.</div>
        ) : (
          <div className="ui-table-container">
            <table className="ui-table">
              <thead>
                <tr>
                  <th style={{ width: '150px' }}>CUIT</th>
                  <th>Razón Social</th>
                  <th>Contacto</th>
                  <th>Dirección</th>
                  <th style={{ width: '90px', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {proveedores.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.cuit || 'S/D'}</strong></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Truck size={15} color="#0284c7" />
                        <strong style={{ color: '#0f172a' }}>{p.nombre || p.razonSocial || '—'}</strong>
                      </div>
                    </td>
                    <td>
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
                    <td>
                      {p.direccion ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', color: '#475569' }}>
                          <MapPin size={14} color="#64748b" /> {p.direccion}
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <button onClick={() => abrirModalEditar(p)} className="btn-ghost-icon" title="Editar">
                          <Edit size={16} color="#0284c7" />
                        </button>
                        <button onClick={() => setProveedorAEliminar(p)} className="btn-ghost-icon" title="Eliminar">
                          <Trash2 size={16} color="#ef4444" />
                        </button>
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
                <Truck size={20} color="#0284c7" /> {editando ? 'Modificar Proveedor' : 'Nuevo Proveedor'}
              </h3>
              <button onClick={() => setShowModal(false)} className="btn-ghost-icon"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">CUIT</label>
                  <input
                    type="text"
                    required
                    placeholder="20-12345678-9"
                    value={formData.cuit}
                    onChange={(e) => setFormData({ ...formData, cuit: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Razón Social / Nombre</label>
                  <input
                    type="text"
                    required
                    placeholder="Distribuidora Repuestos S.A."
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Teléfono</label>
                  <input
                    type="text"
                    placeholder="341 555-4321"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    placeholder="ventas@proveedor.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Dirección</label>
                <input
                  type="text"
                  placeholder="Av. Pellegrini 1234"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">
                  {editando ? 'Guardar Cambios' : 'Crear Proveedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación para Baja */}
      <ConfirmModal
        isOpen={Boolean(proveedorAEliminar)}
        title="Dar de baja proveedor"
        message={`¿Seguro que deseas eliminar a "${proveedorAEliminar?.nombre || proveedorAEliminar?.razonSocial}"? Ya no estará disponible para nuevas órdenes de compra.`}
        confirmText="Eliminar Proveedor"
        variant="danger"
        onConfirm={confirmarEliminacion}
        onCancel={() => setProveedorAEliminar(null)}
      />
    </div>
  );
}