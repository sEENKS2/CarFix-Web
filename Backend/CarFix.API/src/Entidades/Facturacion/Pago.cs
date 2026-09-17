using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Entidades.Facturacion
{
    public class Pago
    {
        public int Id { get; set; }
        public int FacturaId { get; set; }
        public DateTime FechaPago { get; set; } = DateTime.Now;
        public decimal Monto { get; set; }
        public string MetodoPago { get; set; } = "Efectivo"; // "Efectivo", "Transferencia", "Tarjeta"
        public string? ReferenciaComprobante { get; set; }
    }
}