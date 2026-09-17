import { useEffect, useState, useMemo } from 'react';
import api from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  RefreshCw, 
  X, 
  User, 
  Car, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  ShieldAlert, 
  Search,
  DollarSign,
  Receipt,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import ConfirmModal from '../components/ConfirmModal';
import Pagination from '../components/Pagination';

export default function ClientesVehiculos() {
  const { tieneRol } = useAuth();
  const tieneAccesoGeneral = tieneRol(['Operadores']);
  const esAdmin = tieneRol([]);

  const [clientes, setClientes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [tabActiva, setTabActiva] = useState('clientes');
  const [loading, setLoading] = useState(true);

  // Búsqueda y paginación
  const [busqueda, setBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 8;

  // Modales
  const [showModalCliente, setShowModalCliente] = useState(false);
  const [showModalVehiculo, setShowModalVehiculo] = useState(false);
  const [editandoCliente, setEditandoCliente] = useState(null);
  const [editandoVehiculo, setEditandoVehiculo] = useState(null);
  const [clienteCuentaCorriente, setClienteCuentaCorriente] = useState(null);

  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  const [formCliente, setFormCliente] = useState({ nombre: '', apellido: '', dni: '', correo: '', telefono: '' });
  const [formVehiculo, setFormVehiculo] = useState({ clienteId: '', marca: '', modelo: '', año: 2022, dominio: '' });

  const cargarTodo = async (mostrarToast = false) => {
    if (!tieneAccesoGeneral) return;
    
    setLoading(true);
    try {
      const [resCli, resVeh, resFac, resTick] = await Promise.all([
        api.get('/clientes'),
        api.get('/vehiculos'),
        api.get('/facturas').catch(() => ({ data: [] })),
        api.get('/tickets').catch(() => ({ data: [] }))
      ]);
      setClientes(resCli.data || []);
      setVehiculos(resVeh.data || []);
      setFacturas(resFac.data || []);
      setTickets(resTick.data || []);

      if (mostrarToast) {
        toast.success('Padrón y cuentas corrientes actualizados');
      }
    } catch {
      toast.error('Error al sincronizar clientes y saldos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tieneAccesoGeneral) {
      cargarTodo();
    }
  }, [tieneAccesoGeneral]);

  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, tabActiva]);

  // Mapa de deuda por cliente (Hooks siempre arriba de los returns)
  const mapaDeudaClientes = useMemo(() => {
    const mapa = {};

    facturas.forEach(f => {
      if (f.estado === 'Anulada') return;
      const saldo = Number(f.saldoPendiente || 0);

      let clienteId = f.clienteId;
      if (!clienteId && f.ticketId) {
        const t = tickets.find(x => x.id === f.ticketId);
        clienteId = t?.clienteId || t?.cliente?.id;
      }

      if (clienteId) {
        if (!mapa[clienteId]) {
          mapa[clienteId] = { saldoTotal: 0, facturas: [] };
        }
        mapa[clienteId].saldoTotal += saldo;
        if (saldo > 0) {
          mapa[clienteId].facturas.push(f);
        }
      }
    });

    return mapa;
  }, [facturas, tickets]);

  const clientesFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return clientes;
    return clientes.filter(c => 
      `${c.nombre} ${c.apellido}`.toLowerCase().includes(q) ||
      String(c.dni || '').includes(q) ||
      String(c.telefono || '').includes(q) ||
      (c.correo && c.correo.toLowerCase().includes(q))
    );
  }, [clientes, busqueda]);

  const vehiculosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return vehiculos;
    return vehiculos.filter(v => 
      (v.dominio && v.dominio.toLowerCase().includes(q)) ||
      (v.marca && v.marca.toLowerCase().includes(q)) ||
      (v.modelo && v.modelo.toLowerCase().includes(q)) ||
      (v.dueño && `${v.dueño.nombre} ${v.dueño.apellido}`.toLowerCase().includes(q)) ||
      (v.nombreCompletoDueño && v.nombreCompletoDueño.toLowerCase().includes(q))
    );
  }, [vehiculos, busqueda]);

  const listaActiva = tabActiva === 'clientes' ? clientesFiltrados : vehiculosFiltrados;
  
  const itemsPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * itemsPorPagina;
    return listaActiva.slice(inicio, inicio + itemsPorPagina);
  }, [listaActiva, paginaActual]);

  // Early return por permisos colocado DESPUÉS de todos los Hooks
  if (!tieneAccesoGeneral) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center' }}>
        <ShieldAlert size={64} color="#ef4444" />
        <h2 style={{ marginTop: '1rem', fontSize: '1.5rem', color: '#0f172a' }}>Acceso Restringido</h2>
        <p style={{ color: '#64748b', marginTop: '0.5rem', maxWidth: '400px' }}>
          Tu perfil técnico no cuenta con permisos para gestionar el padrón de clientes y vehículos.
        </p>
      </div>
    );
  }

  const handleSubmitCliente = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formCliente,
        dni: parseInt(formCliente.dni, 10),
        telefono: parseInt(formCliente.telefono, 10) || 0
      };
      if (editandoCliente) {
        await api.put(`/clientes/${editandoCliente.id}`, payload);
        toast.success('Cliente actualizado con éxito');
      } else {
        await api.post('/clientes', payload);
        toast.success('Cliente registrado con éxito');
      }
      setShowModalCliente(false);
      cargarTodo();
    } catch (err) {
      toast.error(err.response?.data || 'Error al guardar cliente');
    }
  };

  const handleSubmitVehiculo = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formVehiculo,
        clienteId: parseInt(formVehiculo.clienteId, 10),
        año: parseInt(formVehiculo.año, 10)
      };
      if (editandoVehiculo) {
        await api.put(`/vehiculos/${editandoVehiculo.id}`, payload);
        toast.success('Vehículo actualizado con éxito');
      } else {
        await api.post('/vehiculos', payload);
        toast.success('Vehículo registrado con éxito');
      }
      setShowModalVehiculo(false);
      cargarTodo();
    } catch (err) {
      toast.error(err.response?.data || 'Error al guardar vehículo');
    }
  };

  const solicitarEliminarCliente = (cliente) => {
    if (!esAdmin) return;
    setConfirmConfig({
      isOpen: true,
      title: 'Dar de baja cliente',
      message: `¿Confirmar la eliminación de ${cliente.nombre} ${cliente.apellido}?`,
      onConfirm: async () => {
        try {
          await api.delete(`/clientes/${cliente.id}`);
          toast.success('Cliente dado de baja exitosamente');
          cargarTodo();
        } catch (err) {
          toast.error(err.response?.data || 'Error al eliminar cliente');
        } finally {
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const solicitarEliminarVehiculo = (vehiculo) => {
    if (!esAdmin) return;
    setConfirmConfig({
      isOpen: true,
      title: 'Dar de baja vehículo',
      message: `¿Confirmar la eliminación de la unidad patente ${vehiculo.dominio}?`,
      onConfirm: async () => {
        try {
          await api.delete(`/vehiculos/${vehiculo.id}`);
          toast.success('Vehículo dado de baja exitosamente');
          cargarTodo();
        } catch (err) {
          toast.error(err.response?.data || 'Error al eliminar vehículo');
        } finally {
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Clientes y Parque Automotor</h1>
          <p className="page-subtitle">Directorio de clientes, estados de cuenta y unidades registradas</p>
        </div>
        <div className="header-actions">
          <button onClick={() => cargarTodo(true)} className="btn-secondary">
            <RefreshCw size={15} /> Refrescar
          </button>
          <button
            onClick={() => {
              if (tabActiva === 'clientes') {
                setEditandoCliente(null);
                setFormCliente({ nombre: '', apellido: '', dni: '', correo: '', telefono: '' });
                setShowModalCliente(true);
              } else {
                setEditandoVehiculo(null);
                setFormVehiculo({ clienteId: '', marca: '', modelo: '', año: 2022, dominio: '' });
                setShowModalVehiculo(true);
              }
            }}
            className="btn-primary"
          >
            <Plus size={16} /> {tabActiva === 'clientes' ? 'Nuevo Cliente' : 'Nuevo Vehículo'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <div className="tabs-nav" style={{ margin: 0 }}>
          <button
            onClick={() => setTabActiva('clientes')}
            className={`tab-btn ${tabActiva === 'clientes' ? 'tab-btn-active' : ''}`}
          >
            <User size={16} /> Clientes ({clientes.length})
          </button>
          <button
            onClick={() => setTabActiva('vehiculos')}
            className={`tab-btn ${tabActiva === 'vehiculos' ? 'tab-btn-active' : ''}`}
          >
            <Car size={16} /> Vehículos ({vehiculos.length})
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.4rem 0.75rem', minWidth: '260px' }}>
          <Search size={16} color="#64748b" />
          <input
            type="text"
            placeholder={tabActiva === 'clientes' ? 'Buscar por nombre o DNI...' : 'Buscar patente o modelo...'}
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
          <div className="empty-state">Cargando registros...</div>
        ) : listaActiva.length === 0 ? (
          <div className="empty-state">
            {busqueda ? 'No se encontraron resultados coincidentes.' : 'No hay registros disponibles.'}
          </div>
        ) : tabActiva === 'clientes' ? (
          <div className="ui-table-container">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Nombre y Apellido</th>
                  <th style={{ width: '120px' }}>DNI</th>
                  <th>Contacto</th>
                  <th style={{ width: '160px', textAlign: 'right' }}>Cuenta Corriente</th>
                  <th style={{ width: '110px', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {itemsPaginados.map((c) => {
                  const datosDeuda = mapaDeudaClientes[c.id] || { saldoTotal: 0, facturas: [] };
                  const tieneDeuda = datosDeuda.saldoTotal > 0;

                  return (
                    <tr key={c.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <User size={15} color="#0284c7" />
                          <strong style={{ color: '#0f172a' }}>{c.nombre} {c.apellido}</strong>
                        </div>
                      </td>
                      <td>{c.dni}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '0.8rem' }}>
                          {c.telefono ? <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#475569' }}><Phone size={12} /> {c.telefono}</span> : null}
                          {c.correo ? <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#475569' }}><Mail size={12} /> {c.correo}</span> : null}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {tieneDeuda ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '6px',
                              backgroundColor: '#fef2f2',
                              color: '#dc2626',
                              border: '1px solid #fecaca',
                              fontWeight: 700,
                              fontSize: '0.825rem'
                            }}>
                              <AlertCircle size={13} /> ${datosDeuda.saldoTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
                              {datosDeuda.facturas.length} comprobante(s)
                            </span>
                          </div>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '6px',
                            backgroundColor: '#ecfdf5',
                            color: '#059669',
                            border: '1px solid #a7f3d0',
                            fontWeight: 600,
                            fontSize: '0.825rem'
                          }}>
                            <CheckCircle2 size={13} /> Al día
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <button
                            onClick={() => setClienteCuentaCorriente({ cliente: c, ...datosDeuda })}
                            className="btn-ghost-icon"
                            title="Ver resumen de cuenta corriente"
                          >
                            <DollarSign size={16} color={tieneDeuda ? '#dc2626' : '#059669'} />
                          </button>

                          <button 
                            onClick={() => { setEditandoCliente(c); setFormCliente(c); setShowModalCliente(true); }} 
                            className="btn-ghost-icon"
                            title="Editar Cliente"
                          >
                            <Edit size={16} color="#0284c7" />
                          </button>
                          
                          {esAdmin && (
                            <button 
                              onClick={() => solicitarEliminarCliente(c)} 
                              className="btn-ghost-icon"
                              title="Eliminar Cliente"
                            >
                              <Trash2 size={16} color="#ef4444" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="ui-table-container">
            <table className="ui-table">
              <thead>
                <tr>
                  <th style={{ width: '130px' }}>Dominio</th>
                  <th>Marca y Modelo</th>
                  <th style={{ width: '90px' }}>Año</th>
                  <th>Titular / Dueño</th>
                  <th style={{ width: '90px', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {itemsPaginados.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Car size={15} color="#0284c7" />
                        <strong style={{ color: '#0f172a' }}>{v.dominio}</strong>
                      </div>
                    </td>
                    <td>{v.marca} {v.modelo}</td>
                    <td>{v.año || '—'}</td>
                    <td style={{ fontWeight: 500, color: '#0f172a' }}>
                      {v.dueño ? `${v.dueño.nombre} ${v.dueño.apellido}` : (v.nombreCompletoDueño || 'Sin titular')}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <button onClick={() => {
                          setEditandoVehiculo(v);
                          setFormVehiculo({
                            clienteId: v.clienteId || v.dueño?.id || '',
                            marca: v.marca,
                            modelo: v.modelo,
                            año: v.año,
                            dominio: v.dominio
                          });
                          setShowModalVehiculo(true);
                        }} className="btn-ghost-icon" title="Editar Vehículo">
                          <Edit size={16} color="#0284c7" />
                        </button>

                        {esAdmin && (
                          <button onClick={() => solicitarEliminarVehiculo(v)} className="btn-ghost-icon" title="Eliminar Vehículo">
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

        <Pagination
          paginaActual={paginaActual}
          totalItems={listaActiva.length}
          itemsPorPagina={itemsPorPagina}
          onCambioPagina={setPaginaActual}
        />
      </div>

      {/* MODAL DE CUENTA CORRIENTE */}
      {clienteCuentaCorriente && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <DollarSign size={20} color={clienteCuentaCorriente.saldoTotal > 0 ? '#dc2626' : '#059669'} />
                <h3 className="modal-title">
                  Estado de Cuenta: {clienteCuentaCorriente.cliente.nombre} {clienteCuentaCorriente.cliente.apellido}
                </h3>
              </div>
              <button onClick={() => setClienteCuentaCorriente(null)} className="btn-ghost-icon"><X size={20} /></button>
            </div>

            <div style={{
              backgroundColor: clienteCuentaCorriente.saldoTotal > 0 ? '#fef2f2' : '#ecfdf5',
              border: `1px solid ${clienteCuentaCorriente.saldoTotal > 0 ? '#fecaca' : '#a7f3d0'}`,
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Saldo Deudor Total</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: clienteCuentaCorriente.saldoTotal > 0 ? '#dc2626' : '#059669' }}>
                  ${clienteCuentaCorriente.saldoTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <span className={`ui-badge ${clienteCuentaCorriente.saldoTotal > 0 ? 'ui-badge-warning' : 'ui-badge-success'}`} style={clienteCuentaCorriente.saldoTotal > 0 ? { backgroundColor: '#ffffff', color: '#dc2626', borderColor: '#fecaca' } : {}}>
                {clienteCuentaCorriente.saldoTotal > 0 ? 'Con Deuda Pendiente' : 'Cuenta al Día'}
              </span>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>
                Comprobantes con Saldo Pendiente
              </span>
              {clienteCuentaCorriente.facturas.length === 0 ? (
                <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                  Este cliente no registra comprobantes pendientes de pago.
                </div>
              ) : (
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                  <table className="ui-table">
                    <thead>
                      <tr>
                        <th>N° Factura</th>
                        <th>Fecha</th>
                        <th style={{ textAlign: 'right' }}>Total</th>
                        <th style={{ textAlign: 'right' }}>Saldo Adeudado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clienteCuentaCorriente.facturas.map((f) => (
                        <tr key={f.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <Receipt size={14} color="#0284c7" />
                              <strong>{f.numeroFactura}</strong>
                            </div>
                          </td>
                          <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            {f.fechaEmision ? new Date(f.fechaEmision).toLocaleDateString('es-AR') : '—'}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            ${Number(f.total || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>
                            ${Number(f.saldoPendiente || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="modal-actions" style={{ justifyContent: 'space-between' }}>
              {clienteCuentaCorriente.saldoTotal > 0 && (
                <button
                  onClick={() => {
                    setClienteCuentaCorriente(null);
                    window.location.href = '/facturacion';
                  }}
                  className="btn-primary"
                  style={{ backgroundColor: '#059669', borderColor: '#059669' }}
                >
                  <DollarSign size={15} /> Asentar Cobro en Facturación
                </button>
              )}
              <button onClick={() => setClienteCuentaCorriente(null)} className="btn-secondary">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Alta/Edición Cliente */}
      {showModalCliente && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={18} color="#0284c7" /> {editandoCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h3>
              <button onClick={() => setShowModalCliente(false)} className="btn-ghost-icon"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmitCliente} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Nombre</label>
                  <input required value={formCliente.nombre} onChange={e => setFormCliente({ ...formCliente, nombre: e.target.value })} className="form-input" />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Apellido</label>
                  <input required value={formCliente.apellido} onChange={e => setFormCliente({ ...formCliente, apellido: e.target.value })} className="form-input" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">DNI</label>
                  <input type="number" required value={formCliente.dni} onChange={e => setFormCliente({ ...formCliente, dni: e.target.value })} className="form-input" />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Teléfono</label>
                  <input type="number" value={formCliente.telefono} onChange={e => setFormCliente({ ...formCliente, telefono: e.target.value })} className="form-input" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" value={formCliente.correo} onChange={e => setFormCliente({ ...formCliente, correo: e.target.value })} className="form-input" />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModalCliente(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Alta/Edición Vehículo */}
      {showModalVehiculo && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Car size={18} color="#0284c7" /> {editandoVehiculo ? 'Editar Vehículo' : 'Nuevo Vehículo'}
              </h3>
              <button onClick={() => setShowModalVehiculo(false)} className="btn-ghost-icon"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmitVehiculo} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div className="form-group">
                <label className="form-label">Titular (Cliente)</label>
                <select required value={formVehiculo.clienteId} onChange={e => setFormVehiculo({ ...formVehiculo, clienteId: e.target.value })} className="form-select">
                  <option value="">-- Seleccionar Titular --</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.apellido} (DNI: {c.dni})</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Marca</label>
                  <input required placeholder="Volkswagen, Ford..." value={formVehiculo.marca} onChange={e => setFormVehiculo({ ...formVehiculo, marca: e.target.value })} className="form-input" />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Modelo</label>
                  <input required placeholder="Golf, Ranger..." value={formVehiculo.modelo} onChange={e => setFormVehiculo({ ...formVehiculo, modelo: e.target.value })} className="form-input" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Dominio / Patente</label>
                  <input required placeholder="AF123ZZ" value={formVehiculo.dominio} onChange={e => setFormVehiculo({ ...formVehiculo, dominio: e.target.value.toUpperCase() })} className="form-input" />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Año</label>
                  <input type="number" required value={formVehiculo.año} onChange={e => setFormVehiculo({ ...formVehiculo, año: e.target.value })} className="form-input" />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModalVehiculo(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText="Eliminar"
        variant="danger"
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}