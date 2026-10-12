import { describe, it, expect } from 'vitest';
import { calculateFactoryCarbon } from './carbonSolver';
import { reactElements } from './reactionEngine';
import { getElements } from '../data/elementModel';

const el = (symbol: string) => getElements().find(e => e.symbol === symbol)!;

describe('Carbon footprint solver (Egypt factors)', () => {
  it('computes electricity 0.48 + diesel 2.68 emissions', () => {
    const r = calculateFactoryCarbon({ electricityKwh: 1000, dieselLiters: 100 });
    expect(r.electricityKg).toBeCloseTo(480, 6);
    expect(r.dieselKg).toBeCloseTo(268, 6);
    expect(r.totalKg).toBeCloseTo(748, 6);
    expect(r.electricityShare + r.dieselShare).toBeCloseTo(1, 6);
  });

  it('applies the solar what-if only to grid electricity', () => {
    const r = calculateFactoryCarbon({ electricityKwh: 1000, dieselLiters: 100, solarSharePct: 50 });
    expect(r.electricityKg).toBeCloseTo(240, 6);
    expect(r.dieselKg).toBeCloseTo(268, 6);
  });

  it('ignores negative or invalid input', () => {
    const r = calculateFactoryCarbon({ electricityKwh: -5, dieselLiters: NaN });
    expect(r.totalKg).toBe(0);
  });
});

describe('Reaction engine', () => {
  it('balances 2Na + Cl₂ → 2NaCl as an ionic reaction', () => {
    const r = reactElements(el('Na'), el('Cl'));
    expect(r.equation).toBe('2Na + Cl₂ → 2NaCl');
    expect(r.bond).toBe('ionic');
  });

  it('balances 2H₂ + O₂ → 2H₂O', () => {
    expect(reactElements(el('H'), el('O')).equation).toBe('2H₂ + O₂ → 2H₂O');
  });

  it('balances 4Fe + 3O₂ → 2Fe₂O₃', () => {
    expect(reactElements(el('Fe'), el('O')).equation).toBe('4Fe + 3O₂ → 2Fe₂O₃');
  });

  it('predicts no reaction for noble gases', () => {
    expect(reactElements(el('He'), el('Na')).kind).toBe('none');
  });

  it('treats two metals as an alloy, not a compound', () => {
    expect(reactElements(el('Cu'), el('Zn')).kind).toBe('alloy');
  });

  it('derives electron configuration with known exceptions', () => {
    expect(el('Cu').config).toContain('3d¹⁰');
    expect(el('Na').shells).toEqual([2, 8, 1]);
  });
});
