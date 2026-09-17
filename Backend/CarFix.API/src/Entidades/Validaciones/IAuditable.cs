namespace Entidades.Validaciones
{
    public interface IAuditable
    {
        int Id { get; set; }
        string ObtenerDescripcionCompleta();
        string ObtenerIdentificador();
    }
}