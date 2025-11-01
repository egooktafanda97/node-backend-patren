import 'reflect-metadata';
import express from 'express';
import dotenv from 'dotenv';

// Load environment variables first so any modules imported after this
// can read DB_* or DATABASE_* variables immediately.
dotenv.config();

// Dynamically import modules that depend on environment variables so
// dotenv has a chance to populate process.env first.
const { default: AppDataSource } = await import('./src/DataSource.js');
const { default: registerRoutes } = await import('./src/route.js');

if (!process.env.NODE_ENV) process.env.NODE_ENV = 'development';

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());

AppDataSource.initialize()
    .then(async () => {
        console.log('[DB INFO] TypeORM Data Source berhasil diinisialisasi.');

        // root route
        app.get('/', (req, res) => {
            res.json({
                message: 'Selamat datang di Node.js Express API dengan TypeORM',
                database_mode: process.env.NODE_ENV,
            });
        });

        // register application routes
        registerRoutes(app, AppDataSource);

        app.listen(PORT, () => {
            console.log(`Server berjalan di http://localhost:${PORT}`);
            console.log(`Aplikasi berjalan dalam mode: ${process.env.NODE_ENV}`);
        });
    })
    .catch((error) => {
        console.error('[DB ERROR] TypeORM Data Source gagal diinisialisasi:', error);
        process.exit(1);
    });

process.on('SIGINT', async () => {
    if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
        console.log('\nKoneksi database TypeORM terputus. Aplikasi dimatikan.');
    }
    process.exit(0);
});
