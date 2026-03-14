// Simple global toast emitter
class ToastBus {
  constructor() {
    this.listeners = new Set();
  }
  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  notify(toast) {
    this.listeners.forEach((fn) => fn(toast));
  }
  show(toast) {
    this.notify(toast);
  }
}

const bus = new ToastBus();
export function showToast(toast) {
  bus.show(toast);
}
export default bus;
