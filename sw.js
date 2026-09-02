/* Service worker do app da Adega Noruega.
   Cuida só do próprio aplicativo (o arquivo index.html) para funcionar offline
   e para o Chrome/Android aceitar instalar como app de verdade (não só atalho).
   Nunca mexe em pedidos para o Supabase — esses continuam indo direto pra internet. */

const CACHE = "adega-noruega-v1";
const APP_SHELL = self.location.href.replace("sw.js", "index.html");

self.addEventListener("install", function (event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.add(APP_SHELL);
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (chaves) {
      return Promise.all(
        chaves.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function (event) {
  var url = new URL(event.request.url);

  /* só cuida do próprio site, e só de leitura (GET). Tudo que for para o Supabase
     (ou qualquer outro endereço) passa direto, sem passar pelo cache. */
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then(function (resp) {
        var copia = resp.clone();
        caches.open(CACHE).then(function (cache) { cache.put(event.request, copia); });
        return resp;
      })
      .catch(function () {
        return caches.match(event.request).then(function (r) { return r || caches.match(APP_SHELL); });
      })
  );
});
