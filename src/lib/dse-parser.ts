export type ParsedDseBackup = {
  runningHours?: number;
  numberOfStarts?: number;
  alarms?: string[];
  events?: string[];
};

export async function parseDseBackupFile(filePath: string): Promise<ParsedDseBackup> {
  void filePath;
  // Future implementation: download the uploaded DSE backup file from Supabase
  // Storage, parse the controller-specific format, and populate alarms/events.
  return {};
}
