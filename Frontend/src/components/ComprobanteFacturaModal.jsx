import { useRef } from 'react';
import { Printer, X, Wrench, Receipt } from 'lucide-react';

export default function ComprobanteFacturaModal({ factura, alCerrar }) {
  const printRef = useRef();

  if (!factura) return null;

  const handleImprimir = () => {
    window.print();
  };

  const fechaTexto = factura.fechaCreacion || factura.fechaEmision || factura.fecha;
  const fechaFormateada = fechaTexto ? new Date(fechaTexto).toLocaleDateString('es-AR') : new Date().toLocaleDateString('es-AR');

  const clienteNombre = factura.cliente?.nombre 
    ? `${factura.cliente.nombre} ${factura.cliente.apellido || ''}` 
    : (factura.clienteNombre || `Cliente #${factura.clienteId}`);

  const clienteDoc = factura.cliente?.dni || factura.cliente?.documento || factura.cliente?.cuit || factura.cliente?.numDocumento || factura.cliente?.nroDocumento || factura.cliente?.Dni || factura.cliente?.Documento || 'S/D';
  const clienteTel = factura.cliente?.telefono || 'S/D';

  const detalles = factura.detalles || factura.items || [];
  const subtotal = detalles.reduce((acc, d) => acc + (d.cantidad * d.precioUnitario), 0);
  const totalFinal = factura.total || (subtotal - (factura.descuento || 0));

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContainer}>
        {/* Barra superior de acciones (no se imprime) */}
        <div className="no-print" style={styles.topBar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Receipt size={20} color="#0284c7" />
            <span style={{ fontWeight: 600, color: '#0f172a' }}>Vista Previa de Comprobante</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={handleImprimir} style={styles.btnPrint}>
              <Printer size={16} /> Imprimir / Guardar PDF
            </button>
            <button onClick={alCerrar} style={styles.btnClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Hoja A4 / Comprobante Imprimible */}
        <div ref={printRef} className="printable-sheet" style={styles.invoiceSheet}>
          {/* Encabezado */}
          <div style={styles.header}>
            <div style={styles.brandBox}>
              <div style={styles.logoBadge}>
                <Wrench size={26} color="#ffffff" />
              </div>
              <div>
                <h1 style={styles.brandTitle}>CarFix</h1>
                <span style={styles.brandSubtitle}>Taller & Soluciones Automotrices</span>
              </div>
            </div>

            <div style={styles.docInfoBox}>
              <div style={styles.typeBadge}>COMPROBANTE X</div>
              <h2 style={styles.docNumber}>N° {factura.numero || `FAC-${String(factura.id).padStart(5, '0')}`}</h2>
              <span style={styles.docDate}>Fecha: <strong>{fechaFormateada}</strong></span>
            </div>
          </div>

          <div style={styles.divider} />

          {/* Información Taller y Cliente */}
          <div style={styles.gridInfo}>
            <div style={styles.infoCol}>
              <span style={styles.infoColTitle}>EMISOR</span>
              <strong>CarFix Servicios Mecánicos</strong>
              <span>CUIT: 30-71829384-8</span>
              <span>Domicilio: Av. Pellegrini 1850</span>
              <span>Rosario, Santa Fe</span>
              <span>Email: contacto@carfix.com</span>
            </div>

            <div style={styles.infoCol}>
              <span style={styles.infoColTitle}>DATOS DEL CLIENTE / VEHÍCULO</span>
              <strong>{clienteNombre}</strong>
              <span>DNI / CUIT: <strong>{clienteDoc}</strong></span>
              <span>Teléfono: {clienteTel}</span>
              {factura.ticketId && (
                <span>Ticket de Taller Asociado: <strong>#{factura.ticketId}</strong></span>
              )}
            </div>
          </div>

          {/* Tabla de Conceptos y Repuestos */}
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={{ ...styles.th, width: '45%' }}>Descripción / Repuesto</th>
                  <th style={{ ...styles.th, width: '15%', textAlign: 'center' }}>Cant.</th>
                  <th style={{ ...styles.th, width: '20%', textAlign: 'right' }}>P. Unitario</th>
                  <th style={{ ...styles.th, width: '20%', textAlign: 'right' }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {detalles.map((d, index) => (
                  <tr key={index} style={styles.tr}>
                    <td style={styles.td}>
                      <strong>{d.descripcion || d.nombreProducto || 'Concepto de Servicio'}</strong>
                      {d.tipo && (
                        <span style={styles.tipoTag}>
                          {d.tipo === 'ManoDeObra' ? 'Mano de Obra' : 'Repuesto'}
                        </span>
                      )}
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>{d.cantidad}</td>
                    <td style={{ ...styles.td, textAlign: 'right' }}>
                      ${Number(d.precioUnitario).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right', fontWeight: 600 }}>
                      ${Number(d.cantidad * d.precioUnitario).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totales y Observaciones */}
          <div style={styles.footerGrid}>
            <div style={styles.observacionesBox}>
              <span style={styles.infoColTitle}>OBSERVACIONES Y CONDICIONES</span>
              <p style={styles.obsText}>
                {factura.observaciones || 'Garantía de servicio por 90 días o 3.000 km. Conserve este comprobante para cualquier gestión.'}
              </p>
            </div>

            <div style={styles.totalsBox}>
              <div style={styles.totalRow}>
                <span>Subtotal:</span>
                <span>${subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
              </div>
              {Number(factura.descuento || 0) > 0 && (
                <div style={styles.totalRow}>
                  <span>Descuento aplicado:</span>
                  <span style={{ color: '#059669' }}>- ${Number(factura.descuento).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div style={styles.finalTotalRow}>
                <span>TOTAL:</span>
                <span>${Number(totalFinal).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Pie de comprobante */}
          <div style={styles.bottomDisclaimer}>
            <span>Documento no válido como factura fiscal oficial según normativa AFIP/ARCA vigente. Comprobante interno de taller.</span>
          </div>
        </div>
      </div>

      {/* Estilos para impresión @media print */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .no-print {
            display: none !important;
          }
          .printable-sheet, .printable-sheet * {
            visibility: visible;
          }
          .printable-sheet {
            position: fixed;
            left: 0;
            top: 0;
            width: 100vw;
            margin: 0;
            padding: 20mm !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>
    </div>
  );
}

const styles = {
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' },
  modalContainer: { backgroundColor: '#f1f5f9', borderRadius: '12px', width: '100%', maxWidth: '800px', maxHeight: '94vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1.25rem', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0' },
  btnPrint: { display: 'inline-flex', alignItems: 'center', gap: '0.45rem', backgroundColor: '#0284c7', color: '#ffffff', border: 'none', padding: '0.45rem 1rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' },
  btnClose: { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.35rem' },
  invoiceSheet: { backgroundColor: '#ffffff', padding: '2.5rem', margin: '1rem auto', maxWidth: '720px', width: '100%', boxSizing: 'border-box', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', borderRadius: '8px', border: '1px solid #e2e8f0', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  brandBox: { display: 'flex', alignItems: 'center', gap: '0.85rem' },
  logoBadge: { backgroundColor: '#0284c7', padding: '0.65rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  brandTitle: { margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em' },
  brandSubtitle: { fontSize: '0.8rem', color: '#64748b', fontWeight: 500 },
  docInfoBox: { textAlign: 'right' },
  typeBadge: { display: 'inline-block', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', padding: '0.15rem 0.65rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' },
  docNumber: { margin: '0.15rem 0', fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' },
  docDate: { fontSize: '0.85rem', color: '#64748b' },
  divider: { height: '2px', backgroundColor: '#0f172a', margin: '1.5rem 0 1.25rem 0' },
  gridInfo: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '1.75rem' },
  infoCol: { display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.85rem', color: '#334155' },
  infoColTitle: { fontSize: '0.7rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.05em', marginBottom: '0.25rem' },
  tableWrapper: { border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden', marginBottom: '1.5rem' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' },
  thRow: { backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
  th: { padding: '0.65rem 0.85rem', color: '#475569', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '0.75rem 0.85rem', verticalAlign: 'middle', color: '#1e293b' },
  tipoTag: { display: 'block', fontSize: '0.7rem', color: '#64748b', marginTop: '0.15rem' },
  footerGrid: { display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', alignItems: 'flex-start' },
  observacionesBox: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.75rem', minHeight: '80px' },
  obsText: { margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#64748b', lineHeight: 1.4 },
  totalsBox: { display: 'flex', flexDirection: 'column', gap: '0.45rem', padding: '0.5rem 0.75rem' },
  totalRow: { display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#475569' },
  finalTotalRow: { display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', borderTop: '2px solid #0f172a', paddingTop: '0.5rem', marginTop: '0.25rem' },
  bottomDisclaimer: { textAlign: 'center', fontSize: '0.7rem', color: '#94a3b8', borderTop: '1px dashed #cbd5e1', paddingTop: '1rem', marginTop: '2.5rem' }
};