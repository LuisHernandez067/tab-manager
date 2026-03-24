export interface Collection {
  readonly id: string;
  readonly createdAt: Date;
  name: string;
  description?: string;
  color?: string;
}
