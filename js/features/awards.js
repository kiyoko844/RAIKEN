"use strict";
/* RAIKEN · Достижения и медали: расчёт, выдача, галерея и окна. */

function stats() {
	const T = S.tasks,
		dn = T.filter((t) => t.status === "done"),
		dd = dn.filter((t) => t.doneAt),
		by = {},
		K = Object.keys(S.keys || {}),
		pc = (p) => K.filter((k) => k.startsWith(p)).length,
		hc = (t) => S.hist.filter((x) => x.type === t).length,
		now = Date.now();
	dd.forEach((t) => {
		const k = ymd(new Date(t.doneAt));
		by[k] = (by[k] || 0) + 1;
	});
	const hr = dd.map((t) => new Date(t.doneAt)),
		ok = dn.filter((t) => !t.late),
		df = (i) => ok.filter((t) => t.diff === i).length;
	return {
		done: dn.length,
		ontime: ok.length,
		late: dn.length - ok.length,
		over: ovs().length,
		maxDay: Math.max(0, ...Object.values(by)),
		days: Object.keys(by).length,
		d: [0, 1, 2, 3, 4].map(df),
		subs: T.reduce((a, t) => a + t.subs.filter((x) => x.done).length, 0),
		mand: ok.filter((t) => t.mand).length,
		early: hr.filter((d) => d.getHours() < 7).length,
		night: hr.filter((d) => d.getHours() >= 23).length,
		wk: hr.filter((d) => d.getDay() % 6 === 0).length,
		pdays: pc("day:"),
		pweeks: pc("wk:"),
		quests: pc("q:"),
		undos: pc("undo:"),
		esc: S.disc.filter((e) => e.type === "Порог").length,
		lost: S.disc.reduce((a, e) => a + Math.abs(e.real || 0), 0),
		down: S.hist.filter((h) => h.type === "rank" && /Понижение/.test(h.txt))
			.length,
		shield: hc("shield"),
		newc: hc("new"),
		series: new Set(T.filter((t) => t.sid).map((t) => t.sid)).size,
		last5: ok.filter(
			(t) =>
				t.doneAt && deadline(t) >= t.doneAt && deadline(t) - t.doneAt <= 3e5,
		).length,
		early1d: ok.filter((t) => t.doneAt && deadline(t) - t.doneAt >= DAY).length,
		clean7:
			ovs().filter((e) => e.t > now - 7 * DAY).length === 0 &&
			dd.filter((t) => t.doneAt > now - 7 * DAY).length >= 5,
		age: Math.max(0, Math.floor((now - (S.createdAt || now)) / DAY)),
		streak: S.st.best,
		cur: S.cur,
		life: S.life,
		peak: S.peak,
		rank: S.shown,
		avatar: !!S.avatar,
		named: S.name !== "Игрок",
		ach: 0,
		med: Object.keys(S.med || {}).length,
		goalCount: S.goals.filter((g) => !g.archived).length,
		goal25: S.goals.filter((g) => goalProgress(g) >= 25).length,
		goal50: S.goals.filter((g) => goalProgress(g) >= 50).length,
		goal90: S.goals.filter((g) => goalProgress(g) >= 90).length,
		goal100: S.goals.filter((g) => goalProgress(g) >= 100).length,
		importantDone: dn.filter((t) => t.importance === "important" && !t.late)
			.length,
		longDone: dn.filter((t) => t.horizon === "long" && !t.late).length,
		importantLongDone: dn.filter(
			(t) => t.importance === "important" && t.horizon === "long" && !t.late,
		).length,
		activeDays: Object.keys(by).length,
		dailyPerfect: K.filter((k) => k.startsWith("qcomplete:")).length,
		weeklyPerfect: K.filter((k) => k.startsWith("wqcomplete:")).length,
		monthDone: dn.filter(
			(t) =>
				t.doneAt &&
				new Date(t.doneAt).getMonth() === new Date().getMonth() &&
				new Date(t.doneAt).getFullYear() === new Date().getFullYear(),
		).length,
		returned:
			S.hist.some((h) => h.type === "rank" && /Понижение/.test(h.txt)) &&
			dn.length > 0
				? 1
				: 0,
	};
}

function showNextAward() {
	if (AWBusy || !AWQ.length) return;
	if ($("#mo")) {
		setTimeout(showNextAward, 300);
		return;
	}
	const item = AWQ.shift(),
		k = item.kind === "ach" ? "a" : "m",
		list = k === "a" ? ACH : MED,
		a = list.find((x) => x[0] === item.id);
	if (!a) {
		setTimeout(showNextAward, 0);
		return;
	}
	const m = modal(
		`<div class="award-notice"><div class="award-type">${k === "a" ? "НОВОЕ ДОСТИЖЕНИЕ" : "НОВАЯ МЕДАЛЬ"}</div>${plq(a, k, true)}<h3>${esc(a[1])}</h3><p class="m">${esc(a[2])}</p><div class="btns" style="justify-content:center"><button class="btn p" id="award-ok">Отлично!</button></div></div>`,
	);
	AWBusy = true;
	m.querySelector("#award-ok").onclick = closeM;
	if (G)
		G.from(m.querySelector(".pl"), {
			scale: 0.35,
			rotation: -24,
			opacity: 0,
			duration: 0.65,
			ease: "back.out(1.8)",
		});
}

function awards() {
	S.ach = S.ach || {};
	S.med = S.med || {};
	S.awardCooldowns = S.awardCooldowns || {};
	for (const kind of ["ach", "med"])
		if (!S.awardCooldowns[kind]) {
			const history = Object.values(kind === "ach" ? S.ach : S.med)
				.map(Number)
				.filter(Number.isFinite);
			if (history.length) S.awardCooldowns[kind] = Math.max(...history);
		}
	const s = stats();
	s.ach = Object.keys(S.ach).length;
	const signature = JSON.stringify([
		s.done,
		s.ontime,
		s.late,
		s.over,
		s.maxDay,
		s.days,
		s.subs,
		s.mand,
		s.pdays,
		s.pweeks,
		s.quests,
		s.streak,
		s.cur,
		s.life,
		s.peak,
		s.rank,
		s.avatar,
		s.named,
		s.goalCount,
		s.goal25,
		s.goal50,
		s.goal90,
		s.goal100,
		s.importantDone,
		s.longDone,
		s.importantLongDone,
		s.activeDays,
		s.dailyPerfect,
		s.weeklyPerfect,
		s.monthDone,
	]);
	// На одно реальное изменение прогресса — не более одной награды каждого типа.
	// Это исключает массовую выдачу десятков наград после одного действия.
	if (signature === S.awardSignature) return;
	S.awardSignature = signature;
	let n = 0;
	const go = (L, st, kind) => {
		const cooldown = kind === "ach" ? 14 * DAY : 45 * DAY;
		const minimumActiveDays = kind === "ach" ? 7 : 30;
		const last = Number(S.awardCooldowns[kind] || 0);
		if (s.days < minimumActiveDays || (last && Date.now() - last < cooldown))
			return;
		const a = L.find((item) => {
			if (st[item[0]]) return false;
			try {
				return !!item[5](s);
			} catch (e) {
				return false;
			}
		});
		if (!a) return;
		st[a[0]] = Date.now();
		S.awardCooldowns[kind] = Date.now();
		S.hist.push({
			t: Date.now(),
			type: kind,
			txt:
				(kind === "ach" ? "Достижение открыто: " : "Медаль получена: ") + a[1],
		});
		AWQ.push({ kind, id: a[0] });
		n++;
		if (G) burst(innerWidth / 2, innerHeight / 2, CC[a[4]], 26);
	};
	go(ACH, S.ach, "ach");
	go(MED, S.med, "med");
	if (n) {
		save();
		setTimeout(showNextAward, 700);
	}
}

function awHtml(list, state, k, filter, limit) {
	return list
		.filter(
			(a) =>
				(a[4] !== "Секреты" || !!(state || {})[a[0]]) &&
				(!filter || filter === "Все" || a[4] === filter),
		)
		.slice(0, limit || list.length)
		.map((a) => {
			const unlocked = !!(state || {})[a[0]];
			return `<button class="aw ${unlocked ? "" : "lk"}" data-act="aw" data-k="${k}" data-id="${esc(a[0])}">${plq(a, k, unlocked)}<b>${unlocked ? esc(a[1]) : "Скрыто"}</b><small>${unlocked ? fmt(state[a[0]]).slice(0, 5) : esc(a[3])}</small></button>`;
		})
		.join("");
}

function awardTier(index, total) {
	const p = total ? index / total : 0;
	return p < 0.17
		? "Обычные"
		: p < 0.34
			? "Редкие"
			: p < 0.51
				? "Необычные"
				: p < 0.68
					? "Эпические"
					: p < 0.85
						? "Мифические"
						: "Легендарные";
}

function rarityBadge(t) {
	const colors = [
			["#8e9bb5", "#dce4f4"],
			["#4f9ce8", "#9dd7ff"],
			["#32b99b", "#a4f4d9"],
			["#9a70e8", "#d9c4ff"],
			["#38a9e6", "#aadbf6"],
			["#66beed", "#cae9f9"],
		],
		c = colors[Math.max(0, Math.min(5, t))];
	return `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 3 54 15v25L32 61 10 40V15Z" fill="none" stroke="${c[1]}" stroke-width="2.4"/><path d="m32 17 3.8 9.2 9.9.7-7.6 6.3 2.4 9.6-8.5-5.2-8.5 5.2 2.4-9.6-7.6-6.3 9.9-.7Z" fill="${c[0]}"/></svg>`;
}

function awardGallery(k) {
	const isMedal = k === "m",
		list = isMedal ? MED : ACH,
		state = isMedal ? S.med : S.ach,
		visible = list
			.map((a, i) => ({ a, i }))
			.filter((x) => x.a[4] !== "Секреты" || !!(state || {})[x.a[0]]),
		tiers = [
			"Обычные",
			"Редкие",
			"Необычные",
			"Эпические",
			"Мифические",
			"Легендарные",
		];
	return tiers
		.map((tier) => {
			const items = visible.filter((x) => awardTier(x.i, list.length) === tier);
			if (!items.length) return "";
			const unlocked = items.filter((x) => !!(state || {})[x.a[0]]).length;
			return `<section class="aw-tier"><header><div><h4>${tier}</h4><small>${unlocked} из ${items.length} открыто</small></div><span class="tier-count">${items.length}</span></header><div class="aw-gallery">${items
				.map(({ a, i }) => {
					const u = !!(state || {})[a[0]];
					return `<button class="aw-tile ${u ? "unlocked" : "locked"} tier-${tiers.indexOf(tier)}" data-act="aw" data-k="${k}" data-id="${esc(a[0])}"><span class="aw-tile-icon"><span class="aw-art">${awardArt(a, k, !u)}</span></span><b>${u ? esc(a[1]) : "Скрытая награда"}</b><small>${u ? esc(a[2]) : "Условие пока не открыто"}</small></button>`;
				})
				.join("")}</div></section>`;
		})
		.join("");
}

function allAwardsModal(k) {
	const active = k === "m" ? "m" : "a",
		m = modal(
			`<div class="aw-modal-head"><div><small class="eyebrow">КОЛЛЕКЦИЯ НАГРАД</small><h3 id="aw-modal-title">${active === "a" ? "Достижения" : "Медали"}</h3><p class="m">Собирай награды от обычных до легендарных</p></div><button class="btn" id="aw-close">Закрыть</button></div><div class="aw-tabs"><button class="${active === "a" ? "on" : ""}" data-act="awtab" data-k="a">Достижения <b>${Object.keys(S.ach || {}).length}/${ACH.filter((a) => a[4] !== "Секреты" || S.ach[a[0]]).length}</b></button><button class="${active === "m" ? "on" : ""}" data-act="awtab" data-k="m">Медали <b>${Object.keys(S.med || {}).length}/${MED.filter((a) => a[4] !== "Секреты" || S.med[a[0]]).length}</b></button></div><div id="aw-gallery">${awardGallery(active)}</div>`,
			true,
		);
	m.querySelector("#aw-close").onclick = closeM;
	m.dataset.awActive = active;
}

function awardModal(k, id) {
	const list = k === "a" ? ACH : MED,
		a = list.find((x) => x[0] === id);
	if (!a) return;
	const state = k === "a" ? S.ach : S.med;
	if (a[4] === "Секреты" && !state[a[0]]) return;
	const ts = (state || {})[id],
		unlocked = !!ts,
		m = modal(
			`<div class="lvl"><div class="le sm">${plq(a, k, unlocked)}</div><small>${k === "a" ? "ДОСТИЖЕНИЕ" : "МЕДАЛЬ"} · ${esc(a[4])}</small><h3>${unlocked ? esc(a[1]) : "Скрыто"}</h3><p class="m">${unlocked ? esc(a[2]) + " · открыто " + fmt(ts) : "Условие скрыто. Продолжай — награда откроется сама."}</p><div class="btns" style="justify-content:center"><button class="btn p" id="ok">Закрыть</button></div></div>`,
		);
	m.querySelector("#ok").onclick = closeM;
}

// Раздел «Достижения и медали» и журнал XP.
function awardsSectionHtml(c) {
	const { ac, mc } = c;
	return `<section class="sec awards-journal rv" id="rw" data-spy><div class="card award-section award-summary"><div class="ch"><div><h2>Достижения и медали</h2><small class="m">${ac} достижений · ${mc} медалей собрано</small></div><button class="aw-all" data-act="allaw" data-k="a">Все ${ic("chevron-right", 14)}</button></div><div class="award-summary-grid"><button class="award-summary-item" data-act="allaw" data-k="a"><span class="award-summary-icon">${ic("trophy", 24)}</span><span><b>Достижения</b><small>${ac} из ${ACH.length} открыто</small></span><span class="award-summary-arrow">${ic("chevron-right", 18)}</span></button><button class="award-summary-item medal-summary" data-act="allaw" data-k="m"><span class="award-summary-icon">${ic("medal", 24)}</span><span><b>Медали</b><small>${mc} из ${MED.length} открыто</small></span><span class="award-summary-arrow">${ic("chevron-right", 18)}</span></button></div></div>${logHtml()}</section>`;
}
