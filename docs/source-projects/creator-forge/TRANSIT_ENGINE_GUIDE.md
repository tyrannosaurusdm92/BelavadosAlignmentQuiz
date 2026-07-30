# Transit Engine Guide

## Transit types

A transit type defines a reusable movement model. Every type has an editable name, category, route hex color, travel model, speed and unit, default dwell time, default frequency, capacity, and notes. Starter types are examples rather than canon. Users can rename, duplicate, remove, or replace them.

Supported speed units include km/h, mi/h, m/s, map-units/h, AU/day, light-seconds/minute, a fraction of light speed (`c`), and light-years/day. Supported distance units include metric and customary distances, leagues, map units, AU, light-seconds, light-minutes, and light-years.

Travel models:

- Constant speed: distance divided by speed.
- Accelerated: acceleration time plus cruise time plus deceleration time.
- Fixed duration: a segment always takes a configured duration.
- Gateway: activation plus traversal, with optional cooldown and throughput notes.

## Stops

Stops can represent stations, docks, gates, platforms, landing fields, caravan yards, orbital terminals, or any custom transfer point. A stop can link to a generated LifeSimulator location but does not have to. Each stop stores transfer time, default visit duration, services, accessibility, tags, notes, and one or more manual map placements.

TableGate deliberately does not infer precise stop coordinates from a diagram or a place-level coordinate. Use the Map Viewer placement tool for each map scale.

## Routes and services

A route is an ordered chain of stops. It inherits its neon color from the transit type unless the route has an override. Routes may be one-way, bidirectional, or loops. Segment distance is explicit when provided. If two stops have placements on the same map, TableGate can estimate a segment from the map dimensions configured in transit settings; such estimates should be reviewed.

A service applies an operating pattern to a route:

- Frequency/headway between vehicles.
- Explicit departure list.
- Continuous movement.
- On-demand departure.

Services can override speed, dwell time, capacity, fare/cost, and operating window.

## Trip planning

Plan My Trip searches the saved network for an earliest usable connection. It includes waiting, transfer time, ride time, and dwell. Optimization choices can prioritize balanced travel, fastest arrival, fewest transfers, or least waiting.

Activity stops are processed in the order added. Each activity stop can include:

- Duration.
- Purpose.
- NPC being visited.
- Goods exchanged.
- Services used.
- Notes.

The itinerary continues after the activity duration ends.

## Vehicles and simulation

A tracked vehicle is attached to a route and optional service. Simulation time advances its current segment and progress. When both segment endpoints are placed on the current map, the vehicle appears on the neon route arc.
