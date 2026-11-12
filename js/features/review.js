"use strict";
/* RAIKEN · НЕДЕЛЬНЫЙ ОБЗОР
   Раз в неделю: цифры недели (из insights.js) + твои ответы на три вопроса,
   оценка самочувствия и фокус следующей недели. Записи хранятся в S.rev,
   ключ — понедельник недели (YYYY-MM-DD). За первый обзор недели даётся +60 XP. */
(function () {
	const BONUS = 60;
	const MAXW = 156; // три года
	const MAXT = 600;
	const WKEY = /^\d{4}-\d{2}-\d{2}$/;
	const DAY = 864e5;
	const LABELS = ["", "Тяжело", "Так себе", "Нормально", "Хорошо", "Отлично"];
	const Q = [
		{
			k: "a",
			t: "Что получилось лучше всего?",
			ph: "Победы недели, даже маленькие",
		},
		{
			k: "b",
			t: "Что мешало или отнимало силы?",
			ph: "Причины, а не оправдания: что именно сбило темп",
		},
		{
			k: "c",
			t: "Что изменю на следующей неделе?",
			ph: "Одно-два конкретных изменения",
		},
	];
	let SHOWALL = false;

	const mondayOf = (d) => {
		const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
		x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
		return x;
	};
	const weekKey = (off) => {
		const m = mondayOf(new Date());
		m.setDate(m.getDate() + 7 * off);
		return INS.ymd(m);
	};
	const offOf = (wk) =>
		Math.round((+INS.parse(wk) - +mondayOf(new Date())) / (7 * DAY));
	const rangeOf = (wk) => INS.range("week", offOf(wk));

	/* ---------- Данные ---------- */
	function clean(o) {
		const out = {};
		if (!o || typeof o !== "object" || Array.isArray(o)) return out;
		Object.keys(o)
			.filter((k) => WKEY.test(k))
			.sort()
			.slice(-MAXW)
			.forEach((k) => {
				const v = o[k];
				if (!v || typeof v !== "object") return;
				const r = Math.round(+v.r);
				const txt = (x) => (typeof x === "string" ? x.slice(0, MAXT) : "");
				const s = v.s && typeof v.s === "object" ? v.s : {};
				const n = (x) => (Number.isFinite(+x) ? Math.round(+x) : 0);
				out[k] = {
					r: r >= 1 && r <= 5 ? r : 3,
					a: txt(v.a),
					b: txt(v.b),
					c: txt(v.c),
					f: typeof v.f === "string" ? v.f.slice(0, 90) : "",
					t: Number.isFinite(+v.t) ? +v.t : Date.now(),
					s: { d: n(s.d), x: n(s.x), r: n(s.r), p: n(s.p) },
				};
			});
		return out;
	}
	const sorted = () => Object.keys(S.rev).sort();
	const hasActivity = (st) =>
		st.done > 0 || st.gain > 0 || st.ritDone > 0 || st.penCount > 0;

	// Какую неделю предлагать: пн–ср — прошлую, если не разобрана и была активность; иначе текущую.
	function target() {
		const dow = new Date().getDay(),
			last = weekKey(-1),
			cur = weekKey(0);
		if (
			dow >= 1 &&
			dow <= 3 &&
			!S.rev[last] &&
			hasActivity(INS.stats(S, rangeOf(last)))
		)
			return { wk: last, due: true, which: "прошлая" };
		const due = !S.rev[cur] && (dow === 0 || dow === 5 || dow === 6);
		return { wk: cur, due, which: "текущая" };
	}
	function focus() {
		const prev = S.rev[weekKey(-1)];
		return prev && prev.f ? prev.f : "";
	}
	// недели подряд с обзором, считая назад от самой свежей (пропущенная неделя обрывает серию)
	function streak() {
		let n = 0,
			off = S.rev[weekKey(0)] ? 0 : -1;
		for (; off > -MAXW; off--) {
			if (S.rev[weekKey(off)]) n++;
			else break;
		}
		return n;
	}

	/* ---------- Окно обзора ---------- */
	function open(wk) {
		const R = rangeOf(wk),
			st = INS.stats(S, R),
			prev = INS.stats(S, R.prev);
		const old = S.rev[wk];
		const draft = {
			r: old ? old.r : 0,
			a: old ? old.a : "",
			b: old ? old.b : "",
			c: old ? old.c : "",
			f: old ? old.f : "",
		};
		const ritPct = st.ritSched
			? Math.round((st.ritDone / st.ritSched) * 100)
			: null;
		const sgn = (v) => (v > 0 ? "+" : v < 0 ? "−" : "") + num(Math.abs(v));
		const tiles = [
			["Задачи", st.done],
			["XP", sgn(st.net)],
			["Ритуалы", ritPct === null ? "—" : ritPct + "%"],
			["Просрочки", st.penCount],
		]
			.map(
				([l, v]) => `<div class="wrm-t"><small>${l}</small><b>${v}</b></div>`,
			)
			.join("");
		const ins = INS.insights(st, prev, R, INS.buckets(R, st))
			.slice(0, 3)
			.map((x) => `<li class="${x.k}"><i></i>${esc(x.t)}</li>`)
			.join("");
		const m = modal(
			`<div class="wrm"><small class="eyebrow">НЕДЕЛЬНЫЙ ОБЗОР</small><h3>${esc(R.label)}</h3><div class="wrm-stats">${tiles}</div><ul class="sm-ins wrm-ins">${ins}</ul>
			<div class="wrm-f"><span>Как ощущалась неделя?</span><div class="wrm-rate">${[1, 2, 3, 4, 5].map((i) => `<button type="button" class="${draft.r === i ? "on" : ""}" data-r="${i}"><b>${i}</b><small>${LABELS[i]}</small></button>`).join("")}</div></div>
			${Q.map((q) => `<label class="wrm-f"><span>${q.t}</span><textarea data-k="${q.k}" rows="3" maxlength="${MAXT}" placeholder="${q.ph}">${esc(draft[q.k])}</textarea></label>`).join("")}
			<label class="wrm-f"><span>Главный фокус следующей недели</span><input data-k="f" maxlength="90" autocomplete="off" placeholder="Одна фраза, которая будет в шапке всю неделю" value="${esc(draft.f)}"></label>
			<p class="m wrm-note">${old ? "Правка не даёт повторный XP." : "За первый обзор недели: +" + BONUS + " XP."} Записи видишь только ты — они хранятся в браузере.</p></div>
			<div class="btns">${old ? '<button class="btn d" id="wr-del" type="button">Удалить обзор</button>' : ""}<button class="btn" id="wr-x" type="button">Отмена</button><button class="btn p" id="wr-ok" type="button">Сохранить</button></div>`,
			true,
		);
		const q = (s) => m.querySelector(s);
		m.querySelectorAll(".wrm-rate button").forEach(
			(b) =>
				(b.onclick = () => {
					draft.r = +b.dataset.r;
					m.querySelectorAll(".wrm-rate button").forEach((x) =>
						x.classList.toggle("on", x === b),
					);
				}),
		);
		m.querySelectorAll("[data-k]").forEach((el) =>
			el.addEventListener("input", () => {
				draft[el.dataset.k] = el.value;
			}),
		);
		q("#wr-x").onclick = closeM;
		q("#wr-ok").onclick = () => {
			if (!draft.r) {
				toast("Оцени неделю от 1 до 5", true);
				return;
			}
			const written = ["a", "b", "c", "f"].some((k) => (draft[k] || "").trim());
			if (!written) {
				toast("Напиши хотя бы один ответ или фокус", true);
				return;
			}
			S.rev[wk] = {
				r: draft.r,
				a: draft.a.trim(),
				b: draft.b.trim(),
				c: draft.c.trim(),
				f: draft.f.trim().slice(0, 90),
				t: old ? old.t : Date.now(),
				s: {
					d: st.done,
					x: st.net,
					r: ritPct === null ? 0 : ritPct,
					p: st.penCount,
				},
			};
			let got = 0;
			if (!old)
				got = apply("rev:" + wk, "bonus", BONUS, "Недельный обзор: " + R.label);
			const keys = Object.keys(S.rev).sort();
			if (keys.length > MAXW) delete S.rev[keys[0]];
			closeM();
			sync();
			save();
			render();
			toast(got ? "Обзор сохранён: +" + got + " XP" : "Обзор обновлён");
		};
		if (old)
			q("#wr-del").onclick = async () => {
				if (
					!(await ask(
						"Удалить обзор недели «" + R.label + "»? Полученный XP останется.",
						"Удалить",
						true,
					))
				)
					return;
				delete S.rev[wk];
				closeM();
				save();
				render();
				toast("Обзор удалён");
			};
	}

	/* ---------- Раздел ---------- */
	function item(wk) {
		const v = S.rev[wk],
			R = rangeOf(wk);
		const dots = [1, 2, 3, 4, 5]
			.map((i) => `<i class="${i <= v.r ? "on" : ""}"></i>`)
			.join("");
		const pick = v.c || v.a || v.b || v.f;
		return `<button type="button" class="wr-it" data-act="wropen" data-w="${wk}"><div class="wr-it-h"><b>${esc(R.label)}</b><span class="wr-dots" title="${LABELS[v.r]}">${dots}</span></div><div class="wr-it-s"><span>${v.s.d} задач</span><span>${v.s.x >= 0 ? "+" : "−"}${num(Math.abs(v.s.x))} XP</span>${v.s.r ? `<span>ритуалы ${v.s.r}%</span>` : ""}${v.s.p ? `<span class="neg">${v.s.p} просрочек</span>` : ""}</div>${pick ? `<p>${esc(pick.length > 140 ? pick.slice(0, 140) + "…" : pick)}</p>` : ""}</button>`;
	}
	function section() {
		const T = target(),
			keys = sorted().reverse(),
			cur = weekKey(0),
			last = weekKey(-1);
		const R = rangeOf(T.wk),
			reviewed = !!S.rev[T.wk],
			st = streak(),
			fc = focus();
		let cta;
		if (T.due)
			cta = `<div class="wr-cta is-due"><div><b>Время подвести итоги недели</b><p class="m">${esc(R.label)} · ${T.which} неделя ещё без обзора. Это займёт около пяти минут.</p></div><button class="add" type="button" data-act="wropen" data-w="${T.wk}">${ic("clipboard-check", 16)} Начать обзор · +${BONUS} XP</button></div>`;
		else if (reviewed)
			cta = `<div class="wr-cta is-ok"><div><b>Обзор недели сохранён</b><p class="m">${esc(R.label)}. Спасибо, что остановился и подумал.</p></div><button class="btn" type="button" data-act="wropen" data-w="${T.wk}">Открыть</button></div>`;
		else
			cta = `<div class="wr-cta"><div><b>Обзор появится в конце недели</b><p class="m">Лучшее время — пятница, суббота или воскресенье. Но можно подвести итоги и раньше.</p></div><button class="btn" type="button" data-act="wropen" data-w="${cur}">Обзор этой недели</button></div>`;
		const other = T.wk === last ? cur : last;
		const links = `<div class="wr-links"><button type="button" data-act="wropen" data-w="${other}">${other === last ? "Обзор прошлой недели" : "Обзор текущей недели"}</button></div>`;
		const recent = keys.slice(0, 8).reverse();
		const trend =
			recent.length >= 2
				? `<div class="wr-trend"><div class="wr-th"><b>Самочувствие по неделям</b><span class="m">среднее ${(recent.reduce((a, k) => a + S.rev[k].r, 0) / recent.length).toFixed(1).replace(".", ",")}</span></div><div class="wr-bars">${recent.map((k) => `<div class="wr-bar" title="${esc(rangeOf(k).label)}: ${LABELS[S.rev[k].r]}"><i style="height:${S.rev[k].r * 20}%"></i><small>${INS.parse(k).getDate()}.${String(INS.parse(k).getMonth() + 1).padStart(2, "0")}</small></div>`).join("")}</div></div>`
				: `<div class="wr-trend is-empty"><b>Самочувствие по неделям</b><p class="m">График появится после двух обзоров.</p></div>`;
		const focusBox = `<div class="wr-focus ${fc ? "has" : ""}"><small>${ic("target", 14)} ФОКУС ЭТОЙ НЕДЕЛИ</small><b>${fc ? esc(fc) : "Пока не выбран"}</b><span class="m">${fc ? "Ты выбрал его в прошлом обзоре." : "Его можно задать в обзоре — он появится в шапке."}</span></div>`;
		const list = keys.length
			? `<div class="wr-list">${(SHOWALL ? keys : keys.slice(0, 4)).map(item).join("")}</div>${keys.length > 4 ? `<button class="wr-more" type="button" data-act="wrall">${SHOWALL ? "Свернуть" : "Показать все обзоры (" + keys.length + ")"}</button>` : ""}`
			: `<div class="wr-none">Пока нет ни одного обзора. Первый даст +${BONUS} XP и запустит серию обзоров.</div>`;
		return `<section class="sec card wr rv" id="wr" data-spy><div class="wr-head"><div><h2>Недельный обзор</h2><p class="m">Пять минут раз в неделю: что получилось, что мешало и что изменить</p></div><span class="wr-streak" title="Недель подряд с обзором">${ic("flame", 15)} <b>${st}</b> ${pl(st, "неделя", "недели", "недель")} подряд</span></div>${cta}${links}<div class="wr-mid">${focusBox}${trend}</div>${list}</section>`;
	}
	// Чип для шапки: напоминание и текущий фокус
	function chip() {
		const T = target(),
			fc = focus();
		let h = "";
		if (T.due)
			h += `<button class="chip2 is-due" type="button" data-act="wropen" data-w="${T.wk}">${ic("clipboard-check", 16)}<span>Обзор недели</span><i class="due-dot"></i></button>`;
		if (fc)
			h += `<span class="chip2 chip-focus" title="Фокус недели из прошлого обзора">${ic("target", 16)}<span>${esc(fc.length > 38 ? fc.slice(0, 38) + "…" : fc)}</span></span>`;
		return h;
	}
	function handle(a, b) {
		if (a === "wropen") {
			open(b.dataset.w && WKEY.test(b.dataset.w) ? b.dataset.w : target().wk);
			return true;
		}
		if (a === "wrall") {
			SHOWALL = !SHOWALL;
			render();
			return true;
		}
		return false;
	}

	window.REV = { clean, section, chip, handle, BONUS };
})();
