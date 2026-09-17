namespace Entidades.Tickets
{
    public class ResultadoValidacion
    {
        public bool EsValido { get; set; }
        public List<string> Errores { get; set; } = new List<string>();
        public string MensajeError { get; set; }

        public ResultadoValidacion()
        {
            EsValido = false;
            MensajeError = string.Empty;
        }

        // Constructor con parámetros
        public ResultadoValidacion(bool esValido, string mensajeError = "")
        {
            EsValido = esValido;
            MensajeError = mensajeError ?? string.Empty;
        }

        // Métodos estáticos
        public static ResultadoValidacion Exitoso()
        {
            return new ResultadoValidacion(true, "OK");
        }

        public static ResultadoValidacion ConError(string mensaje)
        {
            return new ResultadoValidacion(false, mensaje);
        }

        // Operadores implícitos
        public static implicit operator bool(ResultadoValidacion resultado)
        {
            return resultado.EsValido;
        }

        public static implicit operator string(ResultadoValidacion resultado)
        {
            return resultado.MensajeError;
        }

        public override string ToString()
        {
            return EsValido ? "Válido" : $"Error: {MensajeError}";
        }
    }
}
