namespace CarFix.API.DTOs
{
    public class VehiculoAltaDTO
    {
        public int ClienteId { get; set; }
        public string Marca { get; set; } = string.Empty;
        public string Modelo { get; set; } = string.Empty;
        public int Anio { get; set; } // O Año según tu preferencia
        public string Dominio { get; set; } = string.Empty;
    }
}