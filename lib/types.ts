// Shared DB row types. Mirrors schema.sql.

import type { DistanceUnit, VolumeUnit, EconomyUnit } from "./fuel/units";

export type EntryType = "service" | "part" | "fuel" | "mileage" | "note";

export interface Vehicle {
  id: string;
  user_id: string;
  year: number | null;
  make: string;
  model: string;
  nickname: string | null;
  vin: string | null;
  photo_url: string | null;
  distance_unit: DistanceUnit;
  volume_unit: VolumeUnit;
  economy_unit: EconomyUnit;
  created_at: string;
}

export interface UserPreferences {
  user_id: string;
  default_vehicle_id: string | null;
}

export interface Reminder {
  id: string;
  vehicle_id: string;
  name: string;
  due_miles: number | null;
  due_date: string | null; // ISO date (YYYY-MM-DD)
  created_at: string;
}

export interface Entry {
  id: string;
  vehicle_id: string;
  type: EntryType;
  date: string; // ISO date (YYYY-MM-DD)
  odometer: number | null;
  title: string;
  description: string | null;
  cost: number | null;
  gallons: number | null; // fuel only
  trip_miles: number | null; // fuel only — trip odometer reading reset at each fill-up
  mpg: number | null; // fuel only — legacy imports; derived economy is never stored here
  is_full_tank: boolean | null; // fuel only
  missed_fill: boolean; // fuel only — true breaks the full-to-full chain at this fill
  fuel_grade: string | null; // fuel only
  created_at: string;
}
