using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Entidades.Tickets
{
    public class Vehiculo
    {
        private int id;
        private string marca;
        private string modelo;
        private int año;
        private string dominio;
        private Cliente dueño;

        [Key] public int Id { get => id; set => id = value; }
        public string Marca { get => marca; set => marca = value; }
        public string Modelo { get => modelo; set => modelo = value; }
        public int Año { get => año; set => año = value; }
        public string Dominio { get => dominio; set => dominio = value; }
        public Cliente Dueño { get => dueño; set => dueño = value; }
        public int ClienteId { get; set; }
        [ForeignKey("ClienteId")]
        public string NombreCompleto { get { return $"{Marca} {Modelo}"; } }
        public string NombreCompletoDueño { get { return Dueño != null ? Dueño.NombreCompleto : string.Empty; } }
    }
}
