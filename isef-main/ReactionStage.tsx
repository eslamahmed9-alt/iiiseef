import React, { useEffect, useMemo, useState } from 'react';
import { CATEGORY_COLOR, ElementInfo, sup } from '../data/elementModel';
import { ReactionResult, isDiatomic } from '../simulators/reactionEngine';

const W = 800;
const H = 360;
const DURATION = 6000;

const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const radius = (e: ElementInfo) => 10 + e.period * 2.2;

interface AtomPos { symbol: string; el: ElementInfo; x: number; y: number; charge?: string }
interface Cluster { atoms: AtomPos[]; bonds: [number, number][] }

function buildCluster(res: ReactionResult): Cluster {
  const els: Record<string, ElementInfo> = { [res.a.symbol]: res.a, [res.b.symbol]: res.b };
  const queues = res.parts.map(p => ({ ...p }));
  const atoms: AtomPos[] = [];
  const bonds: [number, number][] = [];

  if (res.bond === 'ionic' || res.bond === 'metallic') {
    const order: string[] = [];
    while (queues.some(q => q.count > 0)) {
      for (const q of queues) if (q.count > 0) { order.push(q.symbol); q.count--; }
    }
    const n = order.length;
    const cols = Math.ceil(Math.sqrt(n));
    const rows = Math.ceil(n / cols);
    const rmax = Math.max(...order.map(s => radius(els[s])));
    const step = rmax * 2 + 4;
    order.forEach((s, i) => {
      const cx = (i % cols) - (cols - 1) / 2;
      const cy = Math.floor(i / cols) - (rows - 1) / 2;
      let charge: string | undefined;
      if (res.ions) {
        charge = s === res.ions.cation.symbol ? `${sup(res.ions.cation.charge)}⁺` : `${sup(res.ions.anion.charge)}⁻`;
      }
      atoms.push({ symbol: s, el: els[s], x: cx * step, y: cy * step, charge });
    });
    return { atoms, bonds };
  }

  // covalent
  const centerPart = res.parts.find(p => p.count === 1) ?? res.parts[0];
  const center = els[centerPart.symbol];
  atoms.push({ symbol: center.symbol, el: center, x: 0, y: 0 });
  const others: ElementInfo[] = [];
  res.parts.forEach(p => {
    const n = p.symbol === centerPart.symbol ? p.count - 1 : p.count;
    for (let i = 0; i < n; i++) others.push(els[p.symbol]);
  });
  const angles =
    others.length === 1 ? [0]
    : others.length === 2 ? (center.group === 16 ? [38, 142] : [0, 180])
    : others.length === 3 ? [-90, 30, 150]
    : others.length === 4 ? [45, 135, 225, 315]
    : others.map((_, i) => (360 / others.length) * i);
  others.forEach((o, i) => {
    const d = radius(center) + radius(o) + 6;
    const a = (angles[i] * Math.PI) / 180;
    atoms.push({ symbol: o.symbol, el: o, x: Math.cos(a) * d, y: Math.sin(a) * d });
    bonds.push([0, i + 1]);
  });
  return { atoms, bonds };
}

const Atom: React.FC<{ el: ElementInfo; x: number; y: number; opacity?: number; scale?: number; charge?: string }> = ({ el, x, y, opacity = 1, scale = 1, charge }) => {
  const r = radius(el);
  const color = CATEGORY_COLOR[el.category];
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={opacity}>
      <circle r={r} fill={color} stroke="#0d1013" strokeWidth={2} />
      <text textAnchor="middle" dominantBaseline="central" fontSize={Math.max(10, r * 0.85)} fontWeight={700} fill="#0d1013">
        {el.symbol}
      </text>
      {charge && (
        <text x={r * 0.75} y={-r * 0.75} fontSize={12} fontWeight={700} fill="#fff">{charge}</text>
      )}
    </g>
  );
};

interface Props { result: ReactionResult; playKey: number; isAr: boolean }

export const ReactionStage: React.FC<Props> = ({ result, playKey, isAr }) => {
  const [p, setP] = useState(0);

  useEffect(() => {
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { setP(1); return; }
    let raf = 0;
    const t0 = performance.now();
    setP(0);
    const tick = (t: number) => {
      const v = Math.min(1, (t - t0) / DURATION);
      setP(v);
      if (v < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playKey, result]);

  const layout = useMemo(() => {
    const sa = isDiatomic(result.a.symbol) ? 2 : 1;
    const sb = isDiatomic(result.b.symbol) ? 2 : 1;
    const na = Math.min(8, result.coeffs.a);
    const nb = Math.min(8, result.coeffs.b);
    const yOf = (i: number, n: number) => (n === 1 ? H / 2 : 60 + (i + 0.5) * ((H - 120) / n));
    const cluster = result.kind === 'none' ? null : buildCluster(result);
    const c = Math.max(1, result.coeffs.c);
    const perRow = c > 3 ? Math.ceil(c / 2) : c;
    const rows = c > 3 ? 2 : 1;
    const slots = Array.from({ length: c }, (_, i) => ({
      x: W / 2 + ((i % perRow) - (perRow - 1) / 2) * 150,
      y: H / 2 + (Math.floor(i / perRow) - (rows - 1) / 2) * 130,
    }));
    return { sa, sb, na, nb, yOf, cluster, slots, scale: c > 3 ? 0.8 : 1 };
  }, [result]);

  const { sa, sb, na, nb, yOf, cluster, slots, scale } = layout;
  const reacts = result.kind !== 'none';

  const approach = ease(clamp(p / 0.4));
  const collide = clamp((p - 0.4) / 0.15);
  const retreat = ease(clamp((p - 0.55) / 0.35));
  const reactantFade = reacts ? 1 - clamp((p - 0.52) / 0.1) : 1;
  const productIn = ease(clamp((p - 0.55) / 0.25));
  const burst = clamp((p - 0.42) / 0.35);
  const flashColor = result.vigor > 0.6 ? '#FFD27A' : '#9FB4FF';

  const reactantX = (side: 'a' | 'b') => {
    const start = side === 'a' ? 70 : W - 70;
    const meet = side === 'a' ? 290 : W - 290;
    const mid = W / 2;
    let x = start + (meet - start) * approach;
    x += (mid - meet) * collide * 0.85;
    if (!reacts) x -= (x - start) * retreat; // bounce back to the start
    return x;
  };
  const jitter = (i: number) => (collide > 0 && collide < 1 ? Math.sin(p * 90 + i * 2) * 3 * result.vigor : 0);

  const renderReactants = (el: ElementInfo, count: number, side: 'a' | 'b', s: number) =>
    Array.from({ length: count }, (_, i) => {
      const y0 = yOf(i, count);
      const y = y0 + (H / 2 - y0) * collide * 0.6 * (reacts ? 1 : 0.2) * (reacts ? 1 : 1 - retreat);
      const x = reactantX(side) + jitter(i);
      const r = radius(el);
      const gap = s === 2 ? r * 0.85 : 0;
      return (
        <g key={`${side}${i}`} opacity={reactantFade}>
          {s === 2 && <line x1={x - gap} y1={y} x2={x + gap} y2={y} stroke="#e8ecf2" strokeWidth={4} />}
          <Atom el={el} x={x - gap} y={y} />
          {s === 2 && <Atom el={el} x={x + gap} y={y} />}
        </g>
      );
    });

  const phaseLabel = p < 0.4 ? (isAr ? 'اقتراب' : 'Approach') : p < 0.55 ? (isAr ? 'تصادم' : 'Collision')
    : reacts ? (isAr ? 'نواتج' : 'Products') : (isAr ? 'ارتداد' : 'Rebound');

  const particles = Array.from({ length: 16 }, (_, i) => {
    const ang = (i / 16) * Math.PI * 2;
    const d = burst * (50 + result.vigor * 150) * (0.6 + ((i * 37) % 10) / 25);
    return { x: W / 2 + Math.cos(ang) * d, y: H / 2 + Math.sin(ang) * d, o: (1 - burst) * 0.9 };
  });

  return (
    <div className="relative overflow-hidden rounded-lg border border-[var(--line)] bg-[#0b0e12]" dir="ltr">
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img"
        aria-label={isAr ? 'محاكاة التفاعل الكيميائي' : 'Chemical reaction animation'}>
        <defs>
          <radialGradient id="flash">
            <stop offset="0%" stopColor={flashColor} stopOpacity="0.9" />
            <stop offset="100%" stopColor={flashColor} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* flash + shock ring */}
        {burst > 0 && burst < 1 && (
          <>
            <circle cx={W / 2} cy={H / 2} r={30 + burst * (80 + result.vigor * 120)} fill="url(#flash)" opacity={(1 - burst) * (0.3 + result.vigor * 0.7)} />
            <circle cx={W / 2} cy={H / 2} r={burst * (90 + result.vigor * 130)} fill="none" stroke={flashColor} strokeWidth={3} opacity={(1 - burst) * 0.7} />
            {particles.map((q, i) => <circle key={i} cx={q.x} cy={q.y} r={3} fill={flashColor} opacity={q.o} />)}
          </>
        )}

        {renderReactants(result.a, na, 'a', sa)}
        {renderReactants(result.b, nb, 'b', sb)}

        {/* products */}
        {reacts && cluster && productIn > 0 && slots.map((slot, k) => (
          <g key={k} transform={`translate(${slot.x} ${slot.y}) scale(${(0.3 + 0.7 * productIn) * scale})`} opacity={productIn}>
            {cluster.bonds.map(([i, j], bi) => (
              <line key={bi} x1={cluster.atoms[i].x} y1={cluster.atoms[i].y} x2={cluster.atoms[j].x} y2={cluster.atoms[j].y} stroke="#e8ecf2" strokeWidth={4} />
            ))}
            {cluster.atoms.map((a, i) => <Atom key={i} el={a.el} x={a.x} y={a.y} charge={a.charge} />)}
          </g>
        ))}

        <text x={16} y={26} fontSize={13} fill="#9aa6b5" fontFamily="inherit">{phaseLabel}</text>
        {reacts && productIn > 0.6 && (
          <text x={W / 2} y={H - 18} textAnchor="middle" fontSize={20} fontWeight={700} fill="#f2f5f9" opacity={clamp((productIn - 0.6) / 0.4)}>
            {result.productText}
          </text>
        )}
      </svg>
      <div className="h-1 w-full bg-[#1a2027]">
        <div className="h-full bg-[var(--accent)]" style={{ width: `${p * 100}%` }} />
      </div>
    </div>
  );
};
