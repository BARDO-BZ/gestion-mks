export type InstitutionStatus = "active" | "inactive";

export type AdminInstitutionRow = {
  id: number;
  name: string;
  account_number: string | null;
  status: InstitutionStatus;
  created_at: string;
  users_count: number;
  epps_count: number;
};

export async function listInstitutions(params?: {
  q?: string;
  status?: InstitutionStatus | "all";
  page?: number;
  pageSize?: number;
}) {
  const sp = new URLSearchParams();

  if (params?.q) sp.set("q", params.q);
  if (params?.status && params.status !== "all")
    sp.set("status", params.status);
  if (params?.page) sp.set("page", String(params.page));
  if (params?.pageSize) sp.set("pageSize", String(params.pageSize));

  const url = `/api/admin/institutions${sp.toString() ? `?${sp.toString()}` : ""}`;

  const res = await fetch(url, { credentials: "include" });
  const json = await res.json().catch(() => ({}));

  if (!res.ok) throw new Error(json.message || "Error al listar instituciones");

  return json as {
    data: AdminInstitutionRow[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  };
}
