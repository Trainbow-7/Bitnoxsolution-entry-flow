// Vercel Serverless API Handler for Bitnox Visitor Management System (CommonJS / Node.js)
// Enables real-time cross-device visitor sync on *.vercel.app

const INITIAL_STAFF = [
  { id: 'staff-femi', name: 'Engr Oluwafemi Faleye', email: 'femi.faleye@bitnox.com', phone: '+234 803 123 4567', department: 'Tech Institute', role_title: 'CEO & Managing Director', is_active: true },
  { id: 'staff-ben', name: 'Mr. Ben Sam', email: 'ben.sam@bitnox.com', phone: '+234 802 234 5678', department: 'Tech Institute', role_title: 'AI/ML & Software Engineering Instructor', is_active: true },
  { id: 'staff-usman', name: 'Mr. Oyeboade Usman O.', email: 'usman.oyeboade@bitnox.com', phone: '+234 805 345 6789', department: 'Tech Institute', role_title: 'Data Analytics Instructor', is_active: true },
  { id: 'staff-sarah', name: 'Sarah Jenkins', email: 'sarah.j@bitnox.com', phone: '+1 (555) 234-5678', department: 'Tech Institute', role_title: 'Web Dev Instructor & Career Coach', is_active: true },
  { id: 'staff-marcus', name: 'Marcus Brody', email: 'marcus.b@bitnox.com', phone: '+1 (555) 345-6789', department: 'Tech Institute', role_title: 'Admissions & Enrollment Advisor', is_active: true },
  { id: 'staff-elena', name: 'Elena Gomez', email: 'elena.g@bitnox.com', phone: '+1 (555) 456-7890', department: 'Dry Cleaning', role_title: 'Head Garment Specialist & Quality Lead', is_active: true },
  { id: 'staff-david', name: 'David Kim', email: 'david.k@bitnox.com', phone: '+1 (555) 567-8901', department: 'Dry Cleaning', role_title: 'Operations & Laundry Facility Manager', is_active: true },
];

function autoRouteStaff(visData) {
  if (visData && visData.staff_to_see_id) {
    const directStaff = INITIAL_STAFF.find(
      (s) => s.id === visData.staff_to_see_id || s.name.toLowerCase() === String(visData.staff_to_see_id).toLowerCase()
    );
    if (directStaff) return directStaff;
  }
  const text = `${visData.purpose_of_visit || ''} ${visData.services_requested || ''} ${visData.remarks || ''}`.toLowerCase();
  const dept = visData.department;

  if (dept === 'Dry Cleaning' || text.includes('dry clean') || text.includes('laundry')) {
    if (text.includes('silk') || text.includes('wool') || text.includes('gown') || text.includes('suit') || text.includes('delicate') || text.includes('elena')) {
      return INITIAL_STAFF[5]; // Elena Gomez
    }
    return INITIAL_STAFF[6]; // David Kim
  }

  // 1. AI/ML, Machine Learning, Deep Learning, Lectures with Mr Ben
  if (
    text.includes('ai') ||
    text.includes('ml') ||
    text.includes('machine learning') ||
    text.includes('deep learning') ||
    text.includes('neural') ||
    text.includes('python') ||
    text.includes('lecture') ||
    text.includes('ben')
  ) {
    return INITIAL_STAFF[1]; // Mr. Ben Sam
  }

  // 2. Data Analytics, PowerBI, SQL
  if (
    text.includes('data') ||
    text.includes('analytics') ||
    text.includes('powerbi') ||
    text.includes('sql') ||
    text.includes('tableau') ||
    text.includes('excel') ||
    text.includes('usman') ||
    text.includes('oyeboade')
  ) {
    return INITIAL_STAFF[2]; // Mr. Oyeboade Usman O.
  }

  // 3. Web Dev / Frontend
  if (
    text.includes('web') ||
    text.includes('react') ||
    text.includes('javascript') ||
    text.includes('frontend') ||
    text.includes('full-stack') ||
    text.includes('coding') ||
    text.includes('sarah')
  ) {
    return INITIAL_STAFF[3]; // Sarah Jenkins
  }

  // 4. Admissions / Enrollment / Curriculum
  if (
    text.includes('admission') ||
    text.includes('enroll') ||
    text.includes('inquiry') ||
    text.includes('syllabus') ||
    text.includes('marcus')
  ) {
    return INITIAL_STAFF[4]; // Marcus Brody
  }

  // 5. CEO / Managing Director
  if (
    text.includes('founder') ||
    text.includes('ceo') ||
    text.includes('director') ||
    text.includes('partner') ||
    text.includes('executive') ||
    text.includes('femi') ||
    text.includes('faleye')
  ) {
    return INITIAL_STAFF[0]; // Engr Oluwafemi Faleye
  }

  // Default to Mr. Ben Sam for Tech Institute students receiving lectures
  if (visData.purpose_of_visit === 'Existing Trainee' || visData.purpose_of_visit === 'Prospective Student') {
    return INITIAL_STAFF[1];
  }

  return INITIAL_STAFF[1];
}

const globalVisitors = [
  {
    id: 'vis-tayo-deola-1',
    full_name: 'TAYO DEOLA',
    phone_number: '+2348035472156',
    email: 'tayo.deola@bitnox.edu.ng',
    arrival_datetime: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    purpose_of_visit: 'Existing Trainee',
    department: 'Tech Institute',
    staff_to_see_id: 'staff-ben',
    staff_to_see: INITIAL_STAFF[1],
    services_requested: 'AI/ML Lecture Series & Deep Learning Practical Session',
    expected_duration: '<15 min',
    status: 'In Progress',
    remarks: 'Enrolled student attending AI/ML lecture module with Mr. Ben.',
    check_in_method: 'Manual Entry',
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: 'vis-temitayo-samson-2',
    full_name: 'TEMITAYO SAMSON OYEDEJI',
    phone_number: '+2348035472186',
    email: 'tplusonice@gmail.com',
    arrival_datetime: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    purpose_of_visit: 'Prospective Student',
    department: 'Tech Institute',
    staff_to_see_id: 'staff-ben',
    staff_to_see: INITIAL_STAFF[1],
    services_requested: 'AI/ML Curriculum Evaluation & Demo Lecture Observation',
    expected_duration: '15-30 min',
    status: 'In Progress',
    remarks: 'Prospective trainee receiving introductory AI/ML lectures with Mr. Ben.',
    check_in_method: 'Manual Entry',
    created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
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
    // Route 0a: POST /auth/login (Instant serverless auth for live demo)
    if (method === 'POST' && pathname === '/auth/login') {
      const body = await parseBody(req);
      const email = String(body.email || '').toLowerCase().trim();
      let user = null;
      if (email.includes('admin')) {
        user = {
          id: 'usr-admin',
          name: 'Engr Oluwafemi Faleye',
          email: 'admin@bitnox.com',
          role: 'Admin',
          linked_staff_id: 'staff-femi',
          linked_staff: INITIAL_STAFF[0],
        };
      } else if (email.includes('recep')) {
        user = {
          id: 'usr-recep',
          name: 'Kikelomo Oluwanishola',
          email: 'receptionist@bitnox.com',
          role: 'Receptionist',
          linked_staff_id: null,
          linked_staff: null,
        };
      } else if (email.includes('usman')) {
        user = {
          id: 'usr-usman',
          name: 'Mr. Oyeboade Usman O.',
          email: 'usman.oyeboade@bitnox.com',
          role: 'Staff',
          linked_staff_id: 'staff-usman',
          linked_staff: INITIAL_STAFF[2],
        };
      } else if (email.includes('elena')) {
        user = {
          id: 'usr-elena',
          name: 'Elena Gomez',
          email: 'elena.gomez@bitnox.com',
          role: 'Staff',
          linked_staff_id: 'staff-elena',
          linked_staff: INITIAL_STAFF[5],
        };
      } else {
        user = {
          id: 'usr-ben',
          name: 'Mr. Ben Sam',
          email: 'ben.sam@bitnox.com',
          role: 'Staff',
          linked_staff_id: 'staff-ben',
          linked_staff: INITIAL_STAFF[1],
        };
      }
      return sendJson(200, {
        token: `jwt-demo-${user.id}-${Date.now()}`,
        user,
      });
    }

    // Route 0b: GET /auth/me
    if (method === 'GET' && pathname === '/auth/me') {
      const authHeader = String(req.headers.authorization || '').toLowerCase();
      let user = {
        id: 'usr-recep',
        name: 'Kikelomo Oluwanishola',
        email: 'receptionist@bitnox.com',
        role: 'Receptionist',
        linked_staff_id: null,
        linked_staff: null,
      };
      if (authHeader.includes('admin')) {
        user = {
          id: 'usr-admin',
          name: 'Engr Oluwafemi Faleye',
          email: 'admin@bitnox.com',
          role: 'Admin',
          linked_staff_id: 'staff-femi',
          linked_staff: INITIAL_STAFF[0],
        };
      } else if (authHeader.includes('usman')) {
        user = {
          id: 'usr-usman',
          name: 'Mr. Oyeboade Usman O.',
          email: 'usman.oyeboade@bitnox.com',
          role: 'Staff',
          linked_staff_id: 'staff-usman',
          linked_staff: INITIAL_STAFF[2],
        };
      } else if (authHeader.includes('elena')) {
        user = {
          id: 'usr-elena',
          name: 'Elena Gomez',
          email: 'elena.gomez@bitnox.com',
          role: 'Staff',
          linked_staff_id: 'staff-elena',
          linked_staff: INITIAL_STAFF[5],
        };
      } else if (authHeader.includes('ben') || authHeader.includes('staff')) {
        user = {
          id: 'usr-ben',
          name: 'Mr. Ben Sam',
          email: 'ben.sam@bitnox.com',
          role: 'Staff',
          linked_staff_id: 'staff-ben',
          linked_staff: INITIAL_STAFF[1],
        };
      }
      return sendJson(200, { user });
    }

    // Route 1: GET /checkin-sessions/recent (Live Feed)
    if (method === 'GET' && pathname === '/checkin-sessions/recent') {
      const recent = [...globalVisitors]
        .sort((a, b) => new Date(b.arrival_datetime).getTime() - new Date(a.arrival_datetime).getTime())
        .slice(0, 20);
      return sendJson(200, recent);
    }

    // Route 2: POST /checkin-sessions/push-visitor (Universal Sync)
    if (method === 'POST' && pathname === '/checkin-sessions/push-visitor') {
      const body = await parseBody(req);
      const vis = body.visitor;
      if (!vis || !vis.full_name) {
        return sendJson(400, { error: 'Visitor data is required' });
      }

      const routedStaff = autoRouteStaff(vis);
      const hydrated = {
        id: vis.id || `vis-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        full_name: String(vis.full_name).trim(),
        phone_number: String(vis.phone_number || '').trim(),
        email: vis.email ? String(vis.email).trim() : null,
        arrival_datetime: vis.arrival_datetime || new Date().toISOString(),
        purpose_of_visit: vis.purpose_of_visit || 'General Inquiry',
        department: vis.department === 'Dry Cleaning' ? 'Dry Cleaning' : 'Tech Institute',
        staff_to_see_id: (routedStaff && routedStaff.id) || vis.staff_to_see_id || 'staff-ben',
        staff_to_see: routedStaff || INITIAL_STAFF[1],
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
      const routedStaff = autoRouteStaff(body);

      const newVisitor = {
        id: `vis-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        full_name: String(body.full_name || 'Visitor').trim(),
        phone_number: String(body.phone_number || '').trim(),
        email: body.email ? String(body.email).trim() : null,
        arrival_datetime: new Date().toISOString(),
        purpose_of_visit: body.purpose_of_visit || 'Existing Trainee',
        department: body.department === 'Dry Cleaning' ? 'Dry Cleaning' : 'Tech Institute',
        staff_to_see_id: routedStaff ? routedStaff.id : 'staff-ben',
        staff_to_see: routedStaff || INITIAL_STAFF[1],
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

    // Route 7b: GET /visitors/my-visitors (Assigned staff visitors)
    if (method === 'GET' && (pathname === '/visitors/my-visitors' || pathname === '/visitors/my-assigned')) {
      const searchParam = (url.searchParams.get('search') || '').toLowerCase().trim();
      const statusParam = url.searchParams.get('status') || '';
      const staffIdParam = url.searchParams.get('staff_to_see_id') || '';
      const authHeader = String(req.headers.authorization || '').toLowerCase();

      let targetStaffId = staffIdParam;
      let targetName = '';

      if (!targetStaffId) {
        if (authHeader.includes('ben') || authHeader.includes('usr-ben')) {
          targetStaffId = 'staff-ben';
          targetName = 'ben';
        } else if (authHeader.includes('usman') || authHeader.includes('usr-usman')) {
          targetStaffId = 'staff-usman';
          targetName = 'usman';
        } else if (authHeader.includes('elena') || authHeader.includes('usr-elena')) {
          targetStaffId = 'staff-elena';
          targetName = 'elena';
        } else if (authHeader.includes('admin') || authHeader.includes('usr-admin')) {
          targetStaffId = '';
        } else {
          // Default to Mr. Ben Sam
          targetStaffId = 'staff-ben';
          targetName = 'ben';
        }
      } else if (targetStaffId.toLowerCase().includes('ben')) {
        targetName = 'ben';
      }

      let matches = globalVisitors.filter((v) => {
        // Status filter
        if (statusParam && statusParam !== 'All') {
          if (v.status !== statusParam) return false;
        }

        // Search filter
        if (searchParam) {
          const nameMatch = v.full_name?.toLowerCase().includes(searchParam);
          const phoneMatch = v.phone_number?.toLowerCase().includes(searchParam);
          const emailMatch = v.email?.toLowerCase().includes(searchParam);
          const serviceMatch = v.services_requested?.toLowerCase().includes(searchParam);
          if (!nameMatch && !phoneMatch && !emailMatch && !serviceMatch) return false;
        }

        // Staff scoping
        if (targetStaffId) {
          const vStaffId = v.staff_to_see_id || v.staff_to_see?.id;
          const vStaffName = (v.staff_to_see?.name || '').toLowerCase();
          const idMatch =
            vStaffId === targetStaffId ||
            (targetStaffId === 'staff-ben' && (vStaffId === 'b45717ff-ff1f-460a-893f-847e69f500f2' || vStaffId === 'staff-ben-1'));
          const nameMatch = targetName && vStaffName.includes(targetName);
          const lectureMatch =
            targetName === 'ben' &&
            ((v.services_requested || '').toLowerCase().includes('ai') ||
              (v.services_requested || '').toLowerCase().includes('ml') ||
              (v.remarks || '').toLowerCase().includes('ben') ||
              (v.purpose_of_visit === 'Existing Trainee' && v.department === 'Tech Institute'));

          return idMatch || nameMatch || lectureMatch;
        }

        return true;
      });

      return sendJson(200, {
        visitors: matches,
        total: matches.length,
        page: 1,
        limit: 50,
        total_pages: Math.ceil(matches.length / 50) || 1,
      });
    }

    // Route 7c: GET /visitors (Full list with filters)
    if (method === 'GET' && pathname === '/visitors') {
      const searchParam = (url.searchParams.get('search') || '').toLowerCase().trim();
      const statusParam = url.searchParams.get('status') || '';
      const deptParam = url.searchParams.get('department') || '';
      const purposeParam = url.searchParams.get('purpose_of_visit') || '';
      const staffParam = url.searchParams.get('staff_id') || url.searchParams.get('staff_to_see_id') || '';
      const page = parseInt(url.searchParams.get('page') || '1', 10);
      const limit = parseInt(url.searchParams.get('limit') || '20', 10);

      let matches = globalVisitors.filter((v) => {
        if (statusParam && statusParam !== 'All' && v.status !== statusParam) return false;
        if (deptParam && deptParam !== 'All' && v.department !== deptParam) return false;
        if (purposeParam && purposeParam !== 'All' && v.purpose_of_visit !== purposeParam) return false;
        if (staffParam && staffParam !== 'All') {
          const sId = v.staff_to_see_id || v.staff_to_see?.id;
          if (sId !== staffParam && !v.staff_to_see?.name?.toLowerCase().includes(staffParam.toLowerCase())) return false;
        }
        if (searchParam) {
          const match =
            v.full_name?.toLowerCase().includes(searchParam) ||
            v.phone_number?.toLowerCase().includes(searchParam) ||
            (v.email && v.email.toLowerCase().includes(searchParam)) ||
            (v.services_requested && v.services_requested.toLowerCase().includes(searchParam));
          if (!match) return false;
        }
        return true;
      });

      const start = (page - 1) * limit;
      const paginated = matches.slice(start, start + limit);

      return sendJson(200, {
        visitors: paginated,
        total: matches.length,
        page,
        limit,
        total_pages: Math.ceil(matches.length / limit) || 1,
      });
    }

    // Route 8: POST /visitors/checkin (Manual Desk Check-In)
    if (method === 'POST' && pathname === '/visitors/checkin') {
      const body = await parseBody(req);
      const routedStaff = autoRouteStaff(body);

      const newVisitor = {
        id: `vis-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        full_name: String(body.full_name || 'Visitor').trim(),
        phone_number: String(body.phone_number || '').trim(),
        email: body.email ? String(body.email).trim() : null,
        arrival_datetime: new Date().toISOString(),
        purpose_of_visit: body.purpose_of_visit || 'General',
        department: body.department === 'Dry Cleaning' ? 'Dry Cleaning' : 'Tech Institute',
        staff_to_see_id: routedStaff ? routedStaff.id : 'staff-ben',
        staff_to_see: routedStaff || INITIAL_STAFF[1],
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

    // Route 9b: POST /visitors/:id/cancel
    if (method === 'POST' && pathname.includes('/cancel')) {
      const parts = pathname.split('/');
      const id = parts[2];
      const visitor = globalVisitors.find((v) => v.id === id);
      if (visitor) {
        visitor.status = 'Cancelled';
        visitor.checkout_datetime = new Date().toISOString();
        visitor.updated_at = new Date().toISOString();
        return sendJson(200, { visitor, message: 'Visitor marked as cancelled.' });
      }
      return sendJson(404, { error: 'Visitor not found' });
    }

    // Route 9c: PUT /visitors/:id
    if (method === 'PUT' && pathname.startsWith('/visitors/')) {
      const parts = pathname.split('/');
      const id = parts[2];
      const body = await parseBody(req);
      const visitor = globalVisitors.find((v) => v.id === id);
      if (visitor) {
        Object.assign(visitor, body, { updated_at: new Date().toISOString() });
        return sendJson(200, visitor);
      }
      return sendJson(404, { error: 'Visitor not found' });
    }

    // Route 10: GET /staff
    if (method === 'GET' && pathname === '/staff') {
      return sendJson(200, INITIAL_STAFF);
    }

    // Route 11: GET /dashboard/stats
    if (method === 'GET' && pathname === '/dashboard/stats') {
      const now = new Date();
      const todayStr = now.toDateString();

      const todayVisitors = globalVisitors.filter(
        (v) => new Date(v.arrival_datetime).toDateString() === todayStr
      );
      const currently_in_office = globalVisitors.filter((v) => v.status === 'In Progress').length;
      const today_completed = todayVisitors.filter((v) => v.status === 'Completed').length;
      const today_cancelled = todayVisitors.filter((v) => v.status === 'Cancelled').length;

      const hourCounts = {};
      for (let h = 8; h <= 18; h++) hourCounts[h] = 0;
      globalVisitors.forEach((v) => {
        const hour = new Date(v.arrival_datetime).getHours();
        if (hourCounts[hour] !== undefined) hourCounts[hour]++;
      });

      const peak_hours = Object.entries(hourCounts).map(([h, count]) => {
        const hourNum = Number(h);
        const ampm = hourNum >= 12 ? 'PM' : 'AM';
        const displayH = hourNum > 12 ? hourNum - 12 : hourNum === 0 ? 12 : hourNum;
        return { hour: hourNum, label: `${displayH} ${ampm}`, count };
      });

      const purposeMap = {};
      globalVisitors.forEach((v) => {
        purposeMap[v.purpose_of_visit] = (purposeMap[v.purpose_of_visit] || 0) + 1;
      });
      const by_purpose = Object.entries(purposeMap).map(([purpose, count]) => ({
        purpose,
        count,
      }));

      const techCount = globalVisitors.filter((v) => v.department === 'Tech Institute').length;
      const dryCleanCount = globalVisitors.filter((v) => v.department === 'Dry Cleaning').length;
      const by_department = [
        { department: 'Tech Institute', count: techCount },
        { department: 'Dry Cleaning', count: dryCleanCount },
      ];

      const staff_workload = INITIAL_STAFF.map((s) => ({
        staff_id: s.id,
        staff_name: s.name,
        department: s.department,
        role_title: s.role_title || '',
        count: globalVisitors.filter((v) => v.staff_to_see_id === s.id).length,
      }));

      const dateMap = {};
      for (let i = 13; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 3600 * 1000).toISOString().split('T')[0];
        dateMap[d] = { tech: 0, clean: 0 };
      }
      globalVisitors.forEach((v) => {
        const d = new Date(v.arrival_datetime).toISOString().split('T')[0];
        if (!dateMap[d]) dateMap[d] = { tech: 0, clean: 0 };
        if (v.department === 'Tech Institute') dateMap[d].tech++;
        else dateMap[d].clean++;
      });

      const visits_per_day = Object.entries(dateMap)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-14)
        .map(([date, counts]) => ({
          date,
          count: counts.tech + counts.clean,
          tech_institute: counts.tech,
          dry_cleaning: counts.clean,
        }));

      const todayTotal = todayVisitors.length || globalVisitors.length;

      return sendJson(200, {
        today_total: todayTotal,
        currently_in_office,
        today_completed,
        today_cancelled,
        visits_per_day,
        by_purpose,
        by_department,
        peak_hours,
        staff_workload,
        total_visitors_today: todayTotal,
        tech_institute_visitors_today: techCount,
        dry_cleaning_visitors_today: dryCleanCount,
        average_visit_duration_minutes: 24,
      });
    }

    // Route 12: GET /visitors/overstay-alerts
    if (method === 'GET' && pathname === '/visitors/overstay-alerts') {
      return sendJson(200, []);
    }

    // Default 404 for unhandled API endpoints
    return sendJson(404, { error: `Endpoint not found: ${method} ${pathname}` });
  } catch (err) {
    console.error('[Vercel Serverless API Error]:', err);
    return sendJson(500, { error: err.message || 'Internal Server Error' });
  }
};
