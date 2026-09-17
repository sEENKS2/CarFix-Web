using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Entidades.Turnos;
using Entidades.Tickets;
using Modelo;

namespace CarFix.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TurnosController : ControllerBase
    {
        [HttpGet]
        public IActionResult ObtenerTurnos()
        {
            using var db = new Context();
            var turnos = db.Set<Turno>()
                .AsNoTracking()
                .Include(t => t.Cliente)
                .Include(t => t.Vehiculo)
                .OrderBy(t => t.FechaHora)
                .ToList();

            return Ok(turnos);
        }

        [HttpPost]
        public IActionResult CrearTurno([FromBody] Turno nuevoTurno)
        {
            if (nuevoTurno == null) return BadRequest("Datos inválidos.");

            using var db = new Context();
            nuevoTurno.Estado = "Pendiente";
            db.Set<Turno>().Add(nuevoTurno);
            db.SaveChanges();

            return Ok(new { mensaje = "Turno agendado con éxito.", id = nuevoTurno.Id });
        }

        [HttpPut("{id}/estado")]
        public IActionResult ActualizarEstado(int id, [FromBody] string nuevoEstado)
        {
            using var db = new Context();
            var turno = db.Set<Turno>().Find(id);
            if (turno == null) return NotFound("Turno no encontrado.");

            turno.Estado = nuevoEstado;
            db.SaveChanges();
            return Ok(new { mensaje = "Estado actualizado." });
        }

        [HttpPost("{id}/recepcionar")]
        public IActionResult RecepcionarVehiculo(int id)
        {
            using var db = new Context();
            var turno = db.Set<Turno>()
                .Include(t => t.Cliente)
                .Include(t => t.Vehiculo)
                .FirstOrDefault(t => t.Id == id);

            if (turno == null) return NotFound("Turno no encontrado.");
            if (turno.Estado == "Completado") return BadRequest("Este turno ya fue recepcionado previamente.");

            // Se busca un técnico disponible para asignar por defecto al crear el ticket
            var primerTecnico = db.Tecnicos.FirstOrDefault();
            int tecnicoAsignadoId = primerTecnico != null ? primerTecnico.Id : 1;

            var nuevoTicket = new Ticket
            {
                ClienteId = turno.ClienteId,
                VehiculoId = turno.VehiculoId,
                TecnicoId = tecnicoAsignadoId,
                Descripcion = turno.Motivo,
                Estado = EnumEstados.Asignado,
                FechaCreacion = DateTime.Now
            };

            db.Set<Ticket>().Add(nuevoTicket);
            db.SaveChanges();

            turno.Estado = "Completado";
            turno.TicketId = nuevoTicket.Id;
            db.SaveChanges();

            return Ok(new { 
                mensaje = $"Vehículo recepcionado con éxito. Se generó el Ticket #{nuevoTicket.Id}.",
                ticketId = nuevoTicket.Id 
            });
        }
    }
}