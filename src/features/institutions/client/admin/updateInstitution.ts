export async function updateInstitutionName(id: number, name: string) {
  const res = await fetch(`/api/admin/institutions/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || "Error al editar institución");
  return json;
}
