export type EppStatus = "APPROVED" | "RESERVED" | "TO_DISCARD" | "DISCARDED";
export type InspectionFrequency = "ANNUAL" | "SEMESTRAL";

export interface IEpp {
  id: number;
  code: string;
  institution_name?: string;
  institution_id: number;

  branch: string;
  service: string;

  fabrication_month: number;
  fabrication_year: number;
  caducidad_month: number;
  caducidad_year: number;

  caducidad_years: number;
  inspection_freq: InspectionFrequency;
  status: EppStatus;

  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface ICreateEppBody {
  code: string;
  institution: string;
  institution_id: number;

  branch: string;
  service: string;

  fabrication_month: number; // 1-12
  fabrication_year: number; // ej 2025
  caducidad_years?: number; // si no viene, usás default de cuenta o 5
  inspection_freq?: InspectionFrequency;
}
