import * as path from 'path';
import * as fs from 'fs';
import { config } from 'dotenv';

const rootDir = path.resolve(__dirname, '../../..'); // apunta a APP-TM/
const baseEnvFile = path.join(rootDir, '.env');
const mode = process.env.NODE_ENV;
const modeEnvFile = mode ? path.join(rootDir, `.env.${mode}`) : null;

if (fs.existsSync(baseEnvFile)) config({ path: baseEnvFile });
if (modeEnvFile && fs.existsSync(modeEnvFile)) config({ path: modeEnvFile, override: true });

interface Env {
  NODE_ENV: string;
  PORT: number;
  DB_URL: string;
  DB_SYNCHRONIZE: boolean;
  DB_LOGGING: boolean;
}

function bool(v: string | undefined, def = 'false'): boolean {
  return (v ?? def).toLowerCase() === 'true';
}
function num(v: string | undefined, def: string): number {
  return parseInt(v ?? def, 10);
}

// Elimina soporte a parámetros sueltos: exige DB_URL
const dbUrl = process.env.DB_URL;
if (!dbUrl) {
  throw new Error('Falta variable DB_URL en .env (formato: postgres://user:pass@host:port/dbname)');
}

export const env: Env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: num(process.env.PORT, '3000'),
  DB_URL: dbUrl,
  DB_SYNCHRONIZE: bool(process.env.DB_SYNCHRONIZE),
  DB_LOGGING: bool(process.env.DB_LOGGING)
};

