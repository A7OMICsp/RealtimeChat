import express from 'express';
import logger from 'morgan';
import dotenv from 'dotenv';
import { createClient } from '@libsql/client'

import { Server } from 'socket.io';
import { createServer} from 'node:http';

dotenv.config();

const port = process.env.PORT ?? 3000;

const app = express();
const server = createServer(app);
const io = new Server(server, {
    connectionStateRecovery: {
        maxDisconnectionDuration: 1000,
    }
});

const db = createClient({
    url: process.env.DB_URL,
    authToken: process.env.DB_AUTH_TOKEN,
})

await db.execute(`
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message TEXT NOT NULL
    )
`);

io.on('connection', async (socket) => {
    console.log('a user connected');

    socket.on('chat message', async (msg) => {
        console.log('message: ' + msg);

        let result;
        try {
            result = await db.execute({
                sql: 'INSERT INTO messages (message) VALUES (:msg)',
                args: { msg }
            });
        } catch(e) {
            console.error(e);
            return;
        }

        io.emit('chat message', msg, result.lastInsertRowid.toString());
    });

    console.log(socket.handshake.auth)

    if(!socket.recovered) {
        try {
            const results = await db.execute({
                sql: 'SELECT id, message FROM messages WHERE id > ?', 
                args: [socket.handshake.auth.serverOffset ?? 0]
            })

            results.rows.forEach(row => { 
                socket.emit('chat message', row.message, row.id.toString());
            })
        } catch(e) {
            console.error(e);
            return;
        }
    }

    socket.on('disconnect', () => {
        console.log('user disconnected')
    });
});

app.use(logger('dev'));

app.get('/', (req, res) => {
    res.sendFile(process.cwd() + '/client/index.html');
});

server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});