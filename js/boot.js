"use strict";
/* RAIKEN · Запуск: загрузка состояния, первый рендер, таймер и возврат на вкладку. */

try {
	S = load();
	ICE.applyLook(S.look);
	streak();
	process();
	flush();
	render();
	ICE.hydrate(S, () => render());
} catch (e) {
	ICE.logErr(e, "boot");
	S = def();
	ICE.applyLook(S.look);
	render();
	toast(
		"Не удалось безопасно загрузить сохранение: " +
			(e && e.message ? e.message : "ошибка") +
			" Данные не затронуты — запись заблокирована.",
		true,
	);
}

setInterval(tick, 20000);

document.addEventListener("visibilitychange", () => {
	if (!document.hidden) {
		try {
			streak();
			tick();
			save();
			render();
		} catch (e) {
			ICE.logErr(e, "visibility");
		}
	}
});
