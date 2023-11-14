import dotenv from 'dotenv';
import { createClient,  } from '@libsql/client';

export default class Database {

    db = null;

    constructor() {
        this.db = createClient({
            url: process.env.DB_URL,
            authToken: process.env.DB_AUTH_TOKEN,
        });
        this.#createTables();
    }

    async #createTables() {
        await this.db.execute(
            `CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL
            )`
        );

        await this.db.execute(`CREATE TABLE IF NOT EXISTS chats2user (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                chat_id INTEGER NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id),
                FOREIGN KEY(chat_id) REFERENCES chats(id)
            )`
        );

        await this.db.execute(`CREATE TABLE IF NOT EXISTS chats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                img_url TEXT
        )`)
            
        await this.db.execute(`CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                chat_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                message TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(chat_id) REFERENCES chats(id),
                FOREIGN KEY(user_id) REFERENCES users(id)
            )`
        );
    }

    async execute({ sql, args }) {
        return await this.db.execute({ sql, args });
    }
}

//module.exports = Database;
