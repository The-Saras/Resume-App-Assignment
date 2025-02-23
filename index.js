import 'dotenv/config';
import express from 'express';
import authRoute from './routes/auth.js';
import resumeRoute from './routes/resume.js';
import cnmg from './db.js';

cnmg();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use("/api/auth", authRoute);
app.use("/api/resume", resumeRoute);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
