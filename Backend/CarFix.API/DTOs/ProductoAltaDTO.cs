namespace CarFix.API.DTOs
{
    public class ProductoAltaDTO
    {
        public string Codigo { get; set; } = string.Empty;
        public string Nombre { get; set; } = string.Empty;
        public string Descripcion { get; set; } = string.Empty;
        public string Categoria { get; set; } = string.Empty;
        public decimal PrecioUnitario { get; set; }
        public int StockMinimo { get; set; }
        public int StockActual { get; set; }
    }
}