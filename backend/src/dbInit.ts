import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import path from 'path';
import os from 'os';
import fs from 'fs';

import dotenv from 'dotenv';
dotenv.config();

// Setup database URL for local and Vercel environments
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./dev.db';
}
if (process.env.VERCEL) {
  const tmpDbPath = path.join(os.tmpdir(), 'bitnox_dev.db').replace(/\\/g, '/');
  process.env.DATABASE_URL = `file:${tmpDbPath}`;
}

export const prisma = new PrismaClient();

let isReady = false;
let initPromise: Promise<void> | null = null;

export async function ensureDatabaseReady(): Promise<void> {
  if (isReady) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      // 1. Create tables if they do not exist
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS staff (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          department TEXT NOT NULL,
          role_title TEXT,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL,
          linked_staff_id TEXT,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (linked_staff_id) REFERENCES staff(id) ON DELETE SET NULL
        );
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS visitors (
          id TEXT PRIMARY KEY,
          full_name TEXT NOT NULL,
          phone_number TEXT NOT NULL,
          email TEXT,
          arrival_datetime DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          purpose_of_visit TEXT NOT NULL,
          department TEXT NOT NULL,
          staff_to_see_id TEXT,
          services_requested TEXT,
          expected_duration TEXT,
          checkout_datetime DATETIME,
          status TEXT NOT NULL DEFAULT 'In Progress',
          remarks TEXT,
          check_in_method TEXT NOT NULL DEFAULT 'Manual Entry',
          overstay_alerted BOOLEAN NOT NULL DEFAULT 0,
          overstay_alerted_at DATETIME,
          created_by_user_id TEXT NOT NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (staff_to_see_id) REFERENCES staff(id) ON DELETE SET NULL,
          FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE RESTRICT
        );
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS checkin_sessions (
          id TEXT PRIMARY KEY,
          token TEXT NOT NULL UNIQUE,
          kiosk_device_id TEXT DEFAULT 'front-desk-terminal',
          created_by_user_id TEXT,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          expires_at DATETIME NOT NULL,
          used_count INTEGER NOT NULL DEFAULT 0,
          is_active BOOLEAN NOT NULL DEFAULT 1,
          FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
        );
      `);

      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS checkin_sessions_token_idx ON checkin_sessions(token);
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          action TEXT NOT NULL,
          target_visitor_id TEXT,
          details TEXT,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (target_visitor_id) REFERENCES visitors(id) ON DELETE SET NULL
        );
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS system_settings (
          id TEXT PRIMARY KEY DEFAULT 'default',
          data_retention_months INTEGER NOT NULL DEFAULT 24,
          auto_archive_enabled BOOLEAN NOT NULL DEFAULT 0,
          office_name TEXT NOT NULL DEFAULT 'Bitnoxsolution Shared Office',
          tech_institute_name TEXT NOT NULL DEFAULT 'Bitnox Technology Institute',
          dry_cleaning_name TEXT NOT NULL DEFAULT 'Bitnox Premium Dry Cleaning',
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 2. Check if default user exists
      const userCount = await prisma.user.count();
      if (userCount === 0) {
        console.log('[Database Initializer] Seeding initial database on cold start...');

        // System settings
        await prisma.systemSettings.create({
          data: {
            id: 'default',
            data_retention_months: 24,
            auto_archive_enabled: false,
            office_name: 'Bitnoxsolution Shared Office',
            tech_institute_name: 'Bitnox Technology Institute',
            dry_cleaning_name: 'Bitnox Premium Dry Cleaners',
          },
        }).catch(() => {});

        // Staff
        const staffCeo = await prisma.staff.create({
          data: {
            id: 'staff-ceo-1',
            name: 'Engr Oluwafemi Faleye',
            department: 'Tech Institute',
            role_title: 'CEO & Managing Director',
          },
        });

        const staff1 = await prisma.staff.create({
          data: {
            id: 'staff-ben-1',
            name: 'Mr. Ben Sam',
            department: 'Tech Institute',
            role_title: 'AI/ML Instructor',
          },
        });

        const staffUsman = await prisma.staff.create({
          data: {
            id: 'staff-usman-1',
            name: 'Mr. Oyeboade Usman O.',
            department: 'Tech Institute',
            role_title: 'Data Analytics Instructor',
          },
        });

        const staff2 = await prisma.staff.create({
          data: {
            id: 'staff-sarah-1',
            name: 'Sarah Jenkins',
            department: 'Tech Institute',
            role_title: 'Web Dev Instructor & Career Coach',
          },
        });

        const staff3 = await prisma.staff.create({
          data: {
            id: 'staff-marcus-1',
            name: 'Marcus Brody',
            department: 'Tech Institute',
            role_title: 'Admissions & Enrollment Advisor',
          },
        });

        const staff4 = await prisma.staff.create({
          data: {
            id: 'staff-elena-1',
            name: 'Elena Gomez',
            department: 'Dry Cleaning',
            role_title: 'Head Garment Specialist & Quality Lead',
          },
        });

        const staff5 = await prisma.staff.create({
          data: {
            id: 'staff-david-1',
            name: 'David Chen',
            department: 'Dry Cleaning',
            role_title: 'Operations & Laundry Facility Manager',
          },
        });

        // Passwords
        const adminHash = await bcrypt.hash('admin123', 10);
        const recepHash = await bcrypt.hash('recep123', 10);
        const staffHash = await bcrypt.hash('staff123', 10);

        const adminUser = await prisma.user.create({
          data: {
            id: 'user-admin-1',
            name: 'Engr Oluwafemi Faleye',
            email: 'admin@bitnox.com',
            password_hash: adminHash,
            role: 'Admin',
            linked_staff_id: staffCeo.id,
          },
        });

        const receptionistUser = await prisma.user.create({
          data: {
            id: 'user-recep-1',
            name: 'Kikelomo Oluwanishola',
            email: 'receptionist@bitnox.com',
            password_hash: recepHash,
            role: 'Receptionist',
          },
        });

        await prisma.user.create({
          data: {
            id: 'user-ben-1',
            name: 'Mr. Ben Sam',
            email: 'ben.sam@bitnox.com',
            password_hash: staffHash,
            role: 'Staff',
            linked_staff_id: staff1.id,
          },
        });

        await prisma.user.create({
          data: {
            id: 'user-usman-1',
            name: 'Mr. Oyeboade Usman O.',
            email: 'usman.oyeboade@bitnox.com',
            password_hash: staffHash,
            role: 'Staff',
            linked_staff_id: staffUsman.id,
          },
        });

        await prisma.user.create({
          data: {
            id: 'user-elena-1',
            name: 'Elena Gomez',
            email: 'elena.gomez@bitnox.com',
            password_hash: staffHash,
            role: 'Staff',
            linked_staff_id: staff4.id,
          },
        });

        // Add sample visitors
        const now = new Date();
        const v1 = await prisma.visitor.create({
          data: {
            full_name: 'Jonathan Miller',
            phone_number: '+1 (555) 234-5678',
            email: 'j.miller@example.com',
            arrival_datetime: new Date(now.getTime() - 28 * 60 * 1000),
            purpose_of_visit: 'Prospective Student',
            department: 'Tech Institute',
            staff_to_see_id: staff3.id,
            services_requested: 'Full-Stack Software Bootcamp inquiry',
            expected_duration: '30-60 min',
            status: 'In Progress',
            remarks: 'Interested in Fall 2026 cohort.',
            created_by_user_id: receptionistUser.id,
          },
        });

        const v2 = await prisma.visitor.create({
          data: {
            full_name: 'Sophia Williams',
            phone_number: '+1 (555) 345-6789',
            email: 'sophia.w@luxuryliving.com',
            arrival_datetime: new Date(now.getTime() - 14 * 60 * 1000),
            purpose_of_visit: 'Dry Cleaning Customer',
            department: 'Dry Cleaning',
            staff_to_see_id: staff4.id,
            services_requested: 'Express silk dress dry cleaning',
            expected_duration: '<15 min',
            status: 'In Progress',
            remarks: 'Drop-off order: 2 silk evening gowns.',
            created_by_user_id: receptionistUser.id,
          },
        });

        console.log('[Database Initializer] Seeding complete.');
      }

      isReady = true;
    } catch (err) {
      console.error('[Database Initializer] Initialization error:', err);
      throw err;
    }
  })();

  return initPromise;
}
