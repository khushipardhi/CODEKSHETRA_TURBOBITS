/* ════════════════════════════════════════════════════════
   Emergency Guidance Page
   Shows safety instructions and verified emergency contacts.
   Clearly states this is NOT dispatch confirmation.
   ════════════════════════════════════════════════════════ */

import Link from "next/link";
import { Navbar, Footer } from "@/components/layout/navbar";
import {
  AlertTriangleIcon,
  PhoneIcon,
  ShieldIcon,
  ArrowRightIcon,
} from "@/components/ui/icons";

/* Placeholder contacts — in production these come from the DB
   and must be verified before activation */
const emergencyContacts = [
  {
    service: "Police",
    number: "112",
    description: "National emergency helpline for police assistance",
    available: "24/7",
  },
  {
    service: "Fire Brigade",
    number: "101",
    description: "Fire and rescue emergency services",
    available: "24/7",
  },
  {
    service: "Ambulance",
    number: "108",
    description: "Emergency medical services",
    available: "24/7",
  },
  {
    service: "Disaster Management",
    number: "1078",
    description: "National disaster response and relief",
    available: "24/7",
  },
];

export default function EmergencyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Warning Banner */}
          <div className="bg-critical-bg border border-critical-border rounded-xl p-6 mb-8 fade-in">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-critical/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangleIcon size={24} className="text-critical" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-critical mb-2">
                  Emergency Help
                </h1>
                <p className="text-sm text-text-secondary leading-relaxed">
                  If you or someone is in <strong>immediate danger</strong>, please
                  call the appropriate emergency service directly using the contacts below.
                </p>
              </div>
            </div>
          </div>

          {/* Important Disclaimer */}
          <div className="bg-warning-bg border border-warning-border rounded-lg p-4 mb-8 fade-in" style={{ animationDelay: "0.1s" }}>
            <div className="flex items-start gap-3">
              <ShieldIcon size={18} className="text-warning flex-shrink-0 mt-0.5" />
              <p className="text-sm text-warning">
                <strong>Important:</strong> Sentinel City Intelligence provides emergency contact
                information and guidance. Displaying these contacts does{" "}
                <strong>not</strong> mean emergency services have been dispatched.
                You must call the number directly to request help.
              </p>
            </div>
          </div>

          {/* Emergency Contacts */}
          <div className="space-y-4 mb-12 fade-in" style={{ animationDelay: "0.2s" }}>
            <h2 className="text-lg font-semibold mb-4">Verified Emergency Contacts</h2>
            {emergencyContacts.map((contact) => (
              <div
                key={contact.service}
                className="bg-surface-1 border border-border rounded-card p-5 hover:border-border-hover transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-surface-2 flex items-center justify-center text-text-secondary group-hover:bg-accent-muted group-hover:text-accent transition-colors">
                      <PhoneIcon size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold">{contact.service}</h3>
                      <p className="text-xs text-text-tertiary mt-0.5">
                        {contact.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <a
                      href={`tel:${contact.number}`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-critical text-white rounded-pill text-sm font-semibold hover:bg-critical/90 transition-colors min-h-[44px]"
                    >
                      <PhoneIcon size={16} />
                      {contact.number}
                    </a>
                    <p className="text-xs text-text-tertiary mt-1">
                      {contact.available}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Safety Guidance */}
          <div className="bg-surface-1 border border-border rounded-card p-6 mb-8 fade-in" style={{ animationDelay: "0.3s" }}>
            <h2 className="text-lg font-semibold mb-4">While You Wait for Help</h2>
            <ul className="space-y-3">
              {[
                "Move to a safe location if possible",
                "Do not put yourself in danger to assess the situation",
                "If there is a fire, evacuate the area and do not use elevators",
                "Provide clear location details when calling emergency services",
                "Stay on the line with the emergency operator until they confirm help is on the way",
                "If someone is injured, do not move them unless absolutely necessary",
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-text-secondary">
                  <span className="w-5 h-5 rounded-full bg-surface-2 flex items-center justify-center text-xs text-text-tertiary flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          {/* Continue to Report */}
          <div className="text-center fade-in" style={{ animationDelay: "0.4s" }}>
            <p className="text-sm text-text-tertiary mb-4">
              After ensuring safety, you can still file a report for record and follow-up.
            </p>
            <Link
              href="/report"
              className="inline-flex items-center gap-2 px-6 py-3 bg-surface-2 text-text-primary rounded-pill text-sm font-medium border border-border hover:bg-surface-3 transition-all"
            >
              File an Incident Report
              <ArrowRightIcon size={16} />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
