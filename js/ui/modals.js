"use strict";
/* RAIKEN · Каркас окон: модальное окно, подтверждение, журнал ошибок. */

// ---- Модальные окна
function modal(h, big, side) {
	closeM();
	const o = document.createElement("div");
	o.id = "mo";
	o.innerHTML = `<div class="md ${big ? "big" : ""} ${side ? "side" : ""}" role="dialog" aria-modal="true">${h}</div>`;
	o.addEventListener("mousedown", (e) => {
		if (e.target === o) closeM();
	});
	document.body.appendChild(o);
	return o.firstChild;
}

function closeM() {
	const o = $("#mo");
	if (o) {
		const dialog = o.querySelector(".md");
		if (dialog && typeof dialog._cancelPending === "function") {
			const cancel = dialog._cancelPending;
			dialog._cancelPending = null;
			cancel(false);
		}
		o.remove();
	}
	if (AWBusy) AWBusy = false;
	if (AWQ.length) setTimeout(showNextAward, 220);
}

function ask(msg, ok, danger) {
	return new Promise((res) => {
		const m = modal(
			`<h3>Подтверждение</h3><p>${esc(msg)}</p><div class="btns"><button class="btn" id="n">Назад</button><button class="btn ${danger ? "d" : "p"}" id="y">${esc(ok || "Подтвердить")}</button></div>`,
		);
		let settled = false;
		const finish = (value) => {
			if (settled) return;
			settled = true;
			m._cancelPending = null;
			closeM();
			res(value);
		};
		m._cancelPending = (value) => {
			if (settled) return;
			settled = true;
			res(value);
		};
		m.querySelector("#n").onclick = () => finish(false);
		m.querySelector("#y").onclick = () => finish(true);
	});
}

function errModal() {
	const L = ICE.ERRLOG.slice().reverse();
	const m = modal(
		`<h3>Журнал ошибок</h3><p class="m">${L.length ? "События текущей сессии. Если что-то работает не так, эти строки помогут найти причину." : "В этой сессии ошибок не было."}</p><div class="errlog">${L.map((x) => `<div><b>${new Date(x.t).toLocaleTimeString("ru-RU")}</b> <span>${esc(x.where)}</span> ${esc(x.msg)}</div>`).join("")}</div><div class="btns"><button class="btn" id="errc" type="button">Закрыть</button></div>`,
	);
	m.querySelector("#errc").onclick = closeM;
}
