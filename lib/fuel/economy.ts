// Fuel-economy engine.
//
// Economy is measured the full-to-full way: an interval runs between two
// consecutive full tanks, its distance is the odometer difference between them,
// and its fuel is every fill logged in between (partials included, rolling
// forward into the interval they help complete). Nothing here is stored — the
// figures are recomputed from the raw fills every time, so editing or deleting
// a fill always yields a consistent history.
//
// The engine is unit-agnostic: it works entirely in canonical kilometres and
// litres, and only touches the unit layer to express the final economy in the
// vehicle's chosen unit.

import type { Entry, Vehicle } from "../types";
import {
  type EconomyUnit,
  economyFromCanonical,
  economyHigherIsBetter,
  toKm,
  toLitres,
} from "./units";

// A single fill reduced to canonical units — the only shape the maths touches.
export interface FuelFill {
  id: string;
  date: string; // ISO date, used for labels and to break odometer ties
  odometerKm: number | null;
  litres: number | null;
  isFull: boolean;
  missedFill: boolean;
}

// One full-to-full interval. Economy is expressed in the requested unit; it is
// null only when the interval has no distance or fuel to divide.
export interface Interval {
  endFillId: string;
  date: string;
  distanceKm: number;
  litres: number;
  economy: number | null;
  valid: boolean; // false when flagged as an outlier — kept for display, dropped from aggregates
}

export interface FuelStats {
  current: number | null; // economy of the most recent valid interval
  lifetime: number | null; // aggregate over all valid intervals (fuel-weighted, not a mean of tanks)
  best: number | null;
  worst: number | null;
  last10: number | null; // aggregate over the last ten valid intervals
  intervals: Interval[]; // every interval, oldest first
}

// Sanity window for a single interval, in US mpg. Anything outside this is a
// data-entry mistake rather than a real figure. Checked in a fixed unit so the
// bounds don't depend on the driver's locale.
const SANITY_MIN_MPG = 3;
const SANITY_MAX_MPG = 200;
// An interval more than this far from the median is treated as an outlier.
const OUTLIER_DEVIATION = 0.4;

// Reduce raw entries to canonical fills. Odometer is read in the vehicle's
// distance unit, volume in its volume unit; both become km and litres here so
// nothing downstream has to care about units.
export function toFuelFills(
  entries: Entry[],
  vehicle: Pick<Vehicle, "distance_unit" | "volume_unit">,
): FuelFill[] {
  return entries
    .filter((e) => e.type === "fuel")
    .map((e) => ({
      id: e.id,
      date: e.date,
      odometerKm: e.odometer != null ? toKm(e.odometer, vehicle.distance_unit) : null,
      litres: e.gallons != null ? toLitres(e.gallons, vehicle.volume_unit) : null,
      isFull: e.is_full_tank === true,
      missedFill: e.missed_fill === true,
    }));
}

// The state left over once every fill has been walked: the odometer of the
// full tank that currently anchors the open interval, and the fuel logged since
// it. Drives the "since last full tank" preview in the entry form.
export interface OpenTank {
  lastFullOdometerKm: number | null;
  litresSinceLastFull: number;
}

interface Chain {
  raw: Omit<Interval, "economy" | "valid">[];
  open: OpenTank;
}

// Walk the fills in odometer order, emitting one interval per completed tank and
// tracking the still-open tank at the end. Only fills with an odometer reading
// can be placed on the chain; a fill without one (e.g. a legacy import) is
// ignored here and handled elsewhere.
function chain(fills: FuelFill[]): Chain {
  const ordered = fills
    .filter((f) => f.odometerKm != null)
    .sort((a, b) => a.odometerKm! - b.odometerKm! || a.date.localeCompare(b.date));

  const raw: Omit<Interval, "economy" | "valid">[] = [];
  let anchor: FuelFill | null = null; // the full fill that opened the current interval
  let litresSince = 0; // fuel logged since the anchor, excluding the anchor's own fill

  for (const fill of ordered) {
    if (fill.missedFill) {
      // The chain can't be trusted across a missed fill: re-anchor on it if it's
      // a full tank, otherwise wait for the next full tank to start fresh.
      anchor = fill.isFull ? fill : null;
      litresSince = 0;
      continue;
    }

    if (anchor === null) {
      // Nothing to measure from yet — a full tank opens the first interval.
      if (fill.isFull) {
        anchor = fill;
        litresSince = 0;
      }
      continue;
    }

    litresSince += fill.litres ?? 0;

    if (fill.isFull) {
      raw.push({
        endFillId: fill.id,
        date: fill.date,
        distanceKm: fill.odometerKm! - anchor.odometerKm!,
        litres: litresSince,
      });
      anchor = fill;
      litresSince = 0;
    }
  }

  return {
    raw,
    open: { lastFullOdometerKm: anchor?.odometerKm ?? null, litresSinceLastFull: litresSince },
  };
}

export function computeIntervals(fills: FuelFill[]): Interval[] {
  return flagOutliers(chain(fills).raw);
}

// Where the chain currently stands, for a live preview of the next full tank.
export function openTankState(fills: FuelFill[]): OpenTank {
  return chain(fills).open;
}

// Attach economy (in US mpg, for the sanity/median tests) and decide which
// intervals are trustworthy. Economy for display is added later, per unit.
function flagOutliers(raw: Omit<Interval, "economy" | "valid">[]): Interval[] {
  const canonical = raw.map((r) => economyFromCanonical(r.distanceKm, r.litres, "mpg_us"));

  const withinBounds = canonical.map(
    (mpg) => mpg != null && mpg >= SANITY_MIN_MPG && mpg <= SANITY_MAX_MPG,
  );

  const sane = canonical.filter((mpg, i) => withinBounds[i] && mpg != null) as number[];
  const med = median(sane);

  return raw.map((r, i) => {
    const mpg = canonical[i];
    let valid = withinBounds[i];
    if (valid && med != null && mpg != null) {
      valid = Math.abs(mpg - med) / med <= OUTLIER_DEVIATION;
    }
    // economy is filled in by computeStats for the requested unit
    return { ...r, economy: null, valid };
  });
}

// Assemble the headline figures for a given display unit.
export function computeStats(fills: FuelFill[], unit: EconomyUnit): FuelStats {
  const intervals = computeIntervals(fills).map((iv) => ({
    ...iv,
    economy: economyFromCanonical(iv.distanceKm, iv.litres, unit),
  }));

  const valid = intervals.filter(
    (iv) => iv.valid && iv.economy != null && iv.distanceKm > 0 && iv.litres > 0,
  );

  const aggregate = (list: Interval[]): number | null => {
    if (list.length === 0) return null;
    const km = list.reduce((s, iv) => s + iv.distanceKm, 0);
    const litres = list.reduce((s, iv) => s + iv.litres, 0);
    return economyFromCanonical(km, litres, unit);
  };

  const economies = valid.map((iv) => iv.economy!);
  const higherBetter = economyHigherIsBetter(unit);

  const best =
    economies.length === 0
      ? null
      : higherBetter
        ? Math.max(...economies)
        : Math.min(...economies);
  const worst =
    economies.length === 0
      ? null
      : higherBetter
        ? Math.min(...economies)
        : Math.max(...economies);

  return {
    current: valid.length > 0 ? valid[valid.length - 1].economy : null,
    lifetime: aggregate(valid),
    best,
    worst,
    last10: aggregate(valid.slice(-10)),
    intervals,
  };
}

// Convenience entry point for the pages: raw rows + vehicle → stats in the
// vehicle's own economy unit.
export function computeFuelStats(entries: Entry[], vehicle: Vehicle): FuelStats {
  return computeStats(toFuelFills(entries, vehicle), vehicle.economy_unit);
}

// Intervals that produced a real economy figure but were flagged as outliers and
// left out of the aggregates. Surfaced so the driver can spot a mistyped
// odometer or volume, rather than silently dropping the reading.
export function flaggedIntervals(stats: FuelStats): Interval[] {
  return stats.intervals.filter(
    (iv) => !iv.valid && iv.economy != null && iv.distanceKm > 0 && iv.litres > 0,
  );
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}
