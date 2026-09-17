import { useEffect, useState, useMemo } from 'react';
import api from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { Plus, RefreshCw, CheckCircle, Clock, X, Trash2, ShoppingCart, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import ConfirmModal from '../components/ConfirmModal';
import SearchableSelect from '../components/SearchableSelect';

export default function OrdenesCompra() {
  const { tieneRol } = useAuth();
  const tieneAccesoGeneral = tieneRol(['Operadores']);

  const [ordenes, setOrdenes] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [proveedorId, setProveedorId] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [detalles, setDetalles] = useState([
    { productoId: '', cantidad: 1, precioUnitario: 0 }
  ]);

  const [ordenARecepcionar, setOrdenARecepcionar] = useState(null);

  const cargarDatos = async (mostrarToast = false) => {
    if (!tieneAccesoGeneral) return;

    setLoading(true);
    try {
      const [resOrdenes, resProv, resProd] = await Promise.all([
        api.get('/ordenescompra').catch(() => ({ data: [] })),
        api.get('/proveedores').catch(() => ({ data: [] })),
        api.get('/productos').catch(() => ({ data: [] }))
      ]);
      setOrdenes(resOrdenes.data || []);
      setProveedores(resProv.data || []);
      setProductos(resProd.data || []);

      if (mostrarToast) {
        toast.success('Órdenes de compra actualizadas');
      }
    } catch {
      toast.error('Error al sincronizar datos de compras');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tieneAccesoGeneral) {
      cargarDatos();
    }
  }, [tieneAccesoGeneral]);

  // Opciones formateadas para los SearchableSelects
  const opcionesProveedores = useMemo(() => {
    return proveedores.map(p => ({
      value: p.id,
      label: p.nombre || p.razonSocial,
      sublabel: p.cuit ? `CUIT: ${p.cuit}` : ''
    }));
  }, [proveedores]);

  const opcionesProductos = useMemo(() => {
    return productos.map(p => ({
      value: p.id,
      label: `${p.codigo} - ${p.nombre}`,
      sublabel: `Stock: ${p.stockActual}`
    }));
  }, [productos]);

  if (!tieneAccesoGeneral) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center' }}>
        <ShieldAlert size={64} color="#ef4444" />
        <h2 style={{ marginTop: '1rem', fontSize: '1.5rem', color: '#0f172a' }}>Acceso Restringido</h2>
        <p style={{ color: '#64748b', marginTop: '0.5rem', maxWidth: '400px' }}>
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
      toast.warning('Por favor, busca y selecciona un proveedor');
      return;
    }
    if (detalles.some((d) => !d.productoId || d.cantidad <= 0)) {
      toast.warning('Completa correctamente todos los ítems de la orden');
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
      toast.success('Orden de compra emitida correctamente');
      setShowModal(false);
      setProveedorId('');
      setObservaciones('');
      setDetalles([{ productoId: '', cantidad: 1, precioUnitario: 0 }]);
      cargarDatos();
    } catch (err) {
      toast.error(err.response?.data || 'Error al emitir la orden de compra');
    }
  };

  const confirmarRecepcion = async () => {
    if (!ordenARecepcionar) return;
    try {
      await api.put(`/ordenescompra/${ordenARecepcionar.id}/estado`, { estado: 2, nuevoEstado: 2 });
      toast.success('Mercadería recepcionada e ingresada al stock');
      cargarDatos();
    } catch (err) {
      toast.error(err.response?.data || 'Error al recepcionar la orden');
    } finally {
      setOrdenARecepcionar(null);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Órdenes de Compra</h1>
          <p className="page-subtitle">Gestión de pedidos de reposición y compras a proveedores</p>
        </div>
        <div className="header-actions">
          <button onClick={() => cargarDatos(true)} className="btn-secondary">
            <RefreshCw size={15} /> Refrescar
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus size={16} /> Nueva Orden
          </button>
        </div>
      </div>

      <div className="ui-card">
        {loading ? (
          <div className="empty-state">Cargando órdenes de compra...</div>
        ) : ordenes.length === 0 ? (
          <div className="empty-state">No hay órdenes de compra registradas.</div>
        ) : (
          <div className="ui-table-container">
            <table className="ui-table">
              <thead>
                <tr>
                  <th style={{ width: '100px' }}>Nro</th>
                  <th style={{ width: '120px' }}>Fecha</th>
                  <th>Proveedor</th>
                  <th style={{ width: '140px' }}>Total</th>
                  <th style={{ width: '130px' }}>Estado</th>
                  <th style={{ width: '120px', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ordenes.map((o) => {
                  const esRecibida = o.estado === 2 || o.estado === 'Recibida' || o.recibida;
                  const fechaRaw = o.fechaCreacion || o.fechaEmision || o.fecha;
                  const fechaTexto = fechaRaw ? new Date(fechaRaw).toLocaleDateString('es-AR') : '—';
                  const nombreProveedor = o.proveedor?.nombre || o.proveedor?.razonSocial || (o.proveedorId ? `Proveedor #${o.proveedorId}` : 'S/D');

                  return (
                    <tr key={o.id}>
                      <td><strong>{o.numero || `#OC-${o.id}`}</strong></td>
                      <td>{fechaTexto}</td>
                      <td style={{ fontWeight: 500, color: '#0f172a' }}>{nombreProveedor}</td>
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>
                        ${Number(o.total || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        <span className={`ui-badge ${esRecibida ? 'ui-badge-success' : 'ui-badge-warning'}`}>
                          {esRecibida ? <CheckCircle size={13} style={{ marginRight: '4px' }} /> : <Clock size={13} style={{ marginRight: '4px' }} />}
                          {esRecibida ? 'Recibida' : 'Pendiente'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {!esRecibida && (
                          <button onClick={() => setOrdenARecepcionar(o)} className="btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                            Recepcionar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShoppingCart size={20} color="#0284c7" /> Nueva Orden de Compra
              </h3>
              <button onClick={() => setShowModal(false)} className="btn-ghost-icon"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div className="form-group">
                <label className="form-label">Buscar Proveedor</label>
                <SearchableSelect
                  options={opcionesProveedores}
                  value={proveedorId}
                  onChange={(val) => setProveedorId(val)}
                  placeholder="Escribe el nombre o CUIT del proveedor..."
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ marginBottom: '0.4rem', display: 'block' }}>
                  Ítems a Solicitar (Buscador por código o nombre)
                </label>
                {detalles.map((det, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.5rem', width: '100%', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ flex: 3 }}>
                      <SearchableSelect
                        options={opcionesProductos}
                        value={det.productoId}
                        onChange={(val) => handleProductoChange(index, val)}
                        placeholder="Buscar repuesto..."
                        required
                      />
                    </div>

                    <input
                      type="number"
                      min="1"
                      placeholder="Cant."
                      required
                      value={det.cantidad}
                      onChange={(e) => handleDetalleChange(index, 'cantidad', parseInt(e.target.value, 10) || 1)}
                      className="form-input"
                      style={{ width: '75px', textAlign: 'center' }}
                    />

                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Precio U."
                      required
                      value={det.precioUnitario}
                      onChange={(e) => handleDetalleChange(index, 'precioUnitario', parseFloat(e.target.value) || 0)}
                      className="form-input"
                      style={{ width: '110px', textAlign: 'right' }}
                    />

                    {detalles.length > 1 && (
                      <button type="button" onClick={() => handleRemoveFila(index)} className="btn-ghost-icon">
                        <Trash2 size={16} color="#ef4444" />
                      </button>
                    )}
                  </div>
                ))}

                <button 
                  type="button" 
                  onClick={handleAddFila} 
                  className="btn-secondary" 
                  style={{ marginTop: '0.4rem', fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                >
                  + Agregar Producto
                </button>
              </div>

              <div className="form-group">
                <label className="form-label">Observaciones (opcional)</label>
                <input
                  type="text"
                  placeholder="Instrucciones de entrega, etc."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="form-input"
                />
              </div>

              <div style={{ textAlign: 'right', marginTop: '0.5rem', fontSize: '1.1rem', fontWeight: 'bold', color: '#0f172a' }}>
                Total Estimado: ${calcularTotal().toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">Emitir Orden</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(ordenARecepcionar)}
        title="Recepcionar Mercadería"
        message={`¿Confirmar el ingreso de la orden ${ordenARecepcionar?.numero || `#OC-${ordenARecepcionar?.id}`}? Las cantidades solicitadas se sumarán automáticamente al stock disponible.`}
        confirmText="Recepcionar e Ingresar"
        variant="primary"
        onConfirm={confirmarRecepcion}
        onCancel={() => setOrdenARecepcionar(null)}
      />
    </div>
  );
}