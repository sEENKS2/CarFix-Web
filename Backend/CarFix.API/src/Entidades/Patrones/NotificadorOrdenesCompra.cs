namespace Entidades.Patrones
{
    public class NotificadorOrdenesCompra : ISubject
    {
        private List<IObserver> observers = new List<IObserver>();
        private static NotificadorOrdenesCompra instancia;

        public static NotificadorOrdenesCompra Instancia
        {
            get
            {
                if (instancia == null)
                    instancia = new NotificadorOrdenesCompra();
                return instancia;
            }
        }

        public void AddObserver(IObserver observer)
        {
            observers.Add(observer);
        }

        public void RemoveObserver(IObserver observer)
        {
            observers.Remove(observer);
        }

        public void NotifyObservers(string mensaje, object datos)
        {
            foreach (var observer in observers)
            {
                observer.Update(mensaje, datos);
            }
        }
    }
}
