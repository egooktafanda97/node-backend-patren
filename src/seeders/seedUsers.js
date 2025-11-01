import 'reflect-metadata';
import AppDataSource from '../DataSource.js';
import { createUsers } from '../factories/userFactory.js';

async function run () {
    try {
        await AppDataSource.initialize();
        console.log('[SEED] Database initialized.');
        const userRepository = AppDataSource.getRepository('User');

        const count = parseInt(process.env.SEED_COUNT, 10) || 20;
        const users = createUsers(count);

        let inserted = 0;
        for (const u of users) {
            try {
                const newUser = userRepository.create(u);
                await userRepository.save(newUser);
                inserted++;
            } catch (err) {
                console.warn('[SEED] Gagal menyimpan user (mungkin duplicate), dilewati:', err.message || err);
            }
        }

        console.log(`[SEED] Selesai. Berhasil memasukkan ~${inserted}/${users.length} users.`);
        await AppDataSource.destroy();
        process.exit(0);
    } catch (error) {
        console.error('[SEED] Gagal menjalankan seeder:', error);
        try { if (AppDataSource && AppDataSource.isInitialized) await AppDataSource.destroy(); } catch (e) { }
        process.exit(1);
    }
}

run();
