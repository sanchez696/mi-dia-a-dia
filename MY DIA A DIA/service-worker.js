const CACHE_NAME = "mi-dia-a-dia-pro-v1";

const FILES = [
  "index.html",
  "login.html",
  "agenda.html",
  "partes.html",
  "partes-listado.html",
  "foto-pdf.html",
  "opciones.html",
  "asistente.html",
  "css/style.css",
  "img/logo.jpg",
  "img/icon-192.png",
  "img/icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES))
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});