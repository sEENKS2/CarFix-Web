using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Entidades.Tickets
{
    public enum EnumEstados { Asignado, EnProceso, Finalizado }
    public class Ticket
    {
        private int id;
        private string descripcion;
        private DateTime fechaCreacion;
        private EnumEstados estado;
        private Cliente cliente;
        private Vehiculo vehiculo;
        private Tecnico tecnico;

        public EnumEstados Estado { get => estado; set => estado = value; }
        [Key] public int Id { get => id; set => id = value; }
        public string Descripcion { get => descripcion; set => descripcion = value; }
        public DateTime FechaCreacion { get => fechaCreacion; set => fechaCreacion = value; }
        public Cliente Cliente { get => cliente; set => cliente = value; }
        public Vehiculo Vehiculo { get => vehiculo; set => vehiculo = value; }
        public Tecnico Tecnico { get => tecnico; set => tecnico = value; }

        public int ClienteId { get; set; }
        [ForeignKey("ClienteId")]

        public int VehiculoId { get; set; }
        [ForeignKey("VehiculoId")]

        public int TecnicoId { get; set; }
        [ForeignKey("TecnicoId")]

        public string NombreCompletoCliente { get { return Cliente != null ? Cliente.NombreCompleto : string.Empty; } }
        public string NombreCompletoTecnico { get { return Tecnico != null ? Tecnico.NombreCompleto : string.Empty; } }
        public string NombreCompletoVehiculo { get { return Vehiculo != null ? Vehiculo.NombreCompleto : string.Empty; } }
    }
}
