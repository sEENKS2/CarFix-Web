namespace CarFix.API.DTOs.IA;

public class MantenimientoPredictivoResponseDTO
{
    public int KmPromedioMes { get; set; }
    public List<ComponenteDesgasteDTO> Componentes { get; set; } = new();
}

public class ComponenteDesgasteDto
{
    public string Nombre { get; set; } = string.Empty;
    public int DesgastePorcentaje { get; set; }
    public int? UltimoCambioKm { get; set; }
    public string VencimientoEstimado { get; set; } = string.Empty;
}