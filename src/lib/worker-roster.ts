/* ════════════════════════════════════════════════════════
   Worker Roster & Field Squad Profiles
   Pre-configured NMC (Nagpur Municipal Corporation) workers
   and response squads mapped across Nagpur's 10 municipal zones.
   ════════════════════════════════════════════════════════ */

export interface WorkerProfile {
  id: string;
  name: string;
  departmentCode: string;
  departmentName: string;
  role: string;
  zone: string;
  phone: string;
  vehicle: string;
  avatar: string;
  assignedTasksCount?: number;
  completedTasksCount?: number;
}

export const WORKER_ROSTER: WorkerProfile[] = [
  {
    id: "W-PWD-01",
    name: "Ramesh Sharma",
    departmentCode: "road_maintenance",
    departmentName: "Road Maintenance / PWD",
    role: "Senior Road Surface Supervisor",
    zone: "Dharampeth Zone",
    phone: "+91 98230 11234",
    vehicle: "NMC Asphalt Truck (MH-31-AP-1042)",
    avatar: "👷‍♂️",
    assignedTasksCount: 4,
    completedTasksCount: 52,
  },
  {
    id: "W-PWD-02",
    name: "Sunil Patil",
    departmentCode: "road_maintenance",
    departmentName: "Road Maintenance / PWD",
    role: "Pothole Patching Crew Lead",
    zone: "Laxmi Nagar Zone",
    phone: "+91 98230 11235",
    vehicle: "NMC Quick Response Van (MH-31-AP-1088)",
    avatar: "👷",
    assignedTasksCount: 2,
    completedTasksCount: 41,
  },
  {
    id: "W-SWM-01",
    name: "Kishore Wankhede",
    departmentCode: "waste_management",
    departmentName: "Solid Waste Management",
    role: "Sanitation Squad Lead",
    zone: "Hanuman Nagar Zone",
    phone: "+91 98230 22345",
    vehicle: "Compactor Truck 7 (MH-31-TR-4421)",
    avatar: "🚛",
    assignedTasksCount: 3,
    completedTasksCount: 88,
  },
  {
    id: "W-SWM-02",
    name: "Pramod Meshram",
    departmentCode: "waste_management",
    departmentName: "Solid Waste Management",
    role: "Garbage Depots Inspector",
    zone: "Gandhibagh Zone",
    phone: "+91 98230 22346",
    vehicle: "NMC Waste Van (MH-31-TR-3012)",
    avatar: "🧹",
    assignedTasksCount: 1,
    completedTasksCount: 65,
  },
  {
    id: "W-WTR-01",
    name: "Dinesh Deshmukh",
    departmentCode: "water_supply",
    departmentName: "Water Supply Department",
    role: "Chief Pipeline Linesman",
    zone: "Dhantoli Zone",
    phone: "+91 98230 33456",
    vehicle: "Water Works Repair Unit (MH-31-WT-5099)",
    avatar: "💧",
    assignedTasksCount: 3,
    completedTasksCount: 39,
  },
  {
    id: "W-DRN-01",
    name: "Sanjay Gharde",
    departmentCode: "drainage",
    departmentName: "Drainage Department",
    role: "Drainage & Sewerage Inspector",
    zone: "Mangalwari Zone",
    phone: "+91 98230 44567",
    vehicle: "Suction Jetting Machine (MH-31-SJ-2011)",
    avatar: "🌊",
    assignedTasksCount: 2,
    completedTasksCount: 47,
  },
  {
    id: "W-ELE-01",
    name: "Manoj Thakre",
    departmentCode: "electricity",
    departmentName: "Electricity Department",
    role: "Streetlight Line Technician",
    zone: "Nehru Nagar Zone",
    phone: "+91 98230 55678",
    vehicle: "Cherry Picker Crane Van (MH-31-EL-7714)",
    avatar: "⚡",
    assignedTasksCount: 5,
    completedTasksCount: 71,
  },
  {
    id: "W-HLT-01",
    name: "Dr. Nitin Raut",
    departmentCode: "health_dept",
    departmentName: "Health Department",
    role: "Vector Control & Sanitation Inspector",
    zone: "Lakadganj Zone",
    phone: "+91 98230 66789",
    vehicle: "Health Inspection Patrol (MH-31-HL-1100)",
    avatar: "🏥",
    assignedTasksCount: 2,
    completedTasksCount: 34,
  },
];

export function getWorkerById(id: string): WorkerProfile {
  return WORKER_ROSTER.find((w) => w.id === id) || WORKER_ROSTER[0];
}

export function getWorkersByDept(deptCode: string): WorkerProfile[] {
  return WORKER_ROSTER.filter((w) => w.departmentCode === deptCode);
}
