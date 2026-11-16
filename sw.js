// 오프라인에서도 열리도록 앱 파일을 캐시한다. 파일을 고치면 VERSION을 올린다.
const VERSION = 'gagyebu-v8';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon.svg'];
// 브라우저에 남아 있는 옛 파일을 쓰지 않고, 서버에 최신인지 확인한 뒤 받는다.
const NO_CACHE = { cache: 'no-cache' };

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES.map(f => new Request(f, NO_CACHE)))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 캐시를 먼저 보여 주고, 뒤에서 최신 파일을 받아 다음 실행 때 반영한다.
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  // 화면 이동 요청은 주소 뒤 ?text=... 를 떼고 처리한다.
  // 공유받은 결제 문자가 서버로 전송되지 않게 하기 위해서다.
  const req = e.request.mode === 'navigate' ? new Request(url.origin + url.pathname) : e.request;
  e.respondWith(
    caches.open(VERSION).then(async cache => {
      const hit = await cache.match(req);
      const fresh = fetch(req, NO_CACHE).then(res => {
        if (res.ok) cache.put(req, res.clone());
        return res;
      }).catch(() => hit);
      return hit || fresh;
    })
  );
});
