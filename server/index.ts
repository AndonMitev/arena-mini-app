import express from 'express';
import cors from 'cors';
import composerRoutes from './routes/composerRoutes';
import healthRoutes from './routes/healthRoutes';
import { initializeSocket } from './socket';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/composer', composerRoutes);
app.use('/api/health', healthRoutes);

const expressServer = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

const io = initializeSocket(expressServer);
