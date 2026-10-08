import { Response } from 'express';
import { prisma } from '../prisma.js';
import { AuthRequest } from '../middleware/auth.js';
import { logAudit } from '../utils/audit.js';
import { getActiveOverstayedVisitors } from '../services/overstayService.js';
import { broadcastNewVisitor, broadcastCheckout } from './checkinSessionController.js';

export async function checkInVisitor(req: AuthRequest, res: Response): Promise<void> {
  try {
    const {
      full_name,
      phone_number,
      email,
      purpose_of_visit,
      department,
      staff_to_see_id,
      services_requested,
      expected_duration,
      remarks,
    } = req.body;

    if (!full_name || !phone_number || !purpose_of_visit || !department) {
      res.status(400).json({
        error: 'Missing required fields: full_name, phone_number, purpose_of_visit, and department are required.',
      });
      return;
    }

    // Intelligent auto-routing if staff_to_see_id was not explicitly specified
    let resolvedStaffId = staff_to_see_id || null;
    if (!resolvedStaffId) {
      const combined = `${purpose_of_visit || ''} ${services_requested || ''} ${remarks || ''}`.toLowerCase();
      if (department === 'Dry Cleaning' || combined.includes('dry clean')) {
        const dStaff = await prisma.staff.findFirst({ where: { department: 'Dry Cleaning' } });
        resolvedStaffId = dStaff?.id || null;
      } else {
        if (combined.includes('ai') || combined.includes('ml') || combined.includes('lecture') || combined.includes('ben')) {
          const ben = await prisma.staff.findFirst({ where: { name: { contains: 'Ben' } } });
          resolvedStaffId = ben?.id || null;
        } else if (combined.includes('data') || combined.includes('analytics') || combined.includes('usman')) {
          const usman = await prisma.staff.findFirst({ where: { name: { contains: 'Usman' } } });
          resolvedStaffId = usman?.id || null;
        } else if (combined.includes('web') || combined.includes('sarah')) {
          const sarah = await prisma.staff.findFirst({ where: { name: { contains: 'Sarah' } } });
          resolvedStaffId = sarah?.id || null;
        } else {
          const ben = await prisma.staff.findFirst({ where: { name: { contains: 'Ben' } } });
          resolvedStaffId = ben?.id || null;
        }
      }
    }

    const visitor = await prisma.visitor.create({
      data: {
        full_name: full_name.trim(),
        phone_number: phone_number.trim(),
        email: email ? email.trim() : null,
        purpose_of_visit,
        department,
        staff_to_see_id: resolvedStaffId,
        services_requested: services_requested ? services_requested.trim() : null,
        expected_duration: expected_duration || null,
        status: 'In Progress',
        remarks: remarks ? remarks.trim() : null,
        created_by_user_id: req.user!.id,
        arrival_datetime: new Date(),
      },
      include: {
        staff_to_see: true,
        created_by_user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Write audit log
    await logAudit({
      userId: req.user!.id,
      action: 'check_in',
      targetVisitorId: visitor.id,
      details: {
        full_name: visitor.full_name,
        department: visitor.department,
        purpose: visitor.purpose_of_visit,
        arrival_datetime: visitor.arrival_datetime,
      },
    });

    // Broadcast instant real-time event to reception terminals and dashboards
    broadcastNewVisitor(visitor);

    res.status(201).json(visitor);
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ error: 'Failed to process visitor check-in.' });
  }
}

export async function checkOutVisitor(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const { remarks } = req.body;

    const existing = await prisma.visitor.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({ error: 'Visitor record not found.' });
      return;
    }

    // Role protection: Staff can only check out their own assigned visitors
    if (req.user?.role === 'Staff') {
      if (!req.user.linked_staff_id || existing.staff_to_see_id !== req.user.linked_staff_id) {
        res.status(403).json({ error: 'Access denied: You can only check out visitors assigned to you.' });
        return;
      }
    }

    if (existing.status !== 'In Progress') {
      res.status(400).json({ error: `Visitor is already marked as ${existing.status}.` });
      return;
    }

    const checkoutTime = new Date();
    const durationMinutes = Math.max(
      1,
      Math.round((checkoutTime.getTime() - new Date(existing.arrival_datetime).getTime()) / 60000)
    );

    const updated = await prisma.visitor.update({
      where: { id },
      data: {
        status: 'Completed',
        checkout_datetime: checkoutTime,
        remarks: remarks !== undefined ? remarks : existing.remarks,
      },
      include: {
        staff_to_see: true,
        created_by_user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Write audit log
    await logAudit({
      userId: req.user!.id,
      action: 'check_out',
      targetVisitorId: updated.id,
      details: {
        full_name: updated.full_name,
        duration_minutes: durationMinutes,
        checkout_datetime: checkoutTime,
      },
    });

    // Broadcast checkout event via SSE to all reception kiosks & dashboard screens
    broadcastCheckout(updated);

    res.json({
      visitor: updated,
      duration_minutes: durationMinutes,
      message: `Visitor successfully checked out. Total time: ${durationMinutes} minutes.`,
    });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ error: 'Failed to check out visitor.' });
  }
}

export async function cancelVisitor(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const { remarks } = req.body;

    const existing = await prisma.visitor.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({ error: 'Visitor record not found.' });
      return;
    }

    // Role protection: Staff can only cancel visits assigned to them
    if (req.user?.role === 'Staff') {
      if (!req.user.linked_staff_id || existing.staff_to_see_id !== req.user.linked_staff_id) {
        res.status(403).json({ error: 'Access denied: You can only cancel visits assigned to you.' });
        return;
      }
    }

    const checkoutTime = new Date();
    const updatedRemarks = remarks
      ? existing.remarks
        ? `${existing.remarks} | Cancellation Note: ${remarks}`
        : `Cancellation Note: ${remarks}`
      : existing.remarks;

    const updated = await prisma.visitor.update({
      where: { id },
      data: {
        status: 'Cancelled',
        checkout_datetime: checkoutTime,
        remarks: updatedRemarks,
      },
      include: {
        staff_to_see: true,
        created_by_user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Write audit log
    await logAudit({
      userId: req.user!.id,
      action: 'cancel_visit',
      targetVisitorId: updated.id,
      details: {
        full_name: updated.full_name,
        reason: remarks || 'No reason specified',
      },
    });

    // Broadcast cancellation event via SSE to all reception kiosks & dashboard screens
    broadcastCheckout(updated);

    res.json({
      visitor: updated,
      message: 'Visitor marked as Cancelled.',
    });
  } catch (error) {
    console.error('Cancel visit error:', error);
    res.status(500).json({ error: 'Failed to cancel visitor.' });
  }
}

export async function getCurrentlyInOffice(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (req.user?.role !== 'Admin' && req.user?.role !== 'Receptionist') {
      res.status(403).json({ error: 'Access denied: Only Receptionist and Admin can view all live visitors in office.' });
      return;
    }

    const visitors = await prisma.visitor.findMany({
      where: {
        status: 'In Progress',
      },
      orderBy: { arrival_datetime: 'desc' },
      include: {
        staff_to_see: true,
        created_by_user: {
          select: { id: true, name: true },
        },
      },
    });

    res.json(visitors);
  } catch (error) {
    console.error('getCurrentlyInOffice error:', error);
    res.status(500).json({ error: 'Failed to retrieve visitors currently in office.' });
  }
}

/**
 * Scoped endpoint for Staff (own assigned visitors) and Admin (any/all staff visitors)
 */
export async function getMyVisitors(req: AuthRequest, res: Response): Promise<void> {
  try {
    const {
      search,
      status,
      staff_to_see_id,
      date_from,
      date_to,
      preset,
      page = '1',
      limit = '50',
    } = req.query;

    const where: any = {};

    // Strict role scoping with multi-field and lecture-student matching
    const andClauses: any[] = [];

    if (req.user?.role === 'Staff') {
      const staffId = req.user.linked_staff_id;
      const staffName = (req.user.name || '').toLowerCase();

      const staffConditions: any[] = [];
      if (staffId) {
        staffConditions.push({ staff_to_see_id: staffId });
      }
      if (staffName.includes('ben')) {
        staffConditions.push({ staff_to_see_id: 'staff-ben' });
        staffConditions.push({ staff_to_see_id: 'staff-ben-1' });
        staffConditions.push({ staff_to_see: { name: { contains: 'Ben' } } });
        staffConditions.push({ services_requested: { contains: 'AI' } });
        staffConditions.push({ services_requested: { contains: 'ML' } });
        staffConditions.push({ remarks: { contains: 'Ben' } });
        staffConditions.push({ remarks: { contains: 'lecture' } });
        staffConditions.push({
          AND: [
            { purpose_of_visit: 'Existing Trainee' },
            { department: 'Tech Institute' }
          ]
        });
      } else if (staffName.includes('usman')) {
        staffConditions.push({ staff_to_see: { name: { contains: 'Usman' } } });
        staffConditions.push({ staff_to_see_id: 'staff-usman' });
      } else if (staffName.includes('elena')) {
        staffConditions.push({ staff_to_see: { name: { contains: 'Elena' } } });
        staffConditions.push({ staff_to_see_id: 'staff-elena' });
      } else {
        const namePart = staffName.split(' ').pop();
        if (namePart) {
          staffConditions.push({ staff_to_see: { name: { contains: namePart } } });
        }
      }

      andClauses.push({ OR: staffConditions });
    } else if (req.user?.role === 'Admin') {
      if (staff_to_see_id && staff_to_see_id !== 'All') {
        andClauses.push({
          OR: [
            { staff_to_see_id: String(staff_to_see_id) },
            { staff_to_see: { id: String(staff_to_see_id) } }
          ]
        });
      }
    } else {
      res.status(403).json({ error: 'Access denied: Only Staff and Admin can view assigned visitors.' });
      return;
    }

    if (status && status !== 'All') {
      where.status = String(status);
    }

    if (search) {
      const q = String(search).trim();
      andClauses.push({
        OR: [
          { full_name: { contains: q } },
          { phone_number: { contains: q } },
          { email: { contains: q } },
          { services_requested: { contains: q } },
        ],
      });
    }

    if (andClauses.length > 0) {
      where.AND = andClauses;
    }

    const now = new Date();
    if (preset === 'Today') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      where.arrival_datetime = { gte: startOfDay, lte: endOfDay };
    } else if (preset === 'This Week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now.setDate(diff));
      monday.setHours(0, 0, 0, 0);
      where.arrival_datetime = { gte: monday };
    } else if (preset === 'This Month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      where.arrival_datetime = { gte: firstDay };
    } else if (date_from || date_to) {
      where.arrival_datetime = {};
      if (date_from) where.arrival_datetime.gte = new Date(String(date_from));
      if (date_to) {
        const toDate = new Date(String(date_to));
        toDate.setHours(23, 59, 59, 999);
        where.arrival_datetime.lte = toDate;
      }
    }

    const pageNum = Math.max(1, parseInt(String(page), 10));
    const take = Math.min(200, Math.max(1, parseInt(String(limit), 10)));
    const skip = (pageNum - 1) * take;

    const [total, visitors] = await Promise.all([
      prisma.visitor.count({ where }),
      prisma.visitor.findMany({
        where,
        orderBy: { arrival_datetime: 'desc' },
        skip,
        take,
        include: {
          staff_to_see: true,
          created_by_user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
    ]);

    res.json({
      visitors,
      total,
      page: pageNum,
      limit: take,
      total_pages: Math.ceil(total / take),
    });
  } catch (error) {
    console.error('getMyVisitors error:', error);
    res.status(500).json({ error: 'Failed to retrieve assigned visitors.' });
  }
}

export async function getVisitors(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (req.user?.role !== 'Admin' && req.user?.role !== 'Receptionist') {
      res.status(403).json({ error: 'Access denied: Only Receptionist and Admin can access the complete visitor history log.' });
      return;
    }

    const {
      search,
      department,
      purpose_of_visit,
      status,
      staff_to_see_id,
      date_from,
      date_to,
      preset,
      page = '1',
      limit = '50',
    } = req.query;

    const where: any = {};

    if (staff_to_see_id && staff_to_see_id !== 'All') {
      where.staff_to_see_id = String(staff_to_see_id);
    }

    // Filters
    if (department && department !== 'All') {
      where.department = String(department);
    }

    if (purpose_of_visit && purpose_of_visit !== 'All') {
      where.purpose_of_visit = String(purpose_of_visit);
    }

    if (status && status !== 'All') {
      where.status = String(status);
    }

    // Text search on full_name or phone_number
    if (search) {
      const q = String(search).trim();
      where.OR = [
        { full_name: { contains: q } },
        { phone_number: { contains: q } },
        { email: { contains: q } },
      ];
    }

    // Date range / Presets
    const now = new Date();
    if (preset === 'Today') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      where.arrival_datetime = { gte: startOfDay, lte: endOfDay };
    } else if (preset === 'This Week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
      const monday = new Date(now.setDate(diff));
      monday.setHours(0, 0, 0, 0);
      where.arrival_datetime = { gte: monday };
    } else if (preset === 'This Month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      where.arrival_datetime = { gte: firstDay };
    } else {
      if (date_from || date_to) {
        where.arrival_datetime = {};
        if (date_from) {
          where.arrival_datetime.gte = new Date(String(date_from));
        }
        if (date_to) {
          const toDate = new Date(String(date_to));
          toDate.setHours(23, 59, 59, 999);
          where.arrival_datetime.lte = toDate;
        }
      }
    }

    const pageNum = Math.max(1, parseInt(String(page), 10));
    const take = Math.min(200, Math.max(1, parseInt(String(limit), 10)));
    const skip = (pageNum - 1) * take;

    const [total, visitors] = await Promise.all([
      prisma.visitor.count({ where }),
      prisma.visitor.findMany({
        where,
        orderBy: { arrival_datetime: 'desc' },
        skip,
        take,
        include: {
          staff_to_see: true,
          created_by_user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
    ]);

    res.json({
      visitors,
      total,
      page: pageNum,
      limit: take,
      total_pages: Math.ceil(total / take),
    });
  } catch (error) {
    console.error('getVisitors error:', error);
    res.status(500).json({ error: 'Failed to retrieve visitors.' });
  }
}

export async function getVisitorById(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;

    const visitor = await prisma.visitor.findUnique({
      where: { id },
      include: {
        staff_to_see: true,
        created_by_user: {
          select: { id: true, name: true, email: true },
        },
        audit_logs: {
          orderBy: { created_at: 'desc' },
          include: {
            user: { select: { id: true, name: true, role: true } },
          },
        },
      },
    });

    if (!visitor) {
      res.status(404).json({ error: 'Visitor not found.' });
      return;
    }

    // Role protection for Staff
    if (req.user?.role === 'Staff' && visitor.staff_to_see_id !== req.user.linked_staff_id) {
      res.status(403).json({ error: 'Access denied: You can only view visitors assigned to you.' });
      return;
    }

    res.json(visitor);
  } catch (error) {
    console.error('getVisitorById error:', error);
    res.status(500).json({ error: 'Failed to retrieve visitor details.' });
  }
}

export async function updateVisitor(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const {
      full_name,
      phone_number,
      email,
      purpose_of_visit,
      department,
      staff_to_see_id,
      services_requested,
      expected_duration,
      remarks,
    } = req.body;

    const existing = await prisma.visitor.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Visitor not found.' });
      return;
    }

    const updated = await prisma.visitor.update({
      where: { id },
      data: {
        full_name: full_name !== undefined ? full_name : existing.full_name,
        phone_number: phone_number !== undefined ? phone_number : existing.phone_number,
        email: email !== undefined ? email : existing.email,
        purpose_of_visit: purpose_of_visit !== undefined ? purpose_of_visit : existing.purpose_of_visit,
        department: department !== undefined ? department : existing.department,
        staff_to_see_id: staff_to_see_id !== undefined ? staff_to_see_id : existing.staff_to_see_id,
        services_requested: services_requested !== undefined ? services_requested : existing.services_requested,
        expected_duration: expected_duration !== undefined ? expected_duration : existing.expected_duration,
        remarks: remarks !== undefined ? remarks : existing.remarks,
        status: req.body.status !== undefined ? req.body.status : existing.status,
        checkout_datetime: req.body.checkout_datetime !== undefined ? req.body.checkout_datetime : existing.checkout_datetime,
        arrival_datetime: req.body.arrival_datetime !== undefined ? new Date(req.body.arrival_datetime) : existing.arrival_datetime,
      },
      include: {
        staff_to_see: true,
      },
    });

    await logAudit({
      userId: req.user!.id,
      action: 'edit_visitor',
      targetVisitorId: id,
      details: {
        before: {
          full_name: existing.full_name,
          phone: existing.phone_number,
          purpose: existing.purpose_of_visit,
        },
        after: {
          full_name: updated.full_name,
          phone: updated.phone_number,
          purpose: updated.purpose_of_visit,
        },
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('updateVisitor error:', error);
    res.status(500).json({ error: 'Failed to update visitor.' });
  }
}

export async function getOverstayAlerts(req: AuthRequest, res: Response): Promise<void> {
  try {
    const alerts = await getActiveOverstayedVisitors();
    res.json(alerts);
  } catch (error) {
    console.error('getOverstayAlerts error:', error);
    res.status(500).json({ error: 'Failed to retrieve overstay alerts.' });
  }
}
