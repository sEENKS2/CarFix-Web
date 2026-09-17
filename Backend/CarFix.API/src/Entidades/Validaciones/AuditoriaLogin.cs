using Entidades.Core;
using System.ComponentModel.DataAnnotations;

namespace Entidades.Validaciones
{
    public class AuditoriaLogin
    {
        [Key]
        public int Id { get; set; }
        public int UsuarioId { get; set; }
        public string NombreUsuario { get; set; }
        public DateTime FechaHora { get; set; }
        public string TipoEvento { get; set; }
        public string DireccionIP { get; set; }

        public virtual Usuario Usuario { get; set; }
    }
}