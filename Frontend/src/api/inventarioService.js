import axiosClient from './axiosClient';

export const inventarioService = {
  obtenerMovimientos: (productoId = null) => 
    axiosClient.get(productoId ? `/Inventario/movimientos?productoId=${productoId}` : '/Inventario/movimientos'),
  obtenerAlertas: () => axiosClient.get('/Inventario/alertas-stock'),
  registrarAjuste: (datosAjuste) => axiosClient.post('/Inventario/ajuste', datosAjuste),
};