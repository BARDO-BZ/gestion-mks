"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader, Chip, Spinner } from "@heroui/react";
import { eppStatusLabel } from "@/features/epps/utils/eppStatus";

interface StatusCount { status: string; count: number }
interface NameCount { institution?: string; branch?: string; service?: string; count: number }

interface DashboardStats {
  byStatus: StatusCount[];
  reservedBreakdown: { both_reasons: number; open_tasks_only: number; overdue_only: number };
  byInstitution: NameCount[];
  byBranch: NameCount[];
  byService: NameCount[];
  expiringSoon: number;
}

const STATUS_COLORS: Record<string, "danger" | "warning" | "success" | "default"> = {
  TO_DISCARD: "danger",
  RESERVED:   "warning",
  APPROVED:   "success",
  DISCARDED:  "default",
};

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="flex flex-col items-center justify-center bg-white border border-gray-100 rounded-xl p-4 gap-1 shadow-sm">
      <span className="text-3xl font-bold" style={color ? { color } : undefined}>{value}</span>
      <span className="text-xs text-gray-500 text-center">{label}</span>
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
    <div className="p-6 flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {/* Alerta: vencimientos próximos */}
      {Number(stats.expiringSoon) > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          ⚠ <strong>{stats.expiringSoon}</strong> EPP{Number(stats.expiringSoon) !== 1 ? "s" : ""} con caducidad en los próximos 60 días.
        </div>
      )}

      {/* Totales por estado */}
      <Card>
        <CardHeader className="pb-0">
          <h2 className="text-base font-semibold">EPPs por estado</h2>
          <span className="ml-auto text-xs text-gray-400">{totalEpps} en total</span>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {sortedStatuses.map((row) => (
              <div
                key={row.status}
                className="flex flex-col items-center justify-center rounded-xl p-4 gap-1 border"
              >
                <span className="text-3xl font-bold">{row.count}</span>
                <Chip
                  size="sm"
                  color={STATUS_COLORS[row.status] ?? "default"}
                  variant="flat"
                >
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

      {/* Uso Bajo Reserva — motivo */}
      {totalReserved > 0 && (
        <Card>
          <CardHeader className="pb-0">
            <h2 className="text-base font-semibold">Uso Bajo Reserva — motivo</h2>
            <span className="ml-auto text-xs text-gray-400">{totalReserved} EPPs</span>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-3 gap-3">
              <StatCard
                label="Inspección vencida"
                value={Number(overdue_only)}
                color="#f59e0b"
              />
              <StatCard
                label="Tareas abiertas"
                value={Number(open_tasks_only)}
                color="#f59e0b"
              />
              <StatCard
                label="Ambos"
                value={Number(both_reasons)}
                color="#ef4444"
              />
            </div>
          </CardBody>
        </Card>
      )}

      {/* Distribuciones */}
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
