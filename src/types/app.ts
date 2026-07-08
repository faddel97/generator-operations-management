export type AppRole = "admin" | "supervisor" | "technician" | "viewer";

export type ApprovalStatus = "draft" | "submitted" | "approved" | "rejected";

export type AssetStatus = "healthy" | "attention" | "critical" | "offline";

export type GeneratorDuty = "prime" | "standby";

export type ModuleKey =
  | "generators"
  | "weekly-inspections"
  | "dse-readings"
  | "ats-tests"
  | "ats-manual-operations"
  | "maintenance-records"
  | "load-tests"
  | "vibration-tests"
  | "alarms"
  | "event-logs"
  | "reports";

export type SelectOption = {
  label: string;
  value: string;
};

export type FieldType =
  | "text"
  | "number"
  | "date"
  | "select"
  | "textarea"
  | "checkbox"
  | "generator"
  | "checklist"
  | "procedure"
  | "file";

export type ChecklistItem = {
  key: string;
  label: string;
  section?: string;
  control?: "select" | "text";
  options?: SelectOption[];
  defaultValue?: string;
};

export type FieldDefinition = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  section?: string;
  placeholder?: string;
  helper?: string;
  options?: SelectOption[];
  checklistItems?: ChecklistItem[];
  accept?: string;
  multiple?: boolean;
  step?: string;
  min?: number;
  max?: number;
  storageBucket?: "generator-photos" | "generator-files" | "operation-attachments";
  storageTable?: "generator_photos" | "generator_files";
  storageType?: string;
  targetColumn?: string;
};

export type UploadedAttachment = {
  id?: string;
  fieldName: string;
  label: string;
  bucket: NonNullable<FieldDefinition["storageBucket"]>;
  path: string;
  fileName: string;
  url?: string;
  createdAt?: string;
};

export type AttachmentMap = Record<string, UploadedAttachment[]>;

export type TableColumn = {
  key: string;
  label: string;
  type?: "text" | "date" | "status" | "approval" | "number" | "boolean";
};

export type ModuleDefinition = {
  key: ModuleKey;
  table: string;
  title: string;
  singularTitle: string;
  path: string;
  description: string;
  addLabel: string;
  emptyState: string;
  fields: FieldDefinition[];
  columns: TableColumn[];
  dateField?: string;
  reviewable?: boolean;
  detailEnabled?: boolean;
  createRoles: AppRole[];
  updateRoles: AppRole[];
  deleteRoles: AppRole[];
};

export type GeneratorOption = {
  id: string;
  label: string;
};

export type SessionContext = {
  isSupabaseConfigured: boolean;
  isDemoMode: boolean;
  userId: string | null;
  email: string | null;
  fullName: string | null;
  role: AppRole;
};
