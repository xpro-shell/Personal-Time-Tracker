import 'dotenv/config';
import express from 'express';
import path from 'path';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/growth-status', (_req, res) => {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    const isPlaceholder = !apiKey || apiKey === 'MY_GEMINI_API_KEY';
    res.json({
      aiAvailable: !isPlaceholder,
      model: !isPlaceholder ? 'gemini-4-hydrogen' : null,
      status: 'beta',
    });
  });

  app.post('/api/growth-chat', async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      res.status(503).json({
        error: 'Gemini API key is not configured on this server.',
        code: 'MISSING_API_KEY',
      });
      return;
    }

    const { question, snapshot, history } = req.body as {
      question?: string;
      snapshot?: Record<string, unknown>;
      history?: Array<{ role: 'user' | 'assistant'; text: string }>;
    };

    if (!question || typeof question !== 'string' || !question.trim()) {
      res.status(400).json({ error: 'Question is required.' });
      return;
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const systemInstruction = [
        'You are RankPulse, an In-Beta gaming-growth & productivity analytics copilot inside Personal Time Tracker.',
        'Accuracy Rules (STRICT):',
        '1. ONLY use numbers, dates, percentages, hours, and counts from the VERIFIED_TRACKER_SNAPSHOT JSON provided below. NEVER invent, guess, or fabricate numbers.',
        '2. When a user asks about "1 week growth" or "% growth", report the exact `rolling7Days.overall.pctChange` (and mention `currentMinutes` vs `previousMinutes` in hours/minutes, plus calendar week if helpful). If `pctChange` is null because `previousMinutes` was 0, explicitly say the prior 7-day baseline had 0m rather than inventing an infinity percent.',
        '3. Active Desk Time (`today.activeDeskMinutes`, `rolling7Days.activeDesk`, `allTime.totalActiveDeskMinutes`) tracks desk attendance separately from Activity Totals (`totalActivityMinutes`) so sessions are never double-counted.',
        '4. Format responses concisely with bullet points, **bold** key metrics, and a crisp gaming-growth tone (XP, Level, Streak, Momentum).',
      ].join('\n');

      const recentHistory = Array.isArray(history)
        ? history
            .slice(-6)
            .map((m) => `${m.role === 'user' ? 'Player' : 'RankPulse'}: ${m.text}`)
            .join('\n')
        : '';

      const prompt = [
        'VERIFIED_TRACKER_SNAPSHOT (Ground Truth JSON):',
        JSON.stringify(snapshot || {}, null, 2),
        recentHistory ? `\nRECENT_CHAT:\n${recentHistory}` : '',
        `\nPLAYER_QUESTION: ${question.trim()}`,
      ]
        .filter(Boolean)
        .join('\n');

      const callModel = () =>
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: prompt,
          config: {
            systemInstruction,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          },
        });

      let response;
      const delays = [600, 1400];
      for (let attempt = 0; attempt <= delays.length; attempt++) {
        try {
          response = await callModel();
          break;
        } catch (attemptErr) {
          const msg = attemptErr instanceof Error ? attemptErr.message : '';
          const isTransient = msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('429');
          if (!isTransient || attempt === delays.length) {
            throw attemptErr;
          }
          await new Promise((r) => setTimeout(r, delays[attempt]));
        }
      }

      const replyText = (response?.text || '').trim();
      if (!replyText) {
        res.status(502).json({ error: 'Empty response from RankPulse AI.' });
        return;
      }

      res.json({
        reply: replyText,
        engine: 'gemini-4-hydrogen',
      });
    } catch (err) {
      console.error('RankPulse AI error:', err);
      const rawMessage = err instanceof Error ? err.message : 'Upstream AI service error.';
      let cleanMessage = rawMessage;
      if (rawMessage.includes('503') || rawMessage.includes('UNAVAILABLE')) {
        cleanMessage = 'Gemini AI is experiencing high demand right now.';
      } else if (rawMessage.includes('429') || rawMessage.includes('RESOURCE_EXHAUSTED')) {
        cleanMessage = 'Gemini API rate limit reached temporarily.';
      }
      res.status(502).json({ error: cleanMessage, code: 'UPSTREAM_ERROR' });
    }
  });

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(import.meta.dirname || '.', 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Personal Time Tracker server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
