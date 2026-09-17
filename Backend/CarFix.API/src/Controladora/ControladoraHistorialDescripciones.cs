using Entidades.Tickets;
using Modelo;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Controladora
{
    public class ControladoraHistorialDescripciones
    {
        private Context context;
        private static ControladoraHistorialDescripciones instancia;

        public static ControladoraHistorialDescripciones Instancia
        {
            get
            {
                if (instancia == null)
                    instancia = new ControladoraHistorialDescripciones();
                return instancia;
            }
        }

        private ControladoraHistorialDescripciones()
        {
            context = new Context();
        }

        public List<HistorialDescripcion> ObtenerHistorialPorTicket(int ticketId)
        {
            return context.HistorialesDescripciones
                .Where(h => h.TicketId == ticketId)
                .OrderByDescending(h => h.FechaCambio)
                .ToList();
        }

        public void AgregarHistorial(int ticketId, string descripcionAnterior,
                                   string descripcionNueva, string motivo = "")
        {
            var historial = new HistorialDescripcion
            {
                TicketId = ticketId,
                DescripcionAnterior = descripcionAnterior,
                DescripcionNueva = descripcionNueva,
                FechaCambio = DateTime.Now,
                Usuario = ControladoraSeguridad.Instancia.UsuarioActual?.NombreUsuario ?? "Sistema",
                Motivo = motivo
            };

            context.HistorialesDescripciones.Add(historial);
            context.SaveChanges();
        }

        public List<HistorialDescripcion> ObtenerHistorialPorUsuario(string usuario,
                                                                    DateTime? fechaDesde = null,
                                                                    DateTime? fechaHasta = null)
        {
            var query = context.HistorialesDescripciones
                .Where(h => h.Usuario == usuario);

            if (fechaDesde.HasValue)
                query = query.Where(h => h.FechaCambio >= fechaDesde.Value);

            if (fechaHasta.HasValue)
                query = query.Where(h => h.FechaCambio <= fechaHasta.Value);

            return query.OrderByDescending(h => h.FechaCambio).ToList();
        }
    }
}
