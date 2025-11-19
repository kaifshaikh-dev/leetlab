import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/auth.routes.js';



dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());



const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('hello guys welcome to leetbal');
});

app.use("/api/v1/auth", authRoutes);


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
 