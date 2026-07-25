"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { addEntry } from "./actions";
import type { Entry, EntryType } from "@/lib/types";
import {
  type DistanceInput,
  type DistanceUnit,
  type EconomyUnit,
  type VolumeUnit,
  distanceLabel,
  economyFromCanonical,
  economyLabel,
  fromKm,
  toKm,
  toLitres,
} from "@/lib/fuel/units";

const TYPES: { value: EntryType; label: string }[] = [
  { value: "fuel",    label: "Fuel" },
  { value: "service", label: "Service" },
  { value: "part",    label: "Part" },
  { value: "mileage", label: "Mileage" },
  { value: "note",    label: "Note" },
];

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export interface FormUnits {
  distance: DistanceUnit;
  volume: VolumeUnit;
  economy: EconomyUnit;
  input: DistanceInput; // odometer vs trip — decides which distance field the form shows
}

// Chain state at the point this fill is being added, in canonical units, so the
// form can preview the economy a full tank would record. Omitted while editing.
export interface FuelContext {
  lastFullOdometerKm: number | null;
  litresSinceLastFull: number;
  kmSinceLastFull: number; // distance already covered since the anchor (for the trip preview)
}

export type EntryFormDefaults = Pick<
  Entry,
  "type" | "date" | "odometer" | "title" | "description" | "cost" | "gallons" | "trip_miles" | "is_full_tank" | "missed_fill" | "fuel_grade"
>;

interface Props {
  vehicleId: string;
  units: FormUnits;
  fuelContext?: FuelContext;
  defaultValues?: EntryFormDefaults;
  onSubmit?: (formData: FormData) => Promise<void>;
  onSuccess?: () => void;
  submitLabel?: string;
}

const INPUT =
  "h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-base text-zinc-900 outline-none transition-colors focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-400";

const LABEL = "flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300";

export function EntryForm({ vehicleId, units, fuelContext, defaultValues, onSubmit, onSuccess, submitLabel = "Add entry" }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [type, setType] = useState<EntryType>(defaultValues?.type ?? "fuel");
  const [pending, startTransition] = useTransition();

  const [odometerVal, setOdometerVal] = useState(defaultValues?.odometer?.toString() ?? "");
  const [tripVal, setTripVal] = useState(defaultValues?.trip_miles?.toString() ?? "");
  const [gallonsVal, setGallonsVal] = useState(defaultValues?.gallons?.toString() ?? "");
  const [isFull, setIsFull] = useState(defaultValues?.is_full_tank ?? true);

  const showTitle       = type !== "mileage" && type !== "fuel";
  const showDescription = type === "service" || type === "part" || type === "note";
  const showCost        = type === "service" || type === "part" || type === "fuel";
  const showFuel        = type === "fuel";
  // A trip vehicle logs distance-since-last-fill instead of an odometer, so for
  // fuel entries the trip field takes the odometer's place as the primary input.
  const fuelTripMode    = showFuel && units.input === "trip";
  const showOdometer    = type !== "note" && !fuelTripMode;

  const distUnit = distanceLabel[units.distance];
  const volumeName = units.volume === "l" ? "Litres" : "Gallons";

  // What a full tank at the current odometer/volume would record, measured from
  // the last full tank. Null unless there's enough to compute a real figure.
  const preview = useMemo(() => {
    if (!showFuel || !isFull || !fuelContext || fuelContext.lastFullOdometerKm == null) return null;
    const gal = parseFloat(gallonsVal);
    if (!(gal > 0)) return null;

    let distanceKm: number;
    if (fuelTripMode) {
      const trip = parseFloat(tripVal);
      if (!(trip > 0)) return null;
      distanceKm = fuelContext.kmSinceLastFull + toKm(trip, units.distance);
    } else {
      const odo = parseFloat(odometerVal);
      if (!(odo > 0)) return null;
      distanceKm = toKm(odo, units.distance) - fuelContext.lastFullOdometerKm;
    }
    if (distanceKm <= 0) return null;

    const litres = toLitres(gal, units.volume) + fuelContext.litresSinceLastFull;
    const economy = economyFromCanonical(distanceKm, litres, units.economy);
    if (economy == null) return null;

    return { distance: fromKm(distanceKm, units.distance), economy };
  }, [showFuel, isFull, fuelTripMode, fuelContext, odometerVal, tripVal, gallonsVal, units]);

  const missingOdometer = showFuel && !fuelTripMode && isFull && !(parseFloat(odometerVal) > 0);
  const missingTrip = fuelTripMode && isFull && !(parseFloat(tripVal) > 0);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      if (onSubmit) {
        await onSubmit(formData);
      } else {
        await addEntry(vehicleId, formData);
        formRef.current?.reset();
        setType("fuel");
        setOdometerVal("");
        setTripVal("");
        setGallonsVal("");
        setIsFull(true);
        onSuccess?.();
      }
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex flex-col gap-4">
      {/* Type selector */}
      <div className="flex flex-wrap gap-2">
        {TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setType(t.value)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              type === t.value
                ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <input type="hidden" name="type" value={type} />

      {/* Date + distance (odometer, or trip for a trip vehicle) — side by side */}
      <div className={showOdometer || fuelTripMode ? "grid grid-cols-2 gap-3" : ""}>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="date" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Date <span className="text-red-500">*</span>
          </label>
          <input
            id="date"
            name="date"
            type="date"
            required
            defaultValue={defaultValues?.date ?? today()}
            className={INPUT}
          />
        </div>
        {showOdometer && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="odometer" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Odometer ({distUnit}){showFuel && <span className="text-red-500"> *</span>}
            </label>
            <input
              id="odometer"
              name="odometer"
              type="number"
              min={0}
              placeholder="45 000"
              value={odometerVal}
              onChange={(e) => setOdometerVal(e.target.value)}
              className={INPUT}
            />
          </div>
        )}
        {fuelTripMode && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="trip_miles" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Trip ({distUnit}) <span className="text-red-500">*</span>
            </label>
            <input
              id="trip_miles"
              name="trip_miles"
              type="number"
              min={0}
              step="0.1"
              placeholder="300"
              value={tripVal}
              onChange={(e) => setTripVal(e.target.value)}
              className={INPUT}
            />
          </div>
        )}
      </div>

      {/* Preserve an existing odometer reading when editing on a trip vehicle,
          so switching a vehicle to trip mode never wipes historical readings. */}
      {fuelTripMode && defaultValues?.odometer != null && (
        <input type="hidden" name="odometer" value={defaultValues.odometer} />
      )}

      {/* Title */}
      {showTitle && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="title" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            placeholder={type === "service" ? "Oil change" : type === "part" ? "Air filter" : "Note"}
            defaultValue={defaultValues?.type === type ? (defaultValues?.title ?? "") : ""}
            className={INPUT}
          />
        </div>
      )}

      {/* Description */}
      {showDescription && (
        <label className={LABEL}>
          Notes
          <textarea
            name="description"
            rows={2}
            placeholder="Optional details…"
            defaultValue={defaultValues?.description ?? ""}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-base text-zinc-900 outline-none transition-colors focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-400 resize-none"
          />
        </label>
      )}

      {/* Fuel-specific fields */}
      {showFuel && (
        <>
          {/* Full vs partial */}
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Fill type</span>
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
              {[
                { full: true, label: "Full tank" },
                { full: false, label: "Partial" },
              ].map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setIsFull(opt.full)}
                  className={`h-9 rounded-md text-sm font-medium transition-colors ${
                    isFull === opt.full
                      ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-50"
                      : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <input type="hidden" name="is_full_tank" value={isFull ? "on" : ""} />
          </div>

          {/* Volume */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="gallons" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{volumeName}</label>
            <input
              id="gallons"
              name="gallons"
              type="number"
              min={0}
              step="0.001"
              placeholder="12.345"
              value={gallonsVal}
              onChange={(e) => setGallonsVal(e.target.value)}
              className={INPUT}
            />
          </div>

          {/* Live economy preview */}
          {preview && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm dark:border-emerald-900/50 dark:bg-emerald-950/30">
              <span className="text-emerald-700 dark:text-emerald-400">Since last full tank: </span>
              <span className="font-semibold text-emerald-900 dark:text-emerald-200">
                {preview.distance.toFixed(0)} {distUnit}
              </span>
              <span className="text-emerald-700 dark:text-emerald-400"> · </span>
              <span className="font-semibold text-emerald-900 dark:text-emerald-200">
                {preview.economy.toFixed(1)} {economyLabel[units.economy]}
              </span>
            </div>
          )}
          {!isFull && (
            <p className="-mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Partial fill — this fuel rolls into your next full tank.
            </p>
          )}
          {missingOdometer && (
            <p className="-mt-1 text-xs text-amber-600 dark:text-amber-500">
              Add an odometer reading so this fill counts toward economy.
            </p>
          )}
          {missingTrip && (
            <p className="-mt-1 text-xs text-amber-600 dark:text-amber-500">
              Add the trip distance so this fill counts toward economy.
            </p>
          )}

          {/* Grade */}
          <label className={LABEL}>
            Grade
            <select
              name="fuel_grade"
              defaultValue={defaultValues?.fuel_grade ?? ""}
              className={INPUT}
            >
              <option value="">— select —</option>
              <option value="Regular (87)">Regular (87)</option>
              <option value="Mid-grade (88–90)">Mid-grade (88–90)</option>
              <option value="Premium (91–94)">Premium (91–94)</option>
              <option value="Diesel">Diesel</option>
            </select>
          </label>

          {/* Trip reading — optional cross-check (odometer vehicles only; on a
              trip vehicle the trip field is the primary input shown up top) */}
          {!fuelTripMode && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="trip_miles" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Trip ({distUnit}) <span className="font-normal text-zinc-400 dark:text-zinc-500">optional</span>
              </label>
              <input
                id="trip_miles"
                name="trip_miles"
                type="number"
                min={0}
                step="0.1"
                placeholder="125.4"
                defaultValue={defaultValues?.trip_miles ?? ""}
                className={INPUT}
              />
            </div>
          )}

          {/* Missed a previous fill */}
          <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-zinc-200 bg-white px-3 py-3 dark:border-zinc-700 dark:bg-zinc-900">
            <input
              name="missed_fill"
              type="checkbox"
              defaultChecked={defaultValues?.missed_fill ?? false}
              className="mt-0.5 h-4 w-4 rounded border-zinc-300 accent-zinc-900 dark:accent-zinc-100"
            />
            <span className="text-sm text-zinc-700 dark:text-zinc-300">
              I missed logging a fill-up before this one
              <span className="mt-0.5 block text-xs text-zinc-400 dark:text-zinc-500">
                Restarts the economy calculation here so a gap doesn’t skew it.
              </span>
            </span>
          </label>
        </>
      )}

      {/* Cost */}
      {showCost && (
        <label className={LABEL}>
          Cost ($)
          <input
            name="cost"
            type="number"
            min={0}
            step="0.01"
            placeholder="0.00"
            defaultValue={defaultValues?.cost ?? ""}
            className={INPUT}
          />
        </label>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 h-12 rounded-lg bg-zinc-900 px-4 font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
