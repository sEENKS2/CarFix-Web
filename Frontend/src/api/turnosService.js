import api from './axiosClient';

export const turnosService = {
  obtenerTodos: () => api.get('/turnos'),
  crear: (datos) => api.post('/turnos', datos),
  cambiarEstado: (id, estado) => api.put(`/turnos/${id}/estado`, JSON.stringify(estado), {
    headers: { 'Content-Type': 'application/json' }
  }),
  recepcionar: (id) => api.post(`/turnos/${id}/recepcionar`)
};