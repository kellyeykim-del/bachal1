// 바챌 1기 서비스워커 — 앱 화면과 이미지를 저장해 오프라인에서도 열리게 합니다.
// tools/update-media.ps1 을 실행하면 VERSION 이 자동으로 올라갑니다.
const VERSION = 'bachal1-202610221509';
const SHELL = [
  './',
  'index.html',
  'css/style.css',
  'js/content.js',
  'js/media.js',
  'js/app.js',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(VERSION)
      .then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // 유튜브 등 외부는 그대로
  if (/\.(mp4|mov|m4v|webm)$/i.test(url.pathname)) return; // 영상은 스트리밍

  // 앱 코드: 네트워크 우선(업데이트 반영), 실패하면 캐시
  if (req.mode === 'navigate' || /\.(js|css|webmanifest)$/.test(url.pathname)) {
    e.respondWith(
      fetch(req, { cache: 'no-cache' })
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('index.html')))
    );
    return;
  }

  // 이미지 등: 캐시 우선
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(req, copy));
      }
      return res;
    }))
  );
});
