"use client";

import { useState } from "react";
import { Button, Select, SelectItem, Textarea, Checkbox } from "@heroui/react";

type StatusFlag = "OK" | "DEFECTUOSO";

interface EppInspectionFormProps {
  eppId: string;
  onCreated: () => void;
  onClose: () => void;
}

export function EppInspectionForm({
  eppId,
  onCreated,
  onClose,
}: EppInspectionFormProps) {
  const [blindajeStatus, setBlindajeStatus] = useState<StatusFlag>("OK");
  const [blindajeComment, setBlindajeComment] = useState("");

  const [externaStatus, setExternaStatus] = useState<StatusFlag>("OK");
  const [externaComment, setExternaComment] = useState("");

  const [createTask, setCreateTask] = useState(false);
  const [taskDescription, setTaskDescription] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (
      createTask &&
      externaStatus === "DEFECTUOSO" &&
      !taskDescription.trim()
    ) {
      setError("Ingresá una descripción para la tarea.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/epps/${eppId}/inspections`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blindaje_status: blindajeStatus,
          blindaje_comment: blindajeComment || undefined,
          externa_status: externaStatus,
          externa_comment: externaComment || undefined,
          create_task: createTask && externaStatus === "DEFECTUOSO",
          task_description:
            createTask && externaStatus === "DEFECTUOSO"
              ? taskDescription
              : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Error al registrar la inspección");
      }

      onCreated();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Error inesperado");
    } finally {
      setSaving(false);
    }
  };

  const disableTask = externaStatus !== "DEFECTUOSO";

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-3">
          <Select
            label="Integridad blindaje"
            selectedKeys={new Set([blindajeStatus])}
            onSelectionChange={(keys) =>
              setBlindajeStatus(Array.from(keys)[0] as StatusFlag)
            }
          >
            <SelectItem key="OK">OK</SelectItem>
            <SelectItem key="DEFECTUOSO">Defectuoso</SelectItem>
          </Select>

          <Textarea
            label="Comentarios blindaje"
            minRows={2}
            value={blindajeComment}
            onValueChange={setBlindajeComment}
          />
        </div>

        <div className="flex flex-col gap-3">
          <Select
            label="Integridad externa"
            selectedKeys={new Set([externaStatus])}
            onSelectionChange={(keys) =>
              setExternaStatus(Array.from(keys)[0] as StatusFlag)
            }
          >
            <SelectItem key="OK">OK</SelectItem>
            <SelectItem key="DEFECTUOSO">Defectuoso</SelectItem>
          </Select>

          <Textarea
            label="Comentarios externos"
            minRows={2}
            value={externaComment}
            onValueChange={setExternaComment}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Checkbox
          isSelected={createTask && !disableTask}
          isDisabled={disableTask}
          onValueChange={(val) => setCreateTask(val)}
        >
          Crear tarea de seguimiento
          {disableTask &&
            " (solo disponible si la integridad externa es defectuosa)"}
        </Checkbox>

        {createTask && !disableTask && (
          <Textarea
            label="Descripción de la tarea"
            minRows={2}
            value={taskDescription}
            onValueChange={setTaskDescription}
          />
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button variant="light" onPress={onClose}>
          Cancelar
        </Button>
        <Button color="primary" type="submit" isDisabled={saving}>
          {saving ? "Guardando..." : "Guardar inspección"}
        </Button>
      </div>
    </form>
  );
}
