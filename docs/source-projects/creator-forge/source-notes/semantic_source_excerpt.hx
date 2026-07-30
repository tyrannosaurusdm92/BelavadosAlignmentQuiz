/*
 * TownGeneratorOS semantic source excerpt retained for attribution and review.
 * Upstream license: GNU GPL v3 (see LICENSE in this directory).
 * Only constants used to inform TableGate's non-geometric NPC/location adapter are retained here.
 */

// Settlement size / patch counts:
// Small Town  6
// Large Town  10
// Small City  15
// Large City  24
// Metropolis  40

// Weighted ward sequence from Model.WARDS:
var WARDS = [
  CraftsmenWard, CraftsmenWard, MerchantWard, CraftsmenWard, CraftsmenWard, Cathedral,
  CraftsmenWard, CraftsmenWard, CraftsmenWard, CraftsmenWard, CraftsmenWard,
  CraftsmenWard, CraftsmenWard, CraftsmenWard, AdministrationWard, CraftsmenWard,
  Slum, CraftsmenWard, Slum, PatriciateWard, Market,
  Slum, CraftsmenWard, CraftsmenWard, CraftsmenWard, Slum,
  CraftsmenWard, CraftsmenWard, CraftsmenWard, MilitaryWard, Slum,
  CraftsmenWard, Park, PatriciateWard, Market, MerchantWard
];

// No geometry, topology, roads, walls, Voronoi, building polygon, or renderer code is retained or executed.
