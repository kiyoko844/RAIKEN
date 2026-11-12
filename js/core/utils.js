"use strict";
/* RAIKEN · Мелкие чистые помощники: DOM, экранирование, даты, числа, склонения. */

const $ = (s) => document.querySelector(s),
	esc = (s) =>
		String(s).replace(
			/[&<>"']/g,
			(c) =>
				({
					"&": "&amp;",
					"<": "&lt;",
					">": "&gt;",
					'"': "&quot;",
					"'": "&#39;",
				})[c],
		);

const pad = (n) => String(n).padStart(2, "0"),
	ymd = (d) =>
		d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());

const parse = (s) => {
	const [a, b, c] = s.split("-").map(Number);
	return new Date(a, b - 1, c);
};

const uid = () =>
	Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const fmt = (t) => {
	const d = new Date(t);
	return (
		pad(d.getDate()) +
		"." +
		pad(d.getMonth() + 1) +
		" " +
		pad(d.getHours()) +
		":" +
		pad(d.getMinutes())
	);
};

const num = (n) => Math.round(n).toLocaleString("ru-RU");

const mon = (d) => {
	const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
	x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
	return x;
};

const addD = (d, n) => {
	const x = new Date(d);
	x.setDate(x.getDate() + n);
	return x;
};

const pl = (n, a, b, c) =>
	n % 10 === 1 && n % 100 !== 11
		? a
		: n % 10 > 1 && n % 10 < 5 && (n % 100 < 12 || n % 100 > 14)
			? b
			: c;

const plq = (a, k, u) =>
	`<span class="pl ${k} ${u ? "" : "lk"}">${awardArt(a, k, !u)}</span>`;

const dayLabel = (t) => {
	const d = new Date(t),
		y = ymd(d),
		n = new Date();
	return y === ymd(n)
		? "Сегодня"
		: y === ymd(addD(n, -1))
			? "Вчера"
			: d.getDate() + " " + MR[d.getMonth()];
};
