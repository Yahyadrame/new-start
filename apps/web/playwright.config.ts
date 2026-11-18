import { defineConfig } from '@playwright/test';
import { buildConfig } from './e2e/config';

export default defineConfig(buildConfig());
