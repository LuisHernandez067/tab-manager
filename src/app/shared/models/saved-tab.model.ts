import type { TabCategory } from './capture.types';

export interface SavedTab {
  readonly id: string;
  readonly sessionId?: string;
  readonly standaloneGroupId?: string;
  readonly createdAt: Date;
  url: string;
  title: string;
  favIconUrl?: string;
  domain: string;
  normalizedUrl: string;
  category: TabCategory;
  position: number;
  pinned: boolean;
  active: boolean;
  isRestored: boolean;
  capturedAt: Date;
}
