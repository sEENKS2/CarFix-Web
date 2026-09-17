namespace Entidades.Validaciones
{
    public class ProductividadTecnico
    {
        public int TecnicoId { get; set; }
        public string NombreTecnico { get; set; }
        public string Especialidad { get; set; }
        public int TotalTickets { get; set; }
        public int TicketsFinalizados { get; set; }
        public int TicketsEnProceso { get; set; }
        public int TicketsAsignados { get; set; }
        public double PorcentajeFinalizados { get; set; }
        public double PromedioTicketsPorMes { get; set; }
        public DateTime? UltimoTicketFecha { get; set; }

        // Propiedades calculadas
        public string RendimientoTexto
        {
            get
            {
                if (PorcentajeFinalizados >= 80) return "Excelente";
                if (PorcentajeFinalizados >= 60) return "Bueno";
                if (PorcentajeFinalizados >= 40) return "Regular";
                return "Necesita Mejora";
            }
        }

        public string EstadoActividad
        {
            get
            {
                if (!UltimoTicketFecha.HasValue) return "Sin Actividad";
                var diasSinActividad = (DateTime.Now - UltimoTicketFecha.Value).Days;
                if (diasSinActividad <= 7) return "Activo";
                if (diasSinActividad <= 30) return "Moderado";
                return "Inactivo";
            }
        }
    }
}