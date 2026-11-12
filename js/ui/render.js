"use strict";
/* RAIKEN · Отрисовка страницы: собирает секции из модулей features/*. */

// Общие данные для секций: ранг, даты календаря, выбранный день.
function viewContext() {
	const r = S.shown,
		nx = r < MAX_RANK ? thr(r + 1) : null,
		pv = r ? thr(r) : 0,
		pct = nx
			? Math.max(0, Math.min(100, ((S.cur - pv) / (nx - pv)) * 100))
			: 100,
		now = new Date(),
		td = ymd(now),
		wk = V.mode === "w";
	S.ach = S.ach || {};
	S.med = S.med || {};
	const ac = Object.keys(S.ach).length,
		mc = Object.keys(S.med).length,
		D = [];
	if (wk) {
		for (let i = 0; i < 7; i++) D.push(ymd(addD(parse(V.wk), i)));
	} else {
		const n = new Date(V.y, V.m + 1, 0).getDate();
		for (let d = 1; d <= n; d++)
			D.push(V.y + "-" + pad(V.m + 1) + "-" + pad(d));
	}
	const selectedDay = D.includes(V.selected)
		? V.selected
		: D.includes(td)
			? td
			: D[0];
	return { r, nx, pv, pct, now, td, wk, ac, mc, D, selectedDay };
}

// Левая навигация (на телефоне — нижняя панель).
function railHtml(c) {
	const { td, selectedDay } = c;
	return `<aside class="rail"><div class="rail-logo" aria-hidden="true">${LOGO}</div><nav class="rail-nav" aria-label="Разделы"><button type="button" data-act="go" data-to="hm" data-tip="Главная">${ic("zap", 20)}<span>Главная</span></button><button type="button" data-act="go" data-to="rt" data-tip="Ритуалы">${ic("repeat", 20)}<span>Ритуалы</span></button><button type="button" data-act="go" data-to="td" data-tip="Сегодня">${ic("list-checks", 20)}<span>Сегодня</span></button><button type="button" data-act="go" data-to="goals" data-tip="Цели">${ic("target", 20)}<span>Цели</span></button><button type="button" data-act="go" data-to="cal" data-tip="Календарь">${ic("calendar-days", 20)}<span>Календарь</span></button><button type="button" data-act="go" data-to="sm" data-tip="Итоги">${ic("clipboard-check", 20)}<span>Итоги</span></button><button type="button" data-act="go" data-to="rw" data-tip="Награды">${ic("trophy", 20)}<span>Награды</span></button><button type="button" data-act="go" data-to="ds" data-tip="Дисциплина">${ic("shield-alert", 20)}<span>Дисциплина</span></button></nav><button class="rail-add" type="button" data-act="new" data-d="${selectedDay}" data-tip="Новая задача (N)" aria-label="Новая задача">${ic("plus", 22)}</button></aside>`;
}

function render() {
	const sc = ($(".mx") || {}).scrollLeft || 0;
	const c = viewContext();
	ICE.morph(
		$("#app"),
		railHtml(c) +
			`<main class="main">` +
			deckHtml(c) +
			RIT.section() +
			todayHtml(c) +
			"\n" +
			goalsSectionHtml() +
			"\n\n" +
			calendarHtml(c) +
			"\n" +
			RIT.summary() +
			REV.section() +
			awardsSectionHtml(c) +
			"\n" +
			disciplineSectionHtml() +
			resetZoneHtml() +
			`</main>`,
	);
	ICE.afterRender();
	if (FIRST_PAINT) {
		FIRST_PAINT = false;
		ICE.intro(G);
	}
	const mx = $(".mx");
	if (mx) {
		// Месяц всегда начинается с первого числа — без прыжка к сегодняшней дате.
		mx.scrollLeft = CENTER ? 0 : sc;
		CENTER = false;
	}
	fx();
}
