export type DbBranch = {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
};

export type DbStationStatus =
  | "AVAILABLE"
  | "IN_USE"
  | "RESERVED"
  | "EXPIRED"
  | "MAINTENANCE"
  | "OUT_OF_SERVICE";

export type DbStation = {
  id: string;
  branch_id: string;
  code: string;
  label: string;
  console_type: "PS3" | "PS4" | "PS5";
  status: DbStationStatus;
  sort_order: number;
};
