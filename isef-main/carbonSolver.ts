// Factory carbon footprint calculator (Egypt-specific factors)

/** kg CO2e per kWh of grid electricity in Egypt */
export const ELECTRIC_FACTOR = 0.48;
/** kg CO2e per liter of diesel burned */
export const DIESEL_FACTOR = 2.68;
/** Approximate CO2 absorbed by one mature tree per year (kg) — educational assumption */
export const KG_CO2_PER_TREE_YEAR = 21;

export interface CarbonInput {
  electricityKwh: number;
  dieselLiters: number;
  /** Share of electricity replaced by on-site solar (0–100). Optional what-if. */
  solarSharePct?: number;
  electricFactor?: number;
  dieselFactor?: number;
}

export interface CarbonResult {
  electricityKg: number;
  dieselKg: number;
  totalKg: number;
  totalTonnes: number;
  electricityShare: number; // 0..1
  dieselShare: number; // 0..1
  treesToOffset: number; // trees needed for one year
}

const safe = (v: number) => (Number.isFinite(v) && v > 0 ? v : 0);

export function calculateFactoryCarbon(input: CarbonInput): CarbonResult {
  const ef = input.electricFactor ?? ELECTRIC_FACTOR;
  const df = input.dieselFactor ?? DIESEL_FACTOR;
  const solar = Math.min(100, safe(input.solarSharePct ?? 0)) / 100;

  const gridKwh = safe(input.electricityKwh) * (1 - solar);
  const electricityKg = gridKwh * ef;
  const dieselKg = safe(input.dieselLiters) * df;
  const totalKg = electricityKg + dieselKg;

  return {
    electricityKg,
    dieselKg,
    totalKg,
    totalTonnes: totalKg / 1000,
    electricityShare: totalKg > 0 ? electricityKg / totalKg : 0,
    dieselShare: totalKg > 0 ? dieselKg / totalKg : 0,
    treesToOffset: Math.ceil(totalKg / KG_CO2_PER_TREE_YEAR),
  };
}
