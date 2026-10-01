import { useEffect, useState, useMemo } from 'react';
import api from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  RefreshCw, 
  X, 
  Wrench, 
  Eye, 
  Calendar, 
  User, 
  Car, 
  Clock, 
  History, 
  Edit, 
  Receipt, 
  FileSpreadsheet,
  AlertTriangle,
  DollarSign,
  Search,
  FileText,
  Sparkles
} from 'lucide-react';
import ModalFacturarTicket from '../components/ModalFacturarTicket';
import { toast } from 'sonner';
import { exportToCsv } from '../utils/exportUtils';
import Pagination from '../components/Pagination';
import { generarPdfRemitoIngreso } from '../utils/pdfGenerator';
import { iaService } from '../api/iaService';
import ModalDiagnosticoIA from '../components/ModalDiagnosticoIA';
import MantenimientoPredictivoCard from '../components/MantenimientoPredictivoCard';

export default function Tickets() {
  const { tieneRol } = useAuth();
  const puedeCrearOEliminar = tieneRol(['Operadores']);
  const tieneAccesoView = tieneRol(['Operadores', 'Tecnicos']);

  const [tickets, setTickets] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Búsqueda y Paginación
  const [busqueda, setBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 10;

  const [ticketParaFacturar, setTicketParaFacturar] = useState(null);
  const [ticketSeleccionado, setTicketSeleccionado] = useState(null);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [historialVehiculo, setHistorialVehiculo] = useState([]);
  const [alertaEntrega, setAlertaEntrega] = useState(null);

  // Estados de IA
  const [modalIAAbierto, setModalIAAbierto] = useState(false);
  const [analizandoIA, setAnalizandoIA] = useState(false);
  const [resultadoIA, setResultadoIA] = useState(null);

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

  const cargarDatos = async (mostrarToast = false) => {
    if (!tieneAccesoView) return;

    setLoading(true);
    try {
      const [resTickets, resClientes, resVehiculos, resTecnicos, resFacturas, resProductos] = await Promise.all([
        api.get('/tickets'),
        api.get('/clientes').catch(() => ({ data: [] })),
        api.get('/vehiculos').catch(() => ({ data: [] })),
        api.get('/tecnicos').catch(() => ({ data: [] })),
        api.get('/facturas').catch(() => ({ data: [] })),
        api.get('/productos').catch(() => ({ data: [] }))
      ]);
      setTickets(resTickets.data || []);
      setClientes(resClientes.data || []);
      setVehiculos(resVehiculos.data || []);
      setTecnicos(resTecnicos.data || []);
      setFacturas(resFacturas.data || []);
      setProductos(resProductos.data || []);

      if (mostrarToast) {
        toast.success('Órdenes de trabajo actualizadas');
      }
    } catch {
      toast.error('Error al sincronizar datos de taller');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tieneAccesoView) {
      cargarDatos();
    }
  }, [tieneAccesoView]);

  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda]);

  const vehiculosFiltrados = formData.clienteId
    ? vehiculos.filter(v => v.clienteId === parseInt(formData.clienteId, 10) || v.dueño?.id === parseInt(formData.clienteId, 10))
    : vehiculos;

  const obtenerNombreTecnico = (t) => {
    if (t.tecnico) return `${t.tecnico.nombre} ${t.tecnico.apellido || ''}`.trim();
    if (t.nombreCompletoTecnico) return t.nombreCompletoTecnico;
    if (t.tecnicoId) {
      const encontrado = tecnicos.find(tec => tec.id === t.tecnicoId);
      if (encontrado) return `${encontrado.nombre} ${encontrado.apellido || ''}`.trim();
      return `Técnico #${t.tecnicoId}`;
    }
    return 'Sin Asignar';
  };

  const ticketsFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return tickets;

    return tickets.filter(t => {
      const dominio = t.vehiculo?.dominio || t.vehiculo?.patente || t.dominio || '';
      const marcaModelo = t.vehiculo ? `${t.vehiculo.marca || ''} ${t.vehiculo.modelo || ''}` : (t.nombreCompletoVehiculo || '');
      const cliente = t.cliente ? `${t.cliente.nombre} ${t.cliente.apellido || ''}` : (t.nombreCompletoCliente || '');
      const tec = obtenerNombreTecnico(t);
      const desc = t.descripcion || '';
      const idStr = String(t.id);

      return (
        idStr.includes(q) ||
        dominio.toLowerCase().includes(q) ||
        marcaModelo.toLowerCase().includes(q) ||
        cliente.toLowerCase().includes(q) ||
        tec.toLowerCase().includes(q) ||
        desc.toLowerCase().includes(q)
      );
    });
  }, [tickets, busqueda, tecnicos]);

  const itemsPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * itemsPorPagina;
    return ticketsFiltrados.slice(inicio, inicio + itemsPorPagina);
  }, [ticketsFiltrados, paginaActual]);

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

  // Disparador del análisis con IA
  const handleEjecutarDiagnosticoIA = async () => {
    if (!formData.descripcion.trim()) {
      toast.warning('Ingresa la descripción de la falla para que la IA pueda analizar los síntomas.');
      return;
    }

    const vehiculoSeleccionado = vehiculos.find(v => v.id === parseInt(formData.vehiculoId, 10)) || {};

    setModalIAAbierto(true);
    setAnalizandoIA(true);
    setResultadoIA(null);

    try {
      const respuesta = await iaService.analizarSintomas({
        sintomas: formData.descripcion,
        vehiculo: vehiculoSeleccionado,
        productosDisponibles: productos
      });
      setResultadoIA(respuesta);
    } catch {
      toast.error('No se pudo conectar con el servicio de Inteligencia Artificial');
      setModalIAAbierto(false);
    } finally {
      setAnalizandoIA(false);
    }
  };

  // Aplicar informe completo de IA al formulario del Ticket
  const handleAplicarSugerenciasIA = (diagnostico, repuestosElegidosIds) => {
    const nombresRepuestos = productos
      .filter(p => repuestosElegidosIds.includes(p.id))
      .map(p => `${p.nombre} (${p.codigo}) - Stock: ${p.stockActual} u.`);

    // 1. Hipótesis
    const bloqueHipotesis = diagnostico.hipotesis && diagnostico.hipotesis.length > 0
      ? diagnostico.hipotesis.map((h, i) => 
          `  ${i + 1}. ${h.falla} [${h.probabilidad}%]\n     Detalle: ${h.justificacion}`
        ).join('\n\n')
      : '  Sin hipótesis registradas.';

    // 2. Protocolo
    const bloqueProtocolo = diagnostico.protocoloInspeccion && diagnostico.protocoloInspeccion.length > 0
      ? diagnostico.protocoloInspeccion.map((paso) => `  [ ] ${paso}`).join('\n')
      : '  Revisión técnica general en elevador.';

    // 3. Repuestos en stock
    const bloqueRepuestosStock = nombresRepuestos.length > 0
      ? nombresRepuestos.map(r => `  • [Stock] ${r}`).join('\n')
      : '  Sin repuestos asignados del depósito.';

    // 4. Repuestos faltantes a comprar
    const bloqueRepuestosFaltantes = diagnostico.repuestosFaltantes && diagnostico.repuestosFaltantes.length > 0
      ? diagnostico.repuestosFaltantes.map(r => `  • [A PEDIR] ${r}`).join('\n')
      : '  No se detectaron faltantes a encargar.';

    // Horas estimadas
    const tiempoEstimado = diagnostico.estimacionHorasManoObra 
      ? `${diagnostico.estimacionHorasManoObra} hs` 
      : 'A evaluar por mecánico';

    const informeCompletoIA = `

==================================================
        INFORME DE PRE-DIAGNÓSTICO ASISTIDO (IA)
==================================================
TIEMPO ESTIMADO DE TRABAJO: ${tiempoEstimado}

POSIBLES CAUSAS IDENTIFICADAS:
${bloqueHipotesis}

PROTOCOLO DE INSPECCIÓN RECOMENDADO:
${bloqueProtocolo}

REPUESTOS EN DEPÓSITO:
${bloqueRepuestosStock}

REPUESTOS A ENCARGAR (SIN STOCK):
${bloqueRepuestosFaltantes}
==================================================`;

    setFormData(prev => ({
      ...prev,
      descripcion: (prev.descripcion.trim() + informeCompletoIA).trim()
    }));

    setModalIAAbierto(false);
    toast.success('Diagnóstico, insumos y tiempos integrados al ticket');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!puedeCrearOEliminar) return;

    if (!formData.clienteId || !formData.vehiculoId || !formData.tecnicoId) {
      toast.warning('Selecciona Cliente, Vehículo y Técnico asignado');
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
        toast.success(`Ticket #${editandoId} actualizado correctamente`);
      } else {
        await api.post('/tickets', payload);
        toast.success('Ticket de trabajo registrado');
      }
      setShowModal(false);
      setEditandoId(null);
      setFormData({ clienteId: '', vehiculoId: '', tecnicoId: '', descripcion: '', estado: 0 });
      cargarDatos();
    } catch (err) {
      toast.error(err.response?.data || 'Error al guardar el ticket');
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

  const ejecutarCambioEstado = async (id, nuevoEstado) => {
    try {
      await api.put(`/tickets/${id}/estado`, { estado: nuevoEstado });
      const nombreEstado = ESTADOS_MAP[nuevoEstado]?.label || 'Actualizado';
      toast.success(`Ticket #${id} pasó a: ${nombreEstado}`);
      cargarDatos();
    } catch (err) {
      toast.error(err.response?.data || 'Error al actualizar el estado del ticket');
    }
  };

  const handleCambiarEstado = (ticket, nuevoEstado) => {
    if (nuevoEstado === 4) {
      const facturaAsociada = facturas.find(
        f => f.ticketId === ticket.id && f.estado !== 'Anulada'
      );

      if (!facturaAsociada) {
        setAlertaEntrega({
          ticket,
          nuevoEstado,
          tipo: 'sin_factura',
          mensaje: 'El vehículo no posee una factura emitida asociada a esta orden de trabajo.'
        });
        return;
      }

      if (facturaAsociada.saldoPendiente > 0) {
        setAlertaEntrega({
          ticket,
          nuevoEstado,
          factura: facturaAsociada,
          tipo: 'con_deuda',
          saldo: facturaAsociada.saldoPendiente,
          mensaje: `La factura ${facturaAsociada.numeroFactura} registra un saldo pendiente de $${facturaAsociada.saldoPendiente.toLocaleString('es-AR', { minimumFractionDigits: 2 })}.`
        });
        return;
      }
    }

    ejecutarCambioEstado(ticket.id, nuevoEstado);
  };

  const handleExportarExcel = () => {
    if (!ticketsFiltrados.length) {
      toast.warning('No hay tickets para exportar.');
      return;
    }

    try {
      const columnas = [
        { key: 'id', label: 'N° Ticket' },
        { key: 'fecha', label: 'Fecha de Ingreso' },
        { key: 'dominio', label: 'Dominio / Patente' },
        { key: 'vehiculo', label: 'Vehículo (Marca y Modelo)' },
        { key: 'cliente', label: 'Cliente' },
        { key: 'tecnico', label: 'Técnico Asignado' },
        { key: 'descripcion', label: 'Falla Reportada / Trabajo' },
        { key: 'estado', label: 'Estado' }
      ];

      const datosFormateados = ticketsFiltrados.map(t => {
        const estId = parseEstado(t.estado);
        const dominio = t.vehiculo?.dominio || t.vehiculo?.patente || t.dominio || 'S/D';
        const vehiculo = t.vehiculo ? `${t.vehiculo.marca || ''} ${t.vehiculo.modelo || ''}`.trim() : (t.nombreCompletoVehiculo || '—');
        const cliente = t.cliente ? `${t.cliente.nombre} ${t.cliente.apellido || ''}`.trim() : (t.nombreCompletoCliente || 'Sin cliente');

        return {
          id: `#${t.id}`,
          fecha: t.fechaCreacion ? new Date(t.fechaCreacion).toLocaleDateString('es-AR') : '—',
          dominio,
          vehiculo,
          cliente,
          tecnico: obtenerNombreTecnico(t),
          descripcion: t.descripcion || '—',
          estado: ESTADOS_MAP[estId]?.label || t.estado
        };
      });

      const fechaHoy = new Date().toISOString().split('T')[0];
      exportToCsv(datosFormateados, columnas, `Tickets_Taller_CarFix_${fechaHoy}`);
      toast.success('Reporte de Tickets exportado para Excel');
    } catch {
      toast.error('Error al generar el archivo');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tickets de Taller</h1>
          <p className="page-subtitle">Gestión operativa con diagnóstico asistido por Inteligencia Artificial</p>
        </div>
        <div className="header-actions">
          <button onClick={handleExportarExcel} className="btn-secondary" title="Descargar reporte en formato Excel / CSV">
            <FileSpreadsheet size={15} color="#059669" /> Exportar a Excel
          </button>
          <button onClick={() => cargarDatos(true)} className="btn-secondary">
            <RefreshCw size={15} /> Refrescar
          </button>
          
          {puedeCrearOEliminar && (
            <button onClick={abrirModalNuevo} className="btn-primary">
              <Plus size={16} /> Nuevo Ticket
            </button>
          )}
        </div>
      </div>

      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.4rem 0.75rem', width: '100%', maxWidth: '340px' }}>
          <Search size={16} color="#64748b" />
          <input
            type="text"
            placeholder="Buscar por N°, patente, cliente o mecánico..."
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
          <div className="empty-state">Cargando órdenes de trabajo...</div>
        ) : ticketsFiltrados.length === 0 ? (
          <div className="empty-state">
            {busqueda ? 'No se encontraron tickets con ese criterio.' : 'No hay tickets activos en este momento.'}
          </div>
        ) : (
          <div className="ui-table-container">
            <table className="ui-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: '50px', textAlign: 'center' }}>Nro</th>
                  <th style={{ width: '22%' }}>Vehículo</th>
                  <th style={{ width: '16%' }}>Cliente</th>
                  <th style={{ width: '16%' }}>Mecánico</th>
                  <th>Falla Reportada</th>
                  <th style={{ width: '140px' }}>Estado</th>
                  <th style={{ width: '120px', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {itemsPaginados.map((t) => {
                  const estadoId = parseEstado(t.estado);
                  const estadoInfo = ESTADOS_MAP[estadoId] || ESTADOS_MAP[0];

                  const dominio = t.vehiculo?.dominio || t.vehiculo?.patente || t.dominio || 'S/D';
                  const marcaModelo = t.vehiculo
                    ? `${t.vehiculo.marca || ''} ${t.vehiculo.modelo || ''}`.trim()
                    : (t.nombreCompletoVehiculo || '');

                  const clienteNombre = t.cliente
                    ? `${t.cliente.nombre} ${t.cliente.apellido || ''}`.trim()
                    : (t.nombreCompletoCliente || 'Sin cliente');

                  const tecnicoNombre = obtenerNombreTecnico(t);
                  const esFacturable = estadoId >= 3;

                  const facturaTicket = facturas.find(f => f.ticketId === t.id && f.estado !== 'Anulada');
                  const tieneDeuda = facturaTicket && facturaTicket.saldoPendiente > 0;

                  return (
                    <tr key={t.id}>
                      <td style={{ textAlign: 'center' }}>
                        <strong style={{ color: '#0f172a', fontSize: '0.85rem' }}>#{t.id}</strong>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Car size={14} color="#64748b" style={{ flexShrink: 0 }} />
                          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={`${dominio} ${marcaModelo ? `(${marcaModelo})` : ''}`}>
                            <strong style={{ color: '#0f172a', fontSize: '0.85rem' }}>{dominio}</strong>
                            {marcaModelo && (
                              <span style={{ color: '#64748b', fontSize: '0.78rem', marginLeft: '4px' }}>
                                ({marcaModelo})
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <User size={14} color="#0284c7" style={{ flexShrink: 0 }} />
                          <span style={{ fontWeight: '500', color: '#0f172a', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={clienteNombre}>
                            {clienteNombre}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            backgroundColor: '#eff6ff',
                            color: '#0284c7',
                            fontSize: '0.72rem',
                            fontWeight: '700',
                            flexShrink: 0
                          }}>
                            {(tecnicoNombre[0] || 'T').toUpperCase()}
                          </span>
                          <strong style={{ fontSize: '0.82rem', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={tecnicoNombre}>
                            {tecnicoNombre}
                          </strong>
                        </div>
                      </td>
                      <td style={{ maxWidth: '170px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#475569', fontSize: '0.82rem' }} title={t.descripcion}>
                        {t.descripcion || '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <select
                            value={estadoId}
                            onChange={(e) => handleCambiarEstado(t, parseInt(e.target.value, 10))}
                            style={{
                              padding: '0.25rem 0.45rem',
                              border: `1px solid ${estadoInfo.border}`,
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              cursor: 'pointer',
                              outline: 'none',
                              width: '100%',
                              backgroundColor: estadoInfo.bg,
                              color: estadoInfo.text
                            }}
                          >
                            <option value={0} style={{ color: '#0f172a', backgroundColor: '#ffffff' }}>Ingresado</option>
                            <option value={1} style={{ color: '#0f172a', backgroundColor: '#ffffff' }}>En Diagnóstico</option>
                            <option value={2} style={{ color: '#0f172a', backgroundColor: '#ffffff' }}>En Reparación</option>
                            <option value={3} style={{ color: '#0f172a', backgroundColor: '#ffffff' }}>Finalizado</option>
                            <option value={4} style={{ color: '#0f172a', backgroundColor: '#ffffff' }}>Entregado</option>
                          </select>
                          {tieneDeuda && estadoId !== 4 && (
                            <button
                              type="button"
                              onClick={() => {
                                toast.info(`Factura ${facturaTicket.numeroFactura}: Saldo pendiente de $${facturaTicket.saldoPendiente.toLocaleString('es-AR')}`);
                                window.location.href = '/facturacion';
                              }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '4px',
                                borderRadius: '6px',
                                border: '1px solid #fecaca',
                                backgroundColor: '#fef2f2',
                                color: '#dc2626',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                              title={`Factura ${facturaTicket.numeroFactura} con saldo pendiente: $${facturaTicket.saldoPendiente.toLocaleString('es-AR')}. Clic para ir a cobrar.`}
                            >
                              <DollarSign size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          {/* Ver Detalle */}
                          <button
                            onClick={() => handleVerDetalle(t)}
                            style={{
                              padding: '5px',
                              borderRadius: '6px',
                              border: '1px solid #e2e8f0',
                              backgroundColor: '#ffffff',
                              color: '#475569',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center'
                            }}
                            title="Ver detalle del ticket"
                          >
                            <Eye size={15} />
                          </button>

                          {/* Remito PDF */}
                          <button
                            onClick={() => {
                              generarPdfRemitoIngreso(t);
                              toast.success(`Remito generado para Ticket #${t.id}`);
                            }}
                            style={{
                              padding: '5px',
                              borderRadius: '6px',
                              border: '1px solid #bae6fd',
                              backgroundColor: '#f0f9ff',
                              color: '#0284c7',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center'
                            }}
                            title="Descargar Remito de Ingreso"
                          >
                            <FileText size={15} />
                          </button>

                          {/* Facturar (solo si aplica) */}
                          {esFacturable && puedeCrearOEliminar && (
                            <button
                              onClick={() => setTicketParaFacturar(t)}
                              style={{
                                padding: '5px',
                                borderRadius: '6px',
                                border: '1px solid #bbf7d0',
                                backgroundColor: '#f0fdf4',
                                color: '#16a34a',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center'
                              }}
                              title="Emitir Factura"
                            >
                              <Receipt size={15} />
                            </button>
                          )}

                          {/* Editar */}
                          {puedeCrearOEliminar && (
                            <button
                              onClick={() => abrirModalEditar(t)}
                              style={{
                                padding: '5px',
                                borderRadius: '6px',
                                border: '1px solid transparent',
                                backgroundColor: 'transparent',
                                color: '#0284c7',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center'
                              }}
                              title="Editar Ticket"
                            >
                              <Edit size={15} />
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
        )}

        <Pagination
          paginaActual={paginaActual}
          totalItems={ticketsFiltrados.length}
          itemsPorPagina={itemsPorPagina}
          onCambioPagina={setPaginaActual}
        />
      </div>

      {/* MODAL ADVERTENCIA PREVENTIVA DE ENTREGA */}
      {alertaEntrega && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ backgroundColor: '#fef2f2', padding: '0.5rem', borderRadius: '10px', color: '#dc2626' }}>
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="modal-title" style={{ color: '#dc2626', fontSize: '1.15rem' }}>
                    Advertencia de Entrega
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                    Ticket #{alertaEntrega.ticket.id} - {alertaEntrega.ticket.vehiculo?.dominio || 'Vehículo'}
                  </p>
                </div>
              </div>
              <button onClick={() => setAlertaEntrega(null)} className="btn-ghost-icon"><X size={20} /></button>
            </div>

            <div style={{ marginTop: '1rem', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '0.85rem 1rem' }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#92400e', lineHeight: '1.45' }}>
                {alertaEntrega.mensaje}
              </p>
              {alertaEntrega.saldo && (
                <div style={{ marginTop: '0.6rem', fontSize: '1.25rem', fontWeight: '800', color: '#dc2626' }}>
                  Saldo: ${alertaEntrega.saldo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </div>
              )}
            </div>

            <p style={{ fontSize: '0.825rem', color: '#64748b', marginTop: '0.85rem', marginBottom: '1.25rem' }}>
              Se recomienda regularizar la cobranza antes de autorizar la salida de la unidad del taller.
            </p>

            <div className="modal-actions" style={{ justifyContent: 'space-between' }}>
              {alertaEntrega.tipo === 'sin_factura' ? (
                <button
                  onClick={() => {
                    const ticketTarget = alertaEntrega.ticket;
                    setAlertaEntrega(null);
                    setTicketParaFacturar(ticketTarget);
                  }}
                  className="btn-primary"
                  style={{ backgroundColor: '#059669' }}
                >
                  <Receipt size={14} /> Facturar Ahora
                </button>
              ) : (
                <button
                  onClick={() => {
                    setAlertaEntrega(null);
                    toast.info('Dirigiéndose a Facturación para asentar el cobro...');
                    window.location.href = '/facturacion';
                  }}
                  className="btn-primary"
                  style={{ backgroundColor: '#059669' }}
                >
                  <DollarSign size={14} /> Ir a Cobrar
                </button>
              )}

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => setAlertaEntrega(null)} className="btn-secondary">
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    const { ticket, nuevoEstado } = alertaEntrega;
                    setAlertaEntrega(null);
                    ejecutarCambioEstado(ticket.id, nuevoEstado);
                    toast.warning(`Ticket #${ticket.id} entregado con saldo adeudado.`);
                  }}
                  className="btn-secondary"
                  style={{ color: '#dc2626', borderColor: '#fecaca' }}
                >
                  Entregar de todos modos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALLE DE TICKET CON TARJETA PREDICTIVA */}
      {ticketSeleccionado && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Wrench size={20} color="#0284c7" /> Detalle del Ticket #{ticketSeleccionado.id}
              </h3>
              <button onClick={() => setTicketSeleccionado(null)} className="btn-ghost-icon"><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem 1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontSize: '0.875rem' }}>
                    <Calendar size={15} />
                    <span>Fecha: {new Date(ticketSeleccionado.fechaCreacion || Date.now()).toLocaleDateString('es-AR')}</span>
                  </div>
                  <span className="ui-badge" style={{
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
                <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem 1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: '700', color: '#0284c7', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                    <Car size={14} /> Vehículo
                  </div>
                  <p style={{ margin: '0.2rem 0', fontSize: '0.85rem', color: '#334155' }}><strong>Dominio:</strong> {ticketSeleccionado.vehiculo?.dominio || ticketSeleccionado.vehiculo?.patente || 'S/D'}</p>
                  <p style={{ margin: '0.2rem 0', fontSize: '0.85rem', color: '#334155' }}><strong>Marca/Modelo:</strong> {ticketSeleccionado.vehiculo?.marca || '—'} {ticketSeleccionado.vehiculo?.modelo || ''}</p>
                  <p style={{ margin: '0.2rem 0', fontSize: '0.85rem', color: '#334155' }}><strong>Año:</strong> {ticketSeleccionado.vehiculo?.año || '—'}</p>
                </div>

                <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem 1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: '700', color: '#0284c7', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                    <User size={14} /> Cliente
                  </div>
                  <p style={{ margin: '0.2rem 0', fontSize: '0.85rem', color: '#334155' }}>
                    <strong>Nombre:</strong> {ticketSeleccionado.cliente ? `${ticketSeleccionado.cliente.nombre} ${ticketSeleccionado.cliente.apellido || ''}` : (ticketSeleccionado.nombreCompletoCliente || 'Particular')}
                  </p>
                  <p style={{ margin: '0.2rem 0', fontSize: '0.85rem', color: '#334155' }}><strong>DNI:</strong> {ticketSeleccionado.cliente?.dni || '—'}</p>
                  <p style={{ margin: '0.2rem 0', fontSize: '0.85rem', color: '#334155' }}><strong>Tel:</strong> {ticketSeleccionado.cliente?.telefono || '—'}</p>
                  <p style={{ margin: '0.2rem 0', fontSize: '0.85rem', color: '#334155' }}><strong>Correo:</strong> {ticketSeleccionado.cliente?.correo || '—'}</p>
                </div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem 1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: '700', color: '#0284c7', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  <Wrench size={14} /> Técnico Asignado
                </div>
                <p style={{ margin: '0.2rem 0', fontSize: '0.85rem', color: '#334155' }}>
                  <strong>Nombre:</strong> {obtenerNombreTecnico(ticketSeleccionado)}
                </p>
                {ticketSeleccionado.tecnico?.correo && (
                  <p style={{ margin: '0.2rem 0', fontSize: '0.85rem', color: '#334155' }}><strong>Contacto:</strong> {ticketSeleccionado.tecnico.correo}</p>
                )}
              </div>

              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem 1rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Descripción / Diagnóstico Registrado</div>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#1e293b', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                  {ticketSeleccionado.descripcion || 'Sin descripción ingresada.'}
                </p>
              </div>

              {/* Salud Predictiva IA del Vehículo */}
              <MantenimientoPredictivoCard 
                vehiculoId={ticketSeleccionado.vehiculoId || ticketSeleccionado.vehiculo?.id} 
              />

              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem 1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: '700', color: '#0284c7', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
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
                        <div key={h.id} style={{ fontSize: '0.8rem', padding: '0.5rem 0.65rem', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.75rem' }}>
                            <span style={{ fontWeight: '700', color: '#0f172a' }}>Ticket #{h.id}</span>
                            <span className="ui-badge" style={{
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

              <div className="modal-actions" style={{ marginTop: '0.5rem', justifyContent: 'space-between' }}>
                <button
                  type="button"
                  onClick={() => {
                    generarPdfRemitoIngreso(ticketSeleccionado);
                    toast.success(`Remito generado para Ticket #${ticketSeleccionado.id}`);
                  }}
                  className="btn-secondary"
                  style={{ color: '#0284c7', borderColor: '#bae6fd' }}
                >
                  <FileText size={14} /> Descargar Remito de Ingreso
                </button>
                <button onClick={() => setTicketSeleccionado(null)} className="btn-secondary">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ALTA/EDICIÓN DE TICKET CON ASISTENTE IA */}
      {(showModal && puedeCrearOEliminar) && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Wrench size={20} color="#0284c7" /> {editandoId ? `Modificar Ticket #${editandoId}` : 'Registrar Ingreso a Taller'}
              </h3>
              <button onClick={() => setShowModal(false)} className="btn-ghost-icon"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.25rem' }}>
                Titular y Vehículo
              </div>
              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Cliente</label>
                  <select
                    required
                    value={formData.clienteId}
                    onChange={(e) => setFormData({ ...formData, clienteId: e.target.value, vehiculoId: '' })}
                    className="form-select"
                  >
                    <option value="">-- Seleccionar Cliente --</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} {c.apellido} (DNI: {c.dni})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Vehículo</label>
                  <select
                    required
                    value={formData.vehiculoId}
                    onChange={(e) => setFormData({ ...formData, vehiculoId: e.target.value })}
                    className="form-select"
                  >
                    <option value="">-- Seleccionar Vehículo --</option>
                    {vehiculosFiltrados.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.dominio || v.patente} - {v.marca} {v.modelo}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.25rem' }}>
                Asignación de Servicio
              </div>
              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Técnico Responsable</label>
                  <select
                    required
                    value={formData.tecnicoId}
                    onChange={(e) => setFormData({ ...formData, tecnicoId: e.target.value })}
                    className="form-select"
                  >
                    <option value="">-- Seleccionar Mecánico --</option>
                    {tecnicos.map((tec) => (
                      <option key={tec.id} value={tec.id}>
                        {tec.nombre} {tec.apellido} ({tec.correo || 'Técnico'})
                      </option>
                    ))}
                  </select>
                </div>

                {editandoId && (
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Estado del Ticket</label>
                    <select
                      value={formData.estado}
                      onChange={(e) => setFormData({ ...formData, estado: parseInt(e.target.value, 10) })}
                      className="form-select"
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

              {/* Falla con disparador de IA y Textarea expandido */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>Falla / Motivo de Ingreso</label>
                  <button
                    type="button"
                    onClick={handleEjecutarDiagnosticoIA}
                    className="btn-secondary"
                    style={{
                      padding: '0.2rem 0.55rem',
                      fontSize: '0.75rem',
                      color: '#0284c7',
                      borderColor: '#bae6fd',
                      backgroundColor: '#f0f9ff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="Analizar síntomas con Procesamiento de Lenguaje Natural"
                  >
                    <Sparkles size={13} color="#0284c7" /> Analizar con IA
                  </button>
                </div>
                <textarea
                  required
                  placeholder="Ej: El cliente escucha un zumbido al acelerar en ruta y siente vibración en el volante a más de 80 km/h..."
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="form-textarea"
                  style={{
                    minHeight: '170px',
                    resize: 'vertical',
                    fontFamily: 'monospace',
                    fontSize: '0.82rem',
                    lineHeight: '1.45'
                  }}
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">{editandoId ? 'Guardar Cambios' : 'Crear Ticket'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ASISTENTE IA DE PRE-DIAGNÓSTICO */}
      {modalIAAbierto && (
        <ModalDiagnosticoIA
          resultado={resultadoIA}
          cargando={analizandoIA}
          alCerrar={() => setModalIAAbierto(false)}
          alAplicarSugerencias={handleAplicarSugerenciasIA}
        />
      )}

      {ticketParaFacturar && (
        <ModalFacturarTicket
          ticket={ticketParaFacturar}
          alCerrar={() => setTicketParaFacturar(null)}
          alFacturarExitoso={() => {
            toast.success('Factura emitida con éxito');
            cargarDatos();
          }}
        />
      )}
    </div>
  );
}