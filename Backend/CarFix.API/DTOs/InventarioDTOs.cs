namespace CarFix.API.DTOs
{
    public class AjusteStockAltaDTO
    {
        public int ProductoId { get; set; }
        public int Cantidad { get; set; }
        public string TipoAjuste { get; set; } = "Ingreso"; // "Ingreso" o "Egreso"
        public string Motivo { get; set; } = string.Empty;
    }

    public class MovimientoStockDTO
    {
        public int Id { get; set; }
        public int ProductoId { get; set; }
        public string NombreProducto { get; set; } = string.Empty;
        public DateTime Fecha { get; set; }
        public string TipoMovimiento { get; set; } = string.Empty;
        public int Cantidad { get; set; }
        public int StockAnterior { get; set; }
        public int StockNuevo { get; set; }
        public string? MotivoReferencia { get; set; }
        public string? Usuario { get; set; }
    }
}