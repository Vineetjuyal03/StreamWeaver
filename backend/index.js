const express = require("express");
const cors = require("cors");

const importRoutes = require("./routes/importRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/import", importRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "StreamWeaver API is running"
    });
});

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});