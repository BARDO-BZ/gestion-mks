// src/components/epp/EppsView.tsx
"use client";

import { useEffect, useState } from "react";
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

export function EppsView() {
  const [data, setData] = useState<Epp[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const { isOpen, onOpen, onClose } = useDisclosure();

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);

      const query = params.toString();
      const url = `/api/epps/list${query ? `?${query}` : ""}`;

      const res = await fetch(url, {
        method: "GET",
        credentials: "include",
      });

      const json = await res.json();
      setData(json.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-6 flex flex-col gap-4">
      <div className="flex justify-between items-center gap-3 flex-wrap">
        <h1 className="text-2xl font-semibold">Gestión de EPP</h1>

        <div className="flex gap-2 items-center w-[500px]">
          <Input
            size="md"
            placeholder="Buscar por código, institución..."
            value={search}
            onValueChange={setSearch}
          />
          <Button onPress={fetchData} isDisabled={loading}>
            {loading ? "Cargando..." : "Buscar"}
          </Button>
          <Button className="w-[100px]" color="primary" onPress={onOpen}>
            Nuevo EPP
          </Button>
        </div>
      </div>

      <EppsTable data={data} />

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
    </div>
  );
}
