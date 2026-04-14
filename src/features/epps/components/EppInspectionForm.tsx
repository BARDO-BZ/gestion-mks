"use client";

import { useRef, useState } from "react";
import { Button, Select, SelectItem, Textarea, Checkbox } from "@heroui/react";

type StatusFlag = "OK" | "DEFECTUOSO";

interface EppInspectionFormProps {
  eppId: string;
  onCreated: () => void;
  onClose: () => void;
}

interface PhotoPreview {
  file: File;
  objectUrl: string;
  uploading: boolean;
  url: string | null;
  error: string | null;
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

  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const newPreviews: PhotoPreview[] = files.map((file) => ({
      file,
      objectUrl: URL.createObjectURL(file),
      uploading: true,
      url: null,
      error: null,
    }));

    setPhotos((prev) => [...prev, ...newPreviews]);

    // Upload each file immediately
    for (const preview of newPreviews) {
      const formData = new FormData();
      formData.append("file", preview.file);

      try {
        const res = await fetch("/api/upload/inspection-photo", {
          method: "POST",
          credentials: "include",
          body: formData,
        });
        const json = await res.json();
        const uploadedUrl = res.ok ? (json.url as string) : null;
        const uploadError = res.ok ? null : (json.message ?? "Error al subir");

        setPhotos((prev) =>
          prev.map((p) =>
            p.objectUrl === preview.objectUrl
              ? { ...p, uploading: false, url: uploadedUrl, error: uploadError }
              : p,
          ),
        );
      } catch {
        setPhotos((prev) =>
          prev.map((p) =>
            p.objectUrl === preview.objectUrl
              ? { ...p, uploading: false, error: "Error de conexión" }
              : p,
          ),
        );
      }
    }

    // Reset input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = (objectUrl: string) => {
    setPhotos((prev) => {
      const photo = prev.find((p) => p.objectUrl === objectUrl);
      if (photo) URL.revokeObjectURL(photo.objectUrl);
      return prev.filter((p) => p.objectUrl !== objectUrl);
    });
  };

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

    if (photos.some((p) => p.uploading)) {
      setError("Esperá a que terminen de subirse las fotos.");
      return;
    }

    const photoUrls = photos.filter((p) => p.url).map((p) => p.url as string);

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
          photos: photoUrls.length > 0 ? photoUrls : undefined,
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
            label="Comentarios exterior"
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

      {/* Fotos */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Fotos</p>
        <p className="text-xs text-gray-400">
          JPG, PNG, WEBP o HEIC · máx 10MB por foto
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/heic"
          multiple
          capture="environment"
          onChange={handleFileChange}
          className="text-sm"
        />
        {photos.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-1">
            {photos.map((p) => (
              <div key={p.objectUrl} className="relative w-20 h-20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.objectUrl}
                  alt="preview"
                  className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                />
                {p.uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-lg">
                    <span className="text-xs text-gray-500">↑</span>
                  </div>
                )}
                {p.error && (
                  <div className="absolute inset-0 flex items-center justify-center bg-red-50/80 rounded-lg">
                    <span className="text-xs text-red-500">Error</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removePhoto(p.objectUrl)}
                  className="absolute -top-1 -right-1 bg-white border border-gray-200 rounded-full w-5 h-5 flex items-center justify-center text-xs text-gray-500 hover:text-red-500"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
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
