import express from 'express';
import cors from 'cors';
import composerRoutes from './routes/composerRoutes';
import healthRoutes from './routes/healthRoutes';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/composer', composerRoutes);
app.use('/api/health', healthRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
