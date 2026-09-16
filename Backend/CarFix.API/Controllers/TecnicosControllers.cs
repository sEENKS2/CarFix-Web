using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Controladora;
using Entidades.Tickets;
using CarFix.API.DTOs;
using static Entidades.Tickets.Tecnico;

namespace CarFix.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class TecnicosController : ControllerBase
    {
        private readonly ControladoraTecnicos _gestorTecnicos = ControladoraTecnicos.Instancia;

        [HttpGet]
        public IActionResult Listar()
        {
            try
            {
                var tecnicos = _gestorTecnicos.RecuperarTecnicos();
                return Ok(tecnicos);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error al obtener técnicos: {ex.Message}");
            }
        }

        [HttpPost]
        public IActionResult Crear([FromBody] TecnicoAltaDTO dto)
        {
            try
            {
                _gestorTecnicos.AgregarTecnico(
                    dto.Nombre,
                    dto.Apellido,
                    dto.Dni,
                    dto.Correo,
                    (EnumEspecialidad)dto.Especialidad
                );
                return Ok(new { mensaje = "Técnico agregado exitosamente" });
            }
            catch (Exception ex)
            {
                return BadRequest($"Error al agregar técnico: {ex.Message}");
            }
        }

        [HttpPut("{id}")]
        public IActionResult Modificar(int id, [FromBody] TecnicoAltaDTO dto)
        {
            try
            {
                _gestorTecnicos.ModificarTecnico(
                    id,
                    dto.Nombre,
                    dto.Apellido,
                    dto.Dni,
                    dto.Correo,
                    (EnumEspecialidad)dto.Especialidad
                );
                return Ok(new { mensaje = "Técnico modificado exitosamente" });
            }
            catch (Exception ex)
            {
                return BadRequest($"Error al modificar técnico: {ex.Message}");
            }
        }

        [HttpDelete("{id}")]
        public IActionResult Eliminar(int id)
        {
            try
            {
                var resultado = _gestorTecnicos.EliminarTecnico(id);
                return Ok(new { mensaje = resultado });
            }
            catch (Exception ex)
            {
                return BadRequest($"Error al eliminar técnico: {ex.Message}");
            }
        }
    }
}