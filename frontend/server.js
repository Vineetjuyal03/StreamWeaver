import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 4173;

// Serve the built static files
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback: any route not matched by a static file goes to index.html
app.get('/*splat', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Frontend served on port ${PORT}`);
});