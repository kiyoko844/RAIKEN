"use strict";
/* RAIKEN · ICE layer
   Рамки аватара, хранение картинок (IndexedDB), точечное обновление DOM,
   появления/свечение, журнал ошибок. Работает независимо от app.js и
   не меняет формат сохранения raiken.v1. */
(function () {
	const root = document.documentElement;
	const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
	root.classList.add("rv-on");

	/* ---------- Журнал ошибок ---------- */
	const ERRLOG = [];
	function logErr(e, where) {
		try {
			const msg = e && e.message ? e.message : String(e);
			ERRLOG.push({
				t: Date.now(),
				where: where || "",
				msg: msg.slice(0, 300),
			});
			if (ERRLOG.length > 40) ERRLOG.shift();
			if (window.console) console.warn("[RAIKEN]", where || "", e);
		} catch (_) {}
	}
	addEventListener("error", (ev) => logErr(ev.error || ev.message, "window"));
	addEventListener("unhandledrejection", (ev) => logErr(ev.reason, "promise"));

	/* ---------- Картинки: IndexedDB + blob-URL ---------- */
	const IMG_KEYS = ["banner", "avatar"];
	const IDB = { db: null, state: "opening" }; // opening | ok | fail
	const pending = { banner: false, avatar: false };
	const saved = { banner: null, avatar: null };
	let hydrated = false;

	function openDb() {
		return new Promise((res) => {
			try {
				if (!window.indexedDB) return res(null);
				const rq = indexedDB.open("raiken-media", 1);
				rq.onupgradeneeded = () => rq.result.createObjectStore("img");
				rq.onsuccess = () => res(rq.result);
				rq.onerror = () => res(null);
				rq.onblocked = () => res(null);
			} catch (e) {
				res(null);
			}
		});
	}
	function tx(mode, fn) {
		return new Promise((res) => {
			try {
				const t = IDB.db.transaction("img", mode);
				const st = t.objectStore("img");
				const rq = fn(st);
				t.oncomplete = () => res(rq ? rq.result : true);
				t.onerror = t.onabort = () => res(undefined);
			} catch (e) {
				logErr(e, "idb");
				res(undefined);
			}
		});
	}
	const idbGet = (k) => tx("readonly", (s) => s.get(k));
	const idbPut = (k, v) => tx("readwrite", (s) => s.put(v, k));
	const idbDel = (k) => tx("readwrite", (s) => s.delete(k));

	// Вызывается из load(): отмечает, что картинки лежат в IndexedDB.
	function mark(o) {
		IMG_KEYS.forEach((k) => {
			if (o[k] === "@idb") {
				pending[k] = true;
				o[k] = "";
			}
		});
	}
	// Сериализация состояния без тяжёлых картинок.
	function serialize(S) {
		const ok = IDB.state === "ok";
		return JSON.stringify(S, function (k, v) {
			if (this !== S || (k !== "banner" && k !== "avatar")) return v;
			if (pending[k] && !hydrated) return "@idb";
			if (!ok) return v;
			if (typeof v === "string" && v.startsWith("data:image/")) {
				if (saved[k] !== v) {
					saved[k] = v;
					idbPut(k, v).then((r) => {
						if (r === undefined) {
							saved[k] = null;
							logErr("idb put failed", k);
						}
					});
				}
				return "@idb";
			}
			if (!v && saved[k]) {
				saved[k] = "";
				idbDel(k);
			}
			return v;
		});
	}
	// После загрузки состояния подтягиваем картинки и перерисовываем.
	function hydrate(S, done) {
		openDb().then(async (db) => {
			IDB.db = db;
			IDB.state = db ? "ok" : "fail";
			if (db) {
				for (const k of IMG_KEYS) {
					if (pending[k]) {
						const v = await idbGet(k);
						if (typeof v === "string" && v.startsWith("data:image/")) {
							S[k] = v;
							saved[k] = v;
						} else saved[k] = "";
						pending[k] = false;
					}
				}
			} else {
				IMG_KEYS.forEach((k) => {
					if (pending[k])
						logErr(
							"IndexedDB недоступен: картинка " + k + " не загружена",
							"idb",
						);
				});
			}
			hydrated = true;
			try {
				done && done();
			} catch (e) {
				logErr(e, "hydrate");
			}
		});
	}
	function clearImages() {
		IMG_KEYS.forEach((k) => {
			saved[k] = "";
			pending[k] = false;
		});
		if (IDB.db) {
			idbDel("banner");
			idbDel("avatar");
		}
	}
	const blobs = new Map();
	function imgSrc(d) {
		if (!d || typeof d !== "string") return "";
		if (!d.startsWith("data:")) return d;
		if (blobs.has(d)) return blobs.get(d);
		try {
			const i = d.indexOf(","),
				meta = d.slice(5, i).split(";")[0] || "image/jpeg";
			const bin = atob(d.slice(i + 1)),
				u = new Uint8Array(bin.length);
			for (let n = 0; n < bin.length; n++) u[n] = bin.charCodeAt(n);
			const url = URL.createObjectURL(new Blob([u], { type: meta }));
			if (blobs.size > 6) {
				const first = blobs.keys().next().value;
				URL.revokeObjectURL(blobs.get(first));
				blobs.delete(first);
			}
			blobs.set(d, url);
			return url;
		} catch (e) {
			logErr(e, "imgSrc");
			return d;
		}
	}

	/* ---------- Точечное обновление DOM ---------- */
	const KEEP = ["rv-in", "is-off"];
	function syncAttrs(a, b) {
		for (const at of Array.from(a.attributes)) {
			if (!b.hasAttribute(at.name)) a.removeAttribute(at.name);
		}
		for (const at of Array.from(b.attributes)) {
			let v = at.value;
			if (at.name === "class") {
				const keep = KEEP.filter(
					(c) => a.classList.contains(c) && !v.split(/\s+/).includes(c),
				);
				if (keep.length) v += " " + keep.join(" ");
			}
			if (a.getAttribute(at.name) !== v) a.setAttribute(at.name, v);
		}
	}
	function syncNode(a, b) {
		if (a.nodeType === 3 || a.nodeType === 8) {
			if (a.nodeValue !== b.nodeValue) a.nodeValue = b.nodeValue;
			return;
		}
		syncAttrs(a, b);
		syncKids(a, b);
	}
	function syncKids(a, b) {
		const oc = Array.from(a.childNodes),
			nc = Array.from(b.childNodes);
		const max = Math.max(oc.length, nc.length);
		for (let i = 0; i < max; i++) {
			const x = oc[i],
				y = nc[i];
			if (!y) {
				x.remove();
				continue;
			}
			if (!x) {
				a.appendChild(y);
				continue;
			}
			if (x.nodeType !== y.nodeType || x.nodeName !== y.nodeName) {
				a.replaceChild(y, x);
				continue;
			}
			syncNode(x, y);
		}
	}
	function morph(container, html) {
		const t = document.createElement("template");
		t.innerHTML = html;
		syncKids(container, t.content);
	}

	/* ---------- Появления, свечение, scroll-spy ---------- */
	let io = null,
		ioFrames = null,
		spy = null,
		spyId = "hm";
	function setSpy(id) {
		if (id === "wr") id = "sm";
		spyId = id;
		document
			.querySelectorAll(".rail [data-to]")
			.forEach((b) => b.classList.toggle("on", b.dataset.to === id));
	}
	function afterRender() {
		try {
			if (!io && "IntersectionObserver" in window) {
				io = new IntersectionObserver(
					(es) => {
						es.forEach((e) => {
							if (e.isIntersecting) {
								e.target.classList.add("rv-in");
								io.unobserve(e.target);
							}
						});
					},
					{ rootMargin: "0px 0px -6% 0px", threshold: 0.06 },
				);
				ioFrames = new IntersectionObserver((es) => {
					es.forEach((e) =>
						e.target.classList.toggle("is-off", !e.isIntersecting),
					);
				});
				spy = new IntersectionObserver(
					(es) => {
						es.forEach((e) => {
							if (e.isIntersecting) setSpy(e.target.id);
						});
					},
					{ rootMargin: "-35% 0px -55% 0px" },
				);
			}
			document.querySelectorAll(".rv:not(.rv-in)").forEach((el, i) => {
				el.style.setProperty("--i", String(Math.min(i, 6)));
				io ? io.observe(el) : el.classList.add("rv-in");
			});
			document
				.querySelectorAll(".avs")
				.forEach((el) => ioFrames && ioFrames.observe(el));
			document
				.querySelectorAll("[data-spy]")
				.forEach((el) => spy && spy.observe(el));
			setSpy(spyId);
			document.querySelectorAll("#cal table").forEach((t) => {
				t._hc = null;
			});
			const chip = document.querySelector("#cal .ms .on");
			if (chip && chip.parentElement) {
				const box = chip.parentElement;
				box.scrollLeft =
					chip.offsetLeft - box.clientWidth / 2 + chip.clientWidth / 2;
			}
		} catch (e) {
			logErr(e, "afterRender");
		}
	}
	// страховка: если IntersectionObserver не сработал — ничего не остаётся скрытым
	setTimeout(
		() =>
			document
				.querySelectorAll(".rv:not(.rv-in)")
				.forEach((e) => e.classList.add("rv-in")),
		4000,
	);
	document.addEventListener("visibilitychange", () =>
		root.classList.toggle("tab-off", document.hidden),
	);

	// Свечение за курсором: один слушатель, обновление раз в кадр.
	let gx = 0,
		gy = 0,
		gel = null,
		gq = false;
	const GLOW =
		".card,.vital,.tc,.rt-tile,.sm-m,.award-summary-item,.goal,.sc,.cal-summary>div,.frame-option,.btn,.add";
	document.addEventListener(
		"pointermove",
		(e) => {
			if (e.pointerType === "touch") return;
			const el = e.target.closest && e.target.closest(GLOW);
			gx = e.clientX;
			gy = e.clientY;
			gel = el;
			if (gq) return;
			gq = true;
			requestAnimationFrame(() => {
				gq = false;
				if (!gel) return;
				const r = gel.getBoundingClientRect();
				gel.style.setProperty("--mx", gx - r.left + "px");
				gel.style.setProperty("--my", gy - r.top + "px");
				const nx = (gx - r.left) / r.width - 0.5,
					ny = (gy - r.top) / r.height - 0.5;
				if (gel.classList.contains("vital")) {
					gel.style.setProperty("--rx", (-ny * 2.4).toFixed(2) + "deg");
					gel.style.setProperty("--ry", (nx * 3.2).toFixed(2) + "deg");
				}
			});
		},
		{ passive: true },
	);
	document.addEventListener(
		"pointerout",
		(e) => {
			const el = e.target.closest && e.target.closest(".vital");
			if (el && !el.contains(e.relatedTarget)) {
				el.style.removeProperty("--rx");
				el.style.removeProperty("--ry");
			}
		},
		{ passive: true },
	);

	// Подсветка «крестом» в календаре: колонка дня под курсором.
	document.addEventListener(
		"pointerover",
		(e) => {
			if (e.pointerType === "touch") return;
			const td = e.target.closest && e.target.closest("#cal .mx td");
			if (!td || td.classList.contains("ti")) return;
			const table = td.closest("table");
			if (!table || table._hc === td.cellIndex) return;
			table.querySelectorAll(".hc").forEach((x) => x.classList.remove("hc"));
			const i = (table._hc = td.cellIndex);
			table.querySelectorAll("tr").forEach((r) => {
				const c = r.cells[i];
				if (c && r.cells.length > i && !c.hasAttribute("colspan"))
					c.classList.add("hc");
			});
		},
		{ passive: true },
	);
	document.addEventListener(
		"pointerout",
		(e) => {
			const mx = e.target.closest && e.target.closest("#cal .mx");
			if (mx && !mx.contains(e.relatedTarget)) {
				const t = mx.querySelector("table");
				if (t) {
					t._hc = null;
					t.querySelectorAll(".hc").forEach((x) => x.classList.remove("hc"));
				}
			}
		},
		{ passive: true },
	);

	// Вход при первом показе: один короткий таймлайн.
	function intro(G) {
		if (!G || reduce) return;
		try {
			const tl = G.timeline({ defaults: { ease: "power3.out" } });
			tl.from(".rail", { x: -36, opacity: 0, duration: 0.7 }, 0)
				.fromTo(
					".deck",
					{ clipPath: "inset(0 0 100% 0 round 22px)", opacity: 1 },
					{
						clipPath: "inset(0 0 0% 0 round 22px)",
						duration: 1.05,
						ease: "expo.out",
						clearProps: "clipPath",
					},
					0.05,
				)
				.from(
					".deck .avs",
					{ scale: 0.82, opacity: 0, duration: 0.9, ease: "back.out(1.5)" },
					0.35,
				)
				.from(
					".deck .fr-ring",
					{ rotation: -140, duration: 1.4, ease: "expo.out" },
					0.35,
				)
				.from(
					".dk-core > *",
					{ y: 22, opacity: 0, stagger: 0.07, duration: 0.65 },
					0.5,
				)
				.from(
					".vital",
					{ x: 34, opacity: 0, stagger: 0.09, duration: 0.7 },
					0.6,
				)
				.from(
					".dk-chips > *",
					{ y: 14, opacity: 0, stagger: 0.06, duration: 0.5 },
					0.9,
				);
		} catch (e) {
			logErr(e, "intro");
		}
	}

	window.ICE = {
		logErr,
		ERRLOG,
		mark,
		serialize,
		hydrate,
		clearImages,
		imgSrc,
		morph,
		afterRender,
		intro,
		setSpy,
		IDB,
	};
})();
