using Entidades.Tickets;
using Entidades.Validaciones;
using Microsoft.EntityFrameworkCore;
using Modelo;
using System.Collections.ObjectModel;

namespace Controladora
{
    public class ControladoraTickets
    {
        private Context context;
        private static ControladoraTickets instancia;
        public ControladoraClientes Clientes => ControladoraClientes.Instancia;
        public ControladoraVehiculos Vehiculos => ControladoraVehiculos.Instancia;
        public ControladoraTecnicos Tecnicos => ControladoraTecnicos.Instancia;

        public static ControladoraTickets Instancia
        {
            get
            {
                if (instancia == null)
                    instancia = new ControladoraTickets();
                return instancia;
            }
        }

        private ControladoraTickets()
        {
            context = new Context();
        }

        public ReadOnlyCollection<Ticket> RecuperarTickets()
        {
            try
            {
                return context.Tickets
                    .Include(t => t.Cliente)
                    .Include(t => t.Vehiculo)
                    .Include(t => t.Tecnico)
                    .ToList().AsReadOnly();
            }
            catch (Exception)
            {
                throw;
            }
        }

        public void AgregarTicket(int vehiculoId, int clienteId, int tecnicoId, string descripcion, DateTime fechaCreacion, EnumEstados estado)
        {
            var ticket = new Ticket
            {
                Descripcion = descripcion,
                FechaCreacion = fechaCreacion,
                Estado = estado,
                ClienteId = clienteId,
                VehiculoId = vehiculoId,
                TecnicoId = tecnicoId
            };

            context.Tickets.Add(ticket);
            context.SaveChanges();

            // AUDITORÍA: Registrar creación de ticket
            try
            {
                ServicioAuditoria.Instancia.AuditarCreacion(ticket, $"Ticket asignado al técnico {tecnicoId}");
            }
            catch (Exception)
            {
                // Si falla la auditoría, no afecta la operación principal
            }
        }

        public void ModificarTicket(int id, int vehiculoId, int clienteId, int tecnicoId, string descripcion, DateTime fechaCreacion, EnumEstados estado)
        {
            var ticketExistente = context.Tickets.Find(id);
            if (ticketExistente == null)
                throw new Exception("El ticket no existe en la base de datos.");

            if (ticketExistente.Descripcion != descripcion)
            {
                var historial = new HistorialDescripcion
                {
                    TicketId = id,
                    DescripcionAnterior = ticketExistente.Descripcion,
                    DescripcionNueva = descripcion,
                    FechaCambio = DateTime.Now,
                    Usuario = ControladoraSeguridad.Instancia.UsuarioActual?.NombreUsuario ?? "Sistema",
                    Motivo = "Modificación de ticket"
                };

                context.HistorialesDescripciones.Add(historial);
            }

            // AUDITORÍA: Capturar estado anterior
            var ticketAnterior = new Ticket
            {
                Id = ticketExistente.Id,
                Descripcion = ticketExistente.Descripcion,
                Estado = ticketExistente.Estado,
                ClienteId = ticketExistente.ClienteId,
                VehiculoId = ticketExistente.VehiculoId,
                TecnicoId = ticketExistente.TecnicoId,
                FechaCreacion = ticketExistente.FechaCreacion
            };

            ticketExistente.Descripcion = descripcion;
            ticketExistente.Estado = estado;
            ticketExistente.ClienteId = clienteId;
            ticketExistente.VehiculoId = vehiculoId;
            ticketExistente.TecnicoId = tecnicoId;
            ticketExistente.FechaCreacion = fechaCreacion;

            context.SaveChanges();

            // AUDITORÍA: Registrar modificación
            try
            {
                ServicioAuditoria.Instancia.AuditarModificacion(ticketAnterior, ticketExistente, "Modificación de ticket");
            }
            catch (Exception)
            {
                // Si falla la auditoría, no afecta la operación principal
            }
        }
        public List<HistorialDescripcion> ObtenerHistorialDescripciones(int ticketId)
        {
            return context.HistorialesDescripciones
                .Where(h => h.TicketId == ticketId)
                .OrderByDescending(h => h.FechaCambio)
                .ToList();
        }

        public string EliminarTicket(int id, string motivo = "")
        {
            try
            {
                var ticketEncontrado = context.Tickets.Find(id);
                if (ticketEncontrado == null)
                    return "No se pudo eliminar el ticket. No existe.";

                // AUDITORÍA: Registrar eliminación ANTES de eliminar
                try
                {
                    ServicioAuditoria.Instancia.AuditarEliminacion(ticketEncontrado, $"Motivo: {motivo}");
                }
                catch (Exception)
                {
                    // Si falla la auditoría, no afecta la operación principal
                }

                context.Tickets.Remove(ticketEncontrado);
                context.SaveChanges();

                return "El ticket ha sido eliminado correctamente";
            }
            catch (Exception ex)
            {
                return $"Ocurrió un error al eliminar el ticket: {ex.Message}";
            }
        }
        public ResultadoValidacion ValidarTicket(Ticket ticket)
        {
            var resultado = new ResultadoValidacion();

            if (ticket == null)
            {
                resultado.EsValido = false;
                resultado.Errores.Add("El ticket no puede ser nulo");
                return resultado;
            }

            if (string.IsNullOrEmpty(ticket.Descripcion))
            {
                resultado.EsValido = false;
                resultado.Errores.Add("La descripción es requerida");
            }

            if (ticket.Descripcion != null && ticket.Descripcion.Length > 500)
            {
                resultado.EsValido = false;
                resultado.Errores.Add("La descripción no puede exceder 500 caracteres");
            }

            if (ticket.ClienteId <= 0)
            {
                resultado.EsValido = false;
                resultado.Errores.Add("Debe asignar un cliente válido");
            }

            if (ticket.TecnicoId <= 0)
            {
                resultado.EsValido = false;
                resultado.Errores.Add("Debe asignar un técnico válido");
            }

            if (ticket.VehiculoId <= 0)
            {
                resultado.EsValido = false;
                resultado.Errores.Add("Debe asignar un vehículo válido");
            }

            if (ticket.FechaCreacion > DateTime.Now.AddDays(1))
            {
                resultado.EsValido = false;
                resultado.Errores.Add("La fecha no puede ser futura");
            }

            if (!Enum.IsDefined(typeof(EnumEstados), ticket.Estado))
            {
                resultado.EsValido = false;
                resultado.Errores.Add("Estado del ticket inválido");
            }

            if (resultado.Errores.Count == 0)
            {
                resultado.EsValido = true;
            }

            return resultado;
        }
    }
}