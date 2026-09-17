import axiosClient from './axiosClient';

export const facturasService = {
  obtenerTodas: () => axiosClient.get('/Facturas'),
  obtenerPorId: (id) => axiosClient.get(`/Facturas/${id}`),
  obtenerPorTicket: (ticketId) => axiosClient.get(`/Facturas/ticket/${ticketId}`),
  obtenerPorCliente: (clienteId) => axiosClient.get(`/Facturas/cliente/${clienteId}`),
  crearFactura: (datos) => axiosClient.post('/Facturas', datos),
  registrarPago: (id, datosPago) => axiosClient.post(`/Facturas/${id}/pagos`, datosPago),
  anularFactura: (id, motivo) => axiosClient.put(`/Facturas/${id}/anular`, { motivo }),
};