// The app previously registered public/service-worker.js, which was a
// copy-pasted tutorial file: CACHE_NAME was "pwa-task-manager-v2", urlsToCache
// was empty, and nothing was ever written to the cache -- yet its fetch handler
// called respondWith() on *every* request, adding a guaranteed cache miss to
// each one. It provided no offline capability and had no skipWaiting/claim, so
// any cached asset would have been served until every tab was closed.
//
// It has been deleted. This module now only tears down installations that are
// still registered in returning visitors' browsers -- without this, that worker
// would keep intercepting their requests indefinitely.

export async function unregisterServiceWorkers(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((r) => r.unregister()));

    // Drop the caches it may have created in earlier versions.
    if ("caches" in window) {
      const names = await caches.keys();
      await Promise.all(names.map((name) => caches.delete(name)));
    }
  } catch (error) {
    console.error("Failed to unregister service worker:", error);
  }
}
