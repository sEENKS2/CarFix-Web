using System.Text;
using System.Text.Json;
using CarFix.API.DTOs.IA;

namespace CarFix.API.Services.IA;

public class GeminiIaService : IIaService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _config;

    public GeminiIaService(HttpClient httpClient, IConfiguration config)
    {
        _httpClient = httpClient;
        _config = config;
    }

    public async Task<DiagnosticoResponseDTO> GenerarPreDiagnosticoAsync(DiagnosticoRequestDTO request)
    {
        var apiKey = _config["Gemini:ApiKey"]?.Trim();
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw new InvalidOperationException("Falta configurar 'Gemini:ApiKey' en appsettings.json");
        }

        // Modelo oficial requerido por Google
        var endpoint = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key={apiKey}";

        var prompt = $@"
Eres un jefe de taller mecánico automotriz experto. Analiza la siguiente falla técnica:
Vehículo: {request.Vehiculo?.Marca} {request.Vehiculo?.Modelo} ({request.Vehiculo?.Año})
Síntomas reportados por el cliente: ""{request.Sintomas}""
Repuestos disponibles en el depósito: {JsonSerializer.Serialize(request.CatalogoRepuestos)}

Devuelve ÚNICAMENTE un objeto JSON válido con esta estructura exacta, sin texto introductorio ni formato markdown:
{{
  ""hipotesis"": [
    {{ ""falla"": ""Nombre avería"", ""probabilidad"": 85, ""justificacion"": ""Motivo técnico"" }}
  ],
  ""protocoloInspeccion"": [
    ""Paso 1 a revisar en elevador""
  ],
  ""repuestosSugeridos"": [
    {{ ""id"": 1, ""codigo"": ""P001"", ""nombre"": ""Nombre repuesto"", ""stock"": 5 }}
  ]
}}";

        var requestBody = new
        {
            contents = new[]
            {
                new
                {
                    parts = new[] { new { text = prompt } }
                }
            },
            generationConfig = new
            {
                response_mime_type = "application/json"
            }
        };

        var content = new StringContent(
            JsonSerializer.Serialize(requestBody),
            Encoding.UTF8,
            "application/json"
        );

        var response = await _httpClient.PostAsync(endpoint, content);
        var rawResponseBody = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException($"Google API devolvió {response.StatusCode}: {rawResponseBody}");
        }

        using var doc = JsonDocument.Parse(rawResponseBody);
        var partsElement = doc.RootElement
            .GetProperty("candidates")[0]
            .GetProperty("content")
            .GetProperty("parts");

        // Obtenemos el texto descartando bloques de pensamiento si existieran
        string rawText = string.Empty;
        foreach (var part in partsElement.EnumerateArray())
        {
            if (part.TryGetProperty("thought", out var isThought) && isThought.GetBoolean())
            {
                continue;
            }

            if (part.TryGetProperty("text", out var textProp))
            {
                rawText = textProp.GetString() ?? string.Empty;
                if (!string.IsNullOrWhiteSpace(rawText)) break;
            }
        }

        if (string.IsNullOrWhiteSpace(rawText))
        {
            rawText = partsElement[partsElement.GetArrayLength() - 1].GetProperty("text").GetString() ?? "{}";
        }

        // Limpieza de posibles bloques markdown
        rawText = rawText.Trim();
        if (rawText.StartsWith("```json", StringComparison.OrdinalIgnoreCase))
        {
            rawText = rawText.Substring(7);
        }
        else if (rawText.StartsWith("```"))
        {
            rawText = rawText.Substring(3);
        }
        if (rawText.EndsWith("```"))
        {
            rawText = rawText.Substring(0, rawText.Length - 3);
        }
        rawText = rawText.Trim();

        return JsonSerializer.Deserialize<DiagnosticoResponseDTO>(rawText, new JsonSerializerOptions 
        { 
            PropertyNameCaseInsensitive = true 
        }) ?? new DiagnosticoResponseDTO();
    }

    public async Task<MantenimientoPredictivoResponseDTO> CalcularMantenimientoPredictivoAsync(int vehiculoId)
    {
        return await Task.FromResult(new MantenimientoPredictivoResponseDTO
        {
            KmPromedioMes = 1350,
            Componentes = new List<ComponenteDesgasteDTO>
            {
                new() { Nombre = "Aceite Sintético y Filtro", DesgastePorcentaje = 85, UltimoCambioKm = 45000, VencimientoEstimado = "15 a 20 días" },
                new() { Nombre = "Pastillas de Freno Delanteras", DesgastePorcentaje = 60, UltimoCambioKm = 30000, VencimientoEstimado = "3 meses" },
                new() { Nombre = "Kit Correa de Distribución", DesgastePorcentaje = 35, UltimoCambioKm = 20000, VencimientoEstimado = "1 año" }
            }
        });
    }
}