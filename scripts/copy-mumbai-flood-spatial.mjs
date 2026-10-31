import fs from "fs";
import path from "path";

const targetDir = path.resolve(process.cwd(), "data", "mumbai", "flood_spatial");
fs.mkdirSync(targetDir, { recursive: true });

const sourceRoot = path.resolve(process.cwd(), "..", "mumbai_flood_spatial_data");

const fileMap = [
  { sub: "04_flood_risk", name: "mumbai_flood_hotspots.geojson" },
  { sub: "04_flood_risk", name: "mumbai_low_lying_areas.geojson" },
  { sub: "04_flood_risk", name: "mumbai_coastal_exposure.geojson" },
  { sub: "02_drainage", name: "mumbai_public_drainage_network.geojson" },
  { sub: "02_drainage", name: "mumbai_drainage_structures.geojson" },
  { sub: "05_structures", name: "mumbai_bridges_culverts.geojson" },
  { sub: "03_land_cover", name: "mumbai_impervious_surface.geojson" },
  { sub: "03_land_cover", name: "mumbai_land_use_land_cover.geojson" },
  { sub: "06_green_infrastructure", name: "mumbai_green_open_spaces.geojson" },
  { sub: "01_roads", name: "mumbai_full_road_network.geojson" },
];

console.log("[Spatial Mirror] Mirroring all 10 verified Mumbai flood layers...");

let successCount = 0;
for (const item of fileMap) {
  const src = path.join(sourceRoot, item.sub, item.name);
  const dest = path.join(targetDir, item.name);

  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    const stat = fs.statSync(dest);
    console.log(`[Spatial Mirror] ✓ Copied ${item.name} (${Math.round(stat.size / 1024)} KB)`);
    successCount++;
  } else {
    console.warn(`[Spatial Mirror] ✗ Source missing: ${src}`);
  }
}

console.log(`[Spatial Mirror] Successfully mirrored ${successCount} of ${fileMap.length} layers into data/mumbai/flood_spatial/`);
