import { useEffect, useState } from 'react';
import api from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { Plus, RefreshCw, X, Calendar, Clock, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import ConfirmModal from '../components/ConfirmModal';

export default function Turnos() {
  const { tieneRol } = useAuth();
  const puedeGestionar = tieneRol(['Operadores']);

  const [turnos, setTurnos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [turnoAIngresar, setTurnoAIngresar] = useState(null);

  const [formData, setFormData] = useState({
    clienteId: '',
    vehiculoId: '',
    fechaTurno: '',
    horaTurno: '',
    motivoConsulta: ''
  });

  const ESTADOS_MAP = {
    0: { label: 'Pendiente', bg: '#fffbeb', text: '#b45309', border: '#fde68a' },
    1: { label: 'Completado', bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' },
    2: { label: 'Cancelado', bg: '#fef2f2', text: '#dc2626', border: '#fecaca' }
  };

  const cargarDatos = async (mostrarToast = false) => {
    setLoading(true);
    try {
      const [resTurnos, resClientes, resVehiculos] = await Promise.all([
        api.get('/turnos').catch(() => ({ data: [] })),
        api.get('/clientes').catch(() => ({ data: [] })),
        api.get('/vehiculos').catch(() => ({ data: [] }))
      ]);
      setTurnos(resTurnos.data || []);
      setClientes(resClientes.data || []);
      setVehiculos(resVehiculos.data || []);

      if (mostrarToast) {
        toast.success('Agenda de turnos actualizada');
      }
    } catch {
      toast.error('Error al sincronizar la agenda de turnos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const vehiculosFiltrados = formData.clienteId
    ? vehiculos.filter(v => v.clienteId === parseInt(formData.clienteId, 10) || v.dueño?.id === parseInt(formData.clienteId, 10))
    : vehiculos;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.clienteId || !formData.vehiculoId || !formData.fechaTurno || !formData.horaTurno) {
      toast.warning('Por favor completa todos los campos requeridos');
      return;
    }

    const payload = {
      clienteId: parseInt(formData.clienteId, 10),
      vehiculoId: parseInt(formData.vehiculoId, 10),
      fechaHora: `${formData.fechaTurno}T${formData.horaTurno}:00`,
      motivoConsulta: formData.motivoConsulta
    };

    try {
      await api.post('/turnos', payload);
      toast.success('Turno agendado correctamente');
      setShowModal(false);
      setFormData({ clienteId: '', vehiculoId: '', fechaTurno: '', horaTurno: '', motivoConsulta: '' });
      cargarDatos();
    } catch (err) {
      toast.error(err.response?.data || 'Error al agendar el turno');
    }
  };

  const handleCambiarEstado = async (id, nuevoEstado) => {
    try {
      await api.put(`/turnos/${id}/estado`, { estado: nuevoEstado });
      const nombre = ESTADOS_MAP[nuevoEstado]?.label || 'Actualizado';
      toast.success(`Turno #${id} marcado como: ${nombre}`);
      cargarDatos();
    } catch (err) {
      toast.error(err.response?.data || 'Error al actualizar el estado');
    }
  };

  const confirmarIngresoATaller = async () => {
    if (!turnoAIngresar) return;
    const turno = turnoAIngresar;

    try {
      await api.post('/tickets', {
        clienteId: turno.clienteId || turno.cliente?.id,
        vehiculoId: turno.vehiculoId || turno.vehiculo?.id,
        descripcion: turno.motivoConsulta || 'Ingreso por turno programado',
        estado: 0
      });

      await api.put(`/turnos/${turno.id}/estado`, { estado: 1 });
      toast.success(`Ticket generado e ingreso asentado para el turno #${turno.id}`);
      cargarDatos();
    } catch (err) {
      toast.error(err.response?.data || 'Error al generar el ticket');
    } finally {
      setTurnoAIngresar(null);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Agenda de Turnos</h1>
          <p className="page-subtitle">Programación de citas y recepción de vehículos</p>
        </div>
        <div className="header-actions">
          <button onClick={() => cargarDatos(true)} className="btn-secondary">
            <RefreshCw size={15} /> Refrescar
          </button>
          {puedeGestionar && (
            <button onClick={() => setShowModal(true)} className="btn-primary">
              <Plus size={16} /> Agendar Turno
            </button>
          )}
        </div>
      </div>

      <div className="ui-card">
        {loading ? (
          <div className="empty-state">Cargando agenda...</div>
        ) : turnos.length === 0 ? (
          <div className="empty-state">No hay turnos programados en este momento.</div>
        ) : (
          <div className="ui-table-container">
            <table className="ui-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>Nro</th>
                  <th>Fecha y Hora</th>
                  <th>Cliente</th>
                  <th>Vehículo</th>
                  <th>Motivo de Consulta</th>
                  <th style={{ width: '120px' }}>Estado</th>
                  <th style={{ width: '160px', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {turnos.map((t) => {
                  const est = ESTADOS_MAP[t.estado] || ESTADOS_MAP[0];
                  const fechaObj = new Date(t.fechaHora || t.fechaTurno || Date.now());
                  return (
                    <tr key={t.id}>
                      <td><strong style={{ color: '#0f172a' }}>#{t.id}</strong></td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.85rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: '#0f172a' }}>
                            <Calendar size={13} color="#64748b" /> {fechaObj.toLocaleDateString('es-AR')}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b', fontSize: '0.78rem' }}>
                            <Clock size={12} /> {fechaObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
                          </span>
                        </div>
                      </td>
                      <td>
                        <strong style={{ color: '#0f172a' }}>
                          {t.cliente ? `${t.cliente.nombre} ${t.cliente.apellido}` : (t.nombreCliente || 'Sin datos')}
                        </strong>
                      </td>
                      <td>
                        <div>
                          <strong>{t.vehiculo?.dominio || t.dominioVehiculo || 'S/D'}</strong>
                          <span style={{ color: '#64748b', fontSize: '0.8rem', marginLeft: '4px' }}>
                            ({t.vehiculo?.marca || ''} {t.vehiculo?.modelo || ''})
                          </span>
                        </div>
                      </td>
                      <td style={{ color: '#475569' }}>{t.motivoConsulta || '—'}</td>
                      <td>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          backgroundColor: est.bg,
                          color: est.text,
                          border: `1px solid ${est.border}`
                        }}>
                          {est.label}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          {t.estado === 0 && puedeGestionar && (
                            <>
                              <button
                                onClick={() => setTurnoAIngresar(t)}
                                className="btn-primary"
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', gap: '0.3rem' }}
                                title="Ingresar a Taller e iniciar orden de servicio"
                              >
                                Ingresar <ArrowRight size={12} />
                              </button>
                              <button
                                onClick={() => handleCambiarEstado(t.id, 2)}
                                className="btn-ghost-icon"
                                title="Cancelar Turno"
                              >
                                <XCircle size={16} color="#dc2626" />
                              </button>
                            </>
                          )}
                          {t.estado === 1 && (
                            <span style={{ fontSize: '0.78rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                              <CheckCircle2 size={14} /> Atendido
                            </span>
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
      </div>

      {showModal && puedeGestionar && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={20} color="#0284c7" /> Agendar Nuevo Turno
              </h3>
              <button onClick={() => setShowModal(false)} className="btn-ghost-icon"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Cliente</label>
                  <select
                    required
                    value={formData.clienteId}
                    onChange={(e) => setFormData({ ...formData, clienteId: e.target.value, vehiculoId: '' })}
                    className="form-select"
                  >
                    <option value="">-- Titular --</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} {c.apellido}
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
                    <option value="">-- Unidad --</option>
                    {vehiculosFiltrados.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.dominio || v.patente} - {v.marca}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Fecha</label>
                  <input
                    type="date"
                    required
                    value={formData.fechaTurno}
                    onChange={(e) => setFormData({ ...formData, fechaTurno: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Hora</label>
                  <input
                    type="time"
                    required
                    value={formData.horaTurno}
                    onChange={(e) => setFormData({ ...formData, horaTurno: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Motivo de la Cita</label>
                <textarea
                  required
                  placeholder="Ej: Service de los 50.000 km, chequeo de pastillas..."
                  value={formData.motivoConsulta}
                  onChange={(e) => setFormData({ ...formData, motivoConsulta: e.target.value })}
                  className="form-textarea"
                  style={{ minHeight: '60px' }}
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">Confirmar Turno</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación para Ingreso a Taller */}
      <ConfirmModal
        isOpen={Boolean(turnoAIngresar)}
        title="Ingresar Vehículo a Taller"
        message={`¿Confirmar el ingreso del vehículo ${turnoAIngresar?.vehiculo?.dominio || turnoAIngresar?.dominioVehiculo || ''} para inicializar su Ticket de Trabajo?`}
        confirmText="Ingresar a Taller"
        variant="primary"
        onConfirm={confirmarIngresoATaller}
        onCancel={() => setTurnoAIngresar(null)}
      />
    </div>
  );
}