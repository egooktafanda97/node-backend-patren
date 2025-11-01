// src/entity/User.js
import { EntitySchema } from 'typeorm';

/**
 * Entitas `users` sesuai skema SQL yang diberikan oleh user.
 */
const User = new EntitySchema({
    name: 'User',
    tableName: 'users',
    columns: {
        id: {
            primary: true,
            type: 'int',
            generated: true,
        },
        name: {
            type: 'varchar',
            length: 100,
            nullable: false,
        },
        email: {
            type: 'varchar',
            length: 150,
            unique: true,
            // Make email nullable for existing development DBs so synchronize won't fail
            // when the current `users` table doesn't have this column yet.
            nullable: true,
        },
        password: {
            type: 'varchar',
            length: 255,
            nullable: true,
        },
        createdAt: {
            name: 'created_at',
            type: 'datetime',
            createDate: true,
        },
        updatedAt: {
            name: 'updated_at',
            type: 'datetime',
            updateDate: true,
        },
    },
    relations: {
        parent: {
            type: 'many-to-one',
            target: 'User',
            joinColumn: { name: 'parent_id' },
            nullable: true,
            cascade: false,
            onDelete: 'SET NULL',
        },
        children: {
            type: 'one-to-many',
            target: 'User',
            inverseSide: 'parent',
        },
    },
});

export default User;
