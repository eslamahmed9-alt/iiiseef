import { getFullPeriodicElements } from './periodicTableData';

export type Category =
  | 'alkali' | 'alkaline' | 'transition' | 'post' | 'metalloid'
  | 'nonmetal' | 'halogen' | 'noble' | 'lanthanide' | 'actinide';

export interface ElementInfo {
  z: number;
  symbol: string;
  name: string;
  nameAr: string;
  mass: number | null;
  en: number | null; // Pauling electronegativity
  category: Category;
  period: number;
  group: number | null;
  row: number; // grid row (f-block sits on rows 9-10)
  col: number;
  block: 's' | 'p' | 'd' | 'f';
  shells: number[];
  config: string;
  outerElectrons: number;
  phase: 'gas' | 'liquid' | 'solid' | 'unknown';
  neutrons: number | null;
  description?: string;
}

const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const SUB = '₀₁₂₃₄₅₆₇₈₉';
export const sup = (n: number | string) => String(n).replace(/\d/g, d => SUP[+d]);
export const sub = (n: number | string) => String(n).replace(/\d/g, d => SUB[+d]);

export const CATEGORY_COLOR: Record<Category, string> = {
  alkali: '#F0705A',
  alkaline: '#F2A65A',
  transition: '#E3CF57',
  post: '#7FC8A9',
  metalloid: '#58B6C9',
  nonmetal: '#6C93F0',
  halogen: '#A38CF0',
  noble: '#D987D0',
  lanthanide: '#8FD36B',
  actinide: '#C7A27A',
};

export const CATEGORY_LABEL: Record<'en' | 'ar', Record<Category, string>> = {
  en: {
    alkali: 'Alkali metals', alkaline: 'Alkaline earth metals', transition: 'Transition metals',
    post: 'Post-transition metals', metalloid: 'Metalloids', nonmetal: 'Reactive nonmetals',
    halogen: 'Halogens', noble: 'Noble gases', lanthanide: 'Lanthanides', actinide: 'Actinides',
  },
  ar: {
    alkali: 'الفلزات القلوية', alkaline: 'القلوية الترابية', transition: 'العناصر الانتقالية',
    post: 'فلزات ما بعد الانتقالية', metalloid: 'أشباه الفلزات', nonmetal: 'اللافلزات',
    halogen: 'الهالوجينات', noble: 'الغازات النبيلة', lanthanide: 'اللانثانيدات', actinide: 'الأكتينيدات',
  },
};

export function categoryOf(z: number): Category {
  if ([2, 10, 18, 36, 54, 86, 118].includes(z)) return 'noble';
  if ([3, 11, 19, 37, 55, 87].includes(z)) return 'alkali';
  if ([4, 12, 20, 38, 56, 88].includes(z)) return 'alkaline';
  if (z >= 57 && z <= 71) return 'lanthanide';
  if (z >= 89 && z <= 103) return 'actinide';
  if ([9, 17, 35, 53, 85, 117].includes(z)) return 'halogen';
  if ([5, 14, 32, 33, 51, 52].includes(z)) return 'metalloid';
  if (z === 1 || [6, 7, 8, 15, 16, 34].includes(z)) return 'nonmetal';
  if ((z >= 21 && z <= 30) || (z >= 39 && z <= 48) || (z >= 72 && z <= 80) || (z >= 104 && z <= 112)) return 'transition';
  return 'post';
}

export const isMetal = (c: Category) =>
  ['alkali', 'alkaline', 'transition', 'post', 'lanthanide', 'actinide'].includes(c);

const STARTS = [0, 1, 3, 11, 19, 37, 55, 87, 119];
export function periodOf(z: number): number {
  for (let p = 1; p <= 7; p++) if (z < STARTS[p + 1]) return p;
  return 7;
}

export function gridPos(z: number): { row: number; col: number; group: number | null } {
  const p = periodOf(z);
  const off = z - STARTS[p];
  if (p === 1) return { row: 1, col: off === 0 ? 1 : 18, group: off === 0 ? 1 : 18 };
  if (p <= 3) {
    const col = off < 2 ? off + 1 : off + 11;
    return { row: p, col, group: col };
  }
  if (p <= 5) return { row: p, col: off + 1, group: off + 1 };
  if (off < 2) return { row: p, col: off + 1, group: off + 1 };
  if (off < 17) return { row: p === 6 ? 9 : 10, col: off - 2 + 3, group: null };
  const col = off - 13;
  return { row: p, col, group: col };
}

const ORDER = ['1s', '2s', '2p', '3s', '3p', '4s', '3d', '4p', '5s', '4d', '5p', '6s', '4f', '5d', '6p', '7s', '5f', '6d', '7p'];
const CAP: Record<string, number> = { s: 2, p: 6, d: 10, f: 14 };
const EXCEPTIONS: Record<number, Record<string, number>> = {
  24: { '4s': 1, '3d': 5 }, 29: { '4s': 1, '3d': 10 },
  41: { '5s': 1, '4d': 4 }, 42: { '5s': 1, '4d': 5 }, 44: { '5s': 1, '4d': 7 },
  45: { '5s': 1, '4d': 8 }, 46: { '5s': 0, '4d': 10 }, 47: { '5s': 1, '4d': 10 },
  57: { '4f': 0, '5d': 1 }, 58: { '4f': 1, '5d': 1 }, 64: { '4f': 7, '5d': 1 },
  78: { '6s': 1, '5d': 9 }, 79: { '6s': 1, '5d': 10 },
  89: { '5f': 0, '6d': 1 }, 90: { '5f': 0, '6d': 2 }, 91: { '5f': 2, '6d': 1 },
  92: { '5f': 3, '6d': 1 }, 93: { '5f': 4, '6d': 1 }, 96: { '5f': 7, '6d': 1 },
  103: { '6d': 0, '7p': 1 },
};

export function electronConfig(z: number): { config: string; shells: number[] } {
  const fill: Record<string, number> = {};
  let left = z;
  for (const orb of ORDER) {
    if (left <= 0) break;
    const take = Math.min(left, CAP[orb[1]]);
    fill[orb] = take;
    left -= take;
  }
  if (EXCEPTIONS[z]) Object.assign(fill, EXCEPTIONS[z]);
  const used = Object.entries(fill).filter(([, n]) => n > 0);
  const letterRank: Record<string, number> = { s: 0, p: 1, d: 2, f: 3 };
  used.sort((a, b) => +a[0][0] - +b[0][0] || letterRank[a[0][1]] - letterRank[b[0][1]]);
  const config = used.map(([o, n]) => `${o}${sup(n)}`).join(' ');
  const shells: number[] = [];
  used.forEach(([o, n]) => { shells[+o[0] - 1] = (shells[+o[0] - 1] || 0) + n; });
  return { config, shells: shells.map(n => n || 0) };
}

// Pauling electronegativity fallback (used only when the data file has no value)
const EN_FALLBACK: Record<number, number> = {
  1: 2.2, 3: 0.98, 4: 1.57, 5: 2.04, 6: 2.55, 7: 3.04, 8: 3.44, 9: 3.98, 11: 0.93, 12: 1.31, 13: 1.61, 14: 1.9,
  15: 2.19, 16: 2.58, 17: 3.16, 19: 0.82, 20: 1.0, 21: 1.36, 22: 1.54, 23: 1.63, 24: 1.66, 25: 1.55, 26: 1.83,
  27: 1.88, 28: 1.91, 29: 1.9, 30: 1.65, 31: 1.81, 32: 2.01, 33: 2.18, 34: 2.55, 35: 2.96, 36: 3.0, 37: 0.82,
  38: 0.95, 39: 1.22, 40: 1.33, 41: 1.6, 42: 2.16, 43: 1.9, 44: 2.2, 45: 2.28, 46: 2.2, 47: 1.93, 48: 1.69,
  49: 1.78, 50: 1.96, 51: 2.05, 52: 2.1, 53: 2.66, 54: 2.6, 55: 0.79, 56: 0.89, 57: 1.1, 72: 1.3, 73: 1.5,
  74: 2.36, 75: 1.9, 76: 2.2, 77: 2.2, 78: 2.28, 79: 2.54, 80: 2.0, 81: 1.62, 82: 2.33, 83: 2.02, 84: 2.0,
  85: 2.2, 87: 0.7, 88: 0.9,
};

const GASES = [1, 2, 7, 8, 9, 10, 17, 18, 36, 54, 86];

const pick = (o: any, keys: string[]) => {
  for (const k of keys) if (o?.[k] !== undefined && o?.[k] !== null && o?.[k] !== '') return o[k];
  return undefined;
};
const textOf = (v: any, lang: 'en' | 'ar'): string | undefined => {
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object') return v[lang] ?? v.en;
  return undefined;
};

let cache: ElementInfo[] | null = null;

export function getElements(): ElementInfo[] {
  if (cache) return cache;
  const raw: any[] = getFullPeriodicElements() as any[];
  cache = raw.map((e, i) => {
    const z: number = Number(pick(e, ['atomicNumber', 'number', 'z']) ?? i + 1);
    const pos = gridPos(z);
    const { config, shells } = electronConfig(z);
    const cat = categoryOf(z);
    const mass = Number(pick(e, ['atomicMass', 'mass', 'atomic_mass']));
    const enRaw = pick(e, ['electronegativity', 'en']);
    const en = enRaw !== undefined && !isNaN(Number(enRaw)) ? Number(enRaw) : EN_FALLBACK[z] ?? null;
    const nameRaw = pick(e, ['nameEn', 'name']);
    return {
      z,
      symbol: String(e.symbol),
      name: textOf(nameRaw, 'en') ?? String(e.symbol),
      nameAr: textOf(pick(e, ['nameAr', 'name_ar']) ?? nameRaw, 'ar') ?? String(e.symbol),
      mass: isNaN(mass) ? null : mass,
      en,
      category: cat,
      period: periodOf(z),
      group: pos.group,
      row: pos.row,
      col: pos.col,
      block: cat === 'lanthanide' || cat === 'actinide' ? 'f'
        : cat === 'transition' ? 'd'
        : z === 2 || pos.col <= 2 ? 's' : 'p',
      shells,
      config,
      outerElectrons: shells[shells.length - 1] ?? 0,
      phase: GASES.includes(z) ? 'gas' : [35, 80].includes(z) ? 'liquid' : z >= 104 || [85, 87, 117].includes(z) ? 'unknown' : 'solid',
      neutrons: isNaN(mass) ? null : Math.max(0, Math.round(mass) - z),
      description: textOf(pick(e, ['description', 'summary']), 'en'),
    } as ElementInfo;
  });
  return cache;
}

/** Typical ionic charge when the element acts as a cation */
const CHARGE_OVERRIDE: Record<number, number> = {
  22: 4, 23: 3, 24: 3, 25: 2, 26: 3, 27: 2, 28: 2, 29: 2, 30: 2, 47: 1, 48: 2, 79: 3, 80: 2, 50: 2, 82: 2, 83: 3,
};
export function cationCharge(e: ElementInfo): number {
  if (CHARGE_OVERRIDE[e.z]) return CHARGE_OVERRIDE[e.z];
  if (e.category === 'alkali') return 1;
  if (e.category === 'alkaline') return 2;
  if (e.category === 'lanthanide' || e.category === 'actinide') return 3;
  if (e.category === 'transition') return 2;
  if (e.group === 13) return 3;
  return e.group && e.group <= 2 ? e.group : 2;
}

/** Bonding capacity (valence) of a nonmetal */
export function valenceOf(e: ElementInfo): number {
  if (e.z === 1) return 1;
  if (e.group === 13) return 3;
  if (e.group === 14) return 4;
  if (e.group === 15) return 3;
  if (e.group === 16) return 2;
  if (e.group === 17) return 1;
  return 2;
}

/** Short facts for common elements */
export const FACTS: Record<string, { en: string; ar: string }> = {
  H: { en: 'Lightest and most abundant element in the universe; fuel of stars.', ar: 'أخف عنصر وأكثرها وفرة في الكون، وقود النجوم.' },
  He: { en: 'Second lightest; inert, used in balloons and to cool MRI magnets.', ar: 'ثاني أخف عنصر؛ خامل، يُستخدم في المناطيد وتبريد مغناطيس الرنين.' },
  C: { en: 'Backbone of organic life; exists as diamond, graphite and graphene.', ar: 'أساس الحياة العضوية؛ يوجد كالماس والجرافيت والغرافين.' },
  N: { en: 'About 78% of air; essential in proteins, DNA and fertilizers.', ar: 'نحو 78% من الهواء؛ أساسي في البروتينات والحمض النووي والأسمدة.' },
  O: { en: 'About 21% of air; needed for respiration and combustion.', ar: 'نحو 21% من الهواء؛ ضروري للتنفس والاحتراق.' },
  Na: { en: 'Soft, highly reactive metal; reacts violently with water.', ar: 'فلز لين شديد النشاط؛ يتفاعل بعنف مع الماء.' },
  Mg: { en: 'Burns with a brilliant white flame; central atom of chlorophyll.', ar: 'يحترق بلهب أبيض ساطع؛ الذرة المركزية في الكلوروفيل.' },
  Al: { en: 'Light, corrosion-resistant metal; most abundant metal in the crust.', ar: 'فلز خفيف مقاوم للتآكل؛ أكثر الفلزات وفرة في القشرة الأرضية.' },
  Si: { en: 'Basis of semiconductors, glass and sand.', ar: 'أساس أشباه الموصلات والزجاج والرمل.' },
  Cl: { en: 'Greenish toxic gas; disinfects water and forms table salt with sodium.', ar: 'غاز سام مخضر؛ يعقّم المياه ويكوّن ملح الطعام مع الصوديوم.' },
  K: { en: 'Soft reactive metal; essential for nerve signals and plants.', ar: 'فلز لين نشط؛ ضروري للإشارات العصبية والنبات.' },
  Ca: { en: 'Builds bones, teeth and shells.', ar: 'يبني العظام والأسنان والأصداف.' },
  Fe: { en: 'Core of Earth and of hemoglobin; rusts to iron(III) oxide.', ar: 'لبّ الأرض والهيموغلوبين؛ يصدأ مكوّنًا أكسيد الحديد III.' },
  Cu: { en: 'Excellent electrical conductor; turns green as copper carbonate.', ar: 'موصل كهربائي ممتاز؛ يخضرّ بتكوّن كربونات النحاس.' },
  Zn: { en: 'Used to galvanize steel and in batteries.', ar: 'يُستخدم في جلفنة الصلب والبطاريات.' },
  Ag: { en: 'Best electrical and thermal conductor of all metals.', ar: 'أفضل الفلزات توصيلًا للكهرباء والحرارة.' },
  Au: { en: 'Extremely unreactive, never tarnishes.', ar: 'خامل جدًا، لا يفقد بريقه.' },
  Hg: { en: 'Only metal that is liquid at room temperature; toxic.', ar: 'الفلز الوحيد السائل في درجة حرارة الغرفة؛ سام.' },
  Pb: { en: 'Dense, soft, toxic metal; formerly in pipes and paint.', ar: 'فلز كثيف لين سام؛ كان يُستخدم في الأنابيب والدهانات.' },
  U: { en: 'Heaviest naturally abundant element; nuclear fuel.', ar: 'أثقل عنصر طبيعي وفير؛ وقود نووي.' },
};

export const BEHAVIOR: Record<Category, { en: string; ar: string }> = {
  alkali: { en: 'Loses 1 electron very easily. Reacts violently with water and halogens.', ar: 'يفقد إلكترونًا واحدًا بسهولة بالغة. يتفاعل بعنف مع الماء والهالوجينات.' },
  alkaline: { en: 'Loses 2 electrons. Reactive, burns brightly in oxygen.', ar: 'يفقد إلكترونين. نشط ويحترق بسطوع في الأكسجين.' },
  transition: { en: 'Variable oxidation states, colored compounds, good catalysts.', ar: 'حالات تأكسد متعددة ومركبات ملونة ومحفزات جيدة.' },
  post: { en: 'Softer metals with lower melting points than transition metals.', ar: 'فلزات أكثر ليونة وأقل انصهارًا من الانتقالية.' },
  metalloid: { en: 'Properties between metals and nonmetals; often semiconductors.', ar: 'خواص بين الفلزات واللافلزات؛ غالبًا أشباه موصلات.' },
  nonmetal: { en: 'Gains or shares electrons; forms covalent molecules.', ar: 'يكتسب الإلكترونات أو يشاركها؛ يكوّن جزيئات تساهمية.' },
  halogen: { en: 'Needs 1 electron to complete its shell. Strong oxidizer.', ar: 'يحتاج إلكترونًا واحدًا لإكمال غلافه. عامل مؤكسد قوي.' },
  noble: { en: 'Full outer shell. Almost never forms compounds.', ar: 'غلافه الخارجي ممتلئ. نادرًا ما يكوّن مركبات.' },
  lanthanide: { en: 'Usually 3+ ions; used in magnets and phosphors.', ar: 'أيوناته عادةً 3+؛ تُستخدم في المغانط والفوسفورات.' },
  actinide: { en: 'All radioactive; includes uranium and plutonium.', ar: 'جميعها مشعة؛ ومنها اليورانيوم والبلوتونيوم.' },
};
