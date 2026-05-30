// Shared DB row types. Mirrors schema.sql.

export type EntryType = "service" | "part" | "fuel" | "mileage" | "note";

export interface Vehicle {
  id: string;
  user_id: string;
  year: number | null;
  make: string;
  model: string;
  nickname: string | null;
  vin: string | null;
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
  is_full_tank: boolean | null; // fuel only
  fuel_grade: string | null; // fuel only
  created_at: string;
}
