"use strict";
/* RAIKEN · Рамки аватара.
   Рамка — отдельный слой над фото: кольцо, ореол и SVG-эффекты.
   Фото не двигается. Цвета рамок задаются в css/frames.css (.fr-<id>). */
(function () {
	// ---------- Каталог ----------
	const GROUPS = [
		{ id: "all", name: "Все" },
		{ id: "rukia", name: "Рукия" },
		{ id: "byakuya", name: "Бьякуя" },
		{ id: "unohana", name: "Унохана" },
		{ id: "urahara", name: "Урахара" },
		{ id: "aizen", name: "Айдзен" },
		{ id: "naruto", name: "Наруто" },
		{ id: "guts", name: "Гатс" },
		{ id: "yoruichi", name: "Ёруичи" },
		{ id: "ichigo", name: "Ичиго" },
		{ id: "kenpachi", name: "Кенпачи" },
		{ id: "shunsui", name: "Шунсуй" },
		{ id: "any", name: "Универсальные" },
	];
	// mode: water | blood | petal | snow | none; x — дополнительные эффекты
	const FRAMES = [
		// Рукия Кучики
		{
			id: "shirayuki",
			g: "rukia",
			name: "Сод но Сирайюки",
			desc: "Белый снег падает с кольца",
			mode: "snow",
			n: 11,
			x: ["sheen"],
		},
		{
			id: "tsukishiro",
			g: "rukia",
			name: "Цукисиро",
			desc: "Ледяной круг и растущие кристаллы",
			mode: "water",
			n: 4,
			x: ["rift", "crystals"],
		},
		{
			id: "hakka",
			g: "rukia",
			name: "Хакка но Тогамэ",
			desc: "Ледяные серпы и сосульки",
			mode: "water",
			n: 5,
			x: ["wave", "icicles"],
		},
		// Бьякуя Кучики
		{
			id: "senbonzakura",
			g: "byakuya",
			name: "Сенбонзакура",
			desc: "Тысяча лепестков-клинков кружит вокруг",
			mode: "none",
			n: 0,
			x: ["petals:15", "orbit"],
		},
		{
			id: "sakurafall",
			g: "byakuya",
			name: "Падающая сакура",
			desc: "Лепестки сходят с кольца и кружатся",
			mode: "petal",
			n: 9,
			x: ["sheen"],
		},
		{
			id: "gokei",
			g: "byakuya",
			name: "Гокей Сэнкэй",
			desc: "Вращающиеся клетки из лезвий",
			mode: "water",
			n: 3,
			x: ["squares"],
		},
		// Рэцу Унохана
		{
			id: "minazuki",
			g: "unohana",
			name: "Минадзуки",
			desc: "Кровавая волна и тяжёлые потёки",
			mode: "blood",
			n: 6,
			x: ["wave"],
		},
		{
			id: "bloodlotus",
			g: "unohana",
			name: "Алый лотос",
			desc: "Лепестки лотоса в красной дымке",
			mode: "blood",
			n: 3,
			x: ["lotus:6", "orbit"],
			halo2: true,
		},
		// Урахара Кисуке
		{
			id: "benihime",
			g: "urahara",
			name: "Бэнихимэ",
			desc: "Зелёные искры поднимаются вверх",
			mode: "water",
			n: 3,
			x: ["embers:18"],
		},
		{
			id: "kannon",
			g: "urahara",
			name: "Каннонбираки",
			desc: "Руны-кольца вращаются навстречу",
			mode: "none",
			n: 0,
			x: ["ticks", "squares", "sheen"],
		},
		// Айдзен Сосукэ
		{
			id: "kyoka",
			g: "aizen",
			name: "Кёка Суйгэцу",
			desc: "Бабочки иллюзии над кольцом",
			mode: "none",
			n: 0,
			x: ["butterflies:6", "sheen"],
		},
		{
			id: "hogyoku",
			g: "aizen",
			name: "Хогёку",
			desc: "Осколки кристалла вокруг света",
			mode: "water",
			n: 3,
			x: ["shards:9", "rift"],
			halo2: true,
		},
		// Наруто Удзумаки
		{
			id: "rasengan",
			g: "naruto",
			name: "Расенган",
			desc: "Вихрь чакры закручивается вокруг",
			mode: "none",
			n: 0,
			x: ["spiral", "streaks"],
			halo2: true,
		},
		{
			id: "kurama",
			g: "naruto",
			name: "Режим Кьюби",
			desc: "Пламя чакры Курамы",
			mode: "none",
			n: 0,
			x: ["embers:20"],
			halo2: true,
		},
		{
			id: "hokage",
			g: "naruto",
			name: "Путь Хокаге",
			desc: "Листья Конохи в вихре ветра",
			mode: "none",
			n: 0,
			x: ["leaves:10", "orbit"],
		},
		// Гатс
		{
			id: "brand",
			g: "guts",
			name: "Клеймо жертвы",
			desc: "Кроваво-красный ожог и угли",
			mode: "none",
			n: 0,
			x: ["cracks", "embers:16"],
			halo2: true,
		},
		{
			id: "berserk",
			g: "guts",
			name: "Берсерк",
			desc: "Сталь с раскалёнными трещинами",
			mode: "blood",
			n: 5,
			x: ["cracks"],
		},
		// Ёруичи Сихоин
		{
			id: "shunko",
			g: "yoruichi",
			name: "Сюнко",
			desc: "Золотая молния по краю",
			mode: "none",
			n: 0,
			x: ["bolt", "streaks"],
			halo2: true,
		},
		{
			id: "flashstep",
			g: "yoruichi",
			name: "Сюмпо",
			desc: "Полосы скорости и золотые искры",
			mode: "none",
			n: 0,
			x: ["streaks", "embers:10", "orbit"],
		},

		// Ичиго Куросаки
		{ id: "getsuga", g: "ichigo", name: "Гецуга Тэнсё", desc: "Чёрно-красный энергетический росчерк", mode: "none", n: 0, x: ["bolt", "streaks", "embers:14"], halo2: true },
		{ id: "bankai", g: "ichigo", name: "Тэнса Дзангэцу", desc: "Тёмное кольцо с алыми разломами", mode: "blood", n: 4, x: ["cracks", "rift"] },
		{ id: "hollow", g: "ichigo", name: "Пустая маска", desc: "Белые осколки и красная духовная аура", mode: "none", n: 0, x: ["shards:12", "orbit", "sheen"], halo2: true },
		// Кенпачи Зараки
		{ id: "nozarashi", g: "kenpachi", name: "Нодзараси", desc: "Рваные алые вспышки и угли", mode: "blood", n: 5, x: ["cracks", "embers:18"], halo2: true },
		{ id: "eyepatch", g: "kenpachi", name: "Снятая повязка", desc: "Пульсирующее кольцо духовного давления", mode: "none", n: 0, x: ["rift", "streaks"] },
		{ id: "berserker", g: "kenpachi", name: "Безумный натиск", desc: "Кровавые потоки и раскалённые искры", mode: "blood", n: 8, x: ["embers:12"] },
		// Шунсуй Кёраку
		{ id: "katen", g: "shunsui", name: "Кaten Kyōkotsu", desc: "Бордовые лепестки кружат по орбите", mode: "petal", n: 8, x: ["petals:10", "orbit"] },
		{ id: "shadowgame", g: "shunsui", name: "Игра теней", desc: "Два встречных кольца и тёмные всполохи", mode: "none", n: 0, x: ["rift", "squares", "sheen"] },
		{ id: "blossom", g: "shunsui", name: "Цветочный покров", desc: "Медленные лепестки и мягкое сияние", mode: "petal", n: 12, x: ["orbit"] },

		// Универсальные (прежние)
		{
			id: "classic",
			g: "any",
			name: "Классика",
			desc: "Стальное кольцо и тонкий ручей",
			mode: "water",
			n: 2,
			x: [],
		},
		{
			id: "gold",
			g: "any",
			name: "Расплав",
			desc: "Жидкое золото стекает с кольца",
			mode: "water",
			n: 4,
			x: [],
		},
		{
			id: "aurora",
			g: "any",
			name: "Аврора",
			desc: "Переливы северного сияния",
			mode: "water",
			n: 5,
			x: [],
		},
		{
			id: "crimson",
			g: "any",
			name: "Багрянец",
			desc: "Тёмный рубин, медленные потёки",
			mode: "water",
			n: 3,
			x: [],
		},
		{
			id: "ice",
			g: "any",
			name: "Иней",
			desc: "Сосульки и талая вода",
			mode: "water",
			n: 4,
			x: ["icicles"],
		},
		{
			id: "royal",
			g: "any",
			name: "Королевская",
			desc: "Аметист и золото",
			mode: "water",
			n: 4,
			x: [],
		},
		{
			id: "glacier",
			g: "any",
			name: "Glacier Flow",
			desc: "Ледяной водопад с кольца",
			mode: "water",
			n: 8,
			x: [],
		},
		{
			id: "tidal",
			g: "any",
			name: "Tidal Crown",
			desc: "Волна бежит по кольцу",
			mode: "water",
			n: 5,
			x: ["wave"],
		},
		{
			id: "bolt",
			g: "any",
			name: "Raiken Bolt",
			desc: "Дуги молнии по краю",
			mode: "water",
			n: 3,
			x: ["bolt"],
		},
		{
			id: "bloom",
			g: "any",
			name: "Frost Bloom",
			desc: "Кристаллы инея прорастают и тают",
			mode: "water",
			n: 3,
			x: ["crystals"],
		},
		{
			id: "rift",
			g: "any",
			name: "Void Rift",
			desc: "Два тёмных кольца в разные стороны",
			mode: "water",
			n: 4,
			x: ["rift"],
		},
		{
			id: "prism",
			g: "any",
			name: "Prism Shard",
			desc: "Стеклянный блик скользит по грани",
			mode: "water",
			n: 4,
			x: ["sheen"],
		},
	];
	const IDS = FRAMES.map((f) => f.id);
	// старые рамки → новые, чтобы выбор не сбрасывался
	const MIGRATE = {
		liquid: "glacier",
		plasma: "bolt",
		celestial: "prism",
		void: "rift",
		diamond: "bloom",
		mythic: "tidal",
	};
	const frameOk = (id) => (IDS.includes(id) ? id : MIGRATE[id] || "classic");

	// ---------- Помощники ----------
	const R = 89,
		CX = 100,
		CY = 100;
	const f1 = (n) => n.toFixed(1);
	const rr = (i, k) => {
		const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
		return x - Math.floor(x);
	};
	const pt = (a, r) => {
		const t = (a * Math.PI) / 180,
			q = r || R;
		return [CX + q * Math.sin(t), CY - q * Math.cos(t)];
	};
	const num = (x, d) => (x ? +x : d);

	// формы
	const petal = (s) =>
		`M0 ${f1(-5 * s)}C${f1(3.6 * s)} ${f1(-5 * s)} ${f1(5.6 * s)} ${f1(-1 * s)} 0 ${f1(6 * s)}C${f1(-5.6 * s)} ${f1(-1 * s)} ${f1(-3.6 * s)} ${f1(-5 * s)} 0 ${f1(-5 * s)}z`;
	const leaf = (s) =>
		`M0 ${f1(-7 * s)}C${f1(5 * s)} ${f1(-4 * s)} ${f1(6 * s)} ${f1(3 * s)} 0 ${f1(8 * s)}C${f1(-6 * s)} ${f1(3 * s)} ${f1(-5 * s)} ${f1(-4 * s)} 0 ${f1(-7 * s)}z`;
	const lotus = (s) =>
		`M0 ${f1(-10 * s)}C${f1(7 * s)} ${f1(-6 * s)} ${f1(8 * s)} ${f1(4 * s)} 0 ${f1(12 * s)}C${f1(-8 * s)} ${f1(4 * s)} ${f1(-7 * s)} ${f1(-6 * s)} 0 ${f1(-10 * s)}z`;
	const shard = (s) =>
		`M0 ${f1(-4.5 * s)}L${f1(3 * s)} 0L0 ${f1(4.5 * s)}L${f1(-3 * s)} 0z`;

	// ---------- Потоки: вода, кровь, лепестки, снег ----------
	function streams(n, mode) {
		let out = "";
		const slow =
			mode === "blood"
				? 1.7
				: mode === "snow"
					? 1.9
					: mode === "petal"
						? 2.2
						: 1;
		for (let i = 0; i < n; i++) {
			const t = n === 1 ? 0.5 : i / (n - 1);
			const a = 128 + (232 - 128) * t + (i % 2 ? 2.5 : -2.5);
			const [x, y] = pt(a);
			const len = 34 + ((i * 41) % 100) * 0.34;
			const sway = ((i * 53) % 7) - 3;
			const dur = ((2.4 + (((i * 29) % 10) / 10) * 2.6) * slow).toFixed(2);
			const del = (-(((i * 47) % 100) / 100) * dur).toFixed(2);
			if (mode === "petal" || mode === "snow") {
				const s =
					mode === "petal" ? 0.8 + rr(i, 1) * 0.7 : 0.5 + rr(i, 1) * 0.55;
				const shape =
					mode === "petal"
						? `<path class="fr-pt" style="--tm:${(2.4 + rr(i, 4) * 2).toFixed(1)}s;--dl:-${(rr(i, 5) * 3).toFixed(1)}s" d="${petal(s)}"/>`
						: `<circle class="fr-sn" r="${f1(0.9 + rr(i, 2) * 1.5)}"/>`;
				out += `<g transform="translate(${f1(x)} ${f1(y)})"><g class="fr-fall" style="--t:${dur}s;--d:${del}s;--L:${f1(len + 22)}px"><g class="fr-sway" style="--ts:${(1.8 + rr(i, 3) * 1.6).toFixed(1)}s;--a:${f1(3 + rr(i, 6) * 6)}">${shape}</g></g></g>`;
			} else {
				const d = `M${f1(x)} ${f1(y)}c${sway} ${f1(len * 0.35)} ${-sway} ${f1(len * 0.65)} ${f1(sway * 0.5)} ${f1(len)}`;
				const r =
					(1.5 + (((i * 13) % 10) / 10) * 1.3) * (mode === "blood" ? 1.5 : 1);
				out += `<g class="fr-st" style="--t:${dur}s;--d:${del}s"><path class="fr-tr" d="${d}"/><path class="fr-fl" d="${d}" pathLength="100"/><circle class="fr-dp" cx="${f1(x + sway * 0.5)}" cy="${f1(y + len)}" r="${f1(r)}"/></g>`;
			}
		}
		return out;
	}

	// ---------- Эффекты по кольцу ----------
	// элементы на орбите: shape(i) → путь; cls — класс; r0..r1 — радиус; tmin..tmax — период
	function orbit(k, shapeFn, cls, r0, r1, tmin, tmax, extra) {
		let out = "";
		for (let i = 0; i < k; i++) {
			const r = r0 + rr(i, 1) * (r1 - r0),
				t = tmin + rr(i, 2) * (tmax - tmin),
				s = 0.8 + rr(i, 3) * 0.7;
			const dir = extra && extra.alt && i % 2 ? "reverse" : "normal";
			out += `<g class="fr-spin" style="--t:${t.toFixed(1)}s;--d:-${(t * (i / k)).toFixed(1)}s;--dir:${dir}"><g transform="translate(100 ${f1(100 - r)})">${shapeFn(i, s)}</g></g>`;
		}
		return out;
	}
	const petalsX = (k) =>
		orbit(
			k,
			(i, s) =>
				`<path class="fr-pt" style="--tm:${(2.2 + rr(i, 4) * 2.2).toFixed(1)}s;--dl:-${(rr(i, 5) * 3).toFixed(1)}s" d="${petal(s * 1.05)}"/>`,
			"",
			98,
			113,
			16,
			30,
		);
	const leavesX = (k) =>
		orbit(
			k,
			(i, s) =>
				`<path class="fr-lf ${i % 2 ? "l2" : "l1"}" style="--tm:${(2 + rr(i, 4) * 2).toFixed(1)}s;--dl:-${(rr(i, 5) * 3).toFixed(1)}s" d="${leaf(s * 0.95)}"/>`,
			"",
			98,
			114,
			10,
			20,
		);
	const shardsX = (k) =>
		orbit(
			k,
			(i, s) =>
				`<path class="fr-sh" style="--tm:${(2.6 + rr(i, 4) * 2).toFixed(1)}s;--dl:-${(rr(i, 5) * 3).toFixed(1)}s" d="${shard(s * 1.2)}"/>`,
			"",
			97,
			110,
			14,
			26,
			{ alt: true },
		);
	const lotusX = (k) =>
		orbit(
			k,
			(i) => `<path class="fr-lt" d="${lotus(1.5)}"/>`,
			"",
			104,
			106,
			36,
			38,
		);
	function butterflies(k) {
		const wl =
			"M0 0C-3 -7 -11 -8 -10 -2C-9 3 -3 3 0 0zM0 0C-2 4 -8 8 -7 3C-6 -1 -2 -1 0 0z";
		const wr =
			"M0 0C3 -7 11 -8 10 -2C9 3 3 3 0 0zM0 0C2 4 8 8 7 3C6 -1 2 -1 0 0z";
		return orbit(
			k,
			(i, s) =>
				`<g transform="rotate(${i % 2 ? 90 : 90})"><g transform="scale(${f1(0.9 + s * 0.5)})"><path class="fr-bw bl" style="--fl:${(0.34 + rr(i, 7) * 0.3).toFixed(2)}s" d="${wl}"/><path class="fr-bw br" style="--fl:${(0.34 + rr(i, 7) * 0.3).toFixed(2)}s" d="${wr}"/></g></g>`,
			"",
			99,
			114,
			22,
			34,
		);
	}
	function embers(k) {
		let out = "";
		for (let i = 0; i < k; i++) {
			const a = -78 + (156 * i) / Math.max(1, k - 1) + (rr(i, 1) - 0.5) * 8;
			const [x, y] = pt((a + 360) % 360, R + 2);
			const t = 2.2 + rr(i, 2) * 2.6,
				H = 40 + rr(i, 3) * 38;
			out += `<g transform="translate(${f1(x)} ${f1(y)})"><g class="fr-rise" style="--t:${t.toFixed(2)}s;--d:-${(rr(i, 4) * t).toFixed(2)}s;--H:${f1(H)}"><g class="fr-sway" style="--ts:${(1.2 + rr(i, 5) * 1.4).toFixed(1)}s;--a:${f1(2 + rr(i, 6) * 5)}"><circle class="fr-em" r="${f1(1.1 + rr(i, 7) * 1.6)}"/></g></g></g>`;
		}
		return out;
	}
	function arcs() {
		const sets = [
			[-60, -20],
			[20, 62],
			[118, 150],
			[200, 236],
			[262, 300],
		];
		return sets
			.map(([a, b], i) => {
				let d = "";
				for (let s = 0; s <= 7; s++) {
					const ang = a + ((b - a) * s) / 7,
						rr2 = R + (s % 2 ? 7 : -4) + ((i * 3 + s) % 3),
						q = (ang * Math.PI) / 180;
					d +=
						(s ? "L" : "M") +
						f1(CX + rr2 * Math.sin(q)) +
						" " +
						f1(CY - rr2 * Math.cos(q));
				}
				return `<path class="fr-arc" style="--d:-${(i * 0.53).toFixed(2)}s;--t:${(1.9 + i * 0.35).toFixed(2)}s" d="${d}"/>`;
			})
			.join("");
	}
	function crystals() {
		return [18, 62, 104, 148, 214, 262, 318]
			.map((a, i) => {
				const [x, y] = pt(a),
					s = 4.5 + (i % 3) * 1.6;
				const d = `M0 ${-s}L${f1(s * 0.28)} ${f1(-s * 0.28)}L${s} 0L${f1(s * 0.28)} ${f1(s * 0.28)}L0 ${s}L${f1(-s * 0.28)} ${f1(s * 0.28)}L${-s} 0L${f1(-s * 0.28)} ${f1(-s * 0.28)}z`;
				return `<g transform="translate(${f1(x)} ${f1(y)})"><path class="fr-cr" style="--d:-${(i * 1.05).toFixed(2)}s" d="${d}"/></g>`;
			})
			.join("");
	}
	function icicles() {
		let out = "";
		[142, 156, 170, 184, 198, 212, 226].forEach((a, i) => {
			const [x, y] = pt(a),
				h = 12 + ((i * 7) % 5) * 4;
			out += `<path class="fr-ic" style="--d:-${(i * 0.37).toFixed(2)}s" d="M${f1(x - 3.2)} ${f1(y - 1)}L${f1(x)} ${f1(y + h)}L${f1(x + 3.2)} ${f1(y - 1)}z"/>`;
		});
		return out;
	}
	const circ = (r) => 2 * Math.PI * r;
	const ring = (cls, r, dash, sw, extra) =>
		`<circle class="${cls}" cx="100" cy="100" r="${r}" style="stroke-dasharray:${dash};stroke-width:${sw};${extra || ""}"/>`;
	function spiral() {
		return [
			ring(
				"fr-sp s1",
				98,
				`${f1(circ(98) * 0.34)} ${f1(circ(98) * 0.66)}`,
				2.6,
			),
			ring(
				"fr-sp s2",
				104,
				`${f1(circ(104) * 0.22)} ${f1(circ(104) * 0.78)}`,
				2,
			),
			ring(
				"fr-sp s3",
				110,
				`${f1(circ(110) * 0.14)} ${f1(circ(110) * 0.86)}`,
				1.5,
			),
			ring(
				"fr-sp s4",
				92,
				`${f1(circ(92) * 0.12)} ${f1(circ(92) * 0.88)}`,
				1.8,
			),
		].join("");
	}
	const streaks = () =>
		ring("fr-sk k1", 100, "9 58", 2.2) + ring("fr-sk k2", 107, "5 92", 1.5);
	const ticks = () =>
		ring("fr-tk t1", 100, "1.6 5.4", 2.4) + ring("fr-tk t2", 106, "7 19", 1.2);
	const cracks = () => ring("fr-ck", 89, "9 4 2 11 5 3 14 6 3 8", 1.8);
	const squares = () =>
		`<rect class="fr-sq q1" x="8" y="8" width="184" height="184" rx="20"/><rect class="fr-sq q2" x="8" y="8" width="184" height="184" rx="20"/>`;

	const EXTRA = {
		petals: petalsX,
		leaves: leavesX,
		shards: shardsX,
		lotus: lotusX,
		butterflies,
		embers,
		bolt: arcs,
		crystals,
		icicles,
		spiral,
		streaks,
		ticks,
		cracks,
		squares,
		rift: () =>
			`<circle class="fr-orbit o1" cx="100" cy="100" r="97"/><circle class="fr-orbit o2" cx="100" cy="100" r="80"/>`,
		orbit: () => `<circle class="fr-orbit o3" cx="100" cy="100" r="96"/>`,
		wave: () =>
			`<circle class="fr-wave" cx="100" cy="100" r="${R}" pathLength="100"/>`,
	};
	function frameSvg(cfg) {
		let under = "",
			over = "";
		const order = [
			"rift",
			"orbit",
			"wave",
			"ticks",
			"squares",
			"cracks",
			"spiral",
			"streaks",
			"bolt",
			"crystals",
			"icicles",
		];
		const parsed = cfg.x.map((t) => {
			const [k, n] = t.split(":");
			return [k, num(n, 0)];
		});
		parsed.forEach(([k, n]) => {
			if (k === "sheen") return;
			const piece = EXTRA[k] ? EXTRA[k](n) : "";
			if (order.includes(k)) under += piece;
			else over += piece;
		});
		return `<svg class="fr-fx" viewBox="0 0 200 270" aria-hidden="true">${under}${cfg.n ? streams(cfg.n, cfg.mode) : ""}${over}</svg>`;
	}
	// Сцена: кольцо, ореол, эффекты. Фото рисуется отдельно (inner).
	function frameStage(id, inner, extraCls) {
		id = frameOk(id);
		const cfg = FRAMES.find((f) => f.id === id) || FRAMES[0];
		const sheen = cfg.x.includes("sheen")
			? '<span class="fr-sheen"></span>'
			: "";
		return `<div class="avs fr-${id} ${extraCls || ""}"><span class="fr-halo"></span>${cfg.halo2 ? '<span class="fr-halo2"></span>' : ""}<span class="fr-ring"></span>${sheen}${frameSvg(cfg)}${inner}</div>`;
	}

	Object.assign(window.ICE, {
		FRAMES,
		FRAME_GROUPS: GROUPS,
		frameOk,
		frameStage,
	});
})();
