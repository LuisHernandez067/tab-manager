export interface SavedTab {
  readonly id: string;
  readonly sessionId: string;
  readonly createdAt: Date;
  url: string;
  title: string;
  favIconUrl?: string;
  domain: string;
  normalizedUrl: string;
  position: number;
  pinned: boolean;
  active: boolean;
  isRestored: boolean;
  capturedAt: Date;
}
