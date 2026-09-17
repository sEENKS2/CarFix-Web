namespace CarFix.API.DTOs
{
    // Creación de detalle de factura
    public class DetalleFacturaAltaDTO
    {
        public string Tipo { get; set; } = "Repuesto"; // "Repuesto" o "ManoDeObra"
        public int? ProductoId { get; set; }
        public string Descripcion { get; set; } = string.Empty;
        public int Cantidad { get; set; }
        public decimal PrecioUnitario { get; set; }
    }

    // Solicitud para emitir una factura
    public class FacturaAltaDTO
    {
        public int TicketId { get; set; }
        public int ClienteId { get; set; }
        public decimal Descuento { get; set; } = 0;
        public string? Observaciones { get; set; }
        public List<DetalleFacturaAltaDTO> Detalles { get; set; } = new();
    }

    // Registro de un cobro
    public class PagoAltaDTO
    {
        public decimal Monto { get; set; }
        public string MetodoPago { get; set; } = "Efectivo"; // "Efectivo", "Transferencia", "Tarjeta"
        public string? ReferenciaComprobante { get; set; }
    }

    // Solicitud para anular
    public class AnularFacturaDTO
    {
        public string Motivo { get; set; } = string.Empty;
    }
}