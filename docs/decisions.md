# Architecture decisions

A running record of the reasoning behind non-obvious technical choices. Newest first.

## Distance input per fill: odometer or trip

Some fills you know the odometer for; others you only know the trip (distance
since the last fill, e.g. a dashboard trip meter reset each fill). The entry
form lets you pick **per fill** — a small Odometer/Trip toggle — so the two can
be mixed freely on one vehicle. (An earlier iteration made this a per-vehicle
setting; per-fill turned out simpler and more flexible, so the vehicle-level
`distance_input` column is no longer used.)

The engine stays odometer-based regardless. `toFuelFills` reconstructs an
absolute odometer for every fill: it walks the fills in date order carrying a
running total — a real odometer reading re-syncs it, a trip leg advances it — so
odometer and trip fills feed one and the same full-to-full chain. Consequences:

- **Lifetime mileage keeps working.** Trip fills carry no raw odometer, so the
  vehicle page maxes over the synthesized odometers to keep the mileage stat
  advancing.
- **History coexists.** Old odometer fills act as anchors; later trip legs
  accumulate on top of them.
- **The maths didn't fork.** Intervals, partials, missed-fill re-anchoring and
  outlier flagging are all unchanged — trip support lives entirely in how the
  odometer is derived, not in the economy calculation.

## Fuel economy: canonical units + full-to-full tracking

Fuel economy is calculated the way Fuelly and most trip computers do it: over the
interval between two consecutive **full** tanks. Distance for an interval is the
odometer difference between the two full fills; fuel is the sum of every fill in
between (partials included), so a partial fill simply rolls forward into the next
full-to-full interval instead of producing a misleading standalone figure.

Consequences that shaped the data model:

- **Odometer is the source of truth for distance.** The old `trip_miles` field is
  kept only as an optional cross-check for a single fill; it no longer drives the
  economy calculation.
- **Economy is derived, never stored.** There is no "mpg per entry" any more —
  the figure is computed from intervals on read, so editing or deleting a fill
  recalculates everything automatically. The one exception is the legacy `mpg`
  column, which holds imported historical readings that have no odometer/volume
  behind them; those are shown on the trend chart but excluded from lifetime,
  best and worst aggregates.
- **`missed_fill` breaks the chain.** When a driver forgets to log a fill, the
  next interval would be wrong (distance covered but fuel unaccounted for).
  Marking a fill as a missed fill re-anchors the chain there and drops the
  spanning interval rather than reporting a bad number.

### Why store everything in kilometres and litres

The app supports both US and metric drivers, and economy can be shown as US mpg,
UK mpg, L/100 km or km/L. Rather than branch on locale throughout the maths, the
engine works in one canonical system — kilometres for distance, litres for
volume. Per-vehicle `distance_unit`, `volume_unit` and `economy_unit` columns
control only how values are entered and displayed; conversion happens at the
edges (`lib/fuel/units.ts`). This keeps the calculation code unit-agnostic and
means adding another display unit later is a formatting change, not a maths
change.
