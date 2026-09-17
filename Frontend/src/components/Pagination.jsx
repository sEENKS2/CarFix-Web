import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ 
  paginaActual, 
  totalItems, 
  itemsPorPagina, 
  onCambioPagina 
}) {
  const totalPaginas = Math.ceil(totalItems / itemsPorPagina) || 1;

  if (totalPaginas <= 1) return null;

  const inicio = (paginaActual - 1) * itemsPorPagina + 1;
  const fin = Math.min(paginaActual * itemsPorPagina, totalItems);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.75rem 1rem',
      borderTop: '1px solid #e2e8f0',
      backgroundColor: '#f8fafc',
      fontSize: '0.825rem',
      color: '#64748b'
    }}>
      <div>
        Mostrando <strong>{inicio}</strong> a <strong>{fin}</strong> de <strong>{totalItems}</strong> resultados
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <button
          type="button"
          onClick={() => onCambioPagina(paginaActual - 1)}
          disabled={paginaActual === 1}
          className="btn-secondary"
          style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
        >
          <ChevronLeft size={14} /> Anterior
        </button>

        <span style={{ fontWeight: 600, color: '#0f172a', padding: '0 0.4rem' }}>
          {paginaActual} / {totalPaginas}
        </span>

        <button
          type="button"
          onClick={() => onCambioPagina(paginaActual + 1)}
          disabled={paginaActual === totalPaginas}
          className="btn-secondary"
          style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
        >
          Siguiente <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}