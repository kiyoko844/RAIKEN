"use strict";
/* RAIKEN · Испытания дня и недели, уровень испытаний. */

function Q() {
	const td = ymd(new Date()),
		dn = S.tasks.filter(
			(t) =>
				t.status === "done" &&
				t.paid > 0 &&
				t.doneAt &&
				ymd(new Date(t.doneAt)) === td,
		),
		important = dn.filter((t) => t.importance === "important").length,
		long = dn.filter((t) => t.horizon === "long").length;
	const pool = [
		{
			id: "d01",
			t: "Выполнить 2 действия",
			p: dn.length,
			n: 2,
			xp: 80,
			cat: "Продуктивность",
		},
		{
			id: "d02",
			t: "Выполнить 3 действия",
			p: dn.length,
			n: 3,
			xp: 100,
			cat: "Продуктивность",
		},
		{
			id: "d03",
			t: "Закрыть 1 важную задачу",
			p: important,
			n: 1,
			xp: 110,
			cat: "Воля",
		},
		{
			id: "d04",
			t: "Закрыть 2 важные задачи",
			p: important,
			n: 2,
			xp: 140,
			cat: "Воля",
		},
		{
			id: "d05",
			t: "Выполнить долгосрочное действие",
			p: long,
			n: 1,
			xp: 110,
			cat: "Развитие",
		},
		{
			id: "d06",
			t: "Выполнить 2 долгосрочных действия",
			p: long,
			n: 2,
			xp: 150,
			cat: "Развитие",
		},
		{
			id: "d07",
			t: "Завершить 3 действия без опоздания",
			p: dn.filter((t) => !t.late).length,
			n: 3,
			xp: 120,
			cat: "Дисциплина",
		},
		{
			id: "d08",
			t: "Выполнить 4 действия за день",
			p: dn.length,
			n: 4,
			xp: 140,
			cat: "Выносливость",
		},
		{
			id: "d09",
			t: "Закрыть 5 действий за день",
			p: dn.length,
			n: 5,
			xp: 170,
			cat: "Выносливость",
		},
		{
			id: "d10",
			t: "Выполнить важное и долгосрочное действие",
			p: dn.filter((t) => t.importance === "important" && t.horizon === "long")
				.length,
			n: 1,
			xp: 160,
			cat: "Особое",
		},
		{
			id: "d11",
			t: "Выполнить 2 задачи в срок",
			p: dn.filter((t) => !t.late).length,
			n: 2,
			xp: 90,
			cat: "Дисциплина",
		},
		{
			id: "d12",
			t: "Продвинуть долгосрочную цель на 2 шага",
			p: dn.filter((t) => t.goalId).length,
			n: 2,
			xp: 130,
			cat: "Развитие",
		},
		{
			id: "d13",
			t: "Выполнить 3 задачи разных типов",
			p: new Set(dn.map((t) => t.horizon + ":" + t.importance)).size,
			n: 3,
			xp: 150,
			cat: "Мастерство",
		},
		{
			id: "d14",
			t: "Закрыть 1 задачу с подзадачами",
			p: dn.filter(
				(t) => t.subs && t.subs.length && t.subs.every((x) => x.done),
			).length,
			n: 1,
			xp: 120,
			cat: "Точность",
		},
		{
			id: "d15",
			t: "Сделать 1 шаг по каждой из 2 целей",
			p: new Set(dn.filter((t) => t.goalId).map((t) => t.goalId)).size,
			n: 2,
			xp: 160,
			cat: "Развитие",
		},
		{
			id: "d16",
			t: "Выполнить 6 действий",
			p: dn.length,
			n: 6,
			xp: 190,
			cat: "Экстремальное",
		},
		{
			id: "d17",
			t: "Закрыть 3 важные задачи без опоздания",
			p: dn.filter((t) => t.importance === "important" && !t.late).length,
			n: 3,
			xp: 180,
			cat: "Воля",
		},
		{
			id: "d18",
			t: "Завершить 2 задачи с подзадачами",
			p: dn.filter(
				(t) => t.subs && t.subs.length && t.subs.every((x) => x.done),
			).length,
			n: 2,
			xp: 160,
			cat: "Точность",
		},
	];
	const dayNo = Math.floor(parse(td).getTime() / DAY),
		start = (dayNo * 7 + Math.floor(dayNo / 3)) % pool.length;
	return [0, 1, 2].map((i) => pool[(start + i * 5) % pool.length]);
}

function challengeLevel(q) {
	const legendary = ["d16", "d17", "w13", "w16", "w17"];
	const extreme = ["d09", "d10", "d13", "d15", "w10", "w12", "w15"];
	const hard = [
		"d04",
		"d06",
		"d07",
		"d08",
		"w02",
		"w04",
		"w05",
		"w08",
		"w09",
		"w11",
		"w14",
		"w18",
	];
	const standard = [
		"d02",
		"d03",
		"d11",
		"d12",
		"d14",
		"w01",
		"w03",
		"w06",
		"w07",
	];
	return legendary.includes(q.id)
		? "V · Легендарное"
		: extreme.includes(q.id)
			? "IV · Экстремальное"
			: hard.includes(q.id)
				? "III · Сложное"
				: standard.includes(q.id)
					? "II · Стандарт"
					: "I · Разминка";
}

function quests() {
	const td = ymd(new Date()), daily = Q(), wk = ymd(mon(new Date())), weekly = W();
	const settle = (key, done, reason, fallback) => {
		if (done && !S.keys[key]) {
			apply(key, "bonus", fallback, reason);
			S.keys[key] = 1;
		} else if (!done && S.keys[key]) {
			const entry = [...S.led].reverse().find((e) => e.reason === reason && e.type === "bonus" && e.amt > 0);
			if (entry) {
				S.qrev = S.qrev || {};
				const n = S.qrev[key] = (S.qrev[key] || 0) + 1;
				apply("q-undo:" + key + ":" + n, "undo", -entry.amt, "Отмена испытания: " + reason);
			}
			delete S.keys[key];
		}
	};
	daily.forEach((q) => settle("q:" + td + q.id, q.p >= q.n, "Ежедневное задание: " + q.t, q.xp));
	settle("qcomplete:" + td, daily.every((q) => q.p >= q.n), "Полное выполнение ежедневных заданий", 120);
	weekly.forEach((q) => settle("wq:" + wk + q.id, q.p >= q.n, "Еженедельное задание: " + q.t, q.xp));
	settle("wqcomplete:" + wk, weekly.every((q) => q.p >= q.n), "Полное выполнение еженедельных заданий", 350);
}

function W() {
	const start = ymd(mon(new Date())),
		end = ymd(addD(mon(new Date()), 6));
	const done = S.tasks.filter(
		(t) =>
			t.status === "done" &&
			!t.late &&
			t.doneAt &&
			ymd(new Date(t.doneAt)) >= start &&
			ymd(new Date(t.doneAt)) <= end,
	);
	const activeDays = new Set(done.map((t) => ymd(new Date(t.doneAt)))).size,
		important = done.filter((t) => t.importance === "important").length,
		longDone = done.filter((t) => t.horizon === "long").length,
		goals = new Set(done.filter((t) => t.goalId).map((t) => t.goalId)).size;
	const goalCounts = {};
	done
		.filter((t) => t.goalId)
		.forEach((t) => (goalCounts[t.goalId] = (goalCounts[t.goalId] || 0) + 1));
	const goals2 = Object.values(goalCounts).filter((n) => n >= 2).length;
	const pool = [
		{
			id: "w01",
			t: "Выполнить 12 действий за неделю",
			p: done.length,
			n: 12,
			xp: 220,
			cat: "Продуктивность",
		},
		{
			id: "w02",
			t: "Закрыть 6 важных задач",
			p: important,
			n: 6,
			xp: 280,
			cat: "Воля",
		},
		{
			id: "w03",
			t: "Быть активным 5 разных дней",
			p: activeDays,
			n: 5,
			xp: 240,
			cat: "Постоянство",
		},
		{
			id: "w04",
			t: "Выполнить 18 действий",
			p: done.length,
			n: 18,
			xp: 300,
			cat: "Выносливость",
		},
		{
			id: "w05",
			t: "Завершить 5 долгосрочных действий",
			p: longDone,
			n: 5,
			xp: 280,
			cat: "Развитие",
		},
		{
			id: "w06",
			t: "Быть активным 6 разных дней",
			p: activeDays,
			n: 6,
			xp: 320,
			cat: "Постоянство",
		},
		{
			id: "w07",
			t: "Закрыть 10 задач строго в срок",
			p: done.filter((t) => !t.late).length,
			n: 10,
			xp: 260,
			cat: "Дисциплина",
		},
		{
			id: "w08",
			t: "Выполнить 8 важных задач в срок",
			p: done.filter((t) => t.importance === "important").length,
			n: 8,
			xp: 330,
			cat: "Воля",
		},
		{
			id: "w09",
			t: "Продвинуть 2 долгосрочные цели",
			p: goals,
			n: 2,
			xp: 300,
			cat: "Развитие",
		},
		{
			id: "w10",
			t: "Выполнить 25 действий за неделю",
			p: done.length,
			n: 25,
			xp: 380,
			cat: "Экстремальное",
		},
		{
			id: "w11",
			t: "Выполнить важные задачи 4 дня подряд",
			p: longestConsecutive(
				done
					.filter((t) => t.importance === "important")
					.map((t) => ymd(new Date(t.doneAt))),
			),
			n: 4,
			xp: 360,
			cat: "Воля",
		},
		{
			id: "w12",
			t: "Завершить 8 долгосрочных действий",
			p: longDone,
			n: 8,
			xp: 380,
			cat: "Выносливость",
		},
		{
			id: "w13",
			t: "Выполнять задачи 7 дней подряд",
			p: longestConsecutive(done.map((t) => ymd(new Date(t.doneAt)))),
			n: 7,
			xp: 450,
			cat: "Легендарное",
		},
		{
			id: "w14",
			t: "Закрыть 15 задач без опоздания",
			p: done.filter((t) => !t.late).length,
			n: 15,
			xp: 320,
			cat: "Дисциплина",
		},
		{
			id: "w15",
			t: "Сделать по 2 шага в 3 целях",
			p: goals2,
			n: 3,
			xp: 400,
			cat: "Развитие",
		},
		{
			id: "w16",
			t: "Выполнить 30 задач за неделю",
			p: done.length,
			n: 30,
			xp: 450,
			cat: "Легендарное",
		},
		{
			id: "w17",
			t: "Закрыть 12 важных долгосрочных задач",
			p: done.filter(
				(t) => t.importance === "important" && t.horizon === "long",
			).length,
			n: 12,
			xp: 450,
			cat: "Мастерство",
		},
		{
			id: "w18",
			t: "Закрыть 6 задач без опоздания",
			p: done.filter((t) => !t.late).length,
			n: 6,
			xp: 340,
			cat: "Дисциплина",
		},
	];
	const weekNo = Math.floor(parse(start).getTime() / (7 * DAY)),
		offset = (weekNo * 7 + Math.floor(weekNo / 2)) % pool.length;
	return [0, 1, 2].map((i) => pool[(offset + i * 5) % pool.length]);
}

function longestConsecutive(days) {
	const sorted = [...new Set(days)].sort(),
		set = new Set(sorted);
	let best = 0;
	for (const day of sorted) {
		const prev = ymd(addD(parse(day), -1));
		if (set.has(prev)) continue;
		let n = 0,
			d = parse(day);
		while (set.has(ymd(d))) {
			n++;
			d = addD(d, 1);
		}
		best = Math.max(best, n);
	}
	return best;
}

// Испытания дня и недели (группы с прогрессом).
function questsHtml(c) {
	const { now, td } = c;
	const dailyQs = Q(),
		weeklyQs = W();
	const dailyDone = dailyQs.filter((q) => q.p >= q.n).length;
	const weeklyDone = weeklyQs.filter((q) => q.p >= q.n).length;
	return `<div class="quest-group"><div class="quest-group-head"><b>ЕЖЕДНЕВНЫЕ</b><span>${dailyDone}/${dailyQs.length}</span></div>${dailyQs
		.map((q) => {
			const ok = S.keys["q:" + td + q.id],
				p = Math.min(100, (q.p / q.n) * 100);
			return `<div class="q ${ok ? "ok" : ""}"><div class="qh"><span>${q.t}</span><b class="m">${ok ? "✓ получено" : "+" + q.xp + " XP"}</b></div><div class="qb"><i style="width:${p}%"></i></div><small class="m">${esc(q.cat || "Испытание")} · ${challengeLevel(q)} · ${q.p} из ${q.n}</small></div>`;
		})
		.join(
			"",
		)}<div class="quest-complete ${dailyDone === dailyQs.length ? "is-done" : ""}"><span>Полное выполнение дня</span><b>${dailyDone === dailyQs.length ? "✓ +120 XP" : "+120 XP"}</b></div></div><div class="quest-group weekly"><div class="quest-group-head"><b>ЕЖЕНЕДЕЛЬНЫЕ</b><span>${weeklyDone}/${weeklyQs.length}</span></div>${weeklyQs
		.map((q) => {
			const ok = S.keys["wq:" + ymd(mon(now)) + q.id],
				p = Math.min(100, (q.p / q.n) * 100);
			return `<div class="q ${ok ? "ok" : ""}"><div class="qh"><span>${q.t}</span><b class="m">${ok ? "✓ получено" : "+" + q.xp + " XP"}</b></div><div class="qb"><i style="width:${p}%"></i></div><small class="m">${esc(q.cat || "Испытание")} · ${challengeLevel(q)} · ${q.p} из ${q.n}</small></div>`;
		})
		.join(
			"",
		)}<div class="quest-complete ${weeklyDone === weeklyQs.length ? "is-done" : ""}"><span>Полное выполнение недели</span><b>${weeklyDone === weeklyQs.length ? "✓ +350 XP" : "+350 XP"}</b></div></div>`;
}
