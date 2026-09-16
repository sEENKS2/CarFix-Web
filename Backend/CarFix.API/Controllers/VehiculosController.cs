using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Controladora;
using CarFix.API.DTOs;

namespace CarFix.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class VehiculosController : ControllerBase
    {
        private readonly ControladoraVehiculos _gestor = ControladoraVehiculos.Instancia;

        [HttpGet]
        public IActionResult Listar()
        {
            try
            {
                var vehiculos = _gestor.RecuperarVehiculos();
                return Ok(vehiculos);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error al recuperar vehículos: {ex.Message}");
            }
        }

        [HttpPost]
        public IActionResult Crear([FromBody] VehiculoDTO dto)
        {
            try
            {
                _gestor.AgregarVehiculo(dto.ClienteId, dto.Marca, dto.Modelo, dto.Año, dto.Dominio.ToUpper());
                return Ok(new { mensaje = "Vehículo registrado con éxito" });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.InnerException?.Message ?? ex.Message);
            }
        }

        [HttpPut("{id}")]
        public IActionResult Modificar(int id, [FromBody] VehiculoDTO dto)
        {
            try
            {
                _gestor.ModificarVehiculo(id, dto.ClienteId, dto.Marca, dto.Modelo, dto.Año, dto.Dominio.ToUpper());
                return Ok(new { mensaje = "Vehículo modificado con éxito" });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.InnerException?.Message ?? ex.Message);
            }
        }

        [HttpDelete("{id}")]
        public IActionResult Eliminar(int id)
        {
            try
            {
                var msg = _gestor.EliminarVehiculo(id);
                return Ok(new { mensaje = msg });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}