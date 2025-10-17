export interface IEPP {
  id: number;
  code: string;
  name: string;
  institution_id: number;
  branch_id: number;
  service_id: number;
  mfg_month: number;
  mfg_year: number;
  exp_month: number;
  exp_year: number;
  insp_freq: "ANNUAL" | "SEMIANNUAL";
  status: "APPROVED" | "RESERVED" | "TO_DISCARD" | "DISCARDED";
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface IEPPAudit {
  id: number;
  epp_id: number;
  user_id: number;
  field: string;
  old_value: string;
  new_value: string;
  created_at: string;
}
