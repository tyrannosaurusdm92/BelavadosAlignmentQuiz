# TableGate Hierarchical Map Viewer

The Map Viewer is empty when `campaign_hub.html` opens. It does not assume that the first map is a settlement, world, planet, dungeon, or any other scale.

## Fastest workflow: load a folder

Choose **Load Map Folder** and select a folder containing map files. The viewer recognizes SVG, PNG, JPG/JPEG, WEBP, GIF, self-contained HTML, PDF, and GeoJSON files.

Folder names become hierarchy levels. A file named `map`, `index`, `overview`, `world`, `globe`, `continent`, `country`, `kingdom`, `region`, `settlement`, `city`, `district`, `building`, `floor`, `room`, or `interior` is treated as the primary map for its folder. If a folder contains one supported map file, that file is also treated as the folder's primary map.

Example folder structure:

```text
Campaign Maps/
  map.svg
  Continents/
    Northern Continent/
      map.svg
      Kingdoms/
        Example Kingdom/
          map.svg
          Cities/
            Example City/
              map.svg
              Buildings/
                Example Tavern/
                  map.svg
                  Rooms/
                    Common Room/
                      map.svg
```

Selecting each generated dropdown level replaces the previous map.

## Manifest workflow

Use `json/map-manifest.example.json` as the schema example. A manifest can use these node fields:

- `id`: stable navigation identifier
- `name`, `label`, or `title`: displayed name
- `type` or `scale`: world, continent, country, kingdom, region, settlement, building, floor, room, or any custom value
- `file`, `map`, `src`, or `path`: relative map file path
- `description`: optional notes
- `tags`: optional array
- `children`, `levels`, or `maps`: nested child nodes

The viewer accepts a top-level `roots`, `worlds`, `maps`, `children`, or singular `root` field.

Load the folder containing both the manifest and its map files whenever possible. If the manifest is loaded alone, its hierarchy still appears, but missing files remain blank until matching files are added with **Load Map Files**.

## Interactive SVG and HTML navigation

Self-contained SVG or HTML maps can switch to another hierarchy node by using any of these patterns:

```html
<button data-map-target="kingdom-example">Open kingdom</button>
<a href="map://tavern-common-room">Open common room</a>
```

A map script may also use:

```js
parent.postMessage({
  type: "tablegate.map.navigate",
  target: "kingdom-example"
}, "*");
```

The target can be a node ID, exact node name, breadcrumb path, or a unique partial name.

## File limitations

Self-contained HTML and SVG maps work best. Browser security prevents a locally selected HTML file from automatically resolving arbitrary sibling assets by normal file paths. Embed assets in the HTML/SVG, or package the interactive map as one self-contained file.
