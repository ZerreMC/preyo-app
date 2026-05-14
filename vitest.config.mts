import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'url';
import path from 'path';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const alias = { '@': path.resolve(__dirname, 'src') };

export default defineConfig({
    resolve: { alias },
    test: {
        projects: [
            {
                // Pure domain/command unit tests — no browser APIs needed
                test: {
                    name: 'unit',
                    environment: 'node',
                    include: [
                        'src/**/domain/**/*.test.ts',
                        'src/**/model/commands/**/*.test.ts',
                    ],
                    setupFiles: ['./tests/setup.ts'],
                },
                resolve: { alias },
            },
            {
                // React hook + UI tests — require jsdom
                // NOTE: html-encoding-sniffer@6 (jsdom dep) requires @exodus/bytes (ESM-only)
                // via CJS require(). Workers crash with ERR_REQUIRE_ESM until the dep tree is
                // updated (jsdom ≥ 25 requires Node ≥ 20, or html-encoding-sniffer is patched).
                test: {
                    name: 'unit-ui',
                    environment: 'jsdom',
                    include: [
                        'src/**/model/hooks/**/*.test.ts',
                        'tests/ui/**/*.test.ts',
                    ],
                    setupFiles: ['./tests/setup.ts'],
                },
                resolve: { alias },
            },
            {
                // Supabase integration tests — must run in Node (no browser globals)
                test: {
                    name: 'integration',
                    environment: 'node',
                    include: ['tests/integration/**/*.test.ts'],
                    setupFiles: ['./tests/setup.ts'],
                },
                resolve: { alias },
            },
        ],
    },
});
