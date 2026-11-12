"use strict";
/* RAIKEN · Ранги: архив рангов и сцена повышения. */

function rankModal() {
	const current = Math.max(0, S.shown || rankOf(S.cur));
	const next = Math.min(MAX_RANK, current + 1);
	const from = current ? thr(current) : 0,
		target = thr(next);
	const progress =
		current >= MAX_RANK
			? 100
			: Math.max(
					0,
					Math.min(100, ((S.cur - from) / Math.max(1, target - from)) * 100),
				);
	const remaining = Math.max(0, target - S.cur);
	const m = modal(
		`<div class="rank-drawer-head"><div><small class="m">ТВОЙ ПУТЬ</small><h3>Лестница рангов</h3></div><button class="btn" id="c">Закрыть</button></div><div class="rank-progress-card"><div class="rank-progress-kicker"><span>ТЕКУЩИЙ ОПЫТ</span></div><div class="rank-progress-numbers"><strong>${num(S.cur)} <small>XP</small></strong><span>${current >= MAX_RANK ? "MAX" : num(target) + " XP"}</span></div><div class="rank-progress-track"><i style="width:${progress.toFixed(1)}%"></i></div><p>${current >= MAX_RANK ? "Ты достиг максимального ранга" : `Ещё <b>${num(remaining)} XP</b> до ${esc(rankName(next))}`}</p><small>Текущий ранг: ${esc(rankName(current))}</small></div><div class="rank-list-label">ВСЕ РАНГИ · ${current} ИЗ ${MAX_RANK}</div><div class="rg60">${NAMES.map(
			(n, i) => {
				const k = i + 1,
					u = S.unl[k] || (k <= current ? 1 : 0),
					left = Math.max(0, thr(k) - S.cur);
				return `<div class="rc ${k === current ? "cur" : ""} ${u ? "" : "lk"}">${emb(k, !u)}<b>${k}. ${esc(n)}</b><span>${num(thr(k))} XP</span><span>${u ? "достигнут" : `ещё ${num(left)} XP`}</span></div>`;
			},
		).join("")}</div>`,
		false,
		true,
	);
	m.querySelector("#c").onclick = closeM;
}

function levelUp(n) {
	const m = modal(
		`<div class="lvl"><small>НОВЫЙ РАНГ</small><div class="le">${emb(n)}</div><h3>${esc(rankName(n))}</h3><p class="m">Ранг ${n} из ${MAX_RANK} · ${num(thr(n))} XP</p><div class="btns" style="justify-content:center"><button class="btn p" id="ok">Продолжить</button></div></div>`,
	);
	m.querySelector("#ok").onclick = closeM;
	const e = m.querySelector(".le");
	if (G) {
		G.from(e, {
			scale: 0.2,
			rotation: -90,
			opacity: 0,
			duration: 0.9,
			ease: "back.out(1.6)",
		});
		G.from(m.querySelectorAll("h3,small,p"), {
			y: 14,
			opacity: 0,
			stagger: 0.1,
			delay: 0.3,
			duration: 0.5,
		});
	}
	const b = e.getBoundingClientRect();
	burst(b.left + b.width / 2, b.top + b.height / 2, "#dde7ed", 36);
}
