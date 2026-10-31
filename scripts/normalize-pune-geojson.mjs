import fs from "fs";
import path from "path";

const puneDir = path.resolve(process.cwd(), "data", "pune");
const files = fs.readdirSync(puneDir).filter(f => f.endsWith(".json"));

console.log(`[Pune GeoJSON Normalizer] Found ${files.length} custom JSON files.`);

for (const file of files) {
  const filePath = path.join(puneDir, file);
  const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const outGeoJsonPath = path.join(puneDir, file.replace(/\.json$/, ".geojson"));

  // Check if geojson already exists
  if (fs.existsSync(outGeoJsonPath)) {
    console.log(`[Pune GeoJSON Normalizer] Skipping ${file} (GeoJSON already exists).`);
    continue;
  }

  const features = [];

  // Iterate over all keys in the object (excluding metadata)
  for (const [key, val] of Object.entries(content)) {
    if (key === "metadata" || !Array.isArray(val)) continue;

    for (const item of val) {
      const lat = item.coordinates?.latitude ?? item.latitude ?? item.lat;
      const lon = item.coordinates?.longitude ?? item.longitude ?? item.lng ?? item.lon;

      if (typeof lat === "number" && typeof lon === "number") {
        features.push({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [lon, lat],
          },
          properties: {
            id: item.id || `PUN-${Math.random().toString(36).substring(2, 8)}`,
            name: item.name || item.facility_name || item.office_name || "Civic Facility",
            category: key,
            department: item.governing_body || "PMC",
            address: item.address || item.locality || "",
            locality: item.locality || "",
            phone: item.contact?.phone || item.contact?.toll_free || item.phone || "",
            email: item.contact?.email || item.email || "",
            role: item.role_and_responsibilities || item.description || "",
          },
        });
      }
    }
  }

  const geoJson = {
    type: "FeatureCollection",
    metadata: content.metadata || {},
    features,
  };

  fs.writeFileSync(outGeoJsonPath, JSON.stringify(geoJson, null, 2), "utf-8");
  console.log(`[Pune GeoJSON Normalizer] ✓ Created ${path.basename(outGeoJsonPath)} with ${features.length} features.`);
}

console.log("[Pune GeoJSON Normalizer] Completed successfully!");
