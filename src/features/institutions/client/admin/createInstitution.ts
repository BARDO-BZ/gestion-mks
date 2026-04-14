import type { InstitutionStatus } from "./listInstitutions";

export async function createInstitution(input: {
  name: string;
  account_number?: string | null;
  status?: InstitutionStatus;
}) {
  const res = await fetch("/api/admin/institutions", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || "Error al crear institución");
  return json;
}
