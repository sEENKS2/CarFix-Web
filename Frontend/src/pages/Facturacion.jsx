import { useState, useEffect } from 'react';
import { facturasService } from '../api/facturasService';
import { RefreshCw, Receipt, DollarSign, Ban, Eye, CheckCircle2, AlertCircle, Clock, X, CreditCard, Banknote, Building2 } from 'lucide-react';

export default function Facturacion() {
  const [facturas, setFacturas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);
  const [modalCobro, setModalCobro] = useState(null);
  const [montoPago, setMontoPago] = useState('');
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [referenciaPago, setReferenciaPago] = useState('');
  const [mensaje, setMensaje] = useState(null);

  const ESTADOS_FACTURA = {
    Pendiente: { label: 'Pendiente', bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
    PagadaParcial: { label: 'Cobro Parcial', bg: '#fffbeb', text: '#b45309', border: '#fde68a' },
    Pagada: { label: 'Cobrada', bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' },
    Anulada: { label: 'Anulada', bg: '#f1f5f9', text: '#64748b', border: '#cbd5e1' }
  };

  const cargarFacturas = async () => {
    try {
      setCargando(true);
      const res = await facturasService.obtenerTodas();
      setFacturas(res.data);
    } catch {
      setMensaje({ tipo: 'error', texto: 'No se pudieron recuperar las facturas de la base de datos.' });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarFacturas();
  }, []);

  const abrirModalCobro = (fac) => {
    setModalCobro(fac);
    setMontoPago(fac.saldoPendiente);
    setReferenciaPago('');
    setMetodoPago('Efectivo');
  };

  const handlePagoSubmit = async (e) => {
    e.preventDefault();
    if (!modalCobro || !montoPago) return;

    try {
      await facturasService.registrarPago(modalCobro.id, {
        monto: parseFloat(montoPago),
        metodoPago,
        referenciaComprobante: referenciaPago
      });
      setMensaje({ tipo: 'exito', texto: `Cobro de $${parseFloat(montoPago).toLocaleString('es-AR')} asentado con éxito.` });
      setModalCobro(null);
      cargarFacturas();
    } catch (err) {
      const msg = err.response?.data?.mensaje || 'Error al procesar el cobro.';
      setMensaje({ tipo: 'error', texto: msg });
    }
  };

  const handleAnular = async (id) => {
    const motivo = prompt('Ingrese el motivo de anulación del comprobante:');
    if (!motivo) return;

    try {
      await facturasService.anularFactura(id, motivo);
      setMensaje({ tipo: 'exito', texto: 'Comprobante anulado exitosamente.' });
      cargarFacturas();
    } catch (err) {
      const msg = err.response?.data?.mensaje || 'No se pudo anular la factura.';
      setMensaje({ tipo: 'error', texto: msg });
    }
  };

  const facturasFiltradas = facturas.filter((f) => {
    if (filtroEstado === 'Todos') return true;
    return f.estado.toLowerCase() === filtroEstado.toLowerCase();
  });

  const totalPorCobrar = facturas
    .filter(f => f.estado !== 'Anulada')
    .reduce((acc, f) => acc + (f.saldoPendiente || 0), 0);

  const totalCobrado = facturas
    .filter(f => f.estado !== 'Anulada')
    .reduce((acc, f) => acc + ((f.total || 0) - (f.saldoPendiente || 0)), 0);

  return (
    <div>
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Gestión de Facturación y Cobranzas</h1>
          <p style={styles.subtitle}>Emisión de comprobantes, control de cuenta corriente y registro de pagos</p>
        </div>
        <div style={styles.headerActions}>
          <button onClick={cargarFacturas} style={styles.btnSecondary}>
            <RefreshCw size={15} /> Refrescar
          </button>
        </div>
      </div>

      {/* METRICAS RAPIDAS */}
      <div style={styles.kpiGrid}>
        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>Total Cobrado</span>
          <strong style={{ ...styles.kpiValue, color: '#059669' }}>
            ${totalCobrado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </strong>
        </div>
        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>Saldos Pendientes de Cobro</span>
          <strong style={{ ...styles.kpiValue, color: '#dc2626' }}>
            ${totalPorCobrar.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </strong>
        </div>
        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>Comprobantes Emitidos</span>
          <strong style={{ ...styles.kpiValue, color: '#0f172a' }}>{facturas.length}</strong>
        </div>
      </div>

      {/* MENSAJES DE ALERTA */}
      {mensaje && (
        <div style={{
          ...styles.alert,
          backgroundColor: mensaje.tipo === 'error' ? '#fef2f2' : '#ecfdf5',
          color: mensaje.tipo === 'error' ? '#dc2626' : '#047857',
          borderColor: mensaje.tipo === 'error' ? '#fecaca' : '#a7f3d0'
        }}>
          {mensaje.tipo === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          <span>{mensaje.texto}</span>
          <button onClick={() => setMensaje(null)} style={{ background: 'none', border: 'none', marginLeft: 'auto', cursor: 'pointer', color: 'inherit' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* FILTROS Y TABLA */}
      <div style={styles.card}>
        <div style={styles.filterBar}>
          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569' }}>Filtrar por estado:</span>
          <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} style={styles.selectFilter}>
            <option value="Todos">Todos los comprobantes</option>
            <option value="Pendiente">Solo Pendientes</option>
            <option value="PagadaParcial">Cobro Parcial</option>
            <option value="Pagada">Cobrada Total</option>
            <option value="Anulada">Anuladas</option>
          </select>
        </div>

        {cargando ? (
          <div style={styles.emptyState}>Cargando comprobantes...</div>
        ) : facturasFiltradas.length === 0 ? (
          <div style={styles.emptyState}>No se registraron comprobantes con el filtro seleccionado.</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>N° Comprobante</th>
                <th style={styles.th}>Fecha</th>
                <th style={styles.th}>Ticket Ref.</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Total</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Saldo Pendiente</th>
                <th style={styles.th}>Estado</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {facturasFiltradas.map((fac, idx) => {
                const confEstado = ESTADOS_FACTURA[fac.estado] || ESTADOS_FACTURA.Pendiente;
                return (
                  <tr key={fac.id} style={{ ...styles.tr, backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <Receipt size={15} color="#0284c7" />
                        <strong>{fac.numeroFactura}</strong>
                      </div>
                    </td>
                    <td style={styles.td}>{new Date(fac.fechaEmision).toLocaleDateString('es-AR')}</td>
                    <td style={styles.td}>
                      <span style={{ fontWeight: '600', color: '#0284c7' }}>#{fac.ticketId}</span>
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right', fontWeight: '600', color: '#0f172a' }}>
                      ${fac.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right', fontWeight: '700', color: fac.saldoPendiente > 0 ? '#dc2626' : '#059669' }}>
                      ${fac.saldoPendiente.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        backgroundColor: confEstado.bg,
                        color: confEstado.text,
                        border: `1px solid ${confEstado.border}`
                      }}>
                        {confEstado.label}
                      </span>
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '0.4rem' }}>
                      <button
                        onClick={() => setFacturaSeleccionada(fac)}
                        style={styles.btnDetail}
                        title="Ver detalle del comprobante"
                      >
                        <Eye size={14} /> Detalle
                      </button>

                      {fac.estado !== 'Pagada' && fac.estado !== 'Anulada' && (
                        <button
                          onClick={() => abrirModalCobro(fac)}
                          style={styles.btnPay}
                          title="Asentar cobro / entrega"
                        >
                          <DollarSign size={14} /> Cobrar
                        </button>
                      )}

                      {fac.pagos?.length === 0 && fac.estado !== 'Anulada' && (
                        <button
                          onClick={() => handleAnular(fac.id)}
                          style={styles.btnCancel}
                          title="Anular comprobante"
                        >
                          <Ban size={14} /> Anular
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

      {/* MODAL ASENTAR COBRO */}
      {modalCobro && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalContent, maxWidth: '480px' }}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                <DollarSign size={20} color="#059669" /> Asentar Cobro
              </h3>
              <button onClick={() => setModalCobro(null)} style={styles.iconBtn}><X size={20} /></button>
            </div>

            <div style={styles.infoBanner}>
              <div>Factura: <strong>{modalCobro.numeroFactura}</strong></div>
              <div>Saldo adeudado: <strong style={{ color: '#dc2626' }}>${modalCobro.saldoPendiente.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</strong></div>
            </div>

            <form onSubmit={handlePagoSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Monto recibido ($):</label>
                <input
                  type="number"
                  step="0.01"
                  max={modalCobro.saldoPendiente}
                  value={montoPago}
                  onChange={(e) => setMontoPago(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Forma de pago:</label>
                <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)} style={styles.select}>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia Bancaria</option>
                  <option value="Tarjeta">Tarjeta de Débito / Crédito</option>
                </select>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Referencia de operación / POS (opcional):</label>
                <input
                  type="text"
                  placeholder="Ej: Trf #94827 o Cupón 1102"
                  value={referenciaPago}
                  onChange={(e) => setReferenciaPago(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.modalActions}>
                <button type="button" onClick={() => setModalCobro(null)} style={styles.btnSecondary}>
                  Cancelar
                </button>
                <button type="submit" style={styles.btnPrimaryGreen}>
                  Confirmar Cobro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL VER DETALLE COMPLETO DE FACTURA */}
      {facturaSeleccionada && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalContent, maxWidth: '620px' }}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                <Receipt size={20} color="#0284c7" /> Comprobante {facturaSeleccionada.numeroFactura}
              </h3>
              <button onClick={() => setFacturaSeleccionada(null)} style={styles.iconBtn}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={styles.detailCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span>Fecha de Emisión: <strong>{new Date(facturaSeleccionada.fechaEmision).toLocaleDateString('es-AR')}</strong></span>
                  <span>Ticket Vinculado: <strong>#{facturaSeleccionada.ticketId}</strong></span>
                </div>
              </div>

              <span style={styles.sectionTitle}>Ítems de Factura</span>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.thRow}>
                      <th style={styles.th}>Tipo</th>
                      <th style={styles.th}>Descripción</th>
                      <th style={{ ...styles.th, textAlign: 'center' }}>Cant.</th>
                      <th style={{ ...styles.th, textAlign: 'right' }}>P. Unit</th>
                      <th style={{ ...styles.th, textAlign: 'right' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {facturaSeleccionada.detalles?.map((d, i) => (
                      <tr key={i} style={styles.tr}>
                        <td style={styles.td}><span style={styles.badgeTipo}>{d.tipo}</span></td>
                        <td style={styles.td}>{d.descripcion}</td>
                        <td style={{ ...styles.td, textAlign: 'center' }}>{d.cantidad}</td>
                        <td style={{ ...styles.td, textAlign: 'right' }}>${d.precioUnitario.toFixed(2)}</td>
                        <td style={{ ...styles.td, textAlign: 'right', fontWeight: '600' }}>
                          ${(d.cantidad * d.precioUnitario).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* HISTORIAL DE COBROS DE ESTA FACTURA */}
              <span style={styles.sectionTitle}>Historial de Cobros Recibidos</span>
              {facturaSeleccionada.pagos?.length === 0 ? (
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>No registra pagos recibidos aún.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {facturaSeleccionada.pagos.map((p, idx) => (
                    <div key={idx} style={styles.paymentCard}>
                      <div>
                        <strong>${p.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</strong> - {p.metodoPago}
                        {p.referenciaComprobante && <span style={{ color: '#64748b', marginLeft: '6px' }}>({p.referenciaComprobante})</span>}
                      </div>
                      <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
                        {new Date(p.fechaPago).toLocaleDateString('es-AR')}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={styles.modalActions}>
                <button onClick={() => setFacturaSeleccionada(null)} style={styles.btnSecondary}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' },
  title: { margin: 0, fontSize: '1.625rem', fontWeight: '700', color: '#0f172a', letterSpacing: '-0.025em' },
  subtitle: { margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#64748b' },
  headerActions: { display: 'flex', gap: '0.65rem' },
  btnSecondary: { display: 'inline-flex', alignItems: 'center', gap: '0.45rem', backgroundColor: '#ffffff', color: '#334155', border: '1px solid #cbd5e1', padding: '0.5rem 0.9rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' },
  kpiCard: { backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' },
  kpiLabel: { fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' },
  kpiValue: { fontSize: '1.35rem', fontWeight: '800' },
  card: { backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.07)', overflow: 'hidden' },
  filterBar: { padding: '0.85rem 1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: '#f8fafc' },
  selectFilter: { padding: '0.4rem 0.65rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', backgroundColor: '#ffffff', color: '#0f172a', outline: 'none' },
  alert: { padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid', marginBottom: '1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' },
  emptyState: { padding: '3rem', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' },
  thRow: { backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
  th: { padding: '0.85rem 1rem', color: '#475569', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '0.85rem 1rem', verticalAlign: 'middle' },
  badge: { display: 'inline-flex', alignItems: 'center', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600' },
  badgeTipo: { display: 'inline-flex', padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '600', backgroundColor: '#eff6ff', color: '#1d4ed8' },
  btnDetail: { display: 'inline-flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#ffffff', color: '#0284c7', border: '1px solid #bae6fd', padding: '0.35rem 0.65rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' },
  btnPay: { display: 'inline-flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '0.35rem 0.65rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' },
  btnCancel: { display: 'inline-flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '0.35rem 0.65rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: '#ffffff', borderRadius: '12px', padding: '1.5rem', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' },
  modalTitle: { display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: '#0f172a', fontSize: '1.15rem', fontWeight: '700' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: '#64748b' },
  infoBanner: { display: 'flex', justifyContent: 'space-between', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '0.25rem' },
  label: { fontSize: '0.8rem', fontWeight: '600', color: '#334155' },
  input: { padding: '0.5rem 0.65rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', color: '#0f172a', outline: 'none' },
  select: { padding: '0.5rem 0.65rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', color: '#0f172a', outline: 'none', backgroundColor: '#ffffff' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '1rem' },
  btnPrimaryGreen: { display: 'inline-flex', alignItems: 'center', gap: '0.45rem', backgroundColor: '#059669', color: '#ffffff', border: 'none', padding: '0.5rem 1.1rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' },
  sectionTitle: { fontSize: '0.75rem', fontWeight: '700', color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.5rem' },
  detailCard: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem 1rem' },
  paymentCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }
};