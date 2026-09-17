import { useState, useEffect, useMemo } from 'react';
import { facturasService } from '../api/facturasService';
import { 
  DollarSign, 
  CreditCard, 
  Send, 
  Calendar, 
  RefreshCw, 
  FileSpreadsheet, 
  Coins, 
  Receipt,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { toast } from 'sonner';
import { exportToCsv } from '../utils/exportUtils';

export default function CajaDiaria() {
  const hoyISO = new Date().toISOString().split('T')[0];

  const [fechaSeleccionada, setFechaSeleccionada] = useState(hoyISO);
  const [facturas, setFacturas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [fondoInicial, setFondoInicial] = useState(0);
  const [cajaCerrada, setCajaCerrada] = useState(false);

  const cargarPagos = async (mostrarToast = false) => {
    setCargando(true);
    try {
      const res = await facturasService.obtenerTodas();
      setFacturas(res.data || []);
      if (mostrarToast) {
        toast.success('Movimientos de caja actualizados');
      }
    } catch {
      toast.error('Error al sincronizar cobranzas para la caja');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPagos();
  }, []);

  // Extraer y aplanar todos los pagos del día seleccionado
  const pagosDelDia = useMemo(() => {
    const lista = [];

    facturas.forEach((fac) => {
      if (!fac.pagos || !Array.isArray(fac.pagos)) return;

      fac.pagos.forEach((p) => {
        const fechaPagoISO = new Date(p.fechaPago).toISOString().split('T')[0];
        if (fechaPagoISO === fechaSeleccionada) {
          lista.push({
            id: p.id || `${fac.id}-${p.fechaPago}`,
            facturaNumero: fac.numeroFactura,
            ticketId: fac.ticketId,
            monto: Number(p.monto || 0),
            metodoPago: p.metodoPago || 'Efectivo',
            referencia: p.referenciaComprobante || '—',
            hora: new Date(p.fechaPago).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
          });
        }
      });
    });

    return lista;
  }, [facturas, fechaSeleccionada]);

  // Totales desagregados por método de pago
  const totales = useMemo(() => {
    let efectivo = 0;
    let transferencia = 0;
    let tarjeta = 0;

    pagosDelDia.forEach((p) => {
      const m = p.metodoPago.toLowerCase();
      if (m.includes('efectivo')) efectivo += p.monto;
      else if (m.includes('transferencia')) transferencia += p.monto;
      else if (m.includes('tarjeta') || m.includes('débito') || m.includes('crédito')) tarjeta += p.monto;
      else efectivo += p.monto;
    });

    const totalCobrado = efectivo + transferencia + tarjeta;
    const totalEnCajaFisica = efectivo + Number(fondoInicial || 0);

    return { efectivo, transferencia, tarjeta, totalCobrado, totalEnCajaFisica };
  }, [pagosDelDia, fondoInicial]);

  const handleCerrarCaja = () => {
    setCajaCerrada(true);
    toast.success(`Caja del día ${new Date(fechaSeleccionada + 'T00:00:00').toLocaleDateString('es-AR')} archivada con éxito`);
  };

  const handleExportarCierre = () => {
    if (!pagosDelDia.length) {
      toast.warning('No hay movimientos registrados en la fecha seleccionada.');
      return;
    }

    try {
      const columnas = [
        { key: 'hora', label: 'Hora' },
        { key: 'facturaNumero', label: 'N° Factura' },
        { key: 'ticketId', label: 'Ticket Ref.' },
        { key: 'metodoPago', label: 'Método de Pago' },
        { key: 'referencia', label: 'Referencia / POS' },
        { key: 'monto', label: 'Monto ($)' }
      ];

      const filasExport = pagosDelDia.map((p) => ({
        ...p,
        ticketId: `#${p.ticketId}`
      }));

      // Fila de resumen final
      filasExport.push({
        hora: '---',
        facturaNumero: 'TOTAL COBRADO',
        ticketId: '---',
        metodoPago: 'TODOS',
        referencia: `Efectivo: $${totales.efectivo} | Bancario: $${totales.transferencia + totales.tarjeta}`,
        monto: totales.totalCobrado
      });

      exportToCsv(filasExport, columnas, `Cierre_Caja_${fechaSeleccionada}`);
      toast.success('Planilla de arqueo descargada');
    } catch {
      toast.error('Error al generar la exportación');
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Control de Caja Diaria</h1>
          <p className="page-subtitle">Arqueo diario de cobros, desagregación por medio de pago y cierre de turno</p>
        </div>
        <div className="header-actions">
          <button onClick={handleExportarCierre} className="btn-secondary" title="Descargar planilla de cierre">
            <FileSpreadsheet size={15} color="#059669" /> Exportar Cierre
          </button>
          <button onClick={() => cargarPagos(true)} className="btn-secondary">
            <RefreshCw size={15} /> Refrescar
          </button>
          <button 
            onClick={handleCerrarCaja} 
            disabled={cajaCerrada}
            className="btn-primary" 
            style={{ backgroundColor: cajaCerrada ? '#64748b' : '#0284c7' }}
          >
            {cajaCerrada ? <Lock size={15} /> : <CheckCircle2 size={15} />}
            {cajaCerrada ? 'Caja Cerrada' : 'Arqueo y Cierre'}
          </button>
        </div>
      </div>

      {/* Barra de Filtro de Fecha y Apertura */}
      <div className="ui-card" style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Calendar size={18} color="#0284c7" />
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>Fecha de Caja:</span>
            <input
              type="date"
              value={fechaSeleccionada}
              onChange={(e) => {
                setFechaSeleccionada(e.target.value);
                setCajaCerrada(false);
              }}
              className="form-input"
              style={{ width: 'auto' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Coins size={18} color="#059669" />
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>Fondo Inicial de Caja ($):</span>
            <input
              type="number"
              min="0"
              step="100"
              value={fondoInicial}
              onChange={(e) => setFondoInicial(parseFloat(e.target.value) || 0)}
              className="form-input"
              style={{ width: '130px', textAlign: 'right' }}
              disabled={cajaCerrada}
            />
          </div>
        </div>
      </div>

      {/* Tarjetas de Resumen Financiero por Método */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="kpi-label">Efectivo Cobrado</span>
            <Coins size={16} color="#059669" />
          </div>
          <strong className="kpi-value" style={{ color: '#059669' }}>
            ${totales.efectivo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </strong>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Físico total (c/ fondo): <strong>${totales.totalEnCajaFisica.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</strong>
          </span>
        </div>

        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="kpi-label">Transferencias</span>
            <Send size={16} color="#0284c7" />
          </div>
          <strong className="kpi-value" style={{ color: '#0284c7' }}>
            ${totales.transferencia.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </strong>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Acreditaciones en cuenta bancaria</span>
        </div>

        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="kpi-label">Tarjetas / Posnet</span>
            <CreditCard size={16} color="#7c3aed" />
          </div>
          <strong className="kpi-value" style={{ color: '#7c3aed' }}>
            ${totales.tarjeta.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </strong>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Débito y crédito acreditado</span>
        </div>

        <div className="kpi-card" style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="kpi-label" style={{ color: '#94a3b8' }}>Total Cobrado del Día</span>
            <DollarSign size={16} color="#38bdf8" />
          </div>
          <strong className="kpi-value" style={{ color: '#38bdf8' }}>
            ${totales.totalCobrado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </strong>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            {pagosDelDia.length} cobranza(s) registrada(s)
          </span>
        </div>
      </div>

      {/* Detalle de Movimientos del Día */}
      <div className="ui-card">
        <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>
            Movimientos y Cobranzas asentadas el {new Date(fechaSeleccionada + 'T00:00:00').toLocaleDateString('es-AR')}
          </span>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            {pagosDelDia.length} comprobante(s)
          </span>
        </div>

        {cargando ? (
          <div className="empty-state">Sincronizando operaciones...</div>
        ) : pagosDelDia.length === 0 ? (
          <div className="empty-state">No se registraron cobros en la fecha seleccionada.</div>
        ) : (
          <div className="ui-table-container">
            <table className="ui-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Hora</th>
                  <th>Factura</th>
                  <th>Ticket</th>
                  <th>Medio de Pago</th>
                  <th>Referencia / Comprobante</th>
                  <th style={{ textAlign: 'right' }}>Monto Cobrado</th>
                </tr>
              </thead>
              <tbody>
                {pagosDelDia.map((p) => {
                  const m = p.metodoPago.toLowerCase();
                  let badgeColor = { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' };
                  if (m.includes('transferencia')) badgeColor = { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' };
                  if (m.includes('tarjeta')) badgeColor = { bg: '#f5f3ff', text: '#6d28d9', border: '#ddd6fe' };

                  return (
                    <tr key={p.id}>
                      <td style={{ color: '#64748b', fontSize: '0.8rem' }}>{p.hora}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Receipt size={14} color="#0284c7" />
                          <strong>{p.facturaNumero}</strong>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: '#0284c7' }}>#{p.ticketId}</span>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-flex',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          backgroundColor: badgeColor.bg,
                          color: badgeColor.text,
                          border: `1px solid ${badgeColor.border}`
                        }}>
                          {p.metodoPago}
                        </span>
                      </td>
                      <td style={{ color: '#475569', fontSize: '0.825rem' }}>{p.referencia}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                        ${p.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}