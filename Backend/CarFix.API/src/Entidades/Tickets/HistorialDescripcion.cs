using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Entidades.Tickets
{
    public class HistorialDescripcion
    {
        [Key]
        public int Id { get; set; }
        public int TicketId { get; set; }
        public string DescripcionAnterior { get; set; }
        public string DescripcionNueva { get; set; }
        public DateTime FechaCambio { get; set; }
        public string Usuario { get; set; }
        public string Motivo { get; set; } // Opcional: razón del cambio

        [ForeignKey("TicketId")]
        public Ticket Ticket { get; set; }
    }
}