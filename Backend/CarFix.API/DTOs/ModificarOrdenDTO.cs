namespace CarFix.API.DTOs
{
    public class ModificarOrdenDTO
    {
        public int NuevoProveedorId { get; set; }
        public string NuevasObservaciones { get; set; } = string.Empty;
    }
}