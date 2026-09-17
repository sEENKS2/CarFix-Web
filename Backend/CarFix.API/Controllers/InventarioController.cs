using CarFix.API.DTOs;
using Controladora;
using Microsoft.AspNetCore.Mvc;

namespace CarFix.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class InventarioController : ControllerBase
    {
        [HttpGet("movimientos")]
        public IActionResult ObtenerMovimientos([FromQuery] int? productoId = null)
        {
            try
            {
                var movimientos = ControladoraInventario.Instancia.RecuperarMovimientos(productoId);
                var productos = ControladoraProductos.Instancia.RecuperarProductos();

                var listado = movimientos.Select(m =>
                {
                    var prod = productos.FirstOrDefault(p => p.Id == m.ProductoId);
                    return new MovimientoStockDTO
                    {
                        Id = m.Id,
                        ProductoId = m.ProductoId,
                        NombreProducto = prod != null ? $"{prod.Codigo} - {prod.Nombre}" : $"Producto #{m.ProductoId}",
                        Fecha = m.Fecha,
                        TipoMovimiento = m.TipoMovimiento,
                        Cantidad = m.Cantidad,
                        StockAnterior = m.StockAnterior,
                        StockNuevo = m.StockNuevo,
                        MotivoReferencia = m.MotivoReferencia,
                        Usuario = m.Usuario
                    };
                }).ToList();

                return Ok(listado);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = $"Error al obtener movimientos: {ex.Message}" });
            }
        }

        [HttpGet("alertas-stock")]
        public IActionResult ObtenerAlertasStock()
        {
            try
            {
                var alertas = ControladoraInventario.Instancia.ObtenerAlertasStockCritico();
                return Ok(alertas);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = $"Error al obtener alertas: {ex.Message}" });
            }
        }

        [HttpPost("ajuste")]
        public IActionResult RegistrarAjuste([FromBody] AjusteStockAltaDTO dto)
        {
            try
            {
                string usuarioLogueado = User.Identity?.Name ?? "Admin";
                var respuesta = ControladoraInventario.Instancia.RegistrarAjusteManual(
                    dto.ProductoId,
                    dto.Cantidad,
                    dto.TipoAjuste,
                    dto.Motivo,
                    usuarioLogueado
                );

                if (respuesta.Contains("Error", StringComparison.OrdinalIgnoreCase) || 
                    respuesta.Contains("rechazada", StringComparison.OrdinalIgnoreCase) ||
                    respuesta.Contains("no encontrado", StringComparison.OrdinalIgnoreCase))
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