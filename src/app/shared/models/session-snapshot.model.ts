export interface SessionSnapshot {
  readonly id: string;
  readonly createdAt: Date;
  updatedAt: Date;
  name: string;
  status: 'active' | 'archived' | 'deleted';
  collectionId?: string;
  tabCount: number;
  sourceWindowIds: number[];
  autoTags: string[];
  manualTags: string[];
}
