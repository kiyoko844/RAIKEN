"use strict";
/* RAIKEN · Формулы рангов и наград: пороги XP, награда и штраф за задачу, дедлайн, название ранга. */

const thr = (n) =>
	Math.round(
		100 +
			1499900 * Math.pow(Math.max(1, Math.min(MAX_RANK, n)) / MAX_RANK, 1.72),
	);

const taskReward = (t) => {
	const base = t && t.horizon === "long" ? 200 : 120;
	return Math.round(base * (t && t.importance === "important" ? 1.5 : 1));
};

const taskPenalty = (t, escalation = 0) => {
	const base =
		(t && t.horizon === "long" ? 400 : 250) +
		(t && t.importance === "important" ? 150 : 0);
	return base + Math.max(0, escalation) * 100;
};

const rankOf = (x) => {
	let r = 0;
	for (let n = 1; n <= MAX_RANK; n++) if (x >= thr(n)) r = n;
	return r;
};

const deadline = (t) => new Date(t.date + "T" + (t.time || "23:59:59.999"));

const rankName = (n) => (n ? NAMES[n - 1] : "Без ранга");
