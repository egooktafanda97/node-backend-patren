// src/DataSource.js
// Do not load dotenv here; server.js loads it.
import { DataSource } from 'typeorm';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
// Automatically load all entity modules from src/entity
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const entitiesDir = path.join(__dirname, 'entity');
let entityFiles = [];
try {
    entityFiles = fs.readdirSync(entitiesDir).filter((f) => f.endsWith('.js') || f.endsWith('.mjs'));
} catch (e) {
    // if folder doesn't exist, fallback to empty
    entityFiles = [];
}

const entities = [];
for (const file of entityFiles) {
    try {
        const mod = await import(pathToFileURL(path.join(entitiesDir, file)).href);
        // prefer default export, otherwise try first exported value
        const ent = mod.default ?? Object.values(mod)[0];
        if (ent) entities.push(ent);
    } catch (e) {
        console.warn('[DB INFO] Gagal mengimpor entitas dari', file, e.message || e);
    }
}

// Log loaded entity names for debugging metadata issues
try {
    const names = entities.map((e) => (e && e.name) || '(unknown)');
    console.log('[DB INFO] Entities loaded by DataSource:', names);
} catch (e) {
    console.warn('[DB INFO] Gagal mencatat daftar entitas', e.message || e);
}

// --- Logika Penentuan Koneksi Database ---
const isDevelopment = process.env.NODE_ENV === 'development';
let dataSourceConfig = {};

if (isDevelopment) {
    // Helper to strip surrounding quotes from env values (dotenv may keep them)
    const strip = (v) => (typeof v === 'string' ? v.replace(/^\s*["']?|["']?\s*$/g, '') : v);

    // Prefer generic DB_* env vars when present (DB_CONNECTION / DB_HOST / ...)
    const dbConnection = strip(process.env.DB_CONNECTION || '');
    if (dbConnection) {
        const conn = dbConnection.toLowerCase();
        if (conn === 'mysql') {
            dataSourceConfig = {
                type: 'mysql',
                host: strip(process.env.DB_HOST) || '127.0.0.1',
                port: parseInt(strip(process.env.DB_PORT || '3306'), 10),
                username: strip(process.env.DB_USERNAME) || 'root',
                password: strip(process.env.DB_PASSWORD) || '',
                database: strip(process.env.DB_DATABASE) || 'app_dev',
                synchronize: true,
                logging: ['query', 'error'],
            };
        } else if (conn === 'sqlite') {
            dataSourceConfig = {
                type: 'sqlite',
                database: strip(process.env.DB_DATABASE) || process.env.DATABASE_URL_DEV || './data/dev.sqlite',
                synchronize: true,
                logging: ['error'],
            };
        } else {
            // Generic fallback using DATABASE_URL_DEV if set
            dataSourceConfig = {
                type: conn,
                database: process.env.DATABASE_URL_DEV || './data/dev.sqlite',
                synchronize: true,
                logging: ['query', 'error'],
            };
        }
    } else {
        // If DATABASE_TYPE_DEV is set you can choose between 'sqlite' or 'mysql'.
        // Default for development is now MySQL unless explicitly set to 'sqlite'.
        const typeDev = (process.env.DATABASE_TYPE_DEV || 'mysql').toLowerCase();

        if (typeDev === 'mysql') {
            // Prefer DB_* env vars when available, otherwise fall back to DATABASE_*_DEV vars.
            dataSourceConfig = {
                type: 'mysql',
                host: strip(process.env.DB_HOST) || process.env.DATABASE_HOST_DEV || '127.0.0.1',
                port: parseInt(strip(process.env.DB_PORT) || process.env.DATABASE_PORT_DEV || '3306', 10),
                username: strip(process.env.DB_USERNAME) || process.env.DATABASE_USERNAME_DEV || 'root',
                password: strip(process.env.DB_PASSWORD) || process.env.DATABASE_PASSWORD_DEV || '',
                database: strip(process.env.DB_DATABASE) || process.env.DATABASE_NAME_DEV || 'app_dev',
                synchronize: true,
                logging: ['query', 'error'],
            };
        } else if (typeDev === 'sqlite') {
            // Explicit sqlite choice still supported when DATABASE_TYPE_DEV=sqlite
            dataSourceConfig = {
                type: 'sqlite',
                database: process.env.DATABASE_URL_DEV || './data/dev.sqlite',
                synchronize: true,
                logging: ['error'],
            };
        } else {
            // Generic fallback: if DATABASE_URL_DEV is a file or connection string
            dataSourceConfig = {
                type: typeDev,
                database: process.env.DATABASE_URL_DEV || './data/dev.sqlite',
                synchronize: true,
                logging: ['query', 'error'],
            };
        }
    }

    console.log(`[DB INFO] Mode: Development. Menggunakan koneksi: ${dataSourceConfig.type} ` +
        (dataSourceConfig.type === 'sqlite' ? `(${dataSourceConfig.database})` : `@${dataSourceConfig.host}:${dataSourceConfig.port}/${dataSourceConfig.database}`));
} else {
    if (!process.env.DATABASE_NAME_PROD || !process.env.DATABASE_HOST_PROD) {
        console.error('ERROR: Variabel MySQL (DATABASE_NAME_PROD, dll.) tidak ditemukan di .env.');
        process.exit(1);
    }

    dataSourceConfig = {
        type: process.env.DATABASE_TYPE_PROD,
        host: process.env.DATABASE_HOST_PROD,
        port: parseInt(process.env.DATABASE_PORT_PROD, 10),
        username: process.env.DATABASE_USERNAME_PROD,
        password: process.env.DATABASE_PASSWORD_PROD,
        database: process.env.DATABASE_NAME_PROD,
        synchronize: false,
        logging: ['error'],
    };

    console.log(`[DB INFO] Mode: Production. Menggunakan koneksi: MySQL (${process.env.DATABASE_HOST_PROD})`);
}

dataSourceConfig.entities = entities;

const AppDataSource = new DataSource(dataSourceConfig);

export default AppDataSource;
