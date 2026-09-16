namespace CarFix.API.DTOs
{
    public class TicketAltaDTO
    {
        public string Descripcion { get; set; } = string.Empty;
        public int Estado { get; set; }
        public int ClienteId { get; set; }
        public int VehiculoId { get; set; }
        public int TecnicoId { get; set; }
    }
}