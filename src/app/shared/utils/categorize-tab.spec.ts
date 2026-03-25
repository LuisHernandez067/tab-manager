import { categorizeTab } from './categorize-tab';

describe('categorizeTab', () => {
  it('should classify docs hosts deterministically', () => {
    expect(categorizeTab('https://developer.mozilla.org/en-US/docs/Web/API')).toBe('docs');
    expect(categorizeTab('https://angular.dev/guide/signals')).toBe('docs');
  });

  it('should classify developer hosts deterministically', () => {
    expect(categorizeTab('https://github.com/angular/angular')).toBe('dev');
    expect(categorizeTab('https://stackoverflow.com/questions/1')).toBe('dev');
  });

  it('should classify social hosts deterministically', () => {
    expect(categorizeTab('https://x.com/someone/status/1')).toBe('social');
    expect(categorizeTab('https://www.linkedin.com/feed/')).toBe('social');
  });

  it('should fall back to other for unknown or invalid urls', () => {
    expect(categorizeTab('https://example.com')).toBe('other');
    expect(categorizeTab('not-a-url')).toBe('other');
  });
});
