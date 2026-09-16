import { useEffect, useState } from 'react';
import api from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { Plus, RefreshCw, X, User, Car, Edit, Trash2, Phone, Mail, ShieldAlert } from 'lucide-react';

export default function ClientesVehiculos() {
  const { tieneRol } = useAuth();
  
  // Validamos si el usuario puede acceder a la pantalla (Operador o Admin)
  const tieneAccesoGeneral = tieneRol(['Operadores']);
  // Validamos si el usuario tiene permiso destructivo (Solo Admin = array vacío)
  const esAdmin = tieneRol([]);

  const [clientes, setClientes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [tabActiva, setTabActiva] = useState('clientes'); // 'clientes' | 'vehiculos'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modales
  const [showModalCliente, setShowModalCliente] = useState(false);
  const [showModalVehiculo, setShowModalVehiculo] = useState(false);
  const [editandoCliente, setEditandoCliente] = useState(null);
  const [editandoVehiculo, setEditandoVehiculo] = useState(null);

  const [formCliente, setFormCliente] = useState({ nombre: '', apellido: '', dni: '', correo: '', telefono: '' });
  const [formVehiculo, setFormVehiculo] = useState({ clienteId: '', marca: '', modelo: '', año: 2022, dominio: '' });

  const cargarTodo = async () => {
    if (!tieneAccesoGeneral) return;
    
    setLoading(true);
    setError('');
    try {
      const [resCli, resVeh] = await Promise.all([
        api.get('/clientes'),
        api.get('/vehiculos')
      ]);
      setClientes(resCli.data);
      setVehiculos(resVeh.data);
    } catch {
      setError('Error al sincronizar clientes y parque de vehículos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tieneAccesoGeneral) {
      cargarTodo();
    }
  }, [tieneAccesoGeneral]);

  // Pantalla de bloqueo si entra un Técnico por URL directa
  if (!tieneAccesoGeneral) {
    return (
      <div style={styles.deniedContainer}>
        <ShieldAlert size={64} color="#ef4444" />
        <h2 style={styles.deniedTitle}>Acceso Restringido</h2>
        <p style={styles.deniedText}>
          Tu perfil técnico no cuenta con permisos para gestionar el padrón de clientes y vehículos.
        </p>
      </div>
    );
  }

  // Submit Cliente
  const handleSubmitCliente = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formCliente,
        dni: parseInt(formCliente.dni, 10),
        telefono: parseInt(formCliente.telefono, 10) || 0
      };
      if (editandoCliente) {
        await api.put(`/clientes/${editandoCliente.id}`, payload);
      } else {
        await api.post('/clientes', payload);
      }
      setShowModalCliente(false);
      cargarTodo();
    } catch (err) {
      alert(err.response?.data || 'Error al guardar cliente');
    }
  };

  // Submit Vehículo
  const handleSubmitVehiculo = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formVehiculo,
        clienteId: parseInt(formVehiculo.clienteId, 10),
        año: parseInt(formVehiculo.año, 10)
      };
      if (editandoVehiculo) {
        await api.put(`/vehiculos/${editandoVehiculo.id}`, payload);
      } else {
        await api.post('/vehiculos', payload);
      }
      setShowModalVehiculo(false);
      cargarTodo();
    } catch (err) {
      alert(err.response?.data || 'Error al guardar vehículo');
    }
  };

  const handleEliminarCliente = async (id) => {
    if (!esAdmin) return;
    if (!window.confirm('¿Confirmar baja del cliente?')) return;
    try {
      await api.delete(`/clientes/${id}`);
      cargarTodo();
    } catch (err) {
      alert(err.response?.data || 'Error al eliminar');
    }
  };

  const handleEliminarVehiculo = async (id) => {
    if (!esAdmin) return;
    if (!window.confirm('¿Confirmar baja del vehículo?')) return;
    try {
      await api.delete(`/vehiculos/${id}`);
      cargarTodo();
    } catch (err) {
      alert(err.response?.data || 'Error al eliminar');
    }
  };

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Clientes y Parque Automotor</h1>
          <p style={styles.subtitle}>Directorio general de clientes y unidades registradas</p>
        </div>
        <div style={styles.headerActions}>
          <button onClick={cargarTodo} style={styles.btnSecondary}>
            <RefreshCw size={15} /> Refrescar
          </button>
          <button
            onClick={() => {
              if (tabActiva === 'clientes') {
                setEditandoCliente(null);
                setFormCliente({ nombre: '', apellido: '', dni: '', correo: '', telefono: '' });
                setShowModalCliente(true);
              } else {
                setEditandoVehiculo(null);
                setFormVehiculo({ clienteId: '', marca: '', modelo: '', año: 2022, dominio: '' });
                setShowModalVehiculo(true);
              }
            }}
            style={styles.btnPrimary}
          >
            <Plus size={16} /> {tabActiva === 'clientes' ? 'Nuevo Cliente' : 'Nuevo Vehículo'}
          </button>
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {/* Tabs */}
      <div style={styles.tabsWrapper}>
        <button
          onClick={() => setTabActiva('clientes')}
          style={{ ...styles.tabButton, ...(tabActiva === 'clientes' ? styles.tabActive : {}) }}
        >
          <User size={16} /> Clientes ({clientes.length})
        </button>
        <button
          onClick={() => setTabActiva('vehiculos')}
          style={{ ...styles.tabButton, ...(tabActiva === 'vehiculos' ? styles.tabActive : {}) }}
        >
          <Car size={16} /> Vehículos ({vehiculos.length})
        </button>
      </div>

      <div style={styles.card}>
        {loading ? (
          <div style={styles.emptyState}>Cargando registros...</div>
        ) : tabActiva === 'clientes' ? (
          clientes.length === 0 ? (
            <div style={styles.emptyState}>No hay clientes registrados.</div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={styles.th}>Nombre y Apellido</th>
                  <th style={styles.th}>DNI</th>
                  <th style={styles.th}>Contacto</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((c, idx) => (
                  <tr key={c.id} style={{ ...styles.tr, backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td style={styles.td}>
                      <div style={styles.cellFlex}>
                        <User size={15} color="#0284c7" />
                        <strong style={{ color: '#0f172a' }}>{c.nombre} {c.apellido}</strong>
                      </div>
                    </td>
                    <td style={styles.td}>{c.dni}</td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '0.8rem' }}>
                        {c.telefono ? <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#475569' }}><Phone size={12} /> {c.telefono}</span> : null}
                        {c.correo ? <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#475569' }}><Mail size={12} /> {c.correo}</span> : null}
                      </div>
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <button onClick={() => { setEditandoCliente(c); setFormCliente(c); setShowModalCliente(true); }} style={styles.actionBtn}>
                        <Edit size={16} color="#0284c7" />
                      </button>
                      
                      {/* SOLO EL ADMIN VE EL BOTÓN DE ELIMINAR */}
                      {esAdmin && (
                        <button onClick={() => handleEliminarCliente(c.id)} style={styles.actionBtn}>
                          <Trash2 size={16} color="#ef4444" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : (
          vehiculos.length === 0 ? (
            <div style={styles.emptyState}>No hay vehículos registrados en la base de datos.</div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={styles.th}>Dominio</th>
                  <th style={styles.th}>Marca y Modelo</th>
                  <th style={styles.th}>Año</th>
                  <th style={styles.th}>Titular / Dueño</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {vehiculos.map((v, idx) => (
                  <tr key={v.id} style={{ ...styles.tr, backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td style={styles.td}>
                      <div style={styles.cellFlex}>
                        <Car size={15} color="#0284c7" />
                        <strong style={{ color: '#0f172a' }}>{v.dominio}</strong>
                      </div>
                    </td>
                    <td style={styles.td}>{v.marca} {v.modelo}</td>
                    <td style={styles.td}>{v.año || '—'}</td>
                    <td style={{ ...styles.td, fontWeight: '500', color: '#0f172a' }}>
                      {v.dueño ? `${v.dueño.nombre} ${v.dueño.apellido}` : (v.nombreCompletoDueño || 'Sin titular')}
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <button onClick={() => {
                        setEditandoVehiculo(v);
                        setFormVehiculo({
                          clienteId: v.clienteId || v.dueño?.id || '',
                          marca: v.marca,
                          modelo: v.modelo,
                          año: v.año,
                          dominio: v.dominio
                        });
                        setShowModalVehiculo(true);
                      }} style={styles.actionBtn}>
                        <Edit size={16} color="#0284c7" />
                      </button>

                      {/* SOLO EL ADMIN VE EL BOTÓN DE ELIMINAR */}
                      {esAdmin && (
                        <button onClick={() => handleEliminarVehiculo(v.id)} style={styles.actionBtn}>
                          <Trash2 size={16} color="#ef4444" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>

      {/* MODAL CLIENTE */}
      {showModalCliente && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}><User size={18} color="#0284c7" /> {editandoCliente ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
              <button onClick={() => setShowModalCliente(false)} style={styles.iconBtn}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmitCliente} style={styles.form}>
              <div style={styles.formRow}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Nombre</label>
                  <input required value={formCliente.nombre} onChange={e => setFormCliente({ ...formCliente, nombre: e.target.value })} style={styles.input} />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Apellido</label>
                  <input required value={formCliente.apellido} onChange={e => setFormCliente({ ...formCliente, apellido: e.target.value })} style={styles.input} />
                </div>
              </div>
              <div style={styles.formRow}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>DNI</label>
                  <input type="number" required value={formCliente.dni} onChange={e => setFormCliente({ ...formCliente, dni: e.target.value })} style={styles.input} />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Teléfono</label>
                  <input type="number" value={formCliente.telefono} onChange={e => setFormCliente({ ...formCliente, telefono: e.target.value })} style={styles.input} />
                </div>
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Email</label>
                <input type="email" value={formCliente.correo} onChange={e => setFormCliente({ ...formCliente, correo: e.target.value })} style={styles.input} />
              </div>
              <div style={styles.modalActions}>
                <button type="button" onClick={() => setShowModalCliente(false)} style={styles.btnSecondary}>Cancelar</button>
                <button type="submit" style={styles.btnPrimary}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL VEHICULO */}
      {showModalVehiculo && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}><Car size={18} color="#0284c7" /> {editandoVehiculo ? 'Editar Vehículo' : 'Nuevo Vehículo'}</h3>
              <button onClick={() => setShowModalVehiculo(false)} style={styles.iconBtn}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmitVehiculo} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Titular (Cliente)</label>
                <select required value={formVehiculo.clienteId} onChange={e => setFormVehiculo({ ...formVehiculo, clienteId: e.target.value })} style={styles.select}>
                  <option value="">-- Seleccionar Titular --</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.apellido} (DNI: {c.dni})</option>)}
                </select>
              </div>
              <div style={styles.formRow}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Marca</label>
                  <input required placeholder="Volkswagen, Ford..." value={formVehiculo.marca} onChange={e => setFormVehiculo({ ...formVehiculo, marca: e.target.value })} style={styles.input} />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Modelo</label>
                  <input required placeholder="Golf, Ranger..." value={formVehiculo.modelo} onChange={e => setFormVehiculo({ ...formVehiculo, modelo: e.target.value })} style={styles.input} />
                </div>
              </div>
              <div style={styles.formRow}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Dominio / Patente</label>
                  <input required placeholder="AF123ZZ" value={formVehiculo.dominio} onChange={e => setFormVehiculo({ ...formVehiculo, dominio: e.target.value.toUpperCase() })} style={styles.input} />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Año</label>
                  <input type="number" required value={formVehiculo.año} onChange={e => setFormVehiculo({ ...formVehiculo, año: e.target.value })} style={styles.input} />
                </div>
              </div>
              <div style={styles.modalActions}>
                <button type="button" onClick={() => setShowModalVehiculo(false)} style={styles.btnSecondary}>Cancelar</button>
                <button type="submit" style={styles.btnPrimary}>Guardar</button>
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
  btnPrimary: { display: 'flex', alignItems: 'center', gap: '0.45rem', backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' },
  btnSecondary: { display: 'flex', alignItems: 'center', gap: '0.45rem', backgroundColor: '#ffffff', color: '#334155', border: '1px solid #cbd5e1', padding: '0.5rem 0.9rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' },
  tabsWrapper: { display: 'flex', gap: '0.5rem', marginBottom: '1rem' },
  tabButton: { display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.55rem 1rem', borderRadius: '8px', border: '1px solid transparent', backgroundColor: 'transparent', color: '#64748b', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer' },
  tabActive: { backgroundColor: '#ffffff', color: '#0284c7', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' },
  actionBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '0.35rem' },
  card: { backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.07)', overflow: 'hidden' },
  error: { padding: '0.75rem 1rem', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' },
  emptyState: { padding: '3rem', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' },
  thRow: { backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
  th: { padding: '0.85rem 1rem', color: '#475569', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '0.9rem 1rem', fontSize: '0.875rem', verticalAlign: 'middle' },
  cellFlex: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: '#64748b' },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: '#ffffff', borderRadius: '12px', padding: '1.5rem', width: '100%', maxWidth: '520px', boxSizing: 'border-box' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' },
  modalTitle: { display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: '#0f172a', fontSize: '1.1rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '0.85rem' },
  formRow: { display: 'flex', gap: '0.65rem' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, minWidth: 0 },
  label: { fontSize: '0.8rem', fontWeight: '600', color: '#334155' },
  input: { width: '100%', boxSizing: 'border-box', padding: '0.5rem 0.65rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', outline: 'none' },
  select: { width: '100%', boxSizing: 'border-box', padding: '0.5rem 0.65rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem' },
  deniedContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center' },
  deniedTitle: { marginTop: '1rem', fontSize: '1.5rem', color: '#0f172a' },
  deniedText: { color: '#64748b', marginTop: '0.5rem', maxWidth: '400px' }
};