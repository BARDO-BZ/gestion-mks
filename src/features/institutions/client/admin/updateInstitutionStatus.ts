import type { InstitutionStatus } from "./listInstitutions";

export async function updateInstitutionStatus(
  id: number,
  status: InstitutionStatus,
) {
  const res = await fetch(`/api/admin/institutions/${id}/status`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || "Error al cambiar status");
  return json;
}
