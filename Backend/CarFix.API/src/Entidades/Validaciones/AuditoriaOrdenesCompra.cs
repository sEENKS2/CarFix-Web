using Entidades.Core;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Entidades.Validaciones
{
    public class AuditoriaOrdenesCompra
    {
        [Key]
        public int Id { get; set; }
        public int OrdenCompraId { get; set; }
        public string Accion { get; set; }
        public string Campo { get; set; }
        public string ValorAnterior { get; set; }
        public string ValorNuevo { get; set; }
        public DateTime FechaHora { get; set; }
        public string Observaciones { get; set; }

        public int UsuarioId { get; set; }
        [ForeignKey("UsuarioId")]
        public Usuario Usuario { get; set; }

        public string DetalleCompleto => $"{Accion}: {Campo} cambió de '{ValorAnterior}' a '{ValorNuevo}'";
    }
}