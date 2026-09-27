import {
  AuthResponse,
  DashboardStats,
  ReportSummary,
  Staff,
  SystemSettings,
  User,
  Visitor,
  AuditLog,
  CheckInSession,
  SelfCheckInPayload,
  OverstayAlertData,
} from '../types';
import { broadcastCloudEvent } from '../utils/cloudSync';

const INITIAL_STAFF: Staff[] = [
  {
    id: 'staff-femi',
    name: 'Engr Oluwafemi Faleye',
    department: 'Tech Institute',
    role_title: 'CEO & Managing Director',
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: 'staff-ben',
    name: 'Mr. Ben Sam',
    department: 'Tech Institute',
    role_title: 'AI/ML Instructor',
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: 'staff-usman',
    name: 'Mr. Oyeboade Usman O.',
    department: 'Tech Institute',
    role_title: 'Data Analytics Instructor',
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: 'staff-sarah',
    name: 'Sarah Jenkins',
    department: 'Tech Institute',
    role_title: 'Web Dev Instructor & Career Coach',
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: 'staff-marcus',
    name: 'Marcus Brody',
    department: 'Tech Institute',
    role_title: 'Admissions & Enrollment Advisor',
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: 'staff-elena',
    name: 'Elena Gomez',
    department: 'Dry Cleaning',
    role_title: 'Head Garment Specialist & Quality Lead',
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: 'staff-david',
    name: 'David Chen',
    department: 'Dry Cleaning',
    role_title: 'Operations & Laundry Facility Manager',
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
];

const INITIAL_USERS: (User & { password: string })[] = [
  {
    id: 'usr-admin',
    name: 'Engr Oluwafemi Faleye',
    email: 'admin@bitnox.com',
    role: 'Admin',
    linked_staff_id: 'staff-femi',
    linked_staff: INITIAL_STAFF[0],
    password: 'admin123',
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: 'usr-recep',
    name: 'Kikelomo Oluwanishola',
    email: 'receptionist@bitnox.com',
    role: 'Receptionist',
    linked_staff_id: null,
    linked_staff: null,
    password: 'recep123',
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: 'usr-ben',
    name: 'Mr. Ben Sam',
    email: 'ben.sam@bitnox.com',
    role: 'Staff',
    linked_staff_id: 'staff-ben',
    linked_staff: INITIAL_STAFF[1],
    password: 'staff123',
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: 'usr-usman',
    name: 'Mr. Oyeboade Usman O.',
    email: 'usman.oyeboade@bitnox.com',
    role: 'Staff',
    linked_staff_id: 'staff-usman',
    linked_staff: INITIAL_STAFF[2],
    password: 'staff123',
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: 'usr-elena',
    name: 'Elena Gomez',
    email: 'elena.gomez@bitnox.com',
    role: 'Staff',
    linked_staff_id: 'staff-elena',
    linked_staff: INITIAL_STAFF[5],
    password: 'staff123',
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
];

const INITIAL_SETTINGS: SystemSettings = {
  id: 'default',
  data_retention_months: 24,
  auto_archive_enabled: false,
  office_name: 'Bitnoxsolution Shared Office',
  tech_institute_name: 'Bitnox Technology Institute',
  dry_cleaning_name: 'Bitnox Premium Dry Cleaners',
  updated_at: new Date().toISOString(),
};

function generateInitialVisitors(): Visitor[] {
  const now = new Date();
  const visitors: Visitor[] = [
    {
      id: 'vis-1',
      full_name: 'Jonathan Miller',
      phone_number: '+1 (555) 234-5678',
      email: 'j.miller@example.com',
      arrival_datetime: new Date(now.getTime() - 28 * 60 * 1000).toISOString(),
      purpose_of_visit: 'Prospective Student',
      department: 'Tech Institute',
      staff_to_see_id: 'staff-marcus',
      staff_to_see: INITIAL_STAFF[4],
      services_requested: 'Full-Stack Software Bootcamp inquiry & syllabus review',
      expected_duration: '30-60 min',
      status: 'In Progress',
      remarks: 'Interested in Fall 2026 cohort. Brought academic transcripts.',
      check_in_method: 'Manual Entry',
      created_by_user_id: 'usr-recep',
      created_by_user: { id: 'usr-recep', name: 'Kikelomo Oluwanishola', email: 'receptionist@bitnox.com' },
      created_at: new Date(now.getTime() - 28 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 28 * 60 * 1000).toISOString(),
    },
    {
      id: 'vis-2',
      full_name: 'Sophia Williams',
      phone_number: '+1 (555) 345-6789',
      email: 'sophia.w@luxuryliving.com',
      arrival_datetime: new Date(now.getTime() - 14 * 60 * 1000).toISOString(),
      purpose_of_visit: 'Dry Cleaning Customer',
      department: 'Dry Cleaning',
      staff_to_see_id: 'staff-elena',
      staff_to_see: INITIAL_STAFF[5],
      services_requested: 'Express silk dress and wool coat dry cleaning',
      expected_duration: '<15 min',
      status: 'In Progress',
      remarks: 'Drop-off order: 2 silk evening gowns, delicate stain removal required.',
      check_in_method: 'QR Self Check-In',
      created_by_user_id: 'usr-recep',
      created_by_user: { id: 'usr-recep', name: 'Kikelomo Oluwanishola', email: 'receptionist@bitnox.com' },
      created_at: new Date(now.getTime() - 14 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 14 * 60 * 1000).toISOString(),
    },
    {
      id: 'vis-3',
      full_name: 'Carlos Mendez',
      phone_number: '+1 (555) 456-7890',
      email: 'cmendez@techventures.io',
      arrival_datetime: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
      purpose_of_visit: 'Business Partner',
      department: 'Tech Institute',
      staff_to_see_id: 'staff-femi',
      staff_to_see: INITIAL_STAFF[0],
      services_requested: 'Corporate internship partnership & executive discussion',
      expected_duration: '1hr+',
      status: 'In Progress',
      remarks: 'Quarterly hiring syndicate meeting in Executive Boardroom.',
      check_in_method: 'Manual Entry',
      created_by_user_id: 'usr-recep',
      created_by_user: { id: 'usr-recep', name: 'Kikelomo Oluwanishola', email: 'receptionist@bitnox.com' },
      created_at: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
    },
    {
      id: 'vis-4',
      full_name: 'Amanda Hayes',
      phone_number: '+1 (555) 567-8901',
      email: 'amanda.h@gmail.com',
      arrival_datetime: new Date(now.getTime() - 3 * 3600 * 1000).toISOString(),
      checkout_datetime: new Date(now.getTime() - 2 * 3600 * 1000).toISOString(),
      purpose_of_visit: 'Existing Trainee',
      department: 'Tech Institute',
      staff_to_see_id: 'staff-sarah',
      staff_to_see: INITIAL_STAFF[3],
      services_requested: 'Code review and capstone project milestone sign-off',
      expected_duration: '30-60 min',
      status: 'Completed',
      remarks: 'Successfully submitted portfolio project.',
      check_in_method: 'Barcode Scan',
      created_by_user_id: 'usr-recep',
      created_by_user: { id: 'usr-recep', name: 'Kikelomo Oluwanishola', email: 'receptionist@bitnox.com' },
      created_at: new Date(now.getTime() - 3 * 3600 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 2 * 3600 * 1000).toISOString(),
    },
    {
      id: 'vis-5',
      full_name: 'Robert Fox',
      phone_number: '+1 (555) 678-9012',
      email: 'robert.fox@outlook.com',
      arrival_datetime: new Date(now.getTime() - 4 * 3600 * 1000).toISOString(),
      checkout_datetime: new Date(now.getTime() - 3 * 3600 * 1000).toISOString(),
      purpose_of_visit: 'Dry Cleaning Customer',
      department: 'Dry Cleaning',
      staff_to_see_id: 'staff-david',
      staff_to_see: INITIAL_STAFF[6],
      services_requested: 'Pickup order #4421 (3 two-piece suits)',
      expected_duration: '<15 min',
      status: 'Completed',
      remarks: 'Paid via contactless terminal. Tag #4421 released.',
      check_in_method: 'Manual Entry',
      created_by_user_id: 'usr-recep',
      created_by_user: { id: 'usr-recep', name: 'Kikelomo Oluwanishola', email: 'receptionist@bitnox.com' },
      created_at: new Date(now.getTime() - 4 * 3600 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 3 * 3600 * 1000).toISOString(),
    },
  ];

  const names = [
    'Emma Watson', 'James Bond', 'Olivia Smith', 'Noah Johnson', 'Liam Brown', 'Lucas Jones',
    'Mia Garcia', 'Benjamin Miller', 'Charlotte Davis', 'Henry Rodriguez', 'Amelia Martinez',
    'Alexander Hernandez', 'Evelyn Lopez', 'Michael Gonzalez', 'Harper Wilson', 'Ethan Anderson',
  ];

  for (let i = 1; i <= 25; i++) {
    const isTech = i % 2 === 0;
    const staffObj = isTech ? INITIAL_STAFF[1] : INITIAL_STAFF[5];
    const arrival = new Date(now.getTime() - i * 86400000 + (9 + (i % 7)) * 3600000);
    const checkout = new Date(arrival.getTime() + 45 * 60000);
    visitors.push({
      id: `vis-hist-${i}`,
      full_name: names[i % names.length],
      phone_number: `+1 (555) ${100 + i}-${1000 + i * 23}`,
      email: `${names[i % names.length].toLowerCase().replace(/\s+/g, '.')}@example.com`,
      arrival_datetime: arrival.toISOString(),
      checkout_datetime: checkout.toISOString(),
      purpose_of_visit: isTech ? 'Prospective Student' : 'Dry Cleaning Customer',
      department: isTech ? 'Tech Institute' : 'Dry Cleaning',
      staff_to_see_id: staffObj.id,
      staff_to_see: staffObj,
      services_requested: isTech ? 'Course inquiry' : 'Garment drop-off',
      expected_duration: '30-60 min',
      status: i === 7 ? 'Cancelled' : 'Completed',
      remarks: 'Auto-seeded historical visitor',
      check_in_method: 'Manual Entry',
      created_by_user_id: 'usr-recep',
      created_at: arrival.toISOString(),
      updated_at: checkout.toISOString(),
    });
  }

  return visitors;
}

class MockStorage {
  private get<T>(key: string, defaultVal: T): T {
    try {
      const stored = localStorage.getItem(`bitnox_mock_${key}`);
      return stored ? JSON.parse(stored) : defaultVal;
    } catch {
      return defaultVal;
    }
  }

  private set<T>(key: string, val: T): void {
    try {
      localStorage.setItem(`bitnox_mock_${key}`, JSON.stringify(val));
    } catch (e) {
      console.error('Storage error:', e);
    }
  }

  getStaff(): Staff[] {
    return this.get<Staff[]>('staff', INITIAL_STAFF);
  }

  setStaff(staff: Staff[]): void {
    this.set('staff', staff);
  }

  getUsers(): (User & { password: string })[] {
    return this.get('users', INITIAL_USERS);
  }

  setUsers(users: (User & { password: string })[]): void {
    this.set('users', users);
  }

  getVisitors(): Visitor[] {
    return this.get<Visitor[]>('visitors', generateInitialVisitors());
  }

  setVisitors(visitors: Visitor[]): void {
    this.set('visitors', visitors);
  }

  getSettings(): SystemSettings {
    return this.get<SystemSettings>('settings', INITIAL_SETTINGS);
  }

  setSettings(settings: SystemSettings): void {
    this.set('settings', settings);
  }

  getAuditLogs(): AuditLog[] {
    return this.get<AuditLog[]>('audit_logs', []);
  }

  addAuditLog(action: string, visitorId?: string, details?: any, userId: string = 'usr-recep'): void {
    const logs = this.getAuditLogs();
    const user = this.getUsers().find((u) => u.id === userId);
    logs.unshift({
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      user_id: userId,
      user: user ? { id: user.id, name: user.name, email: user.email, role: user.role } : null,
      action,
      target_visitor_id: visitorId,
      details,
      created_at: new Date().toISOString(),
    });
    this.set('audit_logs', logs);
  }
}

const storage = new MockStorage();

export const mockApi = {
  auth: {
    login: async (email: string, pass: string): Promise<AuthResponse> => {
      await new Promise((r) => setTimeout(r, 120));
      const users = storage.getUsers();
      const user = users.find((u) => u.email.toLowerCase().trim() === email.toLowerCase().trim());
      if (!user) {
        throw new Error('Invalid credentials.');
      }
      if (user.password !== pass && pass !== 'password123' && pass !== 'admin123' && pass !== 'recep123' && pass !== 'staff123') {
        throw new Error('Invalid password.');
      }
      const token = `mock-token-${user.id}-${Date.now()}`;
      return {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          linked_staff_id: user.linked_staff_id,
          linked_staff: user.linked_staff,
        },
      };
    },

    me: async (): Promise<{ user: User }> => {
      const token = localStorage.getItem('bitnox_token') || '';
      const users = storage.getUsers();
      const user = users.find((u) => token.includes(u.id)) || users[1];
      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          linked_staff_id: user.linked_staff_id,
          linked_staff: user.linked_staff,
          created_at: user.created_at,
          updated_at: user.updated_at,
        },
      };
    },
  },

  visitors: {
    getCurrentlyInOffice: async (): Promise<Visitor[]> => {
      const visitors = storage.getVisitors();
      const staffList = storage.getStaff();
      return visitors
        .filter((v) => v.status === 'In Progress')
        .map((v) => ({
          ...v,
          staff_to_see: staffList.find((s) => s.id === v.staff_to_see_id) || null,
        }));
    },

    getVisitors: async (params: Record<string, any> = {}): Promise<{
      visitors: Visitor[];
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    }> => {
      let visitors = storage.getVisitors();
      const staffList = storage.getStaff();

      if (params.department && params.department !== 'All') {
        visitors = visitors.filter((v) => v.department === params.department);
      }
      if (params.purpose_of_visit && params.purpose_of_visit !== 'All') {
        visitors = visitors.filter((v) => v.purpose_of_visit === params.purpose_of_visit);
      }
      if (params.status && params.status !== 'All') {
        visitors = visitors.filter((v) => v.status === params.status);
      }
      if (params.staff_id && params.staff_id !== 'All') {
        visitors = visitors.filter((v) => v.staff_to_see_id === params.staff_id);
      }
      if (params.search) {
        const q = String(params.search).toLowerCase();
        visitors = visitors.filter(
          (v) =>
            v.full_name.toLowerCase().includes(q) ||
            v.phone_number.toLowerCase().includes(q) ||
            (v.email && v.email.toLowerCase().includes(q))
        );
      }

      const total = visitors.length;
      const page = Number(params.page) || 1;
      const limit = Number(params.limit) || 20;
      const start = (page - 1) * limit;
      const paginated = visitors.slice(start, start + limit).map((v) => ({
        ...v,
        staff_to_see: staffList.find((s) => s.id === v.staff_to_see_id) || null,
      }));

      return {
        visitors: paginated,
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit) || 1,
      };
    },

    getMyVisitors: async (params: Record<string, any> = {}): Promise<{
      visitors: Visitor[];
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    }> => {
      const userRes = await mockApi.auth.me();
      const staffId = userRes.user.linked_staff_id;
      return mockApi.visitors.getVisitors({ ...params, staff_id: staffId || 'none' });
    },

    getById: async (id: string): Promise<Visitor> => {
      const visitors = storage.getVisitors();
      const v = visitors.find((x) => x.id === id);
      if (!v) throw new Error('Visitor not found');
      return v;
    },

    checkIn: async (data: Partial<Visitor>): Promise<Visitor> => {
      const visitors = storage.getVisitors();
      const staffList = storage.getStaff();
      const staff = staffList.find((s) => s.id === data.staff_to_see_id);

      const newVisitor: Visitor = {
        id: `vis-${Date.now()}`,
        full_name: data.full_name || 'Visitor',
        phone_number: data.phone_number || '',
        email: data.email || null,
        arrival_datetime: new Date().toISOString(),
        purpose_of_visit: data.purpose_of_visit || 'Other',
        department: data.department || 'Tech Institute',
        staff_to_see_id: data.staff_to_see_id || null,
        staff_to_see: staff || null,
        services_requested: data.services_requested || null,
        expected_duration: data.expected_duration || '30-60 min',
        status: 'In Progress',
        remarks: data.remarks || null,
        check_in_method: data.check_in_method || 'Manual Entry',
        created_by_user_id: 'usr-recep',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      visitors.unshift(newVisitor);
      storage.setVisitors(visitors);
      storage.addAuditLog('check_in', newVisitor.id, { full_name: newVisitor.full_name });

      // Dispatch real-time events for instant audio chime in same & other windows & cloud relay
      try {
        window.dispatchEvent(new CustomEvent('bitnox_new_visitor', { detail: { visitor: newVisitor } }));
        localStorage.setItem('bitnox_last_visitor', JSON.stringify(newVisitor));
        broadcastCloudEvent({ type: 'NEW_VISITOR', visitor: newVisitor }).catch(() => {});
      } catch {}

      return newVisitor;
    },

    checkOut: async (id: string, remarks?: string): Promise<{ visitor: Visitor; duration_minutes: number; message: string }> => {
      const visitors = storage.getVisitors();
      const idx = visitors.findIndex((v) => v.id === id);
      if (idx === -1) throw new Error('Visitor not found');

      const v = visitors[idx];
      const now = new Date();
      const arrival = new Date(v.arrival_datetime);
      const duration_minutes = Math.max(1, Math.round((now.getTime() - arrival.getTime()) / 60000));

      v.status = 'Completed';
      v.checkout_datetime = now.toISOString();
      if (remarks) v.remarks = remarks;
      v.updated_at = now.toISOString();

      visitors[idx] = v;
      storage.setVisitors(visitors);
      storage.addAuditLog('check_out', v.id, { duration_minutes, status: 'Completed' });

      return { visitor: v, duration_minutes, message: `Successfully checked out ${v.full_name}` };
    },

    cancel: async (id: string, remarks?: string): Promise<{ visitor: Visitor; message: string }> => {
      const visitors = storage.getVisitors();
      const idx = visitors.findIndex((v) => v.id === id);
      if (idx === -1) throw new Error('Visitor not found');

      const v = visitors[idx];
      v.status = 'Cancelled';
      v.checkout_datetime = new Date().toISOString();
      if (remarks) v.remarks = remarks;
      v.updated_at = new Date().toISOString();

      visitors[idx] = v;
      storage.setVisitors(visitors);
      storage.addAuditLog('cancel_visit', v.id, { status: 'Cancelled' });

      return { visitor: v, message: `Visit for ${v.full_name} has been cancelled.` };
    },

    update: async (id: string, data: Partial<Visitor>): Promise<Visitor> => {
      const visitors = storage.getVisitors();
      const idx = visitors.findIndex((v) => v.id === id);
      if (idx === -1) throw new Error('Visitor not found');

      const v = { ...visitors[idx], ...data, updated_at: new Date().toISOString() };
      visitors[idx] = v;
      storage.setVisitors(visitors);
      storage.addAuditLog('edit_visitor', v.id, data);
      return v;
    },

    getOverstayAlerts: async (): Promise<OverstayAlertData[]> => {
      const visitors = storage.getVisitors();
      const active = visitors.filter((v) => v.status === 'In Progress');
      const now = Date.now();
      const alerts: OverstayAlertData[] = [];

      for (const v of active) {
        const elapsed = Math.round((now - new Date(v.arrival_datetime).getTime()) / 60000);
        let limit = 60;
        if (v.expected_duration === '<15 min') limit = 15;
        else if (v.expected_duration === '15-30 min') limit = 30;
        else if (v.expected_duration === '30-60 min') limit = 60;
        else if (v.expected_duration === '1hr+') limit = 60;

        if (elapsed >= limit) {
          alerts.push({
            visitor: v,
            elapsed_minutes: elapsed,
            threshold_minutes: limit,
            overdue_minutes: Math.max(1, elapsed - limit),
            alerted_at: new Date().toISOString(),
          });
        }
      }
      return alerts;
    },
  },

  staff: {
    getAll: async (): Promise<Staff[]> => {
      return storage.getStaff();
    },
    create: async (data: Partial<Staff>): Promise<Staff> => {
      const staffList = storage.getStaff();
      const newStaff: Staff = {
        id: `staff-${Date.now()}`,
        name: data.name || 'New Staff',
        department: data.department || 'Tech Institute',
        role_title: data.role_title || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      staffList.push(newStaff);
      storage.setStaff(staffList);
      return newStaff;
    },
    update: async (id: string, data: Partial<Staff>): Promise<Staff> => {
      const staffList = storage.getStaff();
      const idx = staffList.findIndex((s) => s.id === id);
      if (idx === -1) throw new Error('Staff not found');
      const updated = { ...staffList[idx], ...data, updated_at: new Date().toISOString() };
      staffList[idx] = updated;
      storage.setStaff(staffList);
      return updated;
    },
    delete: async (id: string): Promise<{ message: string }> => {
      let staffList = storage.getStaff();
      staffList = staffList.filter((s) => s.id !== id);
      storage.setStaff(staffList);
      return { message: 'Staff deleted successfully' };
    },
  },

  users: {
    getAll: async (): Promise<User[]> => {
      const users = storage.getUsers();
      return users.map(({ password, ...u }) => u);
    },
    create: async (data: any): Promise<User> => {
      const users = storage.getUsers();
      const newUser = {
        id: `usr-${Date.now()}`,
        name: data.name,
        email: data.email,
        role: data.role,
        linked_staff_id: data.linked_staff_id || null,
        password: data.password || 'password123',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      users.push(newUser);
      storage.setUsers(users);
      const { password, ...resUser } = newUser;
      return resUser;
    },
    update: async (id: string, data: any): Promise<User> => {
      const users = storage.getUsers();
      const idx = users.findIndex((u) => u.id === id);
      if (idx === -1) throw new Error('User not found');
      const updated = { ...users[idx], ...data, updated_at: new Date().toISOString() };
      users[idx] = updated;
      storage.setUsers(users);
      const { password, ...resUser } = updated;
      return resUser;
    },
    delete: async (id: string): Promise<{ message: string }> => {
      let users = storage.getUsers();
      users = users.filter((u) => u.id !== id);
      storage.setUsers(users);
      return { message: 'User deleted successfully' };
    },
  },

  dashboard: {
    getStats: async (): Promise<DashboardStats> => {
      const visitors = storage.getVisitors();
      const staffList = storage.getStaff();
      const todayStr = new Date().toDateString();

      const todayVisitors = visitors.filter(
        (v) => new Date(v.arrival_datetime).toDateString() === todayStr
      );
      const currently_in_office = visitors.filter((v) => v.status === 'In Progress').length;
      const today_completed = todayVisitors.filter((v) => v.status === 'Completed').length;
      const today_cancelled = todayVisitors.filter((v) => v.status === 'Cancelled').length;

      const hourCounts: Record<number, number> = {};
      for (let h = 8; h <= 18; h++) hourCounts[h] = 0;
      visitors.forEach((v) => {
        const hour = new Date(v.arrival_datetime).getHours();
        if (hourCounts[hour] !== undefined) hourCounts[hour]++;
      });

      const peak_hours = Object.entries(hourCounts).map(([h, count]) => {
        const hourNum = Number(h);
        const ampm = hourNum >= 12 ? 'PM' : 'AM';
        const displayH = hourNum > 12 ? hourNum - 12 : hourNum === 0 ? 12 : hourNum;
        return { hour: hourNum, label: `${displayH} ${ampm}`, count };
      });

      const purposeMap: Record<string, number> = {};
      visitors.forEach((v) => {
        purposeMap[v.purpose_of_visit] = (purposeMap[v.purpose_of_visit] || 0) + 1;
      });
      const by_purpose = Object.entries(purposeMap).map(([purpose, count]) => ({
        purpose: purpose as any,
        count,
      }));

      const techCount = visitors.filter((v) => v.department === 'Tech Institute').length;
      const dryCleanCount = visitors.filter((v) => v.department === 'Dry Cleaning').length;
      const by_department = [
        { department: 'Tech Institute' as const, count: techCount },
        { department: 'Dry Cleaning' as const, count: dryCleanCount },
      ];

      const staff_workload = staffList.map((s) => ({
        staff_id: s.id,
        staff_name: s.name,
        department: s.department,
        role_title: s.role_title || '',
        count: visitors.filter((v) => v.staff_to_see_id === s.id).length,
      }));

      const dateMap: Record<string, { tech: number; clean: number }> = {};
      visitors.forEach((v) => {
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

      return {
        today_total: todayVisitors.length,
        currently_in_office,
        today_completed,
        today_cancelled,
        visits_per_day,
        by_purpose,
        by_department,
        peak_hours,
        staff_workload,
      };
    },
  },

  reports: {
    getData: async (params: Record<string, any> = {}): Promise<{
      summary: ReportSummary;
      visitors: Visitor[];
    }> => {
      const { visitors } = await mockApi.visitors.getVisitors({ ...params, limit: 1000 });
      const completed = visitors.filter((v) => v.status === 'Completed').length;
      const inProgress = visitors.filter((v) => v.status === 'In Progress').length;
      const cancelled = visitors.filter((v) => v.status === 'Cancelled').length;
      const techCount = visitors.filter((v) => v.department === 'Tech Institute').length;
      const dryCleanCount = visitors.filter((v) => v.department === 'Dry Cleaning').length;

      return {
        summary: {
          total: visitors.length,
          completed,
          inProgress,
          cancelled,
          techCount,
          dryCleanCount,
        },
        visitors,
      };
    },

    downloadExcel: async (params: Record<string, any> = {}) => {
      const { visitors } = await mockApi.reports.getData(params);
      const csvRows = [
        ['Visitor Name', 'Phone Number', 'Email', 'Department', 'Purpose of Visit', 'Staff Assigned', 'Arrival Time', 'Checkout Time', 'Status'],
        ...visitors.map((v) => [
          `"${v.full_name}"`,
          `"${v.phone_number}"`,
          `"${v.email || ''}"`,
          `"${v.department}"`,
          `"${v.purpose_of_visit}"`,
          `"${v.staff_to_see?.name || 'Unassigned'}"`,
          `"${new Date(v.arrival_datetime).toLocaleString()}"`,
          `"${v.checkout_datetime ? new Date(v.checkout_datetime).toLocaleString() : 'Active'}"`,
          `"${v.status}"`,
        ]),
      ];
      const blob = new Blob([csvRows.map((r) => r.join(',')).join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bitnox_vms_report_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    },

    downloadPdf: async (params: Record<string, any> = {}) => {
      const { visitors } = await mockApi.reports.getData(params);
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(`
          <html>
            <head>
              <title>Bitnox Visitor Management Report</title>
              <style>
                body { font-family: system-ui, -apple-system, sans-serif; padding: 2rem; color: #0f172a; }
                h1 { margin: 0 0 0.5rem; color: #0f172a; font-size: 1.5rem; }
                p { margin: 0 0 1.5rem; color: #64748b; font-size: 0.875rem; }
                table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
                th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
                th { background: #1e293b; color: #fff; font-weight: 600; }
                tr:nth-child(even) { background: #f8fafc; }
              </style>
            </head>
            <body>
              <h1>BITNOXSOLUTION VISITOR REGISTRY REPORT</h1>
              <p>Generated: ${new Date().toLocaleString()} | Total Records: ${visitors.length}</p>
              <table>
                <thead>
                  <tr>
                    <th>Visitor Name</th>
                    <th>Phone</th>
                    <th>Department</th>
                    <th>Purpose</th>
                    <th>Staff Assigned</th>
                    <th>Arrival</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${visitors
                    .map(
                      (v) => `
                    <tr>
                      <td><strong>${v.full_name}</strong></td>
                      <td>${v.phone_number}</td>
                      <td>${v.department}</td>
                      <td>${v.purpose_of_visit}</td>
                      <td>${v.staff_to_see?.name || 'Unassigned'}</td>
                      <td>${new Date(v.arrival_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      <td>${v.status}</td>
                    </tr>
                  `
                    )
                    .join('')}
                </tbody>
              </table>
              <script>window.print();</script>
            </body>
          </html>
        `);
        win.document.close();
      }
    },
  },

  audit: {
    getLogs: async (params: Record<string, any> = {}): Promise<{
      logs: AuditLog[];
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    }> => {
      const logs = storage.getAuditLogs();
      const page = Number(params.page) || 1;
      const limit = Number(params.limit) || 25;
      const start = (page - 1) * limit;
      return {
        logs: logs.slice(start, start + limit),
        total: logs.length,
        page,
        limit,
        total_pages: Math.ceil(logs.length / limit) || 1,
      };
    },
  },

  settings: {
    get: async (): Promise<SystemSettings> => {
      return storage.getSettings();
    },
    update: async (data: Partial<SystemSettings>): Promise<SystemSettings> => {
      const current = storage.getSettings();
      const updated = { ...current, ...data, updated_at: new Date().toISOString() };
      storage.setSettings(updated);
      return updated;
    },
  },

  checkinSessions: {
    createSession: async (): Promise<{
      session: CheckInSession;
      token: string;
      expires_at: string;
      lan_ip?: string;
      checkin_url: string;
      network_checkin_url?: string;
    }> => {
      const token = `sess-${Math.random().toString(36).substr(2, 8)}`;
      const expires_at = new Date(Date.now() + 15 * 60000).toISOString();
      const session: CheckInSession = {
        id: `sess-${Date.now()}`,
        token,
        created_at: new Date().toISOString(),
        expires_at,
        used_count: 0,
        is_active: true,
      };
      const origin = window.location.origin;
      return {
        session,
        token,
        expires_at,
        checkin_url: `${origin}/self-checkin?token=${token}`,
        network_checkin_url: `${origin}/self-checkin?token=${token}`,
      };
    },

    getNetworkInfo: async () => ({
      lan_ip: window.location.hostname,
      web_port: Number(window.location.port) || 80,
      api_port: 5000,
      suggested_terminal_url: window.location.origin,
      suggested_checkin_url_prefix: `${window.location.origin}/self-checkin?token=`,
    }),

    getStatus: async (token: string) => {
      const staff = storage.getStaff();
      const settings = storage.getSettings();
      return {
        valid: true,
        token,
        expires_at: new Date(Date.now() + 15 * 60000).toISOString(),
        staff,
        settings,
      };
    },

    submitSelfCheckIn: async (token: string, data: SelfCheckInPayload) => {
      const visitor = await mockApi.visitors.checkIn({
        ...data,
        check_in_method: 'QR Self Check-In',
      });
      return {
        success: true,
        message: 'Self check-in completed successfully!',
        visitor,
      };
    },

    getRecent: async () => {
      const visitors = storage.getVisitors();
      return visitors.slice(0, 5);
    },

    createEventSource: () => {
      return {
        addEventListener: () => {},
        removeEventListener: () => {},
        close: () => {},
      } as any;
    },
  },
};
