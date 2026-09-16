namespace CarFix.API.DTOs
{
    public class OrdenCompraAltaDTO
    {
        public int ProveedorId { get; set; }
        public string Observaciones { get; set; } = string.Empty;
        public List<DetalleOrdenCompraDTO> Detalles { get; set; } = new();
    }
}