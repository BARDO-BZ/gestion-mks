import React from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  getKeyValue,
} from "@heroui/react";
import { columns, rows } from "../config";

export const EPPsTable = () => {
  return (
    <div>
      <Table
        isStriped
        aria-label="Tabla de EPPs"
        layout="fixed"
        classNames={{
          wrapper: "overflow-x-auto scrollbar-hide",
          base: "overscroll-x-contain",
        }}
      >
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn
              key={column.key}
              className={
                column.key === "id"
                  ? "w-[100px]"
                  : column.key === "inspector"
                  ? "w-[150px]"
                  : column.key === "institution"
                  ? "w-[150px]"
                  : column.key === "branch"
                  ? "w-[150px]"
                  : column.key === "service"
                  ? "w-[150px]"
                  : column.key === "department"
                  ? "w-[150px]"
                  : column.key === "assigned_to"
                  ? "w-[200px]"
                  : column.key === "manufacturer"
                  ? "w-[200px]"
                  : column.key === "garment_type"
                  ? "w-[200px]"
                  : column.key === "core_material"
                  ? "w-[200px]"
                  : column.key === "size"
                  ? "w-[100px]"
                  : column.key === "protection_level"
                  ? "w-[150px]"
                  : column.key === "color_trim"
                  ? "w-[100px]"
                  : column.key === "manufactured"
                  ? "w-[150px]"
                  : column.key === "notes"
                  ? "w-[200px]"
                  : column.key === "last_inspection"
                  ? "w-[150px]"
                  : column.key === "inspection_result"
                  ? "w-[200px]"
                  : column.key === "next_inspection"
                  ? "w-[150px]"
                  : column.key === "status"
                  ? "w-[100px]"
                  : ""
              }
            >
              {column.label}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody items={rows}>
          {(item) => (
            <TableRow key={item.key}>
              {(columnKey) => (
                <TableCell>{getKeyValue(item, columnKey)}</TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
