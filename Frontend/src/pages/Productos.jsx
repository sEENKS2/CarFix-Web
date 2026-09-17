import { useEffect, useState, useMemo } from 'react';
import api from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { Plus, RefreshCw, X, Package, Edit, Trash2, AlertTriangle, ShieldAlert, Search } from 'lucide-react';
import { toast } from 'sonner';
import ConfirmModal from '../components/ConfirmModal';
import Pagination from '../components/Pagination';

export default function Productos() {
  const { tieneRol } = useAuth();
  const tieneAccesoView = tieneRol(['Operadores', 'Tecnicos']);
  const puedeEditar = tieneRol(['Operadores']);
  const esAdmin = tieneRol([]);

  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Búsqueda y Paginación
  const [busqueda, setBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 8;

  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [productoAEliminar, setProductoAEliminar] = useState(null);

  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    categoria: '',
    precioUnitario: 0,
    stockMinimo: 0,
    stockActual: 0
  });

  const cargarProductos = async (mostrarToast = false) => {
    if (!tieneAccesoView) return;
    
    setLoading(true);
    try {
      const res = await api.get('/productos');
      setProductos(res.data || []);
      if (mostrarToast) {
        toast.success('Catálogo de repuestos actualizado');
      }
    } catch {
      toast.error('Error al sincronizar el inventario');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tieneAccesoView) {
      cargarProductos();
    }
  }, [tieneAccesoView]);

  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda]);

  if (!tieneAccesoView) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center' }}>
        <ShieldAlert size={64} color="#ef4444" />
        <h2 style={{ marginTop: '1rem', fontSize: '1.5rem', color: '#0f172a' }}>Acceso Restringido</h2>
        <p style={{ color: '#64748b', marginTop: '0.5rem', maxWidth: '400px' }}>
          Tu perfil no cuenta con los permisos necesarios para visualizar el catálogo de inventario.
        </p>
      </div>
    );
  }

  // Filtrado reactivo por código, nombre y categoría
  const productosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return productos;
    return productos.filter(p =>
      (p.codigo && p.codigo.toLowerCase().includes(q)) ||
      (p.nombre && p.nombre.toLowerCase().includes(q)) ||
      (p.categoria && p.categoria.toLowerCase().includes(q)) ||
      (p.descripcion && p.descripcion.toLowerCase().includes(q))
    );
  }, [productos, busqueda]);

  const itemsPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * itemsPorPagina;
    return productosFiltrados.slice(inicio, inicio + itemsPorPagina);
  }, [productosFiltrados, paginaActual]);

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
        toast.success('Producto actualizado exitosamente');
      } else {
        await api.post('/productos', formData);
        toast.success('Producto ingresado al catálogo');
      }
      setShowModal(false);
      cargarProductos();
    } catch (err) {
      toast.error(err.response?.data || 'Error al guardar el producto');
    }
  };

  const confirmarEliminacion = async () => {
    if (!productoAEliminar) return;
    try {
      await api.delete(`/productos/${productoAEliminar.id}`);
      toast.success(`Producto "${productoAEliminar.nombre}" eliminado del catálogo`);
      cargarProductos();
    } catch (err) {
      toast.error(err.response?.data || 'Error al eliminar el producto');
    } finally {
      setProductoAEliminar(null);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventario y Stock</h1>
          <p className="page-subtitle">Catálogo de repuestos, precios y niveles de stock</p>
        </div>
        <div className="header-actions">
          <button onClick={() => cargarProductos(true)} className="btn-secondary">
            <RefreshCw size={15} /> Refrescar
          </button>
          
          {puedeEditar && (
            <button onClick={abrirModalNuevo} className="btn-primary">
              <Plus size={16} /> Nuevo Producto
            </button>
          )}
        </div>
      </div>

      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.4rem 0.75rem', width: '100%', maxWidth: '320px' }}>
          <Search size={16} color="#64748b" />
          <input
            type="text"
            placeholder="Buscar por código, nombre o categoría..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.85rem' }}
          />
          {busqueda && (
            <button onClick={() => setBusqueda('')} className="btn-ghost-icon" style={{ padding: 0 }}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="ui-card">
        {loading ? (
          <div className="empty-state">Cargando catálogo de productos...</div>
        ) : productosFiltrados.length === 0 ? (
          <div className="empty-state">
            {busqueda ? 'No se encontraron repuestos con ese criterio.' : 'No hay productos cargados en inventario.'}
          </div>
        ) : (
          <div className="ui-table-container">
            <table className="ui-table">
              <thead>
                <tr>
                  <th style={{ width: '110px' }}>Código</th>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th style={{ width: '130px' }}>Precio Unit.</th>
                  <th style={{ width: '130px' }}>Stock Actual</th>
                  <th style={{ width: '110px' }}>Stock Mín.</th>
                  
                  {(puedeEditar || esAdmin) && (
                    <th style={{ width: '90px', textAlign: 'center' }}>Acciones</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {itemsPaginados.map((p) => {
                  const stockBajo = p.stockActual <= p.stockMinimo;
                  return (
                    <tr key={p.id}>
                      <td><strong>{p.codigo}</strong></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Package size={15} color="#0284c7" />
                          <div>
                            <strong style={{ color: '#0f172a' }}>{p.nombre}</strong>
                            {p.descripcion && <p style={{ margin: 0, color: '#64748b', fontSize: '0.8rem' }}>{p.descripcion}</p>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 500 }}>
                          {p.categoria || 'General'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>
                        ${Number(p.precioUnitario || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        <span className={`ui-badge ${stockBajo ? 'ui-badge-warning' : 'ui-badge-success'}`} style={stockBajo ? { backgroundColor: '#fef2f2', color: '#dc2626', borderColor: '#fecaca' } : {}}>
                          {stockBajo && <AlertTriangle size={12} style={{ marginRight: '4px' }} />}
                          {p.stockActual} u.
                        </span>
                      </td>
                      <td style={{ color: '#64748b' }}>{p.stockMinimo} u.</td>
                      
                      {(puedeEditar || esAdmin) && (
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            {puedeEditar && (
                              <button onClick={() => abrirModalEditar(p)} className="btn-ghost-icon" title="Editar">
                                <Edit size={16} color="#0284c7" />
                              </button>
                            )}
                            {esAdmin && (
                              <button onClick={() => setProductoAEliminar(p)} className="btn-ghost-icon" title="Eliminar">
                                <Trash2 size={16} color="#ef4444" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          paginaActual={paginaActual}
          totalItems={productosFiltrados.length}
          itemsPorPagina={itemsPorPagina}
          onCambioPagina={setPaginaActual}
        />
      </div>

      {(showModal && puedeEditar) && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Package size={20} color="#0284c7" /> {editando ? 'Modificar Producto' : 'Nuevo Producto'}
              </h3>
              <button onClick={() => setShowModal(false)} className="btn-ghost-icon"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Código</label>
                  <input
                    type="text"
                    required
                    placeholder="P001"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Categoría</label>
                  <input
                    type="text"
                    placeholder="Filtros, Frenos, Aceites..."
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Nombre del Producto</label>
                <input
                  type="text"
                  required
                  placeholder="Filtro de Aceite Universal"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Descripción</label>
                <input
                  type="text"
                  placeholder="Detalle o compatibilidad..."
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Precio Unitario ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.precioUnitario}
                    onChange={(e) => setFormData({ ...formData, precioUnitario: parseFloat(e.target.value) || 0 })}
                    className="form-input"
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Stock Mínimo</label>
                  <input
                    type="number"
                    required
                    value={formData.stockMinimo}
                    onChange={(e) => setFormData({ ...formData, stockMinimo: parseInt(e.target.value, 10) || 0 })}
                    className="form-input"
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Stock Actual</label>
                  <input
                    type="number"
                    required
                    value={formData.stockActual}
                    onChange={(e) => setFormData({ ...formData, stockActual: parseInt(e.target.value, 10) || 0 })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">
                  {editando ? 'Guardar Cambios' : 'Crear Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(productoAEliminar)}
        title="Dar de baja producto"
        message={`¿Estás seguro de eliminar el repuesto "${productoAEliminar?.nombre}" (${productoAEliminar?.codigo})? Esta acción lo quitará del inventario.`}
        confirmText="Eliminar Repuesto"
        variant="danger"
        onConfirm={confirmarEliminacion}
        onCancel={() => setProductoAEliminar(null)}
      />
    </div>
  );
}