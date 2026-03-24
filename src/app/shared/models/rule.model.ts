export interface Rule {
  readonly id: string;
  readonly createdAt: Date;
  name: string;
  pattern: string;
  action: 'save' | 'ignore' | 'auto-close';
  enabled: boolean;
}
