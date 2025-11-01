// src/route.js
// Central route registration. Export a function that wires controllers to an Express router
import express from 'express';
import UserController from './controllers/userController.js';

export default function registerRoutes (app, AppDataSource, prefix = '/api') {
    const router = express.Router();
    try {
        const metaNames = (AppDataSource.entityMetadatas || []).map((m) => m.name);
        console.log('[ROUTE DEBUG] AppDataSource.entityMetadatas =>', metaNames);
    } catch (e) {
        console.warn('[ROUTE DEBUG] gagal membaca entityMetadatas', e.message || e);
    }
    const userController = new UserController(AppDataSource);

    // User routes
    router.get('/users', userController.list);
    router.get('/users/:id', userController.get);
    router.post('/users', userController.create);
    router.put('/users/:id', userController.update);
    router.delete('/users/:id', userController.remove);

    // Mount router under prefix
    app.use(prefix, router);
}
