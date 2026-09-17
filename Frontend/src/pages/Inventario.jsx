import { useState, useEffect } from 'react';
import { inventarioService } from '../api/inventarioService';
import api from '../api/axiosClient';
import { RefreshCw, Package, ArrowUpRight, ArrowDownLeft, AlertTriangle, SlidersHorizontal, X, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Inventario() {
  const [movimientos, setMovimientos] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroProducto, setFiltroProducto] = useState('');
  const [modalAjuste, setModalAjuste] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  // Formulario de Ajuste Manual
  const [formAjuste, setFormAjuste] = useState({
    productoId: '',
    cantidad: 1,
    tipoAjuste: 'Ingreso',
    motivo: ''
  });

  const cargarDatos = async () => {
    try {
      setCargando(true);
        // Ejecución secuencial segura
        const resMovs = await inventarioService.obtenerMovimientos(filtroProducto || null);
        setMovimientos(resMovs.data);

        const resAlertas = await inventarioService.obtenerAlertas();
        setAlertas(resAlertas.data);

        const resProds = await api.get('/productos').catch(() => ({ data: [] }));
        setProductos(resProds.data);
    } catch {
      setMensaje({ tipo: 'error', texto: 'Error al sincronizar el inventario.' });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [filtroProducto]);

  const handleAjusteSubmit = async (e) => {
    e.preventDefault();
    if (!formAjuste.productoId || formAjuste.cantidad <= 0) return;

    try {
      await inventarioService.registrarAjuste({
        productoId: parseInt(formAjuste.productoId, 10),
        cantidad: parseInt(formAjuste.cantidad, 10),
        tipoAjuste: formAjuste.tipoAjuste,
        motivo: formAjuste.motivo || 'Ajuste manual de stock'
      });
      setMensaje({ tipo: 'exito', texto: 'Movimiento de stock registrado correctamente.' });
      setModalAjuste(false);
      setFormAjuste({ productoId: '', cantidad: 1, tipoAjuste: 'Ingreso', motivo: '' });
      cargarDatos();
    } catch (err) {
      const msg = err.response?.data?.mensaje || 'Error al asentar el ajuste.';
      setMensaje({ tipo: 'error', texto: msg });
    }
  };

  const getTipoBadge = (tipo) => {
    switch (tipo) {
      case 'Entrada_Compra':
      case 'Entrada_Ajuste':
        return { label: 'Entrada', bg: '#ecfdf5', text: '#047857', border: '#a7f3d0', icon: ArrowDownLeft };
      case 'Salida_Taller':
      case 'Salida_Ajuste':
        return { label: 'Salida', bg: '#fef2f2', text: '#dc2626', border: '#fecaca', icon: ArrowUpRight };
      default:
        return { label: tipo, bg: '#f8fafc', text: '#475569', border: '#cbd5e1', icon: SlidersHorizontal };
    }
  };

  return (
    <div>
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Control de Stock e Inventario</h1>
          <p style={styles.subtitle}>Trazabilidad de movimientos (Kardex), ajustes de depósito y alertas de reposición</p>
        </div>
        <div style={styles.headerActions}>
          <button onClick={cargarDatos} style={styles.btnSecondary}>
            <RefreshCw size={15} /> Refrescar
          </button>
          <button onClick={() => setModalAjuste(true)} style={styles.btnPrimary}>
            <SlidersHorizontal size={16} /> Ajustar Stock
          </button>
        </div>
      </div>

      {/* ALERTAS DE STOCK CRÍTICO */}
      {alertas.length > 0 && (
        <div style={styles.alertCritical}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <AlertTriangle size={18} color="#b45309" />
            <strong style={{ color: '#b45309', fontSize: '0.9rem' }}>
              Atención: {alertas.length} producto(s) en o por debajo del stock de reposición
            </strong>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {alertas.map(a => (
              <span key={a.id} style={styles.criticalChip}>
                {a.nombre} (Stock: <strong>{a.stockActual}</strong> / Mín: {a.stockMinimo})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* MENSAJES FEEDBACK */}
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

      {/* TABLA KARDEX */}
      <div style={styles.card}>
        <div style={styles.filterBar}>
          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569' }}>Filtrar por Repuesto:</span>
          <select
            value={filtroProducto}
            onChange={(e) => setFiltroProducto(e.target.value)}
            style={styles.selectFilter}
          >
            <option value="">Todos los repuestos</option>
            {productos.map(p => (
              <option key={p.id} value={p.id}>{p.codigo} - {p.nombre}</option>
            ))}
          </select>
        </div>

        {cargando ? (
          <div style={styles.emptyState}>Cargando libro de movimientos...</div>
        ) : movimientos.length === 0 ? (
          <div style={styles.emptyState}>No se han registrado movimientos de inventario todavía.</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>Fecha</th>
                <th style={styles.th}>Repuesto / Artículo</th>
                <th style={styles.th}>Tipo</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>Cantidad</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>Stock Ant.</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>Stock Result.</th>
                <th style={styles.th}>Motivo / Referencia</th>
                <th style={styles.th}>Operador</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.map((m, idx) => {
                const conf = getTipoBadge(m.tipoMovimiento);
                const Icon = conf.icon;
                return (
                  <tr key={m.id} style={{ ...styles.tr, backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td style={styles.td}>{new Date(m.fecha).toLocaleString('es-AR')}</td>
                    <td style={styles.td}><strong>{m.nombreProducto}</strong></td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        backgroundColor: conf.bg,
                        color: conf.text,
                        border: `1px solid ${conf.border}`
                      }}>
                        <Icon size={12} style={{ marginRight: '3px' }} />
                        {conf.label}
                      </span>
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center', fontWeight: '700' }}>
                      {m.tipoMovimiento.includes('Salida') ? `-${m.cantidad}` : `+${m.cantidad}`}
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center', color: '#64748b' }}>{m.stockAnterior}</td>
                    <td style={{ ...styles.td, textAlign: 'center', fontWeight: '700', color: '#0f172a' }}>{m.stockNuevo}</td>
                    <td style={{ ...styles.td, color: '#334155' }}>{m.motivoReferencia || '—'}</td>
                    <td style={{ ...styles.td, color: '#64748b', fontSize: '0.8rem' }}>{m.usuario || 'Sistema'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL AJUSTE MANUAL */}
      {modalAjuste && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalContent, maxWidth: '480px' }}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                <SlidersHorizontal size={20} color="#0284c7" /> Ajuste de Depósito
              </h3>
              <button onClick={() => setModalAjuste(false)} style={styles.iconBtn}><X size={20} /></button>
            </div>

            <form onSubmit={handleAjusteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Repuesto a Ajustar:</label>
                <select
                  required
                  value={formAjuste.productoId}
                  onChange={(e) => setFormAjuste({ ...formAjuste, productoId: e.target.value })}
                  style={styles.select}
                >
                  <option value="">-- Seleccionar Repuesto --</option>
                  {productos.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.codigo} - {p.nombre} (Actual: {p.stockActual})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Tipo de Ajuste:</label>
                  <select
                    value={formAjuste.tipoAjuste}
                    onChange={(e) => setFormAjuste({ ...formAjuste, tipoAjuste: e.target.value })}
                    style={styles.select}
                  >
                    <option value="Ingreso">Ingreso (Suma)</option>
                    <option value="Egreso">Baja / Merma (Resta)</option>
                  </select>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Cantidad:</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formAjuste.cantidad}
                    onChange={(e) => setFormAjuste({ ...formAjuste, cantidad: e.target.value })}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Motivo / Justificación:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Conteo físico semestral, pieza rota, etc."
                  value={formAjuste.motivo}
                  onChange={(e) => setFormAjuste({ ...formAjuste, motivo: e.target.value })}
                  style={styles.input}
                />
              </div>

              <div style={styles.modalActions}>
                <button type="button" onClick={() => setModalAjuste(false)} style={styles.btnSecondary}>
                  Cancelar
                </button>
                <button type="submit" style={styles.btnPrimary}>
                  Registrar Movimiento
                </button>
              </div>
            </form>
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
  btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: '0.45rem', backgroundColor: '#0284c7', color: '#ffffff', border: 'none', padding: '0.5rem 1.1rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' },
  btnSecondary: { display: 'inline-flex', alignItems: 'center', gap: '0.45rem', backgroundColor: '#ffffff', color: '#334155', border: '1px solid #cbd5e1', padding: '0.5rem 0.9rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' },
  alertCritical: { backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '0.85rem 1rem', marginBottom: '1.5rem' },
  criticalChip: { backgroundColor: '#ffffff', border: '1px solid #fcd34d', borderRadius: '6px', padding: '0.2rem 0.5rem', fontSize: '0.75rem', color: '#92400e' },
  alert: { padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid', marginBottom: '1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' },
  card: { backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.07)', overflow: 'hidden' },
  filterBar: { padding: '0.85rem 1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: '#f8fafc' },
  selectFilter: { padding: '0.4rem 0.65rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', backgroundColor: '#ffffff', color: '#0f172a', outline: 'none' },
  emptyState: { padding: '3rem', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' },
  thRow: { backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
  th: { padding: '0.85rem 1rem', color: '#475569', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '0.85rem 1rem', verticalAlign: 'middle' },
  badge: { display: 'inline-flex', alignItems: 'center', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600' },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: '#ffffff', borderRadius: '12px', padding: '1.5rem', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' },
  modalTitle: { display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: '#0f172a', fontSize: '1.15rem', fontWeight: '700' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: '#64748b' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '0.25rem' },
  label: { fontSize: '0.8rem', fontWeight: '600', color: '#334155' },
  input: { padding: '0.5rem 0.65rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', color: '#0f172a', outline: 'none' },
  select: { padding: '0.5rem 0.65rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', color: '#0f172a', outline: 'none', backgroundColor: '#ffffff' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '1rem' }
};