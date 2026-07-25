# Architecture decisions

A running record of the reasoning behind non-obvious technical choices. Newest first.

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
