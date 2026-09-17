using System.ComponentModel.DataAnnotations;

namespace Entidades.Tickets
{
    public class Cliente
    {

        private int id;
        private string nombre;
        private string apellido;
        private int dni;
        private string correo;
        private int telefono;

        [Key] public int Id { get => id; set => id = value; }
        public string Nombre { get => nombre; set => nombre = value; }
        public string Apellido { get => apellido; set => apellido = value; }
        public int Dni { get => dni; set => dni = value; }
        public string Correo { get => correo; set => correo = value; }
        public int Telefono { get => telefono; set => telefono = value; }

        public string NombreCompleto { get { return $"{Nombre} {Apellido}"; } }
    }
}
