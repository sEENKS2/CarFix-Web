namespace CarFix.API.DTOs
{
    public class AuditoriaDTO
    {
        public int Id { get; set; }
        public string Modulo { get; set; } = string.Empty; // "Tickets" u "Órdenes de Compra"
        public int EntidadId { get; set; }
        public string Accion { get; set; } = string.Empty;
        public string Campo { get; set; } = string.Empty;
        public string ValorAnterior { get; set; } = string.Empty;
        public string ValorNuevo { get; set; } = string.Empty;
        public DateTime FechaHora { get; set; }
        public string Usuario { get; set; } = string.Empty;
        public string Observaciones { get; set; } = string.Empty;
    }
}