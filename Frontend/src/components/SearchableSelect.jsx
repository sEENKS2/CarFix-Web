import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

/**
 * Dropdown accesible con buscador en tiempo real
 * 
 * @param {Array<{ value: any, label: string, sublabel?: string }>} options
 * @param {any} value - Valor seleccionado actual
 * @param {Function} onChange - Callback con el valor seleccionado
 * @param {string} placeholder - Texto cuando no hay nada elegido
 * @param {boolean} required
 */
export default function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = '-- Seleccionar opción --',
  required = false,
  style = {}
}) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const contenedorRef = useRef(null);
  const inputRef = useRef(null);

  // Cerrar si se hace clic fuera del componente
  useEffect(() => {
    function handleClickAfuera(e) {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target)) {
        setAbierto(false);
      }
    }
    document.addEventListener('mousedown', handleClickAfuera);
    return () => document.removeEventListener('mousedown', handleClickAfuera);
  }, []);

  // Enfocar input al abrir
  useEffect(() => {
    if (abierto && inputRef.current) {
      inputRef.current.focus();
    }
    if (!abierto) {
      setBusqueda('');
    }
  }, [abierto]);

  const seleccionActual = useMemo(() => {
    return options.find(o => String(o.value) === String(value));
  }, [options, value]);

  const opcionesFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return options;
    return options.filter(o => 
      o.label.toLowerCase().includes(q) || 
      (o.sublabel && o.sublabel.toLowerCase().includes(q))
    );
  }, [options, busqueda]);

  return (
    <div ref={contenedorRef} style={{ position: 'relative', width: '100%', ...style }}>
      {/* Botón que emula el select */}
      <div
        onClick={() => setAbierto(prev => !prev)}
        className="form-select"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          backgroundColor: '#ffffff',
          userSelect: 'none',
          minHeight: '38px',
          borderColor: required && !value ? '#cbd5e1' : undefined
        }}
      >
        <span style={{ color: seleccionActual ? '#0f172a' : '#94a3b8', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {seleccionActual ? (
            <>
              <strong>{seleccionActual.label}</strong>
              {seleccionActual.sublabel && <span style={{ color: '#64748b', marginLeft: '6px', fontSize: '0.78rem' }}>({seleccionActual.sublabel})</span>}
            </>
          ) : placeholder}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {value && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="btn-ghost-icon"
              style={{ padding: 0 }}
              title="Limpiar selección"
            >
              <X size={14} color="#94a3b8" />
            </button>
          )}
          <ChevronDown size={16} color="#64748b" />
        </div>
      </div>

      {/* Menú flotante con input buscador y lista */}
      {abierto && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          zIndex: 50,
          backgroundColor: '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          {/* Input de filtro */}
          <div style={{ padding: '0.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#f8fafc' }}>
            <Search size={14} color="#64748b" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Buscar..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                width: '100%',
                fontSize: '0.825rem',
                backgroundColor: 'transparent'
              }}
            />
          </div>

          {/* Opciones */}
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {opcionesFiltradas.length === 0 ? (
              <div style={{ padding: '0.75rem', fontSize: '0.825rem', color: '#94a3b8', textAlign: 'center' }}>
                Sin resultados
              </div>
            ) : (
              opcionesFiltradas.map((opt) => {
                const esActivo = String(opt.value) === String(value);
                return (
                  <div
                    key={opt.value}
                    onClick={() => {
                      onChange(opt.value);
                      setAbierto(false);
                    }}
                    style={{
                      padding: '0.55rem 0.75rem',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      backgroundColor: esActivo ? '#eff6ff' : 'transparent',
                      color: esActivo ? '#0284c7' : '#1e293b',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottom: '1px solid #f1f5f9'
                    }}
                    onMouseEnter={(e) => {
                      if (!esActivo) e.currentTarget.style.backgroundColor = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      if (!esActivo) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <span>{opt.label}</span>
                    {opt.sublabel && (
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {opt.sublabel}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}