using System.ComponentModel.DataAnnotations;

namespace Entidades.Core
{
    public class Permiso
    {
        private int id;
        private string nombre;
        private string descripcion;
        private string modulo;
        private List<Grupo> grupos;

        [Key]
        public int Id { get => id; set => id = value; }

        [Required]
        [StringLength(50)]
        public string Nombre { get => nombre; set => nombre = value; }

        [StringLength(200)]
        public string Descripcion { get => descripcion; set => descripcion = value; }

        [StringLength(50)]
        public string Modulo { get => modulo; set => modulo = value; }

        public virtual List<Grupo> Grupos { get => grupos ?? new List<Grupo>(); set => grupos = value; }
    }
}