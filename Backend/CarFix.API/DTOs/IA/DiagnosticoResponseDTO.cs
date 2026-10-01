namespace CarFix.API.DTOs.IA;

public class DiagnosticoResponseDTO
{
    public List<HipotesisIaDTO> Hipotesis { get; set; } = new();
    public List<string> ProtocoloInspeccion { get; set; } = new();
    public List<RepuestoSugeridoIaDTO> RepuestosSugeridos { get; set; } = new();
    
    // Nuevos campos
    public List<string> RepuestosFaltantes { get; set; } = new();
    public decimal EstimacionHorasManoObra { get; set; }
}

public class HipotesisIaDTO
{
    public string Falla { get; set; } = string.Empty;
    public int Probabilidad { get; set; }
    public string Justificacion { get; set; } = string.Empty;
}

public class RepuestoSugeridoIaDTO
{
    public int Id { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public int Stock { get; set; }
}