"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, Spinner } from "@heroui/react";

interface EppInspectionsListProps {
  eppId: string;
  refreshKey: number;
}

interface Inspection {
  id: number;
  blindaje_status: "OK" | "DEFECTUOSO";
  blindaje_comment: string | null;
  externa_status: "OK" | "DEFECTUOSO";
  externa_comment: string | null;
  performed_at: string;
  user_name?: string;
  user_last_name?: string;
}

export function EppInspectionsList({
  eppId,
  refreshKey,
}: EppInspectionsListProps) {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInspections = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/epps/${eppId}/inspections`, {
        credentials: "include",
      });
      const json = await res.json();
      setInspections(json.data || []);
    } catch {
      setInspections([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInspections();
  }, [eppId, refreshKey]);

  if (loading) return <Spinner size="sm" />;

  if (inspections.length === 0)
    return (
      <p className="text-sm text-default-400">
        Todavía no hay inspecciones registradas.
      </p>
    );

  return (
    <div className="flex flex-col gap-3 max-h-[390px]">
      {inspections.map((ins) => (
        <Card key={ins.id}>
          <CardBody className="flex flex-col gap-1 text-sm">
            <div className="flex justify-between">
              <span className="font-semibold">
                {ins.user_name
                  ? `${ins.user_name} ${ins.user_last_name ?? ""}`
                  : "Sin usuario"}
              </span>
              <span className="text-xs text-default-400">
                {new Date(ins.performed_at).toLocaleString()}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <span className="font-semibold">Integridad blindaje: </span>
                <span>
                  {ins.blindaje_status === "OK" ? "OK" : "Defectuoso"}
                </span>
                {ins.blindaje_comment && (
                  <p className="text-xs text-default-500 mt-1">
                    {ins.blindaje_comment}
                  </p>
                )}
              </div>
              <div>
                <span className="font-semibold">Integridad externa: </span>
                <span>{ins.externa_status === "OK" ? "OK" : "Defectuoso"}</span>
                {ins.externa_comment && (
                  <p className="text-xs text-default-500 mt-1">
                    {ins.externa_comment}
                  </p>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
