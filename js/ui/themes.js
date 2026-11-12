"use strict";
/* RAIKEN · Темы персонажей.
   Палитры лежат в css/themes.css (html[data-theme]); здесь — каталог, значки,
   рекомендованные рамки и применение темы вместе с живым фоном. */
(function () {
	const svg = (d) =>
		`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
	const THEMES = [
		{
			id: "rukia",
			name: "Рукия Кучики",
			anime: "Bleach · Сод но Сирайюки",
			tag: "Лёд и тишина",
			frame: "shirayuki",
			amb: "snow",
			bg: "Падает снег, вспыхивают искры инея",
			p: ["5 8 13", "79 179 230", "159 216 242"],
			icon: svg(
				'<path d="M12 2v20M4.2 6.6l15.6 10.8M19.8 6.6L4.2 17.4M9 4l3 2.2L15 4M9 20l3-2.2L15 20"/>',
			),
		},
		{
			id: "byakuya",
			name: "Бьякуя Кучики",
			anime: "Bleach · Сенбонзакура",
			tag: "Лепестки-клинки",
			frame: "senbonzakura",
			amb: "sakura",
			bg: "Лепестки сакуры и порыв Сенбонзакуры",
			p: ["11 7 16", "244 114 182", "255 183 213"],
			icon: svg(
				'<path d="M12 3c2.5 2.5 3 5 0 8-3-3-2.5-5.5 0-8zM12 21c-2.5-2.5-3-5 0-8 3 3 2.5 5.5 0 8zM3 12c2.5-2.5 5-3 8 0-3 3-5.5 2.5-8 0zM21 12c-2.5 2.5-5 3-8 0 3-3 5.5-2.5 8 0z"/>',
			),
		},
		{
			id: "unohana",
			name: "Рэцу Унохана",
			anime: "Bleach · Минадзуки",
			tag: "Тихая кровь",
			frame: "minazuki",
			amb: "blood",
			bg: "Алая дымка и тяжёлые капли",
			p: ["13 5 7", "225 29 72", "251 113 133"],
			icon: svg(
				'<path d="M12 3s6.5 6.8 6.5 11.4A6.5 6.5 0 0 1 5.5 14.4C5.5 9.8 12 3 12 3z"/><path d="M9 15a3 3 0 0 0 3 3"/>',
			),
		},
		{
			id: "urahara",
			name: "Урахара Кисукэ",
			anime: "Bleach · Бэнихимэ",
			tag: "Зелёный расчёт",
			frame: "benihime",
			amb: "sparks",
			bg: "Зелёные светлячки в тёмной лавке",
			p: ["5 12 8", "52 211 153", "167 243 208"],
			icon: svg(
				'<path d="M12 3l2.2 6.2L21 12l-6.8 2.8L12 21l-2.2-6.2L3 12l6.8-2.8z"/>',
			),
		},
		{
			id: "aizen",
			name: "Айдзен Сосукэ",
			anime: "Bleach · Кёка Суйгэцу",
			tag: "Иллюзия порядка",
			frame: "kyoka",
			amb: "butterfly",
			bg: "Бабочки и фиолетовые огни иллюзии",
			p: ["8 5 15", "167 139 250", "221 214 254"],
			icon: svg(
				'<path d="M12 12C9 5 4 4 3.5 7S6 14 12 12zm0 0c3-7 8-8 8.5-5S18 14 12 12zm0 0c-4 1-7 4-5 7s5-3 5-7zm0 0c4 1 7 4 5 7s-5-3-5-7z"/>',
			),
		},
		{
			id: "naruto",
			name: "Наруто Удзумаки",
			anime: "Naruto · Путь Хокаге",
			tag: "Идти вперёд",
			frame: "hokage",
			amb: "leaves",
			bg: "Листья Конохи в потоке ветра и искры чакры",
			p: ["10 7 5", "249 115 22", "253 186 116"],
			icon: svg(
				'<path d="M12 12.2a1.6 1.6 0 0 1 3.2 0 4.2 4.2 0 0 1-8.4 0 6.8 6.8 0 0 1 13.6 0"/>',
			),
		},
		{
			id: "guts",
			name: "Гатс",
			anime: "Berserk · Клеймо",
			tag: "Против судьбы",
			frame: "brand",
			amb: "embers",
			bg: "Пепел и раскалённые угли",
			p: ["6 6 6", "220 38 38", "214 211 209"],
			icon: svg('<path d="M12 2v13M8 6h8M10 15h4l-2 7z"/>'),
		},
		{
			id: "yoruichi",
			name: "Ёруичи Сихоин",
			anime: "Bleach · Сюнко",
			tag: "Быстрее вспышки",
			frame: "shunko",
			amb: "lightning",
			bg: "Золотые искры, молнии и росчерки сюмпо",
			p: ["7 5 13", "250 204 21", "253 230 138"],
			icon: svg('<path d="M13 2L5 14h6l-1 8 8-12h-6z"/>'),
		},

		{
			id: "ichigo", name: "Ичиго Куросаки", anime: "Bleach · Банкай / Гецуга Тэнсё", tag: "Пустой клинок", frame: "getsuga", amb: "embers", bg: "Чёрно-красные вспышки духовной энергии и угли", p: ["10 5 7", "239 68 68", "255 166 120"],
			icon: svg('<path d="M12 2 8 10h4l-1 12 5-10h-4z"/>'),
		},
		{
			id: "kenpachi", name: "Кенпачи Зараки", anime: "Bleach · Ноzarashi", tag: "Безудержная сила", frame: "nozarashi", amb: "embers", bg: "Алые искры и тяжёлые всполохи духовной силы", p: ["13 5 6", "220 38 38", "250 150 120"],
			icon: svg('<path d="m4 20 7-16 2 7 7-7-4 16-3-7z"/>'),
		},
		{
			id: "shunsui", name: "Шунсуй Кёраку", anime: "Bleach · Кaten Kyōkotsu", tag: "Игра теней", frame: "katen", amb: "petal", bg: "Бордовые лепестки и мягкие тёмные всполохи", p: ["12 7 12", "190 82 112", "232 166 177"],
			icon: svg('<path d="M12 3c-4 3-4 6 0 9 4-3 4-6 0-9zM12 12c-4 3-4 6 0 9 4-3 4-6 0-9zM3 12c3-4 6-4 9 0-3 4-6 4-9 0zM12 12c3-4 6-4 9 0-3 4-6 4-9 0z"/>'),
		},
	];
	const IDS = THEMES.map((t) => t.id);
	const themeOk = (id) => (IDS.includes(id) ? id : "rukia");
	const byId = (id) => THEMES.find((t) => t.id === themeOk(id)) || THEMES[0];
	const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

	// проверка сохранённых настроек оформления
	function lookClean(l) {
		l = l && typeof l === "object" ? l : {};
		const d = Math.round(+l.d);
		return {
			theme: themeOk(l.theme),
			bg:
				l.bg === 0 || l.bg === false ? 0 : reduce && l.bg === undefined ? 0 : 1,
			d: d >= 1 && d <= 3 ? d : 2,
			sync: l.sync === 0 || l.sync === false ? 0 : 1,
		};
	}
	// применить тему и живой фон
	function applyLook(look) {
		const L = lookClean(look),
			t = byId(L.theme);
		document.documentElement.dataset.theme = t.id;
		try {
			localStorage.setItem("raiken.theme", t.id);
		} catch (e) {
			ICE.logErr(e, "theme-store");
		}
		const meta = document.querySelector('meta[name="theme-color"]');
		if (meta) {
			const bg = getComputedStyle(document.documentElement)
				.getPropertyValue("--bg")
				.trim();
			if (bg) meta.setAttribute("content", bg);
		}
		const A = ICE.ambient;
		if (A) {
			A.setDensity(L.d);
			A.setEnabled(!!L.bg);
			A.setTheme(t.amb);
		}
		return t;
	}
	Object.assign(window.ICE, {
		THEMES,
		themeOk,
		themeById: byId,
		lookClean,
		applyLook,
	});
})();
