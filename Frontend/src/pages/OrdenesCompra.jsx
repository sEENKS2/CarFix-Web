import { useEffect, useState } from 'react';
import api from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { Plus, RefreshCw, CheckCircle, Clock, X, Trash2, ShoppingCart, ShieldAlert } from 'lucide-react';

export default function OrdenesCompra() {
  const { tieneRol } = useAuth();
  
  // Solo los Operadores (y el Administrador por bypass) pueden gestionar compras y recepciones
  const tieneAccesoGeneral = tieneRol(['Operadores']);

  const [ordenes, setOrdenes] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [proveedorId, setProveedorId] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [detalles, setDetalles] = useState([
    { productoId: '', cantidad: 1, precioUnitario: 0 }
  ]);

  const cargarDatos = async () => {
    if (!tieneAccesoGeneral) return;

    setLoading(true);
    setError('');
    try {
      const [resOrdenes, resProv, resProd] = await Promise.all([
        api.get('/ordenescompra').catch(() => ({ data: [] })),
        api.get('/proveedores').catch(() => ({ data: [] })),
        api.get('/productos').catch(() => ({ data: [] }))
      ]);
      setOrdenes(resOrdenes.data);
      setProveedores(resProv.data);
      setProductos(resProd.data);
    } catch {
      setError('Error al sincronizar datos de compras.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tieneAccesoGeneral) {
      cargarDatos();
    }
  }, [tieneAccesoGeneral]);

  // Pantalla de bloqueo si entra un Técnico por URL directa
  if (!tieneAccesoGeneral) {
    return (
      <div style={styles.deniedContainer}>
        <ShieldAlert size={64} color="#ef4444" />
        <h2 style={styles.deniedTitle}>Acceso Restringido</h2>
        <p style={styles.deniedText}>
          Tu perfil técnico no cuenta con permisos para gestionar órdenes de compra, reposición de inventario o proveedores.
        </p>
      </div>
    );
  }

  const handleAddFila = () => {
    setDetalles([...detalles, { productoId: '', cantidad: 1, precioUnitario: 0 }]);
  };

  const handleRemoveFila = (index) => {
    setDetalles(detalles.filter((_, i) => i !== index));
  };

  const handleProductoChange = (index, prodId) => {
    const prodSeleccionado = productos.find((p) => p.id === parseInt(prodId, 10));
    const nuevosDetalles = [...detalles];
    nuevosDetalles[index] = {
      ...nuevosDetalles[index],
      productoId: prodId,
      precioUnitario: prodSeleccionado ? prodSeleccionado.precioUnitario : 0
    };
    setDetalles(nuevosDetalles);
  };

  const handleDetalleChange = (index, campo, valor) => {
    const nuevosDetalles = [...detalles];
    nuevosDetalles[index][campo] = valor;
    setDetalles(nuevosDetalles);
  };

  const calcularTotal = () => {
    return detalles.reduce((acc, curr) => acc + (curr.cantidad * curr.precioUnitario || 0), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!proveedorId) {
      alert('Seleccioná un proveedor.');
      return;
    }
    if (detalles.some((d) => !d.productoId || d.cantidad <= 0)) {
      alert('Completá correctamente todos los ítems de la orden.');
      return;
    }

    const payload = {
      proveedorId: parseInt(proveedorId, 10),
      observaciones: observaciones,
      detalles: detalles.map((d) => ({
        productoId: parseInt(d.productoId, 10),
        cantidad: parseInt(d.cantidad, 10),
        precioUnitario: parseFloat(d.precioUnitario)
      }))
    };

    try {
      await api.post('/ordenescompra', payload);
      setShowModal(false);
      setProveedorId('');
      setObservaciones('');
      setDetalles([{ productoId: '', cantidad: 1, precioUnitario: 0 }]);
      cargarDatos();
    } catch (err) {
      alert(err.response?.data || 'Error al emitir la orden de compra');
    }
  };

  const handleRecepcionar = async (id) => {
    if (!window.confirm('¿Confirmar recepción de mercadería? Se sumará automáticamente al inventario.')) return;
    try {
      await api.put(`/ordenescompra/${id}/estado`, { estado: 2, nuevoEstado: 2 });
      cargarDatos();
    } catch (err) {
      alert(err.response?.data || 'Error al recepcionar la orden');
    }
  };

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Órdenes de Compra</h1>
          <p style={styles.subtitle}>Gestión de pedidos de reposición y compras a proveedores</p>
        </div>
        <div style={styles.headerActions}>
          <button onClick={cargarDatos} style={styles.btnSecondary}>
            <RefreshCw size={15} /> Refrescar
          </button>
          <button onClick={() => setShowModal(true)} style={styles.btnPrimary}>
            <Plus size={16} /> Nueva Orden
          </button>
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.card}>
        {loading ? (
          <div style={styles.emptyState}>Cargando órdenes de compra...</div>
        ) : ordenes.length === 0 ? (
          <div style={styles.emptyState}>No hay órdenes de compra registradas.</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>Nro</th>
                <th style={styles.th}>Fecha</th>
                <th style={styles.th}>Proveedor</th>
                <th style={styles.th}>Total</th>
                <th style={styles.th}>Estado</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ordenes.map((o, idx) => {
                const esRecibida = o.estado === 2 || o.estado === 'Recibida' || o.recibida;
                const fechaRaw = o.fechaCreacion || o.fechaEmision || o.fecha;
                const fechaTexto = fechaRaw ? new Date(fechaRaw).toLocaleDateString('es-AR') : '—';
                const nombreProveedor = o.proveedor?.nombre || o.proveedor?.razonSocial || (o.proveedorId ? `Proveedor #${o.proveedorId}` : 'S/D');

                return (
                  <tr key={o.id} style={{ ...styles.tr, backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td style={styles.td}><strong>{o.numero || `#OC-${o.id}`}</strong></td>
                    <td style={styles.td}>{fechaTexto}</td>
                    <td style={{ ...styles.td, fontWeight: '500', color: '#0f172a' }}>{nombreProveedor}</td>
                    <td style={{ ...styles.td, fontWeight: '600', color: '#0f172a' }}>
                      ${Number(o.total || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        backgroundColor: esRecibida ? '#ecfdf5' : '#fffbeb',
                        color: esRecibida ? '#059669' : '#b45309',
                        border: `1px solid ${esRecibida ? '#a7f3d0' : '#fde68a'}`
                      }}>
                        {esRecibida ? <CheckCircle size={13} style={{ marginRight: '4px' }} /> : <Clock size={13} style={{ marginRight: '4px' }} />}
                        {esRecibida ? 'Recibida' : 'Pendiente'}
                      </span>
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      {!esRecibida && (
                        <button onClick={() => handleRecepcionar(o.id)} style={styles.btnAction}>
                          Recepcionar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL ALTA ORDEN */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: '#0f172a' }}>
                <ShoppingCart size={20} color="#0284c7" /> Nueva Orden de Compra
              </h3>
              <button onClick={() => setShowModal(false)} style={styles.iconBtn}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Proveedor</label>
                <select
                  required
                  value={proveedorId}
                  onChange={(e) => setProveedorId(e.target.value)}
                  style={styles.select}
                >
                  <option value="" style={styles.option}>-- Seleccione Proveedor --</option>
                  {proveedores.map((p) => (
                    <option key={p.id} value={p.id} style={styles.option}>
                      {p.nombre || p.razonSocial} (CUIT: {p.cuit || 'S/D'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ ...styles.label, marginBottom: '0.4rem', display: 'block' }}>Ítems a Solicitar</label>
                {detalles.map((det, index) => (
                  <div key={index} style={styles.formRow}>
                    <select
                      required
                      value={det.productoId}
                      onChange={(e) => handleProductoChange(index, e.target.value)}
                      style={{ ...styles.select, flex: 3 }}
                    >
                      <option value="" style={styles.option}>-- Repuesto / Producto --</option>
                      {productos.map((p) => (
                        <option key={p.id} value={p.id} style={styles.option}>
                          {p.nombre} ({p.codigo})
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min="1"
                      placeholder="Cant."
                      required
                      value={det.cantidad}
                      onChange={(e) => handleDetalleChange(index, 'cantidad', parseInt(e.target.value, 10) || 1)}
                      style={{ ...styles.input, width: '75px', textAlign: 'center' }}
                    />

                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Precio U."
                      required
                      value={det.precioUnitario}
                      onChange={(e) => handleDetalleChange(index, 'precioUnitario', parseFloat(e.target.value) || 0)}
                      style={{ ...styles.input, width: '100px', textAlign: 'right' }}
                    />

                    {detalles.length > 1 && (
                      <button type="button" onClick={() => handleRemoveFila(index)} style={styles.iconBtn}>
                        <Trash2 size={16} color="#ef4444" />
                      </button>
                    )}
                  </div>
                ))}

                <button type="button" onClick={handleAddFila} style={{ ...styles.btnSecondary, marginTop: '0.4rem', fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
                  + Agregar Producto
                </button>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Observaciones (opcional)</label>
                <input
                  type="text"
                  placeholder="Instrucciones de entrega, etc."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={{ textAlign: 'right', marginTop: '0.5rem', fontSize: '1.1rem', fontWeight: 'bold', color: '#0f172a' }}>
                Total Estimado: ${calcularTotal().toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </div>

              <div style={styles.modalActions}>
                <button type="button" onClick={() => setShowModal(false)} style={styles.btnSecondary}>Cancelar</button>
                <button type="submit" style={styles.btnPrimary}>Emitir Orden</button>
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
  btnAction: { backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' },
  card: { backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.07)', overflow: 'hidden' },
  error: { padding: '0.75rem 1rem', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' },
  emptyState: { padding: '3rem', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' },
  thRow: { backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
  th: { padding: '0.85rem 1rem', color: '#475569', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '0.9rem 1rem', fontSize: '0.875rem', verticalAlign: 'middle' },
  badge: { display: 'inline-flex', alignItems: 'center', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: '#64748b' },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: '#ffffff', borderRadius: '12px', padding: '1.5rem', width: '100%', maxWidth: '620px', boxSizing: 'border-box', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '0.85rem' },
  formRow: { display: 'flex', gap: '0.5rem', width: '100%', boxSizing: 'border-box', alignItems: 'center', marginBottom: '0.4rem' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '0.25rem', width: '100%', boxSizing: 'border-box' },
  label: { fontSize: '0.8rem', fontWeight: '600', color: '#334155' },
  input: { boxSizing: 'border-box', padding: '0.5rem 0.65rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', backgroundColor: '#ffffff', color: '#0f172a', outline: 'none' },
  select: { boxSizing: 'border-box', padding: '0.5rem 0.65rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', backgroundColor: '#ffffff', color: '#0f172a', outline: 'none', cursor: 'pointer' },
  option: { color: '#0f172a', backgroundColor: '#ffffff' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem' },
  deniedContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center' },
  deniedTitle: { marginTop: '1rem', fontSize: '1.5rem', color: '#0f172a' },
  deniedText: { color: '#64748b', marginTop: '0.5rem', maxWidth: '400px' }
};