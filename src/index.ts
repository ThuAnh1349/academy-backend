import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import academyRoutes from './routes/academy.routes';
import authRoutes from './modules/auth/auth.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

import adminRoutes from './routes/admin.routes';

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/v1/academy', academyRoutes);
app.use('/api/v1/admin', adminRoutes);

// Health Check
app.get('/', (req, res) => {
  res.send('NQuoc Academy API is running!');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
