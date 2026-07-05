import '@testing-library/jest-dom';
import { beforeEach } from 'vitest';
import { clearApiCache } from '../../app/lib/api/cache';

beforeEach(() => {
  clearApiCache();
});
