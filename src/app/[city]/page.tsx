/* ════════════════════════════════════════════════════════
   /[city]/ — City Entry Point
   Redirects to /[city]/dashboard with active city context.
   ════════════════════════════════════════════════════════ */

import { redirect } from "next/navigation";
import { isValidCity, DEFAULT_CITY } from "@/lib/city-context";

interface CityPageProps {
  params: Promise<{ city: string }>;
}

export default async function CityEntryPage({ params }: CityPageProps) {
  const { city } = await params;
  const targetCity = isValidCity(city) ? city : DEFAULT_CITY;
  redirect(`/${targetCity}/dashboard`);
}
