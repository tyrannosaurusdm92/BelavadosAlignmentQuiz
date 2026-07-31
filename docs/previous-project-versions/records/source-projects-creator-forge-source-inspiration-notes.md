# Source Inspiration and Boundaries

The attached transit references were used as design research, not copied into the front-facing application.

## Design decisions derived from the references

- Schedules, seasonal service, cancellations, and vehicle deployment change over time. TableGate therefore separates stable routes from services and tracked vehicle state.
- Passenger networks use hubs, transfer points, corridors, multiple modes, and operating windows. TableGate models those as stops, ordered routes, services, and transfer-aware itineraries.
- Water, aerial, long-distance, local, and intercity transport can share a trip-planning graph while retaining different speeds, dwell times, reliability notes, and service patterns.
- A diagram or municipal representative coordinate is not the same thing as a precise stop coordinate. TableGate requires explicit stop placement instead of inventing exact map points.
- Gateway-like shortcuts are represented as a configurable fictional fixed-duration model with activation and cooldown. The included scientific reference was used only to understand the conceptual distinction between ordinary travel distance and a shortcut endpoint model; the application does not claim that such engineering is feasible.

## Exclusions

- No attached transit map image was copied into TableGate.
- No real passenger timetable is embedded or represented as live/current.
- No exact stop coordinate was inferred from a map graphic.
- No copyrighted fictional setting, vessel, organization, or terminology is named in the front-facing application.
