import { DefaultSession } from "next-auth";

export interface WorkerSessionProfile {
  id: string;
  name: string;
  email: string;
  departmentCode: string;
  departmentName: string;
  zone: string;
  role: string;
  vehicle?: string | null;
  isApproved: boolean;
}

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      role?: "CITIZEN" | "WORKER" | "ADMIN";
      workerProfile?: WorkerSessionProfile | null;
      googleId?: string;
      provider?: string;
    } & DefaultSession["user"];
  }

  interface User {
    role?: "CITIZEN" | "WORKER" | "ADMIN";
    workerProfile?: WorkerSessionProfile | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "CITIZEN" | "WORKER" | "ADMIN";
    workerProfile?: WorkerSessionProfile | null;
    googleId?: string;
    provider?: string;
  }
}
