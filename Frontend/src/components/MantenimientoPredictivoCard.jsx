import { useEffect, useState } from 'react';
import { iaService } from '../api/iaService';
import { ShieldCheck, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

export default function MantenimientoPredictivoCard({ vehiculoId }) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!vehiculoId) return;
    setCargando(true);
    iaService.obtenerMantenimientoPredictivo(vehiculoId)
      .then(res => setDatos(res))
      .catch(() => setDatos(null))
      .finally(() => setCargando(false));
  }, [vehiculoId]);

  if (cargando) {
    return (
      <div style={{ padding: '0.85rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#64748b' }}>
        Calculando ciclos predictivos de mantenimiento...
      </div>
    );
  }

  if (!datos || !datos.componentes) return null;

  return (
    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.85rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase' }}>
          <ShieldCheck size={16} /> Salud Predictiva y Ciclos de Desgaste
        </div>
        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
          Uso prom.: <strong>{datos.kmPromedioMes || 1200} km/mes</strong>
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {datos.componentes.map((c, idx) => {
          const porcentaje = Math.min(Math.max(c.desgastePorcentaje || 0, 0), 100);
          const colorBarra = porcentaje >= 85 ? '#ef4444' : porcentaje >= 60 ? '#f59e0b' : '#10b981';
          const esCritico = porcentaje >= 85;

          return (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ fontWeight: 600, color: '#1e293b' }}>{c.nombre}</span>
                <span style={{ color: colorBarra, fontWeight: 700 }}>
                  {esCritico ? 'Reemplazo Sugerido' : `${100 - porcentaje}% vida útil`}
                </span>
              </div>

              {/* Barra de desgaste */}
              <div style={{ height: '6px', backgroundColor: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${porcentaje}%`,
                  backgroundColor: colorBarra,
                  borderRadius: '3px',
                  transition: 'width 0.4s ease'
                }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b' }}>
                <span>Último cambio: {c.ultimoCambioKm ? `${c.ultimoCambioKm.toLocaleString('es-AR')} km` : 'Sin registro'}</span>
                <span>Vence aprox.: {c.vencimientoEstimado || 'Próx. 30 días'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}