using System;
using Entidades.Tickets; // Asegúrate de importar el namespace de Cliente y Vehiculo

namespace Entidades.Turnos
{
    public class Turno
    {
        public int Id { get; set; }
        public DateTime FechaHora { get; set; }
        public int ClienteId { get; set; }
        public virtual Cliente? Cliente { get; set; }

        public int VehiculoId { get; set; }
        public virtual Vehiculo? Vehiculo { get; set; }

        public string Motivo { get; set; } = string.Empty; // Ej: "Cambio de distribución", "Revisión frenos"
        public string Estado { get; set; } = "Pendiente"; // "Pendiente", "Confirmado", "Cancelado", "Completado"
        public int? TicketId { get; set; } // Se completa cuando ingresa a taller
        public string? Observaciones { get; set; }
    }
}