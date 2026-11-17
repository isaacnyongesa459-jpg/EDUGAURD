if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const baseUrl = new URL('.', document.baseURI);
    const workerUrl = new URL('service-worker.js', baseUrl);
    navigator.serviceWorker.register(workerUrl.href, { scope: baseUrl.pathname }).catch(() => {});
  });
}
