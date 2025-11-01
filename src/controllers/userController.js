// src/controllers/userController.js
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

export default class UserController {
    constructor(AppDataSource) {
        this.userRepo = AppDataSource.getRepository('User');
        this.list = this.list.bind(this);
        this.get = this.get.bind(this);
        this.create = this.create.bind(this);
        this.update = this.update.bind(this);
        this.remove = this.remove.bind(this);
    }

    // GET /users - list (ordered desc by id)
    async list (req, res) {
        try {
            const users = await this.userRepo
                .createQueryBuilder('user')
                .leftJoinAndSelect('user.children', 'children')
                .orderBy('user.id', 'DESC')
                .getMany();

            // strip passwords
            const safe = users.map((u) => {
                const { password, ...rest } = u;
                return rest;
            });

            res.json({ count: safe.length, users: safe });
        } catch (err) {
            console.error('Error fetching users:', err);
            res.status(500).json({ error: 'Gagal mengambil data user', details: err.message });
        }
    }

    // GET /users/:id
    async get (req, res) {
        const id = parseInt(req.params.id, 10);
        try {
            const user = await this.userRepo.findOne({ where: { id }, relations: ['children', 'parent'] });
            if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });
            const { password, ...rest } = user;
            res.json(rest);
        } catch (err) {
            console.error('Error getting user:', err);
            res.status(500).json({ error: 'Gagal mengambil user', details: err.message });
        }
    }

    // POST /users - create
    async create (req, res) {
        const { name, email, password, parent_id } = req.body;
        if (!name) return res.status(400).json({ error: 'Field name diperlukan' });
        try {
            const payload = { name };
            if (email) payload.email = email;

            // try to hash password if bcryptjs available; otherwise store as-is (log warning)
            if (password) {
                try {
                    const bcrypt = require('bcryptjs');
                    const salt = bcrypt.genSaltSync(10);
                    payload.password = bcrypt.hashSync(password, salt);
                } catch (e) {
                    console.warn('bcryptjs not available, storing password as plain text. Install bcryptjs to hash passwords.');
                    payload.password = password;
                }
            }

            if (parent_id) payload.parent = { id: parent_id };
            const newUser = this.userRepo.create(payload);
            await this.userRepo.save(newUser);
            const { password: _p, ...rest } = newUser;
            res.status(201).json({ message: 'User berhasil dibuat', user: rest });
        } catch (err) {
            console.error('Error creating user:', err);
            res.status(500).json({ error: 'Gagal membuat user', details: err.message });
        }
    }

    // PUT /users/:id - update
    async update (req, res) {
        const id = parseInt(req.params.id, 10);
        const { name, email, password, parent_id } = req.body;
        try {
            const user = await this.userRepo.findOne({ where: { id } });
            if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });
            if (name !== undefined) user.name = name;
            if (email !== undefined) user.email = email;
            if (parent_id !== undefined) user.parent = parent_id ? { id: parent_id } : null;

            if (password !== undefined) {
                try {
                    const bcrypt = require('bcryptjs');
                    const salt = bcrypt.genSaltSync(10);
                    user.password = bcrypt.hashSync(password, salt);
                } catch (e) {
                    console.warn('bcryptjs not available, storing password as plain text. Install bcryptjs to hash passwords.');
                    user.password = password;
                }
            }

            await this.userRepo.save(user);
            const { password: _p, ...rest } = user;
            res.json({ message: 'User diperbarui', user: rest });
        } catch (err) {
            console.error('Error updating user:', err);
            res.status(500).json({ error: 'Gagal memperbarui user', details: err.message });
        }
    }

    // DELETE /users/:id
    async remove (req, res) {
        const id = parseInt(req.params.id, 10);
        try {
            const user = await this.userRepo.findOne({ where: { id } });
            if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });
            await this.userRepo.remove(user);
            res.json({ message: 'User dihapus' });
        } catch (err) {
            console.error('Error deleting user:', err);
            res.status(500).json({ error: 'Gagal menghapus user', details: err.message });
        }
    }
}
