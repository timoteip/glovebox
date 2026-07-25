import { describe, it, expect } from "vitest";
import {
  computeStats,
  computeFuelStats,
  flaggedIntervals,
  openTankState,
  toFuelFills,
  type FuelFill,
} from "./economy";
import type { Entry, Vehicle } from "../types";

// ---------- helpers ----------

let seq = 0;
function fill(partial: Partial<FuelFill>): FuelFill {
  return {
    id: `f${seq++}`,
    date: "2026-01-01",
    odometerKm: null,
    litres: null,
    isFull: true,
    missedFill: false,
    ...partial,
  };
}

const US_VEHICLE = {
  distance_unit: "mi",
  volume_unit: "gal_us",
  economy_unit: "mpg_us",
} as const;

function fuelEntry(partial: Partial<Entry>): Entry {
  return {
    id: `e${seq++}`,
    vehicle_id: "v1",
    type: "fuel",
    date: "2026-01-01",
    odometer: null,
    title: "Fuel",
    description: null,
    cost: null,
    gallons: null,
    trip_miles: null,
    mpg: null,
    is_full_tank: true,
    missed_fill: false,
    fuel_grade: null,
    created_at: "2026-01-01T00:00:00Z",
    ...partial,
  };
}

// ---------- worked example (US, full tanks only) ----------

describe("computeFuelStats — worked example", () => {
  const vehicle = { ...US_VEHICLE } as Vehicle;
  const entries: Entry[] = [
    fuelEntry({ odometer: 1000, gallons: 10 }), // baseline anchor
    fuelEntry({ odometer: 1300, gallons: 10 }), // 300 mi / 10 gal = 30 mpg
    fuelEntry({ odometer: 1600, gallons: 12 }), // 300 mi / 12 gal = 25 mpg
  ];

  const stats = computeFuelStats(entries, vehicle);

  it("emits one interval per completed tank (the first fill only anchors)", () => {
    expect(stats.intervals).toHaveLength(2);
  });

  it("computes current, best and worst from full-to-full intervals", () => {
    expect(stats.current).toBeCloseTo(25, 5);
    expect(stats.best).toBeCloseTo(30, 5);
    expect(stats.worst).toBeCloseTo(25, 5);
  });

  it("weights the lifetime average by fuel, not by tank", () => {
    // 600 mi / 22 gal = 27.27, not (30 + 25) / 2 = 27.5
    expect(stats.lifetime).toBeCloseTo(600 / 22, 5);
  });
});

// ---------- partials roll forward ----------

describe("partial fills", () => {
  it("roll their fuel into the next full-to-full interval", () => {
    const vehicle = { ...US_VEHICLE } as Vehicle;
    const entries: Entry[] = [
      fuelEntry({ odometer: 1000, gallons: 10 }), // anchor
      fuelEntry({ odometer: 1150, gallons: 5, is_full_tank: false }), // partial
      fuelEntry({ odometer: 1300, gallons: 5 }), // full: 300 mi / (5 + 5) gal
    ];

    const stats = computeFuelStats(entries, vehicle);
    expect(stats.intervals).toHaveLength(1);
    expect(stats.current).toBeCloseTo(30, 5); // 300 / 10
  });
});

// ---------- missed fills break the chain ----------

describe("missed fills", () => {
  it("break the chain and re-anchor without emitting a spanning interval", () => {
    const vehicle = { ...US_VEHICLE } as Vehicle;
    const entries: Entry[] = [
      fuelEntry({ odometer: 1000, gallons: 10 }), // anchor
      fuelEntry({ odometer: 1300, gallons: 10 }), // 30 mpg
      fuelEntry({ odometer: 1600, gallons: 10, missed_fill: true }), // chain break, re-anchor
      fuelEntry({ odometer: 1900, gallons: 10 }), // 30 mpg
    ];

    const stats = computeFuelStats(entries, vehicle);
    expect(stats.intervals).toHaveLength(2);
    expect(stats.intervals.every((iv) => Math.abs(iv.economy! - 30) < 1e-6)).toBe(true);
  });
});

// ---------- outliers ----------

describe("outliers", () => {
  it("are flagged invalid and excluded from aggregates but kept in the list", () => {
    const vehicle = { ...US_VEHICLE } as Vehicle;
    const entries: Entry[] = [
      fuelEntry({ odometer: 1000, gallons: 10 }),
      fuelEntry({ odometer: 1300, gallons: 10 }), // 30 mpg
      fuelEntry({ odometer: 1305, gallons: 10 }), // 0.5 mpg — impossible
      fuelEntry({ odometer: 1605, gallons: 10 }), // 30 mpg
    ];

    const stats = computeFuelStats(entries, vehicle);
    expect(stats.intervals).toHaveLength(3);

    const bad = stats.intervals.find((iv) => iv.economy! < 1);
    expect(bad?.valid).toBe(false);

    // aggregates use only the two 30 mpg intervals
    expect(stats.best).toBeCloseTo(30, 5);
    expect(stats.worst).toBeCloseTo(30, 5);
    expect(stats.lifetime).toBeCloseTo(30, 5);
  });

  it("are surfaced by flaggedIntervals with their real economy figure", () => {
    const vehicle = { ...US_VEHICLE } as Vehicle;
    const entries: Entry[] = [
      fuelEntry({ odometer: 1000, gallons: 10 }),
      fuelEntry({ odometer: 1300, gallons: 10 }), // 30 mpg
      fuelEntry({ odometer: 1305, gallons: 10 }), // 0.5 mpg — impossible
      fuelEntry({ odometer: 1605, gallons: 10 }), // 30 mpg
    ];

    const flagged = flaggedIntervals(computeFuelStats(entries, vehicle));
    expect(flagged).toHaveLength(1);
    expect(flagged[0].economy!).toBeLessThan(1);
  });

  it("ignores intervals with no distance or fuel to divide", () => {
    const vehicle = { ...US_VEHICLE } as Vehicle;
    // A single full tank produces no interval at all — nothing to flag.
    const stats = computeFuelStats([fuelEntry({ odometer: 1000, gallons: 10 })], vehicle);
    expect(flaggedIntervals(stats)).toHaveLength(0);
  });
});

// ---------- legacy import rows ----------

describe("legacy rows", () => {
  it("without an odometer are ignored by the interval maths", () => {
    const vehicle = { ...US_VEHICLE } as Vehicle;
    const entries: Entry[] = [
      fuelEntry({ mpg: 42, odometer: null, gallons: null }), // imported reading
      fuelEntry({ odometer: 1000, gallons: 10 }),
      fuelEntry({ odometer: 1300, gallons: 10 }), // 30 mpg
    ];

    const stats = computeFuelStats(entries, vehicle);
    expect(stats.intervals).toHaveLength(1);
    expect(stats.current).toBeCloseTo(30, 5);
  });
});

// ---------- metric ----------

describe("metric economy (L/100km)", () => {
  it("treats lower as better for best/worst and aggregates correctly", () => {
    const fills: FuelFill[] = [
      fill({ odometerKm: 0, litres: 0 }), // anchor
      fill({ odometerKm: 100, litres: 8 }), // 8 L/100km
      fill({ odometerKm: 200, litres: 10 }), // 10 L/100km
    ];

    const stats = computeStats(fills, "l_100km");
    expect(stats.intervals).toHaveLength(2);
    expect(stats.best).toBeCloseTo(8, 5); // lower is better
    expect(stats.worst).toBeCloseTo(10, 5);
    expect(stats.lifetime).toBeCloseTo(9, 5); // 18 L over 200 km
    expect(stats.current).toBeCloseTo(10, 5);
  });
});

// ---------- open tank state (live preview) ----------

describe("openTankState", () => {
  it("reports the current anchor and any fuel logged since it", () => {
    const fills: FuelFill[] = [
      fill({ odometerKm: 1000, litres: 40 }), // full — anchor
      fill({ odometerKm: 1300, litres: 40 }), // full — new anchor
      fill({ odometerKm: 1450, litres: 20, isFull: false }), // partial rolls forward
    ];
    const open = openTankState(fills);
    expect(open.lastFullOdometerKm).toBe(1300);
    expect(open.litresSinceLastFull).toBeCloseTo(20, 5);
  });

  it("has no anchor before the first full tank", () => {
    const fills: FuelFill[] = [fill({ odometerKm: 1000, litres: 20, isFull: false })];
    expect(openTankState(fills).lastFullOdometerKm).toBeNull();
  });
});

// ---------- unit conversion boundary ----------

describe("toFuelFills", () => {
  it("converts odometer and volume into canonical km and litres", () => {
    const entries: Entry[] = [fuelEntry({ odometer: 100, gallons: 10 })];
    const [f] = toFuelFills(entries, US_VEHICLE);
    expect(f.odometerKm).toBeCloseTo(160.9344, 3);
    expect(f.litres).toBeCloseTo(37.854, 3);
  });
});
