namespace CarFix.API.DTOs
{
    public class DetalleOrdenCompraDTO
    {
        public int ProductoId { get; set; }
        public int Cantidad { get; set; }
        public decimal PrecioUnitario { get; set; }
    }
}