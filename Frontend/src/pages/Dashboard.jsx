import { useState, useEffect } from 'react';
import api from '../api/axiosClient';
import { 
  Wrench, 
  AlertTriangle, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  Package, 
  ShoppingCart,
  Users,
  Award
} from 'lucide-react';
import { toast } from 'sonner';

const MAPA_ESPECIALIDADES = {
  1: 'Mecánico / Motorista',
  2: 'Electricista',
  3: 'Chapista',
  4: 'Electrónico',
  5: 'Alineación y Balanceo'
};

const esTicketFinalizado = (estado) => {
  if (estado === null || estado === undefined) return false;
  if (typeof estado === 'number') return estado >= 3;
  const est = String(estado).trim().toLowerCase();
  return est.includes('entregado') || est.includes('finalizado') || est.includes('terminado');
};

export default function Dashboard() {
  const [cargando, setCargando] = useState(true);
  const [metricas, setMetricas] = useState({
    facturacionMes: 0,
    saldoPorCobrar: 0,
    totalCompras: 0,
    ticketsMes: 0,
    ticketsAbiertos: 0,
    mecanicoDestacado: 'Sin datos',
    ticketsPorEstado: {},
    tecnicosRanking: [],
    stockCritico: [],
    proveedoresRanking: []
  });

  const cargarDatos = async (mostrarToast = false) => {
    setCargando(true);
    try {
      const [resTickets, resFacturas, resProductos, resOrdenes, resTecnicos] = await Promise.all([
        api.get('/tickets').catch(() => ({ data: [] })),
        api.get('/facturas').catch(() => ({ data: [] })),
        api.get('/productos').catch(() => ({ data: [] })),
        api.get('/ordenescompra').catch(() => ({ data: [] })),
        api.get('/tecnicos').catch(() => ({ data: [] }))
      ]);

      const tickets = resTickets.data || [];
      const facturas = resFacturas.data || [];
      const productos = resProductos.data || [];
      const ordenes = resOrdenes.data || [];
      const tecnicos = resTecnicos.data || [];

      const ahora = new Date();
      const mesActual = ahora.getMonth();
      const anioActual = ahora.getFullYear();

      // 1. Finanzas
      const facturasActivas = facturas.filter(f => f.estado !== 'Anulada');
      const facturacionMes = facturasActivas
        .filter(f => {
          const d = new Date(f.fechaEmision || f.fechaCreacion);
          return d.getMonth() === mesActual && d.getFullYear() === anioActual;
        })
        .reduce((acc, f) => acc + (f.total || 0), 0);

      const saldoPorCobrar = facturasActivas.reduce((acc, f) => acc + (f.saldoPendiente || 0), 0);

      const totalCompras = ordenes
        .filter(o => o.estado === 2 || o.estado === 'Recibida')
        .reduce((acc, o) => acc + (o.total || 0), 0);

      // 2. Taller y Tickets
      const ticketsMes = tickets.filter(t => {
        const d = new Date(t.fechaIngreso || t.fechaCreacion);
        return d.getMonth() === mesActual && d.getFullYear() === anioActual;
      }).length;

      const ticketsAbiertos = tickets.filter(t => !esTicketFinalizado(t.estado) && String(t.estado).toLowerCase() !== 'cancelado').length;

      const ticketsPorEstado = tickets.reduce((acc, t) => {
        const est = t.estado || 'Pendiente';
        acc[est] = (acc[est] || 0) + 1;
        return acc;
      }, {});

      // 3. Stock Crítico
      const stockCritico = productos
        .filter(p => p.stockActual <= (p.stockMinimo || 5))
        .slice(0, 5);

      // 4. Rendimiento Técnicos
      const tecnicosRanking = tecnicos.map(tec => {
        const tecId = Number(tec.id);

        const asignados = tickets.filter(t => {
          const ticketTecId = Number(t.tecnicoId ?? t.idTecnico ?? t.tecnico?.id ?? 0);
          return ticketTecId === tecId;
        });

        const finalizados = asignados.filter(t => esTicketFinalizado(t.estado)).length;
        const ratio = asignados.length > 0 ? Math.round((finalizados / asignados.length) * 100) : 0;

        let especialidadNombre = 'Mecánico';
        if (tec.especialidadNombre) {
          especialidadNombre = tec.especialidadNombre;
        } else if (tec.especialidad && typeof tec.especialidad === 'object') {
          especialidadNombre = tec.especialidad.nombre || tec.especialidad.descripcion || 'Mecánico';
        } else if (MAPA_ESPECIALIDADES[tec.especialidad]) {
          especialidadNombre = MAPA_ESPECIALIDADES[tec.especialidad];
        } else if (typeof tec.especialidad === 'string' && isNaN(tec.especialidad)) {
          especialidadNombre = tec.especialidad;
        }

        return {
          id: tec.id,
          nombre: `${tec.nombre} ${tec.apellido || ''}`.trim(),
          especialidad: especialidadNombre,
          total: asignados.length,
          finalizados,
          exito: ratio
        };
      }).sort((a, b) => b.finalizados - a.finalizados || b.total - a.total);

      const mecanicoDestacado = tecnicosRanking.length > 0 && tecnicosRanking[0].finalizados > 0
        ? tecnicosRanking[0].nombre
        : 'Sin finalizaciones';

      // 5. Proveedores
      const provMap = {};
      let totalGastoProv = 0;
      ordenes.forEach(o => {
        const nombre = o.proveedor?.razonSocial || o.proveedor?.nombre || `Proveedor #${o.proveedorId}`;
        const monto = o.total || 0;
        totalGastoProv += monto;
        if (!provMap[nombre]) provMap[nombre] = { ordenes: 0, total: 0 };
        provMap[nombre].ordenes += 1;
        provMap[nombre].total += monto;
      });

      const proveedoresRanking = Object.entries(provMap).map(([nombre, d]) => ({
        nombre,
        ordenes: d.ordenes,
        monto: d.total,
        participacion: totalGastoProv > 0 ? ((d.total / totalGastoProv) * 100).toFixed(1) : '0.0'
      })).sort((a, b) => b.monto - a.monto);

      setMetricas({
        facturacionMes,
        saldoPorCobrar,
        totalCompras,
        ticketsMes,
        ticketsAbiertos,
        mecanicoDestacado,
        ticketsPorEstado,
        tecnicosRanking,
        stockCritico,
        proveedoresRanking
      });

      if (mostrarToast) {
        toast.success('Métricas del taller actualizadas');
      }
    } catch {
      toast.error('Error al actualizar los indicadores del panel');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Panel General y Métricas</h1>
          <p className="page-subtitle">Visión consolidada del rendimiento operativo, financiero y de abastecimiento</p>
        </div>
        <button onClick={() => cargarDatos(true)} disabled={cargando} className="btn-secondary">
          <RefreshCw size={15} />
          {cargando ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Facturación del Mes</span>
            <div className="kpi-icon" style={{ backgroundColor: '#ecfdf5', color: '#059669' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <strong className="kpi-value" style={{ color: '#059669' }}>
            ${metricas.facturacionMes.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </strong>
          <span className="kpi-sub">Ingresos registrados en el mes</span>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Cuentas por Cobrar</span>
            <div className="kpi-icon" style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>
              <Clock size={18} />
            </div>
          </div>
          <strong className="kpi-value" style={{ color: '#dc2626' }}>
            ${metricas.saldoPorCobrar.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </strong>
          <span className="kpi-sub">Saldos pendientes de cobro</span>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Tickets en Taller</span>
            <div className="kpi-icon" style={{ backgroundColor: '#eff6ff', color: '#0284c7' }}>
              <Wrench size={18} />
            </div>
          </div>
          <strong className="kpi-value" style={{ color: '#0284c7' }}>
            {metricas.ticketsAbiertos}
          </strong>
          <span className="kpi-sub">Órdenes de trabajo activas</span>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Mecánico Destacado</span>
            <div className="kpi-icon" style={{ backgroundColor: '#fef9c3', color: '#ca8a04' }}>
              <Award size={18} />
            </div>
          </div>
          <strong className="kpi-value" style={{ fontSize: '1.2rem', color: '#0f172a' }}>
            {metricas.mecanicoDestacado}
          </strong>
          <span className="kpi-sub">Mayor volumen de finalizaciones</span>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Alertas de Reposición</span>
            <div className="kpi-icon" style={{ backgroundColor: '#fffbeb', color: '#d97706' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <strong className="kpi-value" style={{ color: metricas.stockCritico.length > 0 ? '#d97706' : '#059669' }}>
            {metricas.stockCritico.length}
          </strong>
          <span className="kpi-sub">Ítems con stock bajo o nulo</span>
        </div>
      </div>

      <div className="grid-two-cols">
        <div className="ui-card">
          <div className="ui-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={18} color="#0284c7" />
              <h3 className="ui-card-title">Rendimiento de Técnicos</h3>
            </div>
          </div>
          <div className="ui-table-container">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Técnico</th>
                  <th>Especialidad</th>
                  <th style={{ textAlign: 'center' }}>Finalizados</th>
                  <th style={{ textAlign: 'center' }}>% Éxito</th>
                </tr>
              </thead>
              <tbody>
                {metricas.tecnicosRanking.length === 0 ? (
                  <tr><td colSpan="4" className="empty-state">Sin técnicos asignados</td></tr>
                ) : (
                  metricas.tecnicosRanking.map(tec => (
                    <tr key={tec.id}>
                      <td><strong>{tec.nombre}</strong></td>
                      <td>
                        <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 500 }}>
                          {tec.especialidad}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {tec.finalizados} / {tec.total}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: tec.exito >= 75 ? '#ecfdf5' : '#f8fafc',
                          color: tec.exito >= 75 ? '#059669' : '#475569'
                        }}>
                          {tec.exito}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="ui-card">
          <div className="ui-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Package size={18} color="#dc2626" />
              <h3 className="ui-card-title">Repuestos con Stock Crítico</h3>
            </div>
          </div>
          <div className="ui-table-container">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Producto</th>
                  <th style={{ textAlign: 'center' }}>Actual</th>
                  <th style={{ textAlign: 'center' }}>Mínimo</th>
                </tr>
              </thead>
              <tbody>
                {metricas.stockCritico.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="empty-state" style={{ color: '#059669' }}>
                      <CheckCircle2 size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                      Inventario en niveles óptimos
                    </td>
                  </tr>
                ) : (
                  metricas.stockCritico.map(p => (
                    <tr key={p.id}>
                      <td><code>{p.codigo}</code></td>
                      <td><strong>{p.nombre}</strong></td>
                      <td style={{ textAlign: 'center', fontWeight: '700', color: '#dc2626' }}>
                        {p.stockActual}
                      </td>
                      <td style={{ textAlign: 'center', color: '#64748b' }}>
                        {p.stockMinimo || 5}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="ui-card">
        <div className="ui-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingCart size={18} color="#0284c7" />
            <h3 className="ui-card-title">Principales Proveedores (Órdenes de Compra)</h3>
          </div>
        </div>
        <div className="ui-table-container">
          <table className="ui-table">
            <thead>
              <tr>
                <th>Proveedor</th>
                <th style={{ textAlign: 'center' }}>Órdenes Emitidas</th>
                <th style={{ textAlign: 'right' }}>Monto Comprado</th>
                <th style={{ textAlign: 'center' }}>Participación</th>
              </tr>
            </thead>
            <tbody>
              {metricas.proveedoresRanking.length === 0 ? (
                <tr><td colSpan="4" className="empty-state">No hay órdenes de compra emitidas</td></tr>
              ) : (
                metricas.proveedoresRanking.map((prov, i) => (
                  <tr key={i}>
                    <td><strong>{prov.nombre}</strong></td>
                    <td style={{ textAlign: 'center' }}>{prov.ordenes} {prov.ordenes === 1 ? 'orden' : 'órdenes'}</td>
                    <td style={{ textAlign: 'right', fontWeight: '700', color: '#0f172a' }}>
                      ${prov.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ backgroundColor: '#f0f9ff', color: '#0284c7', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                        {prov.participacion}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}