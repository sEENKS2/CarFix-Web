import { useEffect, useState } from 'react';
import api from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { Plus, RefreshCw, X, Wrench, Eye, Calendar, User, Car, Clock, History, Edit, Receipt } from 'lucide-react';
import ModalFacturarTicket from '../components/ModalFacturarTicket';

export default function Tickets() {
  const { tieneRol } = useAuth();
  
  // Validamos permisos
  const puedeCrearOEliminar = tieneRol(['Operadores']); // Operadores y Admins
  const tieneAccesoView = tieneRol(['Operadores', 'Tecnicos']);

  const [tickets, setTickets] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal Facturacion
  const [ticketParaFacturar, setTicketParaFacturar] = useState(null);

  // Modal Detalle Completo & Historial
  const [ticketSeleccionado, setTicketSeleccionado] = useState(null);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [historialVehiculo, setHistorialVehiculo] = useState([]);

  // Modal Alta / Edición
  const [showModal, setShowModal] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [formData, setFormData] = useState({
    clienteId: '',
    vehiculoId: '',
    tecnicoId: '',
    descripcion: '',
    estado: 0
  });

  const ESTADOS_MAP = {
    0: { label: 'Ingresado', bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
    1: { label: 'En Diagnóstico', bg: '#eef2ff', text: '#4338ca', border: '#c7d2fe' },
    2: { label: 'En Reparación', bg: '#fffbeb', text: '#b45309', border: '#fde68a' },
    3: { label: 'Finalizado', bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' },
    4: { label: 'Entregado', bg: '#f8fafc', text: '#475569', border: '#e2e8f0' }
  };

  const parseEstado = (estado) => {
    if (typeof estado === 'number') return estado;
    const num = parseInt(estado, 10);
    if (!isNaN(num)) return num;
    switch (String(estado).toLowerCase()) {
      case 'diagnostico':
      case 'en diagnóstico': return 1;
      case 'reparacion':
      case 'en reparación': return 2;
      case 'finalizado': return 3;
      case 'entregado': return 4;
      default: return 0;
    }
  };

  const cargarDatos = async () => {
    if (!tieneAccesoView) return;

    setLoading(true);
    setError('');
    try {
      const [resTickets, resClientes, resVehiculos, resTecnicos] = await Promise.all([
        api.get('/tickets'),
        api.get('/clientes').catch(() => ({ data: [] })),
        api.get('/vehiculos').catch(() => ({ data: [] })),
        api.get('/tecnicos').catch(() => ({ data: [] }))
      ]);
      setTickets(resTickets.data);
      setClientes(resClientes.data);
      setVehiculos(resVehiculos.data);
      setTecnicos(resTecnicos.data);
    } catch {
      setError('Error al sincronizar datos de taller.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tieneAccesoView) {
      cargarDatos();
    }
  }, [tieneAccesoView]);

  const vehiculosFiltrados = formData.clienteId
    ? vehiculos.filter(v => v.clienteId === parseInt(formData.clienteId, 10) || v.dueño?.id === parseInt(formData.clienteId, 10))
    : vehiculos;

  const abrirModalNuevo = () => {
    setEditandoId(null);
    setFormData({ clienteId: '', vehiculoId: '', tecnicoId: '', descripcion: '', estado: 0 });
    setShowModal(true);
  };

  const abrirModalEditar = (t) => {
    setEditandoId(t.id);
    setFormData({
      clienteId: t.clienteId || t.cliente?.id || '',
      vehiculoId: t.vehiculoId || t.vehiculo?.id || '',
      tecnicoId: t.tecnicoId || t.tecnico?.id || '',
      descripcion: t.descripcion || '',
      estado: parseEstado(t.estado)
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!puedeCrearOEliminar) return;

    if (!formData.clienteId || !formData.vehiculoId || !formData.tecnicoId) {
      alert('Por favor selecciona Cliente, Vehículo y Técnico asignado.');
      return;
    }

    const payload = {
      clienteId: parseInt(formData.clienteId, 10),
      vehiculoId: parseInt(formData.vehiculoId, 10),
      tecnicoId: parseInt(formData.tecnicoId, 10),
      descripcion: formData.descripcion,
      estado: parseInt(formData.estado, 10) || 0
    };

    try {
      if (editandoId) {
        await api.put(`/tickets/${editandoId}`, payload);
      } else {
        await api.post('/tickets', payload);
      }
      setShowModal(false);
      setEditandoId(null);
      setFormData({ clienteId: '', vehiculoId: '', tecnicoId: '', descripcion: '', estado: 0 });
      cargarDatos();
    } catch (err) {
      alert(err.response?.data || 'Error al guardar el ticket');
    }
  };

  const handleVerDetalle = async (ticket) => {
    setTicketSeleccionado(ticket);
    setCargandoHistorial(true);
    try {
      const vehiculoId = ticket.vehiculoId || ticket.vehiculo?.id;
      if (vehiculoId) {
        const res = await api.get(`/tickets/vehiculo/${vehiculoId}`);
        setHistorialVehiculo(res.data.filter(t => t.id !== ticket.id));
      } else {
        setHistorialVehiculo([]);
      }
    } catch {
      setHistorialVehiculo([]);
    } finally {
      setCargandoHistorial(false);
    }
  };

  const handleCambiarEstado = async (id, nuevoEstado) => {
    try {
      await api.put(`/tickets/${id}/estado`, { estado: nuevoEstado });
      cargarDatos();
    } catch (err) {
      alert(err.response?.data || 'Error al actualizar el estado del ticket');
    }
  };

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Tickets de Taller</h1>
          <p style={styles.subtitle}>Gestión y seguimiento de órdenes de servicio en tiempo real</p>
        </div>
        <div style={styles.headerActions}>
          <button onClick={cargarDatos} style={styles.btnSecondary}>
            <RefreshCw size={15} /> Refrescar
          </button>
          
          {puedeCrearOEliminar && (
            <button onClick={abrirModalNuevo} style={styles.btnPrimary}>
              <Plus size={16} /> Nuevo Ticket
            </button>
          )}
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.card}>
        {loading ? (
          <div style={styles.emptyState}>Cargando órdenes de trabajo...</div>
        ) : tickets.length === 0 ? (
          <div style={styles.emptyState}>No hay tickets activos en este momento.</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>Nro</th>
                <th style={styles.th}>Vehículo</th>
                <th style={styles.th}>Cliente</th>
                <th style={styles.th}>Falla Reportada</th>
                <th style={styles.th}>Estado</th>
                <th style={styles.th}>Cambiar Estado</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t, idx) => {
                const estadoId = parseEstado(t.estado);
                const estadoInfo = ESTADOS_MAP[estadoId] || ESTADOS_MAP[0];

                const dominio = t.vehiculo?.dominio || t.dominio || 'S/D';
                const marcaModelo = t.vehiculo
                  ? `${t.vehiculo.marca || ''} ${t.vehiculo.modelo || ''}`.trim()
                  : (t.nombreCompletoVehiculo || '');

                const clienteNombre = t.cliente
                  ? `${t.cliente.nombre} ${t.cliente.apellido || ''}`.trim()
                  : (t.nombreCompletoCliente || 'Sin cliente');

                const esFacturable = estadoId >= 3; // 3: Finalizado, 4: Entregado

                return (
                  <tr key={t.id} style={{ ...styles.tr, backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td style={styles.td}><strong>#{t.id}</strong></td>
                    <td style={styles.td}>
                      <div style={styles.cellFlex}>
                        <Car size={14} color="#64748b" />
                        <div>
                          <strong style={{ color: '#0f172a' }}>{dominio}</strong>
                          {marcaModelo && <span style={{ color: '#64748b', fontSize: '0.8rem', marginLeft: '6px' }}>({marcaModelo})</span>}
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.cellFlex}>
                        <User size={14} color="#0284c7" />
                        <span style={{ fontWeight: '500', color: '#0f172a' }}>{clienteNombre}</span>
                      </div>
                    </td>
                    <td style={{ ...styles.td, maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#475569' }}>
                      {t.descripcion || '—'}
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        backgroundColor: estadoInfo.bg,
                        color: estadoInfo.text,
                        border: `1px solid ${estadoInfo.border}`
                      }}>
                        {estadoInfo.label}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <select
                        value={estadoId}
                        onChange={(e) => handleCambiarEstado(t.id, parseInt(e.target.value, 10))}
                        style={styles.selectStatus}
                      >
                        <option value={0} style={styles.option}>Ingresado</option>
                        <option value={1} style={styles.option}>En Diagnóstico</option>
                        <option value={2} style={styles.option}>En Reparación</option>
                        <option value={3} style={styles.option}>Finalizado</option>
                        <option value={4} style={styles.option}>Entregado</option>
                      </select>
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '0.35rem' }}>
                      <button
                        onClick={() => handleVerDetalle(t)}
                        style={styles.btnDetail}
                        title="Ver detalle completo"
                      >
                        <Eye size={14} /> Detalle
                      </button>

                      {esFacturable && puedeCrearOEliminar && (
                        <button
                          onClick={() => setTicketParaFacturar(t)}
                          style={styles.btnInvoice}
                          title="Emitir Factura"
                        >
                          <Receipt size={14} /> Facturar
                        </button>
                      )}

                      {puedeCrearOEliminar && (
                        <button
                          onClick={() => abrirModalEditar(t)}
                          style={styles.actionBtn}
                          title="Modificar ticket"
                        >
                          <Edit size={16} color="#0284c7" />
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

      {/* MODAL DETALLE COMPLETO */}
      {ticketSeleccionado && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalContent, maxWidth: '640px' }}>
            <div style={styles.modalHeader}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: '#0f172a' }}>
                <Wrench size={20} color="#0284c7" /> Detalle del Ticket #{ticketSeleccionado.id}
              </h3>
              <button onClick={() => setTicketSeleccionado(null)} style={styles.iconBtn}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={styles.detailCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontSize: '0.875rem' }}>
                    <Calendar size={15} />
                    <span>Fecha: {new Date(ticketSeleccionado.fechaCreacion || Date.now()).toLocaleDateString('es-AR')}</span>
                  </div>
                  <span style={{
                    ...styles.badge,
                    backgroundColor: ESTADOS_MAP[parseEstado(ticketSeleccionado.estado)]?.bg,
                    color: ESTADOS_MAP[parseEstado(ticketSeleccionado.estado)]?.text,
                    border: `1px solid ${ESTADOS_MAP[parseEstado(ticketSeleccionado.estado)]?.border}`,
                    fontSize: '0.8rem'
                  }}>
                    {ESTADOS_MAP[parseEstado(ticketSeleccionado.estado)]?.label}
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={styles.detailCard}>
                  <div style={styles.detailSectionTitle}>
                    <Car size={14} /> Vehículo
                  </div>
                  <p style={styles.detailText}><strong>Dominio:</strong> {ticketSeleccionado.vehiculo?.dominio || 'S/D'}</p>
                  <p style={styles.detailText}><strong>Marca/Modelo:</strong> {ticketSeleccionado.vehiculo?.marca || '—'} {ticketSeleccionado.vehiculo?.modelo || ''}</p>
                  <p style={styles.detailText}><strong>Año:</strong> {ticketSeleccionado.vehiculo?.año || '—'}</p>
                </div>

                <div style={styles.detailCard}>
                  <div style={styles.detailSectionTitle}>
                    <User size={14} /> Cliente
                  </div>
                  <p style={styles.detailText}>
                    <strong>Nombre:</strong> {ticketSeleccionado.cliente ? `${ticketSeleccionado.cliente.nombre} ${ticketSeleccionado.cliente.apellido || ''}` : (ticketSeleccionado.nombreCompletoCliente || 'Particular')}
                  </p>
                  <p style={styles.detailText}><strong>DNI:</strong> {ticketSeleccionado.cliente?.dni || '—'}</p>
                  <p style={styles.detailText}><strong>Tel:</strong> {ticketSeleccionado.cliente?.telefono || '—'}</p>
                  <p style={styles.detailText}><strong>Correo:</strong> {ticketSeleccionado.cliente?.correo || '—'}</p>
                </div>
              </div>

              <div style={styles.detailCard}>
                <div style={styles.detailSectionTitle}>
                  <Wrench size={14} /> Técnico Asignado
                </div>
                <p style={styles.detailText}>
                  <strong>Nombre:</strong> {ticketSeleccionado.tecnico ? `${ticketSeleccionado.tecnico.nombre} ${ticketSeleccionado.tecnico.apellido || ''}` : (ticketSeleccionado.nombreCompletoTecnico || 'Sin asignar')}
                </p>
                {ticketSeleccionado.tecnico?.correo && (
                  <p style={styles.detailText}><strong>Contacto:</strong> {ticketSeleccionado.tecnico.correo}</p>
                )}
              </div>

              <div style={styles.detailCard}>
                <div style={styles.detailSectionTitle}>Descripción Inicial / Falla Reportada</div>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#1e293b', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                  {ticketSeleccionado.descripcion || 'Sin descripción ingresada.'}
                </p>
              </div>

              {/* Historial Clínico del Vehículo */}
              <div style={styles.detailCard}>
                <div style={styles.detailSectionTitle}>
                  <History size={14} /> Historial Clínico del Vehículo (Otros Ingresos)
                </div>
                {cargandoHistorial ? (
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>Cargando antecedentes del auto...</p>
                ) : historialVehiculo.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>Este vehículo no registra otros ingresos previos al taller.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {historialVehiculo.map((h) => {
                      const estadoH = ESTADOS_MAP[parseEstado(h.estado)] || ESTADOS_MAP[0];
                      return (
                        <div key={h.id} style={styles.historyItem}>
                          <div style={styles.historyMeta}>
                            <span style={{ fontWeight: '700', color: '#0f172a' }}>Ticket #{h.id}</span>
                            <span style={{
                              ...styles.badge,
                              backgroundColor: estadoH.bg,
                              color: estadoH.text,
                              border: `1px solid ${estadoH.border}`,
                              padding: '0.1rem 0.4rem',
                              fontSize: '0.7rem'
                            }}>
                              {estadoH.label}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <Clock size={11} /> {new Date(h.fechaCreacion).toLocaleDateString('es-AR')}
                            </span>
                          </div>
                          <div style={{ color: '#334155', marginTop: '4px', fontSize: '0.8rem' }}>
                            <strong>Trabajo realizado / Falla:</strong> {h.descripcion}
                          </div>
                          <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '2px' }}>
                            Técnico a cargo: {h.tecnico}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button onClick={() => setTicketSeleccionado(null)} style={styles.btnSecondary}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ALTA / EDICIÓN DE TICKET */}
      {(showModal && puedeCrearOEliminar) && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalContent, maxWidth: '580px' }}>
            <div style={styles.modalHeader}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: '#0f172a' }}>
                <Wrench size={20} color="#0284c7" /> {editandoId ? `Modificar Ticket #${editandoId}` : 'Registrar Ingreso a Taller'}
              </h3>
              <button onClick={() => setShowModal(false)} style={styles.iconBtn}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.sectionTitle}>Titular y Vehículo</div>
              <div style={styles.formRow}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Cliente</label>
                  <select
                    required
                    value={formData.clienteId}
                    onChange={(e) => setFormData({ ...formData, clienteId: e.target.value, vehiculoId: '' })}
                    style={styles.select}
                  >
                    <option value="" style={styles.option}>-- Seleccionar Cliente --</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id} style={styles.option}>
                        {c.nombre} {c.apellido} (DNI: {c.dni})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Vehículo</label>
                  <select
                    required
                    value={formData.vehiculoId}
                    onChange={(e) => setFormData({ ...formData, vehiculoId: e.target.value })}
                    style={styles.select}
                  >
                    <option value="" style={styles.option}>-- Seleccionar Vehículo --</option>
                    {vehiculosFiltrados.map((v) => (
                      <option key={v.id} value={v.id} style={styles.option}>
                        {v.dominio} - {v.marca} {v.modelo}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={styles.sectionTitle}>Asignación de Servicio</div>
              <div style={styles.formRow}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Técnico Responsable</label>
                  <select
                    required
                    value={formData.tecnicoId}
                    onChange={(e) => setFormData({ ...formData, tecnicoId: e.target.value })}
                    style={styles.select}
                  >
                    <option value="" style={styles.option}>-- Seleccionar Mecánico --</option>
                    {tecnicos.map((tec) => (
                      <option key={tec.id} value={tec.id} style={styles.option}>
                        {tec.nombre} {tec.apellido} ({tec.correo || 'Técnico'})
                      </option>
                    ))}
                  </select>
                </div>

                {editandoId && (
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Estado del Ticket</label>
                    <select
                      value={formData.estado}
                      onChange={(e) => setFormData({ ...formData, estado: parseInt(e.target.value, 10) })}
                      style={styles.select}
                    >
                      <option value={0}>Ingresado</option>
                      <option value={1}>En Diagnóstico</option>
                      <option value={2}>En Reparación</option>
                      <option value={3}>Finalizado</option>
                      <option value={4}>Entregado</option>
                    </select>
                  </div>
                )}
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Falla / Motivo de Ingreso</label>
                <textarea
                  required
                  placeholder="Ej: Revisión por vibración en frenado a más de 80 km/h..."
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  style={styles.textarea}
                />
              </div>

              <div style={styles.modalActions}>
                <button type="button" onClick={() => setShowModal(false)} style={styles.btnSecondary}>Cancelar</button>
                <button type="submit" style={styles.btnPrimary}>{editandoId ? 'Guardar Cambios' : 'Crear Ticket'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL FACTURAR TICKET */}
      {ticketParaFacturar && (
        <ModalFacturarTicket
          ticket={ticketParaFacturar}
          alCerrar={() => setTicketParaFacturar(null)}
          alFacturarExitoso={() => {
            alert('Factura emitida con éxito.');
            cargarDatos();
          }}
        />
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
  btnDetail: { display: 'inline-flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#ffffff', color: '#0284c7', border: '1px solid #bae6fd', padding: '0.35rem 0.65rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' },
  btnInvoice: { display: 'inline-flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '0.35rem 0.65rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' },
  actionBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '0.35rem' },
  card: { backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.07)', overflow: 'hidden' },
  error: { padding: '0.75rem 1rem', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' },
  emptyState: { padding: '3rem', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' },
  thRow: { backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
  th: { padding: '0.85rem 1rem', color: '#475569', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '0.9rem 1rem', fontSize: '0.875rem', verticalAlign: 'middle' },
  cellFlex: { display: 'flex', alignItems: 'center', gap: '0.45rem' },
  badge: { display: 'inline-flex', alignItems: 'center', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600' },
  selectStatus: { padding: '0.4rem 0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8rem', backgroundColor: '#ffffff', color: '#0f172a', fontWeight: '500', cursor: 'pointer', outline: 'none' },
  option: { color: '#0f172a', backgroundColor: '#ffffff' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: '#64748b' },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: '#ffffff', borderRadius: '12px', padding: '1.5rem', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' },
  detailCard: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem 1rem' },
  detailSectionTitle: { display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: '700', color: '#0284c7', textTransform: 'uppercase', marginBottom: '0.35rem' },
  detailText: { margin: '0.2rem 0', fontSize: '0.85rem', color: '#334155' },
  historyItem: { fontSize: '0.8rem', padding: '0.5rem 0.65rem', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0' },
  historyMeta: { display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.75rem' },
  sectionTitle: { fontSize: '0.75rem', fontWeight: '700', color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.25rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '0.85rem' },
  formRow: { display: 'flex', gap: '0.65rem' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, minWidth: 0 },
  label: { fontSize: '0.8rem', fontWeight: '600', color: '#334155' },
  select: { width: '100%', boxSizing: 'border-box', padding: '0.5rem 0.65rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', backgroundColor: '#ffffff', color: '#0f172a', outline: 'none', cursor: 'pointer' },
  textarea: { boxSizing: 'border-box', padding: '0.5rem 0.65rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', backgroundColor: '#ffffff', color: '#0f172a', outline: 'none', minHeight: '60px', resize: 'vertical' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem' }
};