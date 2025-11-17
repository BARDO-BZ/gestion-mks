"use client";

import { useEffect, useState } from "react";
import { Button, Card, CardBody, Chip, Spinner } from "@heroui/react";

interface EppTasksListProps {
  eppId: string;
  refreshKey: number;
  onTaskUpdated: () => void;
}

interface Task {
  id: number;
  description: string;
  status: "OPEN" | "CLOSED";
  created_at: string;
  closed_at: string | null;
  user_name?: string;
  user_last_name?: string;
}

export function EppTasksList({
  eppId,
  refreshKey,
  onTaskUpdated,
}: EppTasksListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [closingId, setClosingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/epps/${eppId}/tasks`, {
        credentials: "include",
      });
      const json = await res.json();
      setTasks(json.data || []);
    } catch (err: any) {
      console.error(err);
      setTasks([]);
      setError("Error al cargar tareas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eppId, refreshKey]);

  const handleCloseTask = async (taskId: number) => {
    setClosingId(taskId);
    setError(null);
    try {
      const res = await fetch(`/api/epps/${eppId}/tasks/${taskId}`, {
        method: "PATCH",
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Error al cerrar la tarea");
      }

      await loadTasks();
      onTaskUpdated();
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Error inesperado");
    } finally {
      setClosingId(null);
    }
  };

  if (loading) return <Spinner size="sm" />;

  if (tasks.length === 0)
    return (
      <p className="text-sm text-default-400">No hay tareas registradas.</p>
    );

  return (
    <div className="flex flex-col gap-3 max-h-[390px]">
      {error && <p className="text-sm text-red-500">{error}</p>}

      {tasks.map((task) => {
        const isOpen = task.status === "OPEN";
        return (
          <Card key={task.id}>
            <CardBody className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Chip
                    color={isOpen ? "warning" : "success"}
                    size="sm"
                    variant="flat"
                  >
                    {isOpen ? "Abierta" : "Cerrada"}
                  </Chip>
                  <span className="font-semibold">
                    {task.user_name
                      ? `${task.user_name} ${task.user_last_name ?? ""}`
                      : "Sistema"}
                  </span>
                </div>
                <span className="text-xs text-default-400">
                  {new Date(task.created_at).toLocaleString()}
                </span>
              </div>

              <p>{task.description}</p>

              {!isOpen && task.closed_at && (
                <p className="text-xs text-default-400">
                  Cerrada: {new Date(task.closed_at).toLocaleString()}
                </p>
              )}

              {isOpen && (
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    color="primary"
                    variant="flat"
                    onPress={() => handleCloseTask(task.id)}
                    isDisabled={closingId === task.id}
                  >
                    {closingId === task.id ? "Cerrando..." : "Cerrar tarea"}
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}
