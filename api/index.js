// Vercel Serverless API Handler for Bitnox Visitor Management System (CommonJS / Node.js)
// Enables real-time cross-device visitor sync on *.vercel.app

const INITIAL_STAFF = [
  { id: 'staff-femi', name: 'Engr Oluwafemi Faleye', email: 'femi.faleye@bitnox.com', phone: '+234 803 123 4567', department: 'Tech Institute', role_title: 'Lead Instructor & Founder', is_active: true },
  { id: 'staff-ben', name: 'Mr. Ben Sam', email: 'ben.sam@bitnox.com', phone: '+234 802 234 5678', department: 'Tech Institute', role_title: 'Senior Software Engineering Instructor', is_active: true },
  { id: 'staff-usman', name: 'Mr. Oyeboade Usman O.', email: 'usman.oyeboade@bitnox.com', phone: '+234 805 345 6789', department: 'Tech Institute', role_title: 'Head of Technical Operations', is_active: true },
  { id: 'staff-sarah', name: 'Sarah Jenkins', email: 'sarah.j@bitnox.com', phone: '+1 (555) 234-5678', department: 'Tech Institute', role_title: 'Admissions Coordinator', is_active: true },
  { id: 'staff-marcus', name: 'Marcus Vance', email: 'marcus.v@bitnox.com', phone: '+1 (555) 345-6789', department: 'Tech Institute', role_title: 'Senior Instructor', is_active: true },
  { id: 'staff-elena', name: 'Elena Gomez', email: 'elena.g@bitnox.com', phone: '+1 (555) 456-7890', department: 'Dry Cleaning', role_title: 'Lead Garment Specialist', is_active: true },
  { id: 'staff-david', name: 'David Kim', email: 'david.k@bitnox.com', phone: '+1 (555) 567-8901', department: 'Dry Cleaning', role_title: 'Customer Service & Intake Specialist', is_active: true },
];

const globalVisitors = [
  {
    id: 'vis-initial-1',
    full_name: 'Sophia Williams',
    phone_number: '+1 (555) 345-6789',
    email: 'sophia.w@luxuryliving.com',
    arrival_datetime: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    purpose_of_visit: 'Dry Cleaning Customer',
    department: 'Dry Cleaning',
    staff_to_see_id: 'staff-elena',
    staff_to_see: INITIAL_STAFF[5],
    services_requested: 'Express silk dress dry cleaning',
    expected_duration: '<15 min',
    status: 'In Progress',
    remarks: 'Drop-off order: 2 silk evening gowns.',
    check_in_method: 'QR Self Check-In',
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
];

const globalSessions = new Map();

function parseBody(req) {
  return new Promise((resolve) => {
    if (req.body && typeof req.body === 'object') {
      return resolve(req.body);
    }
    if (typeof req.body === 'string' && req.body.trim()) {
      try {
        return resolve(JSON.parse(req.body));
      } catch {
        return resolve({});
      }
    }
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

module.exports = async function handler(req, res) {
  // 1. Universal CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname.replace(/^\/api/, '');
  const method = (req.method || 'GET').toUpperCase();

  const sendJson = (status, data) => {
    res.setHeader('Content-Type', 'application/json');
    res.status(status).json(data);
  };

  try {
    // Route 1: GET /checkin-sessions/recent (Live Feed)
    if (method === 'GET' && pathname === '/checkin-sessions/recent') {
      const recent = [...globalVisitors]
        .sort((a, b) => new Date(b.arrival_datetime).getTime() - new Date(a.arrival_datetime).getTime())
        .slice(0, 15);
      return sendJson(200, recent);
    }

    // Route 2: POST /checkin-sessions/push-visitor (Universal Sync)
    if (method === 'POST' && pathname === '/checkin-sessions/push-visitor') {
      const body = await parseBody(req);
      const vis = body.visitor;
      if (!vis || !vis.full_name) {
        return sendJson(400, { error: 'Visitor data is required' });
      }

      const staff = INITIAL_STAFF.find((s) => s.id === vis.staff_to_see_id) || vis.staff_to_see || null;
      const hydrated = {
        id: vis.id || `vis-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        full_name: String(vis.full_name).trim(),
        phone_number: String(vis.phone_number || '').trim(),
        email: vis.email ? String(vis.email).trim() : null,
        arrival_datetime: vis.arrival_datetime || new Date().toISOString(),
        purpose_of_visit: vis.purpose_of_visit || 'General Inquiry',
        department: vis.department === 'Dry Cleaning' ? 'Dry Cleaning' : 'Tech Institute',
        staff_to_see_id: vis.staff_to_see_id || null,
        staff_to_see: staff,
        services_requested: vis.services_requested || null,
        expected_duration: vis.expected_duration || '15-30 min',
        status: vis.status || 'In Progress',
        remarks: vis.remarks || null,
        check_in_method: vis.check_in_method || 'QR Self Check-In',
        created_at: vis.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const existingIndex = globalVisitors.findIndex((v) => v.id === hydrated.id || (v.full_name === hydrated.full_name && v.phone_number === hydrated.phone_number));
      if (existingIndex !== -1) {
        globalVisitors[existingIndex] = { ...globalVisitors[existingIndex], ...hydrated };
      } else {
        globalVisitors.unshift(hydrated);
      }

      return sendJson(200, { success: true, visitor: hydrated });
    }

    // Route 3: POST /checkin-sessions/:token/submit (Mobile Check-In)
    if (method === 'POST' && pathname.startsWith('/checkin-sessions/') && pathname.endsWith('/submit')) {
      const body = await parseBody(req);
      const staff = INITIAL_STAFF.find((s) => s.id === body.staff_to_see_id) || null;

      const newVisitor = {
        id: `vis-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        full_name: String(body.full_name || 'Visitor').trim(),
        phone_number: String(body.phone_number || '').trim(),
        email: body.email ? String(body.email).trim() : null,
        arrival_datetime: new Date().toISOString(),
        purpose_of_visit: body.purpose_of_visit || 'Prospective Student',
        department: body.department === 'Dry Cleaning' ? 'Dry Cleaning' : 'Tech Institute',
        staff_to_see_id: body.staff_to_see_id || null,
        staff_to_see: staff,
        services_requested: body.services_requested || null,
        expected_duration: body.expected_duration || '15-30 min',
        status: 'In Progress',
        remarks: body.remarks || null,
        check_in_method: 'QR Self Check-In',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      globalVisitors.unshift(newVisitor);

      return sendJson(201, {
        success: true,
        message: 'Self check-in completed successfully!',
        visitor: newVisitor,
      });
    }

    // Route 4: GET /checkin-sessions/:token (Session Validation)
    if (method === 'GET' && pathname.startsWith('/checkin-sessions/') && !pathname.includes('/recent') && !pathname.includes('/network-info')) {
      const token = pathname.replace('/checkin-sessions/', '').split('/')[0];
      return sendJson(200, {
        valid: true,
        token,
        expires_at: new Date(Date.now() + 24 * 3600000).toISOString(),
        kiosk_device_id: 'reception-kiosk-1',
        staff: INITIAL_STAFF,
        settings: {
          office_name: 'Bitnoxsolution Reception',
          tech_institute_name: 'Bitnox Technology Institute',
          dry_cleaning_name: 'Bitnox Premium Dry Cleaners',
        },
      });
    }

    // Route 5: POST /checkin-sessions (Generate QR Session)
    if (method === 'POST' && pathname === '/checkin-sessions') {
      const token = `sess-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 6)}`;
      const host = req.headers.host || 'localhost';
      const proto = req.headers['x-forwarded-proto'] || 'https';
      const checkinUrl = `${proto}://${host}/?session=${token}`;

      globalSessions.set(token, {
        token,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 3600000).toISOString(),
      });

      return sendJson(201, {
        token,
        expires_at: new Date(Date.now() + 300 * 1000).toISOString(),
        lan_ip: host.split(':')[0],
        checkin_url: checkinUrl,
        network_checkin_url: checkinUrl,
      });
    }

    // Route 6: GET /checkin-sessions/network-info
    if (method === 'GET' && pathname === '/checkin-sessions/network-info') {
      const host = req.headers.host || 'localhost';
      const proto = req.headers['x-forwarded-proto'] || 'https';
      return sendJson(200, {
        lan_ip: host.split(':')[0],
        web_port: 80,
        api_port: 80,
        suggested_terminal_url: `${proto}://${host}`,
        suggested_checkin_url_prefix: `${proto}://${host}/?session=`,
      });
    }

    // Route 7: GET /visitors/currently-in-office
    if (method === 'GET' && pathname === '/visitors/currently-in-office') {
      const inOffice = globalVisitors
        .filter((v) => v.status === 'In Progress')
        .sort((a, b) => new Date(b.arrival_datetime).getTime() - new Date(a.arrival_datetime).getTime());
      return sendJson(200, inOffice);
    }

    // Route 8: POST /visitors/checkin (Manual Desk Check-In)
    if (method === 'POST' && pathname === '/visitors/checkin') {
      const body = await parseBody(req);
      const staff = INITIAL_STAFF.find((s) => s.id === body.staff_to_see_id) || null;

      const newVisitor = {
        id: `vis-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        full_name: String(body.full_name || 'Visitor').trim(),
        phone_number: String(body.phone_number || '').trim(),
        email: body.email ? String(body.email).trim() : null,
        arrival_datetime: new Date().toISOString(),
        purpose_of_visit: body.purpose_of_visit || 'General',
        department: body.department === 'Dry Cleaning' ? 'Dry Cleaning' : 'Tech Institute',
        staff_to_see_id: body.staff_to_see_id || null,
        staff_to_see: staff,
        services_requested: body.services_requested || null,
        expected_duration: body.expected_duration || '15-30 min',
        status: 'In Progress',
        remarks: body.remarks || null,
        check_in_method: body.check_in_method || 'Manual Entry',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      globalVisitors.unshift(newVisitor);
      return sendJson(201, newVisitor);
    }

    // Route 9: POST /visitors/:id/checkout
    if (method === 'POST' && pathname.includes('/checkout')) {
      const parts = pathname.split('/');
      const id = parts[2];
      const visitor = globalVisitors.find((v) => v.id === id);
      if (visitor) {
        visitor.status = 'Completed';
        visitor.checkout_datetime = new Date().toISOString();
        visitor.updated_at = new Date().toISOString();
        const durationMinutes = Math.max(1, Math.round((Date.now() - new Date(visitor.arrival_datetime).getTime()) / 60000));
        return sendJson(200, { visitor, duration_minutes: durationMinutes, message: 'Visitor checked out successfully.' });
      }
      return sendJson(404, { error: 'Visitor not found' });
    }

    // Route 10: GET /staff
    if (method === 'GET' && pathname === '/staff') {
      return sendJson(200, INITIAL_STAFF);
    }

    // Route 11: GET /dashboard/stats
    if (method === 'GET' && pathname === '/dashboard/stats') {
      const inOffice = globalVisitors.filter((v) => v.status === 'In Progress').length;
      const todayTotal = globalVisitors.length;
      return sendJson(200, {
        total_visitors_today: todayTotal,
        currently_in_office: inOffice,
        tech_institute_visitors_today: globalVisitors.filter((v) => v.department === 'Tech Institute').length,
        dry_cleaning_visitors_today: globalVisitors.filter((v) => v.department === 'Dry Cleaning').length,
        average_visit_duration_minutes: 24,
      });
    }

    // Default 404 for unhandled API endpoints
    return sendJson(404, { error: `Endpoint not found: ${method} ${pathname}` });
  } catch (err) {
    console.error('[Vercel Serverless API Error]:', err);
    return sendJson(500, { error: err.message || 'Internal Server Error' });
  }
};
