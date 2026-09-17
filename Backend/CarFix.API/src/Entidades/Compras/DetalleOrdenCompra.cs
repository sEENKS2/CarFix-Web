using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Entidades.Compras
{
    public class DetalleOrdenCompra
    {
        [Key]
        public int Id { get; set; }
        public int Cantidad { get; set; }
        public decimal PrecioUnitario { get; set; }
        public decimal Subtotal { get; set; }

        public int OrdenCompraId { get; set; }
        [ForeignKey("OrdenCompraId")]
        public OrdenCompra OrdenCompra { get; set; }

        public int ProductoId { get; set; }
        [ForeignKey("ProductoId")]
        public Producto Producto { get; set; }
    }
}
