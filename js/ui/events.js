"use strict";
/* RAIKEN · Глобальные события: клавиатура и главный диспетчер кликов. */

addEventListener("keydown", (e) => {
	if (e.key === "Escape") {
		closeM();
		return;
	}
	const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(
		(e.target && e.target.tagName) || "",
	);
	if (
		!$("#mo") &&
		!e.altKey &&
		((!typing &&
			!e.ctrlKey &&
			!e.metaKey &&
			(e.key === "n" || e.key === "N" || e.key === "т" || e.key === "Т")) ||
			((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")))
	) {
		const add = document.querySelector(".rail-add");
		if (add) {
			e.preventDefault();
			add.click();
		}
		return;
	}
	if (
		!$("#mo") &&
		!typing &&
		!e.ctrlKey &&
		!e.metaKey &&
		!e.altKey &&
		(e.key === "t" || e.key === "T" || e.key === "е" || e.key === "Е")
	) {
		e.preventDefault();
		lookModal("theme");
		return;
	}
	if (e.key !== "Enter" || e.shiftKey || e.isComposing) return;
	const dialog = $("#mo .md"),
		target = e.target;
	if (
		!dialog ||
		!target ||
		target.tagName === "TEXTAREA" ||
		target.tagName === "SELECT" ||
		target.tagName === "BUTTON"
	)
		return;
	if (target.id === "si") {
		e.preventDefault();
		dialog.querySelector("#sa")?.click();
		return;
	}
	const saveButton = dialog.querySelector("#sv, #gsave, #name-save");
	if (saveButton && target.matches("input")) {
		e.preventDefault();
		saveButton.click();
	}
});

document.addEventListener("click", (e) => {
	const b = e.target.closest("[data-act]");
	if (!b) return;
	const a = b.dataset.act,
		id = b.dataset.id;
	try {
		if (a === "tg") {
			const r = b.getBoundingClientRect();
			PT = { x: r.left + r.width / 2, y: r.top };
			toggle(id);
		} else if (a === "edit") taskModal(S.tasks.find((t) => t.id === id));
		else if (a === "new") taskModal(null, b.dataset.d, b.dataset.goal);
		else if (a === "goalnew") goalModal(null);
		else if (a === "goaledt") {
			const g = S.goals.find((x) => x.id === id);
			if (g) goalModal(g);
		} else if (a === "selectday") {
			V.selected = b.dataset.date;
			render();
		} else if (a === "rank") rankModal();
		else if (a === "name") nameModal();
		else if (a === "frame") lookModal("frame");
		else if (a === "look") lookModal(b.dataset.tab || "theme");
		else if (a === "export") exportBackup();
		else if (a === "import") $("#backup-file").click();
		else if (a === "bnclear") {
			if (confirm("Удалить установленный баннер?")) {
				S.banner = "";
				save();
				render();
				toast("Баннер удалён");
			}
		} else if (a === "reset") resetProgress();
		else if (a === "allaw") allAwardsModal(b.dataset.k);
		else if (a === "awtab") {
			const root = $("#mo .md"),
				k = b.dataset.k,
				list = k === "m" ? MED : ACH,
				state = k === "m" ? S.med : S.ach;
			if (root) {
				root.dataset.awActive = k;
				root
					.querySelectorAll(".aw-tabs button")
					.forEach((x) => x.classList.toggle("on", x.dataset.k === k));
				root.querySelector("#aw-modal-title").textContent =
					k === "m" ? "Медали" : "Достижения";
				root.querySelector("#aw-gallery").innerHTML = awardGallery(k);
			}
		} else if (a === "av") $("#avf").click();
		else if (a === "bn") $("#bnf").click();
		else if (a === "bnedit") bannerEditor();
		else if (a === "sl" || a === "sr")
			$(".mx").scrollBy({
				left: a === "sl" ? -320 : 320,
				behavior: "smooth",
			});
		else if (a === "today") {
			const n = new Date();
			V.y = n.getFullYear();
			V.m = n.getMonth();
			V.selected = ymd(n);
			V.wk = ymd(mon(n));
			CENTER = true;
			render();
		} else if (a === "wp" || a === "wn") {
			V.wk = ymd(addD(parse(V.wk), a === "wp" ? -7 : 7));
			render();
		} else if (a === "md") {
			V.mode = b.dataset.m;
			CENTER = true;
			render();
		} else if (a === "addat") taskModal(null, b.dataset.d);
		else if (a === "go") {
			const e = document.getElementById(b.dataset.to);
			if (e) e.scrollIntoView({ behavior: "smooth", block: "start" });
		} else if (a === "taskexpand") {
			V.tasksExpanded = !V.tasksExpanded;
			render();
		} else if (RIT.handle(a, b) || REV.handle(a, b)) {
		} else if (a === "errlog") errModal();
		else if (a === "aw") awardModal(b.dataset.k, b.dataset.id);
		else if (a === "af") {
			AF = b.dataset.c;
			render();
		} else if (a === "mo") {
			V.m = +b.dataset.i;
			CENTER = true;
			render();
		} else if (a === "yr") {
			V.y += +b.dataset.d;
			CENTER = true;
			render();
		} else if (a === "open") {
			OPEN[id] = !OPEN[id];
			render();
		} else if (a === "sub") {
			const t = S.tasks.find((x) => x.id === id);
			if (t && t.subs[+b.dataset.i]) {
				t.subs[+b.dataset.i].done = !t.subs[+b.dataset.i].done;
				sync();
				save();
				render();
			}
		}
	} catch (err) {
		toast("Ошибка: " + err.message, 1);
	}
});
