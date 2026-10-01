using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using CarFix.API.DTOs.IA;
using Modelo;
using System.Globalization;

namespace CarFix.API.Services.IA;

public class OllamaIaService : IIaService
{
    private readonly HttpClient _httpClient;

    public OllamaIaService(HttpClient httpClient)
    {
        _httpClient = httpClient;
        _httpClient.BaseAddress = new Uri("http://localhost:11434/");
    }

    public async Task<DiagnosticoResponseDTO> GenerarPreDiagnosticoAsync(DiagnosticoRequestDTO request)
{
    var system = "Eres un jefe de taller mecánico con 20 años de experiencia en diagnóstico automotriz. " +
                 "Respondes solo en español y solo con JSON válido.";

    var prompt = $@"
Vehículo: {request.Vehiculo?.Marca} {request.Vehiculo?.Modelo} ({request.Vehiculo?.Año})
Síntoma reportado: ""{request.Sintomas}""

Instrucciones:
- Da 3 hipótesis, ordenadas de más a menos probable. Prioriza las causas más comunes en un taller antes que las raras.
- probabilidad: entero de 0 a 100. La suma de las tres no debe superar 100.
- justificacion: 1 o 2 frases con el mecanismo técnico concreto (qué pieza falla y por qué produce el síntoma). Sin frases genéricas.
- protocoloInspeccion: 3 a 5 pasos concretos, de lo más simple a lo más complejo.
- repuestosNecesarios: nombres genéricos de las piezas que probablemente haya que reemplazar. No inventes piezas.
- estimacionHorasManoObra: número de horas de taller.

Devuelve ÚNICAMENTE este JSON:
{{
  ""hipotesis"": [
    {{ ""falla"": ""<avería>"", ""probabilidad"": <entero>, ""justificacion"": ""<explicación>"" }}
  ],
  ""protocoloInspeccion"": [""<paso>""],
  ""repuestosNecesarios"": [""<pieza>""],
  ""estimacionHorasManoObra"": <número>
}}";

    var requestBody = new
    {
        model = "llama3:8b",   // o "llama3.1:8b"
        system,
        prompt,
        stream = false,
        format = "json",
        options = new { temperature = 0.2, top_p = 0.9, num_ctx = 4096 }
    };

    var response = await _httpClient.PostAsync("api/generate",
        new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json"));
    response.EnsureSuccessStatusCode();

    using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
    var rawText = doc.RootElement.GetProperty("response").GetString()!;

    var opts = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
    var resultado = JsonSerializer.Deserialize<DiagnosticoResponseDTO>(rawText, opts) ?? new DiagnosticoResponseDTO();

    // Cruce con el depósito, en código
    var necesarios = new List<string>();
    using (var raw = JsonDocument.Parse(rawText))
    {
        if (raw.RootElement.TryGetProperty("repuestosNecesarios", out var arr))
            necesarios = arr.EnumerateArray().Select(x => x.GetString() ?? "").Where(x => x != "").ToList();
    }

    var sugeridos = new List<string>();   // ajustá el tipo al de tu DTO
    var faltantes = new List<string>();

    foreach (var pieza in necesarios)
    {
        var match = request.CatalogoRepuestos
            .FirstOrDefault(r => Coincide(pieza, r.Nombre) && r.Stock > 0);   // ajustá Nombre/Stock a tu DTO

        if (match != null) sugeridos.Add(match.Nombre);
        else faltantes.Add(pieza);
    }

    // resultado.RepuestosSugeridos = ...;  resultado.RepuestosFaltantes = faltantes;
    return resultado;
}

private static string Norm(string s) =>
    new string(s.Normalize(NormalizationForm.FormD)
        .Where(c => CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
        .ToArray()).ToLowerInvariant();

// Todas las palabras (>3 letras) del nombre del catálogo deben aparecer en la pieza pedida
private static bool Coincide(string necesaria, string nombreCatalogo)
{
    var n = Norm(necesaria);
    var tokens = Norm(nombreCatalogo).Split(' ', StringSplitOptions.RemoveEmptyEntries).Where(t => t.Length > 3);
    return tokens.Any() && tokens.All(n.Contains);
}

    public async Task<MantenimientoPredictivoResponseDTO> CalcularMantenimientoPredictivoAsync(int vehiculoId)
    {
        // Instancia directa usando el constructor por defecto de Context
        using var context = new Context();

        // 1. Obtener historial de tickets del auto ordenados por fecha
        var ticketsVehiculo = await context.Tickets
            .AsNoTracking()
            .Where(t => t.VehiculoId == vehiculoId)
            .OrderByDescending(t => t.FechaCreacion)
            .ToListAsync();

        var vehiculo = await context.Vehiculos
            .AsNoTracking()
            .FirstOrDefaultAsync(v => v.Id == vehiculoId);

        int kmActual = vehiculo?.Kilometraje ?? 65000;
        int kmPromedioMensual = 1200;

        if (ticketsVehiculo.Count >= 2)
        {
            var primerTicket = ticketsVehiculo.Last();
            var ultimoTicket = ticketsVehiculo.First();
            var mesesDiferencia = Math.Max(1, (ultimoTicket.FechaCreacion - primerTicket.FechaCreacion).TotalDays / 30.0);
            
            kmPromedioMensual = Math.Clamp((int)(15000 / 12), 800, 3000);
        }

        // 2. Analizar antecedentes para calcular desgaste
        var historialTexto = string.Join(" ", ticketsVehiculo.Select(t => t.Descripcion?.ToLower() ?? ""));
        var componentes = new List<ComponenteDesgasteDTO>();

        // Aceite y Filtro
        int kmUltimoAceite = historialTexto.Contains("aceite") ? Math.Max(0, kmActual - 8500) : kmActual - 9000;
        int kmRecorridosAceite = kmActual - kmUltimoAceite;
        int desgasteAceite = Math.Clamp((kmRecorridosAceite * 100) / 10000, 5, 100);
        int kmRestantesAceite = Math.Max(0, 10000 - kmRecorridosAceite);
        double mesesRestantesAceite = (double)kmRestantesAceite / kmPromedioMensual;

        componentes.Add(new ComponenteDesgasteDTO
        {
            Nombre = "Aceite de Motor y Filtro",
            DesgastePorcentaje = desgasteAceite,
            UltimoCambioKm = kmUltimoAceite,
            VencimientoEstimado = mesesRestantesAceite <= 0.7 ? "Inminente (menos de 20 días)" : $"En aprox. {Math.Round(mesesRestantesAceite, 1)} meses"
        });

        // Pastillas de freno
        int kmUltimoFreno = historialTexto.Contains("freno") || historialTexto.Contains("pastilla") ? Math.Max(0, kmActual - 20000) : kmActual - 28000;
        int kmRecorridosFrenos = kmActual - kmUltimoFreno;
        int desgasteFrenos = Math.Clamp((kmRecorridosFrenos * 100) / 35000, 10, 100);
        int kmRestantesFrenos = Math.Max(0, 35000 - kmRecorridosFrenos);
        double mesesRestantesFrenos = (double)kmRestantesFrenos / kmPromedioMensual;

        componentes.Add(new ComponenteDesgasteDTO
        {
            Nombre = "Pastillas de Freno Delanteras",
            DesgastePorcentaje = desgasteFrenos,
            UltimoCambioKm = kmUltimoFreno,
            VencimientoEstimado = mesesRestantesFrenos <= 1.0 ? "Revisar en este servicio" : $"En aprox. {Math.Round(mesesRestantesFrenos, 1)} meses"
        });

        // Correa de distribución
        int kmUltimaCorrea = historialTexto.Contains("correa") || historialTexto.Contains("distribucion") ? Math.Max(0, kmActual - 25000) : kmActual - 45000;
        int kmRecorridosCorrea = kmActual - kmUltimaCorrea;
        int desgasteCorrea = Math.Clamp((kmRecorridosCorrea * 100) / 60000, 10, 100);
        int kmRestantesCorrea = Math.Max(0, 60000 - kmRecorridosCorrea);
        double mesesRestantesCorrea = (double)kmRestantesCorrea / kmPromedioMensual;

        componentes.Add(new ComponenteDesgasteDTO
        {
            Nombre = "Kit Correa de Distribución y Bomba de Agua",
            DesgastePorcentaje = desgasteCorrea,
            UltimoCambioKm = kmUltimaCorrea,
            VencimientoEstimado = mesesRestantesCorrea <= 2.0 ? "Próximo a cambio crítico" : $"En aprox. {Math.Round(mesesRestantesCorrea, 1)} meses"
        });

        return new MantenimientoPredictivoResponseDTO
        {
            KmPromedioMes = kmPromedioMensual,
            Componentes = componentes
        };
    }
}