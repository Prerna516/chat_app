import express from 'express'
import mongoose, { connect } from 'mongoose'
import cors from 'cors'
import { Server } from 'socket.io'
import "dotenv/config"
import http from 'http'
import { connectDB } from './lib/db.js'
import userRouter from './routes/userRoutes.js'
import messageRouter from './routes/messageRoutes.js'

const app = express()
const server = http.createServer(app)
const port = 4000

export const io = new Server(server, {
    cors: {
        origin: "*"
    }
})

export const userSocketMap = {};

io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    console.log("User Connected", userId);

    if(userId) userSocketMap[userId] = socket.id;

    //emit online users to all online clients
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("disconnect", () => {
        console.log("User Disconnected", userId);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
});

app.use(express.json({limit:"4mb"}))


app.use(cors())

app.use('/api/status', (req,res)=>res.send("Server is running"))
app.use("/api/auth", userRouter)
app.use("/api/messages", messageRouter)


await connectDB();

if(process.env.NODE_ENV !== "production") {
    server.listen(port, () => {
    console.log(`Server started on port ${port}`)
})
}

//Export server for vercel
export default server;