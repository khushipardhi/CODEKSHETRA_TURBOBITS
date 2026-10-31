# Coordinate Import Format

## Accepted Manifest

The importer expects a JSON file with the following structure:

```json
{
  "version": 1,
  "departments": [
    {
      "departmentCode": "ROADS",
      "name": "Roads and Public Works",
      "serviceAreas": [
        {
          "name": "Ward 1",
          "geometry": {
            "type": "Polygon",
            "coordinates": [[[79.05, 21.12], [79.10, 21.12], [79.10, 21.16], [79.05, 21.16], [79.05, 21.12]]]
          }
        }
      ],
      "officeLocation": {
        "latitude": 21.1458,
        "longitude": 79.0882
      }
    }
  ]
}
```

## Validation Rules

1. **Version**: Must be a supported integer (currently: 1)
2. **Department codes**: Must match existing approved departments
3. **Coordinates**: Valid lat/lng ranges (-90–90, -180–180)
4. **Geometry**: GeoJSON Polygon with valid closed rings
5. **No duplicates**: Unique feature IDs per department

## Import Command

```bash
npx ts-node db/importers/import-department-coordinates.ts --dry-run input.json
npx ts-node db/importers/import-department-coordinates.ts --apply input.json
```

## Reconciliation Report

The dry-run produces:
- **New**: Service areas being created
- **Updated**: Existing areas being modified
- **Rejected**: Invalid entries with reasons
- **Unlinked**: Department codes not found in database

## Audit Trail

Each import records:
- File hash, filename, version
- Import timestamp and actor
- Change summary
- Historical versions preserved
