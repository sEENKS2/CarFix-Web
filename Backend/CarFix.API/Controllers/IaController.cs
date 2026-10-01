using Microsoft.AspNetCore.Mvc;
using CarFix.API.DTOs.IA;
using CarFix.API.Services.IA;

namespace CarFix.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class IaController : ControllerBase
{
    private readonly IIaService _iaService;

    public IaController(IIaService iaService)
    {
        _iaService = iaService;
    }

    [HttpPost("diagnostico")]
    public async Task<ActionResult<DiagnosticoResponseDTO>> PostDiagnostico([FromBody] DiagnosticoRequestDTO request)
    {
        try
        {
            var resultado = await _iaService.GenerarPreDiagnosticoAsync(request);
            return Ok(resultado);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { mensaje = "Error al procesar el diagnóstico con IA", detalle = ex.Message });
        }
    }

    [HttpGet("mantenimiento-predictivo/{vehiculoId:int}")]
    public async Task<ActionResult<MantenimientoPredictivoResponseDTO>> GetMantenimientoPredictivo(int vehiculoId)
    {
        try
        {
            var resultado = await _iaService.CalcularMantenimientoPredictivoAsync(vehiculoId);
            return Ok(resultado);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { mensaje = "Error al estimar mantenimiento predictivo", detalle = ex.Message });
        }
    }
}