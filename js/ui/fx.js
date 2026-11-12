"use strict";
/* RAIKEN · Эффекты: анимации чисел, искры, всплывающие числа, наклон эмблемы. */

// ---- Анимации (GSAP, с запасным режимом без библиотеки), квесты, аватар
let FIRST_PAINT = true;

const G = matchMedia("(prefers-reduced-motion: reduce)").matches
		? null
		: window.gsap || null,
	PREV = {};

let PT = null,
	CENTER = false,
	FIRST = true;

function fx() {
	if (!G) return;
	document.querySelectorAll("[data-cu]").forEach((el) => {
		const k = el.dataset.cu,
			v = +el.dataset.v,
			f = PREV[k] == null ? 0 : PREV[k];
		PREV[k] = v;
		if (f === v) return;
		const o = { x: f };
		G.to(o, {
			x: v,
			duration: 0.9,
			ease: "power2.out",
			onUpdate: () => {
				el.textContent = num(o.x);
			},
		});
	});
	document.querySelectorAll("[data-rp]").forEach((el) => {
		const k = "p" + el.dataset.rp,
			c = +el.dataset.c,
			p = +el.dataset.p,
			f = PREV[k] == null ? 0 : PREV[k];
		PREV[k] = p;
		if (f === p) return;
		G.fromTo(
			el,
			{ strokeDasharray: f * c + " " + c },
			{
				strokeDasharray: p * c + " " + c,
				duration: 1.8,
				delay: (+el.dataset.i || 0) * 0.2,
				ease: "power3.out",
			},
		);
	});
	document.querySelectorAll("[data-bw]").forEach((el) => {
		const k = "b" + el.dataset.bw,
			p = +el.dataset.p,
			f = PREV[k] == null ? 0 : PREV[k];
		PREV[k] = p;
		if (f === p) return;
		G.fromTo(
			el,
			{ width: f + "%" },
			{ width: p + "%", duration: 0.9, ease: "power3.out" },
		);
	});
	FIRST = false;
}

function burst(x, y, c, n) {
	n = n || 14;
	if (!G) return;
	for (let i = 0; i < n; i++) {
		const d = document.createElement("i");
		d.className = "pt";
		d.style.cssText =
			"left:" + x + "px;top:" + y + "px;background:" + (c || "#dde7ed");
		document.body.appendChild(d);
		const a = Math.random() * 6.28,
			r = 40 + Math.random() * (n > 20 ? 170 : 60);
		G.to(d, {
			x: Math.cos(a) * r,
			y: Math.sin(a) * r - 20,
			opacity: 0,
			scale: 0.2,
			rotation: Math.random() * 360,
			duration: 0.8 + Math.random() * 0.5,
			ease: "power2.out",
			onComplete: () => d.remove(),
		});
	}
}

function pop(t) {
	if (!G || !PT) return;
	const d = document.createElement("b");
	d.className = "fl";
	d.textContent = t;
	d.style.cssText = "left:" + PT.x + "px;top:" + PT.y + "px";
	document.body.appendChild(d);
	G.to(d, {
		y: -60,
		opacity: 0,
		duration: 1.2,
		ease: "power2.out",
		onComplete: () => d.remove(),
	});
	burst(PT.x, PT.y, "#B7B8B5");
}

document.addEventListener("mousemove", (e) => {
	if (!G || !e.target.closest) return;
	const h = e.target.closest(".rk-emb");
	if (!h) return;
	const r = h.getBoundingClientRect();
	G.to(h, {
		rotationY: ((e.clientX - r.left) / r.width - 0.5) * 18,
		rotationX: -((e.clientY - r.top) / r.height - 0.5) * 18,
		transformPerspective: 700,
		duration: 0.4,
		ease: "power2.out",
	});
});

document.addEventListener("mouseout", (e) => {
	const h = e.target.closest && e.target.closest(".rk-emb");
	if (h && G && !h.contains(e.relatedTarget))
		G.to(h, { rotationX: 0, rotationY: 0, duration: 0.6 });
});
