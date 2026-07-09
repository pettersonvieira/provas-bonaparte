// Service Worker — Bonaparte Gestão de Provas
const CACHE = 'bonap-v6-4-fix-github';
const OFFLINE_URL = './';
const APP_SHELL = [
  './',
  'index.html',
  'manifest.json',
  'icon-192.svg',
  'icon-512.svg'
];

// URLs externas que NUNCA devem ser interceptadas
const BYPASS = [
  'firebase', 'googleapis', 'gstatic', 'firebaseio',
  'emailjs', 'fonts.googleapis', 'identitytoolkit'
];

// Instalar: cache do HTML principal
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then(cache =>
      cache.addAll(APP_SHELL).catch(() => {})
    )
  );
});

// Ativar: limpar caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first para o app, network-first para tudo externo
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Ignorar requisições externas (Firebase, EmailJS, etc.)
  if (BYPASS.some(b => url.includes(b))) return;

  // Ignorar requisições não-GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request).then(response => {
        // Só cachear respostas bem-sucedidas do mesmo domínio
        if (response.ok && url.startsWith(self.location.origin)) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, clone));
        }
        return response;
    }).catch(() => {
      return caches.match(event.request).then(cached => {
        if (cached) return cached;
      // Offline: retornar o HTML principal como fallback
      if (event.request.destination === 'document') {
        return caches.match(OFFLINE_URL);
      }
      });
    })
  );
});
