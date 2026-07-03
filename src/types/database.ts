import type { AppRole, ApprovalStatus, AssetStatus, GeneratorDuty } from "@/types/app";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: AppRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: AppRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
      };
      sites: {
        Row: {
          id: string;
          name: string;
          code: string | null;
          address: string | null;
          region: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["sites"]["Row"]> & { name: string };
        Update: Partial<Database["public"]["Tables"]["sites"]["Insert"]>;
      };
      generators: {
        Row: {
          id: string;
          site_id: string | null;
          generator_id: string;
          manufacturer: string;
          model: string | null;
          serial_number: string | null;
          year: number | null;
          rated_power_kw: number | null;
          rated_power_kva: number | null;
          rated_voltage: number | null;
          rated_current: number | null;
          frequency: number | null;
          rpm: number | null;
          power_factor: number | null;
          phase: string | null;
          duty: GeneratorDuty;
          engine_model: string | null;
          engine_serial_number: string | null;
          alternator_model: string | null;
          alternator_serial_number: string | null;
          dse_model: string | null;
          fuel_tank_capacity: number | null;
          operation_time: number | null;
          health_score: number;
          status: AssetStatus;
          next_maintenance_due: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["generators"]["Row"]> & {
          generator_id: string;
          manufacturer: string;
        };
        Update: Partial<Database["public"]["Tables"]["generators"]["Insert"]>;
      };
      generator_photos: {
        Row: {
          id: string;
          generator_id: string;
          photo_type: string;
          file_path: string;
          caption: string | null;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["generator_photos"]["Row"]> & {
          generator_id: string;
          photo_type: string;
          file_path: string;
        };
        Update: Partial<Database["public"]["Tables"]["generator_photos"]["Insert"]>;
      };
      generator_files: {
        Row: {
          id: string;
          generator_id: string;
          file_type: string;
          file_path: string;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["generator_files"]["Row"]> & {
          generator_id: string;
          file_type: string;
          file_path: string;
        };
        Update: Partial<Database["public"]["Tables"]["generator_files"]["Insert"]>;
      };
      weekly_inspections: {
        Row: {
          id: string;
          generator_id: string;
          site_id: string | null;
          inspection_date: string;
          checklist: Json;
          overall_status: AssetStatus;
          notes: string | null;
          approval_status: ApprovalStatus;
          submitted_by: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["weekly_inspections"]["Row"]> & {
          generator_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["weekly_inspections"]["Insert"]>;
      };
      dse_readings: {
        Row: {
          id: string;
          generator_id: string;
          reading_date: string;
          manual_start: boolean | null;
          manual_stop: boolean | null;
          return_to_auto: boolean | null;
          running_hours: number | null;
          number_of_starts: number | null;
          battery_voltage: number | null;
          coolant_temperature: number | null;
          engine_speed_rpm: number | null;
          alarm_screen: string | null;
          event_log: string | null;
          backup_file_path: string | null;
          approval_status: ApprovalStatus;
          submitted_by: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["dse_readings"]["Row"]> & {
          generator_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["dse_readings"]["Insert"]>;
      };
      ats_tests: GenericRecordTable;
      ats_manual_operations: GenericRecordTable;
      maintenance_records: GenericRecordTable;
      load_tests: GenericRecordTable;
      vibration_tests: GenericRecordTable;
      alarms: GenericRecordTable;
      event_logs: GenericRecordTable;
      approvals: GenericRecordTable;
      reports: GenericRecordTable;
    };
    Views: Record<string, never>;
    Functions: {
      current_user_role: {
        Args: Record<string, never>;
        Returns: AppRole | null;
      };
      calculate_next_maintenance_due: {
        Args: {
          maintenance_type: string;
          maintenance_date: string;
        };
        Returns: string;
      };
    };
    Enums: {
      app_role: AppRole;
      approval_status: ApprovalStatus;
      generator_duty: GeneratorDuty;
      asset_status: AssetStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};

export type GenericRow = {
  id: string;
  [key: string]: Json | string | number | boolean | null | undefined;
};

type GenericRecordTable = {
  Row: GenericRow;
  Insert: Record<string, Json | string | number | boolean | null | undefined>;
  Update: Record<string, Json | string | number | boolean | null | undefined>;
};
