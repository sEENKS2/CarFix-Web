using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Entidades.Compras
{
    public class OrdenCompra
    {
        [Key]
        public int Id { get; set; }
        public string Numero { get; set; }
        public DateTime FechaCreacion { get; set; }
        public DateTime? FechaEnvio { get; set; }
        public DateTime? FechaRecepcion { get; set; }
        public EstadoOrden Estado { get; set; }
        public decimal Total { get; set; }
        public string Observaciones { get; set; }

        public int ProveedorId { get; set; }
        [ForeignKey("ProveedorId")]
        public Proveedor Proveedor { get; set; }

        public List<DetalleOrdenCompra> Detalles { get; set; } = new List<DetalleOrdenCompra>();

        public enum EstadoOrden
        {
            Pendiente,
            Enviada,
            Recibida,
            Cancelada
        }
    }
}
