const express = require('express')
const app = express();
const http = require('http')
const socketIo = require('socket.io')
const server = http.createServer(app)
const io = socketIo(server);
const indexRouter = require('./routes/index');
const path = require('path');
app.set("view engine", "ejs")
app.use(express.urlencoded({extended:true}))
app.use(express.json());
app.use(express.static(path.join(__dirname,"public")));

let waitingUser = []

io.on("connection",(socket)=>{
    console.log("user connected")
    socket.on("joinroom",()=>{
        if(waitingUser.length > 0){
            let partner = waitingUser.shift();
            const roomname = `${partner.id}-${socket.id}`
            socket.join(roomname)
            partner.join(roomname)
    
            io.to(roomname).emit("joined", roomname);

    
        }
        else{
            waitingUser.push(socket)
        }
    });
    
    socket.on("signalingMessage", (data) => {
        socket.broadcast.to(data.room).emit("signalingMessage", data.message)
    });

    socket.on("message",(data)=>{
        socket.broadcast.to(data.room).emit("message",data.message)
    })

    socket.on("startVideoCall",({room})=>{
        socket.broadcast.to(room).emit("incomingCall")
    })

    socket.on("rejectCall",({room})=>{
        socket.broadcast.to(room).emit("callRejected")
    })

    socket.on("acceptCall",({room})=>{
        socket.broadcast.to(room).emit("callAccepted")
    })


    socket.on("disconnect",()=>{
        let index = waitingUser.findIndex(
            (waitingUser) => waitingUser.id == socket.id
        )
        waitingUser.splice(index,1)
    })

    

})

app.use("/",indexRouter)

server.listen(3000)