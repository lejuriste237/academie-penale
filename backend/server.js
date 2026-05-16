const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'https://lejuriste237.github.io', 'https://academie-penale.cm'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Logs
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Route principale : Appel sécurisé à Mistral AI
app.post('/api/generate', async (req, res) => {
  try {
    // Validation des données
    if (!req.body.messages || !Array.isArray(req.body.messages)) {
      return res.status(400).json({ 
        error: 'Messages array is required',
        code: 'INVALID_REQUEST'
      });
    }

    if (!MISTRAL_API_KEY) {
      console.error('MISTRAL_API_KEY is not configured');
      return res.status(500).json({ 
        error: 'API key not configured on server',
        code: 'SERVER_ERROR'
      });
    }

    // Limiter la taille de la requête
    if (JSON.stringify(req.body).length > 50000) {
      return res.status(400).json({ 
        error: 'Request payload too large',
        code: 'PAYLOAD_TOO_LARGE'
      });
    }

    // Appel à l'API Mistral
    const response = await axios.post(MISTRAL_API_URL, {
      model: req.body.model || 'mistral-small-latest',
      messages: req.body.messages,
      max_tokens: Math.min(req.body.max_tokens || 1200, 2000),
      temperature: Math.min(Math.max(req.body.temperature || 0.7, 0), 1)
    }, {
      headers: {
        'Authorization': `Bearer ${MISTRAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    // Retourner la réponse
    res.json({
      success: true,
      data: response.data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('API Error:', error.message);

    // Gestion des erreurs Mistral
    if (error.response) {
      const status = error.response.status;
      const errorMsg = error.response.data?.message || 'Unknown error';
      
      return res.status(status).json({
        error: errorMsg,
        code: 'MISTRAL_API_ERROR',
        status: status
      });
    }

    // Erreur réseau ou timeout
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({
        error: 'Request timeout - API server not responding',
        code: 'TIMEOUT'
      });
    }

    // Erreur générale
    res.status(500).json({
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    code: 'NOT_FOUND'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    code: 'SERVER_ERROR'
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   Académie Pénale Backend Server       ║
║   ✅ Server running on port ${PORT}        ║
║   🔐 Mistral API secured               ║
║   📡 Ready for requests                ║
╚════════════════════════════════════════╝
  `);
});

// Gestion de l'arrêt gracieux
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});
