"use client";

import { useEffect, useState } from "react";
import { Button, Input } from "@heroui/react";
import { Epp, EppsTable } from "./EPPsTable";

export function EppsView() {
  const [data, setData] = useState<Epp[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);

      const res = await fetch(`/api/epps?${params.toString()}`, {
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

        <div className="flex gap-2">
          <Input
            size="sm"
            placeholder="Buscar por código, institución..."
            value={search}
            onValueChange={setSearch}
          />
          <Button onPress={fetchData} isDisabled={loading}>
            {loading ? "Cargando..." : "Buscar"}
          </Button>
        </div>
      </div>

      <EppsTable data={data} />
    </div>
  );
}
