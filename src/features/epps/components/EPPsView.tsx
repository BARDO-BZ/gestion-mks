// src/components/epp/EppsView.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalFooter,
  useDisclosure,
} from "@heroui/react";
import { Epp, EppsTable } from "./EPPsTable";
import { EppForm } from "./EppForm";
import { EppImportModal } from "./EppImportModal";
import { useAuth } from "@/contexts/AuthContext";

type SortBy = "default" | "institution" | "service" | "next_inspection" | "open_tasks";

const SORT_OPTIONS: { key: SortBy; label: string }[] = [
  { key: "default",          label: "Predeterminado" },
  { key: "institution",      label: "Por institución" },
  { key: "service",          label: "Por servicio" },
  { key: "next_inspection",  label: "Próximas inspecciones" },
  { key: "open_tasks",       label: "Tareas pendientes" },
];

const PAGE_SIZE = 20;

export function EppsView() {
  const [data, setData] = useState<Epp[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("default");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isImportOpen,
    onOpen: onImportOpen,
    onClose: onImportClose,
  } = useDisclosure();
  const debouncedSearch = useDebounce(search, 500);

  const fetchData = async (currentPage = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("sortBy", sortBy);
      params.set("page", String(currentPage));
      params.set("pageSize", String(PAGE_SIZE));

      const res = await fetch(`/api/epps/list?${params.toString()}`, {
        method: "GET",
        credentials: "include",
      });

      const json = await res.json();
      setData(json.data || []);
      setTotal(json.pagination?.total ?? 0);
      setTotalPages(json.pagination?.totalPages ?? 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const skipPageEffect = useRef(false);

  // Reset to page 1 when search or sort changes, fetch directly
  useEffect(() => {
    skipPageEffect.current = true;
    setPage(1);
    fetchData(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, sortBy]);

  // Fetch when user explicitly changes page
  useEffect(() => {
    if (skipPageEffect.current) {
      skipPageEffect.current = false;
      return;
    }
    fetchData(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <div className="p-6 flex flex-col gap-4">
      <div className="flex justify-between items-center gap-3 flex-wrap">
        <h1 className="text-2xl font-semibold">Gestión de EPP</h1>

        <div className="flex gap-2 items-center w-[500px]">
          <Input
            size="md"
            placeholder={
              isAdmin
                ? "Buscar por código, institución, servicio..."
                : "Buscar por código, servicio..."
            }
            value={search}
            onValueChange={setSearch}
          />
          <Button onPress={fetchData} isDisabled={loading}>
            {loading ? "Cargando..." : "Buscar"}
          </Button>
          <Button variant="flat" onPress={onImportOpen}>
            Importar CSV
          </Button>
          <Button className="w-[100px]" color="primary" onPress={onOpen}>
            Nuevo EPP
          </Button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        <span className="text-xs text-gray-400 uppercase tracking-wide">Ordenar:</span>
        {SORT_OPTIONS.map((opt) => (
          <Button
            key={opt.key}
            size="sm"
            variant={sortBy === opt.key ? "solid" : "flat"}
            color={sortBy === opt.key ? "primary" : "default"}
            onPress={() => setSortBy(opt.key)}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      <EppsTable data={data} isAdmin={isAdmin} />

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-gray-500">
            {total} resultado{total !== 1 ? "s" : ""} — página {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="flat"
              isDisabled={page <= 1 || loading}
              onPress={() => setPage((p) => p - 1)}
            >
              ← Anterior
            </Button>
            <Button
              size="sm"
              variant="flat"
              isDisabled={page >= totalPages || loading}
              onPress={() => setPage((p) => p + 1)}
            >
              Siguiente →
            </Button>
          </div>
        </div>
      )}

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalContent>
          {(close) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Nuevo EPP
              </ModalHeader>
              <ModalBody>
                <EppForm onCreated={fetchData} onClose={close} />
              </ModalBody>
              <ModalFooter />
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal isOpen={isImportOpen} onClose={onImportClose} size="2xl">
        <ModalContent>
          {(close) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Importar EPPs desde CSV
              </ModalHeader>
              <ModalBody>
                <EppImportModal
                  onImported={() => { fetchData(); }}
                  onClose={close}
                />
              </ModalBody>
              <ModalFooter />
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
