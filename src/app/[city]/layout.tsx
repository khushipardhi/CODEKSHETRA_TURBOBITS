/* ════════════════════════════════════════════════════════
   /[city]/ Layout — City-scoped citizen experience
   Wraps all citizen pages with CityProvider.
   Validates city param from URL.
   ════════════════════════════════════════════════════════ */

import { notFound } from "next/navigation";
import { isValidCity } from "@/lib/city-context";
import { CityProvider } from "@/components/providers/city-provider";

interface CityLayoutProps {
  children: React.ReactNode;
  params: Promise<{ city: string }>;
}

export default async function CityLayout({ children, params }: CityLayoutProps) {
  const { city } = await params;

  if (!isValidCity(city)) {
    notFound();
  }

  return (
    <CityProvider city={city}>
      {children}
    </CityProvider>
  );
}
