using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Controladora;
using CarFix.API.DTOs;

namespace CarFix.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class AuditoriaController : ControllerBase
    {
        private readonly ServicioAuditoria _servicioAuditoria = ServicioAuditoria.Instancia;
        private readonly ControladoraSeguridad _seguridad = ControladoraSeguridad.Instancia;

        [HttpGet]
        public IActionResult ObtenerTodo([FromQuery] AuditoriaLoginDTO filtro)
        {
            try
            {
                var desde = filtro?.FechaDesde;
                var hasta = filtro?.FechaHasta;

                // 1. Auditoría de Tickets
                var auditoriaTickets = _servicioAuditoria.ObtenerAuditoriaTickets(null, desde, hasta)
                    .Select(a => new AuditoriaDTO
                    {
                        Id = a.Id,
                        Modulo = "Tickets",
                        EntidadId = a.TicketId,
                        Accion = a.Accion,
                        Campo = a.Campo,
                        ValorAnterior = a.ValorAnterior ?? "",
                        ValorNuevo = a.ValorNuevo ?? "",
                        FechaHora = a.FechaHora,
                        Usuario = a.Usuario?.NombreUsuario ?? $"Usuario #{a.UsuarioId}",
                        Observaciones = !string.IsNullOrEmpty(a.Observaciones)
                            ? a.Observaciones
                            : (a.Accion == "UPDATE" ? $"Modificó {a.Campo}: '{a.ValorAnterior}' ➔ '{a.ValorNuevo}'" : a.ValorNuevo)
                    });

                // 2. Auditoría de Compras
                var auditoriaCompras = _servicioAuditoria.ObtenerAuditoriaOrdenes(null, desde, hasta)
                    .Select(a => new AuditoriaDTO
                    {
                        Id = a.Id,
                        Modulo = "Órdenes de Compra",
                        EntidadId = a.OrdenCompraId,
                        Accion = a.Accion,
                        Campo = a.Campo,
                        ValorAnterior = a.ValorAnterior ?? "",
                        ValorNuevo = a.ValorNuevo ?? "",
                        FechaHora = a.FechaHora,
                        Usuario = a.Usuario?.NombreUsuario ?? $"Usuario #{a.UsuarioId}",
                        Observaciones = !string.IsNullOrEmpty(a.Observaciones)
                            ? a.Observaciones
                            : (a.Accion == "UPDATE" ? $"Modificó {a.Campo}: '{a.ValorAnterior}' ➔ '{a.ValorNuevo}'" : a.ValorNuevo)
                    });

                // 3. Auditoría de Logins
                var auditoriaLogins = _seguridad.ObtenerAuditoriaLogin(desde, hasta)
                    .Select(a => new AuditoriaDTO
                    {
                        Id = a.Id,
                        Modulo = "Seguridad",
                        EntidadId = a.UsuarioId,
                        Accion = a.TipoEvento,
                        Campo = "Autenticación",
                        ValorAnterior = a.DireccionIP ?? "127.0.0.1",
                        ValorNuevo = a.TipoEvento,
                        FechaHora = a.FechaHora,
                        Usuario = a.NombreUsuario,
                        Observaciones = a.TipoEvento == "LOGIN"
                            ? $"Inicio de sesión exitoso (IP: {a.DireccionIP ?? "127.0.0.1"})"
                            : a.TipoEvento == "INTENTO_FALLIDO"
                                ? $"Intento fallido de acceso (IP: {a.DireccionIP ?? "127.0.0.1"})"
                                : $"Cierre de sesión (IP: {a.DireccionIP ?? "127.0.0.1"})"
                    });

                var resultado = auditoriaTickets
                    .Concat(auditoriaCompras)
                    .Concat(auditoriaLogins)
                    .OrderByDescending(a => a.FechaHora)
                    .ToList();

                return Ok(resultado);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error al consultar auditorías: {ex.Message}");
            }
        }
    }
}