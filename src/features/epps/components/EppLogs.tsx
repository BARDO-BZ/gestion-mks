"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, Spinner } from "@heroui/react";

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
      <CardBody className="flex flex-col gap-3 max-h-[400px]">
        {logs.map((log) => (
          <div key={log.id} className="border-b pb-2">
            <p className="font-semibold">{log.type}</p>
            <p className="text-sm text-gray-500">
              {log.user_name ? `${log.user_name} ${log.last_name}` : "Sistema"}
            </p>
            <p className="text-xs text-gray-400">
              {new Date(log.created_at).toLocaleString()}
            </p>
            {log.details && (
              <pre className="bg-gray-100 p-2 text-xs mt-2 rounded">
                {JSON.stringify(log.details, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
