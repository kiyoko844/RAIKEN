"use strict";
/* RAIKEN · Живой фон.
   Один canvas позади страницы, у каждой темы свои частицы: снег, сакура, кровавая дымка,
   светлячки, бабочки, листья, угли, молнии. Берёт цвета из CSS-переменных темы.
   Бережёт ресурсы: пауза в фоновой вкладке, ограничение кадров и плотности,
   полностью выключен при prefers-reduced-motion. */
(function () {
	const reduceMQ = matchMedia("(prefers-reduced-motion: reduce)");
	let cv = null,
		ctx = null,
		W = 0,
		H = 0,
		DPR = 1;
	let raf = 0,
		last = 0,
		T = 0;
	let kind = "snow",
		wanted = true,
		density = 2,
		active = false;
	let P = [],
		extra = {}; // частицы и состояние системы
	let C1 = [79, 179, 230],
		C2 = [159, 216, 242],
		CL = [234, 246, 255];
	const sprites = new Map();
	const rnd = (a, b) =>
		b === undefined ? Math.random() * a : a + Math.random() * (b - a);
	const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
	const mix = (a, b, t) =>
		[
			a[0] + (b[0] - a[0]) * t,
			a[1] + (b[1] - a[1]) * t,
			a[2] + (b[2] - a[2]) * t,
		].map(Math.round);

	function readColors() {
		const cs = getComputedStyle(document.documentElement);
		const get = (n, d) => {
			const v = cs.getPropertyValue(n).trim().split(/\s+/).map(Number);
			return v.length === 3 && v.every((x) => !isNaN(x)) ? v : d;
		};
		C1 = get("--c1", C1);
		C2 = get("--c2", C2);
		CL = get("--cl", CL);
		sprites.clear();
	}
	// мягкое свечение: заранее нарисованный спрайт
	function glow(c, size) {
		const key = c.join(",") + "|" + size;
		if (sprites.has(key)) return sprites.get(key);
		const s = document.createElement("canvas");
		s.width = s.height = size;
		const g = s.getContext("2d"),
			r = size / 2;
		const gr = g.createRadialGradient(r, r, 0, r, r, r);
		gr.addColorStop(0, rgba(c, 1));
		gr.addColorStop(0.25, rgba(c, 0.55));
		gr.addColorStop(1, rgba(c, 0));
		g.fillStyle = gr;
		g.fillRect(0, 0, size, size);
		sprites.set(key, s);
		return s;
	}
	function mist(c, size) {
		const key = "m" + c.join(",") + "|" + size;
		if (sprites.has(key)) return sprites.get(key);
		const s = document.createElement("canvas");
		s.width = s.height = size;
		const g = s.getContext("2d"),
			r = size / 2;
		const gr = g.createRadialGradient(r, r, 0, r, r, r);
		gr.addColorStop(0, rgba(c, 0.5));
		gr.addColorStop(0.55, rgba(c, 0.18));
		gr.addColorStop(1, rgba(c, 0));
		g.fillStyle = gr;
		g.fillRect(0, 0, size, size);
		sprites.set(key, s);
		return s;
	}
	const PETAL = new Path2D("M0 -5C3.6 -5 5.6 -1 0 6C-5.6 -1 -3.6 -5 0 -5z");
	const LEAF = new Path2D("M0 -7C5 -4 6 3 0 8C-6 3 -5 -4 0 -7z");
	const WING_L = new Path2D(
		"M0 0C-3 -7 -11 -8 -10 -2C-9 3 -3 3 0 0zM0 0C-2 4 -8 8 -7 3C-6 -1 -2 -1 0 0z",
	);
	const WING_R = new Path2D(
		"M0 0C3 -7 11 -8 10 -2C9 3 3 3 0 0zM0 0C2 4 8 8 7 3C6 -1 2 -1 0 0z",
	);

	// быстрая установка матрицы частицы (вместо save/translate/rotate/scale/restore)
	const place = (x, y, rot, sx, sy) => {
		const c = Math.cos(rot),
			s = Math.sin(rot);
		ctx.setTransform(DPR * sx * c, DPR * sx * s, -DPR * sy * s, DPR * sy * c, DPR * x, DPR * y);
	};
	const reset = () => ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
	const count = (base) =>
		Math.round(base * [0, 0.5, 1, 1.6][density] * (W < 700 ? 0.55 : 1));

	/* ---------- Системы частиц ---------- */
	const SYS = {
		snow: {
			init() {
				P = Array.from({ length: count(80) }, () => {
					const r = rnd(0.7, 2.8);
					return {
						x: rnd(W),
						y: rnd(H),
						r,
						vy: 12 + r * 10,
						sw: rnd(0.3, 1.3),
						ph: rnd(6.28),
						a: rnd(0.3, 0.85),
						c: Math.random() < 0.25 ? C2 : [255, 255, 255],
					};
				});
				extra = {
					glints: Array.from({ length: count(7) }, () => ({
						x: rnd(W),
						y: rnd(H),
						ph: rnd(6.28),
						s: rnd(5, 10),
					})),
				};
			},
			step(dt) {
				for (const p of P) {
					p.y += p.vy * dt;
					p.x += Math.sin(T * p.sw + p.ph) * 10 * dt;
					if (p.y > H + 6) {
						p.y = -6;
						p.x = rnd(W);
					}
				}
			},
			draw() {
				for (const p of P) {
					ctx.fillStyle = rgba(p.c, p.a);
					ctx.beginPath();
					ctx.arc(p.x, p.y, p.r, 0, 6.283);
					ctx.fill();
				}
				ctx.strokeStyle = rgba(C2, 0.9);
				ctx.lineWidth = 1;
				for (const g of extra.glints) {
					const a = Math.max(0, Math.sin(T * 0.9 + g.ph));
					if (a < 0.2) continue;
					ctx.globalAlpha = a * 0.8;
					ctx.beginPath();
					ctx.moveTo(g.x - g.s, g.y);
					ctx.lineTo(g.x + g.s, g.y);
					ctx.moveTo(g.x, g.y - g.s);
					ctx.lineTo(g.x, g.y + g.s);
					ctx.stroke();
				}
				ctx.globalAlpha = 1;
			},
		},
		sakura: {
			init() {
				P = Array.from({ length: count(46) }, () => newPetal(true));
				extra = { next: T + rnd(18, 30), swarm: [] };
			},
			step(dt) {
				const gust = Math.sin(T * 0.23) * 18 + 12;
				for (const p of P) {
					p.y += p.vy * dt;
					p.x += (p.vx + gust) * dt + Math.sin(T * p.sw + p.ph) * 14 * dt;
					p.rot += p.vr * dt;
					p.fp += p.ff * dt;
					if (p.y > H + 20 || p.x > W + 30) Object.assign(p, newPetal(false));
				}
				if (T > extra.next && !extra.swarm.length) {
					extra.next = T + rnd(40, 65);
					for (let i = 0; i < count(48); i++)
						extra.swarm.push({
							x: -rnd(20, 520),
							y: H * rnd(0.15, 0.85) + rnd(-40, 40),
							s: rnd(5, 9),
							vx: rnd(330, 520),
							amp: rnd(30, 90),
							f: rnd(0.8, 1.6),
							ph: rnd(6.28),
							rot: rnd(6.28),
							vr: rnd(-6, 6),
							fp: rnd(6.28),
							ff: rnd(5, 9),
							a: rnd(0.6, 0.95),
							y0: 0,
						});
					extra.swarm.forEach((p) => (p.y0 = p.y));
				}
				for (const p of extra.swarm) {
					p.x += p.vx * dt;
					p.y = p.y0 + Math.sin(T * p.f + p.ph) * p.amp;
					p.rot += p.vr * dt;
					p.fp += p.ff * dt;
				}
				if (extra.swarm.length && extra.swarm.every((p) => p.x > W + 40))
					extra.swarm = [];
			},
			draw() {
				const col = (p) => rgba(p.c, p.a);
				const dr = (p) => {
					const k = p.s / 6;
					place(p.x, p.y, p.rot, k, k * (0.35 + 0.65 * Math.abs(Math.cos(p.fp))));
					ctx.fillStyle = col(p);
					ctx.fill(PETAL);
				};
				P.forEach(dr);
				extra.swarm.forEach((p) => {
					p.c = p.c || C2;
					dr(p);
				});
				reset();
			},
		},
		blood: {
			init() {
				P = Array.from({ length: count(7) }, () => ({
					x: rnd(W),
					y: rnd(H),
					s: rnd(320, 620),
					vx: rnd(-6, 6),
					vy: rnd(-7, -2),
					ph: rnd(6.28),
					a: rnd(0.06, 0.12),
				}));
				extra = {
					drops: Array.from({ length: count(14) }, () => newDrop(true)),
				};
			},
			step(dt) {
				for (const p of P) {
					p.x += p.vx * dt;
					p.y += p.vy * dt;
					if (p.y < -p.s) p.y = H + p.s * 0.5;
					if (p.x < -p.s) p.x = W + p.s * 0.5;
					if (p.x > W + p.s) p.x = -p.s * 0.5;
				}
				for (const d of extra.drops) {
					d.v += 340 * dt;
					d.y += d.v * dt;
					if (d.y - d.len > H) Object.assign(d, newDrop(false));
				}
			},
			draw() {
				for (const p of P) {
					ctx.globalAlpha = p.a * (0.7 + 0.3 * Math.sin(T * 0.5 + p.ph));
					ctx.drawImage(mist(C1, 256), p.x - p.s / 2, p.y - p.s / 2, p.s, p.s);
				}
				ctx.globalAlpha = 1;
				ctx.lineCap = "round";
				for (const d of extra.drops) {
					if (d.wait > 0) {
						d.wait -= 0.016;
						continue;
					}
					const g = ctx.createLinearGradient(d.x, d.y - d.len, d.x, d.y);
					g.addColorStop(0, rgba(C1, 0));
					g.addColorStop(1, rgba(C1, d.a));
					ctx.strokeStyle = g;
					ctx.lineWidth = d.w;
					ctx.beginPath();
					ctx.moveTo(d.x, d.y - d.len);
					ctx.lineTo(d.x, d.y);
					ctx.stroke();
					ctx.fillStyle = rgba(C2, d.a);
					ctx.beginPath();
					ctx.arc(d.x, d.y, d.w * 0.9, 0, 6.283);
					ctx.fill();
				}
			},
		},
		sparks: {
			init() {
				P = Array.from({ length: count(46) }, () => ({
					x: rnd(W),
					y: rnd(H),
					s: rnd(10, 28),
					vy: -rnd(8, 26),
					sw: rnd(0.3, 1.1),
					ph: rnd(6.28),
					tw: rnd(0.8, 2.4),
					c: Math.random() < 0.3 ? CL : C2,
				}));
			},
			step(dt) {
				for (const p of P) {
					p.y += p.vy * dt;
					p.x += Math.sin(T * p.sw + p.ph) * 14 * dt;
					if (p.y < -30) {
						p.y = H + 20;
						p.x = rnd(W);
					}
				}
			},
			draw() {
				ctx.globalCompositeOperation = "lighter";
				for (const p of P) {
					ctx.globalAlpha =
						0.25 + 0.55 * (0.5 + 0.5 * Math.sin(T * p.tw + p.ph));
					ctx.drawImage(glow(p.c, 32), p.x - p.s / 2, p.y - p.s / 2, p.s, p.s);
				}
				ctx.globalAlpha = 1;
				ctx.globalCompositeOperation = "source-over";
			},
		},
		butterfly: {
			init() {
				P = Array.from({ length: count(13) }, () => ({
					x: rnd(W),
					y: rnd(H),
					s: rnd(0.8, 1.6),
					h: rnd(6.28),
					dh: 0,
					sp: rnd(22, 44),
					fp: rnd(6.28),
					ff: rnd(9, 15),
					a: rnd(0.55, 0.9),
					c: Math.random() < 0.35 ? CL : C2,
				}));
				extra = {
					motes: Array.from({ length: count(22) }, () => ({
						x: rnd(W),
						y: rnd(H),
						s: rnd(8, 18),
						vy: -rnd(5, 14),
						ph: rnd(6.28),
						tw: rnd(0.6, 1.6),
					})),
				};
			},
			step(dt) {
				for (const p of P) {
					p.dh += (Math.random() - 0.5) * 6 * dt;
					p.dh *= 0.96;
					p.h += p.dh * dt * 2;
					p.x += Math.cos(p.h) * p.sp * dt;
					p.y += Math.sin(p.h) * p.sp * dt - 6 * dt;
					p.fp += p.ff * dt;
					if (p.x < -30) p.x = W + 20;
					if (p.x > W + 30) p.x = -20;
					if (p.y < -30) p.y = H + 20;
					if (p.y > H + 30) p.y = -20;
				}
				for (const m of extra.motes) {
					m.y += m.vy * dt;
					if (m.y < -20) {
						m.y = H + 10;
						m.x = rnd(W);
					}
				}
			},
			draw() {
				ctx.globalCompositeOperation = "lighter";
				for (const m of extra.motes) {
					ctx.globalAlpha =
						0.15 + 0.35 * (0.5 + 0.5 * Math.sin(T * m.tw + m.ph));
					ctx.drawImage(glow(C1, 32), m.x - m.s / 2, m.y - m.s / 2, m.s, m.s);
				}
				ctx.globalCompositeOperation = "source-over";
				for (const p of P) {
					ctx.save();
					ctx.translate(p.x, p.y);
					ctx.rotate(p.h + Math.PI / 2);
					ctx.scale(p.s, p.s);
					ctx.globalAlpha = p.a;
					const f = 0.22 + 0.78 * Math.abs(Math.sin(p.fp));
					ctx.fillStyle = rgba(p.c, 0.85);
					ctx.strokeStyle = rgba(CL, 0.9);
					ctx.lineWidth = 0.5;
					ctx.save();
					ctx.scale(f, 1);
					ctx.fill(WING_L);
					ctx.stroke(WING_L);
					ctx.restore();
					ctx.save();
					ctx.scale(f, 1);
					ctx.fill(WING_R);
					ctx.stroke(WING_R);
					ctx.restore();
					ctx.restore();
				}
				ctx.globalAlpha = 1;
			},
		},
		leaves: {
			init() {
				P = Array.from({ length: count(34) }, () => newLeaf(true));
				extra = {
					sparks: Array.from({ length: count(14) }, () => ({
						x: rnd(W),
						y: rnd(H),
						s: rnd(10, 22),
						vy: -rnd(14, 36),
						ph: rnd(6.28),
						blue: Math.random() < 0.3,
					})),
				};
			},
			step(dt) {
				const w = 1 + 0.5 * Math.sin(T * 0.4);
				for (const p of P) {
					p.x += p.vx * w * dt;
					p.y += (p.vy + Math.sin(T * p.f + p.ph) * 34) * dt;
					p.rot += p.vr * dt;
					if (p.x > W + 20) Object.assign(p, newLeaf(false));
					if (p.y > H + 20) p.y = -10;
					if (p.y < -30) p.y = H;
				}
				for (const s of extra.sparks) {
					s.y += s.vy * dt;
					s.x += Math.sin(T + s.ph) * 10 * dt;
					if (s.y < -20) {
						s.y = H + 10;
						s.x = rnd(W);
					}
				}
			},
			draw() {
				for (const p of P) {
					place(p.x, p.y, p.rot, p.s / 7, p.s / 7);
					ctx.globalAlpha = p.a;
					ctx.fillStyle = rgba(p.c, 1);
					ctx.fill(LEAF);
				}
				reset();
				ctx.globalAlpha = 1;
				ctx.globalCompositeOperation = "lighter";
				for (const s of extra.sparks) {
					ctx.globalAlpha = 0.35 + 0.35 * Math.sin(T * 2 + s.ph);
					ctx.drawImage(
						glow(s.blue ? [56, 189, 248] : C1, 32),
						s.x - s.s / 2,
						s.y - s.s / 2,
						s.s,
						s.s,
					);
				}
				ctx.globalAlpha = 1;
				ctx.globalCompositeOperation = "source-over";
			},
		},
		embers: {
			init() {
				P = Array.from({ length: count(46) }, () => ({
					x: rnd(W),
					y: rnd(H),
					r: rnd(0.7, 2.2),
					vy: rnd(10, 28),
					sw: rnd(0.2, 0.9),
					ph: rnd(6.28),
					a: rnd(0.12, 0.4),
				}));
				extra = {
					em: Array.from({ length: count(18) }, () => ({
						x: rnd(W),
						y: rnd(H),
						s: rnd(10, 26),
						vy: -rnd(24, 62),
						sw: rnd(0.4, 1.4),
						ph: rnd(6.28),
						tw: rnd(2, 6),
					})),
				};
			},
			step(dt) {
				for (const p of P) {
					p.y += p.vy * dt;
					p.x += Math.sin(T * p.sw + p.ph) * 9 * dt + 4 * dt;
					if (p.y > H + 5) {
						p.y = -5;
						p.x = rnd(W);
					}
				}
				for (const e of extra.em) {
					e.y += e.vy * dt;
					e.x += Math.sin(T * e.sw + e.ph) * 18 * dt;
					if (e.y < -30) {
						e.y = H + 20;
						e.x = rnd(W);
					}
				}
			},
			draw() {
				const g = mist(C1, 256),
					pulse = 0.55 + 0.25 * Math.sin(T * 0.8);
				ctx.globalAlpha = 0.22 * pulse;
				ctx.drawImage(g, -W * 0.2, H * 0.55, W * 0.9, H * 0.9);
				ctx.globalAlpha = 1;
				for (const p of P) {
					ctx.fillStyle = `rgba(190,185,180,${p.a})`;
					ctx.beginPath();
					ctx.arc(p.x, p.y, p.r, 0, 6.283);
					ctx.fill();
				}
				ctx.globalCompositeOperation = "lighter";
				for (const e of extra.em) {
					ctx.globalAlpha = 0.4 + 0.5 * Math.abs(Math.sin(T * e.tw + e.ph));
					ctx.drawImage(glow(C1, 32), e.x - e.s / 2, e.y - e.s / 2, e.s, e.s);
				}
				ctx.globalAlpha = 1;
				ctx.globalCompositeOperation = "source-over";
			},
		},
		lightning: {
			init() {
				P = Array.from({ length: count(30) }, () => ({
					x: rnd(W),
					y: rnd(H),
					s: rnd(8, 20),
					vy: -rnd(4, 14),
					ph: rnd(6.28),
					tw: rnd(1, 3),
					c: Math.random() < 0.4 ? CL : C2,
				}));
				extra = {
					bolt: null,
					nextBolt: T + rnd(3, 7),
					streaks: [],
					nextStreak: T + rnd(1, 3),
					flash: 0,
				};
			},
			step(dt) {
				for (const p of P) {
					p.y += p.vy * dt;
					p.x += Math.sin(T * 0.6 + p.ph) * 6 * dt;
					if (p.y < -20) {
						p.y = H + 10;
						p.x = rnd(W);
					}
				}
				if (T > extra.nextBolt) {
					extra.nextBolt = T + rnd(6, 13);
					extra.bolt = makeBolt();
					extra.bolt.t0 = T;
					extra.flash = 1;
				}
				if (extra.bolt && T - extra.bolt.t0 > 0.55) extra.bolt = null;
				extra.flash = Math.max(0, extra.flash - dt * 4);
				if (T > extra.nextStreak) {
					extra.nextStreak = T + rnd(2.5, 5);
					extra.streaks.push({
						x: rnd(-100, W * 0.5),
						y: rnd(H * 0.1, H * 0.9),
						L: rnd(160, 340),
						t0: T,
						v: rnd(1500, 2400),
						slope: rnd(-0.25, 0.25),
					});
				}
				extra.streaks = extra.streaks.filter((s) => T - s.t0 < 0.4);
			},
			draw() {
				ctx.globalCompositeOperation = "lighter";
				for (const p of P) {
					ctx.globalAlpha =
						0.25 + 0.5 * (0.5 + 0.5 * Math.sin(T * p.tw + p.ph));
					ctx.drawImage(glow(p.c, 32), p.x - p.s / 2, p.y - p.s / 2, p.s, p.s);
				}
				ctx.globalAlpha = 1;
				ctx.lineCap = "round";
				for (const s of extra.streaks) {
					const k = T - s.t0,
						head = s.x + s.v * k,
						a = 1 - k / 0.4;
					const g = ctx.createLinearGradient(head - s.L, 0, head, 0);
					g.addColorStop(0, rgba(C1, 0));
					g.addColorStop(1, rgba(CL, a));
					ctx.strokeStyle = g;
					ctx.lineWidth = 2;
					ctx.beginPath();
					ctx.moveTo(head - s.L, s.y - s.slope * s.L);
					ctx.lineTo(head, s.y);
					ctx.stroke();
				}
				const b = extra.bolt;
				if (b) {
					const a = Math.max(0, 1 - (T - b.t0) / 0.55);
					ctx.strokeStyle = rgba(C1, a * 0.35);
					ctx.lineWidth = 7;
					ctx.beginPath();
					b.pts.forEach((q, i) =>
						i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]),
					);
					ctx.stroke();
					ctx.strokeStyle = rgba(CL, a);
					ctx.lineWidth = 2;
					ctx.beginPath();
					b.pts.forEach((q, i) =>
						i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]),
					);
					ctx.stroke();
				}
				ctx.globalCompositeOperation = "source-over";
				if (extra.flash > 0.01) {
					ctx.fillStyle = rgba(C2, extra.flash * 0.06);
					ctx.fillRect(0, 0, W, H);
				}
			},
		},
	};
	function newPetal(anywhere) {
		return {
			x: anywhere ? rnd(W) : -rnd(10, 80),
			y: anywhere ? rnd(H) : -rnd(10, 60),
			s: rnd(5, 10),
			vy: rnd(22, 48),
			vx: rnd(6, 20),
			sw: rnd(0.4, 1.2),
			ph: rnd(6.28),
			rot: rnd(6.28),
			vr: rnd(-1.6, 1.6),
			fp: rnd(6.28),
			ff: rnd(1.5, 3.5),
			a: rnd(0.5, 0.9),
			c: mix(C2, C1, Math.random() * 0.6),
		};
	}
	function newDrop(anywhere) {
		return {
			x: rnd(W),
			y: anywhere ? rnd(H) : -rnd(40, 300),
			v: rnd(60, 160),
			len: rnd(24, 70),
			w: rnd(1.2, 2.6),
			a: rnd(0.35, 0.75),
			wait: anywhere ? 0 : rnd(0, 3),
		};
	}
	function newLeaf(anywhere) {
		const green = Math.random() < 0.5;
		return {
			x: anywhere ? rnd(W) : -rnd(10, 100),
			y: rnd(H),
			s: rnd(6, 12),
			vx: rnd(46, 110),
			vy: rnd(-6, 14),
			f: rnd(0.6, 1.6),
			ph: rnd(6.28),
			rot: rnd(6.28),
			vr: rnd(-3, 3),
			a: rnd(0.45, 0.85),
			c: green ? [110, 200, 100] : mix(C1, C2, 0.2),
		};
	}
	function makeBolt() {
		const sx = rnd(W * 0.35, W * 0.95),
			pts = [[sx, -10]];
		let x = sx,
			y = -10;
		while (y < H * rnd(0.55, 0.95)) {
			y += rnd(26, 60);
			x += rnd(-34, 18) - 8;
			pts.push([x, y]);
		}
		return { pts };
	}

	/* ---------- Цикл ---------- */
	function frame(now) {
		raf = requestAnimationFrame(frame);
		if (now - last < 22) return; // ~45 к/с максимум
		const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
		last = now;
		T += dt;
		const s = SYS[kind];
		if (!s) return;
		ctx.clearRect(0, 0, W, H);
		s.step(dt);
		s.draw();
	}
	function resize() {
		if (!cv) return;
		DPR = Math.min(window.devicePixelRatio || 1, 1.5);
		W = innerWidth;
		H = innerHeight;
		cv.width = Math.round(W * DPR);
		cv.height = Math.round(H * DPR);
		ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
		if (SYS[kind]) SYS[kind].init();
	}
	function shouldRun() {
		return wanted && !reduceMQ.matches && !document.hidden && density > 0;
	}
	function sync() {
		const run = shouldRun();
		if (run && !raf) {
			last = performance.now();
			raf = requestAnimationFrame(frame);
		}
		if (!run && raf) {
			cancelAnimationFrame(raf);
			raf = 0;
		}
		if (cv) {
			cv.classList.toggle("on", wanted && !reduceMQ.matches && density > 0);
			active = run;
		}
		if (!(wanted && !reduceMQ.matches && density > 0) && ctx)
			ctx.clearRect(0, 0, W, H);
	}
	function init() {
		if (cv) return;
		cv = document.createElement("canvas");
		cv.id = "ambient";
		cv.setAttribute("aria-hidden", "true");
		document.body.prepend(cv);
		ctx = cv.getContext("2d");
		resize();
		let to = 0;
		addEventListener("resize", () => {
			clearTimeout(to);
			to = setTimeout(resize, 160);
		});
		document.addEventListener("visibilitychange", sync);
		(reduceMQ.addEventListener || reduceMQ.addListener).call(
			reduceMQ,
			"change",
			sync,
		);
		sync();
	}
	const api = {
		init,
		// тема: цвета + тип системы частиц
		setTheme(type) {
			init();
			kind = SYS[type] ? type : "snow";
			readColors();
			resize();
			sync();
		},
		refreshColors() {
			readColors();
			if (SYS[kind]) SYS[kind].init();
		},
		setEnabled(v) {
			wanted = !!v;
			init();
			sync();
		},
		setDensity(d) {
			density = Math.max(0, Math.min(3, +d || 0));
			init();
			resize();
			sync();
		},
		get supported() {
			return !reduceMQ.matches;
		},
		get running() {
			return active;
		},
	};
	window.ICE = window.ICE || {};
	window.ICE.ambient = api;
})();
