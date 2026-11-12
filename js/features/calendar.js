"use strict";
/* RAIKEN · Календарь: ячейка и прокрутка перетаскиванием. */

function cell(t, ds, td) {
	if (!t)
		return ds >= td
			? `<button class="ad" data-act="addat" data-d="${ds}" aria-label="Добавить задачу на ${ds}">+</button>`
			: '<span class="dot">·</span>';
	const overdue = t.status === "overdue";
	return `<button class="cb ${t.status === "done" ? "done" : overdue ? "over" : ""}" style="${overdue ? "color:" + SEV[t.sev][2] : ""}" data-act="tg" data-id="${t.id}" aria-label="${esc(t.title)} ${ds}">${t.status === "done" ? (t.late ? "◐" : "✓") : overdue ? "!" : ""}</button>`;
}

let DR = null;

document.addEventListener("mousedown", (e) => {
	const m = e.target.closest && e.target.closest(".mx");
	if (m && !e.target.closest("button"))
		DR = { m, x: e.clientX, s: m.scrollLeft, mv: false };
});

addEventListener("mousemove", (e) => {
	if (!DR) return;
	const d = e.clientX - DR.x;
	if (Math.abs(d) > 3) {
		DR.mv = true;
		DR.m.classList.add("dg");
	}
	if (DR.mv) DR.m.scrollLeft = DR.s - d;
});

addEventListener("mouseup", () => {
	if (DR) {
		DR.m.classList.remove("dg");
		DR = null;
	}
});

let AF = "Все";

// Календарь: таблица «задачи × дни», фильтры, итоги периода.
function calendarHtml(c) {
	const { r, td, wk, D, selectedDay } = c;
	const G2 = new Map();
	S.tasks
		.filter(
			(t) => t.date >= D[0] && t.date <= D[D.length - 1] && t.status !== "cancelled" && !(t.status === "done" && !t.goalId),
		)
		.sort((a, b) => (a.date < b.date ? -1 : 1))
		.forEach((t) => {
			const k = t.sid || t.id;
			if (!G2.has(k)) G2.set(k, []);
			G2.get(k).push(t);
		});
	const periodTasks = S.tasks.filter(
		(t) =>
			t.date >= D[0] && t.date <= D[D.length - 1] && t.status !== "cancelled",
	);
	const periodDone = periodTasks.filter((t) => t.status === "done").length;
	const periodPct = periodTasks.length
		? Math.round((periodDone / periodTasks.length) * 100)
		: 0;
	const periodOver = periodTasks.filter((t) => t.status === "overdue").length,
		dayStat = {};
	periodTasks.forEach((t) => {
		const o = dayStat[t.date] || (dayStat[t.date] = { t: 0, d: 0, o: 0 });
		o.t++;
		if (t.status === "done") o.d++;
		if (t.status === "overdue") o.o++;
	});
	const head = D.map((ds) => {
		const dt = parse(ds),
			w = dt.getDay(),
			st = dayStat[ds],
			lp = st ? Math.round((st.d / st.t) * 100) : 0,
			tip =
				dt.getDate() +
				" " +
				MR[dt.getMonth()] +
				": " +
				(st
					? "выполнено " +
						st.d +
						" из " +
						st.t +
						(st.o ? ", просрочено " + st.o : "")
					: "задач нет");
		return `<th class="${w % 6 === 0 ? "we" : ""} ${ds === td ? "td" : ""} ${ds === selectedDay ? "selected" : ""}" title="${tip}"><button class="cal-day-pick" data-act="selectday" data-date="${ds}" aria-label="Выбрать ${ds}. ${tip}"><b>${dt.getDate()}</b><span>${WD[w]}</span><i class="cd-load ${st ? "has" : ""} ${st && st.o ? "bad" : ""}"><u style="width:${lp}%"></u></i></button></th>`;
	}).join("");
	let rows = "";
	for (const g of G2.values()) {
		const f = g[0],
			one = g.length === 1 && !f.sid;
		rows +=
			`<tr class="${f.importance === "important" ? "row-important" : ""} ${f.horizon === "long" ? "row-long" : ""}"><td class="ti"><div class="r"><b class="sy" title="${f.importance === "important" ? "Важная задача" : "Обычная задача"}">${f.importance === "important" ? "◆" : "·"}</b><button data-act="edit" data-id="${f.id}">${esc(f.title)}</button><span class="cal-task-meta">${f.importance === "important" ? "Важная" : "Обычная"} · ${f.horizon === "long" ? "долгосрочная" : "быстрая"}${f.goalId && S.goals.find((x) => x.id === f.goalId) ? " · " + esc(S.goals.find((x) => x.id === f.goalId).title) : ""}</span>${g.length > 1 ? `<span class="rc" title="Выполнено в периоде">${g.filter((x) => x.status === "done").length}/${g.length}</span>` : ""}${one && f.subs.length ? `<button class="ar" data-act="open" data-id="${f.id}" aria-label="Подзадачи">${OPEN[f.id] ? "▾" : "▸"}</button>` : ""}</div></td>` +
			D.map((ds) => {
				const t = g.find((x) => x.date === ds),
					w = parse(ds).getDay();
				return `<td class="${w % 6 === 0 ? "we" : ""} ${ds === td ? "td" : ""}">${cell(t, ds, td)}</td>`;
			}).join("") +
			"</tr>";
		if (one && OPEN[f.id])
			f.subs.forEach((s, i) => {
				rows += `<tr class="sr"><td class="ti"><button class="cb sub ${s.done ? "done" : ""}" data-act="sub" data-id="${f.id}" data-i="${i}">${s.done ? "✓" : ""}</button> ${esc(s.t)}</td><td colspan="${D.length}"></td></tr>`;
			});
	}
	if (!G2.size)
		rows = `<tr><td class="ti"><span class="empty">Здесь пока пусто. Нажмите «+ Задача» или «+» в ячейке.</span></td><td colspan="${D.length}"></td></tr>`;
	const foot = `<tfoot><tr><td class="ti">Выполнено за день</td>${D.map(
		(ds) => {
			const st = dayStat[ds],
				w = parse(ds).getDay();
			return `<td class="${w % 6 === 0 ? "we" : ""} ${ds === td ? "td" : ""}">${st ? `<span class="${st.d === st.t ? "all" : st.o ? "bad" : ""}">${st.d}/${st.t}</span>` : `<span class="nil">·</span>`}</td>`;
		},
	).join("")}</tr></tfoot>`;
	const d0 = parse(D[0]),
		d6 = parse(D[D.length - 1]),
		lab =
			d0.getDate() +
			" " +
			MR[d0.getMonth()] +
			" – " +
			d6.getDate() +
			" " +
			MR[d6.getMonth()];
	const nav = wk
		? `<button class="ib" data-act="wp" aria-label="Предыдущая неделя">${ic("chevron-left", 16)}</button><b class="wl">${lab}</b><button class="ib" data-act="wn" aria-label="Следующая неделя">${ic("chevron-right", 16)}</button>`
		: `<button class="ib" data-act="yr" data-d="-1" aria-label="Предыдущий год">${ic("chevron-left", 16)}</button><b class="wl">${V.y}</b><button class="ib" data-act="yr" data-d="1" aria-label="Следующий год">${ic("chevron-right", 16)}</button><span class="ms">${MN.map((n, i) => `<button class="${i === V.m ? "on" : ""}" data-act="mo" data-i="${i}">${n}</button>`).join("")}</span>`;
	return `<section class="sec rv" id="cal" data-spy><div class="ch"><h2>Календарь</h2><div class="seg"><button class="${wk ? "on" : ""}" data-act="md" data-m="w">Неделя</button><button class="${wk ? "" : "on"}" data-act="md" data-m="m">Месяц</button></div></div><div class="ctl">${nav}<span class="sp"></span>${wk ? "" : `<button class="ib" data-act="sl" aria-label="Влево">${ic("chevron-left", 16)}</button><button class="ib" data-act="sr" aria-label="Вправо">${ic("chevron-right", 16)}</button>`}<button class="btn" data-act="today">Сегодня</button><button class="add" data-act="new" data-d="${selectedDay}">${ic("plus", 16)} Задача</button></div>
<div class="cal-summary"><div><small>ЗАДАЧ ЗА ПЕРИОД</small><b>${periodTasks.length}</b></div><div><small>ВЫПОЛНЕНО</small><b>${periodDone}</b></div><div class="${periodOver ? "bad" : ""}"><small>ПРОСРОЧЕНО</small><b>${periodOver}</b></div><div><small>ВЫПОЛНЕНИЕ</small><b>${periodPct}%</b></div><div class="cal-summary-progress"><i style="width:${periodPct}%"></i></div></div><div class="mx"><table class="${wk ? "wk" : ""}"><thead><tr><th class="ti">Задача</th>${head}</tr></thead><tbody>${rows}</tbody>${foot}</table></div><div class="cal-legend"><span><i class="lg done">✓</i> выполнено</span><span><i class="lg late">◐</i> с опозданием</span><span><i class="lg over">!</i> просрочено</span><span><i class="lg">+</i> добавить</span><span><b>◆</b> важная</span></div></section>`;
}
