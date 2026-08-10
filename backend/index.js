const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());

app.get("/", (req, res) => {
    res.json({
        message: "StreamWeaver backend is running"
    });
});

app.listen(5000, () => {
    console.log("Server running on port 5000");
});