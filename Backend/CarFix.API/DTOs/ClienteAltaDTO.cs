namespace CarFix.API.DTOs
{
    public class ClienteAltaDTO
    {
        public string Nombre { get; set; } = string.Empty;
        public string Apellido { get; set; } = string.Empty;
        public int Dni { get; set; }
        public string Correo { get; set; } = string.Empty;
        public int Telefono { get; set; }
    }
}