import React, { useState } from 'react';
import { 
  Sparkles, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  PackageSearch, 
  ShoppingCart,
  Layers
} from 'lucide-react';

export default function ModalDiagnosticoIA({ resultado, cargando, alCerrar, alAplicarSugerencias }) {
  const [repuestosSeleccionados, setRepuestosSeleccionados] = useState([]);

  if (!resultado && !cargando) return null;

  const toggleRepuesto = (id) => {
    setRepuestosSeleccionados(prev => 
      prev.includes(id) ? prev.filter(rId => rId !== id) : [...prev, id]
    );
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}>
        
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ backgroundColor: '#f0f9ff', padding: '0.5rem', borderRadius: '10px', color: '#0284c7' }}>
              <Sparkles size={22} />
            </div>
            <div>
              <h3 className="modal-title" style={{ fontSize: '1.1rem', margin: 0 }}>
                Asistente de Pre-Diagnóstico IA
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
                Análisis predictivo de síntomas, catálogo e insumos faltantes
              </p>
            </div>
          </div>
          <button onClick={alCerrar} className="btn-ghost-icon"><X size={20} /></button>
        </div>

        {cargando ? (
          <div style={{ padding: '2.5rem 1rem', textAlign: 'center' }}>
            <div className="animate-spin" style={{ display: 'inline-block', marginBottom: '0.75rem', color: '#0284c7' }}>
              <Sparkles size={32} />
            </div>
            <p style={{ fontWeight: '600', color: '#1e293b', margin: '0 0 0.35rem 0' }}>
              Razonando diagnóstico automotriz...
            </p>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
              Analizando síntomas y cruzando contra el stock del taller
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
            
            {/* Tiempo Estimado de Mano de Obra */}
            {resultado.estimacionHorasManoObra > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.65rem 1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#334155', fontSize: '0.85rem', fontWeight: '600' }}>
                  <Clock size={16} color="#0284c7" />
                  <span>Tiempo estimado de trabajo:</span>
                </div>
                <span className="ui-badge" style={{ backgroundColor: '#eff6ff', color: '#0284c7', border: '1px solid #bfdbfe', fontWeight: '700' }}>
                  ~ {resultado.estimacionHorasManoObra} hs / hombre
                </span>
              </div>
            )}

            {/* Hipótesis de Fallas */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0284c7', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
                <AlertTriangle size={15} /> Posibles Causas Identificadas
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {resultado.hipotesis?.map((h, idx) => (
                  <div key={idx} style={{ backgroundColor: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '6px', padding: '0.7rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                      <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>{h.falla}</strong>
                      <span className="ui-badge" style={{
                        backgroundColor: h.probabilidad >= 70 ? '#fef2f2' : '#fffbeb',
                        color: h.probabilidad >= 70 ? '#dc2626' : '#d97706',
                        border: `1px solid ${h.probabilidad >= 70 ? '#fecaca' : '#fde68a'}`,
                        fontSize: '0.75rem',
                        fontWeight: '700'
                      }}>
                        {h.probabilidad}% Probabilidad
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569', lineHeight: '1.4' }}>
                      {h.justificacion}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Protocolo de Inspección */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0284c7', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
                <CheckCircle2 size={15} /> Protocolo de Inspección Recomendado
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.82rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {resultado.protocoloInspeccion?.map((p, idx) => (
                  <li key={idx} style={{ lineHeight: '1.4' }}>{p}</li>
                ))}
              </ul>
            </div>

            {/* Repuestos Sugeridos en Depósito */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0284c7', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>
                  <PackageSearch size={15} /> Repuestos Sugeridos en Depósito
                </div>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Selecciona los que aplican</span>
              </div>

              {(!resultado.repuestosSugeridos || resultado.repuestosSugeridos.length === 0) ? (
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>
                  No se detectaron repuestos del catálogo directamente vinculados a esta falla.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {resultado.repuestosSugeridos.map((r) => (
                    <label key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.65rem', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', backgroundColor: repuestosSeleccionados.includes(r.id) ? '#f0f9ff' : '#ffffff' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input 
                          type="checkbox"
                          checked={repuestosSeleccionados.includes(r.id)}
                          onChange={() => toggleRepuesto(r.id)}
                        />
                        <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#1e293b' }}>
                          {r.nombre} <span style={{ color: '#64748b', fontWeight: '400', fontSize: '0.78rem' }}>({r.codigo})</span>
                        </span>
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#059669' }}>
                        {r.stock} disp.
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Repuestos Faltantes a Pedir */}
            {resultado.repuestosFaltantes && resultado.repuestosFaltantes.length > 0 && (
              <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#b45309', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  <ShoppingCart size={15} /> Insumos / Repuestos a Solicitar a Proveedor
                </div>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.78rem', color: '#92400e' }}>
                  Estas piezas son necesarias para la reparación pero no se encuentran en stock actualmente:
                </p>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.82rem', color: '#78350f', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {resultado.repuestosFaltantes.map((rf, idx) => (
                    <li key={idx} style={{ fontWeight: '500' }}>{rf}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Acciones del Modal */}
            <div className="modal-actions" style={{ justifyContent: 'space-between', marginTop: '0.5rem' }}>
              <button type="button" onClick={alCerrar} className="btn-secondary">
                Descartar
              </button>
              <button 
                type="button" 
                onClick={() => alAplicarSugerencias(resultado, repuestosSeleccionados)} 
                className="btn-primary"
              >
                Aplicar al Ticket →
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}