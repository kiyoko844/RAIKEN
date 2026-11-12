"use strict";
/* RAIKEN · Планировщик: проверка просрочек и смены дня. */

let lastQuestDay = ymd(new Date());

function tick() {
	try {
		const today = ymd(new Date());
		if (today !== lastQuestDay) {
			lastQuestDay = today;
			save();
			render();
			return;
		}
		if (process()) render();
	} catch (e) {
		ICE.logErr(e, "tick");
	}
}
