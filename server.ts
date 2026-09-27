import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { researchOrchestrator } from './src/services/orchestrator.ts';
import { memoryStore } from './src/services/memoryStore.ts';
import { evaluationRunner, EVALUATION_QUESTIONS } from './src/services/evaluationRunner.ts';

const isProduction = process.env.NODE_ENV === 'production';
const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Middleware for CORS and logging
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // -------------------------------------------------------------
  // API Endpoints (supporting both /api/* and root /* endpoints)
  // -------------------------------------------------------------

  // Health check
  const healthHandler = (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'VeritasAI Analyst & Auditor Research Engine',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      entitiesInMemory: memoryStore.getAll().length,
    });
  };
  app.get('/api/health', healthHandler);
  app.get('/health', healthHandler);

  // POST /research - Submit research question
  const createResearchHandler = async (req: Request, res: Response) => {
    try {
      const { question, mode = 'standard', maxRevisionLoops = 2 } = req.body;
      if (!question || typeof question !== 'string' || !question.trim()) {
        return res.status(400).json({ error: 'Research question is required' });
      }

      const session = await researchOrchestrator.runResearch(question.trim(), mode, maxRevisionLoops);
      res.json(session);
    } catch (err: any) {
      console.error('Error running research session:', err);
      res.status(500).json({ error: err.message || 'Internal research execution error' });
    }
  };
  app.post('/api/research', createResearchHandler);
  app.post('/research', createResearchHandler);

  // GET /research - List sessions
  const listResearchHandler = (req: Request, res: Response) => {
    const sessions = researchOrchestrator.getAllSessions();
    res.json(sessions);
  };
  app.get('/api/research', listResearchHandler);
  app.get('/research', listResearchHandler);

  // GET /research/:id - Session details
  const getSessionHandler = (req: Request, res: Response) => {
    const session = researchOrchestrator.getSession(req.params.id);
    if (!session) {
      return res.status(404).json({ error: `Session ${req.params.id} not found` });
    }
    res.json(session);
  };
  app.get('/api/research/:id', getSessionHandler);
  app.get('/research/:id', getSessionHandler);

  // GET /research/:id/trace - Research trace events
  const getTraceHandler = (req: Request, res: Response) => {
    const session = researchOrchestrator.getSession(req.params.id);
    if (!session) {
      return res.status(404).json({ error: `Session ${req.params.id} not found` });
    }
    res.json({
      sessionId: session.id,
      question: session.question,
      trace: session.trace,
    });
  };
  app.get('/api/research/:id/trace', getTraceHandler);
  app.get('/research/:id/trace', getTraceHandler);

  // GET /research/:id/sources - Retrieved sources
  const getSourcesHandler = (req: Request, res: Response) => {
    const session = researchOrchestrator.getSession(req.params.id);
    if (!session) {
      return res.status(404).json({ error: `Session ${req.params.id} not found` });
    }
    res.json({
      sessionId: session.id,
      sourcesCount: session.sources.length,
      sources: session.sources,
    });
  };
  app.get('/api/research/:id/sources', getSourcesHandler);
  app.get('/research/:id/sources', getSourcesHandler);

  // GET /research/:id/claims - Extracted and audited claims
  const getClaimsHandler = (req: Request, res: Response) => {
    const session = researchOrchestrator.getSession(req.params.id);
    if (!session) {
      return res.status(404).json({ error: `Session ${req.params.id} not found` });
    }
    res.json({
      sessionId: session.id,
      claimsCount: session.claims.length,
      claims: session.claims,
    });
  };
  app.get('/api/research/:id/claims', getClaimsHandler);
  app.get('/research/:id/claims', getClaimsHandler);

  // GET /research/:id/audit - Auditor summary report
  const getAuditHandler = (req: Request, res: Response) => {
    const session = researchOrchestrator.getSession(req.params.id);
    if (!session) {
      return res.status(404).json({ error: `Session ${req.params.id} not found` });
    }
    res.json({
      sessionId: session.id,
      metrics: {
        total: session.metrics.claimsTotal,
        supported: session.metrics.claimsSupported,
        unsupported: session.metrics.claimsUnsupported,
        contradicted: session.metrics.claimsContradicted,
        uncited: session.metrics.claimsUncited,
        auditorCatches: session.metrics.auditorCatchesCount,
        revisions: session.metrics.revisionCount,
      },
      claims: session.claims,
      revisions: session.revisions,
    });
  };
  app.get('/api/research/:id/audit', getAuditHandler);
  app.get('/research/:id/audit', getAuditHandler);

  // GET /research/:id/memory - Entities retrieved or stored in session
  const getSessionMemoryHandler = (req: Request, res: Response) => {
    const session = researchOrchestrator.getSession(req.params.id);
    if (!session) {
      return res.status(404).json({ error: `Session ${req.params.id} not found` });
    }
    res.json({
      sessionId: session.id,
      targetEntities: session.plan.targetEntities,
      memoryHits: session.plan.memoryHits,
    });
  };
  app.get('/api/research/:id/memory', getSessionMemoryHandler);
  app.get('/research/:id/memory', getSessionMemoryHandler);

  // GET /research/:id/metrics - Latency, token, and cost metrics
  const getMetricsHandler = (req: Request, res: Response) => {
    const session = researchOrchestrator.getSession(req.params.id);
    if (!session) {
      return res.status(404).json({ error: `Session ${req.params.id} not found` });
    }
    res.json({
      sessionId: session.id,
      metrics: session.metrics,
    });
  };
  app.get('/api/research/:id/metrics', getMetricsHandler);
  app.get('/research/:id/metrics', getMetricsHandler);

  // Persistent Memory Endpoints
  const getMemoryHandler = (req: Request, res: Response) => {
    const entities = memoryStore.getAll();
    const stats = memoryStore.getStats();
    res.json({ stats, entities });
  };
  app.get('/api/memory', getMemoryHandler);
  app.get('/memory', getMemoryHandler);

  const resetMemoryHandler = (req: Request, res: Response) => {
    memoryStore.clearMemory();
    res.json({ message: 'Persistent memory reset to seed state', stats: memoryStore.getStats() });
  };
  app.post('/api/memory/reset', resetMemoryHandler);
  app.post('/memory/reset', resetMemoryHandler);

  // Evaluation Suite Endpoints
  const getEvaluationHandler = (req: Request, res: Response) => {
    res.json({
      questions: EVALUATION_QUESTIONS,
      latestResults: evaluationRunner.getLatestResults(),
    });
  };
  app.get('/api/evaluation', getEvaluationHandler);
  app.get('/evaluation', getEvaluationHandler);

  const runEvaluationHandler = async (req: Request, res: Response) => {
    try {
      const results = await evaluationRunner.runEvaluationSuite();
      res.json({ results });
    } catch (err: any) {
      console.error('Error running evaluation suite:', err);
      res.status(500).json({ error: err.message });
    }
  };
  app.post('/api/evaluation/run', runEvaluationHandler);
  app.post('/evaluation/run', runEvaluationHandler);

  // Adversarial Experiment Endpoint
  const runAdversarialHandler = async (req: Request, res: Response) => {
    try {
      const { question } = req.body;
      const comparison = await evaluationRunner.runAdversarialExperiment(question);
      res.json(comparison);
    } catch (err: any) {
      console.error('Error running adversarial test:', err);
      res.status(500).json({ error: err.message });
    }
  };
  app.post('/api/adversarial/run', runAdversarialHandler);
  app.post('/adversarial/run', runAdversarialHandler);

  // Resilience & Failure Injection Endpoint
  const runResilienceHandler = async (req: Request, res: Response) => {
    try {
      const report = await evaluationRunner.runResilienceSuite();
      res.json({ report });
    } catch (err: any) {
      console.error('Error running resilience test:', err);
      res.status(500).json({ error: err.message });
    }
  };
  app.post('/api/resilience/run', runResilienceHandler);
  app.post('/resilience/run', runResilienceHandler);

  // -------------------------------------------------------------
  // Frontend Serving: Vite dev middleware or static dist
  // -------------------------------------------------------------
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VeritasAI Analyst & Auditor server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
});
