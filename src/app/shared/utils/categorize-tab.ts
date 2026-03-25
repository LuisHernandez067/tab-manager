import type { TabCategory } from '@app/shared/models';

import { extractDomain } from './url.utils';

const SOCIAL_HOSTS = new Set([
  'facebook.com',
  'www.facebook.com',
  'linkedin.com',
  'www.linkedin.com',
  'twitter.com',
  'www.twitter.com',
  'x.com',
  'www.x.com',
]);

const DEV_HOSTS = new Set([
  'codesandbox.io',
  'github.com',
  'gitlab.com',
  'stackblitz.com',
  'stackoverflow.com',
]);

const DOCS_HOSTS = new Set([
  'angular.dev',
  'developer.chrome.com',
  'developer.mozilla.org',
  'rxjs.dev',
  'typescriptlang.org',
  'www.typescriptlang.org',
]);

export function categorizeTab(url: string): TabCategory {
  const hostname = extractDomain(url).toLowerCase();

  if (SOCIAL_HOSTS.has(hostname)) {
    return 'social';
  }

  if (DEV_HOSTS.has(hostname)) {
    return 'dev';
  }

  if (DOCS_HOSTS.has(hostname)) {
    return 'docs';
  }

  return 'other';
}
