import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  BEHAVIOR, CATEGORY_COLOR, CATEGORY_LABEL, Category, ElementInfo, FACTS, getElements,
} from '../data/elementModel';
import { reactElements } from '../simulators/reactionEngine';
import { ReactionStage } from './ReactionStage';

const MAX_SELECTED = 4;

const T = {
  en: {
    title: 'Periodic table', sub: 'Click one element to inspect it. Click two or more to see them react.',
    search: 'Search by name, symbol or number', all: 'All', details: 'Element details',
    bench: 'Reaction bench', empty: 'Pick at least two elements from the table to start a reaction.',
    selected: 'Selected', replay: 'Replay', clear: 'Clear', equation: 'Balanced equation', product: 'Product',
    bond: 'Bond type', dEN: 'Electronegativity difference', dH: 'Formation enthalpy', seen: 'What you would observe',
    why: 'Why it happens', pair: 'Reaction pair', mass: 'Atomic mass', number: 'Atomic number', group: 'Group',
    period: 'Period', block: 'Block', phase: 'State at 25 °C', protons: 'Protons', neutrons: 'Neutrons (most common)',
    electrons: 'Electrons', outer: 'Outer-shell electrons', en: 'Electronegativity', config: 'Electron configuration',
    behavior: 'Chemical behavior', shells: 'Electron shells', fact: 'Good to know', none: 'No reaction',
    phases: { gas: 'Gas', liquid: 'Liquid', solid: 'Solid', unknown: 'Unknown / synthetic' },
    bonds: { ionic: 'Ionic', polar: 'Polar covalent', nonpolar: 'Nonpolar covalent', metallic: 'Metallic', none: 'None' },
    approx: 'approx.', na: '—', lan: 'Lanthanides', act: 'Actinides',
  },
  ar: {
    title: 'الجدول الدوري', sub: 'اضغط على عنصر لاستعراض تفاصيله، واضغط على عنصرين أو أكثر لمشاهدة التفاعل بينهم.',
    search: 'ابحث بالاسم أو الرمز أو الرقم', all: 'الكل', details: 'تفاصيل العنصر',
    bench: 'منصة التفاعلات', empty: 'اختر عنصرين على الأقل من الجدول لبدء التفاعل.',
    selected: 'المحدد', replay: 'إعادة التشغيل', clear: 'مسح', equation: 'المعادلة الموزونة', product: 'الناتج',
    bond: 'نوع الرابطة', dEN: 'فرق السالبية الكهربية', dH: 'أنثالبي التكوين', seen: 'ما ستلاحظه',
    why: 'سبب حدوثه', pair: 'زوج التفاعل', mass: 'الكتلة الذرية', number: 'العدد الذري', group: 'المجموعة',
    period: 'الدورة', block: 'الفئة', phase: 'الحالة عند 25 °م', protons: 'البروتونات', neutrons: 'النيوترونات (الأشيع)',
    electrons: 'الإلكترونات', outer: 'إلكترونات الغلاف الخارجي', en: 'السالبية الكهربية', config: 'التوزيع الإلكتروني',
    behavior: 'السلوك الكيميائي', shells: 'مستويات الطاقة', fact: 'معلومة', none: 'لا يوجد تفاعل',
    phases: { gas: 'غاز', liquid: 'سائل', solid: 'صلب', unknown: 'غير معروف / مصنّع' },
    bonds: { ionic: 'أيونية', polar: 'تساهمية قطبية', nonpolar: 'تساهمية غير قطبية', metallic: 'فلزية', none: 'لا يوجد' },
    approx: 'تقريبي', na: '—', lan: 'اللانثانيدات', act: 'الأكتينيدات',
  },
};

const ShellDiagram: React.FC<{ el: ElementInfo }> = ({ el }) => {
  const size = 200;
  const c = size / 2;
  const n = el.shells.length;
  const step = (c - 22) / Math.max(n, 1);
  const color = CATEGORY_COLOR[el.category];
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto block w-full max-w-[220px]" aria-hidden>
      <circle cx={c} cy={c} r={12} fill={color} />
      <text x={c} y={c} textAnchor="middle" dominantBaseline="central" fontSize={9} fontWeight={700} fill="#0d1013">{el.z}+</text>
      {el.shells.map((count, i) => {
        const r = 22 + step * i + step * 0.55;
        return (
          <g key={i}>
            <circle cx={c} cy={c} r={r} fill="none" stroke="#2b343f" strokeWidth={1} />
            {Array.from({ length: count }, (_, k) => {
              const a = (k / count) * Math.PI * 2 - Math.PI / 2;
              return <circle key={k} cx={c + Math.cos(a) * r} cy={c + Math.sin(a) * r} r={2.6} fill={i === n - 1 ? color : '#8d99a8'} />;
            })}
          </g>
        );
      })}
    </svg>
  );
};

const Row: React.FC<{ k: string; v: React.ReactNode }> = ({ k, v }) => (
  <div className="flex items-baseline justify-between gap-4 border-b border-[var(--line)] py-1.5 text-sm">
    <dt className="text-[var(--muted)]">{k}</dt>
    <dd className="text-end font-medium tabular-nums">{v}</dd>
  </div>
);

export const ChemistryLab: React.FC = () => {
  const ctx: any = useLanguage();
  const lang = (ctx?.language ?? ctx?.lang ?? 'en') as string;
  const isAr = lang === 'ar';
  const L = isAr ? T.ar : T.en;
  const catLabels = CATEGORY_LABEL[isAr ? 'ar' : 'en'];

  const elements = useMemo(getElements, []);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Category | 'all'>('all');
  const [selected, setSelected] = useState<number[]>([]);
  const [focus, setFocus] = useState<number>(11);
  const [pairIdx, setPairIdx] = useState(0);
  const [playKey, setPlayKey] = useState(0);

  const byZ = useMemo(() => new Map(elements.map(e => [e.z, e])), [elements]);
  const nameOf = (e: ElementInfo) => (isAr ? e.nameAr : e.name);

  const pairs = useMemo(() => {
    const list: [ElementInfo, ElementInfo][] = [];
    for (let i = 0; i < selected.length; i++)
      for (let j = i + 1; j < selected.length; j++) list.push([byZ.get(selected[i])!, byZ.get(selected[j])!]);
    return list;
  }, [selected, byZ]);

  useEffect(() => {
    setPairIdx(Math.max(0, pairs.length - 1));
    setPlayKey(k => k + 1);
  }, [selected.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  const result = useMemo(() => {
    const pair = pairs[Math.min(pairIdx, pairs.length - 1)];
    return pair ? reactElements(pair[0], pair[1]) : null;
  }, [pairs, pairIdx]);

  const onPick = (z: number) => {
    setFocus(z);
    setSelected(prev => {
      if (prev.includes(z)) return prev.filter(v => v !== z);
      const next = [...prev, z];
      return next.length > MAX_SELECTED ? next.slice(1) : next;
    });
  };

  const q = query.trim().toLowerCase();
  const matches = (e: ElementInfo) =>
    (filter === 'all' || e.category === filter) &&
    (!q || e.name.toLowerCase().includes(q) || e.nameAr.includes(q) || e.symbol.toLowerCase() === q || String(e.z) === q || e.symbol.toLowerCase().startsWith(q));

  const f = byZ.get(focus) ?? elements[0];
  const fColor = CATEGORY_COLOR[f.category];

  return (
    <section className="mx-auto max-w-[1400px] px-4 pb-16 sm:px-6" dir={isAr ? 'rtl' : 'ltr'}>
      <header className="flex flex-wrap items-end justify-between gap-4 pb-6">
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">{L.title}</h1>
          <p className="mt-2 max-w-xl text-[var(--muted)]">{L.sub}</p>
        </div>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={L.search}
          aria-label={L.search}
          className="w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)] sm:w-72"
        />
      </header>

      {/* legend / filter */}
      <div className="flex flex-wrap gap-2 pb-4">
        <button onClick={() => setFilter('all')} className={`chip ${filter === 'all' ? 'chip-on' : ''}`}>{L.all}</button>
        {(Object.keys(catLabels) as Category[]).map(c => (
          <button key={c} onClick={() => setFilter(filter === c ? 'all' : c)} className={`chip ${filter === c ? 'chip-on' : ''}`}>
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: CATEGORY_COLOR[c] }} />
            {catLabels[c]}
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* TABLE */}
        <div className="overflow-x-auto pb-2" dir="ltr">
          <div className="grid min-w-[900px] gap-[3px]" style={{ gridTemplateColumns: 'repeat(18, minmax(0, 1fr))' }}>
            {elements.map(e => {
              const on = selected.includes(e.z);
              const dim = !matches(e);
              const color = CATEGORY_COLOR[e.category];
              return (
                <button
                  key={e.z}
                  onClick={() => onPick(e.z)}
                  aria-pressed={on}
                  aria-label={`${nameOf(e)} ${e.z}`}
                  className="tile"
                  style={{
                    gridRow: e.row, gridColumn: e.col,
                    background: on ? color : `color-mix(in srgb, ${color} 16%, var(--surface))`,
                    borderColor: on ? '#fff' : `color-mix(in srgb, ${color} 55%, transparent)`,
                    color: on ? '#0d1013' : 'var(--text)',
                    opacity: dim ? 0.22 : 1,
                    outline: focus === e.z && !on ? `2px solid ${color}` : undefined,
                  }}
                >
                  <span className="tile-z">{e.z}</span>
                  <span className="tile-sym">{e.symbol}</span>
                  <span className="tile-name">{isAr ? e.nameAr : e.name}</span>
                </button>
              );
            })}
            <div className="flex items-center justify-center rounded border border-dashed border-[var(--line)] text-[10px] text-[var(--muted)]" style={{ gridRow: 6, gridColumn: 3 }}>57–71</div>
            <div className="flex items-center justify-center rounded border border-dashed border-[var(--line)] text-[10px] text-[var(--muted)]" style={{ gridRow: 7, gridColumn: 3 }}>89–103</div>
            <div className="self-center text-xs text-[var(--muted)]" style={{ gridRow: 9, gridColumn: '1 / span 2' }}>{L.lan}</div>
            <div className="self-center text-xs text-[var(--muted)]" style={{ gridRow: 10, gridColumn: '1 / span 2' }}>{L.act}</div>
          </div>
        </div>

        {/* DETAILS */}
        <aside className="panel self-start" aria-live="polite">
          <div className="flex items-start gap-4">
            <div className="grid h-24 w-24 shrink-0 place-items-center rounded-md" style={{ background: fColor, color: '#0d1013' }}>
              <div className="text-center leading-none">
                <div className="text-xs font-semibold">{f.z}</div>
                <div className="text-4xl font-extrabold">{f.symbol}</div>
                <div className="mt-1 text-[11px] font-semibold tabular-nums">{f.mass?.toFixed(3) ?? L.na}</div>
              </div>
            </div>
            <div className="min-w-0">
              <h2 className="text-2xl font-bold">{nameOf(f)}</h2>
              <p className="text-sm text-[var(--muted)]">{isAr ? f.name : f.nameAr}</p>
              <p className="mt-1 text-sm" style={{ color: fColor }}>{catLabels[f.category]}</p>
            </div>
          </div>

          <div className="mt-4"><ShellDiagram el={f} /></div>
          <p className="mt-1 text-center text-xs text-[var(--muted)]">{L.shells}: {f.shells.join(' · ')}</p>

          <dl className="mt-4">
            <Row k={L.number} v={f.z} />
            <Row k={L.mass} v={f.mass?.toFixed(3) ?? L.na} />
            <Row k={L.group} v={f.group ?? (f.category === 'lanthanide' ? L.lan : L.act)} />
            <Row k={L.period} v={f.period} />
            <Row k={L.block} v={f.block} />
            <Row k={L.phase} v={L.phases[f.phase]} />
            <Row k={L.protons} v={f.z} />
            <Row k={L.neutrons} v={f.neutrons ?? L.na} />
            <Row k={L.electrons} v={f.z} />
            <Row k={L.outer} v={f.outerElectrons} />
            <Row k={L.en} v={f.en?.toFixed(2) ?? L.na} />
          </dl>

          <div className="mt-4 text-sm">
            <div className="text-[var(--muted)]">{L.config}</div>
            <div className="mt-1 break-words font-mono text-[13px]" dir="ltr">{f.config}</div>
          </div>
          <div className="mt-4 text-sm">
            <div className="text-[var(--muted)]">{L.behavior}</div>
            <p className="mt-1 leading-relaxed">{BEHAVIOR[f.category][isAr ? 'ar' : 'en']}</p>
          </div>
          {(FACTS[f.symbol] || f.description) && (
            <div className="mt-4 text-sm">
              <div className="text-[var(--muted)]">{L.fact}</div>
              <p className="mt-1 leading-relaxed">{FACTS[f.symbol]?.[isAr ? 'ar' : 'en'] ?? f.description}</p>
            </div>
          )}
        </aside>
      </div>

      {/* REACTION BENCH */}
      <div className="panel mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold">{L.bench}</h2>
          <div className="flex items-center gap-2">
            {selected.map(z => {
              const e = byZ.get(z)!;
              return (
                <button key={z} onClick={() => onPick(z)} className="chip chip-on" style={{ borderColor: CATEGORY_COLOR[e.category] }} title={nameOf(e)}>
                  <span className="font-bold">{e.symbol}</span> ✕
                </button>
              );
            })}
            {selected.length > 0 && <button className="chip" onClick={() => setSelected([])}>{L.clear}</button>}
          </div>
        </div>

        {!result ? (
          <p className="py-10 text-center text-[var(--muted)]">{L.empty}</p>
        ) : (
          <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <div>
              <ReactionStage result={result} playKey={playKey} isAr={isAr} />
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button className="btn" onClick={() => setPlayKey(k => k + 1)}>{L.replay}</button>
                {pairs.length > 1 && (
                  <>
                    <span className="text-sm text-[var(--muted)]">{L.pair}:</span>
                    {pairs.map(([x, y], i) => (
                      <button key={i} onClick={() => { setPairIdx(i); setPlayKey(k => k + 1); }} className={`chip ${i === pairIdx ? 'chip-on' : ''}`}>
                        {x.symbol} + {y.symbol}
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>

            <div>
              <div className="text-sm text-[var(--muted)]">{L.equation}</div>
              <div className="mt-1 text-2xl font-bold leading-snug" dir="ltr">{result.equation}</div>
              <dl className="mt-4">
                {result.kind !== 'none' && <Row k={L.product} v={result.productName[isAr ? 'ar' : 'en']} />}
                <Row k={L.bond} v={L.bonds[result.bond]} />
                <Row k={L.dEN} v={result.deltaEN !== null ? result.deltaEN.toFixed(2) : L.na} />
                {result.dH !== null && <Row k={L.dH} v={`${result.dH} kJ/mol (${L.approx})`} />}
              </dl>
              <div className="mt-4 text-sm">
                <div className="text-[var(--muted)]">{L.seen}</div>
                <p className="mt-1 leading-relaxed">{result.observation[isAr ? 'ar' : 'en']}</p>
              </div>
              <div className="mt-4 text-sm">
                <div className="text-[var(--muted)]">{L.why}</div>
                <p className="mt-1 leading-relaxed">{result.explanation[isAr ? 'ar' : 'en']}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ChemistryLab;
