import { Router } from 'express';
import {
  createSession,
  getSessionStatus,
  submitSelfCheckIn,
  streamLiveEvents,
  getRecentCheckIns,
  getNetworkInfo,
  setTunnelUrl,
} from '../controllers/checkinSessionController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

// Real-time SSE event stream for kiosks and terminals
router.get('/stream', streamLiveEvents);

// Get recent self-checkins for terminal live feed
router.get('/recent', getRecentCheckIns);

// Get server LAN IP and network metadata
router.get('/network-info', getNetworkInfo);

// Register active public tunnel URL (from tunnel process)
router.post('/tunnel-url', setTunnelUrl);

// Kiosk generation of a new QR session token (attaches user if logged in, or allows kiosk mode)
router.post('/', optionalAuth, createSession);

// Public validation of token for visitor phone
router.get('/:token', getSessionStatus);

// Public submission of check-in form from visitor phone
router.post('/:token/submit', submitSelfCheckIn);

export default router;
