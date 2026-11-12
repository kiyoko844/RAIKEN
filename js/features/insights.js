"use strict";
/* RAIKEN · INSIGHTS
   Чистая статистика по состоянию S: ничего не меняет и не пишет.
   Используется блоком «Итоги»; позже её же получит ИИ-агент (короткая сводка). */
(function () {
	const DAY = 864e5;
	const pad = (n) => String(n).padStart(2, "0");
	const ymd = (d) =>
		d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
	const parse = (s) => {
		const [a, b, c] = s.split("-").map(Number);
		return new Date(a, b - 1, c);
	};
	const startOfDay = (d) =>
		new Date(d.getFullYear(), d.getMonth(), d.getDate());
	const addDays = (d, n) => {
		const x = new Date(d);
		x.setDate(x.getDate() + n);
		return x;
	};
	const monday = (d) => {
		const x = startOfDay(d);
		x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
		return x;
	};
	const MONTHS = [
		"января",
		"февраля",
		"марта",
		"апреля",
		"мая",
		"июня",
		"июля",
		"августа",
		"сентября",
		"октября",
		"ноября",
		"декабря",
	];
	const WD_SHORT = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
	const WD_LONG = [
		"воскресенье",
		"понедельник",
		"вторник",
		"среду",
		"четверг",
		"пятницу",
		"субботу",
	];

	// Периоды: day | week | month | year со смещением off (0 — текущий, -1 — предыдущий...).
	const MONTH_NOM = [
		"январь",
		"февраль",
		"март",
		"апрель",
		"май",
		"июнь",
		"июль",
		"август",
		"сентябрь",
		"октябрь",
		"ноябрь",
		"декабрь",
	];
	const CMP = {
		day: "в предыдущий день",
		week: "на предыдущей неделе",
		month: "в предыдущем месяце",
		year: "в предыдущем году",
	};
	function bounds(kind, off, now) {
		const t0 = startOfDay(now);
		if (kind === "day") {
			const a = addDays(t0, off);
			return [a, addDays(a, 1)];
		}
		if (kind === "week") {
			const a = addDays(monday(now), 7 * off);
			return [a, addDays(a, 7)];
		}
		if (kind === "month") {
			const a = new Date(now.getFullYear(), now.getMonth() + off, 1);
			return [a, new Date(a.getFullYear(), a.getMonth() + 1, 1)];
		}
		const a = new Date(now.getFullYear() + off, 0, 1);
		return [a, new Date(a.getFullYear() + 1, 0, 1)];
	}
	function build(kind, off, now) {
		const [a, b] = bounds(kind, off, now);
		const days = [];
		for (let d = new Date(a); +d < +b; d = addDays(d, 1)) days.push(ymd(d));
		let label;
		if (kind === "day")
			label =
				a.getDate() +
				" " +
				MONTHS[a.getMonth()] +
				(off === 0
					? " · сегодня"
					: off === -1
						? " · вчера"
						: " " + a.getFullYear());
		else if (kind === "week") {
			const e = addDays(b, -1);
			label =
				a.getDate() +
				(a.getMonth() !== e.getMonth() ? " " + MONTHS[a.getMonth()] : "") +
				" – " +
				e.getDate() +
				" " +
				MONTHS[e.getMonth()];
		} else if (kind === "month")
			label = MONTH_NOM[a.getMonth()] + " " + a.getFullYear();
		else label = String(a.getFullYear());
		return {
			kind,
			off,
			from: +a,
			to: +b,
			len: days.length,
			label,
			days,
			cmp: CMP[kind],
		};
	}
	function range(kind, off, now) {
		now = now || new Date();
		off = off || 0;
		const R = build(kind, off, now);
		R.prev = build(kind, off - 1, now);
		return R;
	}

	// Расписание ритуала на конкретную дату (с учётом даты создания).
	function ritScheduled(r, day) {
		const d = parse(day);
		if (r.c && +startOfDay(new Date(r.c)) > +d) return false;
		return Array.isArray(r.d) && r.d.includes(d.getDay());
	}

	// Статистика периода R (из range/build). Ничего не меняет в S.
	function stats(S, R, now) {
		now = now || Date.now();
		const inR = (t) => t >= R.from && t < R.to;
		const days = R.days,
			first = days[0],
			last = days[days.length - 1];
		const todayKey = ymd(new Date(now));
		const out = {
			done: 0,
			planned: 0,
			plannedDone: 0,
			gain: 0,
			lost: 0,
			net: 0,
			penalty: 0,
			penCount: 0,
			ritDone: 0,
			ritSched: 0,
			byDay: {},
			top: [],
			events: [],
			bestDay: null,
			important: 0,
			elapsed: days.filter((d) => d <= todayKey).length,
			truncated: false,
		};
		days.forEach(
			(d) => (out.byDay[d] = { net: 0, done: 0, rit: 0, ritSched: 0 }),
		);
		(S.tasks || []).forEach((t) => {
			if (t.status === "done" && t.doneAt && inR(t.doneAt)) {
				out.done++;
				if (t.importance === "important") out.important++;
				const k = ymd(new Date(t.doneAt));
				if (out.byDay[k]) out.byDay[k].done++;
			}
			if (
				t.date &&
				t.date >= first &&
				t.date <= last &&
				t.status !== "cancelled"
			) {
				out.planned++;
				if (t.status === "done") out.plannedDone++;
			}
		});
		const led = S.led || [];
		led.forEach((e) => {
			if (!inR(e.t)) return;
			out.net += e.amt;
			if (e.amt > 0) out.gain += e.amt;
			else out.lost += e.amt;
			if (e.type === "penalty") out.penalty += e.amt;
			const k = ymd(new Date(e.t));
			if (out.byDay[k]) out.byDay[k].net += e.amt;
			out.events.push(e);
		});
		// журнал XP хранит ограниченное число записей: честно предупреждаем, если период древнее
		out.truncated = led.length >= 4900 && led[0] && R.from < led[0].t;
		out.oldest = led[0] ? led[0].t : null;
		out.top = out.events
			.filter((e) => e.amt > 0)
			.sort((a, b) => b.amt - a.amt)
			.slice(0, 3);
		out.events = out.events
			.slice()
			.sort((a, b) => b.t - a.t)
			.slice(0, 6);
		out.penCount = (S.disc || []).filter(
			(e) => e.type === "Просрочка" && inR(e.t),
		).length;
		(S.rit || []).forEach((r) => {
			days.forEach((d) => {
				if (d > todayKey || !ritScheduled(r, d)) return;
				out.ritSched++;
				out.byDay[d].ritSched++;
				if (r.h && r.h[d] && r.h[d].o) {
					out.ritDone++;
					out.byDay[d].rit++;
				}
			});
		});
		let best = null;
		days.forEach((d) => {
			const v = out.byDay[d].net;
			if (v > 0 && (!best || v > best.net)) best = { day: d, net: v };
		});
		out.bestDay = best;
		return out;
	}
	// Столбики графика: дни (неделя/месяц) или месяцы (год).
	function buckets(R, st, now) {
		const todayKey = ymd(new Date(now || Date.now()));
		if (R.kind === "year") {
			const m = Array.from({ length: 12 }, (_, i) => ({
				key: i,
				label: MONTH_NOM[i].slice(0, 3),
				xp: 0,
				tasks: 0,
				rit: 0,
				sched: 0,
				now: false,
			}));
			R.days.forEach((d) => {
				const i = +d.slice(5, 7) - 1,
					v = st.byDay[d];
				m[i].xp += v.net;
				m[i].tasks += v.done;
				m[i].rit += v.rit;
				m[i].sched += v.ritSched;
				if (d <= todayKey && d.slice(0, 7) === todayKey.slice(0, 7))
					m[i].now = true;
			});
			return m;
		}
		return R.days.map((d) => {
			const v = st.byDay[d],
				dt = parse(d);
			return {
				key: d,
				label: R.kind === "week" ? WD_SHORT[dt.getDay()] : String(dt.getDate()),
				sub: R.kind === "month" ? WD_SHORT[dt.getDay()] : "",
				xp: v.net,
				tasks: v.done,
				rit: v.rit,
				sched: v.ritSched,
				now: d === todayKey,
				we: dt.getDay() % 6 === 0,
			};
		});
	}

	// Серия ритуала: подряд выполненные запланированные дни до сегодня (сегодняшний пропуск серию не рвёт).
	function ritStreak(r, now) {
		now = now || new Date();
		const today = startOfDay(now);
		let run = 0;
		for (let i = 0; i < 400; i++) {
			const d = ymd(addDays(today, -i));
			if (!ritScheduled(r, d)) {
				if (r.c && +startOfDay(new Date(r.c)) > +addDays(today, -i)) break;
				continue;
			}
			if (r.h && r.h[d] && r.h[d].o) run++;
			else if (i === 0) continue;
			else break;
		}
		return run;
	}
	function ritBest(r, now) {
		now = now || new Date();
		const today = startOfDay(now);
		const start = r.c ? startOfDay(new Date(r.c)) : addDays(today, -60);
		let best = 0,
			run = 0;
		for (let d = new Date(start); +d <= +today; d = addDays(d, 1)) {
			const k = ymd(d);
			if (!ritScheduled(r, k)) continue;
			if (r.h && r.h[k] && r.h[k].o) {
				run++;
				best = Math.max(best, run);
			} else if (+d !== +today) run = 0;
		}
		return best;
	}
	// 7 последних дней: done | miss | today | off
	function ritWeek(r, now) {
		now = now || new Date();
		const today = startOfDay(now),
			out = [];
		for (let i = 6; i >= 0; i--) {
			const d = addDays(today, -i),
				k = ymd(d);
			const sched = ritScheduled(r, k),
				done = !!(r.h && r.h[k] && r.h[k].o);
			out.push({
				k,
				wd: WD_SHORT[d.getDay()],
				s: done ? "done" : !sched ? "off" : i === 0 ? "today" : "miss",
			});
		}
		return out;
	}

	// Короткие выводы по правилам (без ИИ): что стоит заметить в периоде.
	function insights(cur, prev, R, bk) {
		const L = [],
			pl = (n, a, b, c) => {
				n = Math.abs(n) % 100;
				const m = n % 10;
				return n > 10 && n < 20 ? c : m > 1 && m < 5 ? b : m === 1 ? a : c;
			};
		const noun =
			R.kind === "day"
				? "за день"
				: R.kind === "week"
					? "за неделю"
					: R.kind === "month"
						? "за месяц"
						: "за год";
		const dTasks = cur.done - prev.done;
		if (cur.done === 0)
			L.push({ k: "warn", t: "Выполненных задач " + noun + " пока нет." });
		else if (dTasks > 0)
			L.push({
				k: "up",
				t:
					"Выполнено на " +
					dTasks +
					" " +
					pl(dTasks, "задачу", "задачи", "задач") +
					" больше, чем " +
					R.cmp +
					".",
			});
		else if (dTasks < 0)
			L.push({
				k: "down",
				t:
					"Выполнено на " +
					Math.abs(dTasks) +
					" " +
					pl(dTasks, "задачу", "задачи", "задач") +
					" меньше, чем " +
					R.cmp +
					".",
			});
		else L.push({ k: "flat", t: "Темп такой же, как " + R.cmp + "." });
		if (cur.ritSched) {
			const pct = Math.round((cur.ritDone / cur.ritSched) * 100);
			L.push({
				k: pct >= 80 ? "up" : pct >= 50 ? "flat" : "warn",
				t:
					"Ритуалы: " +
					cur.ritDone +
					" из " +
					cur.ritSched +
					" (" +
					pct +
					"%).",
			});
		}
		if (cur.penCount === 0)
			L.push({ k: "up", t: "Просрочек нет — штрафов не было." });
		else
			L.push({
				k: "down",
				t:
					cur.penCount +
					" " +
					pl(cur.penCount, "просрочка", "просрочки", "просрочек") +
					", потеряно " +
					Math.abs(cur.penalty) +
					" XP.",
			});
		if (R.len > 1 && cur.elapsed > 1 && cur.done)
			L.push({
				k: "flat",
				t:
					"В среднем " +
					(cur.done / cur.elapsed).toFixed(1).replace(".", ",") +
					" задачи и " +
					Math.round(cur.net / cur.elapsed) +
					" XP в день.",
			});
		if (bk && bk.length > 1) {
			const best = bk.reduce((a, b) => (b.xp > (a ? a.xp : 0) ? b : a), null);
			if (best && best.xp > 0)
				L.push({
					k: "up",
					t:
						R.kind === "year"
							? "Лучший месяц — " +
								MONTH_NOM[best.key] +
								": +" +
								best.xp +
								" XP."
							: "Лучший день — " +
								(R.kind === "week"
									? WD_LONG[parse(best.key).getDay()]
									: parse(best.key).getDate() +
										" " +
										MONTHS[parse(best.key).getMonth()]) +
								": +" +
								best.xp +
								" XP.",
				});
		}
		return L.slice(0, 5);
	}

	window.INS = {
		range,
		stats,
		buckets,
		insights,
		ritStreak,
		ritBest,
		ritWeek,
		ritScheduled,
		ymd,
		parse,
		MONTHS,
		WD_SHORT,
	};
})();
