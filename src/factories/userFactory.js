function makeEmail (seed) {
    const ts = Date.now().toString(36);
    return `user_${ts}_${seed}@example.com`;
}

function makeName (seed) {
    return `User ${seed} ${Math.random().toString(36).substring(2, 7)}`;
}

function createUser (seed) {
    return {
        email: makeEmail(seed),
        name: makeName(seed),
        email: makeEmail(seed),
        password: 'password',
    };
}

function createUsers (count) {
    const users = [];
    for (let i = 0; i < count; i++) {
        users.push(createUser(i + 1));
    }
    return users;
}

export { createUser, createUsers };
