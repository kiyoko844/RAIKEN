"use strict";
/* RAIKEN · Профиль: имя, баннер, рамка аватара, загрузка картинок. */

function nameModal() {
	const m = modal(
		`<div class="name-modal-head"><div><small class="eyebrow">ПРОФИЛЬ ИГРОКА</small><h3>Имя или никнейм</h3><p class="m">Так тебя будут видеть в RAIKEN®</p></div><button class="btn" id="name-cancel">Закрыть</button></div><label class="name-field">Новый никнейм<input id="name-value" maxlength="24" value="${esc(S.name || "Игрок")}" placeholder="Например, RAIKEN"></label><div class="name-hint">До 24 символов. Можно использовать буквы, цифры и пробелы.</div><div class="btns"><button class="btn p" id="name-save">Сохранить имя</button></div>`,
	);
	m.querySelector("#name-cancel").onclick = closeM;
	const input = m.querySelector("#name-value");
	m.querySelector("#name-save").onclick = () => {
		const value = input.value.trim().replace(/\s+/g, " ").slice(0, 24);
		if (!value) {
			input.focus();
			toast("Введите имя или никнейм", 1);
			return;
		}
		S.name = value;
		sync();
		save();
		closeM();
		render();
		toast("Имя профиля обновлено");
	};
	input.focus();
	input.select();
}

function bannerEditor() {
	if (!S.banner) return;
	let fit = S.bannerFit || "cover",
		x = S.bannerX ?? 50,
		y = S.bannerY ?? 50;
	const m = modal(
		`<div class="rank-drawer-head"><div><small class="eyebrow">РЕДАКТОР ПРОФИЛЯ</small><h3>Настройка баннера</h3><p class="m">Выбери режим отображения и положение изображения. Предпросмотр показывает результат до сохранения.</p></div><button class="btn" id="be-close">Закрыть</button></div><div id="banner-preview" class="banner-editor-preview"></div><div class="banner-fit-options"><button class="btn ${fit === "contain" ? "p" : ""}" data-bfit="contain">Вместить</button><button class="btn ${fit === "cover" ? "p" : ""}" data-bfit="cover">Заполнить</button></div><label>Положение по горизонтали <b id="banner-x-value">${x}%</b><input id="banner-x" type="range" min="0" max="100" value="${x}"></label><label>Положение по вертикали <b id="banner-y-value">${y}%</b><input id="banner-y" type="range" min="0" max="100" value="${y}"></label><div class="btns"><button class="btn" id="be-reset">Сбросить положение</button><span class="sp"></span><button class="btn" id="be-cancel">Отмена</button><button class="btn p" id="be-save">Сохранить</button></div>`,
	);
	const preview = m.querySelector("#banner-preview"),
		paint = () => {
			preview.style.backgroundImage = `linear-gradient(0deg,rgba(5,9,14,.12),transparent),url('${S.banner}')`;
			preview.style.backgroundSize = `cover,${fit}`;
			preview.style.backgroundPosition = `center,${x}% ${y}%`;
			m.querySelectorAll("[data-bfit]").forEach((b) =>
				b.classList.toggle("p", b.dataset.bfit === fit),
			);
		};
	m.querySelector("#be-close").onclick = m.querySelector("#be-cancel").onclick =
		closeM;
	m.querySelectorAll("[data-bfit]").forEach(
		(b) =>
			(b.onclick = () => {
				fit = b.dataset.bfit;
				paint();
			}),
	);
	m.querySelector("#banner-x").oninput = (e) => {
		x = +e.target.value;
		m.querySelector("#banner-x-value").textContent = x + "%";
		paint();
	};
	m.querySelector("#banner-y").oninput = (e) => {
		y = +e.target.value;
		m.querySelector("#banner-y-value").textContent = y + "%";
		paint();
	};
	m.querySelector("#be-reset").onclick = () => {
		x = 50;
		y = 50;
		m.querySelector("#banner-x").value = 50;
		m.querySelector("#banner-y").value = 50;
		m.querySelector("#banner-x-value").textContent = "50%";
		m.querySelector("#banner-y-value").textContent = "50%";
		paint();
	};
	m.querySelector("#be-save").onclick = () => {
		S.bannerFit = fit;
		S.bannerX = x;
		S.bannerY = y;
		save();
		closeM();
		render();
		toast("Настройки баннера сохранены");
	};
	paint();
}

function frameModal() {
	lookModal("frame");
}

// Окно «Оформление»: темы персонажей, рамки аватара и живой фон.
function lookModal(tab) {
	let cur = tab || "theme",
		grp = null;
	const ini = esc((S.name || "R")[0].toUpperCase());
	const face = S.avatar
		? `<span class="av2"><img src="${ICE.imgSrc(S.avatar)}" alt=""></span>`
		: `<span class="av2"><span>${ini}</span></span>`;
	const m = modal(
		`<div class="look"><aside class="look-pv"><div class="look-stage"></div><b class="look-name">${esc(S.name)}</b><span class="look-sub" id="look-sub"></span><div class="look-sw" id="look-sw"></div></aside><div class="look-main"><div class="look-head"><div><small class="eyebrow">ОФОРМЛЕНИЕ</small><h3>Тема и рамка</h3></div><button class="btn" id="look-x" type="button">Готово</button></div><div class="look-tabs" role="tablist"><button type="button" data-t="theme">Темы</button><button type="button" data-t="frame">Рамки</button><button type="button" data-t="bg">Фон</button></div><div class="look-body"></div></div></div>`,
		true,
	);
	m.parentElement.classList.add("look-mo");
	m.classList.add("look-md");
	const body = m.querySelector(".look-body"),
		stage = m.querySelector(".look-stage");
	const frameCfg = () =>
		ICE.FRAMES.find((f) => f.id === ICE.frameOk(S.avatarFrame));
	const paintPreview = () => {
		stage.innerHTML = ICE.frameStage(S.avatarFrame, face, "big");
		const t = ICE.themeById(S.look.theme),
			f = frameCfg();
		m.querySelector("#look-sub").textContent =
			t.name + " · " + (f ? f.name : "");
		m.querySelector("#look-sw").innerHTML = t.p
			.map((c) => `<i style="background:rgb(${c})"></i>`)
			.join("");
	};
	const themeTab = () =>
		`<label class="look-check"><input type="checkbox" id="look-sync" ${S.look.sync ? "checked" : ""}><span></span>Менять рамку вместе с темой</label><div class="th-grid">${ICE.THEMES.map((t) => `<button type="button" class="th-card ${S.look.theme === t.id ? "on" : ""}" data-theme="${t.id}" style="--p0:${t.p[0]};--p1:${t.p[1]};--p2:${t.p[2]}"><span class="th-ico">${t.icon}</span><span class="th-txt"><b>${esc(t.name)}</b><small>${esc(t.anime)}</small><em>${esc(t.tag)}</em></span><span class="th-bar"><i></i><i></i><i></i></span>${S.look.theme === t.id ? '<span class="th-on">Активна</span>' : ""}</button>`).join("")}</div>`;
	const frameTab = () => {
		const cnt = (g) =>
			g === "all"
				? ICE.FRAMES.length
				: ICE.FRAMES.filter((f) => f.g === g).length;
		const g = grp || (cnt(S.look.theme) ? S.look.theme : "all");
		const list = g === "all" ? ICE.FRAMES : ICE.FRAMES.filter((f) => f.g === g);
		const cur2 = ICE.frameOk(S.avatarFrame);
		return `<div class="fr-chips">${ICE.FRAME_GROUPS.filter((x) => cnt(x.id))
			.map(
				(x) =>
					`<button type="button" class="${g === x.id ? "on" : ""}" data-grp="${x.id}">${x.name}<b>${cnt(x.id)}</b></button>`,
			)
			.join(
				"",
			)}</div><div class="frame-picker">${list.map((f) => `<button class="frame-option ${cur2 === f.id ? "selected" : ""}" data-frame="${f.id}" type="button"><span class="frame-preview">${ICE.frameStage(f.id, face, "mini")}</span><span><b>${esc(f.name)}</b><small>${esc(f.desc)}</small></span><span class="frame-check">${cur2 === f.id ? "✓" : ""}</span></button>`).join("")}</div>`;
	};
	const bgTab = () => {
		const t = ICE.themeById(S.look.theme),
			off = !ICE.ambient.supported;
		return `<div class="look-bgcard"><label class="look-check"><input type="checkbox" id="look-bg" ${S.look.bg ? "checked" : ""} ${off ? "disabled" : ""}><span></span>Живой фон</label><p class="m">${off ? "В системе включено «Уменьшить движение», поэтому анимированный фон отключён." : esc(t.bg) + ". Фон ставится на паузу в фоновой вкладке."}</p><div class="look-seg" role="group" aria-label="Плотность частиц">${[
			[1, "Мало"],
			[2, "Нормально"],
			[3, "Много"],
		]
			.map(
				([n, l]) =>
					`<button type="button" class="${S.look.d === n ? "on" : ""}" data-d="${n}" ${off ? "disabled" : ""}>${l}</button>`,
			)
			.join(
				"",
			)}</div><p class="m look-hint">Меньше частиц — меньше нагрузка на слабых устройствах. Закрой окно, чтобы рассмотреть фон целиком.</p></div>`;
	};
	const paint = () => {
		m.querySelectorAll(".look-tabs [data-t]").forEach((b) => {
			b.classList.toggle("on", b.dataset.t === cur);
			b.setAttribute("aria-selected", b.dataset.t === cur);
		});
		body.innerHTML =
			cur === "theme" ? themeTab() : cur === "frame" ? frameTab() : bgTab();
		body.scrollTop = 0;
	};
	const commit = () => {
		S.look = ICE.lookClean(S.look);
		ICE.applyLook(S.look);
		save();
		render();
		paintPreview();
	};
	m.addEventListener("click", (e) => {
		const t = e.target.closest(
			"[data-t],[data-theme],[data-frame],[data-grp],[data-d]",
		);
		if (!t || !m.contains(t) || t.disabled) return;
		if (t.dataset.t) {
			cur = t.dataset.t;
			paint();
		} else if (t.dataset.theme) {
			S.look.theme = ICE.themeOk(t.dataset.theme);
			if (S.look.sync) S.avatarFrame = ICE.themeById(S.look.theme).frame;
			commit();
			paint();
			toast("Тема: " + ICE.themeById(S.look.theme).name);
		} else if (t.dataset.frame) {
			S.avatarFrame = ICE.frameOk(t.dataset.frame);
			save();
			render();
			paintPreview();
			body.querySelectorAll(".frame-option").forEach((o) => {
				const on = o.dataset.frame === S.avatarFrame;
				o.classList.toggle("selected", on);
				o.querySelector(".frame-check").textContent = on ? "✓" : "";
			});
		} else if (t.dataset.grp) {
			grp = t.dataset.grp;
			paint();
		} else if (t.dataset.d) {
			S.look.d = +t.dataset.d;
			commit();
			paint();
		}
	});
	m.addEventListener("change", (e) => {
		if (e.target.id === "look-sync") {
			S.look.sync = e.target.checked ? 1 : 0;
			save();
		} else if (e.target.id === "look-bg") {
			S.look.bg = e.target.checked ? 1 : 0;
			commit();
		}
	});
	m.querySelector("#look-x").onclick = closeM;
	paintPreview();
	paint();
}

document.addEventListener("change", (e) => {
	if (e.target.id !== "bnf") return;
	const f = e.target.files[0];
	if (!f) return;
	e.target.value = "";
	if (!/^image\//.test(f.type)) {
		toast("Выберите файл изображения", 1);
		return;
	}
	if (f.size > 15 * 1024 * 1024) {
		toast("Изображение слишком большое. Максимум 15 МБ.", 1);
		return;
	}
	const rd = new FileReader();
	rd.onerror = () => toast("Не удалось прочитать изображение", 1);
	rd.onload = () => {
		const im = new Image();
		im.onerror = () => toast("Не удалось открыть изображение", 1);
		im.onload = () => {
			try {
				const c = document.createElement("canvas"),
					maxW = 2000,
					maxH = 1200;
				const scale = Math.min(1, maxW / im.width, maxH / im.height);
				c.width = Math.max(1, Math.round(im.width * scale));
				c.height = Math.max(1, Math.round(im.height * scale));
				c.getContext("2d", { alpha: false }).drawImage(
					im,
					0,
					0,
					c.width,
					c.height,
				);
				const previousBanner = S.banner;
				S.banner = c.toDataURL("image/jpeg", 0.86);
				if (!flush()) {
					S.banner = previousBanner;
					return;
				}
				render();
				toast("Баннер сохранён без обрезания композиции");
			} catch (err) {
				toast("Не удалось обработать баннер", 1);
			}
		};
		im.src = rd.result;
	};
	rd.readAsDataURL(f);
});

document.addEventListener("change", (e) => {
	if (e.target.id !== "avf") return;
	const f = e.target.files[0];
	if (!f) return;
	e.target.value = "";
	if (!/^image\//.test(f.type)) {
		toast("Выберите файл изображения", 1);
		return;
	}
	if (f.size > 15 * 1024 * 1024) {
		toast("Изображение слишком большое. Максимум 15 МБ.", 1);
		return;
	}
	const rd = new FileReader();
	rd.onerror = () => toast("Не удалось прочитать файл", 1);
	rd.onload = () => {
		const im = new Image();
		im.onerror = () => toast("Не удалось открыть изображение", 1);
		im.onload = () => {
			try {
				const c = document.createElement("canvas");
				c.width = c.height = 384;
				const s = Math.min(im.width, im.height);
				c.getContext("2d").drawImage(
					im,
					(im.width - s) / 2,
					(im.height - s) / 2,
					s,
					s,
					0,
					0,
					384,
					384,
				);
				const previousAvatar = S.avatar;
				S.avatar = c.toDataURL("image/jpeg", 0.86);
				if (!flush()) {
					S.avatar = previousAvatar;
					return;
				}
				sync();
				render();
				toast("Аватар обновлён и сохранён");
			} catch (err) {
				toast("Не удалось обработать изображение", 1);
			}
		};
		im.src = rd.result;
	};
	rd.readAsDataURL(f);
});

// Шапка: аватар с рамкой, ранг, XP и показатели.
function deckHtml(c) {
	const { r, nx, pct, ac, mc } = c;
	const av = S.avatar && /^data:image\/(jpeg|png|webp)/.test(S.avatar),
		C = 2 * Math.PI * 60;
	const streakGoal =
			[3, 7, 14, 21, 30, 60, 90, 180, 365].find((x) => x > S.st.cur) ||
			Math.max(365, S.st.cur),
		streakP = Math.max(0, Math.min(1, S.st.cur / streakGoal)),
		RC = 2 * Math.PI * 54,
		penCount = cnt(Date.now(), 30, 0),
		penLoss = num(S.disc.reduce((a, e) => a + Math.abs(e.real || 0), 0)),
		bannerCss = S.banner
			? `background-image:linear-gradient(90deg,rgba(5,8,13,.35),rgba(5,8,13,.05)),url('${ICE.imgSrc(S.banner)}');background-size:cover,${S.bannerFit || "cover"};background-position:center,${S.bannerX ?? 50}% ${S.bannerY ?? 50}%;`
			: "",
		face = `<button class="av2" data-act="av" type="button" aria-label="Загрузить аватар">${av ? `<img src="${ICE.imgSrc(S.avatar)}" alt="Аватар">` : `<span>${esc((S.name || "R")[0]).toUpperCase()}</span>`}<i>${ic("camera", 18)}</i></button>`;
	return `<section class="deck rank-premium rank-tier-${Math.ceil((r || 1) / 20)}" id="hm" data-spy><div class="ban ${S.banner ? "has-banner" : ""}" style="${bannerCss}"></div><div class="dk-top"><span class="dk-brand">RAIKEN<sup>®</sup> <i>Personal Progression System</i></span><div class="ban-actions"><button class="ban-edit look-chip" data-act="look" data-tab="theme" type="button" title="Тема и рамка (T)"><i class="look-dot"></i><span>${esc(ICE.themeById(S.look.theme).name)}</span></button><button class="ban-edit" data-act="bn" type="button">${ic("camera", 15)} ${S.banner ? "Баннер" : "Установить баннер"}</button>${S.banner ? `<button class="ban-edit" data-act="bnedit" type="button">${ic("sliders-horizontal", 15)} Настроить</button><button class="ban-edit ban-remove" data-act="bnclear" type="button">${ic("trash-2", 15)} Удалить</button>` : ""}</div></div><input id="bnf" type="file" accept="image/*" hidden><div class="dk-grid"><div class="dk-av">${ICE.frameStage(S.avatarFrame, face)}<input id="avf" type="file" accept="image/*" hidden><div class="dk-av-btns"><button class="btn sm" data-act="look" data-tab="frame" type="button">${ic("sparkles", 15)}<span>Стиль</span></button><button class="btn sm" data-act="av" type="button">${ic("camera", 15)}<span>Фото</span></button></div></div><div class="dk-core"><button class="dk-name" data-act="name" type="button" aria-label="Изменить имя или никнейм"><span>${esc(S.name)}</span>${ic("pencil", 16)}</button><div class="dk-rank"><button class="rk-emb" data-act="rank" type="button" aria-label="Архив рангов"><svg class="rk-ring" viewBox="0 0 128 128" aria-hidden="true"><circle class="rb" cx="64" cy="64" r="60"/><circle class="rf" data-rp="hero" data-p="${pct / 100}" data-c="${C.toFixed(1)}" cx="64" cy="64" r="60" stroke-dasharray="${((pct / 100) * C).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 64 64)"/></svg>${emb(r || 1, !r)}</button><div class="rk-txt"><small>Ранг ${r} из ${MAX_RANK}</small><h2>${esc(rankName(r))}</h2></div></div><div class="dk-xp"><span class="xv"><b data-cu="cur" data-v="${S.cur}">${num(S.cur)}</b> XP</span><span class="m">${nx ? num(nx) : "MAX"}</span></div><div class="dk-bar ${S.warn ? "w" : ""}"><i data-bw="xp" data-p="${pct}" style="width:${pct}%"></i></div><p class="dk-lead">${nx ? `Ещё <b data-cu="left" data-v="${Math.max(0, nx - S.cur)}">${num(Math.max(0, nx - S.cur))}</b> XP до «${esc(rankName(r + 1))}»` : "Максимальный ранг достигнут"}</p></div><div class="dk-vitals"><div class="vital v-streak"><svg class="v-ring" viewBox="0 0 120 120" aria-hidden="true"><circle class="rb" cx="60" cy="60" r="54"/><circle class="rf" data-rp="streak" data-p="${streakP}" data-c="${RC.toFixed(1)}" cx="60" cy="60" r="54" stroke-dasharray="${(streakP * RC).toFixed(1)} ${RC.toFixed(1)}" transform="rotate(-90 60 60)"/></svg><div class="v-body"><small>Серия</small><b><span data-cu="streak" data-v="${S.st.cur}">${S.st.cur}</span> <em>${pl(S.st.cur, "день", "дня", "дней")}</em></b><span class="v-cap">рекорд ${S.st.best} дн. · цель ${streakGoal}</span></div><span class="v-ico">${ic("flame", 20)}</span></div><div class="vital v-peak"><div class="v-body"><small>Рекорд XP</small><b>${num(S.peak)} <em>XP</em></b><span class="v-cap">за всё время ${num(S.life)}</span></div><span class="v-ico">${ic("trending-up", 20)}</span></div><button class="vital v-pen ${penCount ? "is-bad" : ""}" data-act="go" data-to="ds" type="button"><div class="v-body"><small>Просрочки</small><b>${penCount} <em>за 30 дн.</em></b><span class="v-cap">потеряно −${penLoss} XP</span></div><span class="v-ico">${ic("shield-alert", 20)}</span></button></div></div><div class="dk-chips"><button class="chip2" data-act="allaw" data-k="m" type="button">${ic("medal", 16)}<b>${mc}</b><span>из ${MED.length} медалей</span></button><button class="chip2" data-act="allaw" data-k="a" type="button">${ic("trophy", 16)}<b>${ac}</b><span>из ${ACH.length} достижений</span></button><button class="chip2" data-act="rank" type="button">${ic("layout-grid", 16)}<span>Все ранги</span></button><button class="chip2" data-act="go" data-to="rw" type="button">${ic("sparkles", 16)}<span>Награды</span></button>${REV.chip()}</div></section>`;
}
