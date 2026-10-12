import { ElementInfo, isMetal, cationCharge, valenceOf, sub } from '../data/elementModel';

export type BondType = 'ionic' | 'polar' | 'nonpolar' | 'metallic' | 'none';

export interface ProductPart { symbol: string; count: number }

export interface ReactionResult {
  kind: 'reaction' | 'alloy' | 'none';
  a: ElementInfo;
  b: ElementInfo;
  bond: BondType;
  deltaEN: number | null;
  parts: ProductPart[];
  productText: string;
  productName: { en: string; ar: string };
  coeffs: { a: number; b: number; c: number };
  equation: string;
  dH: number | null; // kJ/mol, standard enthalpy of formation (approx.)
  vigor: number; // 0..1, drives the animation intensity
  observation: { en: string; ar: string };
  explanation: { en: string; ar: string };
  ions: { cation: { symbol: string; charge: number }; anion: { symbol: string; charge: number } } | null;
}

const DIATOMIC = new Set(['H', 'N', 'O', 'F', 'Cl', 'Br', 'I']);
export const isDiatomic = (symbol: string) => DIATOMIC.has(symbol);

interface Known {
  formula: string;
  name: { en: string; ar: string };
  dH?: number;
  obs: { en: string; ar: string };
}

const KNOWN: Record<string, Known> = {
  'H+O': { formula: 'H2O', name: { en: 'Water', ar: 'الماء' }, dH: -285.8, obs: { en: 'Burns with a pale blue flame; H₂/O₂ mixtures can detonate.', ar: 'يحترق بلهب أزرق باهت؛ ومخلوط H₂/O₂ قد ينفجر.' } },
  'Cl+Na': { formula: 'NaCl', name: { en: 'Sodium chloride', ar: 'كلوريد الصوديوم' }, dH: -411.2, obs: { en: 'Brilliant yellow flame and a white crystalline solid: table salt.', ar: 'لهب أصفر ساطع وصلب أبيض بلوري: ملح الطعام.' } },
  'Cl+K': { formula: 'KCl', name: { en: 'Potassium chloride', ar: 'كلوريد البوتاسيوم' }, dH: -436.5, obs: { en: 'Violent reaction with a lilac flame; forms white crystals.', ar: 'تفاعل عنيف بلهب بنفسجي ويتكوّن صلب أبيض بلوري.' } },
  'F+Li': { formula: 'LiF', name: { en: 'Lithium fluoride', ar: 'فلوريد الليثيوم' }, dH: -616.0, obs: { en: 'Intensely exothermic; forms a white ionic solid.', ar: 'طارد للحرارة بشدة ويكوّن صلبًا أيونيًا أبيض.' } },
  'Mg+O': { formula: 'MgO', name: { en: 'Magnesium oxide', ar: 'أكسيد الماغنسيوم' }, dH: -601.6, obs: { en: 'Dazzling white light; leaves a white powder.', ar: 'ضوء أبيض مبهر ويترك مسحوقًا أبيض.' } },
  'Ca+O': { formula: 'CaO', name: { en: 'Calcium oxide (quicklime)', ar: 'أكسيد الكالسيوم (الجير الحي)' }, dH: -635.1, obs: { en: 'Bright reddish-orange flame, white solid.', ar: 'لهب برتقالي محمر ساطع وصلب أبيض.' } },
  'Na+O': { formula: 'Na2O', name: { en: 'Sodium oxide', ar: 'أكسيد الصوديوم' }, dH: -414.2, obs: { en: 'Sodium tarnishes then burns with a yellow flame.', ar: 'يفقد الصوديوم بريقه ثم يحترق بلهب أصفر.' } },
  'Al+O': { formula: 'Al2O3', name: { en: 'Aluminium oxide', ar: 'أكسيد الألومنيوم' }, dH: -1675.7, obs: { en: 'Extremely exothermic; forms a hard, protective white layer.', ar: 'طارد للحرارة جدًا ويكوّن طبقة بيضاء صلبة واقية.' } },
  'Fe+O': { formula: 'Fe2O3', name: { en: 'Iron(III) oxide (rust)', ar: 'أكسيد الحديد III (الصدأ)' }, dH: -824.2, obs: { en: 'Slow reaction forming reddish-brown rust.', ar: 'تفاعل بطيء يكوّن الصدأ البني المحمر.' } },
  'Cu+O': { formula: 'CuO', name: { en: 'Copper(II) oxide', ar: 'أكسيد النحاس II' }, dH: -157.3, obs: { en: 'Copper darkens to a black solid when heated in air.', ar: 'يسودّ النحاس عند تسخينه في الهواء ويكوّن صلبًا أسود.' } },
  'O+Zn': { formula: 'ZnO', name: { en: 'Zinc oxide', ar: 'أكسيد الخارصين' }, dH: -350.5, obs: { en: 'Burns with a blue-green flame; white powder.', ar: 'يحترق بلهب أخضر مزرق ويترك مسحوقًا أبيض.' } },
  'C+O': { formula: 'CO2', name: { en: 'Carbon dioxide', ar: 'ثاني أكسيد الكربون' }, dH: -393.5, obs: { en: 'Burns with heat and light; releases colorless CO₂ gas.', ar: 'يحترق بحرارة وضوء ويتصاعد غاز CO₂ عديم اللون.' } },
  'H+N': { formula: 'NH3', name: { en: 'Ammonia', ar: 'الأمونيا' }, dH: -45.9, obs: { en: 'Needs high pressure and a catalyst (Haber process); sharp odor.', ar: 'يحتاج ضغطًا عاليًا ومحفزًا (عملية هابر)؛ رائحة نفاذة.' } },
  'Cl+H': { formula: 'HCl', name: { en: 'Hydrogen chloride', ar: 'كلوريد الهيدروجين' }, dH: -92.3, obs: { en: 'Explosive in light; dissolves in water to give hydrochloric acid.', ar: 'ينفجر في الضوء ويذوب في الماء مكوّنًا حمض الهيدروكلوريك.' } },
  'F+H': { formula: 'HF', name: { en: 'Hydrogen fluoride', ar: 'فلوريد الهيدروجين' }, dH: -273.3, obs: { en: 'Explosive even in the dark; extremely corrosive.', ar: 'ينفجر حتى في الظلام؛ شديد التآكل.' } },
  'H+S': { formula: 'H2S', name: { en: 'Hydrogen sulfide', ar: 'كبريتيد الهيدروجين' }, dH: -20.6, obs: { en: 'Toxic gas with a rotten-egg smell.', ar: 'غاز سام برائحة البيض الفاسد.' } },
  'O+S': { formula: 'SO2', name: { en: 'Sulfur dioxide', ar: 'ثاني أكسيد الكبريت' }, dH: -296.8, obs: { en: 'Burns with a blue flame; choking colorless gas.', ar: 'يحترق بلهب أزرق ويتصاعد غاز خانق عديم اللون.' } },
  'C+H': { formula: 'CH4', name: { en: 'Methane', ar: 'الميثان' }, dH: -74.8, obs: { en: 'Main component of natural gas.', ar: 'المكوّن الرئيسي للغاز الطبيعي.' } },
  'F+Xe': { formula: 'XeF2', name: { en: 'Xenon difluoride', ar: 'ثنائي فلوريد الزينون' }, obs: { en: 'A rare noble-gas compound, formed under UV light or heat.', ar: 'مركب نادر لغاز نبيل، يتكوّن بالأشعة فوق البنفسجية أو الحرارة.' } },
};

function parseFormula(f: string): ProductPart[] {
  const out: ProductPart[] = [];
  for (const m of f.matchAll(/([A-Z][a-z]?)(\d*)/g)) out.push({ symbol: m[1], count: m[2] ? +m[2] : 1 });
  return out;
}

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
const partsText = (parts: ProductPart[]) => parts.map(p => p.symbol + (p.count > 1 ? sub(p.count) : '')).join('');
const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));

function balance(a: ElementInfo, b: ElementInfo, parts: ProductPart[]) {
  const countA = parts.find(p => p.symbol === a.symbol)?.count ?? 1;
  const countB = parts.find(p => p.symbol === b.symbol)?.count ?? 1;
  const sa = isDiatomic(a.symbol) ? 2 : 1;
  const sb = isDiatomic(b.symbol) ? 2 : 1;
  for (let c = 1; c <= 12; c++) {
    if ((c * countA) % sa === 0 && (c * countB) % sb === 0) {
      return { a: (c * countA) / sa, b: (c * countB) / sb, c, sa, sb };
    }
  }
  return { a: countA, b: countB, c: 1, sa, sb };
}

function equationText(a: ElementInfo, b: ElementInfo, co: { a: number; b: number; c: number; sa: number; sb: number }, prod: string) {
  const f = (e: ElementInfo, n: number, s: number) => `${n > 1 ? n : ''}${e.symbol}${s === 2 ? '₂' : ''}`;
  return `${f(a, co.a, co.sa)} + ${f(b, co.b, co.sb)} → ${co.c > 1 ? co.c : ''}${prod}`;
}

export function reactElements(a: ElementInfo, b: ElementInfo): ReactionResult {
  const deltaEN = a.en !== null && b.en !== null ? Math.abs(a.en - b.en) : null;
  const key = [a.symbol, b.symbol].sort().join('+');
  const known = KNOWN[key];
  const aMetal = isMetal(a.category);
  const bMetal = isMetal(b.category);

  const base = { a, b, deltaEN, ions: null as ReactionResult['ions'] };

  // Noble gases: inert unless listed in KNOWN
  if (!known && (a.category === 'noble' || b.category === 'noble')) {
    const noble = a.category === 'noble' ? a : b;
    return {
      ...base, kind: 'none', bond: 'none', parts: [], productText: '', productName: { en: '', ar: '' },
      coeffs: { a: 1, b: 1, c: 0 }, equation: `${a.symbol} + ${b.symbol} → ✗`, dH: null, vigor: 0.08,
      observation: { en: 'Nothing happens. The atoms collide and bounce apart.', ar: 'لا يحدث شيء. تتصادم الذرات ثم ترتد.' },
      explanation: {
        en: `${noble.name} has a full outer shell, so it has no tendency to gain, lose or share electrons.`,
        ar: `غلاف ${noble.nameAr} الخارجي ممتلئ، فلا يميل لكسب الإلكترونات أو فقدها أو مشاركتها.`,
      },
    };
  }

  // Metal + metal: alloy
  if (!known && aMetal && bMetal) {
    const parts = [{ symbol: a.symbol, count: 2 }, { symbol: b.symbol, count: 2 }];
    return {
      ...base, kind: 'alloy', bond: 'metallic', parts, productText: `${a.symbol}–${b.symbol}`,
      productName: { en: 'Alloy (metallic mixture)', ar: 'سبيكة (خليط فلزي)' },
      coeffs: { a: 2, b: 2, c: 1 }, equation: `${a.symbol} + ${b.symbol} → ${a.symbol}–${b.symbol} alloy`, dH: null, vigor: 0.15,
      observation: { en: 'No chemical reaction. When melted together the atoms mix into one lattice.', ar: 'لا يحدث تفاعل كيميائي. عند الصهر معًا تتداخل الذرات في شبكة واحدة.' },
      explanation: {
        en: 'Two metals both tend to lose electrons, so neither accepts them. They share a sea of delocalized electrons (metallic bond).',
        ar: 'كلا الفلزين يميل لفقد الإلكترونات فلا أحد يستقبلها. يتشاركان بحرًا من الإلكترونات الحرة (رابطة فلزية).',
      },
    };
  }

  // Decide product formula
  let parts: ProductPart[];
  let ions: ReactionResult['ions'] = null;
  const metal = aMetal ? a : bMetal ? b : null;
  const nonmetal = metal ? (metal === a ? b : a) : null;

  if (known) {
    parts = parseFormula(known.formula);
  } else if (metal && nonmetal) {
    const q = cationCharge(metal);
    const v = valenceOf(nonmetal);
    const g = gcd(q, v);
    parts = [{ symbol: metal.symbol, count: v / g }, { symbol: nonmetal.symbol, count: q / g }];
  } else {
    // two nonmetals: less electronegative element first (H goes last after groups 13-15)
    const [first, second] = (a.en ?? 0) <= (b.en ?? 0) ? [a, b] : [b, a];
    const va = valenceOf(first);
    const vb = valenceOf(second);
    const g = gcd(va, vb);
    parts = [{ symbol: first.symbol, count: vb / g }, { symbol: second.symbol, count: va / g }];
    const hFirst = first.z === 1 && second.group !== null && second.group >= 13 && second.group <= 15;
    if (hFirst) parts.reverse();
  }

  // Bond type
  let bond: BondType;
  if (metal && nonmetal) bond = (deltaEN ?? 2) >= 1.5 ? 'ionic' : 'polar';
  else bond = (deltaEN ?? 1) < 0.4 ? 'nonpolar' : 'polar';
  if (known && metal && nonmetal && bond === 'polar' && (deltaEN ?? 0) >= 1.2) bond = 'ionic';

  if (bond === 'ionic' && metal && nonmetal) {
    const q = cationCharge(metal);
    ions = { cation: { symbol: metal.symbol, charge: q }, anion: { symbol: nonmetal.symbol, charge: valenceOf(nonmetal) } };
  }

  const productText = partsText(parts);
  const co = balance(a, b, parts);
  const equation = equationText(a, b, co, productText);
  const dH = known?.dH ?? null;

  let vigor = clamp((deltaEN ?? 1) / 3);
  if (dH !== null) vigor = clamp(0.2 + (Math.abs(dH) / 700) * 0.6);
  const strongRed = (c: string) => ['alkali', 'alkaline'].includes(c);
  const strongOx = (c: string, s: string) => c === 'halogen' || s === 'O';
  if ((strongRed(a.category) && strongOx(b.category, b.symbol)) || (strongRed(b.category) && strongOx(a.category, a.symbol))) vigor = clamp(vigor + 0.25);

  const bondText = {
    ionic: {
      en: `Electrons transfer from ${metal?.name} to ${nonmetal?.name}, giving ions that attract each other (ionic bond). ΔEN = ${deltaEN?.toFixed(2)}.`,
      ar: `تنتقل الإلكترونات من ${metal?.nameAr} إلى ${nonmetal?.nameAr} فتتكوّن أيونات تتجاذب (رابطة أيونية). فرق السالبية = ${deltaEN?.toFixed(2)}.`,
    },
    polar: {
      en: `Atoms share electrons unequally (polar covalent bond). ΔEN = ${deltaEN?.toFixed(2)}.`,
      ar: `تتشارك الذرات الإلكترونات بشكل غير متساوٍ (رابطة تساهمية قطبية). فرق السالبية = ${deltaEN?.toFixed(2)}.`,
    },
    nonpolar: {
      en: `Atoms share electrons almost equally (nonpolar covalent bond). ΔEN = ${deltaEN?.toFixed(2)}.`,
      ar: `تتشارك الذرات الإلكترونات بالتساوي تقريبًا (رابطة تساهمية غير قطبية). فرق السالبية = ${deltaEN?.toFixed(2)}.`,
    },
    metallic: { en: '', ar: '' },
    none: { en: '', ar: '' },
  }[bond];

  return {
    ...base, ions, kind: 'reaction', bond, parts, productText,
    productName: known?.name ?? { en: `${a.name} ${b.name} compound`, ar: `مركب ${a.nameAr} و${b.nameAr}` },
    coeffs: { a: co.a, b: co.b, c: co.c }, equation, dH, vigor,
    observation: known?.obs ?? (bond === 'ionic'
      ? { en: 'Forms a crystalline ionic solid (predicted from charges).', ar: 'يتكوّن صلب أيوني بلوري (متوقع من الشحنات).' }
      : { en: 'Forms covalent molecules (predicted from valences).', ar: 'تتكوّن جزيئات تساهمية (متوقع من التكافؤ).' }),
    explanation: bondText,
  };
}
