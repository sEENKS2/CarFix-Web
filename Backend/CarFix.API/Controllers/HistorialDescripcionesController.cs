using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Controladora;

namespace CarFix.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class HistorialDescripcionesController : ControllerBase
    {
        private readonly ControladoraHistorialDescripciones _gestor = ControladoraHistorialDescripciones.Instancia;

        [HttpGet("ticket/{ticketId}")]
        public IActionResult ObtenerPorTicket(int ticketId)
        {
            try
            {
                var historial = _gestor.ObtenerHistorialPorTicket(ticketId);
                return Ok(historial);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error al obtener historial: {ex.Message}");
            }
        }
    }
}