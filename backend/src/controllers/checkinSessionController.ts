import { Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../prisma.js';
import { AuthRequest } from '../middleware/auth.js';
import { logAudit } from '../utils/audit.js';

import os from 'os';

// In-memory set for Real-Time Server-Sent Events (SSE) clients
const sseClients = new Set<Response>();

// Rate-limiting map for public submissions: IP -> timestamp array
const ipSubmissions = new Map<string, number[]>();

export function getLocalNetworkIp(): string {
  const interfaces = os.networkInterfaces();
  const candidates: { name: string; address: string; priority: number }[] = [];

  const virtualKeywords = ['vethernet', 'wsl', 'virtual', 'vmware', 'vbox', 'docker', 'tap', 'tunnel', 'vpn', 'zerotier', 'hyper-v', 'loopback', 'host-only'];

  for (const ifaceName of Object.keys(interfaces)) {
    const lowerName = ifaceName.toLowerCase();
    const isVirtual = virtualKeywords.some((keyword) => lowerName.includes(keyword));

    for (const iface of interfaces[ifaceName] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        let priority = 10;

        // Prioritize physical Wi-Fi or Ethernet
        if (lowerName.includes('wi-fi') || lowerName.includes('wifi') || lowerName.includes('wlan') || lowerName.includes('ethernet') || lowerName.includes('eth0') || lowerName.includes('en0')) {
          priority = 100;
        }

        // Penalize virtual interfaces
        if (isVirtual) {
          priority = 1;
        }

        candidates.push({ name: ifaceName, address: iface.address, priority });
      }
    }
  }

  if (candidates.length === 0) return '127.0.0.1';

  // Sort by highest priority
  candidates.sort((a, b) => b.priority - a.priority);
  return candidates[0].address;
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (ipSubmissions.get(ip) || []).filter((t) => now - t < 60000); // 1 minute window
  if (timestamps.length >= 10) {
    return true; // max 10 submissions per minute per IP
  }
  timestamps.push(now);
  ipSubmissions.set(ip, timestamps);
  return false;
}

export function broadcastNewVisitor(visitor: any) {
  const payload = `data: ${JSON.stringify({ type: 'NEW_VISITOR', visitor })}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

export function broadcastOverstayAlert(alertData: any) {
  const payload = `data: ${JSON.stringify({ type: 'OVERSTAY_ALERT', ...alertData })}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

let activePublicTunnelUrl: string | null = null;

/**
 * POST /api/checkin-sessions/tunnel-url
 * Registers an active public internet tunnel URL (for 4G/5G mobile data visitors)
 */
export function setTunnelUrl(req: Request, res: Response): void {
  const { url } = req.body;
  if (url && typeof url === 'string') {
    activePublicTunnelUrl = url.trim();
    console.log('[Bitnox Backend] Live Public Internet Tunnel Registered:', activePublicTunnelUrl);
  }
  res.json({ success: true, public_tunnel_url: activePublicTunnelUrl });
}

/**
 * GET /api/checkin-sessions/network-info
 * Returns server LAN IP, public tunnel URL, and suggested network URLs for QR codes
 */
export function getNetworkInfo(req: Request, res: Response): void {
  const lanIp = getLocalNetworkIp();
  const rawProto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
  const proto = rawProto.split(',')[0].trim();
  const rawHost = (req.headers['x-forwarded-host'] as string) || req.headers.host || '';
  const host = rawHost.split(',')[0].trim();
  const isCloud = host && !host.includes('localhost') && !host.includes('127.0.0.1');
  const cloudUrl = isCloud ? `${proto}://${host}` : undefined;
  const effectiveBase = activePublicTunnelUrl || cloudUrl || `http://${lanIp}:5180`;

  res.json({
    lan_ip: lanIp,
    web_port: 5180,
    api_port: 5000,
    public_tunnel_url: activePublicTunnelUrl || cloudUrl,
    suggested_terminal_url: effectiveBase,
    suggested_checkin_url_prefix: `${effectiveBase}/checkin/session/`,
  });
}

/**
 * POST /api/checkin-sessions
 * Generates a fresh QR session token for the reception terminal.
 * The terminal UI rotates the displayed code every 90 seconds for physical security,
 * while the session itself in the database is valid for 24 hours so visitors never get timed out.
 */
export async function createSession(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { kiosk_device_id } = req.body;
    const token = crypto.randomBytes(16).toString('hex');
    // Display rotation timer for the kiosk screen (300 seconds / 5 minutes for scan stability)
    const KIOSK_DISPLAY_ROTATION_SECONDS = 300;
    const kioskDisplayExpiry = new Date(Date.now() + KIOSK_DISPLAY_ROTATION_SECONDS * 1000);
    // Real session lifetime in DB (24 hours) - visitor can take their time to fill
    const sessionLifetimeExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const session = await prisma.checkInSession.create({
      data: {
        token,
        kiosk_device_id: kiosk_device_id || 'front-desk-terminal',
        created_by_user_id: req.user?.id || null,
        expires_at: sessionLifetimeExpiry,
        is_active: true,
      },
    });

    const lanIp = getLocalNetworkIp();
    const rawProto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
    const proto = rawProto.split(',')[0].trim();
    const rawHost = (req.headers['x-forwarded-host'] as string) || req.headers.host || '';
    const host = rawHost.split(',')[0].trim();
    const isCloud = host && !host.includes('localhost') && !host.includes('127.0.0.1');
    const cloudUrl = isCloud ? `${proto}://${host}` : undefined;
    const effectiveBase = activePublicTunnelUrl || cloudUrl || `http://${lanIp}:5180`;
    const networkCheckinUrl = `${effectiveBase}/checkin/session/${session.token}`;

    res.status(201).json({
      session,
      token: session.token,
      // Pass kiosk display expiry to frontend for the 90s visual countdown bar
      expires_at: kioskDisplayExpiry.toISOString(),
      lan_ip: lanIp,
      public_tunnel_url: activePublicTunnelUrl || cloudUrl,
      checkin_url: `/checkin/session/${session.token}`,
      network_checkin_url: networkCheckinUrl,
    });
  } catch (error) {
    console.error('Error creating checkin session:', error);
    res.status(500).json({ error: 'Failed to generate QR check-in session.' });
  }
}

/**
 * GET /api/checkin-sessions/:token
 * Public endpoint called by visitor phone on load to validate token & load staff metadata.
 * Once scanned and loaded, visitor is guaranteed a full completion window with NO time limit.
 */
export async function getSessionStatus(req: Request, res: Response): Promise<void> {
  try {
    const token = req.params.token as string;
    if (!token) {
      res.status(400).json({ valid: false, error: 'Token is required.' });
      return;
    }

    const session = await prisma.checkInSession.findUnique({
      where: { token },
      select: {
        id: true,
        token: true,
        expires_at: true,
        is_active: true,
        kiosk_device_id: true,
        created_at: true,
      },
    });

    if (!session) {
      res.status(404).json({ valid: false, reason: 'not_found', error: 'Check-in code not found.' });
      return;
    }

    if (!session.is_active) {
      res.status(410).json({
        valid: false,
        reason: 'already_completed',
        error: 'This check-in code has already been used. Please scan the current code displayed at the reception desk.',
      });
      return;
    }

    // Once the QR code is scanned, the visitor has unlimited time to fill their data.
    // Extend expiry by 24 hours so submitting is completely untimed.
    const untimedExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await prisma.checkInSession.update({
      where: { id: session.id },
      data: { expires_at: untimedExpiry },
    });

    // Load available staff list and office settings for visitor convenience
    const [staffList, settings] = await Promise.all([
      prisma.staff.findMany({
        select: { id: true, name: true, department: true, role_title: true },
        orderBy: { name: 'asc' },
      }),
      prisma.systemSettings.findUnique({
        where: { id: 'default' },
        select: { office_name: true, tech_institute_name: true, dry_cleaning_name: true },
      }),
    ]);

    res.json({
      valid: true,
      token: session.token,
      expires_at: untimedExpiry,
      kiosk_device_id: session.kiosk_device_id,
      staff: staffList,
      settings: settings || {
        office_name: 'Bitnoxsolution Reception',
        tech_institute_name: 'Technology Training Institute',
        dry_cleaning_name: 'Dry Cleaning Service',
      },
    });
  } catch (error) {
    console.error('Error retrieving checkin session status:', error);
    res.status(500).json({ valid: false, error: 'Failed to validate check-in session.' });
  }
}

/**
 * POST /api/checkin-sessions/:token/submit
 * Public endpoint called when visitor taps "Check In" on their phone.
 * Not time bound as long as session is active and valid.
 */
export async function submitSelfCheckIn(req: Request, res: Response): Promise<void> {
  try {
    const token = req.params.token as string;
    const clientIp = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';

    if (isRateLimited(clientIp)) {
      res.status(429).json({ error: 'Too many check-in attempts. Please wait a moment.' });
      return;
    }

    // Validate token exists and has not already been used
    const session = await prisma.checkInSession.findUnique({
      where: { token },
    });

    if (!session) {
      res.status(404).json({ error: 'Invalid check-in session token.' });
      return;
    }

    if (!session.is_active) {
      res.status(410).json({
        error: 'This check-in session has already been completed. Thank you!',
      });
      return;
    }

    // Allow submission anytime within 24 hours of scan/creation
    const maxAgeMs = 24 * 60 * 60 * 1000;
    const sessionAge = Date.now() - new Date(session.created_at).getTime();
    if (sessionAge > maxAgeMs && new Date() > session.expires_at) {
      res.status(410).json({
        error: 'This check-in session has expired. Please scan the current QR code on the reception screen.',
      });
      return;
    }

    const {
      full_name,
      phone_number,
      email,
      department,
      purpose_of_visit,
      staff_to_see_id,
      services_requested,
      expected_duration,
      remarks,
    } = req.body;

    if (!full_name || !phone_number || !department || !purpose_of_visit) {
      res.status(400).json({
        error: 'Please fill in required fields: Full Name, Phone Number, Department, and Purpose of Visit.',
      });
      return;
    }

    // Find fall-back user id for audit/relation if session has none
    let creatorUserId = session.created_by_user_id;
    if (!creatorUserId) {
      const defaultUser = await prisma.user.findFirst({
        where: { role: { in: ['Receptionist', 'Admin'] } },
        select: { id: true },
      });
      creatorUserId = defaultUser?.id || 'system';
    }

    // Create Visitor Record
    const visitor = await prisma.visitor.create({
      data: {
        full_name: full_name.trim(),
        phone_number: phone_number.trim(),
        email: email ? email.trim() : null,
        department,
        purpose_of_visit,
        staff_to_see_id: staff_to_see_id || null,
        services_requested: services_requested ? services_requested.trim() : null,
        expected_duration: expected_duration || null,
        status: 'In Progress',
        check_in_method: 'QR Self Check-In',
        remarks: remarks ? remarks.trim() : null,
        created_by_user_id: creatorUserId,
        arrival_datetime: new Date(),
      },
      include: {
        staff_to_see: true,
        created_by_user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Mark session as used and deactivate to prevent bookmarking or remote re-submission
    await prisma.checkInSession.update({
      where: { id: session.id },
      data: {
        used_count: { increment: 1 },
        is_active: false,
      },
    });

    // Write audit log
    await logAudit({
      userId: creatorUserId,
      action: 'check_in',
      targetVisitorId: visitor.id,
      details: {
        method: 'QR Self Check-In',
        kiosk_device_id: session.kiosk_device_id,
        full_name: visitor.full_name,
        department: visitor.department,
        purpose: visitor.purpose_of_visit,
        arrival_datetime: visitor.arrival_datetime,
      },
    });

    // Broadcast instant real-time event to reception terminals
    broadcastNewVisitor(visitor);

    res.status(201).json({
      success: true,
      message: 'Check-in successful!',
      visitor,
    });
  } catch (error) {
    console.error('Error processing self check-in:', error);
    res.status(500).json({ error: 'Failed to complete self check-in. Please try again.' });
  }
}

/**
 * GET /api/checkin-sessions/stream
 * Server-Sent Events (SSE) push stream for live reception terminal updates
 */
export function streamLiveEvents(req: Request, res: Response): void {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: new Date() })}\n\n`);

  sseClients.add(res);

  // Keep-alive heartbeat every 20 seconds
  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch {
      clearInterval(heartbeat);
      sseClients.delete(res);
    }
  }, 20000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
  });
}

/**
 * GET /api/checkin-sessions/recent
 * Returns the recent self-checked-in visitors today for the terminal feed
 */
export async function getRecentCheckIns(req: Request, res: Response): Promise<void> {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

    const visitors = await prisma.visitor.findMany({
      where: {
        arrival_datetime: { gte: startOfToday },
        check_in_method: 'QR Self Check-In',
      },
      orderBy: { arrival_datetime: 'desc' },
      take: 10,
      include: {
        staff_to_see: true,
      },
    });

    res.json(visitors);
  } catch (error) {
    console.error('Error fetching recent self check-ins:', error);
    res.status(500).json({ error: 'Failed to fetch recent self check-ins.' });
  }
}
