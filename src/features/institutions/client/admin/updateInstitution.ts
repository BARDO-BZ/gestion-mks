export async function updateInstitutionName(id: number, name: string, account_number?: string | null) {
  const res = await fetch(`/api/admin/institutions/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, account_number }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || "Error al editar institución");
  return json;
}
