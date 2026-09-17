import { useState, useEffect } from 'react';
import api from '../api/axiosClient';
import { facturasService } from '../api/facturasService';
import { 
  RefreshCw, 
  Receipt, 
  DollarSign, 
  Ban, 
  Eye, 
  X, 
  FileText,
  FileSpreadsheet
} from 'lucide-react';
import { toast } from 'sonner';
import { exportToCsv } from '../utils/exportUtils';
import { generarPdfFactura } from '../utils/pdfGenerator';

export default function Facturacion() {
  const [facturas, setFacturas] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);
  const [modalCobro, setModalCobro] = useState(null);
  const [montoPago, setMontoPago] = useState('');
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [referenciaPago, setReferenciaPago] = useState('');

  const ESTADOS_FACTURA = {
    Pendiente: { label: 'Pendiente', bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
    PagadaParcial: { label: 'Cobro Parcial', bg: '#fffbeb', text: '#b45309', border: '#fde68a' },
    Pagada: { label: 'Cobrada', bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' },
    Anulada: { label: 'Anulada', bg: '#f1f5f9', text: '#64748b', border: '#cbd5e1' }
  };

  const cargarDatos = async (mostrarToast = false) => {
    try {
      setCargando(true);
      const [resFacturas, resTickets] = await Promise.all([
        facturasService.obtenerTodas(),
        api.get('/tickets').catch(() => ({ data: [] }))
      ]);
      setFacturas(resFacturas.data || []);
      setTickets(resTickets.data || []);
      if (mostrarToast) {
        toast.success('Facturación y cobranzas actualizadas');
      }
    } catch {
      toast.error('No se pudieron recuperar las facturas');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
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
      toast.success(`Cobro de $${parseFloat(montoPago).toLocaleString('es-AR')} asentado con éxito`);
      setModalCobro(null);
      cargarDatos();
    } catch (err) {
      const msg = err.response?.data?.mensaje || err.response?.data || 'Error al procesar el cobro';
      toast.error(msg);
    }
  };

  const handleAnular = async (id) => {
    const motivo = prompt('Ingrese el motivo de anulación del comprobante:');
    if (!motivo) return;

    try {
      await facturasService.anularFactura(id, motivo);
      toast.success('Comprobante anulado exitosamente');
      cargarDatos();
    } catch (err) {
      const msg = err.response?.data?.mensaje || err.response?.data || 'No se pudo anular la factura';
      toast.error(msg);
    }
  };

  const handleDescargarPdf = (fac) => {
    const ticketAsociado = tickets.find(t => t.id === fac.ticketId) || null;
    generarPdfFactura(fac, ticketAsociado);
    toast.success(`PDF generado para Factura ${fac.numeroFactura}`);
  };

  const facturasFiltradas = facturas.filter((f) => {
    if (filtroEstado === 'Todos') return true;
    return f.estado.toLowerCase() === filtroEstado.toLowerCase();
  });

  const handleExportarExcel = () => {
    if (!facturasFiltradas.length) {
      toast.warning('No hay comprobantes para exportar con el filtro actual.');
      return;
    }

    try {
      const columnas = [
        { key: 'numeroFactura', label: 'N° Factura' },
        { key: 'fecha', label: 'Fecha de Emisión' },
        { key: 'ticketId', label: 'N° Ticket' },
        { key: 'total', label: 'Total ($)' },
        { key: 'saldoPendiente', label: 'Saldo Pendiente ($)' },
        { key: 'estado', label: 'Estado' }
      ];

      const datosFormateados = facturasFiltradas.map(f => ({
        numeroFactura: f.numeroFactura,
        fecha: f.fechaEmision ? new Date(f.fechaEmision).toLocaleDateString('es-AR') : '—',
        ticketId: `#${f.ticketId}`,
        total: f.total,
        saldoPendiente: f.saldoPendiente,
        estado: ESTADOS_FACTURA[f.estado]?.label || f.estado
      }));

      const fechaHoy = new Date().toISOString().split('T')[0];
      exportToCsv(datosFormateados, columnas, `Facturacion_CarFix_${fechaHoy}`);
      toast.success('Reporte de Facturación exportado para Excel');
    } catch {
      toast.error('Error al generar el archivo');
    }
  };

  const totalPorCobrar = facturas
    .filter(f => f.estado !== 'Anulada')
    .reduce((acc, f) => acc + (f.saldoPendiente || 0), 0);

  const totalCobrado = facturas
    .filter(f => f.estado !== 'Anulada')
    .reduce((acc, f) => acc + ((f.total || 0) - (f.saldoPendiente || 0)), 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestión de Facturación y Cobranzas</h1>
          <p className="page-subtitle">Emisión de comprobantes, control de cuenta corriente y registro de pagos</p>
        </div>
        <div className="header-actions">
          <button onClick={handleExportarExcel} className="btn-secondary" title="Descargar reporte en formato Excel / CSV">
            <FileSpreadsheet size={15} color="#059669" /> Exportar a Excel
          </button>
          <button onClick={() => cargarDatos(true)} className="btn-secondary">
            <RefreshCw size={15} /> Refrescar
          </button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <span className="kpi-label">Total Cobrado</span>
          <strong className="kpi-value" style={{ color: '#059669' }}>
            ${totalCobrado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </strong>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Saldos Pendientes de Cobro</span>
          <strong className="kpi-value" style={{ color: '#dc2626' }}>
            ${totalPorCobrar.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </strong>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Comprobantes Emitidos</span>
          <strong className="kpi-value" style={{ color: '#0f172a' }}>{facturas.length}</strong>
        </div>
      </div>

      <div className="ui-card">
        <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: '#f8fafc' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Filtrar por estado:</span>
          <select 
            value={filtroEstado} 
            onChange={(e) => setFiltroEstado(e.target.value)} 
            className="form-select"
            style={{ width: 'auto', minWidth: '190px' }}
          >
            <option value="Todos">Todos los comprobantes</option>
            <option value="Pendiente">Solo Pendientes</option>
            <option value="PagadaParcial">Cobro Parcial</option>
            <option value="Pagada">Cobrada Total</option>
            <option value="Anulada">Anuladas</option>
          </select>
        </div>

        {cargando ? (
          <div className="empty-state">Cargando comprobantes...</div>
        ) : facturasFiltradas.length === 0 ? (
          <div className="empty-state">No se registraron comprobantes con el filtro seleccionado.</div>
        ) : (
          <div className="ui-table-container">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>N° Comprobante</th>
                  <th>Fecha</th>
                  <th>Ticket Ref.</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                  <th style={{ textAlign: 'right' }}>Saldo Pendiente</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'center', width: '220px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {facturasFiltradas.map((fac) => {
                  const confEstado = ESTADOS_FACTURA[fac.estado] || ESTADOS_FACTURA.Pendiente;
                  return (
                    <tr key={fac.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <Receipt size={15} color="#0284c7" />
                          <strong>{fac.numeroFactura}</strong>
                        </div>
                      </td>
                      <td>{new Date(fac.fechaEmision).toLocaleDateString('es-AR')}</td>
                      <td>
                        <span style={{ fontWeight: 600, color: '#0284c7' }}>#{fac.ticketId}</span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                        ${fac.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: fac.saldoPendiente > 0 ? '#dc2626' : '#059669' }}>
                        ${fac.saldoPendiente.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          backgroundColor: confEstado.bg,
                          color: confEstado.text,
                          border: `1px solid ${confEstado.border}`
                        }}>
                          {confEstado.label}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                          <button
                            onClick={() => setFacturaSeleccionada(fac)}
                            className="btn-icon-action"
                            title="Ver detalle del comprobante"
                          >
                            <Eye size={14} /> Detalle
                          </button>

                          <button 
                            onClick={() => handleDescargarPdf(fac)}
                            className="btn-icon-action"
                            title="Descargar Comprobante Oficial en PDF"
                          >
                            <FileText size={14} color="#0284c7" /> PDF
                          </button>

                          {fac.estado !== 'Pagada' && fac.estado !== 'Anulada' && (
                            <button
                              onClick={() => abrirModalCobro(fac)}
                              className="btn-success-action"
                              title="Asentar cobro / entrega"
                            >
                              <DollarSign size={14} /> Cobrar
                            </button>
                          )}

                          {fac.pagos?.length === 0 && fac.estado !== 'Anulada' && (
                            <button
                              onClick={() => handleAnular(fac.id)}
                              className="btn-icon-action"
                              style={{ color: '#dc2626', borderColor: '#fecaca', backgroundColor: '#fef2f2' }}
                              title="Anular comprobante"
                            >
                              <Ban size={14} /> Anular
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
      </div>

      {modalCobro && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <DollarSign size={20} color="#059669" /> Asentar Cobro
              </h3>
              <button onClick={() => setModalCobro(null)} className="btn-ghost-icon"><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
              <div>Factura: <strong>{modalCobro.numeroFactura}</strong></div>
              <div>Saldo adeudado: <strong style={{ color: '#dc2626' }}>${modalCobro.saldoPendiente.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</strong></div>
            </div>

            <form onSubmit={handlePagoSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div className="form-group">
                <label className="form-label">Monto recibido ($):</label>
                <input
                  type="number"
                  step="0.01"
                  max={modalCobro.saldoPendiente}
                  value={montoPago}
                  onChange={(e) => setMontoPago(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Forma de pago:</label>
                <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)} className="form-select">
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia Bancaria</option>
                  <option value="Tarjeta">Tarjeta de Débito / Crédito</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Referencia de operación / POS (opcional):</label>
                <input
                  type="text"
                  placeholder="Ej: Trf #94827 o Cupón 1102"
                  value={referenciaPago}
                  onChange={(e) => setReferenciaPago(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setModalCobro(null)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" style={{ backgroundColor: '#059669' }}>
                  Confirmar Cobro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {facturaSeleccionada && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '620px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Receipt size={20} color="#0284c7" /> Comprobante {facturaSeleccionada.numeroFactura}
              </h3>
              <button onClick={() => setFacturaSeleccionada(null)} className="btn-ghost-icon"><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem 1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span>Fecha de Emisión: <strong>{new Date(facturaSeleccionada.fechaEmision).toLocaleDateString('es-AR')}</strong></span>
                  <span>Ticket Vinculado: <strong>#{facturaSeleccionada.ticketId}</strong></span>
                </div>
              </div>

              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.5rem' }}>
                Ítems de Factura
              </span>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                <table className="ui-table">
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Descripción</th>
                      <th style={{ textAlign: 'center' }}>Cant.</th>
                      <th style={{ textAlign: 'right' }}>P. Unit</th>
                      <th style={{ textAlign: 'right' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {facturaSeleccionada.detalles?.map((d, i) => (
                      <tr key={i}>
                        <td>
                          <span style={{ display: 'inline-flex', padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, backgroundColor: '#eff6ff', color: '#1d4ed8' }}>
                            {d.tipo}
                          </span>
                        </td>
                        <td>{d.descripcion}</td>
                        <td style={{ textAlign: 'center' }}>{d.cantidad}</td>
                        <td style={{ textAlign: 'right' }}>${d.precioUnitario.toFixed(2)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                          ${(d.cantidad * d.precioUnitario).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.5rem' }}>
                Historial de Cobros Recibidos
              </span>
              {facturaSeleccionada.pagos?.length === 0 ? (
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>No registra pagos recibidos aún.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {facturaSeleccionada.pagos.map((p, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
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

              <div className="modal-actions" style={{ justifyContent: 'space-between' }}>
                <button 
                  type="button"
                  onClick={() => handleDescargarPdf(facturaSeleccionada)}
                  className="btn-secondary"
                  style={{ color: '#0284c7', borderColor: '#bae6fd' }}
                >
                  <FileText size={14} /> Descargar Comprobante PDF
                </button>
                <button onClick={() => setFacturaSeleccionada(null)} className="btn-secondary">
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