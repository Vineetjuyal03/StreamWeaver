import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 5000;

// Enable CORS so frontend can communicate
app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.send('StreamWeaver Backend is Running!');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});