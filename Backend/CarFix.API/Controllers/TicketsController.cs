using Microsoft.AspNetCore.Mvc;
using Entidades.Tickets;
using CarFix.API.DTOs;
using Microsoft.EntityFrameworkCore;

namespace CarFix.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TicketsController : ControllerBase
    {
        [HttpGet]
        public IActionResult ListarTodo()
        {
            try
            {
                using (var context = new Modelo.Context())
                {
                    // AsNoTracking() evita la caché de primer nivel de Entity Framework
                    var lista = context.Tickets
                        .AsNoTracking()
                        .Include(t => t.Cliente)
                        .Include(t => t.Vehiculo)
                        .Include(t => t.Tecnico)
                        .OrderByDescending(t => t.Id)
                        .ToList();

                    return Ok(lista);
                }
            }
            catch (Exception ex)
            {
                return BadRequest($"Error al recuperar datos: {ex.Message}");
            }
        }

        [HttpGet("vehiculo/{vehiculoId}")]
        public IActionResult ObtenerPorVehiculo(int vehiculoId)
        {
            try
            {
                using (var context = new Modelo.Context())
                {
                    var ticketsVehiculo = context.Tickets
                        .AsNoTracking()
                        .Include(t => t.Tecnico)
                        .Where(t => t.VehiculoId == vehiculoId)
                        .OrderByDescending(t => t.FechaCreacion)
                        .Select(t => new
                        {
                            t.Id,
                            t.Descripcion,
                            t.Estado,
                            t.FechaCreacion,
                            Tecnico = t.Tecnico != null ? $"{t.Tecnico.Nombre} {t.Tecnico.Apellido}" : "Sin asignar"
                        })
                        .ToList();

                    return Ok(ticketsVehiculo);
                }
            }
            catch (Exception ex)
            {
                return BadRequest($"Error al obtener historial del vehículo: {ex.Message}");
            }
        }

        [HttpPost]
        public IActionResult Crear([FromBody] TicketAltaDTO dto)
        {
            try
            {
                using (var context = new Modelo.Context())
                {
                    var nuevoTicket = new Ticket
                    {
                        VehiculoId = dto.VehiculoId,
                        ClienteId = dto.ClienteId,
                        TecnicoId = dto.TecnicoId,
                        Descripcion = dto.Descripcion,
                        FechaCreacion = DateTime.Now,
                        Estado = (EnumEstados)dto.Estado
                    };

                    context.Tickets.Add(nuevoTicket);
                    context.SaveChanges();
                }

                return Ok(new { mensaje = "Ticket creado exitosamente" });
            }
            catch (Exception ex)
            {
                var mensajeError = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                return BadRequest($"Error al crear ticket: {mensajeError}");
            }
        }

        [HttpPut("{id}/estado")]
        public IActionResult ActualizarEstado(int id, [FromBody] ActualizarEstadoDTO dto)
        {
            try
            {
                using (var context = new Modelo.Context())
                {
                    var ticket = context.Tickets.Find(id);
                    if (ticket == null)
                        return NotFound("El ticket no existe.");

                    ticket.Estado = (EnumEstados)dto.Estado;
                    context.SaveChanges();
                }

                return Ok(new { mensaje = "Estado actualizado exitosamente" });
            }
            catch (Exception ex)
            {
                return BadRequest($"Error al actualizar estado: {ex.Message}");
            }
        }

        [HttpPut("{id}")]
        public IActionResult Modificar(int id, [FromBody] TicketAltaDTO dto)
        {
            try
            {
                using (var context = new Modelo.Context())
                {
                    var ticket = context.Tickets.Find(id);
                    if (ticket == null)
                        return NotFound("El ticket no existe.");

                    ticket.ClienteId = dto.ClienteId;
                    ticket.VehiculoId = dto.VehiculoId;
                    ticket.TecnicoId = dto.TecnicoId;
                    ticket.Descripcion = dto.Descripcion;
                    ticket.Estado = (EnumEstados)dto.Estado;

                    context.SaveChanges();
                }

                return Ok(new { mensaje = "Ticket actualizado correctamente" });
            }
            catch (Exception ex)
            {
                var mensajeError = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                return BadRequest($"Error al modificar el ticket: {mensajeError}");
            }
        }
    }
}