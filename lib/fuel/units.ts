// Unit system for fuel-economy tracking.
//
// All fuel math runs in canonical units — kilometres for distance, litres for
// volume — so the engine never has to branch on the driver's locale. Each
// vehicle stores its own display preferences; values are converted to canonical
// units on the way in and back to the vehicle's units on the way out.

export type DistanceUnit = "mi" | "km";
export type VolumeUnit = "gal_us" | "gal_uk" | "l";
export type EconomyUnit = "mpg_us" | "mpg_uk" | "l_100km" | "km_l";

// How a single fill records distance. "odometer" is an absolute reading; "trip"
// is the distance driven since the last fill. Chosen per fill on the entry form;
// the engine reconstructs an absolute odometer from trip legs either way.
export type DistanceInput = "odometer" | "trip";

// ---------- conversion factors ----------

const KM_PER_MILE = 1.609344;
const LITRES_PER_US_GALLON = 3.785411784;
const LITRES_PER_UK_GALLON = 4.54609;

// ---------- distance ----------

export function toKm(value: number, unit: DistanceUnit): number {
  return unit === "mi" ? value * KM_PER_MILE : value;
}

export function fromKm(km: number, unit: DistanceUnit): number {
  return unit === "mi" ? km / KM_PER_MILE : km;
}

// ---------- volume ----------

export function toLitres(value: number, unit: VolumeUnit): number {
  switch (unit) {
    case "gal_us":
      return value * LITRES_PER_US_GALLON;
    case "gal_uk":
      return value * LITRES_PER_UK_GALLON;
    case "l":
      return value;
  }
}

export function fromLitres(litres: number, unit: VolumeUnit): number {
  switch (unit) {
    case "gal_us":
      return litres / LITRES_PER_US_GALLON;
    case "gal_uk":
      return litres / LITRES_PER_UK_GALLON;
    case "l":
      return litres;
  }
}

// ---------- economy ----------

// Convert a canonical interval (distance in km, fuel in litres) into the
// vehicle's chosen economy figure. Returns null when there is no fuel to
// divide by. Note the two families read in opposite directions: mpg / km_l are
// "higher is better", l_100km is "lower is better" (see economyHigherIsBetter).
export function economyFromCanonical(
  km: number,
  litres: number,
  unit: EconomyUnit,
): number | null {
  if (litres <= 0) return null;

  switch (unit) {
    case "mpg_us":
      return fromKm(km, "mi") / fromLitres(litres, "gal_us");
    case "mpg_uk":
      return fromKm(km, "mi") / fromLitres(litres, "gal_uk");
    case "l_100km":
      return km <= 0 ? null : (litres / km) * 100;
    case "km_l":
      return km / litres;
  }
}

// True when a larger number means better economy. Used by the stats layer to
// pick the "best" and "worst" intervals correctly for each unit.
export function economyHigherIsBetter(unit: EconomyUnit): boolean {
  return unit !== "l_100km";
}

// ---------- display metadata ----------

export const distanceLabel: Record<DistanceUnit, string> = {
  mi: "mi",
  km: "km",
};

export const volumeLabel: Record<VolumeUnit, string> = {
  gal_us: "gal",
  gal_uk: "gal",
  l: "L",
};

export const economyLabel: Record<EconomyUnit, string> = {
  mpg_us: "mpg",
  mpg_uk: "mpg",
  l_100km: "L/100km",
  km_l: "km/L",
};

// Sensible defaults for a new vehicle when the driver hasn't picked units yet.
export const DEFAULT_DISTANCE_UNIT: DistanceUnit = "mi";
export const DEFAULT_VOLUME_UNIT: VolumeUnit = "gal_us";
export const DEFAULT_ECONOMY_UNIT: EconomyUnit = "mpg_us";
