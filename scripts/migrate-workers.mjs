import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";

// Load .env.local manually
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

async function migrate() {
  console.log("[Migration] Connecting to TiDB Cloud...");
  const conn = await mysql.createConnection({
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || "4000", 10),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    ssl: { rejectUnauthorized: false },
    connectTimeout: 20000,
  });

  console.log("[Migration] Connected. Creating `workers` table if not exists...");

  const createTableSql = `
    CREATE TABLE IF NOT EXISTS workers (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      phone VARCHAR(25) NULL,
      department_code VARCHAR(50) NOT NULL,
      department_name VARCHAR(150) NOT NULL,
      zone VARCHAR(100) NOT NULL,
      role VARCHAR(150) NOT NULL,
      vehicle VARCHAR(150) NULL,
      avatar VARCHAR(255) NULL DEFAULT '👷',
      status ENUM('AVAILABLE', 'ON_TASK', 'OFF_DUTY') NOT NULL DEFAULT 'AVAILABLE',
      is_approved TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_workers_dept (department_code),
      INDEX idx_workers_email (email),
      INDEX idx_workers_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  await conn.execute(createTableSql);
  console.log("[Migration] `workers` table ready.");

  // Seed default roster
  const seedWorkers = [
    {
      id: "W-PWD-01",
      name: "Ramesh Sharma",
      email: "ramesh.pwd@nagpur.gov.in",
      phone: "+91 98230 11234",
      department_code: "road_maintenance",
      department_name: "Road Maintenance / PWD",
      zone: "Dharampeth Zone",
      role: "Senior Road Surface Supervisor",
      vehicle: "NMC Asphalt Truck (MH-31-AP-1042)",
      avatar: "👷‍♂️",
      status: "AVAILABLE",
      is_approved: 1,
    },
    {
      id: "W-PWD-02",
      name: "Sunil Patil",
      email: "sunil.pwd@nagpur.gov.in",
      phone: "+91 98230 11235",
      department_code: "road_maintenance",
      department_name: "Road Maintenance / PWD",
      zone: "Laxmi Nagar Zone",
      role: "Pothole Patching Crew Lead",
      vehicle: "NMC Quick Response Van (MH-31-AP-1088)",
      avatar: "👷",
      status: "AVAILABLE",
      is_approved: 1,
    },
    {
      id: "W-SWM-01",
      name: "Kishore Wankhede",
      email: "kishore.swm@nagpur.gov.in",
      phone: "+91 98230 22345",
      department_code: "waste_management",
      department_name: "Solid Waste Management",
      zone: "Hanuman Nagar Zone",
      role: "Sanitation Squad Lead",
      vehicle: "Compactor Truck 7 (MH-31-TR-4421)",
      avatar: "🚛",
      status: "AVAILABLE",
      is_approved: 1,
    },
    {
      id: "W-SWM-02",
      name: "Pramod Meshram",
      email: "pramod.swm@nagpur.gov.in",
      phone: "+91 98230 22346",
      department_code: "waste_management",
      department_name: "Solid Waste Management",
      zone: "Gandhibagh Zone",
      role: "Garbage Depots Inspector",
      vehicle: "NMC Waste Van (MH-31-TR-3012)",
      avatar: "🧹",
      status: "AVAILABLE",
      is_approved: 1,
    },
    {
      id: "W-WTR-01",
      name: "Dinesh Deshmukh",
      email: "dinesh.water@nagpur.gov.in",
      phone: "+91 98230 33456",
      department_code: "water_supply",
      department_name: "Water Supply Department",
      zone: "Dhantoli Zone",
      role: "Chief Pipeline Linesman",
      vehicle: "Water Works Repair Unit (MH-31-WT-5099)",
      avatar: "💧",
      status: "AVAILABLE",
      is_approved: 1,
    },
    {
      id: "W-DRN-01",
      name: "Sanjay Gharde",
      email: "sanjay.drainage@nagpur.gov.in",
      phone: "+91 98230 44567",
      department_code: "drainage",
      department_name: "Drainage Department",
      zone: "Mangalwari Zone",
      role: "Drainage & Sewerage Inspector",
      vehicle: "Suction Jetting Machine (MH-31-SJ-2011)",
      avatar: "🌊",
      status: "AVAILABLE",
      is_approved: 1,
    },
    {
      id: "W-ELE-01",
      name: "Manoj Thakre",
      email: "manoj.elec@nagpur.gov.in",
      phone: "+91 98230 55678",
      department_code: "electricity",
      department_name: "Electricity Department",
      zone: "Nehru Nagar Zone",
      role: "Streetlight Line Technician",
      vehicle: "Cherry Picker Crane Van (MH-31-EL-7714)",
      avatar: "⚡",
      status: "AVAILABLE",
      is_approved: 1,
    },
    {
      id: "W-HLT-01",
      name: "Dr. Nitin Raut",
      email: "nitin.health@nagpur.gov.in",
      phone: "+91 98230 66789",
      department_code: "health_dept",
      department_name: "Health Department",
      zone: "Lakadganj Zone",
      role: "Vector Control & Sanitation Inspector",
      vehicle: "Health Inspection Patrol (MH-31-HL-1100)",
      avatar: "🏥",
      status: "AVAILABLE",
      is_approved: 1,
    },
  ];

  for (const w of seedWorkers) {
    await conn.execute(
      `INSERT INTO workers (id, name, email, phone, department_code, department_name, zone, role, vehicle, avatar, status, is_approved)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         phone = VALUES(phone),
         department_code = VALUES(department_code),
         department_name = VALUES(department_name),
         zone = VALUES(zone),
         role = VALUES(role),
         vehicle = VALUES(vehicle),
         avatar = VALUES(avatar)`,
      [
        w.id,
        w.name,
        w.email,
        w.phone,
        w.department_code,
        w.department_name,
        w.zone,
        w.role,
        w.vehicle,
        w.avatar,
        w.status,
        w.is_approved,
      ]
    );
  }

  console.log(`[Migration] Seeded ${seedWorkers.length} default workers successfully.`);
  await conn.end();
}

migrate().catch((err) => {
  console.error("[Migration] Error:", err);
  process.exit(1);
});
