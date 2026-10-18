// Radio Maman : garde l'appli disponible sans internet.
// Avec internet, on prend toujours la dernière version ; sans, on sert la copie gardée.
var CACHE = 'radio-maman-v2';
var SHELL = ['./', './index.html', './icon-180.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  var isPage = req.mode === 'navigate' || (url.origin === location.origin && /\/(index\.html)?$/.test(url.pathname));
  var isFont = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  var isIcon = url.origin === location.origin && /icon-180\.png$/.test(url.pathname);
  if (isPage) {
    // D'abord le réseau (mise à jour), sinon la copie
    e.respondWith(fetch(req).then(function (res) {
      var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put('./index.html', copy); });
      return res;
    }).catch(function () { return caches.match('./index.html'); }));
  } else if (isFont || isIcon) {
    e.respondWith(caches.match(req).then(function (hit) {
      return hit || fetch(req).then(function (res) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); return res; });
    }));
  }
});
