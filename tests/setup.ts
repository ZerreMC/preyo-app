import {webcrypto} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

if (typeof globalThis.crypto === 'undefined') {
    // @ts-expect-error — Node 18 doesn't expose crypto as a bare global in all vitest pools
    globalThis.crypto = webcrypto;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envLocalPath = path.resolve(__dirname, '../.env.local');
const envPath = path.resolve(__dirname, '../.env');

[envPath, envLocalPath].forEach(envFile => {
    if (fs.existsSync(envFile)) {
        const content = fs.readFileSync(envFile, 'utf-8');
        content.split('\n').forEach((line: string) => {
            const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
            if (match) {
                const key = match[1];
                let value = match[2] || '';
                if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
                if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
                process.env[key] = value;
            }
        });
    }
});
