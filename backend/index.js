require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const importRoutes = require("./routes/importRoutes");

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.use("/api/import", importRoutes);
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "StreamWeaver API is running"
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});