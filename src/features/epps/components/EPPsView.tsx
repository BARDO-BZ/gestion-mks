// src/components/epp/EppsView.tsx
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
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

type SortBy = "default" | "institution" | "branch" | "service" | "next_inspection" | "open_tasks";

const SORT_OPTIONS: { key: SortBy; label: string }[] = [
  { key: "default",          label: "Predeterminado" },
  { key: "institution",      label: "Por institución" },
  { key: "branch",           label: "Por sucursal" },
  { key: "service",          label: "Por servicio" },
  { key: "next_inspection",  label: "Próximas inspecciones" },
  { key: "open_tasks",       label: "Tareas pendientes" },
];

const PAGE_SIZE = 20;

export function EppsView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Inicializar estado desde URL params para persistencia
  const [data, setData] = useState<Epp[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [sortBy, setSortBy] = useState<SortBy>(() => (searchParams.get("sort") as SortBy) ?? "default");
  const [page, setPage] = useState(() => parseInt(searchParams.get("page") ?? "1", 10));
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

  // Sincronizar estado con URL params
  const updateUrlParams = useCallback((newSearch: string, newSort: SortBy, newPage: number) => {
    const params = new URLSearchParams();
    if (newSearch) params.set("search", newSearch);
    if (newSort !== "default") params.set("sort", newSort);
    if (newPage > 1) params.set("page", String(newPage));
    const query = params.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
  }, [router, pathname]);

  const fetchData = async (currentPage = page, currentSearch = debouncedSearch, currentSort = sortBy) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (currentSearch) params.set("search", currentSearch);
      params.set("sortBy", currentSort);
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
    updateUrlParams(debouncedSearch, sortBy, 1);
    fetchData(1, debouncedSearch, sortBy);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, sortBy]);

  // Fetch when user explicitly changes page
  useEffect(() => {
    if (skipPageEffect.current) {
      skipPageEffect.current = false;
      return;
    }
    updateUrlParams(debouncedSearch, sortBy, page);
    fetchData(page, debouncedSearch, sortBy);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <div className="p-6 flex flex-col gap-4">
      <div className="flex justify-between items-center gap-3 flex-wrap">
        <h1 className="text-2xl font-semibold">Gestión de EPP</h1>

        <div className="flex gap-2 items-center">
          <Input
            size="md"
            className="w-72"
            placeholder={
              isAdmin
                ? "Buscar por código, institución, tipo, servicio..."
                : "Buscar por código, tipo, servicio..."
            }
            value={search}
            onValueChange={setSearch}
          />
          <Button onPress={() => fetchData(page, search, sortBy)} isDisabled={loading} className="shrink-0">
            {loading ? "Cargando..." : "Buscar"}
          </Button>
          <Button variant="flat" onPress={onImportOpen} className="shrink-0">
            Importar Excel
          </Button>
          <Button color="primary" onPress={onOpen} className="shrink-0">
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
                <EppForm onCreated={() => fetchData(page, debouncedSearch, sortBy)} onClose={close} />
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
                Importar EPPs desde Excel
              </ModalHeader>
              <ModalBody>
                <EppImportModal
                  onImported={() => fetchData(page, debouncedSearch, sortBy)}
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
