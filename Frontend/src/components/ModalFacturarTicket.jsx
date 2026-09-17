import { useState, useEffect } from 'react';
import { facturasService } from '../api/facturasService';
import api from '../api/axiosClient';
import { X, Receipt, Plus, Trash2 } from 'lucide-react';

export default function ModalFacturarTicket({ ticket, alCerrar, alFacturarExitoso }) {
  const [productos, setProductos] = useState([]);
  const [detalles, setDetalles] = useState([
    { tipo: 'ManoDeObra', productoId: null, descripcion: 'Mano de obra y diagnóstico', cantidad: 1, precioUnitario: 0 }
  ]);
  const [descuento, setDescuento] = useState(0);
  const [observaciones, setObservaciones] = useState('');
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);

  // Cargar catálogo de productos al abrir el modal
  useEffect(() => {
    api.get('/productos')
      .then(res => setProductos(res.data))
      .catch(() => setProductos([]));
  }, []);

  const agregarItem = () => {
    setDetalles([
      ...detalles,
      { tipo: 'Repuesto', productoId: null, descripcion: '', cantidad: 1, precioUnitario: 0 }
    ]);
  };

  const eliminarItem = (index) => {
    if (detalles.length === 1) return;
    setDetalles(detalles.filter((_, i) => i !== index));
  };

  const handleTipoChange = (index, nuevoTipo) => {
    const nuevosDetalles = [...detalles];
    nuevosDetalles[index] = {
      ...nuevosDetalles[index],
      tipo: nuevoTipo,
      productoId: null,
      descripcion: nuevoTipo === 'ManoDeObra' ? 'Servicio / Mano de obra' : '',
      precioUnitario: 0
    };
    setDetalles(nuevosDetalles);
  };

  const handleProductoSelect = (index, prodId) => {
    const prod = productos.find(p => p.id === parseInt(prodId, 10));
    const nuevosDetalles = [...detalles];
    if (prod) {
      nuevosDetalles[index] = {
        ...nuevosDetalles[index],
        productoId: prod.id,
        descripcion: `${prod.codigo} - ${prod.nombre}`,
        precioUnitario: prod.precioUnitario || 0
      };
    } else {
      nuevosDetalles[index] = {
        ...nuevosDetalles[index],
        productoId: null,
        descripcion: '',
        precioUnitario: 0
      };
    }
    setDetalles(nuevosDetalles);
  };

  const actualizarItem = (index, campo, valor) => {
    const nuevosDetalles = [...detalles];
    nuevosDetalles[index][campo] = valor;
    setDetalles(nuevosDetalles);
  };

  const subtotal = detalles.reduce((acc, item) => acc + (item.cantidad * item.precioUnitario), 0);
  const total = Math.max(0, subtotal - Number(descuento));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validar que si eligió repuesto haya seleccionado un producto
    const repuestoInvalido = detalles.some(d => d.tipo === 'Repuesto' && !d.productoId);
    if (repuestoInvalido) {
      setError('Por favor selecciona el repuesto correspondiente del catálogo para cada ítem de tipo Repuesto.');
      return;
    }

    setGuardando(true);

    try {
      const payload = {
        ticketId: ticket.id,
        clienteId: ticket.clienteId || ticket.cliente?.id,
        descuento: Number(descuento),
        observaciones,
        detalles: detalles.map(d => ({
          tipo: d.tipo,
          productoId: d.productoId ? Number(d.productoId) : null,
          descripcion: d.descripcion,
          cantidad: Number(d.cantidad),
          precioUnitario: Number(d.precioUnitario)
        }))
      };

      await facturasService.crearFactura(payload);
      alFacturarExitoso();
      alCerrar();
    } catch (err) {
      const msg = err.response?.data?.mensaje || err.response?.data || 'Error al emitir la factura.';
      setError(msg);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>
            <Receipt size={20} color="#0284c7" /> Emitir Factura - Ticket #{ticket.id}
          </h3>
          <button onClick={alCerrar} style={styles.iconBtn}><X size={20} /></button>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.infoBanner}>
          <div>
            <span style={styles.infoLabel}>Titular:</span>{' '}
            <strong>{ticket.cliente?.nombre ? `${ticket.cliente.nombre} ${ticket.cliente.apellido || ''}` : `Cliente #${ticket.clienteId}`}</strong>
          </div>
          <div>
            <span style={styles.infoLabel}>Vehículo:</span>{' '}
            <strong>{ticket.vehiculo?.dominio || ticket.dominio || 'S/D'}</strong>
            {(ticket.vehiculo?.marca || ticket.vehiculo?.modelo) && (
              <span style={{ color: '#64748b', fontSize: '0.8rem', marginLeft: '4px' }}>
                ({ticket.vehiculo?.marca} {ticket.vehiculo?.modelo})
              </span>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.tableCard}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={{ ...styles.th, width: '120px' }}>Tipo</th>
                  <th style={styles.th}>Descripción / Selección de Catálogo</th>
                  <th style={{ ...styles.th, width: '70px', textAlign: 'center' }}>Cant.</th>
                  <th style={{ ...styles.th, width: '110px' }}>P. Unit ($)</th>
                  <th style={{ ...styles.th, width: '105px', textAlign: 'right' }}>Subtotal</th>
                  <th style={{ ...styles.th, width: '40px' }}></th>
                </tr>
              </thead>
              <tbody>
                {detalles.map((item, idx) => (
                  <tr key={idx} style={styles.tr}>
                    <td style={styles.td}>
                      <select
                        value={item.tipo}
                        onChange={(e) => handleTipoChange(idx, e.target.value)}
                        style={styles.selectCompact}
                      >
                        <option value="ManoDeObra">M. de Obra</option>
                        <option value="Repuesto">Repuesto</option>
                      </select>
                    </td>

                    <td style={styles.td}>
                      {item.tipo === 'Repuesto' ? (
                        <select
                          required
                          value={item.productoId || ''}
                          onChange={(e) => handleProductoSelect(idx, e.target.value)}
                          style={styles.selectCompact}
                        >
                          <option value="">-- Seleccionar Repuesto --</option>
                          {productos.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.codigo} - {p.nombre} (Stock: {p.stockActual})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          required
                          placeholder="Descripción del trabajo"
                          value={item.descripcion}
                          onChange={(e) => actualizarItem(idx, 'descripcion', e.target.value)}
                          style={styles.inputTable}
                        />
                      )}
                    </td>

                    <td style={styles.td}>
                      <input
                        type="number"
                        min="1"
                        value={item.cantidad}
                        onChange={(e) => actualizarItem(idx, 'cantidad', Math.max(1, parseInt(e.target.value, 10) || 1))}
                        style={{ ...styles.inputTable, textAlign: 'center' }}
                      />
                    </td>

                    <td style={styles.td}>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.precioUnitario}
                        onChange={(e) => actualizarItem(idx, 'precioUnitario', parseFloat(e.target.value) || 0)}
                        style={styles.inputTable}
                      />
                    </td>

                    <td style={{ ...styles.td, textAlign: 'right', fontWeight: '600', color: '#0f172a' }}>
                      ${(item.cantidad * item.precioUnitario).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>

                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      {detalles.length > 1 && (
                        <button type="button" onClick={() => eliminarItem(idx)} style={styles.deleteBtn}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <button type="button" onClick={agregarItem} style={styles.btnAddRow}>
              <Plus size={14} /> Agregar Concepto / Repuesto
            </button>
          </div>

          <div style={styles.totalsGrid}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Observaciones / Condiciones:</label>
              <textarea
                placeholder="Detalles sobre garantía, forma de entrega, notas..."
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                style={styles.textarea}
              />
            </div>

            <div style={styles.summaryCard}>
              <div style={styles.summaryRow}>
                <span style={{ color: '#64748b' }}>Subtotal:</span>
                <strong style={{ color: '#334155' }}>${subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</strong>
              </div>
              <div style={styles.summaryRow}>
                <span style={{ color: '#64748b' }}>Descuento:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={descuento}
                    onChange={(e) => setDescuento(e.target.value)}
                    style={styles.inputDiscount}
                  />
                </div>
              </div>
              <div style={{ ...styles.summaryRow, borderTop: '1px solid #cbd5e1', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                <span style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a' }}>Total Final:</span>
                <span style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0284c7' }}>
                  ${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          <div style={styles.modalActions}>
            <button type="button" onClick={alCerrar} disabled={guardando} style={styles.btnSecondary}>
              Cancelar
            </button>
            <button type="submit" disabled={guardando} style={styles.btnPrimary}>
              <Receipt size={16} /> {guardando ? 'Generando Comprobante...' : 'Confirmar Facturación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: '#ffffff', borderRadius: '12px', padding: '1.5rem', width: '100%', maxWidth: '780px', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  modalTitle: { display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#0f172a' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: '#64748b' },
  error: { padding: '0.75rem 1rem', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' },
  infoBanner: { display: 'flex', justifyContent: 'space-between', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem', color: '#1e293b' },
  infoLabel: { color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: '600' },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  tableCard: { border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' },
  thRow: { backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
  th: { padding: '0.65rem 0.75rem', color: '#475569', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '0.5rem 0.75rem', verticalAlign: 'middle' },
  selectCompact: { width: '100%', boxSizing: 'border-box', padding: '0.35rem 0.45rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8rem', backgroundColor: '#ffffff', color: '#0f172a', outline: 'none' },
  inputTable: { width: '100%', boxSizing: 'border-box', padding: '0.35rem 0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8rem', color: '#0f172a', outline: 'none' },
  deleteBtn: { background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.2rem' },
  btnAddRow: { display: 'inline-flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd', padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' },
  totalsGrid: { display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem', marginTop: '0.5rem' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '0.25rem' },
  label: { fontSize: '0.8rem', fontWeight: '600', color: '#334155' },
  textarea: { boxSizing: 'border-box', width: '100%', height: '80px', padding: '0.5rem 0.65rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', color: '#0f172a', outline: 'none', resize: 'none' },
  summaryCard: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.45rem', justifyContent: 'center' },
  summaryRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem' },
  inputDiscount: { width: '75px', padding: '0.25rem 0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem', textAlign: 'right' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem', marginTop: '0.5rem' },
  btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: '0.45rem', backgroundColor: '#0284c7', color: '#ffffff', border: 'none', padding: '0.5rem 1.1rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' },
  btnSecondary: { backgroundColor: '#ffffff', color: '#334155', border: '1px solid #cbd5e1', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }
};