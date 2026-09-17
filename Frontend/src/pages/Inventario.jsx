import { useState, useEffect } from 'react';
import { inventarioService } from '../api/inventarioService';
import api from '../api/axiosClient';
import { RefreshCw, ArrowUpRight, ArrowDownLeft, AlertTriangle, SlidersHorizontal, X, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { exportToCsv } from '../utils/exportUtils';

export default function Inventario() {
  const [movimientos, setMovimientos] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroProducto, setFiltroProducto] = useState('');
  const [modalAjuste, setModalAjuste] = useState(false);

  const [formAjuste, setFormAjuste] = useState({
    productoId: '',
    cantidad: 1,
    tipoAjuste: 'Ingreso',
    motivo: ''
  });

  const cargarDatos = async (mostrarToast = false) => {
    try {
      setCargando(true);
      const resMovs = await inventarioService.obtenerMovimientos(filtroProducto || null);
      setMovimientos(resMovs.data || []);

      const resAlertas = await inventarioService.obtenerAlertas();
      setAlertas(resAlertas.data || []);

      const resProds = await api.get('/productos').catch(() => ({ data: [] }));
      setProductos(resProds.data || []);

      if (mostrarToast) {
        toast.success('Libro de inventario sincronizado');
      }
    } catch {
      toast.error('Error al sincronizar el inventario');
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
      toast.success('Movimiento de stock registrado correctamente');
      setModalAjuste(false);
      setFormAjuste({ productoId: '', cantidad: 1, tipoAjuste: 'Ingreso', motivo: '' });
      cargarDatos();
    } catch (err) {
      const msg = err.response?.data?.mensaje || err.response?.data || 'Error al asentar el ajuste';
      toast.error(msg);
    }
  };

  const handleExportarKardex = () => {
    if (!movimientos.length) {
      toast.warning('No hay movimientos registrados para exportar.');
      return;
    }

    try {
      const columnas = [
        { key: 'fecha', label: 'Fecha y Hora' },
        { key: 'nombreProducto', label: 'Repuesto / Producto' },
        { key: 'tipoMovimiento', label: 'Tipo' },
        { key: 'cantidad', label: 'Cantidad' },
        { key: 'stockAnterior', label: 'Stock Anterior' },
        { key: 'stockNuevo', label: 'Stock Resultante' },
        { key: 'motivoReferencia', label: 'Motivo / Referencia' },
        { key: 'usuario', label: 'Operador' }
      ];

      const datosFormateados = movimientos.map(m => ({
        fecha: new Date(m.fecha).toLocaleString('es-AR'),
        nombreProducto: m.nombreProducto,
        tipoMovimiento: m.tipoMovimiento,
        cantidad: m.tipoMovimiento.includes('Salida') ? -m.cantidad : m.cantidad,
        stockAnterior: m.stockAnterior,
        stockNuevo: m.stockNuevo,
        motivoReferencia: m.motivoReferencia || '—',
        usuario: m.usuario || 'Sistema'
      }));

      const fechaHoy = new Date().toISOString().split('T')[0];
      exportToCsv(datosFormateados, columnas, `Kardex_Inventario_CarFix_${fechaHoy}`);
      toast.success('Kardex de Inventario exportado para Excel');
    } catch {
      toast.error('Error al generar el archivo');
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
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Control de Stock e Inventario</h1>
          <p className="page-subtitle">Trazabilidad de movimientos (Kardex), ajustes de depósito y alertas de reposición</p>
        </div>
        <div className="header-actions">
          <button onClick={handleExportarKardex} className="btn-secondary" title="Exportar Kardex a Excel / CSV">
            <FileSpreadsheet size={15} color="#059669" /> Exportar a Excel
          </button>
          <button onClick={() => cargarDatos(true)} className="btn-secondary">
            <RefreshCw size={15} /> Refrescar
          </button>
          <button onClick={() => setModalAjuste(true)} className="btn-primary">
            <SlidersHorizontal size={16} /> Ajustar Stock
          </button>
        </div>
      </div>

      {alertas.length > 0 && (
        <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '0.85rem 1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <AlertTriangle size={18} color="#b45309" />
            <strong style={{ color: '#b45309', fontSize: '0.9rem' }}>
              Atención: {alertas.length} producto(s) en o por debajo del stock de reposición
            </strong>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {alertas.map(a => (
              <span key={a.id} style={{ backgroundColor: '#ffffff', border: '1px solid #fcd34d', borderRadius: '6px', padding: '0.2rem 0.5rem', fontSize: '0.75rem', color: '#92400e' }}>
                {a.nombre} (Stock: <strong>{a.stockActual}</strong> / Mín: {a.stockMinimo})
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="ui-card">
        <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: '#f8fafc' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Filtrar por Repuesto:</span>
          <select
            value={filtroProducto}
            onChange={(e) => setFiltroProducto(e.target.value)}
            className="form-select"
            style={{ width: 'auto', minWidth: '220px' }}
          >
            <option value="">Todos los repuestos</option>
            {productos.map(p => (
              <option key={p.id} value={p.id}>{p.codigo} - {p.nombre}</option>
            ))}
          </select>
        </div>

        {cargando ? (
          <div className="empty-state">Cargando libro de movimientos...</div>
        ) : movimientos.length === 0 ? (
          <div className="empty-state">No se han registrado movimientos de inventario todavía.</div>
        ) : (
          <div className="ui-table-container">
            <table className="ui-table">
              <thead>
                <tr>
                  <th style={{ width: '160px' }}>Fecha</th>
                  <th>Repuesto / Artículo</th>
                  <th style={{ width: '120px' }}>Tipo</th>
                  <th style={{ width: '90px', textAlign: 'center' }}>Cantidad</th>
                  <th style={{ width: '90px', textAlign: 'center' }}>Stock Ant.</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>Stock Result.</th>
                  <th>Motivo / Referencia</th>
                  <th style={{ width: '120px' }}>Operador</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((m) => {
                  const conf = getTipoBadge(m.tipoMovimiento);
                  const Icon = conf.icon;
                  return (
                    <tr key={m.id}>
                      <td style={{ fontSize: '0.8rem', color: '#475569' }}>
                        {new Date(m.fecha).toLocaleString('es-AR')}
                      </td>
                      <td><strong>{m.nombreProducto}</strong></td>
                      <td>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          backgroundColor: conf.bg,
                          color: conf.text,
                          border: `1px solid ${conf.border}`
                        }}>
                          <Icon size={12} style={{ marginRight: '3px' }} />
                          {conf.label}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: m.tipoMovimiento.includes('Salida') ? '#dc2626' : '#059669' }}>
                        {m.tipoMovimiento.includes('Salida') ? `-${m.cantidad}` : `+${m.cantidad}`}
                      </td>
                      <td style={{ textAlign: 'center', color: '#64748b' }}>{m.stockAnterior}</td>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: '#0f172a' }}>{m.stockNuevo}</td>
                      <td style={{ color: '#334155' }}>{m.motivoReferencia || '—'}</td>
                      <td style={{ color: '#64748b', fontSize: '0.8rem' }}>{m.usuario || 'Sistema'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalAjuste && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <SlidersHorizontal size={20} color="#0284c7" /> Ajuste de Depósito
              </h3>
              <button onClick={() => setModalAjuste(false)} className="btn-ghost-icon"><X size={20} /></button>
            </div>

            <form onSubmit={handleAjusteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div className="form-group">
                <label className="form-label">Repuesto a Ajustar:</label>
                <select
                  required
                  value={formAjuste.productoId}
                  onChange={(e) => setFormAjuste({ ...formAjuste, productoId: e.target.value })}
                  className="form-select"
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
                <div className="form-group">
                  <label className="form-label">Tipo de Ajuste:</label>
                  <select
                    value={formAjuste.tipoAjuste}
                    onChange={(e) => setFormAjuste({ ...formAjuste, tipoAjuste: e.target.value })}
                    className="form-select"
                  >
                    <option value="Ingreso">Ingreso (Suma)</option>
                    <option value="Egreso">Baja / Merma (Resta)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Cantidad:</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formAjuste.cantidad}
                    onChange={(e) => setFormAjuste({ ...formAjuste, cantidad: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Motivo / Justificación:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Conteo físico semestral, pieza rota, etc."
                  value={formAjuste.motivo}
                  onChange={(e) => setFormAjuste({ ...formAjuste, motivo: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setModalAjuste(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
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