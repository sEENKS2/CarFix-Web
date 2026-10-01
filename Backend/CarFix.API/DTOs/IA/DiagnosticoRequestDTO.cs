namespace CarFix.API.DTOs.IA;

public class DiagnosticoRequestDTO
{
    public string Sintomas { get; set; } = string.Empty;
    public VehiculoIaDto? Vehiculo { get; set; }
    public List<RepuestoIaDto> CatalogoRepuestos { get; set; } = new();
}

public class VehiculoIaDto
{
    public string Marca { get; set; } = string.Empty;
    public string Modelo { get; set; } = string.Empty;
    public int? Año { get; set; }
    public int? Kilometraje { get; set; }
}

public class RepuestoIaDto
{
    public int Id { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string? Categoria { get; set; }
    public int Stock { get; set; }
}