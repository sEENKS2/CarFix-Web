import api from './axiosClient';

export const iaService = {
  // Pre-diagnóstico a partir de lenguaje natural y catálogo de stock
  analizarSintomas: async ({ sintomas, vehiculo, productosDisponibles }) => {
    const res = await api.post('/ia/diagnostico', {
      sintomas,
      vehiculo,
      catalogoRepuestos: productosDisponibles.map(p => ({
        id: p.id,
        codigo: p.codigo,
        nombre: p.nombre,
        categoria: p.categoria,
        stock: p.stockActual
      }))
    });
    return res.data;
  },

  // Predicción de desgaste y servicios preventivos por vehículo
  obtenerMantenimientoPredictivo: async (vehiculoId) => {
    const res = await api.get(`/ia/mantenimiento-predictivo/${vehiculoId}`);
    return res.data;
  }
};