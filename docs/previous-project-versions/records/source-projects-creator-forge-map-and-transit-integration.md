# Map Viewer and Transit Integration

Generated locations remain semantic map nodes. Imported maps remain physical map nodes. A location can link to a physical or generated map, creating the nested replacement behavior used to move from large-scale maps into smaller-scale maps and interiors.

Transit stops store placements by `mapNodeId`. The same stop may therefore have a marker on a world route map, a regional network map, and a station interior map without conflating those coordinate systems.

The overlay draws a route segment only when both endpoint stops have placements on the current map. Routes are quadratic curves with a glow layer and a color inherited from the transit type or route override. Labels and tracked vehicles are interactive overlays; the underlying map remains independently pan-and-zoom capable.

Generated images assigned to a semantic location become persisted generated physical map nodes and are linked back to that location. Generated asset records and map links are included in project state and exports.
