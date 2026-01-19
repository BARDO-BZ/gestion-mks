"use client";

import { useMemo, useState } from "react";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Select,
  SelectItem,
} from "@heroui/react";
import type { AdminUserRow, InstitutionOption } from "./AdminUsersView";

export function ApproveUserModal(props: {
  isOpen: boolean;
  onClose: () => void;
  user: AdminUserRow | null;
  institutions: InstitutionOption[];
  onApprove: (userId: number, institutionId: number) => Promise<void>;
}) {
  const { isOpen, onClose, user, institutions, onApprove } = props;

  const [selectedInstitution, setSelectedInstitution] = useState<string>("");

  const needsInstitution = useMemo(() => user?.role === "client", [user?.role]);

  const canApprove = useMemo(() => {
    if (!user) return false;
    if (!needsInstitution) return true;
    return !!selectedInstitution;
  }, [user, needsInstitution, selectedInstitution]);

  const handleApprove = async () => {
    if (!user) return;

    const instId = Number(selectedInstitution || user.institution_id);
    if (needsInstitution && !instId) return;

    await onApprove(user.id, instId);
    onClose();
    setSelectedInstitution("");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalContent>
        {(close) => (
          <>
            <ModalHeader>Aprobar usuario</ModalHeader>
            <ModalBody className="flex flex-col gap-4 pb-6">
              {!user ? (
                <div className="text-sm text-default-500">
                  Sin usuario seleccionado.
                </div>
              ) : (
                <>
                  <div className="text-sm">
                    <div>
                      <b>Email:</b> {user.email}
                    </div>
                    <div>
                      <b>Nombre:</b>{" "}
                      {(user.name || "") + " " + (user.last_name || "")}
                    </div>
                    <div>
                      <b>Rol:</b> {user.role}
                    </div>
                  </div>

                  {needsInstitution && (
                    <Select
                      label="Asignar institución"
                      placeholder="Seleccioná una institución"
                      selectedKeys={
                        selectedInstitution ? [selectedInstitution] : []
                      }
                      onSelectionChange={(keys) => {
                        const key = String(Array.from(keys)[0] ?? "");
                        setSelectedInstitution(key);
                      }}
                    >
                      {institutions.map((i) => (
                        <SelectItem key={String(i.id)}>{i.name}</SelectItem>
                      ))}
                    </Select>
                  )}

                  <div className="flex gap-2 justify-end">
                    <Button variant="light" onPress={close}>
                      Cancelar
                    </Button>
                    <Button
                      color="primary"
                      isDisabled={!canApprove}
                      onPress={handleApprove}
                    >
                      Aprobar
                    </Button>
                  </div>
                </>
              )}
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
