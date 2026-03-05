"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, Spinner } from "@heroui/react";
import { logTypeLabel, formatLogDetails } from "@/features/epps/utils/formatLogEntry";

export function EppLogs({ id }: { id: string }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    try {
      const res = await fetch(`/api/epps/${id}/logs`, {
        credentials: "include",
      });
      const json = await res.json();
      setLogs(json.data || []);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  if (loading) return <Spinner size="sm" />;

  if (logs.length === 0)
    return <p className="text-sm text-gray-500">Sin actividad registrada.</p>;

  return (
    <Card>
      <CardBody className="flex flex-col gap-3 max-h-[400px] overflow-auto">
        {logs.map((log) => {
          const detail = formatLogDetails(log.type, log.details);
          const userName = log.user_name
            ? `${log.user_name} ${log.user_last_name ?? ""}`.trim()
            : "Sistema";

          return (
            <div key={log.id} className="border-b pb-2 last:border-b-0">
              <div className="flex justify-between items-start gap-2">
                <span className="font-semibold text-sm">
                  {logTypeLabel(log.type)}
                </span>
                <span className="text-xs text-gray-400 shrink-0">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </div>
              {detail && (
                <p className="text-sm text-gray-600 mt-0.5">{detail}</p>
              )}
              <p className="text-xs text-gray-400 mt-0.5">{userName}</p>
            </div>
          );
        })}
      </CardBody>
    </Card>
  );
}
