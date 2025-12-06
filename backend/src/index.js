import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import problemsRoutes from './routes/problem.routes.js';
import authRoutes from './routes/auth.routes.js';
import executionRoutes from './routes/executeCode.routes.js';
import submissionsRoutes from './routes/submission.routes.js';
import playlistRoutes from './routes/playlist.routes.js';





dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());



const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('hello guys welcome to leetbal');
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/problems", problemsRoutes);
app.use("/api/v1/execute-code", executionRoutes);
app.use("/api/v1/submissions", submissionsRoutes);
app.use("/api/v1/playlist", playlistRoutes);


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
 