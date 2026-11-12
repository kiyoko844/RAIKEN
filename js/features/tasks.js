"use strict";
/* RAIKEN · Задачи: окно задачи, отметка выполнения. */

function taskModal(t, dd, presetGoal) {
	const n = !t,
		x = t || {
			title: "",
			desc: "",
			date: dd || ymd(new Date()),
			time: "",
			mand: false,
			subs: [],
			importance: "normal",
			horizon: "quick",
			goalId: presetGoal || "",
			goalPct: 1,
		};
	const lock = t && t.status !== "active",
		subs = (x.subs || []).map((s) => ({ ...s }));
	const goalOptions =
		`<option value="">Без привязки к цели</option>` +
		S.goals
			.filter((g) => !g.archived)
			.map(
				(g) =>
					`<option value="${g.id}" ${x.goalId === g.id ? "selected" : ""}>${esc(g.title)}</option>`,
			)
			.join("");
	const m =
		modal(`<div class="task-modal-head"><span class="eyebrow">${n ? "НОВОЕ ДЕЙСТВИЕ" : "УПРАВЛЕНИЕ ДЕЙСТВИЕМ"}</span><h3>${n ? "Добавить задачу" : "Редактировать задачу"}</h3><p>Выполнение влияет на твой опыт, дисциплину и связанный прогресс.</p></div>
	<label>Название<input id="ft" maxlength="80" value="${esc(x.title)}" placeholder="Например, изучить английский"></label><label>Описание<textarea id="fd" rows="2" maxlength="300" placeholder="Что именно нужно сделать?">${esc(x.desc || "")}</textarea></label>
	<div class="g2 task-selects"><label>Важность<select id="fi"><option value="normal" ${x.importance !== "important" ? "selected" : ""}>Обычная</option><option value="important" ${x.importance === "important" ? "selected" : ""}>Важная</option></select></label><label>Горизонт<select id="fh"><option value="quick" ${x.horizon !== "long" ? "selected" : ""}>Быстрая</option><option value="long" ${x.horizon === "long" ? "selected" : ""}>Долгосрочная</option></select></label></div>
	<div class="reward-policy"><div><small>ЗА ВЫПОЛНЕНИЕ</small><b id="reward-preview">+${taskReward(x)} XP</b></div><div><small>ЗА ПРОПУСК</small><b class="neg" id="penalty-preview">−${taskPenalty(x, 0)} XP</b></div></div>
	<div class="g2"><label>Дата выполнения<input id="fa" type="date" value="${x.date}" ${lock ? "disabled" : ""}></label><label>Время (необязательно)<input id="fm" type="time" value="${x.time || ""}" ${lock ? "disabled" : ""}></label></div>
	${n ? `<label>Повторение<select id="fr"><option value="">Один раз</option><option value="d">Каждый день</option><option value="wd">По будням (Пн–Пт)</option><option value="w">Каждую неделю</option><option value="n">Выбрать количество дней</option></select></label><label id="repeat-days-wrap" style="display:none">Количество дней<input id="repeat-days" type="number" min="2" max="365" value="30"></label>` : ""}
	<label>Связать с долгосрочной целью<select id="fg">${goalOptions}</select></label><label id="goal-pct-wrap">Вклад одного выполнения в прогресс цели (%)<input id="fpct" type="number" min="0.1" max="100" step="0.1" value="${x.goalPct || 1}"></label>
	<label class="ck"><input id="fy" type="checkbox" ${x.mand ? "checked" : ""}> Обязательная задача (участвует в бонусах)</label><div class="cons" id="fc"></div>
	${n ? "" : `<div id="sb"></div><div class="g2" style="grid-template-columns:1fr auto"><input id="si" placeholder="Новая подзадача" maxlength="60"><button class="btn" id="sa">Добавить</button></div>`}
	<div class="btns" style="margin-top:14px">${!n ? '<button class="btn d" id="dl">Удалить</button>' : ""}<span class="sp"></span><button class="btn" id="cn">Отмена</button><button class="btn p" id="sv">Сохранить</button></div><div class="neg" id="er"></div>`);
	const q = (sel) => m.querySelector(sel);
	const refreshPolicy = () => {
		const temp = { importance: q("#fi").value, horizon: q("#fh").value };
		q("#reward-preview").textContent = "+" + taskReward(temp) + " XP";
		q("#penalty-preview").textContent = "−" + taskPenalty(temp, 0) + " XP";
		q("#goal-pct-wrap").style.display = q("#fg").value ? "flex" : "none";
	};
	["#fi", "#fh", "#fg"].forEach((sel) =>
		q(sel).addEventListener("change", refreshPolicy),
	);
	refreshPolicy();
	if (n) q("#fr").addEventListener("change", () => { q("#repeat-days-wrap").style.display = q("#fr").value === "n" ? "flex" : "none"; });
	const rs = () => {
		const b = q("#sb");
		if (b)
			b.innerHTML = subs
				.map(
					(v, i) =>
						`<div class="sl"><span>${esc(v.t)}</span><button data-i="${i}">✕</button></div>`,
				)
				.join("");
	};
	rs();
	if (!n) {
		q("#sa").onclick = () => {
			const v = q("#si").value.trim();
			if (v) {
				subs.push({ t: v, done: false });
				q("#si").value = "";
				rs();
			}
		};
		q("#sb").onclick = (e) => {
			const i = e.target.dataset.i;
			if (i != null) {
				subs.splice(+i, 1);
				rs();
			}
		};
	}
	q("#cn").onclick = closeM;
	if (q("#dl"))
		q("#dl").onclick = async () => {
			if (
				await ask(
					`${t.sid ? "Удалить всю серию" : "Удалить задачу"} «${t.title}»? Все даты этой серии будут удалены целиком.`,
					"Удалить",
					1,
				)
			) {
				const groupIds = new Set(S.tasks.filter((z) => (t.sid && z.sid === t.sid) || z.id === t.id).map((z) => z.id));
				S.led.filter((e) => groupIds.has(e.rel) && (e.type === "reward" || e.type === "penalty")).forEach((e) => apply("delete:" + e.rel + ":" + e.id, "undo", -e.amt, "Удаление задачи: " + t.title, e.rel));
				S.tasks = S.tasks.filter((z) => !groupIds.has(z.id));
				S.disc = S.disc.filter((e) => !groupIds.has(e.tid));
				recalculatePeak([...groupIds]);
				quests();
				streak();
				sync();
				S.hist.push({
					t: Date.now(),
					type: "del",
					txt: "Удалена задача: " + t.title,
				});
				save();
				closeM();
				render();
			}
		};
	q("#sv").onclick = async () => {
		const title = q("#ft").value.trim(),
			date = q("#fa").value,
			time = q("#fm").value,
			er = q("#er");
		if (!title) {
			er.textContent = "Введите название задачи.";
			return;
		}
		if (!date) {
			er.textContent = "Укажите дату.";
			return;
		}
		const f = {
			title,
			desc: q("#fd").value.trim(),
			mand: q("#fy").checked,
			importance: q("#fi").value,
			horizon: q("#fh").value,
			goalId: q("#fg").value,
			goalPct: Math.max(0.1, Math.min(100, Number(q("#fpct").value) || 1)),
		};
		if (n) {
			const rep = q("#fr").value;
			const customDays = rep === "n" ? Math.max(2, Math.min(365, Number(q("#repeat-days").value) || 30)) : 0;
			if (deadline({ date, time }) <= new Date()) {
				er.textContent = "Дата должна быть в будущем.";
				return;
			}
			const sid = rep ? uid() : undefined,
				goal = S.goals.find((g) => g.id === f.goalId),
				repeatUntil = rep && goal && goal.deadline ? goal.deadline : "",
				maxCount = rep === "n" ? customDays : rep === "d" ? (f.goalId ? 365 : 30) : rep === "wd" ? (f.goalId ? 260 : 22) : rep === "w" ? (f.goalId ? 52 : 12) : 1;
			const dates = [];
			let cursor = parse(date);
			while (dates.length < maxCount) {
				const dt = ymd(cursor);
				if (repeatUntil && dt > repeatUntil) break;
				if (rep !== "wd" || ![0, 6].includes(cursor.getDay())) dates.push(dt);
				if (!rep) break;
				cursor = addD(cursor, rep === "w" ? 7 : 1);
			}
			if (!dates.length) {
				er.textContent =
					"В выбранный период нет подходящих дат для повторения.";
				return;
			}
			const repeatHorizon = maxCount;
			const repeatUntilDate = rep === "n" ? ymd(addD(parse(date), customDays - 1)) : repeatUntil;
			for (const dt of dates) {
				S.tasks.push({
					id: uid(),
					sid,
					repeat: rep || "",
					repeatHorizon,
					repeatUntil: repeatUntilDate,
					repeatDays: rep === "n" ? customDays : 0,
					...f,
					date: dt,
					time,
					status: "active",
					created: Date.now(),
					subs: [],
					cyc: 0,
					paid: 0,
					moves: [],
					diff: 0,
					sev: 0,
					penaltyCount: 0,
					lastPenaltyDay: "",
				});
			}
			S.hist.push({
				t: Date.now(),
				type: "new",
				txt:
					"Создана задача: " +
					title +
					(dates.length > 1 ? " (×" + dates.length + ")" : ""),
			});
			V.y = +date.slice(0, 4);
			V.m = +date.slice(5, 7) - 1;
			V.selected = date;
		} else {
			if (!lock && (date !== t.date || time !== (t.time || ""))) {
				if (deadline({ date, time }) <= new Date()) {
					er.textContent = "Новый срок должен быть в будущем.";
					return;
				}
				if (
					!(await ask(
						"Перенести срок? Первоначальное действие останется в истории.",
						"Перенести",
					))
				)
					return;
				(t.moves = t.moves || []).push({
					from: t.date + " " + (t.time || ""),
					at: Date.now(),
				});
				S.hist.push({
					t: Date.now(),
					type: "move",
					txt: "Перенос: " + t.title,
				});
				t.date = date;
				t.time = time;
			}
			Object.assign(t, f);
			t.subs = subs;
		}
		process();
		sync();
		save();
		closeM();
		render();
	};
	setTimeout(() => q("#ft").focus(), 30);
}

async function toggle(id) {
	const t = S.tasks.find((x) => x.id === id);
	if (!t) return;
	if (t.status === "done") {
		if (ymd(new Date(t.doneAt)) !== ymd(new Date())) {
			toast("Отменить можно только в день выполнения");
			return;
		}
		if (
			!(await ask(
				"Отменить выполнение? Награда будет списана отдельной операцией в журнале.",
				"Отменить выполнение",
			))
		)
			return;
		if (t.paid)
			apply("undo:" + t.id + ":" + t.cyc, "undo", -t.paid, "Отмена выполнения: " + t.title, t.id);
		recalculatePeak([t.id]);
		t.cyc++;
		t.paid = 0;
		t.doneAt = null;
		t.late = false;
		t.status = deadline(t) < new Date() ? "overdue" : "active";
	} else {
		const late = t.status === "overdue";
		t.status = "done";
		t.doneAt = Date.now();
		t.late = late;
		if (late)
			toast("Выполнено с опозданием: штраф сохранён, XP не начисляется");
		else {
			t.paid = apply(
				"rw:" + t.id + ":" + t.cyc,
				"reward",
				taskReward(t),
				"Задача: " + t.title,
				t.id,
			);
			toast("+" + t.paid + " XP");
			pop("+" + t.paid + " XP");
		}
	}
	quests();
	streak();
	sync();
	save();
	render();
}

// Список задач выбранного дня.
function taskListHtml(selectedDay) {
	const items = S.tasks
		.filter((t) => t.date === selectedDay && t.status !== "cancelled" && t.status !== "done")
		.sort((a, b) => {
			const overdue = (b.status === "overdue") - (a.status === "overdue");
			if (overdue) return overdue;
			const important = (b.importance === "important") - (a.importance === "important");
			if (important) return important;
			return (a.time || "99:99").localeCompare(b.time || "99:99");
		});
	const expanded = !!V.tasksExpanded;
	const visible = expanded ? items : items.slice(0, 6);
	const rows = visible.map((t) => {
		const ov = t.status === "overdue";
		const goal = t.goalId ? S.goals.find((g) => g.id === t.goalId) : null;
		const tags = [
			`<span class="task-tag ${t.importance === "important" ? "important" : "normal"}">${t.importance === "important" ? "Важная" : "Обычная"}</span>`,
			`<span class="task-tag ${t.horizon === "long" ? "long" : "quick"}">${t.horizon === "long" ? "Долгосрочная" : "Быстрая"}</span>`,
			goal ? `<span class="task-tag goal">Цель: ${esc(goal.title)}</span>` : "",
			t.sid ? `<span class="task-tag repeat">Повторяющаяся</span>` : "",
		].filter(Boolean).join("");
		return `<div class="tc ${t.status} ${t.importance === "important" ? "is-important" : ""} ${t.horizon === "long" ? "is-long" : ""} ${goal ? "is-goal" : ""}"><button class="cb big ${ov ? "over" : ""}" data-act="tg" data-id="${t.id}" aria-label="Отметить: ${esc(t.title)}">${ov ? "!" : ""}</button><div class="tb"><button data-act="edit" data-id="${t.id}"><b>${esc(t.title)}</b></button><div class="task-tags">${tags}</div><small class="m">${t.time ? "до " + t.time : "на весь день"}${ov ? " · просрочено" : ""}</small></div><span class="task-reward"><b class="pos">+${taskReward(t)}</b><small class="neg">−${taskPenalty(t, 0)}</small></span></div>`;
	}).join("");
	return (rows || `<div class="empty">На выбранную дату нет активных задач. <button class="lnk" data-act="new" data-d="${selectedDay}">Добавить</button></div>`) + (items.length > 6 ? `<button class="btn task-expand" data-act="taskexpand">${expanded ? "Свернуть список" : `Показать все задачи · ${items.length}`}</button>` : "");
}

// Блок «Сегодня»: задачи выбранного дня и испытания.
function todayHtml(c) {
	const { td, selectedDay } = c;
	const tl = taskListHtml(selectedDay),
		qs = questsHtml(c);
	return `<section class="sec rv" id="td" data-spy><div class="two"><div class="card"><div class="ch"><div><h2>${selectedDay === td ? "Сегодня" : dayLabel(selectedDay)}</h2><small class="m">Задачи выбранной даты · отметь каждое выполненное действие</small></div><button class="add" data-act="new" data-d="${selectedDay}">${ic("plus", 16)} Задача</button></div>${tl}</div><div class="card"><div class="ch"><div><h2>Испытания</h2><small class="m">Ежедневные обновляются в полночь · еженедельные — в понедельник</small></div></div><div class="qs">${qs}</div></div></div></section>`;
}
