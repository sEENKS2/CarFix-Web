using CarFix.API.DTOs.IA;

namespace CarFix.API.Services.IA;

public interface IIaService
{
    Task<DiagnosticoResponseDTO> GenerarPreDiagnosticoAsync(DiagnosticoRequestDTO request);
    Task<MantenimientoPredictivoResponseDTO> CalcularMantenimientoPredictivoAsync(int vehiculoId);
}