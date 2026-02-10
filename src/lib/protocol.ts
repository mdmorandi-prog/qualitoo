export async function generateProtocol(): Promise<string> {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8);
  const data = new TextEncoder().encode(timestamp + random);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex.substring(0, 12).toUpperCase();
}

export interface ReportData {
  protocol: string;
  isAnonymous: boolean;
  type: string;
  date: string;
  location: string;
  sector: string;
  shift: string;
  accusedName: string;
  accusedRole: string;
  description: string;
  hasWitnesses: boolean;
  witnessInfo: string;
  wantsFollowUp: boolean;
  contactInfo: string;
  identityName?: string;
  identityRole?: string;
  createdAt: string;
}

const STORAGE_KEY = "canal_denuncias_reports";

export function saveReport(report: ReportData): void {
  const existing = getReports();
  existing.push(report);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

export function getReports(): ReportData[] {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function findReport(protocol: string): ReportData | undefined {
  return getReports().find((r) => r.protocol === protocol);
}
