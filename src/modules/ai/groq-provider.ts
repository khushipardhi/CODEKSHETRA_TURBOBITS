/* ════════════════════════════════════════════════════════
   Groq AI Incident Analysis Provider
   Uses Groq API with robust model fallback — returns structured JSON
   Stage 1: Full analysis + 17-department mismatch detection
   Stage 2: Department-specific questions (including mandatory Phone Number)
   Stage 3: Final report synthesis incorporating answers
   ════════════════════════════════════════════════════════ */

import Groq from "groq-sdk";
import { env } from "@/lib/env";
import { DEPARTMENTS, getDepartmentByCode, type DepartmentInfo } from "./department-routing";

/** Raw AI output schema — what Stage 1 LLM returns */
export interface AIRawAnalysis {
  incidentType: string;
  mainCategory: string;
  subcategory: string;
  summary: string;
  severity: {
    level: "critical" | "high" | "medium" | "low";
    score: number;
    reason: string;
  };
  affectedPeople: number | null;
  location: {
    required: boolean;
    provided: boolean;
    text: string | null;
  };
  attachments: {
    required: boolean;
    recommended: boolean;
    reason: string;
  };
  privacy: {
    level: "normal" | "restricted" | "sensitive";
    protectIdentity: boolean;
  };
  requiredDepartments: Array<{
    departmentType: string;
    reason: string;
  }>;
  confidence: {
    overall: number;
    category: number;
    severity: number;
    departmentRouting: number;
  };
  mismatch: boolean;
  suggestedCategory: string | null;
  mismatchReason: string | null;
  questionsForCitizen: Array<{
    question: string;
    reason: string;
  }>;
}

/** Stage 2 output — department-specific questions */
export interface AIQuestionSet {
  questions: Array<{
    id: string;
    question: string;
    type: "chip" | "multi_chip" | "yesno" | "text";
    options?: string[];
    placeholder?: string;
    required: boolean;
  }>;
}

/** Stage 3 output — final synthesized report */
export interface AIFinalReport {
  finalSummary: string;
  severity: string;
  priorityScore: number;
  affectedPeople: number | null;
  keyFindings: string[];
  recommendedActions: string[];
  urgencyReason: string;
}

/** Detailed scope description for all 17 departments */
const DEPARTMENT_DEFINITIONS: Record<string, {
  name: string;
  icon: string;
  scope: string;
  keywords: string[];
  criticalParams: string[];
  notInScope: string;
}> = {
  police: {
    name: "Police Department",
    icon: "🛡️",
    scope: "Law enforcement, crimes, theft, robbery, assault, violence, harassment, cyber crime, public disturbance, missing persons, suspicious activity, law & order.",
    keywords: ["theft", "stolen", "robbery", "assault", "fight", "harassment", "cyber crime", "scam", "fraud", "missing person", "drunk", "violence", "threat"],
    criticalParams: ["Suspect description", "Time of occurrence", "Weapon involved", "Evidence available"],
    notInScope: "Traffic signal issues, general road potholes, municipal garbage, street lighting.",
  },
  traffic_police: {
    name: "Traffic Police",
    icon: "🚦",
    scope: "Traffic regulation, major traffic congestion, road accidents, reckless driving, illegal parking blocking roads, towing, traffic rule violations.",
    keywords: ["traffic jam", "accident", "vehicle crash", "reckless driving", "illegal parking", "towing", "road blocked by vehicle", "traffic violation"],
    criticalParams: ["Vehicle number", "Accident severity", "Traffic blockage extent", "Intersection/road name"],
    notInScope: "Broken signals (Traffic Management), road potholes (Road Maintenance), non-vehicular crimes.",
  },
  fire_brigade: {
    name: "Fire Brigade",
    icon: "🔥",
    scope: "Active fires (buildings, vehicles, commercial), smoke, cylinder/gas blasts, chemical leaks, structural rescue, water rescue, trapped persons.",
    keywords: ["fire", "flames", "smoke", "burning", "cylinder blast", "gas leak", "trapped person", "drowning", "building collapse rescue"],
    criticalParams: ["Fire size/extent", "Trapped individuals", "Hazardous materials/chemicals", "Building type/floors"],
    notInScope: "Forest fires (co-managed with Forest Dept), non-fire municipal complaints.",
  },
  health_dept: {
    name: "Health Department",
    icon: "🏥",
    scope: "Public health, disease outbreaks (dengue, malaria, cholera), contaminated water illness, food safety violations, hospital hygiene, stray animal rabies/bites.",
    keywords: ["disease outbreak", "dengue", "malaria", "fever", "epidemic", "food poisoning", "unhygienic restaurant", "dog bite", "rabies", "headache", "illness", "health hazard"],
    criticalParams: ["Number of affected persons", "Symptoms observed", "Facility/establishment name", "Doctor consultation status"],
    notInScope: "Emergency ambulance transport (Ambulance Services), water pipe repairs (Water Supply).",
  },
  ambulance: {
    name: "Ambulance Services",
    icon: "🚑",
    scope: "Emergency medical transport (108 Ambulance), urgent patient transfer, accident trauma care, heart attacks, severe acute injuries, medical emergencies.",
    keywords: ["ambulance", "medical emergency", "heart attack", "unconscious", "heavy bleeding", "severe pain", "head paining", "critical patient", "trauma"],
    criticalParams: ["Patient conscious status", "Severity of condition", "Exact pickup landmark", "Oxygen/stretcher required"],
    notInScope: "Routine clinic complaints, long-term health policy.",
  },
  water_supply: {
    name: "Water Supply Department",
    icon: "💧",
    scope: "Municipal drinking water supply, pipeline bursts, low water pressure, no water supply, dirty/muddy tap water, water tanker requests.",
    keywords: ["no water", "dry tap", "water cut", "pipe burst", "water leak", "muddy water", "low pressure", "drinking water issue"],
    criticalParams: ["Duration of disruption", "Pipeline location", "Water appearance/smell", "Area/zone affected"],
    notInScope: "Sewage overflow (Drainage), storm waterlogging (Drainage).",
  },
  drainage: {
    name: "Drainage Department",
    icon: "🌊",
    scope: "Stormwater drainage, sewage overflow, blocked gutters/drains, open sewage, foul odor from sewer, monsoon waterlogging.",
    keywords: ["sewage", "gutter", "drain overflow", "blocked drain", "waterlogging", "stinking sewer", "open nullah", "choked drainage"],
    criticalParams: ["Drain blockage location", "Sewage entering premises", "Water level depth", "Foul smell intensity"],
    notInScope: "Drinking water pipeline leak (Water Supply), road potholes (Road Maintenance).",
  },
  road_maintenance: {
    name: "Road Maintenance / PWD",
    icon: "🛣️",
    scope: "Potholes, damaged asphalt, road cave-ins, broken road dividers, open manholes on roads, footpath pavement damage, road resurfacing.",
    keywords: ["pothole", "bad road", "broken road", "crater", "damaged asphalt", "road cave-in", "open manhole cover", "damaged divider"],
    criticalParams: ["Pothole depth/size", "Road/lane affected", "Accident risk level", "Nearby landmark"],
    notInScope: "Traffic signals (Traffic Management), illegal parking (Traffic Police).",
  },
  traffic_management: {
    name: "Traffic Management",
    icon: "🚥",
    scope: "Traffic signals (broken, non-functional, timing issues), road sign boards, speed breakers, zebra crossings, blinkers, lane markings.",
    keywords: ["broken traffic light", "signal not working", "traffic signal faulty", "missing sign board", "speed breaker", "zebra crossing", "blinker"],
    criticalParams: ["Signal junction name", "Malfunction type (dead/stuck red/blinking)", "Traffic congestion impact"],
    notInScope: "Traffic police deployment, pothole repairs.",
  },
  waste_management: {
    name: "Waste Management",
    icon: "🗑️",
    scope: "Solid waste collection, overflowing garbage bins, open dumping, missed door-to-door garbage collection, animal carcass removal, littering.",
    keywords: ["garbage", "trash", "waste dump", "overflowing bin", "garbage not picked up", "dead animal", "litter", "kachra"],
    criticalParams: ["Garbage volume/size", "Days uncollected", "Location of bin/pile", "Health hazard risk"],
    notInScope: "Sewage overflow (Drainage), public toilet cleaning (Municipal Corp).",
  },
  environment: {
    name: "Environmental Department",
    icon: "🌳",
    scope: "Air pollution, industrial smoke/fumes, noise pollution (loudspeakers, late-night DJ, construction noise), park maintenance, lake pollution, plastic ban.",
    keywords: ["air pollution", "smoke", "industrial fumes", "noise pollution", "loudspeaker", "park damage", "lake pollution", "burning plastic"],
    criticalParams: ["Pollution source", "Time/duration of violation", "Noise level/smoke intensity", "Location/vicinity"],
    notInScope: "Forest wildlife rescue (Forest Dept), garbage disposal (Waste Management).",
  },
  electricity: {
    name: "Electricity Department",
    icon: "⚡",
    scope: "Power outages, blackout, broken live wires, sparking transformer, tilted electric poles, street lights not working, voltage fluctuations.",
    keywords: ["power cut", "load shedding", "broken electric wire", "live wire", "sparking transformer", "street light not working", "dark street", "electric shock hazard"],
    criticalParams: ["Live wire hazard status", "Pole/transformer number", "Outage scope (single house vs entire area)", "Sparking/fire risk"],
    notInScope: "Traffic signal lights (Traffic Management), internal home wiring.",
  },
  disaster_management: {
    name: "Disaster Management",
    icon: "🚨",
    scope: "Major natural or man-made disasters, heavy flood crisis, major multi-story building collapse, severe storm/cyclone damage, earthquake relief.",
    keywords: ["disaster", "major flood", "building collapse", "cyclone", "storm damage", "large scale emergency", "mass rescue", "relief camp"],
    criticalParams: ["Disaster severity", "Estimated casualties/stranded people", "Evacuation needed", "Access route status"],
    notInScope: "Routine localized issues like single potholes or street lights.",
  },
  municipal_corp: {
    name: "Municipal Corporation",
    icon: "🏢",
    scope: "General municipal services (NMC), public toilets, illegal encroachments on footpaths/public land, property tax issues, civic licenses, birth/death records.",
    keywords: ["municipal corporation", "NMC", "public toilet dirty", "illegal encroachment", "hawker blocking footpath", "illegal construction", "civic amenities"],
    criticalParams: ["Encroachment type", "Facility location", "Commercial vs residential area"],
    notInScope: "Crime/theft (Police), electricity supply (Electricity Dept).",
  },
  public_works: {
    name: "Public Works Department",
    icon: "🚧",
    scope: "Major government infrastructure, flyover construction/damage, public bridges, government buildings, large-scale drainage conduits.",
    keywords: ["flyover damage", "bridge crack", "government building", "PWD road project", "infrastructure structural damage"],
    criticalParams: ["Structural defect description", "Flyover/bridge name", "Safety threat level"],
    notInScope: "Local colony street potholes (Road Maintenance), garbage bins (Waste Management).",
  },
  forest_wildlife: {
    name: "Forest & Wildlife Department",
    icon: "🌲",
    scope: "Forest conservation, wild animals entering residential areas (leopards, monkeys, wild boars, snakes, deer), illegal tree felling/logging, forest fires, poaching.",
    keywords: ["wild animal", "leopard", "snake rescue", "monkey menace", "illegal tree cutting", "forest fire", "wildlife conflict", "poaching", "forest reserve"],
    criticalParams: ["Animal species seen", "Immediate danger to humans", "Last seen location/direction", "Tree felling location"],
    notInScope: "Stray dogs/cats (Health Dept / NMC), pruned garden branches (Environment / NMC).",
  },
  women_child_dev: {
    name: "Women & Child Development",
    icon: "👩‍👧",
    scope: "Women's safety, domestic violence, child protection, child labor, abandoned children, eve teasing, dowry harassment, shelter assistance, women helpline.",
    keywords: ["domestic violence", "child abuse", "child labor", "eve teasing", "women safety", "dowry", "abandoned child", "women helpline", "distress woman"],
    criticalParams: ["Immediate physical safety status", "Age of victim/child", "Perpetrator details", "Safe location available"],
    notInScope: "General financial fraud (Police Cyber Cell), routine road issues.",
  },
};

function buildDepartmentTaxonomyReference(): string {
  return Object.entries(DEPARTMENT_DEFINITIONS).map(([code, def]) => {
    return `### ${def.icon} ${def.name} (code: "${code}")
- Scope: ${def.scope}
- Common Keywords: ${def.keywords.join(", ")}
- Critical Info Needed: ${def.criticalParams.join(", ")}
- NOT In Scope: ${def.notInScope}`;
  }).join("\n\n");
}

function buildDepartmentContext(selectedDepartment: string): string {
  const dept = DEPARTMENT_DEFINITIONS[selectedDepartment] || getDepartmentByCode(selectedDepartment);
  const name = dept?.name || selectedDepartment;
  const icon = dept ? (dept as any).icon || "📋" : "📋";

  return `
══════════════════════════════════════════════════════════════
DEPARTMENT MISMATCH EVALUATION (MANDATORY):
The citizen manually selected the department: "${icon} ${name}" (code: "${selectedDepartment}").

YOUR TASK:
1. Carefully compare the citizen's query with the scope of "${name}".
2. Check if the citizen's query TRULY belongs to "${name}".
   - If it DOES belong to "${name}":
     Set "mismatch": false, "suggestedCategory": null, "mismatchReason": null.
     Set "mainCategory": "${selectedDepartment}".
   - If it DOES NOT belong to "${name}" (e.g., user selected Electricity but reported a medical issue or garbage):
     Set "mismatch": true.
     Set "suggestedCategory": "<exact_correct_department_code_from_the_17_departments>".
     Set "mismatchReason": "A polite, clear 1-2 sentence message telling the citizen: 'You selected ${name}, but your report regarding [brief issue] falls under [Suggested Department Name]. We recommend routing this to [Suggested Department Name] for faster response.'"
══════════════════════════════════════════════════════════════`;
}

const BASE_SYSTEM_PROMPT = `You are the Master AI Engine for "Sentinel City Intelligence", the multi-hazard civic intelligence and routing system for Indian cities (Nagpur, Pune, Mumbai, Maharashtra, India).

Your mission: Accurately analyze citizen queries, classify them into the correct department out of the 17 city departments, detect department mismatches, assess severity, and formulate follow-up questions.

CITY DEPARTMENTS DIRECTORY (Exact 17 Departments):
${buildDepartmentTaxonomyReference()}

SEVERITY CLASSIFICATION:
- critical: Immediate threat to human life, active disaster, severe fire, major gas leak, live wire on water/ground, acute trauma (score 81-100)
- high: Significant public hazard, heavy waterlogging, active disease outbreak, burst water main, severe crime (score 61-80)
- medium: Standard civic issue, non-critical pothole, uncollected garbage, streetlight out, broken signal (score 31-60)
- low: Minor aesthetic complaint, inquiry, minor noise (score 0-30)

RULES FOR INCIDENT ANALYSIS:
1. Select the BEST primary department code from the 17 codes above for "mainCategory".
2. One incident CAN route to multiple departments in "requiredDepartments".
3. Extract specific locations (landmarks, areas in the reporting city such as Sitabuldi/Dharampeth in Nagpur, Kothrud/Shivajinagar in Pune, Bandra/Andheri/Colaba in Mumbai, etc.).
4. If the user query is medical/health-related (e.g. "my head is paining", "fever", "accident"), route to "ambulance" or "health_dept".
5. Always generate a clear, empathetic 1-2 sentence "summary" for the citizen.

You MUST respond ONLY with a valid JSON object using this EXACT schema:
{
  "incidentType": "specific_incident_slug (e.g. broken_wire, medical_emergency, pothole)",
  "mainCategory": "exact_department_code_from_17_departments",
  "subcategory": "specific_incident_slug",
  "summary": "Plain language summary for citizen (max 200 chars)",
  "severity": {
    "level": "critical|high|medium|low",
    "score": 0-100,
    "reason": "Brief rationale for severity"
  },
  "affectedPeople": null or number,
  "location": {
    "required": true,
    "provided": true or false,
    "text": "Extracted location or landmark if mentioned, else null"
  },
  "attachments": {
    "required": false,
    "recommended": true or false,
    "reason": "Why photo helps"
  },
  "privacy": {
    "level": "normal|restricted|sensitive",
    "protectIdentity": false
  },
  "requiredDepartments": [
    { "departmentType": "exact_department_code", "reason": "Why this department" }
  ],
  "confidence": {
    "overall": 0.0-1.0,
    "category": 0.0-1.0,
    "severity": 0.0-1.0,
    "departmentRouting": 0.0-1.0
  },
  "mismatch": false,
  "suggestedCategory": null,
  "mismatchReason": null,
  "questionsForCitizen": []
}`;

function generateFallbackAnalysis(params: {
  text: string;
  locationContext?: string;
  selectedDepartment?: string;
}): AIRawAnalysis {
  const textLower = (params.text + " " + (params.locationContext || "")).toLowerCase();
  
  // Score all 17 departments by keyword matches
  let bestDept = "municipal_corp";
  let bestScore = 0;

  for (const [code, def] of Object.entries(DEPARTMENT_DEFINITIONS)) {
    let score = 0;
    for (const kw of def.keywords) {
      if (textLower.includes(kw.toLowerCase())) {
        score += 2;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestDept = code;
    }
  }

  // If user selected a department, check for mismatch
  let mismatch = false;
  let suggestedCategory: string | null = null;
  let mismatchReason: string | null = null;

  if (params.selectedDepartment) {
    if (bestScore >= 2 && bestDept !== params.selectedDepartment) {
      mismatch = true;
      suggestedCategory = bestDept;
      const deptName = DEPARTMENT_DEFINITIONS[params.selectedDepartment]?.name || params.selectedDepartment;
      const targetName = DEPARTMENT_DEFINITIONS[bestDept]?.name || bestDept;
      mismatchReason = `You selected ${deptName}, but your report regarding this issue falls under ${targetName}. We recommend routing this to ${targetName} for faster response.`;
    }
  }

  // Determine severity based on emergency/hazard keywords
  const isCritical = ["sparking", "live wire", "cylinder blast", "gas leak", "flames", "fire", "heart attack", "unconscious", "heavy bleeding", "drowning", "building collapse"].some((k) => textLower.includes(k));
  const isHigh = ["pothole", "accident", "overflow", "sewage", "theft", "flood", "broken wire", "no water", "dog bite", "dengue", "open manhole"].some((k) => textLower.includes(k));

  const severityLevel: "critical" | "high" | "medium" | "low" = isCritical ? "critical" : (isHigh ? "high" : "medium");
  const severityScore = isCritical ? 90 : (isHigh ? 70 : 45);

  const effectiveDept = mismatch ? (suggestedCategory || bestDept) : (params.selectedDepartment || bestDept);
  const deptDef = DEPARTMENT_DEFINITIONS[effectiveDept] || DEPARTMENT_DEFINITIONS.municipal_corp;

  return {
    incidentType: effectiveDept,
    mainCategory: effectiveDept,
    subcategory: effectiveDept,
    summary: params.text.length > 180 ? params.text.slice(0, 177) + "..." : params.text,
    severity: {
      level: severityLevel,
      score: severityScore,
      reason: isCritical ? "Immediate safety hazard detected" : "Civic operational report needing attention",
    },
    affectedPeople: null,
    location: {
      required: true,
      provided: !!params.locationContext || textLower.includes("road") || textLower.includes("near") || textLower.includes("station") || textLower.includes("nagpur"),
      text: params.locationContext || null,
    },
    attachments: {
      required: false,
      recommended: true,
      reason: "Visual evidence assists field inspection crew",
    },
    privacy: {
      level: "normal",
      protectIdentity: false,
    },
    requiredDepartments: [
      {
        departmentType: effectiveDept,
        reason: `Matched department scope for ${deptDef.name}`,
      },
    ],
    confidence: {
      overall: bestScore > 0 ? 0.85 : 0.65,
      category: bestScore > 0 ? 0.9 : 0.6,
      severity: 0.8,
      departmentRouting: 0.85,
    },
    mismatch,
    suggestedCategory,
    mismatchReason,
    questionsForCitizen: [],
  };
}

export class GroqIncidentAnalysisProvider {
  readonly providerName = "groq";
  private client: Groq;
  
  // Available fast and versatile chat models on Groq
  private primaryModels = [
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "qwen/qwen3.6-27b",
    "groq/compound",
  ];

  private fastModels = [
    "openai/gpt-oss-20b",
    "openai/gpt-oss-120b",
    "qwen/qwen3.6-27b",
    "groq/compound-mini",
  ];

  constructor() {
    this.client = new Groq({ apiKey: env.groqReportingApiKey });
  }

  /**
   * Safe chat completion with automatic model fallback
   */
  private async createCompletionWithFallback(params: {
    models: string[];
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
    temperature?: number;
    max_tokens?: number;
    response_format?: { type: "json_object" };
  }): Promise<{ content: string; modelUsed: string }> {
    let lastError: Error | null = null;

    for (const model of params.models) {
      try {
        const completion = await this.client.chat.completions.create({
          model,
          messages: params.messages,
          temperature: params.temperature ?? 0.1,
          max_tokens: params.max_tokens ?? 1500,
          response_format: params.response_format ?? { type: "json_object" },
        });

        const content = completion.choices[0]?.message?.content || "{}";
        return { content, modelUsed: model };
      } catch (err: any) {
        console.warn(`[Groq AI] Model ${model} failed (${err.status || err.message}). Trying fallback...`);
        lastError = err;
      }
    }

    throw lastError || new Error("All Groq AI models failed to respond.");
  }

  /** Stage 1 — Full analysis with 17-department master prompt + mismatch detection */
  async analyze(params: {
    text: string;
    locationContext?: string;
    selectedDepartment?: string;
  }): Promise<{ analysis: AIRawAnalysis; model: string; processingTimeMs: number }> {
    const startTime = Date.now();

    let systemPrompt = BASE_SYSTEM_PROMPT;
    if (params.selectedDepartment) {
      systemPrompt += "\n\n" + buildDepartmentContext(params.selectedDepartment);
    }

    let userMessage = `Citizen report: "${params.text}"`;
    if (params.locationContext) {
      userMessage += `\n\nLocation context provided by citizen GPS / text: ${params.locationContext}`;
    }

    try {
      const { content: rawContent, modelUsed } = await this.createCompletionWithFallback({
        models: this.primaryModels,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.1,
        max_tokens: 1500,
        response_format: { type: "json_object" },
      });

      let analysis: AIRawAnalysis;
      try {
        analysis = JSON.parse(rawContent) as AIRawAnalysis;
      } catch {
        throw new Error("Failed to parse AI structured response.");
      }

      if (!analysis.mainCategory || !analysis.summary || !analysis.severity) {
        throw new Error("AI response missing required fields (mainCategory, summary, severity)");
      }

      if (analysis.mismatch === undefined) analysis.mismatch = false;
      if (analysis.suggestedCategory === undefined) analysis.suggestedCategory = null;
      if (analysis.mismatchReason === undefined) analysis.mismatchReason = null;

      return {
        analysis,
        model: modelUsed,
        processingTimeMs: Date.now() - startTime,
      };
    } catch (err) {
      console.warn(
        `[AI Engine] Primary LLM unavailable (${err instanceof Error ? err.message : String(err)}). Using local rule-based analysis engine.`
      );
      const fallbackAnalysis = generateFallbackAnalysis(params);
      return {
        analysis: fallbackAnalysis,
        model: "local-rules-engine",
        processingTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Stage 2 — Generate department-specific questions + MANDATORY phone number.
   * Tailored strictly to the department and the query.
   */
  async generateDeptQuestions(params: {
    summary: string;
    departmentSlug: string;
    departmentName: string;
    originalText: string;
  }): Promise<AIQuestionSet> {
    const deptDef = DEPARTMENT_DEFINITIONS[params.departmentSlug];
    const deptName = deptDef?.name || params.departmentName;
    const criticalParams = deptDef?.criticalParams.join(", ") || "Specific hazard details";

    const systemPrompt = `You are the Follow-Up Question Generator for Sentinel City Intelligence multi-city civic platform.
Department: ${deptName}
Incident Summary: ${params.summary}
Department Typical Parameters: ${criticalParams}

YOUR TASK:
Generate between 2 to 4 high-value, critical follow-up questions to assist the ${deptName} in resolving this specific report.

STRICT MANDATORY RULES:
1. ALWAYS ASK FOR PHONE NUMBER:
   Unless the citizen already explicitly provided a 10-digit mobile number in their text, the FIRST question MUST ALWAYS be:
   - id: "phone_number"
   - question: "What is your contact phone / mobile number?"
   - type: "text"
   - placeholder: "e.g. 9876543210"
   - required: true

2. ASK FOR SPECIFIC LOCATION / LANDMARK (if not detailed in original text):
   - id: "exact_location"
   - question: "What is the exact street name or nearby landmark in Nagpur?"
   - type: "text"
   - placeholder: "e.g. Near Sitabuldi Metro Station"
   - required: true

3. GENERATE 1-2 QUESTIONS STRICTLY SPECIFIC TO THIS DEPARTMENT AND THIS QUERY:
   - Ask only what ${deptName} urgently needs to know about THIS specific incident.
   - For example:
     - If Electricity wire issue: Ask "Is the broken wire touching the ground or sparking?" (yesno)
     - If Water supply cut: Ask "How many days has water supply been interrupted?" (chip)
     - If Medical issue: Ask "Does the patient require immediate ambulance or hospital transport?" (yesno)
     - If Pothole/Road: Ask "Is this causing vehicle damage or blocking the main lane?" (chip)
     - If Waste dump: Ask "Is the garbage pile overflowing into the street or emitting severe foul odor?" (yesno)
   - NEVER ask irrelevant questions (e.g., no traffic questions for water issues, no electric questions for garbage).

4. Total number of questions MUST NOT exceed 4.

Return ONLY valid JSON in this exact schema:
{
  "questions": [
    {
      "id": "unique_id",
      "question": "Question text?",
      "type": "text|chip|multi_chip|yesno",
      "options": ["Option A", "Option B"], // required if chip, multi_chip, or yesno
      "placeholder": "e.g. text placeholder",
      "required": true
    }
  ]
}`;

    const userMessage = `Original report by citizen: "${params.originalText}"
Summary: "${params.summary}"

Generate the required questions (including phone number and department-specific parameters).`;

    try {
      const { content: rawContent } = await this.createCompletionWithFallback({
        models: this.fastModels,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.1,
        max_tokens: 800,
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(rawContent) as AIQuestionSet;
      let questions = result.questions || [];

      // Ensure phone_number is always present if missing from generated questions
      const hasPhoneQ = questions.some((q) => q.id.includes("phone") || q.question.toLowerCase().includes("phone") || q.question.toLowerCase().includes("mobile"));
      if (!hasPhoneQ) {
        questions.unshift({
          id: "phone_number",
          question: "What is your contact phone / mobile number?",
          type: "text",
          placeholder: "e.g. 9876543210",
          required: true,
        });
      }

      if (questions.length > 4) {
        questions = questions.slice(0, 4);
      }

      return { questions };
    } catch {
      // Reliable static fallback ensuring Phone Number is always asked
      const fallback = [
        {
          id: "phone_number",
          question: "What is your contact phone / mobile number?",
          type: "text" as const,
          placeholder: "e.g. 9876543210",
          required: true,
        },
        {
          id: "citizen_name",
          question: "What is your full name?",
          type: "text" as const,
          placeholder: "e.g. Ramesh Sharma",
          required: true,
        },
        {
          id: "exact_location",
          question: "What is the exact street name or nearby landmark?",
          type: "text" as const,
          placeholder: "e.g. Near Sitabuldi Metro Station",
          required: true,
        },
        {
          id: "incident_urgency",
          question: "Is this issue posing an immediate danger to the public?",
          type: "yesno" as const,
          options: ["Yes", "No", "Unsure"],
          required: false,
        },
      ];

      return { questions: fallback };
    }
  }

  /**
   * Stage 3 — Generate final structured report incorporating citizen answers.
   * Uses fast model. Called after citizen answers all dept questions.
   */
  async generateFinalReport(params: {
    originalText: string;
    summary: string;
    mainCategory: string;
    severity: string;
    priorityScore: number;
    departments: Array<{ code: string; name: string }>;
    questions: Array<{ questionText: string; answerValue: string }>;
    locationText?: string | null;
  }): Promise<AIFinalReport> {
    const qaPairs = params.questions
      .filter((q) => q.answerValue)
      .map((q) => `Q: ${q.questionText}\nA: ${q.answerValue}`)
      .join("\n\n");

    const systemPrompt = `You are the final report synthesizer for Sentinel City Intelligence multi-city civic platform in Maharashtra, India.

You have received:
1. Citizen's original incident report
2. Initial AI assessment
3. Additional citizen answers (including contact phone number, exact location, and department parameters)

Your job: Synthesize ALL of this into a definitive incident assessment report for the responding departments.

Return ONLY valid JSON with this exact schema:
{
  "finalSummary": "1-2 sentence definitive summary incorporating all collected information (max 300 chars)",
  "severity": "critical|high|medium|low",
  "priorityScore": 0-100,
  "affectedPeople": null or number,
  "keyFindings": ["finding 1", "finding 2", "finding 3"],
  "recommendedActions": ["action 1", "action 2"],
  "urgencyReason": "1 sentence explaining urgency level"
}

Rules:
- If answers indicate acute danger, increase priority and severity
- Extract citizen contact details and location into keyFindings
- Recommended actions should be actionable instructions for ${params.departments.map(d => d.name).join(", ")}`;

    const userMessage = `ORIGINAL REPORT:
"${params.originalText}"

INITIAL AI ANALYSIS:
Category: ${params.mainCategory}
Summary: ${params.summary}
Severity: ${params.severity} (score: ${params.priorityScore})
Departments: ${params.departments.map((d) => d.name).join(", ")}
${params.locationText ? `Location: ${params.locationText}` : ""}

CITIZEN'S ANSWERS TO FOLLOW-UP QUESTIONS:
${qaPairs || "(No answers provided)"}

Synthesize the final definitive report.`;

    try {
      const { content: rawContent } = await this.createCompletionWithFallback({
        models: this.fastModels,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.1,
        max_tokens: 600,
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(rawContent);

      return {
        finalSummary: result.finalSummary || params.summary,
        severity: result.severity || params.severity,
        priorityScore: Math.max(0, Math.min(100, result.priorityScore ?? params.priorityScore)),
        affectedPeople: result.affectedPeople ?? null,
        keyFindings: Array.isArray(result.keyFindings) ? result.keyFindings.slice(0, 4) : [],
        recommendedActions: Array.isArray(result.recommendedActions) ? result.recommendedActions.slice(0, 3) : [],
        urgencyReason: result.urgencyReason || "",
      };
    } catch (err) {
      console.error("[AI] Final report generation failed:", err);
      return {
        finalSummary: params.summary,
        severity: params.severity,
        priorityScore: params.priorityScore,
        affectedPeople: null,
        keyFindings: params.questions
          .filter((q) => q.answerValue)
          .map((q) => `${q.questionText}: ${q.answerValue}`)
          .slice(0, 4),
        recommendedActions: [],
        urgencyReason: "",
      };
    }
  }
}

