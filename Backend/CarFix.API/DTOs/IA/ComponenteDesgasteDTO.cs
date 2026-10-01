namespace CarFix.API.DTOs.IA;

public class ComponenteDesgasteDTO
{
    public string Nombre { get; set; } = string.Empty;
    public int DesgastePorcentaje { get; set; }
    public int? UltimoCambioKm { get; set; }
    public string VencimientoEstimado { get; set; } = string.Empty;
}