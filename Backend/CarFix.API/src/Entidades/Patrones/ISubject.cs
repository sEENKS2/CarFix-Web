namespace Entidades.Patrones
{
    public interface ISubject
    {
        void AddObserver(IObserver observer);
        void RemoveObserver(IObserver observer);
        void NotifyObservers(string mensaje, object datos);
    }
}
