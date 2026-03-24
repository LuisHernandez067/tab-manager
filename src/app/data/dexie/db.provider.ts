import { InjectionToken } from '@angular/core';

import { TabManagerDB } from './tab-manager-db';

export const TAB_MANAGER_DB = new InjectionToken<TabManagerDB>('TAB_MANAGER_DB');

export const dbProvider = {
  provide: TAB_MANAGER_DB,
  useFactory: (): TabManagerDB => new TabManagerDB(),
};
