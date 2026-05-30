export function registerBackgroundErrorHandlers(): void {
  self.addEventListener('unhandledrejection', (event) => {
    console.debug('[Background] Unhandled promise rejection:', event.reason);
    event.preventDefault();
  });

  self.addEventListener('error', (event) => {
    console.debug('[Background] Uncaught error:', event.error || event.message);
    event.preventDefault();
  });
}
