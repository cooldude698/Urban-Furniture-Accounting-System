import { Router, Request, Response } from 'express';
import { VoiceBillService } from '../services/voiceBillService';
import { sendSuccess, sendError } from '../utils/response';
import { requireAuth, requireInternalUser } from '../middleware/auth';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

export const voiceBillRouter = Router();

// Allow authenticated internal users
voiceBillRouter.use(requireAuth);
voiceBillRouter.use(requireInternalUser);

// 1. POST /api/voice-bill/message - Send conversational text / query
voiceBillRouter.post('/message', async (req: Request, res: Response) => {
  try {
    const { text, sessionId } = req.body;
    if (!text || typeof text !== 'string' || !text.trim()) {
      return sendError(res, 'INVALID_INPUT', 'Text message cannot be empty', 400);
    }

    const result = await VoiceBillService.processMessage(text.trim(), sessionId);
    return sendSuccess(res, result);
  } catch (err: any) {
    console.error('Error in voice-bill message:', err);
    return sendError(res, 'VOICE_BILL_ERROR', err.message || 'Failed to process message', 500);
  }
});

// 2. GET /api/voice-bill/session/:id - Get session draft state
voiceBillRouter.get('/session/:id', (req: Request, res: Response) => {
  try {
    const sessionId = String(req.params.id);
    const session = VoiceBillService.getSession(sessionId);
    if (!session) {
      return sendError(res, 'SESSION_NOT_FOUND', `Session ${sessionId} not found`, 404);
    }
    return sendSuccess(res, session);
  } catch (err: any) {
    return sendError(res, 'SESSION_ERROR', err.message, 500);
  }
});

// 3. POST /api/voice-bill/confirm - Finalize and create Customer Invoice
voiceBillRouter.post('/confirm', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return sendError(res, 'INVALID_SESSION', 'sessionId is required to confirm bill', 400);
    }

    const invoiceResult = await VoiceBillService.confirmBill(sessionId);
    return sendSuccess(res, invoiceResult, 201);
  } catch (err: any) {
    console.error('Error confirming voice bill:', err);
    return sendError(res, 'CONFIRM_ERROR', err.message || 'Failed to generate invoice', 400);
  }
});

// 4. GET /api/voice-bill/products - Fetch active product catalog directly from database
voiceBillRouter.get('/products', async (_req: Request, res: Response) => {
  try {
    const products = await VoiceBillService.getCatalogProducts();
    return sendSuccess(res, products);
  } catch (err: any) {
    console.error('Error fetching voice bill products:', err);
    return sendError(res, 'FETCH_FAILED', err.message || 'Failed to fetch catalog products', 500);
  }
});

// 5. GET /api/voice-bill/customers - Fetch customer contacts directly from database
voiceBillRouter.get('/customers', async (_req: Request, res: Response) => {
  try {
    const customers = await VoiceBillService.getCustomers();
    return sendSuccess(res, customers);
  } catch (err: any) {
    console.error('Error fetching voice bill customers:', err);
    return sendError(res, 'FETCH_FAILED', err.message || 'Failed to fetch customers', 500);
  }
});

// 4. POST /api/voice-bill/transcribe - Transcribe voice audio via local whisper binary if present
voiceBillRouter.post('/transcribe', async (req: Request, res: Response) => {
  try {
    const { audioBase64, language } = req.body;
    if (!audioBase64) {
      return sendError(res, 'AUDIO_REQUIRED', 'audioBase64 payload is required', 400);
    }

    const buffer = Buffer.from(audioBase64, 'base64');
    const tmpDir = '/tmp';
    const tmpFile = path.join(tmpDir, `voice_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.wav`);

    try {
      fs.writeFileSync(tmpFile, buffer);
    } catch (fsErr) {
      // Fallback to local cwd scratch directory
      fs.writeFileSync(path.join(process.cwd(), 'temp_voice.wav'), buffer);
    }

    // Try executing whisper or whisper-cli if installed
    const whisperCmd = `which whisper-cli || which whisper || which main`;
    exec(whisperCmd, (whichErr, whichStdout) => {
      const binaryPath = whichStdout.trim().split('\n')[0];
      if (!binaryPath) {
        // Whisper binary is not installed in the container
        return sendError(
          res,
          'WHISPER_NOT_INSTALLED',
          'Local whisper.cpp binary is not present in Docker image. Frontend Web Speech API will handle transcription directly.',
          501
        );
      }

      const langFlag = language === 'hi' ? '-l hi' : '-l auto';
      const cmd = `"${binaryPath}" -m /models/ggml-base.bin ${langFlag} -f "${tmpFile}" --no-timestamps`;

      exec(cmd, (execErr, stdout, stderr) => {
        try {
          if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
        } catch (_) {}

        if (execErr) {
          console.warn('Whisper execution failed:', stderr || execErr.message);
          return sendError(res, 'TRANSCRIPTION_FAILED', execErr.message, 500);
        }

        const transcribed = stdout.trim();
        return sendSuccess(res, { text: transcribed });
      });
    });
  } catch (err: any) {
    return sendError(res, 'TRANSCRIPTION_ERROR', err.message, 500);
  }
});
