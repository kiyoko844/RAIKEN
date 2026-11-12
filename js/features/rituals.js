"use strict";
/* RAIKEN · RITUALS + ИТОГИ
   Ритуалы — лёгкие ежедневные привычки: без дедлайнов и штрафов, небольшой XP,
   своя серия. Используют единый сервис XP (apply) с идемпотентными ключами.
   Итоги — блок статистики за день и неделю (расчёты в insights.js). */
(function () {
	const XPS = { 1: 20, 2: 40, 3: 60 };
	const BONUS = 50;
	const MAXR = 24;
	const ICONS = [
		"drop",
		"dumbbell",
		"book",
		"moon",
		"sun",
		"heart",
		"pencil",
		"leaf",
	];
	const ORDER = [1, 2, 3, 4, 5, 6, 0];
	const WD = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
	const LEVELS = [
		[1, "Лёгкий"],
		[2, "Средний"],
		[3, "Сложный"],
	];
	const PRESETS = [
		{ t: "Стакан воды утром", ic: "drop", w: 1 },
		{ t: "Зарядка или тренировка", ic: "dumbbell", w: 2 },
		{ t: "Чтение 20 минут", ic: "book", w: 2 },
		{ t: "Отбой до 23:00", ic: "moon", w: 2 },
	];
	const DKEY = /^\d{4}-\d{2}-\d{2}$/;
	const today = () => INS.ymd(new Date());

	/* ---------- Данные ---------- */
	function clean(a) {
		if (!Array.isArray(a)) return [];
		const seen = new Set();
		return a
			.filter(
				(r) =>
					r &&
					typeof r === "object" &&
					typeof r.id === "string" &&
					typeof r.t === "string" &&
					r.t.trim() &&
					!seen.has(r.id) &&
					seen.add(r.id),
			)
			.slice(0, MAXR)
			.map((r) => {
				const d = Array.isArray(r.d)
					? [
							...new Set(
								r.d
									.map(Number)
									.filter((n) => Number.isInteger(n) && n >= 0 && n <= 6),
							),
						]
					: [0, 1, 2, 3, 4, 5, 6];
				const h = {};
				if (r.h && typeof r.h === "object") {
					Object.keys(r.h)
						.filter((k) => DKEY.test(k))
						.sort()
						.slice(-400)
						.forEach((k) => {
							const v = r.h[k];
							if (v && typeof v === "object")
								h[k] = {
									o: v.o ? 1 : 0,
									k: Math.max(0, Math.floor(+v.k || 0)),
									p: Math.max(0, Math.floor(+v.p || 0)),
								};
						});
				}
				return {
					id: r.id.slice(0, 40),
					t: r.t.trim().slice(0, 40),
					ic: ICONS.includes(r.ic) ? r.ic : "drop",
					w: [1, 2, 3].includes(+r.w) ? +r.w : 2,
					d: d.length ? d : [0, 1, 2, 3, 4, 5, 6],
					c: Number.isFinite(+r.c) ? +r.c : Date.now(),
					h,
				};
			});
	}
	function cleanB(o) {
		const out = {};
		if (o && typeof o === "object" && !Array.isArray(o)) {
			Object.keys(o)
				.filter((k) => DKEY.test(k))
				.sort()
				.slice(-90)
				.forEach((k) => {
					const v = o[k];
					if (v && typeof v === "object")
						out[k] = {
							k: Math.max(0, Math.floor(+v.k || 0)),
							on: v.on ? 1 : 0,
							p: Math.max(0, Math.floor(+v.p || 0)),
						};
				});
		}
		return out;
	}
	const done = (r, day) => !!(r.h[day] && r.h[day].o);
	const scheduledToday = () =>
		S.rit.filter((r) => INS.ritScheduled(r, today()));

	// Бонус дня: все ритуалы дня выполнены (минимум два). Отмена возвращает бонус.
	function settle(day) {
		const L = S.rit.filter((r) => INS.ritScheduled(r, day));
		const all = L.length >= 2 && L.every((r) => done(r, day));
		const bs = S.ritb[day] || { k: 0, on: 0, p: 0 };
		if (all && !bs.on) {
			const k = bs.k + 1;
			const got = apply(
				"ritb:" + day + ":" + k,
				"bonus",
				BONUS,
				"Все ритуалы дня",
				"ritual-bonus:" + day,
			);
			S.ritb[day] = { k, on: 1, p: got };
			toast("Все ритуалы выполнены: +" + got + " XP");
		} else if (!all && bs.on) {
			apply(
				"ritbu:" + day + ":" + bs.k,
				"undo",
				-(bs.p || BONUS),
				"Отмена бонуса ритуалов",
				"ritual-bonus:" + day,
			);
			S.ritb[day] = { k: bs.k, on: 0, p: 0 };
		}
	}
	function finish(day) {
		settle(day);
		sync();
		save();
		render();
	}
	function toggle(id, btn) {
		const r = S.rit.find((x) => x.id === id);
		if (!r) return;
		const day = today();
		if (!INS.ritScheduled(r, day)) {
			toast("Сегодня этого ритуала нет в расписании", true);
			return;
		}
		const cur = r.h[day] || { o: 0, k: 0, p: 0 };
		if (!cur.o) {
			const k = cur.k + 1;
			const got = apply(
				"rit:" + r.id + ":" + day + ":" + k,
				"reward",
				XPS[r.w] || 20,
				"Ритуал: " + r.t,
				r.id,
			);
			r.h[day] = { o: 1, k, p: got };
			toast("+" + got + " XP · " + r.t);
			try {
				if (btn && typeof burst === "function") {
					const b = btn.getBoundingClientRect();
					burst(b.left + b.width / 2, b.top + b.height / 2, "#9fd8f2", 22);
				}
			} catch (e) {
				ICE.logErr(e, "ritual burst");
			}
		} else {
			apply(
				"ritu:" + r.id + ":" + day + ":" + cur.k,
				"undo",
				-(cur.p || 0),
				"Отмена ритуала: " + r.t,
				r.id,
			);
			r.h[day] = { o: 0, k: cur.k, p: 0 };
			recalculatePeak();
		}
		finish(day);
	}

	/* ---------- Окно ритуала ---------- */
	function modalFor(r) {
		const st = r
			? { t: r.t, ic: r.ic, w: r.w, d: r.d.slice() }
			: { t: "", ic: "drop", w: 2, d: [0, 1, 2, 3, 4, 5, 6] };
		const m = modal(
			`<h3>${r ? "Ритуал" : "Новый ритуал"}</h3><div class="rtm"><label class="rtm-f"><span>Название</span><input id="rt-t" maxlength="40" autocomplete="off" placeholder="Например: зарядка" value="${esc(st.t)}"></label>
			<div class="rtm-f"><span>Иконка</span><div class="rtm-ics">${ICONS.map((i) => `<button type="button" class="rtm-ic ${st.ic === i ? "on" : ""}" data-i="${i}" aria-label="${i}">${ic(i, 20)}</button>`).join("")}</div></div>
			<div class="rtm-f"><span>Сложность</span><div class="rtm-w">${LEVELS.map(([w, n]) => `<button type="button" class="rtm-lv ${st.w === w ? "on" : ""}" data-w="${w}"><b>${n}</b><small>+${XPS[w]} XP</small></button>`).join("")}</div></div>
			<div class="rtm-f"><span>Дни недели</span><div class="rtm-days">${ORDER.map((d) => `<button type="button" class="rtm-d ${st.d.includes(d) ? "on" : ""}" data-d="${d}">${WD[d]}</button>`).join("")}</div></div>
			<p class="m rtm-note">Без дедлайнов и штрафов: пропуск лишь обнуляет серию ритуала.</p></div>
			<div class="btns">${r ? '<button class="btn d" id="rt-del" type="button">Удалить</button>' : ""}<button class="btn" id="rt-x" type="button">Отмена</button><button class="btn p" id="rt-ok" type="button">Сохранить</button></div>`,
		);
		const q = (s) => m.querySelector(s);
		m.querySelectorAll(".rtm-ic").forEach(
			(b) =>
				(b.onclick = () => {
					st.ic = b.dataset.i;
					m.querySelectorAll(".rtm-ic").forEach((x) =>
						x.classList.toggle("on", x === b),
					);
				}),
		);
		m.querySelectorAll(".rtm-lv").forEach(
			(b) =>
				(b.onclick = () => {
					st.w = +b.dataset.w;
					m.querySelectorAll(".rtm-lv").forEach((x) =>
						x.classList.toggle("on", x === b),
					);
				}),
		);
		m.querySelectorAll(".rtm-d").forEach(
			(b) =>
				(b.onclick = () => {
					const d = +b.dataset.d,
						i = st.d.indexOf(d);
					if (i >= 0) st.d.splice(i, 1);
					else st.d.push(d);
					b.classList.toggle("on", i < 0);
				}),
		);
		q("#rt-x").onclick = closeM;
		q("#rt-ok").onclick = () => {
			const t = q("#rt-t").value.trim();
			if (!t) {
				toast("Введи название ритуала", true);
				q("#rt-t").focus();
				return;
			}
			if (!st.d.length) {
				toast("Выбери хотя бы один день", true);
				return;
			}
			if (r) {
				r.t = t.slice(0, 40);
				r.ic = st.ic;
				r.w = st.w;
				r.d = st.d.slice();
			} else {
				if (S.rit.length >= MAXR) {
					toast("Достигнут лимит ритуалов: " + MAXR, true);
					return;
				}
				S.rit.push({
					id: uid(),
					t: t.slice(0, 40),
					ic: st.ic,
					w: st.w,
					d: st.d.slice(),
					c: Date.now(),
					h: {},
				});
			}
			closeM();
			finish(today());
			toast(r ? "Ритуал обновлён" : "Ритуал добавлен");
		};
		if (r)
			q("#rt-del").onclick = async () => {
				if (
					!(await ask(
						"Удалить ритуал «" +
							r.t +
							"»? История отметок исчезнет, полученный XP останется.",
						"Удалить",
						true,
					))
				)
					return;
				S.rit = S.rit.filter((x) => x.id !== r.id);
				closeM();
				finish(today());
				toast("Ритуал удалён");
			};
		setTimeout(() => {
			const i = q("#rt-t");
			if (i && !r) i.focus();
		}, 60);
	}
	function preset(i) {
		const p = PRESETS[i];
		if (!p || S.rit.length >= MAXR || S.rit.some((r) => r.t === p.t)) return;
		S.rit.push({
			id: uid(),
			t: p.t,
			ic: p.ic,
			w: p.w,
			d: [0, 1, 2, 3, 4, 5, 6],
			c: Date.now(),
			h: {},
		});
		finish(today());
		toast("Ритуал добавлен: " + p.t);
	}

	/* ---------- Раздел «Ритуалы» ---------- */
	function section() {
		const day = today(),
			L = S.rit,
			td = scheduledToday();
		const nDone = td.filter((r) => done(r, day)).length,
			total = td.length;
		const pct = total ? Math.round((nDone / total) * 100) : 0;
		const bs = S.ritb[day],
			bonusOn = !!(bs && bs.on);
		const head = `<div class="rt-head"><div><h2>Ритуалы</h2><p class="m">Ежедневные привычки без штрафов: отметь — получи XP и продли серию</p></div><button class="add" data-act="ritadd" type="button">${ic("plus", 16)} Ритуал</button></div>`;
		if (!L.length) {
			return `<section class="sec card rt rv" id="rt" data-spy>${head}<div class="rt-empty"><div class="rt-empty-ic">${ic("repeat", 30)}</div><div><b>Здесь живут твои ежедневные привычки</b><p class="m">Начни с готовых или создай свой ритуал. Каждый даёт небольшой XP, а выполнение всех за день — бонус +${BONUS} XP.</p></div></div><div class="rt-presets">${PRESETS.map((p, i) => `<button class="chip2" type="button" data-act="ritpre" data-i="${i}">${ic(p.ic, 16)}<span>${esc(p.t)}</span><b>+${XPS[p.w]}</b></button>`).join("")}</div></section>`;
		}
		const tiles = L.map((r) => {
			const on = done(r, day),
				sched = INS.ritScheduled(r, day),
				st = INS.ritStreak(r),
				wk = INS.ritWeek(r);
			return `<div class="rt-tile ${on ? "is-done" : ""} ${sched ? "" : "is-rest"}"><button class="rt-check" type="button" data-act="ritck" data-id="${r.id}" ${sched ? "" : "disabled"} aria-pressed="${on}" aria-label="${on ? "Снять отметку" : "Отметить"}: ${esc(r.t)}"><svg class="rt-ring" viewBox="0 0 56 56" aria-hidden="true"><circle class="rb" cx="28" cy="28" r="25"/><circle class="rf" cx="28" cy="28" r="25"/></svg><span class="rt-ico">${ic(r.ic, 22)}</span><span class="rt-tick">${ic("tick", 24)}</span></button><div class="rt-body"><b>${esc(r.t)}</b><span class="rt-meta">${sched ? "+" + XPS[r.w] + " XP" : "сегодня выходной"}${st ? ` · <i class="rt-fl">${ic("flame", 13)}${st}</i>` : ""}</span><div class="rt-dots">${wk.map((x) => `<i class="d ${x.s}" title="${x.wd}"></i>`).join("")}</div></div><button class="rt-more" type="button" data-act="ritedit" data-id="${r.id}" aria-label="Настроить ритуал ${esc(r.t)}">⋯</button></div>`;
		}).join("");
		const foot =
			total >= 2
				? bonusOn
					? `<span class="rt-bonus is-on">${ic("sparkles", 15)} Бонус дня получен · +${BONUS} XP</span>`
					: `<span class="rt-bonus">${ic("sparkles", 15)} Выполни все ${total} ${pl(total, "ритуал", "ритуала", "ритуалов")} — бонус +${BONUS} XP</span>`
				: `<span class="rt-bonus">${ic("sparkles", 15)} Добавь ещё ритуал — за все ритуалы дня дают бонус +${BONUS} XP</span>`;
		return `<section class="sec card rt rv" id="rt" data-spy>${head}<div class="rt-prog"><div class="rt-prog-t"><b>${total ? nDone + " из " + total : "Сегодня нет ритуалов"}</b><span class="m">${total ? "выполнено сегодня" : "по расписанию"}</span></div><div class="rt-bar"><i data-bw="rit" data-p="${pct}" style="width:${pct}%"></i></div></div><div class="rt-grid">${tiles}</div><div class="rt-foot">${foot}</div></section>`;
	}

	/* ---------- Раздел «Итоги и аналитика» ---------- */
	let SMK = null,
		SMO = 0,
		SMM = "xp"; // период, смещение, метрика графика
	const KINDS = [
		["day", "День"],
		["week", "Неделя"],
		["month", "Месяц"],
		["year", "Год"],
	];
	const OVER = {
		day: "Сегодня",
		week: "Эта неделя",
		month: "Этот месяц",
		year: "Этот год",
	};
	const sgn = (v) => (v > 0 ? "+" : v < 0 ? "−" : "") + num(Math.abs(v));
	const abbr = (v) =>
		Math.abs(v) >= 1000
			? (v / 1000).toFixed(1).replace(".", ",").replace(",0", "") + "k"
			: String(v);
	const delta = (d, unit, goodUp) => {
		if (!d) return `<em class="dl flat">без изменений</em>`;
		const up = d > 0,
			good = goodUp ? up : !up;
		return `<em class="dl ${good ? "up" : "down"}">${up ? "▲" : "▼"} ${num(Math.abs(d))}${unit || ""}</em>`;
	};
	const pctOf = (a, b) => (b ? Math.round((a / b) * 100) : 0);
	function summary() {
		if (!SMK) {
			SMK = "week";
			SMO = new Date().getDay() === 1 ? -1 : 0;
		}
		const R = INS.range(SMK, SMO),
			cur = INS.stats(S, R),
			prev = INS.stats(S, R.prev);
		const bk = SMK === "day" ? null : INS.buckets(R, cur);
		const ring = pctOf(cur.plannedDone, cur.planned),
			RC = 2 * Math.PI * 52;
		const ritPct = cur.ritSched ? pctOf(cur.ritDone, cur.ritSched) : null,
			ritPrev = prev.ritSched ? pctOf(prev.ritDone, prev.ritSched) : null;
		const tabs = KINDS.map(
			([k, n]) =>
				`<button type="button" role="tab" aria-selected="${SMK === k}" class="${SMK === k ? "on" : ""}" data-act="smtab" data-t="${k}">${n}</button>`,
		).join("");
		// обзор: сколько сделано сейчас за день, неделю, месяц, год
		const over = KINDS.map(([k]) => {
			const o = INS.stats(S, INS.range(k, 0)),
				p = pctOf(o.plannedDone, o.planned);
			return `<button type="button" class="sm-oc ${SMK === k && SMO === 0 ? "on" : ""}" data-act="smk" data-t="${k}"><small>${OVER[k]}</small><b>${o.done}<em>${pl(o.done, "задача", "задачи", "задач")}</em></b><span class="sm-oc-s">${o.planned ? p + "% плана" : "нет плана"} · ${sgn(o.net)} XP</span><span class="sm-oc-b"><i style="width:${p}%"></i></span></button>`;
		}).join("");
		const nav = `<div class="sm-nav"><button class="ib" type="button" data-act="smnav" data-d="-1" aria-label="Назад">${ic("chevron-left", 16)}</button><b class="sm-label">${esc(R.label)}</b><button class="ib" type="button" data-act="smnav" data-d="1" aria-label="Вперёд" ${SMO >= 1 ? "disabled" : ""}>${ic("chevron-right", 16)}</button>${SMO !== 0 ? `<button class="btn" type="button" data-act="smnow">К текущему</button>` : ""}</div>`;
		const tiles = [
			{
				l: "Задачи",
				v: cur.done,
				s: cur.planned ? "выполнено · в плане " + cur.planned : "выполнено",
				d: delta(cur.done - prev.done, "", true),
				ic: "list-checks",
			},
			{
				l: "XP за период",
				v: sgn(cur.net),
				s: "+" + num(cur.gain) + " · −" + num(Math.abs(cur.lost)),
				d: delta(cur.net - prev.net, " XP", true),
				ic: "trending-up",
				cls: cur.net < 0 ? "neg" : "",
			},
			{
				l: "Ритуалы",
				v: ritPct === null ? "—" : ritPct + "%",
				s: cur.ritSched
					? cur.ritDone + " из " + cur.ritSched + " отметок"
					: "нет ритуалов в периоде",
				d:
					ritPct !== null && ritPrev !== null
						? delta(ritPct - ritPrev, "%", true)
						: "",
				ic: "repeat",
			},
			{
				l: "Просрочки",
				v: cur.penCount,
				s: cur.penCount
					? "потеряно −" + num(Math.abs(cur.penalty)) + " XP"
					: "без штрафов",
				d: delta(cur.penCount - prev.penCount, "", false),
				ic: "shield-alert",
				cls: cur.penCount ? "bad" : "",
			},
		]
			.map(
				(m) =>
					`<div class="sm-m ${m.cls || ""}"><span class="sm-ico">${ic(m.ic, 18)}</span><small>${m.l}</small><b>${m.v}</b><span class="sm-sub">${m.s}</span>${m.d}</div>`,
			)
			.join("");
		const ringCard = `<div class="sm-ringcard"><div class="sm-rg"><svg viewBox="0 0 120 120" aria-hidden="true"><circle class="rb" cx="60" cy="60" r="52"/><circle class="rf" cx="60" cy="60" r="52" stroke-dasharray="${((ring / 100) * RC).toFixed(1)} ${RC.toFixed(1)}" transform="rotate(-90 60 60)"/></svg><div><b>${ring}%</b><small>${cur.plannedDone}/${cur.planned}</small></div></div><span class="sm-rg-t">Выполнение плана</span><span class="sm-rg-s">${cur.planned ? "задачи периода, кроме отменённых" : "в этом периоде нет задач"}</span></div>`;
		let visual;
		if (!bk) {
			visual = `<div class="sm-chartcard"><div class="sm-ch-h"><b>События с XP</b><span class="m">${cur.events.length ? "последние за день" : ""}</span></div>${cur.events.length ? `<div class="sm-events">${cur.events.map((e) => `<div class="sm-ev ${e.amt < 0 ? "neg" : ""}"><span>${esc(e.reason || "Событие")}</span><b>${sgn(e.amt)} XP</b></div>`).join("")}</div>` : `<div class="sm-none">${SMO === 0 ? "Сегодня пока без XP — отметь первый ритуал или задачу." : "В этот день событий с XP не было."}</div>`}</div>`;
		} else {
			const val = (b) =>
				SMM === "xp" ? b.xp : SMM === "tasks" ? b.tasks : b.rit;
			const maxV = Math.max(1, ...bk.map((b) => Math.abs(val(b))));
			const best = bk.reduce(
				(a, b) => (val(b) > (a ? val(a) : 0) ? b : a),
				null,
			);
			const chips = [
				["xp", "XP"],
				["tasks", "Задачи"],
				["rit", "Ритуалы"],
			]
				.map(
					([k, n]) =>
						`<button type="button" class="${SMM === k ? "on" : ""}" data-act="smmet" data-m="${k}">${n}</button>`,
				)
				.join("");
			const unit =
				SMM === "xp" ? " XP" : SMM === "tasks" ? " задач" : " ритуалов";
			const cols = bk
				.map((b) => {
					const v = val(b),
						h = v ? Math.max(5, Math.round((Math.abs(v) / maxV) * 100)) : 3;
					const isBest = best && val(best) > 0 && b.key === best.key;
					const tip = `${b.label}${b.sub ? " " + b.sub : ""}: ${SMM === "xp" ? sgn(v) : v}${unit}`;
					return `<div class="sm-col ${b.now ? "is-now" : ""} ${isBest ? "is-best" : ""} ${b.we ? "is-we" : ""}" title="${tip}"><span class="sm-val">${v && (SMK !== "month" || isBest) ? (SMM === "xp" ? (v > 0 ? "+" : "−") + abbr(Math.abs(v)) : v) : ""}</span><div class="sm-bar"><i class="${v < 0 ? "neg" : ""}" style="height:${h}%"></i></div><small>${b.label}</small></div>`;
				})
				.join("");
			visual = `<div class="sm-chartcard"><div class="sm-ch-h"><b>${SMK === "year" ? "По месяцам" : "По дням"}</b><div class="sm-chips">${chips}</div></div><div class="sm-chart k-${SMK}" role="img" aria-label="График за период">${cols}</div></div>`;
		}
		const ins = INS.insights(cur, prev, R, bk)
			.map((x) => `<li class="${x.k}"><i></i>${esc(x.t)}</li>`)
			.join("");
		const now = new Date(),
			tm = new Date(now);
		tm.setDate(tm.getDate() + 1);
		const tmKey = INS.ymd(tm),
			over_ = S.tasks.filter((t) => t.status === "overdue").length;
		let next = "";
		if (SMO === 0 && (SMK === "day" || SMK === "week")) {
			const cnt = S.tasks.filter(
				(t) => t.status === "active" && t.date === tmKey,
			).length;
			next = `<div class="sm-next"><b>${SMK === "day" ? "На завтра" : "Что дальше"}</b><span>${cnt} ${pl(cnt, "задача", "задачи", "задач")} запланировано${over_ ? ` · <i class="neg">${over_} ${pl(over_, "просрочена", "просрочены", "просрочено")}</i>` : " · просрочек нет"}</span></div>`;
		} else if (SMO === 0 && SMK === "month") {
			const left = R.len - cur.elapsed,
				cnt = S.tasks.filter(
					(t) =>
						t.status === "active" &&
						t.date > INS.ymd(now) &&
						t.date <= R.days[R.days.length - 1],
				).length;
			next = `<div class="sm-next"><b>До конца месяца</b><span>${left} ${pl(left, "день", "дня", "дней")} · ${cnt} ${pl(cnt, "задача", "задачи", "задач")} запланировано</span></div>`;
		}
		const note = cur.truncated
			? `<p class="sm-note">Журнал XP хранит последние события: данные до ${new Date(cur.oldest).toLocaleDateString("ru-RU")} могут быть неполными.</p>`
			: "";
		return `<section class="sec card sm rv" id="sm" data-spy><div class="sm-head"><div><h2>Итоги и аналитика</h2><p class="m">Сколько сделано за день, неделю, месяц и год — с переходом по истории</p></div><div class="sm-tabs" role="tablist">${tabs}</div></div><div class="sm-over">${over}</div>${nav}<div class="sm-main">${ringCard}<div class="sm-grid">${tiles}</div></div><div class="sm-body">${visual}<ul class="sm-ins">${ins}</ul></div>${next}${note}</section>`;
	}

	function handle(a, b) {
		if (a === "ritadd") {
			modalFor(null);
			return true;
		}
		if (a === "ritedit") {
			const r = S.rit.find((x) => x.id === b.dataset.id);
			if (r) modalFor(r);
			return true;
		}
		if (a === "ritck") {
			toggle(b.dataset.id, b);
			return true;
		}
		if (a === "ritpre") {
			preset(+b.dataset.i);
			return true;
		}
		if (a === "smtab" || a === "smk") {
			SMK = b.dataset.t;
			SMO = 0;
			render();
			return true;
		}
		if (a === "smnav") {
			SMO = Math.min(1, SMO + (+b.dataset.d || 0));
			render();
			return true;
		}
		if (a === "smnow") {
			SMO = 0;
			render();
			return true;
		}
		if (a === "smmet") {
			SMM = b.dataset.m;
			render();
			return true;
		}
		return false;
	}

	window.RIT = { clean, cleanB, section, summary, handle, XPS, BONUS };
})();
