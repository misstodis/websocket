import express from 'express';
import {createServer} from 'node:http';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';
import {Server} from 'socket.io';
import sqlite3 from 'sqlite3';
import {open} from 'sqlite';

const app = express();
const server = createServer(app);
const io = new Server(server, {
    connectionStateRecovery: {}
});

//-------------------------- Database setup -------------------------------
// open the database file
const db = await open({
    filename: 'chat.db',
    driver: sqlite3.Database
});

// create our 'messages' table (you can ignore the 'client_offset' column for now)
await db.exec(`
    CREATE TABLE IF NOT EXISTS messages
    (
        id
        INTEGER
        PRIMARY
        KEY
        AUTOINCREMENT,
        client_offset
        TEXT
        UNIQUE,
        content
        TEXT,
        userName
        TEXT
    );
`);
//-------------------------- End of database setup -------------------------------


const __dirname = dirname(fileURLToPath(import.meta.url));

app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
});

app.get('/room-anime', (req, res) => {
    res.sendFile(join(__dirname, 'room-anime.html'));
});


io.on('connection', async (socket) => {

    // ------------------------- Global listen to event -------------------------------
    console.log('a user connected');

    // Listen for chat messages from the client and broadcast them to all connected clients including the sender
    socket.on('chat message', async (msg, clientOffset, callback) => {
        let result;
        try {
            result = await db.run('INSERT INTO messages (content, client_offset, userName) VALUES (?, ?,?)', msg.message, clientOffset, msg.userName);

        } catch (e) {
            if (e.errno === 19 /* SQLITE_CONSTRAINT */) {
                // the message was already inserted, so we notify the client
                callback();
            } else {
                // nothing to do, just let the client retry
                console.log(e);
            }

            return;
        }
        socket.broadcast.emit('chat message', msg, result.lastID);

        // acknowledge the event
        callback();
    });


    // Broadcast a message to all other clients when a new user connects
    // except the current user who just connected
    // socket.broadcast.emit('new user connect to chat', 'A new user has joined the chat');

    socket.on('userJoinChat', (userName, callback) => {
        socket.broadcast.emit('userJoinChat', userName);

        // because the client is waiting for an acknowledgment,
        // we need to call the callback function to let the client know that the event was received and processed successfully
        // other wise, the the client will retries 3 times and then gives up because it thinks that the event was not received by the server
        // @see index.html on socker = io() for more config
        callback();
    })

    // Listen for the disconnect event and log it to the console
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });

    // callback example that is used to send a response back to the client after receiving a request
    // socket.on("request", (arg1, arg2, arg3, callback)=>{
    //     console.log(arg1);
    //     console.log(arg2);
    //     console.log(arg3);
    //     callback({
    //         status: 'wtf man you are so weird',
    //     });
    // })


    // ------------------------- Room -------------------------------

    // Listen for client requesting to join a room
    socket.on('join-room', (room) => {
        socket.join(room);
        console.log(`socket ${socket.id} joined ${room}`);

        // Broadcast 'hello' to everyone else in the room
        socket.to(room).emit('user join room-anime', `A new user joined ${room}`);
    });

    socket.on('chat message', ({room, msg}) => {
        console.log(`Message in ${room}: ${msg}`);
        // Send the message to everyone in the room including the sender
        io.to(room).emit('chat message', msg);
    });

    //------------------------- End of Room -------------------------------


    // ----------------------- Connection state recovery -----------------------
    // When the client connects to the server, it can send an auth payload that contains a serverOffset property.
    // This property represents the ID of the last message that the client has received from the server.
    if (!socket.recovered) {
        // if the connection state recovery was not successful
        // handshake is the initial connection information sent by the client when it connects to the server
        try {
            // the client can query the database for messages that have an ID greater than the serverOffset
            await db.each('SELECT id, content, userName FROM messages WHERE id > ?',
                [socket.handshake.auth.serverOffset || 0],
                (_err, row) => {
                    socket.emit('chat message', {
                        userName: row.userName,
                        message: row.content
                    }, row.id);
                }
            )
        } catch (e) {
            // something went wrong
        }
    }
    // ----------------------- End of Connection state recovery -----------------------

    //--------------- user is typing ----------------
    socket.on('userIsTyping', (arg, callback) => {
        socket.broadcast.emit('userIsTyping', arg);

        callback();
    })

});


server.listen(3000, () => {
    console.log('server running at http://localhost:3000');
});
