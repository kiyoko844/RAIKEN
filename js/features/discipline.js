"use strict";
/* RAIKEN · Раздел «Дисциплина» и журнал XP. */

function discHtml() {
	const now = Date.now(),
		lost = S.disc.reduce((a, e) => a + Math.abs(e.real || 0), 0),
		last =
			S.disc
				.slice(-6)
				.reverse()
				.map(
					(e) =>
						`<div class="pc"><span class="pi" style="color:var(--rd)">−</span><div><b>${esc(e.task || e.reason || "Пропуск")}</b><small class="m">${fmt(e.t)} · ${e.type}</small></div><span class="neg m">−${num(Math.abs(e.real || 0))}</span></div>`,
				)
				.join("") || '<div class="empty">Нарушений пока нет.</div>';
	return `<div class="card"><div class="ch"><h2>Дисциплина</h2><span class="bd l${cnt(now, 21, 0) >= 5 ? 2 : cnt(now, 21, 0) ? 1 : 0}">${ic(cnt(now, 21, 0) ? "triangle-alert" : "shield-check", 16)} ${cnt(now, 21, 0) >= 5 ? "Критическая дисциплина" : cnt(now, 21, 0) ? "Есть нарушения" : "Стабильно"}</span></div><div class="k3"><div><b>${cnt(now, 30, 0)}</b><span>просрочек за 30 дн.</span></div><div><b class="${lost ? "neg" : ""}">−${num(lost)}</b><span>XP потеряно</span></div><div><b>${S.disc.length}</b><span>штрафных событий</span></div></div><h3 class="sh">Правила взысканий</h3><div class="mt"><div class="mh"><span>Обычная быстрая задача</span><b class="neg">−250 XP</b></div><div class="mh"><span>Важная быстрая задача</span><b class="neg">−400 XP</b></div><div class="mh"><span>Обычная долгосрочная</span><b class="neg">−400 XP</b></div><div class="mh"><span>Важная долгосрочная</span><b class="neg">−550 XP</b></div><p class="m">Каждый следующий день невыполнения увеличивает штраф ещё на 100 XP. Баланс не ограничен нулём: ранг может понижаться.</p></div><h3 class="sh">Последние санкции</h3>${last}</div>`;
}

function logHtml() {
	const H = {
		rank: "crown",
		ach: "trophy",
		med: "medal",
		new: "plus",
		del: "trash-2",
		move: "calendar-clock",
	};
	const a = S.led
		.slice(-40)
		.map((e) => ({
			t: e.t,
			x: e.reason,
			v: e.amt,
			b: e.a,
			i: e.amt < 0 ? "arrow-down-right" : "arrow-up-right",
		}))
		.concat(
			S.hist
				.slice(-20)
				.filter((h) => H[h.type])
				.map((h) => ({ t: h.t, x: h.txt, i: H[h.type] })),
		)
		.sort((x, y) => y.t - x.t)
		.slice(0, 12);
	let group = "",
		out = "";
	a.forEach((e) => {
		const label = dayLabel(e.t);
		if (label !== group) {
			group = label;
			out += `<div class="dl">${label}</div>`;
		}
		out += `<div class="lg"><span class="li ${e.v < 0 ? "n" : e.v > 0 ? "p" : ""}">${ic(e.i, 16)}</span><div><b>${esc(e.x || "Событие")}</b><small class="m">${fmt(e.t).slice(-5)}${e.b != null ? " · баланс " + num(e.b) : ""}</small></div><span class="m ${e.v < 0 ? "neg" : e.v > 0 ? "pos" : ""}">${e.v == null ? "" : (e.v > 0 ? "+" : "") + num(e.v)}</span></div>`;
	});
	return `<div class="card xp-journal"><div class="ch"><div><h2>Журнал XP</h2><small class="m">Последние события · новые сверху</small></div><span class="journal-count">${a.length}</span></div><div class="log-scroll">${out || '<div class="empty">Журнал пока пуст.</div>'}</div><div class="journal-foot">Показаны последние события</div></div>`;
}

// Раздел «Дисциплина».
function disciplineSectionHtml() {
	return `<div class="sec rv" id="ds" data-spy>${discHtml()}</div>`;
}
