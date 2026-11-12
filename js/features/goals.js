"use strict";
/* RAIKEN · Долгосрочные цели: прогресс, карточки, окно цели. */

function goalProgress(goal) {
	const earned = S.tasks
		.filter((t) => t.goalId === goal.id && t.status === "done" && !t.late)
		.reduce((sum, t) => sum + (Number(t.goalPct) || 0), 0);
	return Math.max(
		0,
		Math.min(100, Math.round((Number(goal.basePct || 0) + earned) * 10) / 10),
	);
}

function goalsHtml() {
	if (!S.goals.length)
		return `<div class="goal-empty"><div class="goal-empty-mark">◎</div><div><b>Пока нет долгосрочных целей</b><p>Создай цель с конечным сроком и связывай с ней ежедневные действия — прогресс будет расти автоматически.</p></div><button class="add" data-act="goalnew">＋ Создать цель</button></div>`;
	return `<div class="goal-grid">${S.goals
		.filter((g) => !g.archived)
		.map((g) => {
			const p = goalProgress(g),
				linked = S.tasks.filter((t) => t.goalId === g.id).length,
				done = S.tasks.filter(
					(t) => t.goalId === g.id && t.status === "done" && !t.late,
				).length;
			return `<article class="goal-card"><div class="goal-top"><span class="goal-kicker">ДОЛГОСРОЧНАЯ ЦЕЛЬ</span><button class="goal-edit" data-act="goaledt" data-id="${g.id}">•••</button></div><h3>${esc(g.title)}</h3><p>${esc(g.target || "Желаемый результат")}</p><div class="goal-progress-head"><b>${p}%</b><span>${done} выполнений · ${linked} действий связано</span></div><div class="goal-track"><i style="width:${p}%"></i></div><div class="goal-foot"><span>${g.deadline ? "Срок: " + g.deadline.split("-").reverse().join(".") : "Без конечного срока"}</span><button data-act="new" data-d="${ymd(new Date())}" data-goal="${g.id}">＋ Добавить действие</button></div></article>`;
		})
		.join("")}</div>`;
}

function goalModal(goal) {
	const isNew = !goal,
		g = goal || { title: "", target: "", deadline: "" };
	const m = modal(
		`<div class="task-modal-head"><span class="eyebrow">ЛИЧНЫЙ ПРОГРЕСС</span><h3>${isNew ? "Новая долгосрочная цель" : "Настройки цели"}</h3><p>Её прогресс будет автоматически расти за счёт связанных выполненных действий.</p></div><label>Название цели<input id="gt" maxlength="90" value="${esc(g.title)}" placeholder="Например, английский до A2"></label><label>Какой результат хочешь получить?<textarea id="gdesc" rows="2" maxlength="300">${esc(g.target || "")}</textarea></label><label>Крайний срок<input id="gdate" type="date" value="${g.deadline || ""}"></label><div class="btns">${isNew ? "" : '<button class="btn d" id="gdel">Удалить цель</button>'}<span class="sp"></span><button class="btn" id="gcancel">Отмена</button><button class="btn p" id="gsave">Сохранить цель</button></div><div class="neg" id="gerr"></div>`,
	);
	m.querySelector("#gcancel").onclick = closeM;
	if (!isNew)
		m.querySelector("#gdel").onclick = async () => {
			if (
				await ask(
					`Удалить цель «${g.title}»? Связанные задачи останутся, но отвяжутся от цели.`,
					"Удалить",
					true,
				)
			) {
				S.goals = S.goals.filter((x) => x.id !== g.id);
				S.tasks
					.filter((t) => t.goalId === g.id)
					.forEach((t) => {
						t.goalId = "";
					});
				S.hist.push({
					t: Date.now(),
					type: "goal",
					txt: "Удалена цель: " + g.title,
				});
				sync();
				save();
				closeM();
				render();
			}
		};
	m.querySelector("#gsave").onclick = () => {
		const title = m.querySelector("#gt").value.trim();
		if (!title) {
			m.querySelector("#gerr").textContent = "Укажи название цели.";
			return;
		}
		if (isNew)
			S.goals.push({
				id: uid(),
				title,
				target: m.querySelector("#gdesc").value.trim(),
				deadline: m.querySelector("#gdate").value,
				created: Date.now(),
				basePct: 0,
			});
		else {
			Object.assign(g, {
				title,
				target: m.querySelector("#gdesc").value.trim(),
				deadline: m.querySelector("#gdate").value,
			});
			S.tasks
				.filter((t) => t.goalId === g.id)
				.forEach((t) => (t.repeatUntil = g.deadline || ""));
		}
		S.hist.push({
			t: Date.now(),
			type: "goal",
			txt: (isNew ? "Создана цель: " : "Изменена цель: ") + title,
		});
		sync();
		save();
		closeM();
		render();
	};
}

// Раздел «Долгосрочный прогресс».
function goalsSectionHtml() {
	return `<section class="sec life-goals rv" id="goals" data-spy><div class="ch"><div><h2>Долгосрочный прогресс</h2><small class="m">Результаты, к которым ты идёшь</small></div><button class="add" data-act="goalnew">＋ Новая цель</button></div>${goalsHtml()}</section>`;
}
