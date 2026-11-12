"use strict";
/* RAIKEN · Состояние приложения (S, V), загрузка с проверкой данных, сохранение, тосты и журнал. */

let STORAGE_SAFE = false;

let S,
	V = {
		y: new Date().getFullYear(),
		m: new Date().getMonth(),
		selected: ymd(new Date()),
		mode: "m",
		wk: ymd(mon(new Date())),
	},
	OPEN = {},
	AWQ = [],
	AWBusy = false;

V.mode = "m";

V.wk = ymd(mon(new Date()));

const def = () => ({
	tasks: [],
	goals: [],
	led: [],
	keys: {},
	qrev: {},
	hist: [],
	disc: [],
	cur: 0,
	life: 0,
	peak: 0,
	peakRel: "",
	shown: 0,
	unl: {},
	warn: null,
	st: { cur: 0, best: 0, last: "", sh: "" },
	name: "Игрок",
	banner: "",
	bannerFit: "cover",
	bannerX: 50,
	bannerY: 50,
	avatar: "",
	avatarFrame: "classic",
	rit: [],
	ritb: {},
	rev: {},
	look: ICE.lookClean({}),

	ach: {},
	med: {},
	awardSignature: "",
	awardCooldowns: {},
	createdAt: 0,
});

function load() {
	let o = def();
	const raw = localStorage.getItem(KEY);
	if (raw) {
		let r;
		try {
			r = JSON.parse(raw);
		} catch (e) {
			const backup = localStorage.getItem(KEY + ".backup");
			if (!backup)
				throw new Error("Сохранение повреждено, резервная копия отсутствует.");
			try {
				r = JSON.parse(backup);
			} catch (_) {
				throw new Error("Основное сохранение и резервная копия повреждены.");
			}
			if (!r || typeof r !== "object")
				throw new Error("Резервная копия имеет неверный формат.");
			try {
				localStorage.setItem(KEY, backup);
			} catch (_) {}
		}
		const validRecord = (v) =>
			!!v &&
			typeof v === "object" &&
			!Array.isArray(v) &&
			["tasks", "goals", "led", "hist", "disc"].every(
				(k) => v[k] === undefined || Array.isArray(v[k]),
			) &&
			["cur", "life", "peak", "shown"].every(
				(k) => v[k] === undefined || Number.isFinite(v[k]),
			) &&
			["keys", "unl", "ach", "med", "awardCooldowns"].every(
				(k) =>
					v[k] === undefined ||
					(!!v[k] && typeof v[k] === "object" && !Array.isArray(v[k])),
			);
		if (!validRecord(r)) {
			const backup = localStorage.getItem(KEY + ".backup");
			let recovered = null;
			try {
				recovered = backup ? JSON.parse(backup) : null;
			} catch (_) {}
			if (!validRecord(recovered))
				throw new Error(
					"Основное сохранение и резервная копия имеют неверный формат.",
				);
			r = recovered;
			try {
				localStorage.setItem(KEY, backup);
			} catch (_) {}
		}
		o = Object.assign(o, r);
		if (o.bannerFit === "contain") o.bannerFit = "cover";
	}
	STORAGE_SAFE = true;
	for (const k of ["tasks", "goals", "led", "hist", "disc"])
		if (!Array.isArray(o[k])) o[k] = [];
	for (const k of ["cur", "life", "peak", "shown"])
		if (!Number.isFinite(o[k])) o[k] = 0;
	o.peakRel = typeof o.peakRel === "string" ? o.peakRel : "";
	if (!o.keys || typeof o.keys !== "object") o.keys = {};
	if (!o.qrev || typeof o.qrev !== "object" || Array.isArray(o.qrev)) o.qrev = {};
	if (!o.unl || typeof o.unl !== "object") o.unl = {};
	o.st = Object.assign({ cur: 0, best: 0, last: "", sh: "" }, o.st || {});
	o.name = String(o.name || "Игрок").slice(0, 24);
	ICE.mark(o);
	o.banner =
		typeof o.banner === "string" && o.banner.startsWith("data:image/")
			? o.banner
			: "";
	o.bannerFit = o.bannerFit === "cover" ? "cover" : "contain";
	o.bannerX = Number.isFinite(+o.bannerX)
		? Math.max(0, Math.min(100, +o.bannerX))
		: 50;
	o.bannerY = Number.isFinite(+o.bannerY)
		? Math.max(0, Math.min(100, +o.bannerY))
		: 50;
	o.avatar =
		typeof o.avatar === "string" && o.avatar.startsWith("data:image/")
			? o.avatar
			: "";
	o.avatarFrame = ICE.frameOk(o.avatarFrame);
	o.rit = RIT.clean(o.rit);
	o.ritb = RIT.cleanB(o.ritb);
	o.rev = REV.clean(o.rev);
	o.look = ICE.lookClean(o.look);

	o.awardCooldowns =
		o.awardCooldowns &&
		typeof o.awardCooldowns === "object" &&
		!Array.isArray(o.awardCooldowns)
			? o.awardCooldowns
			: {};
	o.createdAt =
		Number.isFinite(+o.createdAt) && +o.createdAt > 0
			? +o.createdAt
			: o.tasks.length
				? Math.min(...o.tasks.map((t) => Number(t && t.created) || Date.now()))
				: Date.now();
	o.ach = o.ach && typeof o.ach === "object" ? o.ach : {};
	o.med = o.med && typeof o.med === "object" ? o.med : {};
	o.awardSignature =
		typeof o.awardSignature === "string" ? o.awardSignature : "";
	o.tasks = o.tasks.filter(
		(t) => t && t.id && /^\d{4}-\d\d-\d\d$/.test(t.date),
	);
	o.tasks.forEach((t) => {
		t.diff = 0;
		t.sev = 0;
		t.title = String(t.title || "Задача").slice(0, 80);
		t.desc = String(t.desc || "").slice(0, 300);
		t.status = ["active", "done", "overdue", "cancelled"].includes(t.status)
			? t.status
			: "active";
		t.importance = t.importance === "important" ? "important" : "normal";
		t.horizon = t.horizon === "long" ? "long" : "quick";
		t.goalPct = Number.isFinite(+t.goalPct)
			? Math.max(0, Math.min(100, +t.goalPct))
			: 1;
		t.goalId = typeof t.goalId === "string" ? t.goalId : "";
		t.time = /^([01]\d|2[0-3]):[0-5]\d$/.test(t.time || "") ? t.time : "";
		t.created = Number.isFinite(+t.created) ? +t.created : Date.now();
		t.doneAt = Number.isFinite(+t.doneAt) ? +t.doneAt : null;
		t.subs = Array.isArray(t.subs)
			? t.subs
					.filter((x) => x && typeof x === "object")
					.map((x) => ({ t: String(x.t || "").slice(0, 60), done: !!x.done }))
					.filter((x) => x.t)
			: [];
		t.penaltyCount = Number.isFinite(+t.penaltyCount)
			? Math.max(0, +t.penaltyCount)
			: 0;
		t.lastPenaltyDay =
			typeof t.lastPenaltyDay === "string" ? t.lastPenaltyDay : "";
		t.paid = Number.isFinite(+t.paid) ? +t.paid : 0;
		t.cyc = Number.isFinite(+t.cyc) ? Math.max(0, +t.cyc) : 0;
	});
	o.goals = Array.isArray(o.goals)
		? o.goals.filter((g) => g && typeof g === "object")
		: [];
	o.goals.forEach((g) => {
		g.id = String(g.id || uid());
		g.title = String(g.title || "Цель").slice(0, 90);
		g.target = String(g.target || "").slice(0, 300);
		g.deadline = /^\d{4}-\d\d-\d\d$/.test(g.deadline || "") ? g.deadline : "";
		g.created = Number.isFinite(+g.created) ? +g.created : Date.now();
		g.basePct = Number.isFinite(+g.basePct)
			? Math.max(0, Math.min(100, +g.basePct))
			: 0;
	});
	o.hist = o.hist.filter(
		(x) => x && typeof x === "object" && Number.isFinite(+x.t),
	);
	o.led = o.led.filter(
		(x) => x && typeof x === "object" && Number.isFinite(+x.t),
	);
	o.disc = o.disc.filter(
		(x) => x && typeof x === "object" && Number.isFinite(+x.t),
	);
	o.st.cur = Number.isFinite(+o.st.cur) ? Math.max(0, +o.st.cur) : 0;
	o.st.best = Number.isFinite(+o.st.best) ? Math.max(0, +o.st.best) : 0;
	o.st.last = typeof o.st.last === "string" ? o.st.last : "";
	o.st.sh = typeof o.st.sh === "string" ? o.st.sh : "";
	// Старые сохранения использовали прежнюю короткую кривую рангов.
	// Оставляем исторические ранги только в пределах нового XP-порога.
	const recalculatedRank = rankOf(o.cur);
	Object.keys(o.unl).forEach((k) => {
		const rank = Number(k);
		if (!Number.isInteger(rank) || rank < 1 || rank > recalculatedRank)
			delete o.unl[k];
	});
	o.tasks.forEach((t) => {
		t.subs = Array.isArray(t.subs) ? t.subs : [];
		t.cyc = t.cyc | 0;
		t.paid = t.paid | 0;
		t.repeatDays = Number.isFinite(+t.repeatDays) ? Math.max(0, Math.min(365, +t.repeatDays)) : 0;
		t.title = String(t.title || "");
		const prior = o.disc.filter(
			(e) => e.tid === t.id && e.type === "Просрочка",
		);
		if (!t.penaltyCount && prior.length) t.penaltyCount = prior.length;
		if (!t.lastPenaltyDay && prior.length)
			t.lastPenaltyDay = ymd(new Date(prior[prior.length - 1].t));
	});
	return o;
}

let tm;

const flush = () => {
	if (!STORAGE_SAFE || !S) {
		toast(
			"Сохранение заблокировано: сначала восстанови корректные данные.",
			true,
		);
		return false;
	}
	try {
		if (S.led.length > 5000) S.led = S.led.slice(-5000);
		const json = ICE.serialize(S);
		const previous = localStorage.getItem(KEY);
		if (previous && previous !== json) {
			try {
				localStorage.setItem(KEY + ".backup", previous);
			} catch (_) {}
		}
		localStorage.setItem(KEY, json);
		return true;
	} catch (e) {
		ICE.logErr(e, "flush");
		if (
			e &&
			(e.name === "QuotaExceededError" ||
				e.name === "NS_ERROR_DOM_QUOTA_REACHED")
		)
			toast(
				"Не хватает места в хранилище. Уменьши размер баннера или аватара.",
				true,
			);
		else toast("Не удалось сохранить данные браузера.", true);
		return false;
	}
};

const save = () => {
	clearTimeout(tm);
	tm = setTimeout(flush, 150);
};

addEventListener("pagehide", flush);

function toast(m, neg) {
	const e = document.createElement("div");
	e.className = "to" + (neg ? " neg" : "");
	e.textContent = m;
	$("#ts").appendChild(e);
	setTimeout(() => e.remove(), 4200);
}

function note(type, txt, neg) {
	S.hist.push({ t: Date.now(), type, txt });
	if (S.hist.length > 300) S.hist.shift();
	toast(txt, neg);
}
