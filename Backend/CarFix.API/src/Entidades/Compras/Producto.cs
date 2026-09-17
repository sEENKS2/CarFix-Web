using System.ComponentModel.DataAnnotations;

namespace Entidades.Compras
{
    public class Producto
    {
        [Key]
        public int Id { get; set; }
        public string Codigo { get; set; }
        public string Nombre { get; set; }
        public string Descripcion { get; set; }
        public string Categoria { get; set; }
        public decimal PrecioUnitario { get; set; }
        public int StockMinimo { get; set; }
        public int StockActual { get; set; }
        public bool Activo { get; set; } = true;
    }
}
