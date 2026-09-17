import { useState, useEffect, useMemo } from 'react';
import api from '../api/axiosClient';
import { facturasService } from '../api/facturasService';
import { X, Receipt, Plus, Trash2, Package } from 'lucide-react';
import { toast } from 'sonner';
import SearchableSelect from './SearchableSelect';

export default function ModalFacturarTicket({ ticket, alCerrar, alFacturarExitoso }) {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(false);

  // Ítems de la factura
  const [manoDeObra, setManoDeObra] = useState({
    descripcion: 'Mano de obra y servicio técnico mecánico',
    precioUnitario: 0
  });

  const [repuestosSeleccionados, setRepuestosSeleccionados] = useState([]);

  // Cargar catálogo de repuestos
  useEffect(() => {
    api.get('/productos')
      .then(res => setProductos(res.data || []))
      .catch(() => toast.error('Error al cargar catálogo de productos para facturar'));
  }, []);

  const opcionesProductos = useMemo(() => {
    return productos.map(p => ({
      value: p.id,
      label: `${p.codigo} - ${p.nombre}`,
      sublabel: `Stock: ${p.stockActual} | $${p.precioUnitario}`
    }));
  }, [productos]);

  const agregarFilaRepuesto = () => {
    setRepuestosSeleccionados([
      ...repuestosSeleccionados,
      { productoId: '', cantidad: 1, precioUnitario: 0, descripcion: '' }
    ]);
  };

  const handleProductoChange = (index, prodId) => {
    const prod = productos.find(p => p.id === parseInt(prodId, 10));
    const nuevos = [...repuestosSeleccionados];
    nuevos[index] = {
      ...nuevos[index],
      productoId: prodId,
      descripcion: prod ? prod.nombre : '',
      precioUnitario: prod ? prod.precioUnitario : 0
    };
    setRepuestosSeleccionados(nuevos);
  };

  const handleRepuestoFieldChange = (index, campo, valor) => {
    const nuevos = [...repuestosSeleccionados];
    nuevos[index][campo] = valor;
    setRepuestosSeleccionados(nuevos);
  };

  const eliminarFilaRepuesto = (index) => {
    setRepuestosSeleccionados(repuestosSeleccionados.filter((_, i) => i !== index));
  };

  const totalCalculado = useMemo(() => {
    const subManoObra = Number(manoDeObra.precioUnitario) || 0;
    const subRepuestos = repuestosSeleccionados.reduce((acc, r) => {
      return acc + ((Number(r.cantidad) || 0) * (Number(r.precioUnitario) || 0));
    }, 0);
    return subManoObra + subRepuestos;
  }, [manoDeObra, repuestosSeleccionados]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);

    const detalles = [];

    // 1. Mano de obra si tiene monto
    if (Number(manoDeObra.precioUnitario) > 0) {
      detalles.push({
        tipo: 'ManoDeObra',
        descripcion: manoDeObra.descripcion,
        cantidad: 1,
        precioUnitario: parseFloat(manoDeObra.precioUnitario)
      });
    }

    // 2. Repuestos
    for (const r of repuestosSeleccionados) {
      if (!r.productoId) {
        toast.warning('Por favor completa todos los repuestos seleccionados');
        setCargando(false);
        return;
      }
      detalles.push({
        tipo: 'Repuesto',
        productoId: parseInt(r.productoId, 10),
        descripcion: r.descripcion,
        cantidad: parseInt(r.cantidad, 10),
        precioUnitario: parseFloat(r.precioUnitario)
      });
    }

    if (detalles.length === 0) {
      toast.warning('La factura debe tener al menos un concepto (Mano de obra o Repuesto)');
      setCargando(false);
      return;
    }

    try {
      await facturasService.generarDesdeTicket(ticket.id, { detalles });
      alFacturarExitoso();
      alCerrar();
    } catch (err) {
      const msg = err.response?.data?.mensaje || err.response?.data || 'Error al emitir factura';
      toast.error(msg);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Receipt size={20} color="#0284c7" /> Emitir Factura - Ticket #{ticket.id}
          </h3>
          <button onClick={alCerrar} className="btn-ghost-icon"><X size={20} /></button>
        </div>

        <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
          <div>Vehículo: <strong>{ticket.vehiculo?.dominio || ticket.dominio || 'S/D'}</strong> ({ticket.vehiculo?.marca || ''} {ticket.vehiculo?.modelo || ''})</div>
          <div>Titular: <strong>{ticket.cliente ? `${ticket.cliente.nombre} ${ticket.cliente.apellido}` : (ticket.nombreCompletoCliente || 'Particular')}</strong></div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Mano de obra */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.85rem', backgroundColor: '#ffffff' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              Mano de Obra y Servicio
            </div>
            <div style={{ display: 'flex', gap: '0.65rem' }}>
              <div style={{ flex: 3 }}>
                <input
                  type="text"
                  value={manoDeObra.descripcion}
                  onChange={(e) => setManoDeObra({ ...manoDeObra, descripcion: e.target.value })}
                  placeholder="Detalle del servicio prestado..."
                  className="form-input"
                />
              </div>
              <div style={{ flex: 1 }}>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={manoDeObra.precioUnitario}
                  onChange={(e) => setManoDeObra({ ...manoDeObra, precioUnitario: parseFloat(e.target.value) || 0 })}
                  placeholder="Monto ($)"
                  className="form-input"
                  style={{ textAlign: 'right' }}
                />
              </div>
            </div>
          </div>

          {/* Repuestos con buscador */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.85rem', backgroundColor: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Package size={15} /> Repuestos e Insumos Utilizados
              </div>
              <button
                type="button"
                onClick={agregarFilaRepuesto}
                className="btn-secondary"
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem' }}
              >
                <Plus size={13} /> Agregar Repuesto
              </button>
            </div>

            {repuestosSeleccionados.length === 0 ? (
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>No se agregaron repuestos a este comprobante.</p>
            ) : (
              repuestosSeleccionados.map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ flex: 3 }}>
                    <SearchableSelect
                      options={opcionesProductos}
                      value={r.productoId}
                      onChange={(val) => handleProductoChange(i, val)}
                      placeholder="Buscar por código o nombre..."
                      required
                    />
                  </div>
                  <input
                    type="number"
                    min="1"
                    placeholder="Cant."
                    value={r.cantidad}
                    onChange={(e) => handleRepuestoFieldChange(i, 'cantidad', parseInt(e.target.value, 10) || 1)}
                    className="form-input"
                    style={{ width: '65px', textAlign: 'center' }}
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="P. Unit"
                    value={r.precioUnitario}
                    onChange={(e) => handleRepuestoFieldChange(i, 'precioUnitario', parseFloat(e.target.value) || 0)}
                    className="form-input"
                    style={{ width: '95px', textAlign: 'right' }}
                  />
                  <button type="button" onClick={() => eliminarFilaRepuesto(i)} className="btn-ghost-icon">
                    <Trash2 size={15} color="#ef4444" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
            Total Comprobante: ${totalCalculado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </div>

          <div className="modal-actions">
            <button type="button" onClick={alCerrar} className="btn-secondary" disabled={cargando}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={cargando || totalCalculado <= 0}>
              {cargando ? 'Emitiendo...' : 'Emitir Factura'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}