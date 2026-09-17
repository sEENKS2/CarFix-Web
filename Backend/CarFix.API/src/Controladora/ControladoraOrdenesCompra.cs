using Entidades.Compras;
using Entidades.Patrones;
using Entidades.Validaciones;
using Microsoft.EntityFrameworkCore;
using Modelo;
using System.Collections.ObjectModel;

namespace Controladora
{
    public class ControladoraOrdenesCompra
    {
        private Context context;
        private static ControladoraOrdenesCompra instancia;

        public static ControladoraOrdenesCompra Instancia
        {
            get
            {
                if (instancia == null)
                    instancia = new ControladoraOrdenesCompra();
                return instancia;
            }
        }

        private ControladoraOrdenesCompra()
        {
            context = new Context();
        }

        public ReadOnlyCollection<OrdenCompra> RecuperarOrdenesCompra()
        {
            using (var context = new Context())
            {
                return context.OrdenesCompra
                    .AsNoTracking()
                    .Include(o => o.Proveedor)
                    .Include(o => o.Detalles)
                    .ThenInclude(d => d.Producto)
                    .OrderByDescending(o => o.Id)
                    .ToList()
                    .AsReadOnly();
            }
        }

        public void CrearOrdenCompra(int proveedorId, List<DetalleOrdenCompra> detalles, string observaciones = "")
        {
            using (var context = new Context())
            {
                // 1. Asegurar cálculo de subtotales primero
                foreach (var detalle in detalles)
                {
                    detalle.Subtotal = detalle.Cantidad * detalle.PrecioUnitario;
                    // Asegurar que no arrastre referencias de navegación que confundan a EF
                    detalle.Producto = null;
                    detalle.OrdenCompra = null;
                }

                // 2. Generar número de orden con contexto fresco
                var ultimaOrden = context.OrdenesCompra
                    .OrderByDescending(o => o.Id)
                    .FirstOrDefault();

                int siguienteNumero = (ultimaOrden?.Id ?? 0) + 1;
                string numeroGenerado = $"OC-{DateTime.Now.Year}-{siguienteNumero:D4}";

                var orden = new OrdenCompra
                {
                    Numero = numeroGenerado,
                    FechaCreacion = DateTime.Now,
                    Estado = OrdenCompra.EstadoOrden.Pendiente,
                    ProveedorId = proveedorId,
                    Detalles = detalles,
                    Observaciones = observaciones ?? "",
                    Total = detalles.Sum(d => d.Subtotal)
                };

                context.OrdenesCompra.Add(orden);
                context.SaveChanges();

                // 3. Auditoría segura para entorno Web / Desktop
                try
                {
                    ServicioAuditoria.Instancia.AuditarCreacion(orden, $"Orden creada con {detalles.Count} productos");
                    NotificadorOrdenesCompra.Instancia.NotifyObservers("ORDEN_CREADA", orden);
                }
                catch
                {
                    // Evitar que un fallo de auditoría de escritorio interrumpa la persistencia de la orden
                }
            }
        }

        public void CambiarEstadoOrden(int ordenId, OrdenCompra.EstadoOrden nuevoEstado)
        {
            using (var context = new Context())
            {
                var orden = context.OrdenesCompra.Find(ordenId);
                if (orden == null)
                    throw new Exception("Orden no encontrada");

                var estadoAnterior = orden.Estado.ToString();
                orden.Estado = nuevoEstado;

                switch (nuevoEstado)
                {
                    case OrdenCompra.EstadoOrden.Enviada:
                        orden.FechaEnvio = DateTime.Now;
                        break;
                    case OrdenCompra.EstadoOrden.Recibida:
                        orden.FechaRecepcion = DateTime.Now;
                        // Pasamos el mismo context para mantener la transacción atómica
                        ActualizarStock(orden, context);
                        break;
                }

                context.SaveChanges();

                // AUDITORÍA protegida (no rompe si UsuarioActual es null en entorno Web)
                try
                {
                    ServicioAuditoria.Instancia.AuditarCambioEstado(ordenId, estadoAnterior, nuevoEstado.ToString(),
                        $"Cambio de estado por usuario {ControladoraSeguridad.Instancia.UsuarioActual?.NombreUsuario ?? "WebAdmin"}");

                    NotificadorOrdenesCompra.Instancia.NotifyObservers("ESTADO_CAMBIADO", orden);
                }
                catch
                {
                    // Ignorar excepciones secundarias de auditoría desktop
                }
            }
        }

        public void ModificarOrden(int ordenId, int nuevoProveedorId, string nuevasObservaciones)
        {
            var orden = context.OrdenesCompra.Find(ordenId);
            if (orden == null)
                throw new Exception("Orden no encontrada");

            // AUDITORÍA: Capturar estado anterior
            var ordenAnterior = new OrdenCompra
            {
                Id = orden.Id,
                ProveedorId = orden.ProveedorId,
                Observaciones = orden.Observaciones,
                Total = orden.Total
            };

            // Aplicar cambios
            orden.ProveedorId = nuevoProveedorId;
            orden.Observaciones = nuevasObservaciones;

            context.SaveChanges();

            // AUDITORÍA: Registrar modificación
            ServicioAuditoria.Instancia.AuditarModificacion(ordenAnterior, orden, "Modificación de orden de compra");
        }

        public void EliminarOrden(int ordenId, string motivo = "")
        {
            var orden = context.OrdenesCompra
                .Include(o => o.Detalles)
                .FirstOrDefault(o => o.Id == ordenId);

            if (orden == null)
                throw new Exception("Orden no encontrada");

            if (orden.Estado != OrdenCompra.EstadoOrden.Pendiente)
                throw new Exception("Solo se pueden eliminar órdenes pendientes");

            // AUDITORÍA: Registrar eliminación ANTES de eliminar
            ServicioAuditoria.Instancia.AuditarEliminacion(orden, $"Motivo: {motivo}");

            context.OrdenesCompra.Remove(orden);
            context.SaveChanges();
        }

        private void ActualizarStock(OrdenCompra orden, Context context)
        {
            var detalles = context.DetallesOrdenesCompra
                .Include(d => d.Producto)
                .Where(d => d.OrdenCompraId == orden.Id)
                .ToList();

            foreach (var detalle in detalles)
            {
                if (detalle.Producto != null)
                {
                    int stockAnterior = detalle.Producto.StockActual;
                    detalle.Producto.StockActual += detalle.Cantidad;

                    // 1. Asentar trazabilidad en Kardex (MovimientosStock)
                    context.MovimientosStock.Add(new MovimientoStock
                    {
                        ProductoId = detalle.Producto.Id,
                        Fecha = DateTime.Now,
                        TipoMovimiento = "Entrada_Compra",
                        Cantidad = detalle.Cantidad,
                        StockAnterior = stockAnterior,
                        StockNuevo = detalle.Producto.StockActual,
                        MotivoReferencia = $"Orden de Compra #{orden.Numero}",
                        Usuario = ControladoraSeguridad.Instancia.UsuarioActual?.NombreUsuario ?? "Admin"
                    });

                    // 2. Auditoría histórica de la orden
                    try
                    {
                        int? usuarioIdValido = ControladoraSeguridad.Instancia.UsuarioActual?.Id;
                        // Si es null o 0, solo agregamos si la tabla admite NULL, o buscamos el primer admin
                        if (usuarioIdValido == null || usuarioIdValido == 0)
                        {
                            var primerUsuario = context.Usuarios.FirstOrDefault();
                            usuarioIdValido = primerUsuario?.Id;
                        }

                        if (usuarioIdValido.HasValue && usuarioIdValido.Value > 0)
                        {
                            var auditoriaStock = new AuditoriaOrdenesCompra
                            {
                                OrdenCompraId = orden.Id,
                                Accion = "UPDATE_STOCK",
                                Campo = $"Stock_Producto_{detalle.Producto.Codigo}",
                                ValorAnterior = stockAnterior.ToString(),
                                ValorNuevo = detalle.Producto.StockActual.ToString(),
                                FechaHora = DateTime.Now,
                                UsuarioId = usuarioIdValido.Value,
                                Observaciones = $"Actualización automática por recepción de orden {orden.Numero}"
                            };
                            context.AuditoriasOrdenesCompra.Add(auditoriaStock);
                        }
                    }
                    catch
                    {
                        // Si la tabla AuditoriasOrdenesCompra tiene alguna restricción adicional, no bloquea el stock
                    }
                }
            }
        }

        private string GenerarNumeroOrden()
        {
            var ultimaOrden = context.OrdenesCompra
                .OrderByDescending(o => o.Id)
                .FirstOrDefault();

            int numero = ultimaOrden?.Id + 1 ?? 1;
            return $"OC-{DateTime.Now.Year}-{numero:D4}";
        }
    }
}