const express = require("express");
const http = require("http");
const importRoutes = require("./routes/importRoutes");
require("dotenv").config();
const connectDB = require("./config/db");
const dbInfoRoutes= require("./routes/db_info")
const cors = require("cors");
const errorHandler = require("./middleware/errorHandler");
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
app.use(errorHandler);
process.on("unhandledRejection", (reason) => {
    console.error("UNHANDLED REJECTION:", reason);
});

process.on("uncaughtException", (error) => {
    console.error("UNCAUGHT EXCEPTION:", error);
    // In production you'd typically exit and let a process manager restart cleanly;
    // for now, just logging so nothing dies silently during testing.
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