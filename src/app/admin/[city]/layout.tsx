/* ════════════════════════════════════════════════════════
   /admin/[city]/ Layout — City-scoped admin experience
   ════════════════════════════════════════════════════════ */

import { notFound } from "next/navigation";
import { isValidCity } from "@/lib/city-context";
import { CityProvider } from "@/components/providers/city-provider";
import AdminLayout from "@/app/(admin)/admin/layout";

interface AdminCityLayoutProps {
  children: React.ReactNode;
  params: Promise<{ city: string }>;
}

export default async function AdminCityLayout({ children, params }: AdminCityLayoutProps) {
  const { city } = await params;
  if (!isValidCity(city)) notFound();

  return (
    <CityProvider city={city}>
      <AdminLayout>
        {children}
      </AdminLayout>
    </CityProvider>
  );
}
