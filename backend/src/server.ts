import app from './app';
import { config } from './config/env';

const PORT = config.PORT || 3001;

app.listen(PORT, () => {
  console.log(`[SERVER] Server running on port ${PORT}`);
  console.log(`[SERVER] Environment: ${config.NODE_ENV}`);
});