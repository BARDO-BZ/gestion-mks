"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardBody, CardHeader, Chip, Spinner } from "@heroui/react";
import { eppStatusLabel } from "@/features/epps/utils/eppStatus";
import { logTypeLabel, formatLogDetails } from "@/features/epps/utils/formatLogEntry";

interface StatusCount { status: string; count: number }
interface NameCount { institution?: string; branch?: string; service?: string; count: number }

interface ExpiringSoonItem {
  id: number;
  code: string;
  institution_name: string;
  branch: string;
  caducidad_month: number;
  caducidad_year: number;
}

interface PendingInspItem {
  id: number;
  code: string;
  institution_name: string;
  branch: string;
  inspection_freq: string;
  last_inspection_at: string | null;
}

interface ActivityItem {
  log_id: number;
  type: string;
  details: unknown;
  created_at: string;
  epp_id: number;
  epp_code: string;
  user_name: string;
  user_last_name: string;
}

interface DashboardStats {
  byStatus: StatusCount[];
  reservedBreakdown: { both_reasons: number; open_tasks_only: number; overdue_only: number };
  byInstitution: NameCount[];
  byBranch: NameCount[];
  byService: NameCount[];
  expiringSoon: number;
  expiringSoonList: ExpiringSoonItem[];
  pendingInspectionCount: number;
  pendingInspectionList: PendingInspItem[];
  openTasksTotal: number;
  recentActivity: ActivityItem[];
}

const STATUS_COLORS: Record<string, "danger" | "warning" | "success" | "default"> = {
  TO_DISCARD: "danger",
  RESERVED:   "warning",
  APPROVED:   "success",
  DISCARDED:  "default",
};

function StatCard({
  label,
  value,
  color,
  sub,
}: {
  label: string;
  value: number;
  color?: string;
  sub?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center bg-white border border-gray-100 rounded-xl p-4 gap-1 shadow-sm">
      <span className="text-3xl font-bold" style={color ? { color } : undefined}>{value}</span>
      <span className="text-xs text-gray-500 text-center">{label}</span>
      {sub && <span className="text-[10px] text-gray-400">{sub}</span>}
    </div>
  );
}

function DistributionBar({ items, labelKey }: { items: NameCount[]; labelKey: keyof NameCount }) {
  const max = Math.max(...items.map((i) => Number(i.count)), 1);
  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => {
        const label = String(item[labelKey] ?? "—");
        const pct = Math.round((Number(item.count) / max) * 100);
        return (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs text-gray-600 w-36 truncate shrink-0">{label}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 w-6 text-right">{item.count}</span>
          </div>
        );
      })}
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  const days = Math.floor(hrs / 24);
  return `hace ${days} d`;
}

export function DashboardView() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => { if (json) setStats(json); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }

  if (!stats) return <p className="p-6 text-gray-500">No se pudieron cargar las estadísticas.</p>;

  const totalEpps = stats.byStatus.reduce((s, r) => s + Number(r.count), 0);

  const statusOrder = ["TO_DISCARD", "RESERVED", "APPROVED", "DISCARDED"];
  const sortedStatuses = [...stats.byStatus].sort(
    (a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status),
  );

  const { both_reasons, open_tasks_only, overdue_only } = stats.reservedBreakdown;
  const totalReserved = Number(both_reasons) + Number(open_tasks_only) + Number(overdue_only);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {/* ── Row 1: KPIs principales ── */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total EPPs" value={totalEpps} />
        <StatCard
          label="Inspecciones pendientes"
          value={Number(stats.pendingInspectionCount)}
          color={Number(stats.pendingInspectionCount) > 0 ? "#f59e0b" : undefined}
        />
        <StatCard
          label="Tareas abiertas"
          value={Number(stats.openTasksTotal)}
          color={Number(stats.openTasksTotal) > 0 ? "#f59e0b" : undefined}
        />
      </div>

      {/* ── Row 2: EPPs por estado ── */}
      <Card>
        <CardHeader className="pb-0 flex items-center justify-between">
          <h2 className="text-base font-semibold">EPPs por estado</h2>
          <span className="text-xs text-gray-400">{totalEpps} en total</span>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {sortedStatuses.map((row) => (
              <div
                key={row.status}
                className="flex flex-col items-center justify-center rounded-xl p-4 gap-1 border"
              >
                <span className="text-3xl font-bold">{row.count}</span>
                <Chip size="sm" color={STATUS_COLORS[row.status] ?? "default"} variant="flat">
                  {eppStatusLabel(row.status)}
                </Chip>
                <span className="text-xs text-gray-400">
                  {totalEpps > 0 ? Math.round((Number(row.count) / totalEpps) * 100) : 0}%
                </span>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* ── Row 2: Vencimientos + Inspecciones pendientes ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Próximos vencimientos */}
        <Card>
          <CardHeader className="pb-0 flex items-center justify-between">
            <h2 className="text-base font-semibold">Próximos vencimientos</h2>
            <span className="text-xs text-gray-400">próximos 60 días</span>
          </CardHeader>
          <CardBody>
            {stats.expiringSoonList.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Sin vencimientos próximos</p>
            ) : (
              <div className="flex flex-col divide-y divide-gray-100">
                {stats.expiringSoonList.map((epp) => (
                  <Link
                    key={epp.id}
                    href={`/epp/${epp.id}`}
                    className="flex items-center justify-between py-2.5 hover:bg-gray-50 rounded-lg px-1 -mx-1 transition-colors group"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium group-hover:text-blue-600 transition-colors">
                        {epp.code}
                      </span>
                      <span className="text-xs text-gray-400">
                        {[epp.institution_name, epp.branch].filter(Boolean).join(" · ")}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-amber-600 shrink-0 ml-2">
                      {epp.caducidad_month}/{epp.caducidad_year}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Inspecciones pendientes */}
        <Card>
          <CardHeader className="pb-0 flex items-center justify-between">
            <h2 className="text-base font-semibold">Inspecciones pendientes</h2>
            <span className="text-xs text-gray-400">más atrasadas primero</span>
          </CardHeader>
          <CardBody>
            {stats.pendingInspectionList.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Sin inspecciones pendientes</p>
            ) : (
              <div className="flex flex-col divide-y divide-gray-100">
                {stats.pendingInspectionList.map((epp) => (
                  <Link
                    key={epp.id}
                    href={`/epp/${epp.id}`}
                    className="flex items-center justify-between py-2.5 hover:bg-gray-50 rounded-lg px-1 -mx-1 transition-colors group"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium group-hover:text-blue-600 transition-colors">
                        {epp.code}
                      </span>
                      <span className="text-xs text-gray-400">
                        {[epp.institution_name, epp.branch].filter(Boolean).join(" · ")}
                      </span>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <span className="text-xs text-gray-400 block">
                        {epp.inspection_freq === "SEMESTRAL" ? "Semestral" : "Anual"}
                      </span>
                      <span className="text-xs font-medium text-amber-600">
                        {epp.last_inspection_at
                          ? new Date(epp.last_inspection_at).toLocaleDateString("es-AR")
                          : "Nunca"}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* ── Row 3: RESERVED breakdown ── */}
      {totalReserved > 0 && (
        <Card>
          <CardHeader className="pb-0 flex items-center justify-between">
            <h2 className="text-base font-semibold">Uso bajo reserva — motivo</h2>
            <span className="text-xs text-gray-400">{totalReserved} EPPs</span>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Inspección vencida" value={Number(overdue_only)} color="#f59e0b" />
              <StatCard label="Tareas abiertas" value={Number(open_tasks_only)} color="#f59e0b" />
              <StatCard label="Ambos" value={Number(both_reasons)} color="#ef4444" />
            </div>
          </CardBody>
        </Card>
      )}

      {/* ── Row 4: Actividad reciente ── */}
      {stats.recentActivity.length > 0 && (
        <Card>
          <CardHeader className="pb-0">
            <h2 className="text-base font-semibold">Actividad reciente</h2>
          </CardHeader>
          <CardBody>
            <div className="flex flex-col divide-y divide-gray-100">
              {stats.recentActivity.map((item) => {
                const details = typeof item.details === "string"
                  ? (() => { try { return JSON.parse(item.details); } catch { return {}; } })()
                  : item.details;
                const userName = [item.user_name, item.user_last_name].filter(Boolean).join(" ") || "Sistema";
                return (
                  <div key={item.log_id} className="flex items-start justify-between py-2.5 gap-3">
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-700 shrink-0">{userName}</span>
                        <span className="text-xs text-gray-400">·</span>
                        <Link
                          href={`/epp/${item.epp_id}`}
                          className="text-xs text-blue-500 hover:underline shrink-0"
                        >
                          {item.epp_code}
                        </Link>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        <span className="font-medium text-gray-600">{logTypeLabel(item.type)}</span>
                        {" — "}
                        {formatLogDetails(item.type, details)}
                      </p>
                    </div>
                    <span className="text-[10px] text-gray-400 shrink-0 mt-0.5">
                      {timeAgo(item.created_at)}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      )}

      {/* ── Row 5: Distribuciones ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.byInstitution.length > 0 && (
          <Card>
            <CardHeader className="pb-0">
              <h2 className="text-sm font-semibold">Por institución</h2>
            </CardHeader>
            <CardBody>
              <DistributionBar items={stats.byInstitution} labelKey="institution" />
            </CardBody>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-0">
            <h2 className="text-sm font-semibold">Por sucursal</h2>
          </CardHeader>
          <CardBody>
            {stats.byBranch.length > 0
              ? <DistributionBar items={stats.byBranch} labelKey="branch" />
              : <p className="text-xs text-gray-400">Sin datos</p>
            }
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="pb-0">
            <h2 className="text-sm font-semibold">Por servicio</h2>
          </CardHeader>
          <CardBody>
            {stats.byService.length > 0
              ? <DistributionBar items={stats.byService} labelKey="service" />
              : <p className="text-xs text-gray-400">Sin datos</p>
            }
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
