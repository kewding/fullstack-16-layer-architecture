type Listener = () => void;

const listeners = new Set<Listener>();

export const notificationBus = {
  subscribe(fn: Listener): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  emit(): void {
    listeners.forEach((fn) => fn());
  },
};