"use strict";
/* RAIKEN · Иконки и картинки: логотип, эмблемы рангов, арт наград. */

const LOGO =
	'<svg width="30" height="30" viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#76b8dc"/><stop offset="1" stop-color="#91B7C0"/></linearGradient></defs><path d="M50 6 88 28v44L50 94 12 72V28z" fill="none" stroke="url(#lg)" stroke-width="6" stroke-linejoin="round"/><path fill="url(#lg)" d="M57 20 36 54h13l-6 26 22-36H52z"/></svg>';

const ic = (name, size) =>
	`<svg class="ic" width="${size || 20}" height="${size || 20}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${(window.RAIKEN_ICONS || {})[name] || (window.RAIKEN_ICONS || {}).star || ""}</svg>`;

function pictureAsset(base, alt, cls, locked) {
	return `<picture class="${cls || "asset-picture"} ${locked ? "is-locked" : ""}"><img src="${base}.webp" alt="${esc(alt)}" loading="lazy" decoding="async"></picture>`;
}

function emb(n, locked) {
	const rank = Math.max(1, Math.min(MAX_RANK, Number(n) || 1));
	return pictureAsset(
		`assets/ranks/rank-${String(rank).padStart(2, "0")}`,
		`Эмблема ранга ${rank}: ${rankName(rank)}`,
		"rank-emblem",
		locked,
	);
}

function awardArt(a, kind, locked) {
	const folder = kind === "m" ? "medals" : "achievements";
	return pictureAsset(
		`assets/${folder}/${a[0]}`,
		`${kind === "m" ? "Медаль" : "Достижение"}: ${a[1]}`,
		"award-emblem",
		locked,
	);
}
