using System.ComponentModel.DataAnnotations;

namespace Entidades.Tickets
{
    public enum EnumEspecialidad { Chapista, Motorista, Electricista };
    public class Tecnico
    {
        private int id;
        private string nombre;
        private string apellido;
        private int dni;
        private string correo;
        private EnumEspecialidad especialidad;

        [Key] public int Id { get => id; set => id = value; }
        public EnumEspecialidad Especialidad { get => especialidad; set => especialidad = value; }
        public string Nombre { get => nombre; set => nombre = value; }
        public string Apellido { get => apellido; set => apellido = value; }
        public int Dni { get => dni; set => dni = value; }
        public string Correo { get => correo; set => correo = value; }
        public string NombreCompleto { get { return $"{Nombre} {Apellido}"; } }

    }
}
