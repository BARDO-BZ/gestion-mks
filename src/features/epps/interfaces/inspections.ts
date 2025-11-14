export interface IInspection {
  id: number;
  epp_id: number;
  inspector_id: number;
  blindaje: "OK" | "DEFECT";
  integridad_externa: "OK" | "DEFECT";
  comments: string;
  image_url: string;
  created_at: string;
}
