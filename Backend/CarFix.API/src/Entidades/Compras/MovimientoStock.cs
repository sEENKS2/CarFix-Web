using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Entidades.Compras
{
    public class MovimientoStock
    {
        public int Id { get; set; }
        public int ProductoId { get; set; }
        public DateTime Fecha { get; set; } = DateTime.Now;
        public string TipoMovimiento { get; set; } = "Ajuste"; // "Entrada_Compra", "Salida_Taller", "Ajuste_Manual"
        public int Cantidad { get; set; }
        public int StockAnterior { get; set; }
        public int StockNuevo { get; set; }
        public string? MotivoReferencia { get; set; } // Ej: "Orden de Compra #12", "Factura #FAC-2026-000001", "Rotura"
        public string? Usuario { get; set; }
    }
}