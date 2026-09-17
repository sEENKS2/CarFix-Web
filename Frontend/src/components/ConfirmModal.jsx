import { AlertTriangle, HelpCircle, X } from 'lucide-react';

/**
 * Modal de confirmación estilizado para reemplazar window.confirm()
 * 
 * @param {boolean} isOpen - Estado de visibilidad.
 * @param {string} title - Título del diálogo.
 * @param {string} message - Mensaje o advertencia explicativa.
 * @param {string} confirmText - Texto del botón confirmador (ej: "Eliminar", "Confirmar").
 * @param {string} cancelText - Texto del botón cancelador (default: "Cancelar").
 * @param {'danger' | 'primary'} variant - Estilo de acción (danger = rojo, primary = azul).
 * @param {Function} onConfirm - Callback al confirmar.
 * @param {Function} onCancel - Callback al cancelar o cerrar.
 */
export default function ConfirmModal({
  isOpen,
  title = '¿Estás seguro?',
  message = 'Esta acción no se puede deshacer.',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  onConfirm,
  onCancel
}) {
  if (!isOpen) return null;

  const isDanger = variant === 'danger';

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '420px', padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
          <div style={{
            backgroundColor: isDanger ? '#fef2f2' : '#eff6ff',
            color: isDanger ? '#dc2626' : '#0284c7',
            padding: '0.65rem',
            borderRadius: '10px',
            flexShrink: 0
          }}>
            {isDanger ? <AlertTriangle size={24} /> : <HelpCircle size={24} />}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
              {title}
            </h3>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b', lineHeight: '1.45' }}>
              {message}
            </p>
          </div>

          <button onClick={onCancel} className="btn-ghost-icon" style={{ marginTop: '-0.25rem' }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
          <button type="button" onClick={onCancel} className="btn-secondary">
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="btn-primary"
            style={{
              backgroundColor: isDanger ? '#dc2626' : '#0284c7',
              borderColor: isDanger ? '#dc2626' : '#0284c7'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}