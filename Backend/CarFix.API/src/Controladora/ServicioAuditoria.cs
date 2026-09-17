using Entidades.Compras;
using Entidades.Tickets;
using Entidades.Validaciones;
using Microsoft.EntityFrameworkCore;
using Modelo;

namespace Controladora
{
    public class ServicioAuditoria
    {
        private Context context;
        private static ServicioAuditoria instancia;

        public static ServicioAuditoria Instancia
        {
            get
            {
                if (instancia == null)
                    instancia = new ServicioAuditoria();
                return instancia;
            }
        }

        private ServicioAuditoria()
        {
            context = new Context();
        }

        public void AuditarCreacion<T>(T entidad, string observaciones = "") where T : class
        {
            var usuarioActual = ControladoraSeguridad.Instancia.UsuarioActual;
            if (usuarioActual == null) return;

            if (entidad is OrdenCompra orden)
            {
                var auditoria = new AuditoriaOrdenesCompra
                {
                    OrdenCompraId = orden.Id,
                    Accion = "CREATE",
                    Campo = "ORDEN_COMPLETA",
                    ValorAnterior = "",
                    ValorNuevo = $"Orden #{orden.Numero} - Proveedor: {orden.ProveedorId} - Total: {orden.Total:C}",
                    FechaHora = DateTime.Now,
                    UsuarioId = usuarioActual.Id,
                    Observaciones = observaciones
                };

                context.AuditoriasOrdenesCompra.Add(auditoria);
                context.SaveChanges();
            }
            else if (entidad is Ticket ticket)
            {
                var auditoria = new AuditoriaTickets
                {
                    TicketId = ticket.Id,
                    Accion = "CREATE",
                    Campo = "TICKET_COMPLETO",
                    ValorAnterior = "",
                    ValorNuevo = $"Ticket #{ticket.Id} - Cliente: {ticket.ClienteId} - Estado: {ticket.Estado}",
                    FechaHora = DateTime.Now,
                    UsuarioId = usuarioActual.Id,
                    Observaciones = observaciones
                };

                context.AuditoriasTickets.Add(auditoria);
                context.SaveChanges();
            }
        }

        public void AuditarModificacion<T>(T entidadAnterior, T entidadNueva, string observaciones = "") where T : class
        {
            var usuarioActual = ControladoraSeguridad.Instancia.UsuarioActual;
            if (usuarioActual == null) return;

            var propiedades = typeof(T).GetProperties();

            foreach (var propiedad in propiedades)
            {
                var valorAnterior = propiedad.GetValue(entidadAnterior);
                var valorNuevo = propiedad.GetValue(entidadNueva);

                if (!object.Equals(valorAnterior, valorNuevo) && propiedad.Name != "Id")
                {
                    if (entidadNueva is OrdenCompra orden)
                    {
                        var auditoria = new AuditoriaOrdenesCompra
                        {
                            OrdenCompraId = orden.Id,
                            Accion = "UPDATE",
                            Campo = propiedad.Name,
                            ValorAnterior = valorAnterior?.ToString() ?? "",
                            ValorNuevo = valorNuevo?.ToString() ?? "",
                            FechaHora = DateTime.Now,
                            UsuarioId = usuarioActual.Id,
                            Observaciones = observaciones
                        };

                        context.AuditoriasOrdenesCompra.Add(auditoria);
                    }
                    else if (entidadNueva is Ticket ticket)
                    {
                        var auditoria = new AuditoriaTickets
                        {
                            TicketId = ticket.Id,
                            Accion = "UPDATE",
                            Campo = propiedad.Name,
                            ValorAnterior = valorAnterior?.ToString() ?? "",
                            ValorNuevo = valorNuevo?.ToString() ?? "",
                            FechaHora = DateTime.Now,
                            UsuarioId = usuarioActual.Id,
                            Observaciones = observaciones
                        };

                        context.AuditoriasTickets.Add(auditoria);
                    }
                }
            }

            context.SaveChanges();
        }

        public void AuditarEliminacion<T>(T entidad, string observaciones = "") where T : class
        {
            var usuarioActual = ControladoraSeguridad.Instancia.UsuarioActual;
            if (usuarioActual == null) return;

            if (entidad is OrdenCompra orden)
            {
                var auditoria = new AuditoriaOrdenesCompra
                {
                    OrdenCompraId = orden.Id,
                    Accion = "DELETE",
                    Campo = "ORDEN_COMPLETA",
                    ValorAnterior = $"Orden #{orden.Numero} - Total: {orden.Total:C}",
                    ValorNuevo = "ELIMINADA",
                    FechaHora = DateTime.Now,
                    UsuarioId = usuarioActual.Id,
                    Observaciones = observaciones
                };

                context.AuditoriasOrdenesCompra.Add(auditoria);
                context.SaveChanges();
            }
            else if (entidad is Ticket ticket)
            {
                var auditoria = new AuditoriaTickets
                {
                    TicketId = ticket.Id,
                    Accion = "DELETE",
                    Campo = "TICKET_COMPLETO",
                    ValorAnterior = $"Ticket #{ticket.Id} - Estado: {ticket.Estado}",
                    ValorNuevo = "ELIMINADO",
                    FechaHora = DateTime.Now,
                    UsuarioId = usuarioActual.Id,
                    Observaciones = observaciones
                };

                context.AuditoriasTickets.Add(auditoria);
                context.SaveChanges();
            }
        }

        public void AuditarCambioEstado(int ordenId, string estadoAnterior, string estadoNuevo, string observaciones = "")
        {
            var usuarioActual = ControladoraSeguridad.Instancia.UsuarioActual;
            if (usuarioActual == null) return;

            var auditoria = new AuditoriaOrdenesCompra
            {
                OrdenCompraId = ordenId,
                Accion = "CHANGE_STATUS",
                Campo = "Estado",
                ValorAnterior = estadoAnterior,
                ValorNuevo = estadoNuevo,
                FechaHora = DateTime.Now,
                UsuarioId = usuarioActual.Id,
                Observaciones = observaciones
            };

            context.AuditoriasOrdenesCompra.Add(auditoria);
            context.SaveChanges();
        }

        public List<AuditoriaOrdenesCompra> ObtenerAuditoriaOrdenes(int? ordenId = null, DateTime? fechaDesde = null, DateTime? fechaHasta = null)
        {
            var query = context.AuditoriasOrdenesCompra.Include(a => a.Usuario).AsQueryable();

            if (ordenId.HasValue)
                query = query.Where(a => a.OrdenCompraId == ordenId.Value);

            if (fechaDesde.HasValue)
                query = query.Where(a => a.FechaHora >= fechaDesde.Value);

            if (fechaHasta.HasValue)
                query = query.Where(a => a.FechaHora <= fechaHasta.Value);

            return query.OrderByDescending(a => a.FechaHora).ToList();
        }

        public List<AuditoriaTickets> ObtenerAuditoriaTickets(int? ticketId = null, DateTime? fechaDesde = null, DateTime? fechaHasta = null)
        {
            var query = context.AuditoriasTickets.Include(a => a.Usuario).AsQueryable();

            if (ticketId.HasValue)
                query = query.Where(a => a.TicketId == ticketId.Value);

            if (fechaDesde.HasValue)
                query = query.Where(a => a.FechaHora >= fechaDesde.Value);

            if (fechaHasta.HasValue)
                query = query.Where(a => a.FechaHora <= fechaHasta.Value);

            return query.OrderByDescending(a => a.FechaHora).ToList();
        }
    }
}