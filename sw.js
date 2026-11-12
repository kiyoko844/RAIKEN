/* RAIKEN service worker: кэш оболочки для работы офлайн.
   Эмблемы (assets/) кэшируются по мере открытия. Данные хранятся в браузере и сюда не попадают. */
const V = "raiken-v12";
const CORE = [
 "css/base.css",
 "css/fonts.css",
 "css/frames.css",
 "css/ice.css",
 "css/look.css",
 "css/themes.css",
 "css/variables.css",
 "fonts/exo-2-cyrillic-600-normal.woff2",
 "fonts/exo-2-cyrillic-700-normal.woff2",
 "fonts/exo-2-cyrillic-800-normal.woff2",
 "fonts/exo-2-latin-600-normal.woff2",
 "fonts/exo-2-latin-700-normal.woff2",
 "fonts/exo-2-latin-800-normal.woff2",
 "fonts/ibm-plex-mono-cyrillic-400-normal.woff2",
 "fonts/ibm-plex-mono-cyrillic-500-normal.woff2",
 "fonts/ibm-plex-mono-cyrillic-600-normal.woff2",
 "fonts/ibm-plex-mono-latin-400-normal.woff2",
 "fonts/ibm-plex-mono-latin-500-normal.woff2",
 "fonts/ibm-plex-mono-latin-600-normal.woff2",
 "fonts/inter-tight-cyrillic-400-normal.woff2",
 "fonts/inter-tight-cyrillic-500-normal.woff2",
 "fonts/inter-tight-cyrillic-600-normal.woff2",
 "fonts/inter-tight-cyrillic-700-normal.woff2",
 "fonts/inter-tight-latin-400-normal.woff2",
 "fonts/inter-tight-latin-500-normal.woff2",
 "fonts/inter-tight-latin-600-normal.woff2",
 "fonts/inter-tight-latin-700-normal.woff2",
 "icons/app-192.png",
 "icons/app-512.png",
 "icons/interface/favicon.svg",
 "icons/interface/icons.js",
 "index.html",
 "js/boot.js",
 "js/core/config.js",
 "js/core/engine.js",
 "js/core/ranks.js",
 "js/core/scheduler.js",
 "js/core/state.js",
 "js/core/utils.js",
 "js/data/awards-data.js",
 "js/features/awards.js",
 "js/features/backup.js",
 "js/features/calendar.js",
 "js/features/discipline.js",
 "js/features/goals.js",
 "js/features/insights.js",
 "js/features/profile.js",
 "js/features/quests.js",
 "js/features/ranks.js",
 "js/features/review.js",
 "js/features/rituals.js",
 "js/features/tasks.js",
 "js/ui/ambient.js",
 "js/ui/assets.js",
 "js/ui/events.js",
 "js/ui/frames.js",
 "js/ui/fx.js",
 "js/ui/ice.js",
 "js/ui/modals.js",
 "js/ui/render.js",
 "js/ui/themes.js",
 "js/vendor/gsap.min.js",
 "manifest.webmanifest"
];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(V).then((c) => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
	const r = e.request;
	if (r.method !== "GET" || new URL(r.url).origin !== location.origin) return;
	e.respondWith(
		fetch(r).then((res) => { if (res.ok) { const c = res.clone(); caches.open(V).then((ch) => ch.put(r, c)); } return res; })
			.catch(() => caches.match(r).then((m) => m || caches.match("index.html")))
	);
});
