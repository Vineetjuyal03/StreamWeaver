const express = require("express");
const http = require("http");
const importRoutes = require("./routes/importRoutes");
require("dotenv").config();
const connectDB = require("./config/db");
const dbInfoRoutes= require("./routes/db_info")
const cors = require("cors");

const {
    initializeWebSocket
} = require("./websocket/progressServer");

const app = express();
app.use(cors());
app.use(express.json());

// your existing routes
app.use("/api/import", importRoutes);
app.use("/db",dbInfoRoutes)
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "StreamWeaver API is running"
    });
});

connectDB();
// IMPORTANT
const server = http.createServer(app);


// IMPORTANT
initializeWebSocket(server);
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log("Server running on port 5000");
});