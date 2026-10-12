import React, { useMemo, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  DIESEL_FACTOR, ELECTRIC_FACTOR, KG_CO2_PER_TREE_YEAR, calculateFactoryCarbon,
} from '../simulators/carbonSolver';

const T = {
  en: {
    title: 'Factory carbon footprint',
    sub: 'Enter what your factory uses and see the CO₂ it releases, using Egypt-specific emission factors.',
    period: 'Entries are per', month: 'month', year: 'year',
    elec: 'Grid electricity (kWh)', diesel: 'Diesel (liters)', solar: 'Share of electricity replaced by solar',
    total: 'Total emissions', perYear: 'per year', tonnes: 'tonnes CO₂e', split: 'Where it comes from',
    eShare: 'Electricity', dShare: 'Diesel', whatIf: 'What if you add solar?',
    now: 'Now', withSolar: 'With solar', saved: 'Saved', trees: 'Trees needed to absorb one year of emissions',
    assumptions: 'Emission factors', factorNote: 'Editable. Check them against the latest official values before using in a report.',
    eF: 'Electricity (kg CO₂e per kWh)', dF: 'Diesel (kg CO₂e per liter)', treeNote: `Assumes ${KG_CO2_PER_TREE_YEAR} kg CO₂ absorbed per tree per year.`,
    empty: 'Enter electricity or diesel use to see results.',
  },
  ar: {
    title: 'البصمة الكربونية للمصنع',
    sub: 'أدخل استهلاك المصنع وشوف كمية CO₂ الناتجة، بمعاملات انبعاثات خاصة بمصر.',
    period: 'الأرقام المدخلة لكل', month: 'شهر', year: 'سنة',
    elec: 'كهرباء الشبكة (كيلوواط ساعة)', diesel: 'السولار (لتر)', solar: 'نسبة الكهرباء المستبدلة بالطاقة الشمسية',
    total: 'إجمالي الانبعاثات', perYear: 'في السنة', tonnes: 'طن مكافئ CO₂', split: 'مصدر الانبعاثات',
    eShare: 'الكهرباء', dShare: 'السولار', whatIf: 'لو ركّبت طاقة شمسية؟',
    now: 'الآن', withSolar: 'مع الطاقة الشمسية', saved: 'الوفر', trees: 'عدد الأشجار اللازمة لامتصاص انبعاثات سنة',
    assumptions: 'معاملات الانبعاثات', factorNote: 'قابلة للتعديل. راجعها مع أحدث القيم الرسمية قبل استخدامها في أي تقرير.',
    eF: 'الكهرباء (كجم CO₂ لكل كيلوواط ساعة)', dF: 'السولار (كجم CO₂ لكل لتر)', treeNote: `بافتراض أن الشجرة تمتص ${KG_CO2_PER_TREE_YEAR} كجم CO₂ في السنة.`,
    empty: 'أدخل استهلاك الكهرباء أو السولار لعرض النتائج.',
  },
};

const ELEC_COLOR = '#F2B84B';
const DIESEL_COLOR = '#8B9CFF';

const fmt = (n: number, d = 0) => n.toLocaleString('en-US', { maximumFractionDigits: d });

const Donut: React.FC<{ eShare: number; dShare: number; centerTop: string; centerBottom: string }> = ({ eShare, dShare, centerTop, centerBottom }) => {
  const r = 70;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 200 200" className="mx-auto block w-full max-w-[240px]" role="img" aria-label="Emission split">
      <circle cx={100} cy={100} r={r} fill="none" stroke="#222a33" strokeWidth={22} />
      <circle cx={100} cy={100} r={r} fill="none" stroke={ELEC_COLOR} strokeWidth={22}
        strokeDasharray={`${c * eShare} ${c}`} transform="rotate(-90 100 100)" style={{ transition: 'stroke-dasharray .5s ease' }} />
      <circle cx={100} cy={100} r={r} fill="none" stroke={DIESEL_COLOR} strokeWidth={22}
        strokeDasharray={`${c * dShare} ${c}`} strokeDashoffset={-c * eShare} transform="rotate(-90 100 100)" style={{ transition: 'stroke-dasharray .5s ease' }} />
      <text x={100} y={96} textAnchor="middle" fontSize={26} fontWeight={700} fill="#f2f5f9">{centerTop}</text>
      <text x={100} y={118} textAnchor="middle" fontSize={11} fill="#9aa6b5">{centerBottom}</text>
    </svg>
  );
};

export const CarbonLab: React.FC = () => {
  const ctx: any = useLanguage();
  const isAr = (ctx?.language ?? ctx?.lang) === 'ar';
  const L = isAr ? T.ar : T.en;

  const [perMonth, setPerMonth] = useState(true);
  const [electricity, setElectricity] = useState('50000');
  const [diesel, setDiesel] = useState('4000');
  const [solar, setSolar] = useState(0);
  const [eFactor, setEFactor] = useState(String(ELECTRIC_FACTOR));
  const [dFactor, setDFactor] = useState(String(DIESEL_FACTOR));

  const mult = perMonth ? 12 : 1;
  const base = {
    electricityKwh: (parseFloat(electricity) || 0) * mult,
    dieselLiters: (parseFloat(diesel) || 0) * mult,
    electricFactor: parseFloat(eFactor) || ELECTRIC_FACTOR,
    dieselFactor: parseFloat(dFactor) || DIESEL_FACTOR,
  };
  const now = useMemo(() => calculateFactoryCarbon(base), [electricity, diesel, perMonth, eFactor, dFactor]); // eslint-disable-line react-hooks/exhaustive-deps
  const withSolar = useMemo(() => calculateFactoryCarbon({ ...base, solarSharePct: solar }), [electricity, diesel, perMonth, eFactor, dFactor, solar]); // eslint-disable-line react-hooks/exhaustive-deps
  const saved = now.totalKg - withSolar.totalKg;
  const maxBar = Math.max(now.totalKg, 1);

  return (
    <section className="mx-auto max-w-[1200px] px-4 pb-16 sm:px-6" dir={isAr ? 'rtl' : 'ltr'}>
      <header className="pb-6">
        <h1 className="text-3xl font-bold sm:text-4xl">{L.title}</h1>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">{L.sub}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        {/* FORM */}
        <div className="panel self-start">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[var(--muted)]">{L.period}</span>
            <button className={`chip ${perMonth ? 'chip-on' : ''}`} onClick={() => setPerMonth(true)}>{L.month}</button>
            <button className={`chip ${!perMonth ? 'chip-on' : ''}`} onClick={() => setPerMonth(false)}>{L.year}</button>
          </div>

          <label className="mt-5 block text-sm">
            <span className="text-[var(--muted)]">{L.elec}</span>
            <input type="number" min={0} inputMode="decimal" value={electricity} onChange={e => setElectricity(e.target.value)} className="field" />
          </label>
          <label className="mt-4 block text-sm">
            <span className="text-[var(--muted)]">{L.diesel}</span>
            <input type="number" min={0} inputMode="decimal" value={diesel} onChange={e => setDiesel(e.target.value)} className="field" />
          </label>
          <label className="mt-4 block text-sm">
            <span className="flex justify-between text-[var(--muted)]"><span>{L.solar}</span><span className="tabular-nums text-[var(--text)]">{solar}%</span></span>
            <input type="range" min={0} max={100} step={5} value={solar} onChange={e => setSolar(+e.target.value)} className="mt-2 w-full accent-[var(--accent)]" />
          </label>

          <details className="mt-5 text-sm">
            <summary className="cursor-pointer text-[var(--muted)]">{L.assumptions}</summary>
            <p className="mt-2 text-xs text-[var(--muted)]">{L.factorNote}</p>
            <label className="mt-3 block"><span className="text-[var(--muted)]">{L.eF}</span>
              <input type="number" step="0.01" value={eFactor} onChange={e => setEFactor(e.target.value)} className="field" /></label>
            <label className="mt-3 block"><span className="text-[var(--muted)]">{L.dF}</span>
              <input type="number" step="0.01" value={dFactor} onChange={e => setDFactor(e.target.value)} className="field" /></label>
          </details>
        </div>

        {/* RESULTS */}
        <div className="grid gap-6">
          {now.totalKg === 0 ? (
            <div className="panel py-16 text-center text-[var(--muted)]">{L.empty}</div>
          ) : (
            <>
              <div className="panel grid items-center gap-6 sm:grid-cols-[1fr_auto]">
                <div>
                  <div className="text-sm text-[var(--muted)]">{L.total} ({L.perYear})</div>
                  <div className="mt-1 text-5xl font-extrabold tabular-nums sm:text-6xl">{fmt(now.totalTonnes, 1)}</div>
                  <div className="text-lg text-[var(--muted)]">{L.tonnes}</div>
                  <p className="mt-4 text-sm">{L.trees}: <strong className="tabular-nums">{fmt(now.treesToOffset)}</strong></p>
                  <p className="mt-1 text-xs text-[var(--muted)]">{L.treeNote}</p>
                </div>
                <Donut eShare={now.electricityShare} dShare={now.dieselShare} centerTop={`${Math.round(now.electricityShare * 100)}%`} centerBottom={L.eShare} />
              </div>

              <div className="panel">
                <h2 className="text-lg font-bold">{L.split}</h2>
                <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                  <li className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-sm" style={{ background: ELEC_COLOR }} />
                    <span className="flex-1">{L.eShare}</span>
                    <span className="tabular-nums">{fmt(now.electricityKg / 1000, 1)} t</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-sm" style={{ background: DIESEL_COLOR }} />
                    <span className="flex-1">{L.dShare}</span>
                    <span className="tabular-nums">{fmt(now.dieselKg / 1000, 1)} t</span>
                  </li>
                </ul>
              </div>

              <div className="panel">
                <h2 className="text-lg font-bold">{L.whatIf}</h2>
                <div className="mt-4 grid gap-3" dir="ltr">
                  {[{ k: L.now, v: now.totalKg, c: '#8d99a8' }, { k: L.withSolar, v: withSolar.totalKg, c: '#5BD6A0' }].map(row => (
                    <div key={row.k} className="grid grid-cols-[110px_1fr_90px] items-center gap-3 text-sm">
                      <span className="text-[var(--muted)]">{row.k}</span>
                      <div className="h-3 rounded-sm bg-[#222a33]">
                        <div className="h-full rounded-sm" style={{ width: `${(row.v / maxBar) * 100}%`, background: row.c, transition: 'width .5s ease' }} />
                      </div>
                      <span className="text-end tabular-nums">{fmt(row.v / 1000, 1)} t</span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-sm">{L.saved}: <strong className="tabular-nums">{fmt(saved / 1000, 1)} {L.tonnes}</strong></p>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default CarbonLab;
