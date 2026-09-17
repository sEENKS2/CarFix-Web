namespace Entidades.Facturacion
{
    public class Factura
    {
        public int Id { get; set; }
        public int TicketId { get; set; }
        public int ClienteId { get; set; }
        public string NumeroFactura { get; set; } = string.Empty;
        public DateTime FechaEmision { get; set; } = DateTime.Now;
        public decimal Subtotal { get; set; }
        public decimal Descuento { get; set; }
        public decimal Total { get; set; }
        public decimal SaldoPendiente { get; set; }
        public string Estado { get; set; } = "Pendiente";
        public string? Observaciones { get; set; }

        // Propiedad de navegación:
        public virtual Entidades.Tickets.Cliente? Cliente { get; set; }

        public List<DetalleFactura> Detalles { get; set; } = new();
        public List<Pago> Pagos { get; set; } = new();
    }
}