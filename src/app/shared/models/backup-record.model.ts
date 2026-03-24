export interface BackupRecord {
  readonly id: string;
  readonly createdAt: Date;
  filename: string;
  sizeBytes: number;
  sessionCount: number;
  status: 'pending' | 'complete' | 'failed';
}
