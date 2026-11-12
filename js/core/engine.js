"use strict";
/* RAIKEN · Движок: начисление XP, ранги, серии, повторяющиеся задачи, просрочки и штрафы. */

// Единый сервис операций XP: ключ идемпотентности гарантирует «один раз»
function apply(key, type, amt, reason, rel) {
	if (S.keys[key]) return 0;
	S.keys[key] = 1;
	const b = S.cur,
		a = b + amt,
		d = a - b;
	S.cur = a;
	if (d > 0) S.life += d;
	if (type === "undo") S.life = Math.max(0, S.life + d);
	S.led.push({
		id: uid(),
		key,
		t: Date.now(),
		type,
		amt: d,
		reason,
		rel: rel || "",
		b,
		a,
	});
	if (type === "undo") recalculatePeak();
	else if (a > S.peak) {
		S.peak = a;
		S.peakRel = rel || "";
	}
	return d;
}

function recalculatePeak() {
	const entries = [...S.led].sort((a, b) => a.t - b.t);
	const ignored = new Set();
	const paired = new Set();
	for (let i = 0; i < entries.length; i++) {
		const undo = entries[i];
		if (undo.type !== "undo" || Number(undo.amt) >= 0) continue;
		const reason = String(undo.reason || "");
		for (let j = i - 1; j >= 0; j--) {
			if (paired.has(j)) continue;
			const original = entries[j];
			if (!['reward', 'bonus'].includes(original.type) || Number(original.amt) <= 0) continue;
			if (Math.abs(Number(original.amt)) !== Math.abs(Number(undo.amt))) continue;
			let matches = !!undo.rel && String(original.rel || "") === String(undo.rel);
			if (!matches && reason.startsWith("Отмена бонуса ритуалов"))
				matches = original.reason === "Все ритуалы дня";
			if (!matches && reason.startsWith("Отмена испытания: "))
				matches = original.reason === reason.slice("Отмена испытания: ".length);
			if (!matches && !undo.rel && reason.startsWith("Отмена бонуса ритуалов"))
				matches = original.type === "bonus" && original.reason === "Все ритуалы дня";
			if (matches) {
				ignored.add(j);
				ignored.add(i);
				paired.add(j);
				break;
			}
		}
	}
	let balance = entries.length ? Number(entries[0].b) || 0 : 0;
	let peak = Math.max(0, balance), peakRel = "";
	entries.forEach((entry, index) => {
		if (ignored.has(index)) return;
		balance += Number(entry.amt) || 0;
		if (balance > peak) {
			peak = balance;
			peakRel = entry.rel || "";
		}
	});
	S.peak = Math.max(0, peak, Number(S.cur) || 0);
	S.peakRel = peakRel;
	return S.peak;
}

function sync() {
	const c = rankOf(S.cur);
	if (c > S.shown) {
		for (let n = S.shown + 1; n <= c; n++) if (!S.unl[n]) S.unl[n] = Date.now();
		S.shown = c;
		note("rank", "Новый ранг: " + rankName(c));
		setTimeout(() => levelUp(c), 450);
	} else if (c < S.shown) {
		const previous = S.shown;
		S.shown = c;
		note(
			"rank",
			"Понижение ранга: " + rankName(previous) + " → " + rankName(c),
			true,
		);
	}
	S.warn = null;
	try {
		awards();
	} catch (e) {
		ICE.logErr(e, "awards");
	}
}

function streak() {
	const s = S.st;
	const completedDays = [
		...new Set(
			S.tasks
				.filter((t) => t.status === "done" && !t.late && t.doneAt)
				.map((t) => ymd(new Date(t.doneAt))),
		),
	].sort();
	let best = 0,
		run = 0,
		previous = null;
	for (const day of completedDays) {
		const gap = previous ? Math.round((parse(day) - parse(previous)) / DAY) : 0;
		run = gap === 1 ? run + 1 : 1;
		best = Math.max(best, run);
		previous = day;
	}
	const last = completedDays[completedDays.length - 1] || "";
	const gapToToday = last
		? Math.round((parse(ymd(new Date())) - parse(last)) / DAY)
		: Infinity;
	s.cur = last && gapToToday <= 1 ? run : 0;
	s.best = Math.max(s.best || 0, best);
	s.last = last;
}

const ovs = () => S.disc.filter((e) => e.type === "Просрочка");

const cnt = (at, days, crit) =>
	ovs().filter(
		(x) => x.t <= at && x.t > at - days * DAY && (!crit || x.sev >= 3),
	).length;

function extendRecurringTasks(now = new Date()) {
	let changed = false;
	const groups = new Map();
	S.tasks
		.filter((t) => t.sid && (t.repeat === "d" || t.repeat === "w"))
		.forEach((t) => {
			if (!groups.has(t.sid)) groups.set(t.sid, []);
			groups.get(t.sid).push(t);
		});
	for (const [sid, items] of groups) {
		const sample = items[0],
			workdays = sample.repeat === "wd",
			step = sample.repeat === "w" ? 7 : 1;
		const horizon =
			sample.repeatHorizon ||
			(sample.goalId ? (step === 1 ? 365 : 52) : step === 1 ? 30 : 12);
		const maxDate = items
			.map((t) => t.date)
			.sort()
			.at(-1);
		let cursor = parse(maxDate);
		if (workdays) {
			let count = items.filter(
				(t) =>
					t.date >= ymd(now) &&
					(!sample.repeatUntil || t.date <= sample.repeatUntil),
			).length;
			while (count < horizon) {
				cursor = addD(cursor, 1);
				if ([0, 6].includes(cursor.getDay())) continue;
				const date = ymd(cursor);
				if (sample.repeatUntil && date > sample.repeatUntil) break;
				if (items.some((t) => t.date === date)) continue;
				S.tasks.push({
					...sample,
					id: uid(),
					date,
					status: "active",
					created: Date.now(),
					doneAt: null,
					late: false,
					cyc: 0,
					paid: 0,
					penaltyCount: 0,
					lastPenaltyDay: "",
					moves: [],
					subs: (sample.subs || []).map((x) => ({ ...x, done: false })),
				});
				count++;
				changed = true;
			}
		} else {
			let target = ymd(addD(now, step === 1 ? horizon - 1 : (horizon - 1) * 7));
			if (sample.repeatUntil && sample.repeatUntil < target)
				target = sample.repeatUntil;
			while (ymd(cursor) < target) {
				cursor = addD(cursor, step);
				const date = ymd(cursor);
				if (items.some((t) => t.date === date)) continue;
				S.tasks.push({
					...sample,
					id: uid(),
					date,
					status: "active",
					created: Date.now(),
					doneAt: null,
					late: false,
					cyc: 0,
					paid: 0,
					penaltyCount: 0,
					lastPenaltyDay: "",
					moves: [],
					subs: (sample.subs || []).map((x) => ({ ...x, done: false })),
				});
				changed = true;
			}
		}
	}
	return changed;
}

function addPenalty(t, amount, reason, at = Date.now(), dayOverride) {
	const day = dayOverride || ymd(new Date(at));
	const key = `pen:${t.id}:${t.cyc || 0}:${day}`;
	if (S.keys[key]) {
		t.lastPenaltyDay = day;
		return false;
	}
	const real = apply(key, "penalty", -amount, reason, t.id);
	S.disc.push({
		id: uid(),
		t: at,
		type: "Просрочка",
		sev: t.importance === "important" ? 1 : 0,
		pen: amount,
		real,
		task: t.title,
		tid: t.id,
		escalation: t.penaltyCount || 0,
	});
	t.penaltyCount = (t.penaltyCount || 0) + 1;
	t.lastPenaltyDay = day;
	toast(`${reason}: −${amount} XP`, true);
	return true;
}

function process() {
	const now = new Date(),
		today = ymd(now);
	let ch = extendRecurringTasks(now);
	for (const t of S.tasks)
		if (t.repeatUntil && t.date > t.repeatUntil && t.status === "active") {
			t.status = "cancelled";
			ch = true;
		}
	const missed = S.tasks
		.filter((t) => t.status === "active" && deadline(t) < now)
		.sort((a, b) => deadline(a) - deadline(b));
	for (const t of missed) {
		t.status = "overdue";
		ch =
			addPenalty(
				t,
				taskPenalty(t, 0),
				`Пропуск срока: ${t.title}`,
				+deadline(t),
				ymd(new Date(+deadline(t))),
			) || ch;
	}
	// Строгое ежедневное взыскание за продолжающееся невыполнение.
	// Каждое списание имеет отдельный ключ дня и не может повториться при перерисовке.
	for (const t of S.tasks) {
		if (t.status !== "overdue") continue;
		let last = t.lastPenaltyDay || ymd(new Date(+deadline(t)));
		while (last < today) {
			const nextDay = ymd(addD(parse(last), 1));
			const amount = taskPenalty(t, t.penaltyCount || 1);
			const added = addPenalty(
				t,
				amount,
				`Повторный штраф за невыполнение: ${t.title}`,
				+parse(nextDay),
				nextDay,
			);
			if (added) ch = true;
			last = nextDay;
		}
	}
	// Идеальный день: отдельная награда за все обязательные задачи даты.
	for (let i = 1; i <= 14; i++) {
		const day = ymd(addD(now, -i));
		if (S.keys["day:" + day]) continue;
		const ts = S.tasks.filter((t) => t.mand && t.date === day);
		if (ts.length && ts.every((t) => t.status === "done" && !t.late)) {
			apply("day:" + day, "bonus", 250, "Все обязательные задачи дня " + day);
			ch = true;
		}
	}
	for (let i = 1; i <= 8; i++) {
		const m = addD(mon(now), -7 * i),
			a = ymd(m),
			b = ymd(addD(m, 6));
		if (S.keys["wk:" + a]) continue;
		const ts = S.tasks.filter((t) => t.mand && t.date >= a && t.date <= b);
		if (ts.length && ts.every((t) => t.status === "done" && !t.late)) {
			apply("wk:" + a, "bonus", 750, "Все обязательные задачи недели " + a);
			ch = true;
		}
	}
	quests();
	sync();
	if (ch) save();
	return ch;
}
