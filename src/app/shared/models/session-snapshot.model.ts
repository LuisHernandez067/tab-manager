import type { CaptureMode, CaptureScope } from './capture.types';

export interface SessionSnapshot {
  readonly id: string;
  readonly createdAt: Date;
  updatedAt: Date;
  name: string;
  status: 'active' | 'archived' | 'deleted';
  collectionId?: string;
  readonly captureMode: CaptureMode;
  readonly scope: CaptureScope;
  tabCount: number;
  sourceWindowIds: number[];
  autoTags: string[];
  manualTags: string[];
}
