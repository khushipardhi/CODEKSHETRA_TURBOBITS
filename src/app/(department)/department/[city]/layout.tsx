/* ════════════════════════════════════════════════════════
   /department/[city]/ Layout — City-scoped department portal
   ════════════════════════════════════════════════════════ */

import { notFound } from "next/navigation";
import { isValidCity } from "@/lib/city-context";
import { CityProvider } from "@/components/providers/city-provider";

interface DepartmentCityLayoutProps {
  children: React.ReactNode;
  params: Promise<{ city: string }>;
}

export default async function DepartmentCityLayout({
  children,
  params,
}: DepartmentCityLayoutProps) {
  const { city } = await params;
  if (!isValidCity(city)) notFound();

  return <CityProvider city={city}>{children}</CityProvider>;
}
