import { useEffect, useState } from 'react';
import api from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { Plus, RefreshCw, X, Package, Edit, Trash2, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function Productos() {
  const { tieneRol } = useAuth();
  
  // Nivel 1: Acceso de lectura (Operadores, Técnicos y Admins)
  const tieneAccesoView = tieneRol(['Operadores', 'Tecnicos']);
  // Nivel 2: Edición y Creación (Operadores y Admins)
  const puedeEditar = tieneRol(['Operadores']);
  // Nivel 3: Eliminación (Solo Admins)
  const esAdmin = tieneRol([]);

  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);

  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    categoria: '',
    precioUnitario: 0,
    stockMinimo: 0,
    stockActual: 0
  });

  const cargarProductos = async () => {
    if (!tieneAccesoView) return;
    
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/productos');
      setProductos(res.data);
    } catch {
      setError('Error al sincronizar el inventario.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tieneAccesoView) {
      cargarProductos();
    }
  }, [tieneAccesoView]);

  // Pantalla de bloqueo de seguridad si el rol no tiene ningún acceso
  if (!tieneAccesoView) {
    return (
      <div style={styles.deniedContainer}>
        <ShieldAlert size={64} color="#ef4444" />
        <h2 style={styles.deniedTitle}>Acceso Restringido</h2>
        <p style={styles.deniedText}>
          Tu perfil no cuenta con los permisos necesarios para visualizar el catálogo de inventario.
        </p>
      </div>
    );
  }

  const abrirModalNuevo = () => {
    setEditando(null);
    setFormData({
      codigo: '',
      nombre: '',
      descripcion: '',
      categoria: '',
      precioUnitario: 0,
      stockMinimo: 5,
      stockActual: 0
    });
    setShowModal(true);
  };

  const abrirModalEditar = (prod) => {
    setEditando(prod);
    setFormData({
      codigo: prod.codigo || '',
      nombre: prod.nombre || '',
      descripcion: prod.descripcion || '',
      categoria: prod.categoria || '',
      precioUnitario: prod.precioUnitario || 0,
      stockMinimo: prod.stockMinimo || 0,
      stockActual: prod.stockActual || 0
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!puedeEditar) return;
    
    try {
      if (editando) {
        await api.put(`/productos/${editando.id}`, formData);
      } else {
        await api.post('/productos', formData);
      }
      setShowModal(false);
      cargarProductos();
    } catch (err) {
      alert(err.response?.data || 'Error al guardar el producto');
    }
  };

  const handleEliminar = async (id) => {
    if (!esAdmin) return;
    if (!window.confirm('¿Seguro que deseas eliminar este producto?')) return;
    try {
      await api.delete(`/productos/${id}`);
      cargarProductos();
    } catch (err) {
      alert(err.response?.data || 'Error al eliminar');
    }
  };

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Inventario y Stock</h1>
          <p style={styles.subtitle}>Catálogo de repuestos, precios y niveles de stock</p>
        </div>
        <div style={styles.headerActions}>
          <button onClick={cargarProductos} style={styles.btnSecondary}>
            <RefreshCw size={15} /> Refrescar
          </button>
          
          {/* Solo Operadores y Admins pueden crear un nuevo producto */}
          {puedeEditar && (
            <button onClick={abrirModalNuevo} style={styles.btnPrimary}>
              <Plus size={16} /> Nuevo Producto
            </button>
          )}
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.card}>
        {loading ? (
          <div style={styles.emptyState}>Cargando catálogo de productos...</div>
        ) : productos.length === 0 ? (
          <div style={styles.emptyState}>No hay productos cargados en inventario.</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>Código</th>
                <th style={styles.th}>Producto</th>
                <th style={styles.th}>Categoría</th>
                <th style={styles.th}>Precio Unit.</th>
                <th style={styles.th}>Stock Actual</th>
                <th style={styles.th}>Stock Mín.</th>
                
                {/* Ocultamos la columna completa de acciones si es un técnico (no puede ni editar ni borrar) */}
                {(puedeEditar || esAdmin) && (
                  <th style={{ ...styles.th, textAlign: 'center' }}>Acciones</th>
                )}
              </tr>
            </thead>
            <tbody>
              {productos.map((p, idx) => {
                const stockBajo = p.stockActual <= p.stockMinimo;
                return (
                  <tr key={p.id} style={{ ...styles.tr, backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td style={styles.td}><strong>{p.codigo}</strong></td>
                    <td style={styles.td}>
                      <div style={styles.cellFlex}>
                        <Package size={15} color="#0284c7" />
                        <div>
                          <strong style={{ color: '#0f172a' }}>{p.nombre}</strong>
                          {p.descripcion && <p style={{ margin: 0, color: '#64748b', fontSize: '0.8rem' }}>{p.descripcion}</p>}
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}><span style={styles.categoryTag}>{p.categoria || 'General'}</span></td>
                    <td style={{ ...styles.td, fontWeight: '600', color: '#0f172a' }}>
                      ${Number(p.precioUnitario || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        backgroundColor: stockBajo ? '#fef2f2' : '#ecfdf5',
                        color: stockBajo ? '#dc2626' : '#059669',
                        border: `1px solid ${stockBajo ? '#fecaca' : '#a7f3d0'}`
                      }}>
                        {stockBajo && <AlertTriangle size={12} style={{ marginRight: '4px' }} />}
                        {p.stockActual} u.
                      </span>
                    </td>
                    <td style={{ ...styles.td, color: '#64748b' }}>{p.stockMinimo} u.</td>
                    
                    {(puedeEditar || esAdmin) && (
                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        {puedeEditar && (
                          <button onClick={() => abrirModalEditar(p)} style={styles.actionBtn} title="Editar">
                            <Edit size={16} color="#0284c7" />
                          </button>
                        )}
                        {esAdmin && (
                          <button onClick={() => handleEliminar(p.id)} style={styles.actionBtn} title="Eliminar">
                            <Trash2 size={16} color="#ef4444" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL ALTA/EDICIÓN - Solo accesible si puedeEditar */}
      {(showModal && puedeEditar) && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: '#0f172a' }}>
                <Package size={20} color="#0284c7" /> {editando ? 'Modificar Producto' : 'Nuevo Producto'}
              </h3>
              <button onClick={() => setShowModal(false)} style={styles.iconBtn}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formRow}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Código</label>
                  <input
                    type="text"
                    required
                    placeholder="P001"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    style={styles.input}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Categoría</label>
                  <input
                    type="text"
                    placeholder="Filtros, Frenos, Aceites..."
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Nombre del Producto</label>
                <input
                  type="text"
                  required
                  placeholder="Filtro de Aceite Universal"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  style={styles.input}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Descripción</label>
                <input
                  type="text"
                  placeholder="Detalle o compatibilidad..."
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  style={styles.input}
                />
              </div>

              <div style={styles.formRow}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Precio Unitario ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.precioUnitario}
                    onChange={(e) => setFormData({ ...formData, precioUnitario: parseFloat(e.target.value) || 0 })}
                    style={styles.input}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Stock Mínimo</label>
                  <input
                    type="number"
                    required
                    value={formData.stockMinimo}
                    onChange={(e) => setFormData({ ...formData, stockMinimo: parseInt(e.target.value, 10) || 0 })}
                    style={styles.input}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Stock Actual</label>
                  <input
                    type="number"
                    required
                    value={formData.stockActual}
                    onChange={(e) => setFormData({ ...formData, stockActual: parseInt(e.target.value, 10) || 0 })}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.modalActions}>
                <button type="button" onClick={() => setShowModal(false)} style={styles.btnSecondary}>Cancelar</button>
                <button type="submit" style={styles.btnPrimary}>
                  {editando ? 'Guardar Cambios' : 'Crear Producto'}
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
  categoryTag: { backgroundColor: '#f1f5f9', color: '#475569', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '500' },
  badge: { display: 'inline-flex', alignItems: 'center', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: '#64748b' },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: '#ffffff', borderRadius: '12px', padding: '1.5rem', width: '100%', maxWidth: '540px', boxSizing: 'border-box', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '0.85rem' },
  formRow: { display: 'flex', gap: '0.65rem' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, minWidth: 0 },
  label: { fontSize: '0.8rem', fontWeight: '600', color: '#334155' },
  input: { width: '100%', boxSizing: 'border-box', padding: '0.5rem 0.65rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', backgroundColor: '#ffffff', color: '#0f172a', outline: 'none' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem' },
  deniedContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center' },
  deniedTitle: { marginTop: '1rem', fontSize: '1.5rem', color: '#0f172a' },
  deniedText: { color: '#64748b', marginTop: '0.5rem', maxWidth: '400px' }
};