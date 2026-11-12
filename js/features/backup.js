"use strict";
/* RAIKEN · Резервная копия: экспорт, импорт, сброс прогресса. */

function exportBackup() {
	try {
		if (!STORAGE_SAFE)
			throw new Error(
				"Сохранение не загружено безопасно; экспорт заблокирован во избежание пустой копии.",
			);
		flush();
		const payload = {
			format: "raiken-backup",
			version: 1,
			exportedAt: new Date().toISOString(),
			state: S,
		};
		const blob = new Blob([JSON.stringify(payload, null, 2)], {
			type: "application/json",
		});
		const url = URL.createObjectURL(blob),
			a = document.createElement("a");
		a.href = url;
		a.download = `RAIKEN-backup-${ymd(new Date())}.json`;
		document.body.appendChild(a);
		a.click();
		a.remove();
		setTimeout(() => URL.revokeObjectURL(url), 1500);
		toast("Резервная копия подготовлена");
	} catch (e) {
		toast("Не удалось создать резервную копию", true);
	}
}

document.addEventListener("change", async (e) => {
	if (e.target.id !== "backup-file") return;
	const file = e.target.files && e.target.files[0];
	e.target.value = "";
	if (!file) return;
	if (file.size > 12 * 1024 * 1024) {
		toast("Файл резервной копии слишком большой", true);
		return;
	}
	try {
		const parsed = JSON.parse(await file.text());
		const candidate =
			parsed && parsed.format === "raiken-backup" ? parsed.state : parsed;
		if (
			!candidate ||
			typeof candidate !== "object" ||
			Array.isArray(candidate) ||
			!Array.isArray(candidate.tasks) ||
			!Number.isFinite(Number(candidate.cur))
		)
			throw new Error("Неверный формат резервной копии");
		if (
			!(await ask(
				"Текущий прогресс будет заменён данными из резервной копии. Продолжить?",
				"Импортировать",
				true,
			))
		)
			return;
		clearTimeout(tm);
		localStorage.setItem(KEY, JSON.stringify(candidate));
		S = load();
		streak();
		process();
		flush();
		render();
		toast("Резервная копия успешно восстановлена");
	} catch (err) {
		toast(
			"Не удалось импортировать файл: " + (err.message || "ошибка формата"),
			true,
		);
	}
});

async function resetProgress() {
	const m = modal(
		`<h3>Сбросить весь прогресс?</h3><div class="reset-warning">Это действие удалит весь игровой прогресс без возможности восстановления: опыт XP, ранги, медали, достижения, серии, задачи, календарь, статистику и историю.</div><p>Аватарка и записи недельных обзоров останутся. Остальные данные будут возвращены к начальному состоянию.</p><div class="btns"><button class="btn" id="reset-cancel">Отмена</button><button class="btn d" id="reset-confirm">Да, удалить всё</button></div>`,
	);
	m.querySelector("#reset-cancel").onclick = closeM;
	m.querySelector("#reset-confirm").onclick = () => {
		const avatar = S.avatar,
			avatarFrame = ICE.frameOk(S.avatarFrame),
			reviews = S.rev;
		clearTimeout(tm);
		S = def();
		if (avatar) S.avatar = avatar;
		S.avatarFrame = avatarFrame;
		S.rev = reviews || {};

		V = {
			y: new Date().getFullYear(),
			m: new Date().getMonth(),
			selected: ymd(new Date()),
			mode: "m",
			wk: ymd(mon(new Date())),
		};
		lastQuestDay = ymd(new Date());
		OPEN = {};
		flush();
		closeM();
		render();
		toast("Прогресс сброшен. Аватарка и обзоры сохранены.");
	};
}

// Нижняя зона: резервная копия, журнал ошибок, сброс.
function resetZoneHtml() {
	return `<div class="reset-zone rv"><div class="backup-actions"><div><b>Резервная копия прогресса</b><small>Сохрани данные отдельно, чтобы не потерять историю за месяцы и годы.</small></div><button class="btn" data-act="export" type="button">${ic("vault", 16)} Экспорт</button><button class="btn" data-act="import" type="button">${ic("history", 16)} Импорт</button><input id="backup-file" type="file" accept="application/json,.json" hidden></div><button class="reset-link" data-act="errlog" type="button">Журнал ошибок</button><button class="reset-link" data-act="reset" type="button">↻ Сбросить весь прогресс</button></div>`;
}
