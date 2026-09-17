using System.ComponentModel.DataAnnotations;

namespace Entidades.Core
{
    public class Grupo
    {
        private int id;
        private string nombre;
        private string descripcion;
        private List<Usuario> usuarios;
        private List<Permiso> permisos;

        [Key]
        public int Id { get => id; set => id = value; }

        [Required]
        [StringLength(50)]
        public string Nombre { get => nombre; set => nombre = value; }

        [StringLength(200)]
        public string Descripcion { get => descripcion; set => descripcion = value; }

        public virtual List<Usuario> Usuarios { get => usuarios ?? new List<Usuario>(); set => usuarios = value; }
        public virtual List<Permiso> Permisos { get => permisos ?? new List<Permiso>(); set => permisos = value; }
    }
}
