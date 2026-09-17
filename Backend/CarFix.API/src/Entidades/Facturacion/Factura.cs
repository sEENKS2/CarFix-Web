using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

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
        public string Estado { get; set; } = "Pendiente"; // "Pendiente", "PagadaParcial", "Pagada", "Anulada"
        public string? Observaciones { get; set; }

        public List<DetalleFactura> Detalles { get; set; } = new();
        public List<Pago> Pagos { get; set; } = new();
    }
}