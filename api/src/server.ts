import http from 'http';
import { app } from './app';
import { initSocketIO } from './services/ledgerEvents';
import { VoiceBillService } from './services/voiceBillService';

const PORT = parseInt(process.env.PORT || '5000', 10);
const server = http.createServer(app);

// Initialize real-time Socket.IO with httpOnly cookie auth
initSocketIO(server);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Urban Furniture API server running on port ${PORT}`);
  // Warm up Ollama model in RAM on server startup with keep_alive 30m
  VoiceBillService.warmUpOllama().catch(err => {
    console.warn('[Ollama] Warm-up non-blocking warning:', err.message);
  });
});
