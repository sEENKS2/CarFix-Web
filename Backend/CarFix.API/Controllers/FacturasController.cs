using CarFix.API.DTOs;
using Controladora;
using Entidades.Facturacion;
using Microsoft.AspNetCore.Mvc;

namespace CarFix.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FacturasController : ControllerBase
    {
        [HttpGet]
        public IActionResult ObtenerFacturas()
        {
            try
            {
                var facturas = ControladoraFacturas.Instancia.RecuperarFacturas();
                return Ok(facturas);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = $"Error al recuperar facturas: {ex.Message}" });
            }
        }

        [HttpGet("{id}")]
        public IActionResult ObtenerFacturaPorId(int id)
        {
            try
            {
                var factura = ControladoraFacturas.Instancia.ObtenerFacturaPorId(id);
                if (factura == null)
                    return NotFound(new { mensaje = $"Factura #{id} no encontrada." });

                return Ok(factura);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = $"Error: {ex.Message}" });
            }
        }

        [HttpGet("ticket/{ticketId}")]
        public IActionResult ObtenerFacturaPorTicket(int ticketId)
        {
            try
            {
                var factura = ControladoraFacturas.Instancia.ObtenerFacturaPorTicket(ticketId);
                if (factura == null)
                    return NotFound(new { mensaje = $"No existe una factura activa para el ticket #{ticketId}." });

                return Ok(factura);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = $"Error: {ex.Message}" });
            }
        }

        [HttpGet("cliente/{clienteId}")]
        public IActionResult ObtenerFacturasPorCliente(int clienteId)
        {
            try
            {
                var facturas = ControladoraFacturas.Instancia.RecuperarFacturasPorCliente(clienteId);
                return Ok(facturas);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = $"Error: {ex.Message}" });
            }
        }

        [HttpPost]
        public IActionResult CrearFactura([FromBody] FacturaAltaDTO dto)
        {
            try
            {
                var detalles = dto.Detalles.Select(d => new DetalleFactura
                {
                    Tipo = d.Tipo,
                    ProductoId = d.ProductoId,
                    Descripcion = d.Descripcion,
                    Cantidad = d.Cantidad,
                    PrecioUnitario = d.PrecioUnitario
                }).ToList();

                var respuesta = ControladoraFacturas.Instancia.AgregarFactura(
                    dto.TicketId,
                    dto.ClienteId,
                    dto.Descuento,
                    dto.Observaciones,
                    detalles
                );

                if (respuesta.Contains("error", StringComparison.OrdinalIgnoreCase) || 
                    respuesta.Contains("debe contener", StringComparison.OrdinalIgnoreCase) ||
                    respuesta.Contains("ya cuenta con", StringComparison.OrdinalIgnoreCase))
                {
                    return BadRequest(new { mensaje = respuesta });
                }

                return Ok(new { mensaje = respuesta });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = $"Error interno: {ex.Message}" });
            }
        }

        [HttpPost("{id}/pagos")]
        public IActionResult RegistrarPago(int id, [FromBody] PagoAltaDTO dto)
        {
            try
            {
                var respuesta = ControladoraFacturas.Instancia.RegistrarPago(
                    id,
                    dto.Monto,
                    dto.MetodoPago,
                    dto.ReferenciaComprobante
                );

                if (respuesta.Contains("error", StringComparison.OrdinalIgnoreCase) || 
                    respuesta.Contains("excede", StringComparison.OrdinalIgnoreCase) ||
                    respuesta.Contains("No se encontró", StringComparison.OrdinalIgnoreCase) ||
                    respuesta.Contains("totalmente saldada", StringComparison.OrdinalIgnoreCase))
                {
                    return BadRequest(new { mensaje = respuesta });
                }

                return Ok(new { mensaje = respuesta });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = $"Error interno: {ex.Message}" });
            }
        }

        [HttpPut("{id}/anular")]
        public IActionResult AnularFactura(int id, [FromBody] AnularFacturaDTO dto)
        {
            try
            {
                var respuesta = ControladoraFacturas.Instancia.AnularFactura(id, dto.Motivo);

                if (respuesta.Contains("error", StringComparison.OrdinalIgnoreCase) || 
                    respuesta.Contains("No se", StringComparison.OrdinalIgnoreCase))
                {
                    return BadRequest(new { mensaje = respuesta });
                }

                return Ok(new { mensaje = respuesta });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = $"Error interno: {ex.Message}" });
            }
        }
    }
}