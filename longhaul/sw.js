// Online-only game. Avoid caching game code so hosted releases stay current.
// No fetch handler: Chrome no longer needs one to install the app, and an empty one only slows every page load
// ("Fetch event handler is recognized as no-op").
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));
