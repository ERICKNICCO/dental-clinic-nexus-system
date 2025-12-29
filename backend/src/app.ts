import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { checkDbConnection } from './db';
import { authMiddleware, createUser, findUserByEmail, signJwt, ensureInviteCodesTable } from './auth';
import type { AuthenticatedRequest } from './auth';
import { ensurePatientsTable, listPatients, createPatient as createDbPatient, updatePatient as updateDbPatient, generateNextPatientId, findPatientByDetails, deletePatient } from './patients';
import {
  ensureAppointmentsTable,
  listAppointmentsByDateRange,
  listAppointmentsRecent,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  sendAppointmentNotification,
  DbAppointment,
} from './appointments';
import { sendAppointmentEmail, AppointmentEmailType } from './email';
import {
  ensureTreatmentPricingTable,
  listAllTreatmentPricing,
  listTreatmentPricingByProvider,
  createTreatmentPricing,
  updateTreatmentPricing,
  deleteTreatmentPricing,
  normalizeInsuranceProvider,
} from './treatmentPricing';
import {
  ensureConsultationsTable,
  createConsultation as createDbConsultation,
  getActiveConsultation,
  getLatestCompletedConsultation,
  getConsultationById,
  updateConsultation as updateDbConsultation,
  completeConsultation as completeDbConsultation,
  getConsultationsByPatientId,
  getAllConsultations,
  getConsultationsByAppointmentId,
} from './consultations';
import {
  ensurePaymentsTables,
  listPaymentsLight,
  listPaymentsWithItems,
  getPaymentSummary as getDbPaymentSummary,
  collectPayment as collectDbPayment,
  createPaymentWithLineItems as createDbPaymentWithLineItems,
  updatePaymentLineItems as updateDbPaymentLineItems,
  getPaymentsByDateRange as getDbPaymentsByDateRange,
} from './payments';
import { unassignedImages, unassignedStudies, startXRayWatcher } from './xrayWatcher'; // Import unassigned stores
import {
  ensureLeaveRequestsTable,
  createLeaveRequest,
  getLeaveRequests,
  getLeaveRequestById,
  updateLeaveRequestStatus,
  deleteLeaveRequest,
  getPendingLeaveRequestsCount,
  getUserLeaveStats,
} from './leaveRequests';
import {
  ensureMusicTables,
  getMusicFiles,
  getMusicFileById,
  addMusicFile,
  deleteMusicFile,
  getPlaylists,
  getPlaylistById,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  getPlaylistItems,
  addSongToPlaylist,
  removeSongFromPlaylist,
  getUserMusicSettings,
  updateUserMusicSettings,
} from './music';
import {
  getPendingPreauthorizations,
  updateClaimStatus,
  getPatientPreauthorizations,
} from './claims';
import fs from 'fs';
import path from 'path';
import { pool } from './db';
import multer from 'multer';
import { parseFile } from 'music-metadata';
import { initializeWhatsApp } from './whatsapp-client';

export const app = express();

// Initialize WhatsApp Client (Option B)
if (process.env.NODE_ENV !== 'test') {
  try {
    initializeWhatsApp();
  } catch (error) {
    console.error('⚠️ Failed to initialize WhatsApp client:', error);
    console.log('📱 WhatsApp notifications will be unavailable, but the backend will continue to run.');
  }
}


// Global middleware
// Configure Helmet with relaxed settings for image serving
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow images to be loaded from different origins
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "http://localhost:4000", "http://localhost:8080"],
    },
  },
}));
app.use(cors());


app.use(express.json());


// Serve static files from uploads directory with CORS headers
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(process.cwd(), 'uploads')));

// Import and use notifications router
import notificationsRouter from './notifications';
app.use('/api', notificationsRouter);

// Basic health check (includes DB check)
app.get('/health', async (_req, res) => {
  try {
    await checkDbConnection();
    res.json({ status: 'ok' });
  } catch (err) {
    console.error('Healthcheck DB error', err);
    res.status(500).json({ status: 'error', error: 'DB connection failed' });
  }
});

// Auth routes
app.post('/auth/register', async (req, res) => {
  try {
    const { email, password, fullName, role } = req.body ?? {};

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      res.status(409).json({ error: 'User with this email already exists' });
      return;
    }

    const user = await createUser(email, password, fullName, role);
    const token = signJwt(user);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Error in /auth/register', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await findUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const isMatch = await import('bcryptjs').then(({ default: bcrypt }) =>
      bcrypt.compare(password, user.password_hash),
    );

    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = signJwt(user);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Error in /auth/login', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Staff registration with invite code
app.post('/auth/staff-register', async (req, res) => {
  try {
    const { email, password, fullName, role, phone, specialization, licenseNumber, inviteCode } = req.body ?? {};

    if (!email || !password || !fullName || !inviteCode) {
      res.status(400).json({ error: 'Email, password, full name, and invite code are required' });
      return;
    }

    // Validate invite code
    const { rows: inviteRows } = await pool.query(
      `SELECT * FROM invite_codes WHERE code = $1 AND is_active = TRUE`,
      [inviteCode]
    );

    if (inviteRows.length === 0) {
      res.status(400).json({ error: 'Invalid or inactive invite code' });
      return;
    }

    const invite = inviteRows[0];

    // Check if code has expired
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      res.status(400).json({ error: 'Invite code has expired' });
      return;
    }

    // Check if code has reached max uses
    if (invite.uses_count >= invite.max_uses) {
      res.status(400).json({ error: 'Invite code has reached maximum uses' });
      return;
    }

    // Check if user already exists
    const existing = await findUserByEmail(email);
    if (existing) {
      res.status(409).json({ error: 'User with this email already exists' });
      return;
    }

    // Create user
    const user = await createUser(email, password, fullName, role || 'staff');

    // Update user with additional fields if provided
    if (phone || specialization || licenseNumber) {
      await pool.query(
        `UPDATE users SET 
          phone = COALESCE($1, phone),
          specialization = COALESCE($2, specialization),
          license_number = COALESCE($3, license_number)
        WHERE id = $4`,
        [phone || null, specialization || null, licenseNumber || null, user.id]
      );
    }

    // Increment invite code usage
    await pool.query(
      `UPDATE invite_codes SET uses_count = uses_count + 1, updated_at = NOW() WHERE id = $1`,
      [invite.id]
    );

    const token = signJwt(user);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Error in /auth/staff-register', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Example protected route - returns full user profile
app.get('/me', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    // Fetch full user data from database
    const user = await findUserByEmail(req.user!.email);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error in /me endpoint:', error);
    res.status(500).json({ error: 'Failed to load user profile' });
  }
});

function requireAdmin(req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
}

// Admin: Get all users
app.get('/admin/users', authMiddleware, requireAdmin, async (_req: AuthenticatedRequest, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, email, full_name, role, phone, specialization, license_number, created_at 
       FROM users 
       ORDER BY created_at DESC`
    );
    res.json({ users: rows });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Admin: Update user role
app.put('/admin/users/:userId/role', authMiddleware, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    const validRoles = ['admin', 'dentist', 'receptionist', 'dental_assistant', 'technician', 'finance_manager'];
    if (!validRoles.includes(role)) {
      res.status(400).json({ error: 'Invalid role' });
      return;
    }

    const { rows } = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, full_name, role',
      [role, userId]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user: rows[0], message: 'Role updated successfully' });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// Admin: Delete user
app.delete('/admin/users/:userId', authMiddleware, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;

    // Prevent deleting yourself
    if (userId === req.user?.id) {
      res.status(400).json({ error: 'Cannot delete your own account' });
      return;
    }

    const { rows } = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id, email, full_name',
      [userId]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ message: 'User deleted successfully', user: rows[0] });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});


// Admin: Invite Code Management
app.get('/admin/invite-codes', authMiddleware, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    await ensureInviteCodesTable();
    const { rows } = await pool.query('SELECT * FROM invite_codes ORDER BY created_at DESC');
    res.json({ inviteCodes: rows });
  } catch (error) {
    console.error('Error fetching invite codes:', error);
    res.status(500).json({ error: 'Failed to fetch invite codes' });
  }
});

app.post('/admin/invite-codes', authMiddleware, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { code, role, maxUses, expiresAt } = req.body;

    if (!code || !role) {
      res.status(400).json({ error: 'Code and role are required' });
      return;
    }

    await ensureInviteCodesTable();

    // Check if code exists
    const existing = await pool.query('SELECT id FROM invite_codes WHERE code = $1', [code]);
    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'Invite code already exists' });
      return;
    }

    const { rows } = await pool.query(
      `INSERT INTO invite_codes (code, role, max_uses, expires_at)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [code, role, maxUses || 1, expiresAt]
    );

    res.status(201).json({ inviteCode: rows[0] });
  } catch (error) {
    console.error('Error creating invite code:', error);
    res.status(500).json({ error: 'Failed to create invite code' });
  }
});

app.patch('/admin/invite-codes/:codeId/deactivate', authMiddleware, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { codeId } = req.params;
    await ensureInviteCodesTable();

    const { rows } = await pool.query(
      'UPDATE invite_codes SET is_active = FALSE WHERE id = $1 RETURNING *',
      [codeId]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: 'Invite code not found' });
      return;
    }

    res.json({ inviteCode: rows[0] });
  } catch (error) {
    console.error('Error deactivating invite code:', error);
    res.status(500).json({ error: 'Failed to deactivate invite code' });
  }
});

// Patients routes (backend DB, not Supabase)
app.get('/patients', authMiddleware, async (_req: AuthenticatedRequest, res) => {
  try {
    await ensurePatientsTable();
    const patients = await listPatients();
    res.json({ patients });
  } catch (err) {
    console.error('Error in GET /patients', err);
    res.status(500).json({ error: 'Failed to load patients' });
  }
});

app.post('/patients', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    await ensurePatientsTable();
    const body = req.body ?? {};

    // For now we only require core identity fields; emergency contact/phone are optional
    const required = ['name', 'date_of_birth', 'gender', 'address', 'patient_type'];
    const missing = required.filter((f) => !body[f]);
    if (missing.length > 0) {
      res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
      return;
    }

    const normalizeNullable = (value: unknown) => {
      if (value === null || value === undefined) return null;
      const str = String(value).trim();
      return str.length === 0 ? null : str;
    };

    let patientId = body.patient_id ? String(body.patient_id).trim() : '';
    if (!patientId) {
      patientId = await generateNextPatientId();
    }

    const created = await createDbPatient({
      patient_id: patientId,
      name: String(body.name),
      email: normalizeNullable(body.email) as string | null,
      phone: normalizeNullable(body.phone) as string | null,
      date_of_birth: String(body.date_of_birth),
      gender: String(body.gender),
      address: String(body.address),
      emergency_contact: String(body.emergency_contact || 'To be updated'),
      emergency_phone: String(body.emergency_phone || ''),
      insurance: normalizeNullable(body.insurance) as string | null,
      insurance_member_id: normalizeNullable(body.insurance_member_id) as string | null,
      patient_type: String(body.patient_type) as 'insurance' | 'cash',
      last_visit: normalizeNullable(body.last_visit) as string | null,
      next_appointment: normalizeNullable(body.next_appointment) as string | null,
    });

    res.status(201).json({ patient: created });
  } catch (err) {
    console.error('Error in POST /patients', err);
    res.status(500).json({ error: 'Failed to create patient' });
  }
});

app.patch('/patients/:id', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Missing patient id' });
      return;
    }

    await ensurePatientsTable();
    const body = req.body ?? {};

    const normalizeNullable = (value: unknown) => {
      if (value === null || value === undefined) return null;
      const str = String(value).trim();
      return str.length === 0 ? null : str;
    };

    const updates: any = {};
    if (Object.prototype.hasOwnProperty.call(body, 'patient_id')) updates.patient_id = body.patient_id;
    if (Object.prototype.hasOwnProperty.call(body, 'name')) updates.name = body.name;
    if (Object.prototype.hasOwnProperty.call(body, 'email')) updates.email = normalizeNullable(body.email);
    if (Object.prototype.hasOwnProperty.call(body, 'phone')) updates.phone = normalizeNullable(body.phone);
    if (Object.prototype.hasOwnProperty.call(body, 'date_of_birth')) updates.date_of_birth = body.date_of_birth;
    if (Object.prototype.hasOwnProperty.call(body, 'gender')) updates.gender = body.gender;
    if (Object.prototype.hasOwnProperty.call(body, 'address')) updates.address = body.address;
    if (Object.prototype.hasOwnProperty.call(body, 'emergency_contact')) updates.emergency_contact = body.emergency_contact;
    if (Object.prototype.hasOwnProperty.call(body, 'emergency_phone')) updates.emergency_phone = body.emergency_phone;
    if (Object.prototype.hasOwnProperty.call(body, 'insurance')) updates.insurance = normalizeNullable(body.insurance);
    if (Object.prototype.hasOwnProperty.call(body, 'insurance_member_id')) updates.insurance_member_id = normalizeNullable(body.insurance_member_id);
    if (Object.prototype.hasOwnProperty.call(body, 'patient_type')) updates.patient_type = body.patient_type;
    if (Object.prototype.hasOwnProperty.call(body, 'last_visit')) updates.last_visit = body.last_visit;
    if (Object.prototype.hasOwnProperty.call(body, 'next_appointment')) updates.next_appointment = body.next_appointment;

    const updated = await updateDbPatient(id, updates);
    if (!updated) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }

    res.json({ patient: updated });
  } catch (err) {
    console.error('Error in PATCH /patients/:id', err);
    res.status(500).json({ error: 'Failed to update patient' });
  }
});

// Appointments routes
app.get('/appointments', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    await ensureAppointmentsTable();

    const { start, end, limit } = req.query as { start?: string; end?: string; limit?: string };

    let appointments;
    if (start && end) {
      appointments = await listAppointmentsByDateRange(start, end, limit ? Number(limit) : 200);
    } else {
      appointments = await listAppointmentsRecent(limit ? Number(limit) : 100);
    }

    res.json({ appointments });
  } catch (err) {
    console.error('Error in GET /appointments', err);
    res.status(500).json({ error: 'Failed to load appointments' });
  }
});

// Consultation routes (backend Postgres, replacing Supabase consultations)
// GET /consultations - fetch consultations by patient_id, appointment_id, or all
app.get('/consultations', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    await ensureConsultationsTable();
    const { patient_id, appointment_id } = req.query as { patient_id?: string; appointment_id?: string };

    let consultations;
    if (patient_id) {
      consultations = await getConsultationsByPatientId(String(patient_id));
    } else if (appointment_id) {
      consultations = await getConsultationsByAppointmentId(String(appointment_id));
    } else {
      consultations = await getAllConsultations();
    }

    res.json({ consultations });
  } catch (err) {
    console.error('Error in GET /consultations', err);
    res.status(500).json({ error: 'Failed to load consultations' });
  }
});

app.post('/consultations/start', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    await ensureConsultationsTable();
    const { patientId, doctorId, doctorName, appointmentId } = req.body ?? {};

    if (!patientId || !doctorId || !doctorName) {
      res.status(400).json({ error: 'patientId, doctorId and doctorName are required' });
      return;
    }

    const consultation = await createDbConsultation({
      patient_id: String(patientId),
      doctor_id: String(doctorId),
      doctor_name: String(doctorName),
      appointment_id: appointmentId ?? null,
    });

    // If tied to an appointment, optimistically mark it as Checked In
    if (appointmentId) {
      try {
        await updateAppointment(String(appointmentId), { status: 'Checked In' } as any);
      } catch (err) {
        console.warn('Failed to mark appointment as Checked In for consultation start:', err);
      }
    }

    res.status(201).json({ consultation });
  } catch (err) {
    console.error('Error in POST /consultations/start', err);
    res.status(500).json({ error: 'Failed to start consultation' });
  }
});

app.get('/consultations/active', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    await ensureConsultationsTable();
    const { patientId, appointmentId } = req.query as { patientId?: string; appointmentId?: string };

    if (!patientId) {
      res.status(400).json({ error: 'patientId is required' });
      return;
    }

    const consultation = await getActiveConsultation(String(patientId), appointmentId ? String(appointmentId) : undefined);
    res.json({ consultation });
  } catch (err) {
    console.error('Error in GET /consultations/active', err);
    res.status(500).json({ error: 'Failed to load active consultation' });
  }
});

app.get('/consultations/latest-completed', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    await ensureConsultationsTable();
    const { patientId } = req.query as { patientId?: string };

    if (!patientId) {
      res.status(400).json({ error: 'patientId is required' });
      return;
    }

    const consultation = await getLatestCompletedConsultation(String(patientId));
    res.json({ consultation });
  } catch (err) {
    console.error('Error in GET /consultations/latest-completed', err);
    res.status(500).json({ error: 'Failed to load latest completed consultation' });
  }
});

app.get('/consultations/:id', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    await ensureConsultationsTable();
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Missing consultation id' });
      return;
    }

    const consultation = await getConsultationById(id);
    if (!consultation) {
      res.status(404).json({ error: 'Consultation not found' });
      return;
    }

    res.json({ consultation });
  } catch (err) {
    console.error('Error in GET /consultations/:id', err);
    res.status(500).json({ error: 'Failed to load consultation' });
  }
});

// Get consultations waiting for X-ray (temporarily without auth for demo)
app.get('/consultations/xray/waiting', async (req, res) => {
  try {
    await ensureConsultationsTable();

    const { rows } = await pool.query(
      `SELECT c.*, p.name as patient_name, p.patient_id
       FROM consultations c
       LEFT JOIN patients p ON c.patient_id = p.id
       WHERE c.status IN ('xray-pending', 'xray-done', 'waiting-xray')
       ORDER BY c.created_at DESC`
    );

    res.json({ consultations: rows });
  } catch (err) {
    console.error('Error in GET /consultations/xray/waiting', err);
    res.status(500).json({ error: 'Failed to load waiting X-ray consultations' });
  }
});

app.patch('/consultations/:id', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    await ensureConsultationsTable();
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Missing consultation id' });
      return;
    }

    const body = req.body ?? {};
    const updates: Record<string, any> = {};

    const copy = (field: string) => {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        updates[field] = body[field];
      }
    };

    // Simple text / JSON fields
    ['symptoms', 'examination', 'vital_signs', 'diagnosis', 'diagnosis_type', 'treatment_plan',
      'prescriptions', 'follow_up_instructions', 'next_appointment', 'clinical_record',
      'status', 'authorization_no', 'xray_result'].forEach(copy);

    if (Object.prototype.hasOwnProperty.call(body, 'estimated_cost')) {
      updates.estimated_cost = Number(body.estimated_cost) || 0;
    }

    if (Object.prototype.hasOwnProperty.call(body, 'discount_percent')) {
      updates.discount_percent = Number(body.discount_percent) || 0;
    }

    if (Object.prototype.hasOwnProperty.call(body, 'treatment_items')) {
      updates.treatment_items = Array.isArray(body.treatment_items) ? body.treatment_items : [];
    }

    const updated = await updateDbConsultation(id, updates);
    if (!updated) {
      res.status(404).json({ error: 'Consultation not found' });
      return;
    }

    res.json({ consultation: updated });
  } catch (err) {
    console.error('Error in PATCH /consultations/:id', err);
    res.status(500).json({ error: 'Failed to update consultation' });
  }
});

app.post('/consultations/:id/complete', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    await ensureConsultationsTable();
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Missing consultation id' });
      return;
    }

    const finalData = req.body ?? {};

    const completed = await completeDbConsultation(id, finalData);
    if (!completed) {
      res.status(404).json({ error: 'Consultation not found' });
      return;
    }

    // If linked to an appointment, try to mark it as Completed
    if (completed.appointment_id) {
      try {
        await updateAppointment(String(completed.appointment_id), { status: 'Completed' } as any);
      } catch (err) {
        console.warn('Failed to mark appointment as Completed after consultation completion:', err);
      }
    }

    res.json({ consultation: completed });
  } catch (err) {
    console.error('Error in POST /consultations/:id/complete', err);
    res.status(500).json({ error: 'Failed to complete consultation' });
  }
});

// Payments routes (backend Postgres)
app.get('/payments/light', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    await ensurePaymentsTables();
    const {
      status,
      patient_name,
      date_from,
      date_to,
      payment_method,
      min_amount,
      max_amount,
      limit,
      offset,
    } = req.query as Record<string, string | undefined>;

    const filters = {
      status,
      patient_name,
      date_from,
      date_to,
      payment_method,
      min_amount: min_amount ? Number(min_amount) : undefined,
      max_amount: max_amount ? Number(max_amount) : undefined,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    };

    const payments = await listPaymentsLight(filters);
    res.json({ payments });
  } catch (err) {
    console.error('Error in GET /payments/light', err);
    res.status(500).json({ error: 'Failed to load payments' });
  }
});

app.get('/payments/with-items', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    await ensurePaymentsTables();
    const {
      status,
      patient_name,
      date_from,
      date_to,
      payment_method,
      min_amount,
      max_amount,
      limit,
      offset,
    } = req.query as Record<string, string | undefined>;

    const filters = {
      status,
      patient_name,
      date_from,
      date_to,
      payment_method,
      min_amount: min_amount ? Number(min_amount) : undefined,
      max_amount: max_amount ? Number(max_amount) : undefined,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    };

    const payments = await listPaymentsWithItems(filters);
    res.json({ payments });
  } catch (err) {
    console.error('Error in GET /payments/with-items', err);
    res.status(500).json({ error: 'Failed to load payments with items' });
  }
});

app.get('/payments/summary', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    await ensurePaymentsTables();
    const { date_from, date_to } = req.query as { date_from?: string; date_to?: string };
    const summary = await getDbPaymentSummary({ date_from, date_to });
    res.json({ summary });
  } catch (err) {
    console.error('Error in GET /payments/summary', err);
    res.status(500).json({ error: 'Failed to load payment summary' });
  }
});

app.post('/payments/:id/collect', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    await ensurePaymentsTables();
    const { id } = req.params;
    const { amount, paymentMethod, notes } = req.body ?? {};

    if (!id || typeof amount !== 'number' || amount <= 0) {
      res.status(400).json({ error: 'id and positive amount are required' });
      return;
    }

    const updated = await collectDbPayment(
      id,
      Math.round(amount),
      paymentMethod ?? 'cash',
      notes,
      req.user?.email ?? undefined,
    );

    if (!updated) {
      res.status(404).json({ error: 'Payment not found' });
      return;
    }

    res.json({ payment: updated });
  } catch (err) {
    console.error('Error in POST /payments/:id/collect', err);
    res.status(500).json({ error: 'Failed to collect payment' });
  }
});

app.post('/payments', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    await ensurePaymentsTables();
    const { paymentData, lineItems } = req.body ?? {};

    if (!paymentData || !Array.isArray(lineItems) || lineItems.length === 0) {
      res.status(400).json({ error: 'paymentData and at least one line item are required' });
      return;
    }

    const created = await createDbPaymentWithLineItems(paymentData, lineItems);
    res.status(201).json({ payment: created });
  } catch (err) {
    console.error('Error in POST /payments', err);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

app.put('/payments/:id/line-items', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    await ensurePaymentsTables();
    const { id } = req.params;
    const { lineItems } = req.body ?? {};

    if (!id || !Array.isArray(lineItems)) {
      res.status(400).json({ error: 'id and lineItems are required' });
      return;
    }

    await updateDbPaymentLineItems(id, lineItems);
    res.status(204).send();
  } catch (err) {
    console.error('Error in PUT /payments/:id/line-items', err);
    res.status(500).json({ error: 'Failed to update payment line items' });
  }
});

app.get('/payments/by-date-range', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    await ensurePaymentsTables();
    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };

    if (!startDate || !endDate) {
      res.status(400).json({ error: 'startDate and endDate are required' });
      return;
    }

    const data = await getDbPaymentsByDateRange(startDate, endDate);
    res.json(data);
  } catch (err) {
    console.error('Error in GET /payments/by-date-range', err);
    res.status(500).json({ error: 'Failed to load payments by date range' });
  }
});

// Treatment pricing routes (migrated from Supabase to backend Postgres)
app.get('/treatment-pricing', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    await ensureTreatmentPricingTable();

    const { insuranceProvider } = req.query as { insuranceProvider?: string };

    const rows = insuranceProvider
      ? await listTreatmentPricingByProvider(String(insuranceProvider))
      : await listAllTreatmentPricing();

    const treatments = rows.map((row) => ({
      id: row.id,
      name: row.name,
      category: row.category,
      basePrice: row.base_price,
      duration: row.duration,
      description: row.description,
      isActive: row.is_active,
      insuranceProvider: row.insurance_provider,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    res.json({ treatments });
  } catch (err) {
    console.error('Error in GET /treatment-pricing', err);
    res.status(500).json({ error: 'Failed to load treatment pricing' });
  }
});

app.get('/treatment-pricing/providers', authMiddleware, async (_req: AuthenticatedRequest, res) => {
  try {
    await ensureTreatmentPricingTable();

    const rows = await listAllTreatmentPricing();
    const unique = new Map<string, string>();
    const getDisplayName = (code: string): string => {
      switch (code) {
        case 'cash':
          return 'Cash';
        case 'NHIF':
          return 'Strategis';
        case 'GA':
          return 'GA Insurance';
        case 'JUBILEE':
          return 'Jubilee Insurance';
        case 'MO':
          return 'MO Insurance';
        case 'ASSEMBLE':
          return 'Assemble';
        default:
          return code;
      }
    };
    for (const row of rows) {
      const code = normalizeInsuranceProvider(row.insurance_provider);
      if (!unique.has(code)) {
        unique.set(code, getDisplayName(code));
      }
    }

    const providers = Array.from(unique.entries()).map(([code, name]) => ({ code, name }));
    res.json({ providers });
  } catch (err) {
    console.error('Error in GET /treatment-pricing/providers', err);
    res.status(500).json({ error: 'Failed to load insurance providers' });
  }
});

app.post('/treatment-pricing', authMiddleware, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    await ensureTreatmentPricingTable();
    const body = req.body ?? {};

    const required = ['name', 'category', 'basePrice', 'duration', 'insuranceProvider'];
    const missing = required.filter((f) => body[f] === undefined || body[f] === null || String(body[f]).trim() === '');
    if (missing.length > 0) {
      res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
      return;
    }

    const created = await createTreatmentPricing({
      name: String(body.name),
      category: String(body.category),
      base_price: Number(body.basePrice),
      duration: Number(body.duration),
      description: body.description ? String(body.description) : null,
      is_active: body.isActive !== undefined ? Boolean(body.isActive) : true,
      insurance_provider: String(body.insuranceProvider),
    });

    res.status(201).json({
      treatment: {
        id: created.id,
        name: created.name,
        category: created.category,
        basePrice: created.base_price,
        duration: created.duration,
        description: created.description,
        isActive: created.is_active,
        insuranceProvider: created.insurance_provider,
        createdAt: created.created_at,
        updatedAt: created.updated_at,
      },
    });
  } catch (err) {
    console.error('Error in POST /treatment-pricing', err);
    res.status(500).json({ error: 'Failed to create treatment pricing' });
  }
});

app.patch('/treatment-pricing/:id', authMiddleware, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Missing treatment pricing id' });
      return;
    }

    await ensureTreatmentPricingTable();
    const body = req.body ?? {};

    const updates: any = {};
    if (Object.prototype.hasOwnProperty.call(body, 'name')) updates.name = body.name;
    if (Object.prototype.hasOwnProperty.call(body, 'category')) updates.category = body.category;
    if (Object.prototype.hasOwnProperty.call(body, 'basePrice')) updates.base_price = Number(body.basePrice);
    if (Object.prototype.hasOwnProperty.call(body, 'duration')) updates.duration = Number(body.duration);
    if (Object.prototype.hasOwnProperty.call(body, 'description')) updates.description = body.description;
    if (Object.prototype.hasOwnProperty.call(body, 'isActive')) updates.is_active = Boolean(body.isActive);
    if (Object.prototype.hasOwnProperty.call(body, 'insuranceProvider')) {
      updates.insurance_provider = body.insuranceProvider;
    }

    const updated = await updateTreatmentPricing(id, updates);
    if (!updated) {
      res.status(404).json({ error: 'Treatment pricing not found' });
      return;
    }

    res.json({
      treatment: {
        id: updated.id,
        name: updated.name,
        category: updated.category,
        basePrice: updated.base_price,
        duration: updated.duration,
        description: updated.description,
        isActive: updated.is_active,
        insuranceProvider: updated.insurance_provider,
        createdAt: updated.created_at,
        updatedAt: updated.updated_at,
      },
    });
  } catch (err) {
    console.error('Error in PATCH /treatment-pricing/:id', err);
    res.status(500).json({ error: 'Failed to update treatment pricing' });
  }
});

app.delete('/treatment-pricing/:id', authMiddleware, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Missing treatment pricing id' });
      return;
    }

    await ensureTreatmentPricingTable();
    await deleteTreatmentPricing(id);
    res.status(204).send();
  } catch (err) {
    console.error('Error in DELETE /treatment-pricing/:id', err);
    res.status(500).json({ error: 'Failed to delete treatment pricing' });
  }
});

// X-Ray Automation Routes
app.get('/xray/unassigned', authMiddleware, (req, res) => {
  // Return the in-memory list (legacy individual images)
  res.json({ images: unassignedImages });
});

// Triana Studies Routes
app.get('/xray/studies', authMiddleware, (req, res) => {
  // Return unassigned Triana studies with patient info
  const studies = unassignedStudies.map(study => ({
    id: study.id,
    studyGuid: study.studyGuid,
    patientName: study.studyInfo.patient.fullName,
    patientId: study.studyInfo.patient.patientId,
    dateOfBirth: study.studyInfo.patient.dateOfBirth,
    sex: study.studyInfo.patient.sex,
    studyDate: study.studyInfo.studyDate,
    imageTypes: study.studyInfo.images.map(img => img.type),
    imageCount: study.studyInfo.images.length,
    detectedAt: study.detectedAt
  }));
  res.json({ studies });
});

// Configure multer for X-ray image uploads
const xrayStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const consultationId = (req.body as any).consultationId || 'temp';
    const uploadPath = path.join(process.cwd(), 'uploads', 'xray', consultationId);

    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${timestamp}-${originalName}`);
  }
});

const xrayUpload = multer({
  storage: xrayStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|bmp|tif|tiff|dcm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || file.mimetype === 'application/octet-stream';

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (JPEG, PNG, BMP, TIFF, DICOM)'));
    }
  }
});

// Manual X-ray upload endpoint
app.post('/xray/upload', authMiddleware, xrayUpload.array('images', 10), async (req: AuthenticatedRequest, res) => {
  try {
    const { consultationId, note, radiologist } = req.body ?? {};
    const files = req.files as Express.Multer.File[];

    if (!consultationId) {
      res.status(400).json({ error: 'consultationId is required' });
      return;
    }

    if (!files || files.length === 0) {
      res.status(400).json({ error: 'At least one image file is required' });
      return;
    }

    console.log(`[X-Ray Upload] Uploading ${files.length} images for consultation ${consultationId}`);

    // Build image metadata
    const uploadedImages = files.map(file => ({
      url: `/uploads/xray/${consultationId}/${file.filename}`,
      filename: file.originalname,
      uploaded_at: new Date().toISOString(),
      uploaded_by: req.user?.email || 'unknown',
      size: file.size
    }));

    // Update consultation with X-ray result
    const updateResult = await pool.query(
      `UPDATE consultations
       SET status = 'xray-done',
           xray_result = jsonb_set(
             jsonb_set(
               jsonb_set(
                 COALESCE(xray_result, '{}'::jsonb),
                 '{note}',
                 $1::jsonb
               ),
               '{radiologist}',
               $2::jsonb
             ),
             '{images}',
             COALESCE(xray_result->'images', '[]'::jsonb) || $3::jsonb
           ),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [
        JSON.stringify(note || ''),
        JSON.stringify(radiologist || ''),
        JSON.stringify(uploadedImages),
        consultationId
      ]
    );

    if (updateResult.rows.length === 0) {
      res.status(404).json({ error: 'Consultation not found' });
      return;
    }

    console.log(`[X-Ray Upload] Successfully uploaded ${files.length} images`);

    res.json({
      success: true,
      consultation: updateResult.rows[0],
      uploadedImages
    });
  } catch (err) {
    console.error('Error in POST /xray/upload', err);
    res.status(500).json({ error: 'Failed to upload X-ray images' });
  }
});

app.post('/xray/assign', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { filename, patientId, consultationId } = req.body ?? {};
    if (!filename || !patientId) {
      res.status(400).json({ error: 'filename and patientId are required' });
      return;
    }

    // Find the image in our list
    const unassignedIndex = unassignedImages.findIndex(img => img.filename === filename);
    if (unassignedIndex === -1) {
      res.status(404).json({ error: 'Image not found in unassigned queue' });
      return;
    }
    const imageInfo = unassignedImages[unassignedIndex];

    // Read and Upload
    // Note: Reusing logic from watcher would be cleaner, but for now duplicating for speed/safety
    const fileBuffer = fs.readFileSync(imageInfo.filePath);

    // Upload to Supabase Storage
    const targetConsultationId = consultationId || 'manual-assignment'; // if no consult, put in generic folder? 
    // Ideally we force a consultation context, or create a 'records' bucket. 
    // For now let's assume we attach to a specific consultation or fallback.

    // If we have patientId but no consultationId, we might need to find latest open one or create one?
    // Let's assume frontend passes Valid Consultation ID or we fail.
    // Actually, let's keep it flexible: if consultationId, we attach to it. If not, maybe we just store in 'patient-records'? 
    // The current architecture seems to rely on 'consultations' for x-rays.

    let activeConsultationId = consultationId;
    if (!activeConsultationId) {
      // Try to find active
      const consultRes = await pool.query(
        `SELECT id FROM consultations 
           WHERE patient_id = $1 AND status != 'completed' 
           ORDER BY created_at DESC LIMIT 1`,
        [patientId]
      );
      if (consultRes.rows.length > 0) activeConsultationId = consultRes.rows[0].id;
    }

    if (!activeConsultationId) {
      res.status(400).json({ error: 'No active consultation found for this patient. Please start a consultation first.' });
      return;
    }

    const storagePath = `xray/${activeConsultationId}/${Date.now()}-${filename}`;

    // TODO: Implement local file storage or cloud storage (S3, etc.) instead of Supabase
    // For now, store the local file path in the database
    const localStoragePath = path.join(process.cwd(), 'uploads', storagePath);

    // Ensure directory exists
    const dirPath = path.dirname(localStoragePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Copy file to storage location
    fs.copyFileSync(imageInfo.filePath, localStoragePath);

    // Use relative path as the "public URL"
    const publicUrl = `/uploads/${storagePath}`;

    // Update Consultation
    await pool.query(
      `UPDATE consultations 
       SET status = 'xray-done',
           xray_result = jsonb_set(
              COALESCE(xray_result, '{}'::jsonb), 
              '{images}', 
              COALESCE(xray_result->'images', '[]'::jsonb) || $1::jsonb
           )
       WHERE id = $2`,
      [JSON.stringify([publicUrl]), activeConsultationId]
    );

    // Remove from unassigned list
    unassignedImages.splice(unassignedIndex, 1);

    // Delete local file from watch folder
    try {
      fs.unlinkSync(imageInfo.filePath);
    } catch (e) { console.warn('Failed to delete local x-ray file', e); }

    res.json({ success: true, publicUrl });

  } catch (err) {
    console.error('Error in POST /xray/assign', err);
    res.status(500).json({ error: 'Failed to assign x-ray' });
  }
});

app.post('/xray/assign-study', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { studyId, patientId, consultationId } = req.body ?? {};
    if (!studyId || !patientId) {
      res.status(400).json({ error: 'studyId and patientId are required' });
      return;
    }

    // Find the study in unassigned list
    const studyIndex = unassignedStudies.findIndex(s => s.id === studyId);
    if (studyIndex === -1) {
      res.status(404).json({ error: 'Study not found in unassigned queue' });
      return;
    }
    const study = unassignedStudies[studyIndex];

    // Find or verify consultation
    let activeConsultationId = consultationId;
    if (!activeConsultationId) {
      const consultRes = await pool.query(
        `SELECT id FROM consultations 
         WHERE patient_id = $1 AND status != 'completed' 
         ORDER BY created_at DESC LIMIT 1`,
        [patientId]
      );
      if (consultRes.rows.length > 0) activeConsultationId = consultRes.rows[0].id;
    }

    if (!activeConsultationId) {
      res.status(400).json({ error: 'No active consultation found for this patient. Please start a consultation first.' });
      return;
    }

    // Import the upload function
    const { findStudyImages } = await import('./trianaParser');
    const imageMap = findStudyImages(study.studyFolderPath, study.studyInfo.images);

    if (imageMap.size === 0) {
      res.status(400).json({ error: 'No image files found in study folder' });
      return;
    }

    // Upload all images
    const uploadedImages: any[] = [];
    for (const [imageType, imagePaths] of imageMap.entries()) {
      for (const imagePath of imagePaths) {
        const filename = path.basename(imagePath);
        const storagePath = `xray/${activeConsultationId}/${Date.now()}-${filename}`;
        const localStoragePath = path.join(process.cwd(), 'uploads', storagePath);

        const dirPath = path.dirname(localStoragePath);
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }

        fs.copyFileSync(imagePath, localStoragePath);

        uploadedImages.push({
          type: imageType,
          url: `/uploads/${storagePath}`,
          guid: study.studyInfo.images.find(img => img.type === imageType)?.guid || '',
          captured_at: study.studyInfo.studyDate.toISOString(),
          filename: filename
        });
      }
    }

    // Update consultation
    await pool.query(
      `UPDATE consultations 
       SET status = 'xray-done',
           xray_result = jsonb_set(
             jsonb_set(
               jsonb_set(
                 COALESCE(xray_result, '{}'::jsonb),
                 '{triana_study_id}',
                 $1::jsonb
               ),
               '{study_date}',
               $2::jsonb
             ),
             '{images}',
             COALESCE(xray_result->'images', '[]'::jsonb) || $3::jsonb
           )
       WHERE id = $4`,
      [
        JSON.stringify(study.studyInfo.studyGuid),
        JSON.stringify(study.studyInfo.studyDate.toISOString()),
        JSON.stringify(uploadedImages),
        activeConsultationId
      ]
    );

    // Remove from unassigned list
    unassignedStudies.splice(studyIndex, 1);

    res.json({ success: true, imagesUploaded: uploadedImages.length });

  } catch (err) {
    console.error('Error in POST /xray/assign-study', err);
    res.status(500).json({ error: 'Failed to assign study' });
  }
});

// NEW: Upload Study Endpoint for Sync Agent (Carestream/Triana)
app.post('/xray/upload-study', express.json(), async (req, res) => {
  try {
    const { studyInfo, clinicId } = req.body ?? {};

    if (!studyInfo) {
      res.status(400).json({ error: 'studyInfo is required' });
      return;
    }

    console.log('[X-Ray Upload] Received study upload request', {
      studyGuid: studyInfo.studyGuid,
      patient: studyInfo.patient?.fullName || studyInfo.patient?.patient_name,
      imageCount: studyInfo.imageCount || studyInfo.images?.length,
      source: studyInfo.source || 'unknown'
    });

    // Extract patient info (handle both Triana and Carestream formats)
    const patientName = studyInfo.patient?.fullName || studyInfo.patient?.patient_name || 'Unknown Patient';
    const patientDOB = studyInfo.patient?.dateOfBirth || studyInfo.patient?.date_of_birth;
    const patientId = studyInfo.patient?.patientId || studyInfo.patient?.patient_id;

    // Try to find matching patient in database
    let matchedPatient = null;

    // First try by patient ID if available
    if (patientId) {
      const { rows } = await pool.query(
        'SELECT * FROM patients WHERE patient_id = $1 LIMIT 1',
        [patientId]
      );
      if (rows.length > 0) matchedPatient = rows[0];
    }

    // If not found, try by name and DOB
    if (!matchedPatient && patientName && patientDOB) {
      const { rows } = await pool.query(
        `SELECT * FROM patients 
         WHERE LOWER(name) = LOWER($1) AND date_of_birth = $2 
         LIMIT 1`,
        [patientName, patientDOB]
      );
      if (rows.length > 0) matchedPatient = rows[0];
    }

    // If still not found, try fuzzy name match
    if (!matchedPatient && patientName) {
      const { rows } = await pool.query(
        `SELECT * FROM patients 
         WHERE LOWER(name) LIKE LOWER($1) 
         ORDER BY created_at DESC 
         LIMIT 1`,
        [`%${patientName}%`]
      );
      if (rows.length > 0) matchedPatient = rows[0];
    }

    if (!matchedPatient) {
      console.log('[X-Ray Upload] No matching patient found, adding to unassigned queue');

      // Add to unassigned queue for manual assignment
      unassignedStudies.push({
        id: `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        studyGuid: studyInfo.studyGuid,
        studyInfo: {
          ...studyInfo,
          patient: {
            fullName: patientName,
            patientId: patientId || '',
            dateOfBirth: patientDOB || '',
            sex: studyInfo.patient?.sex || 'Unknown',
            ...studyInfo.patient
          }
        },
        studyFolderPath: '', // Not applicable for remote uploads
        detectedAt: new Date().toISOString() as any
      });

      res.json({
        success: true,
        message: 'Study added to unassigned queue for manual assignment',
        matchedPatient: null,
        queuedForManualAssignment: true
      });
      return;
    }

    console.log('[X-Ray Upload] Matched patient:', {
      id: matchedPatient.id,
      name: matchedPatient.name,
      patient_id: matchedPatient.patient_id
    });

    // Find or create active consultation
    let activeConsultation = null;
    const { rows: consultRows } = await pool.query(
      `SELECT * FROM consultations 
       WHERE patient_id = $1 AND status != 'completed' 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [matchedPatient.id]
    );

    if (consultRows.length > 0) {
      activeConsultation = consultRows[0];
      console.log('[X-Ray Upload] Found active consultation:', activeConsultation.id);
    } else {
      // Create new consultation for X-ray
      const newConsult = await createDbConsultation({
        patient_id: matchedPatient.id,
        doctor_id: '',
        doctor_name: 'X-Ray Upload'
      });
      activeConsultation = newConsult;
      console.log('[X-Ray Upload] Created new consultation:', newConsult.id);
    }

    // Handle file uploads from multipart form data
    // Note: Images are sent as files in the request
    // For now, we'll store metadata and mark consultation as having X-rays

    await pool.query(
      `UPDATE consultations 
       SET status = 'xray-done',
           xray_result = jsonb_set(
             COALESCE(xray_result, '{}'::jsonb),
             '{study_uploaded}',
             'true'::jsonb
           ),
           xray_result = jsonb_set(
             xray_result,
             '{study_guid}',
             $1::jsonb
           ),
           xray_result = jsonb_set(
             xray_result,
             '{study_date}',
             $2::jsonb
           )
       WHERE id = $3`,
      [
        JSON.stringify(studyInfo.studyGuid),
        JSON.stringify(studyInfo.studyDate || new Date().toISOString()),
        activeConsultation.id
      ]
    );

    console.log('[X-Ray Upload] Successfully processed study upload');

    res.json({
      success: true,
      message: 'Study uploaded and assigned successfully',
      matchedPatient: {
        id: matchedPatient.id,
        name: matchedPatient.name,
        patient_id: matchedPatient.patient_id
      },
      consultationId: activeConsultation.id
    });

  } catch (err) {
    console.error('Error in POST /xray/upload-study', err);
    res.status(500).json({ error: 'Failed to upload study' });
  }
});


app.delete('/patients/:id', authMiddleware, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const deleted = await deletePatient(id);
    if (!deleted) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }
    res.json({ message: 'Patient deleted successfully' });
  } catch (err: any) {
    if (err.code === '23503') { // Postgres Foreign Key Violation
      res.status(400).json({ error: 'Cannot delete patient because they have existing records (appointments, etc). Please delete those first.' });
      return;
    }
    console.error('Error deleting patient:', err);
    res.status(500).json({ error: 'Failed to delete patient' });
  }
});

// Get patient by ID
app.get('/patients/:id', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { getPatientById } = await import('./patientHelpers');
    const patient = await getPatientById(id);

    if (!patient) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }

    res.json({ patient });
  } catch (err) {
    console.error('Error getting patient:', err);
    res.status(500).json({ error: 'Failed to get patient' });
  }
});

// Search patients
app.get('/patients/search/:term', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { term } = req.params;
    const { searchPatients } = await import('./patientHelpers');
    const patients = await searchPatients(term);
    res.json({ patients });
  } catch (err) {
    console.error('Error searching patients:', err);
    res.status(500).json({ error: 'Failed to search patients' });
  }
});

// Find family members
app.post('/patients/family', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { phone, email } = req.body;
    const { findFamilyMembers } = await import('./patientHelpers');
    const familyMembers = await findFamilyMembers(phone, email);
    res.json({ familyMembers });
  } catch (err) {
    console.error('Error finding family members:', err);
    res.status(500).json({ error: 'Failed to find family members' });
  }
});

// Generate unique patient ID
app.get('/patients/generate/id', authMiddleware, async (_req: AuthenticatedRequest, res) => {
  try {
    const { generateUniquePatientId } = await import('./patientHelpers');
    const patientId = await generateUniquePatientId();
    res.json({ patientId });
  } catch (err) {
    console.error('Error generating patient ID:', err);
    res.status(500).json({ error: 'Failed to generate patient ID' });
  }
});

// Check for duplicate patient
app.post('/patients/check-duplicate', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { name, phone } = req.body;
    const { getPatientByUniqueFields } = await import('./patientHelpers');
    const existing = await getPatientByUniqueFields(name, phone);
    res.json({ exists: !!existing, patient: existing });
  } catch (err) {
    console.error('Error checking duplicate:', err);
    res.status(500).json({ error: 'Failed to check duplicate' });
  }
});



app.post('/appointments', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    await ensureAppointmentsTable();
    const body = req.body ?? {};

    if (!body.patient_name || !body.treatment || !body.dentist || !body.date || !body.time || !body.status) {
      res.status(400).json({ error: 'Missing required appointment fields' });
      return;
    }

    // Normalize optional UUID / text fields: treat empty strings as null
    const normalizeNullable = (value: unknown) => {
      if (value === null || value === undefined) return null;
      const str = String(value).trim();
      return str.length === 0 ? null : str;
    };

    const created = await createAppointment({
      patient_name: String(body.patient_name),
      patient_email: normalizeNullable(body.patient_email),
      patient_phone: normalizeNullable(body.patient_phone),
      treatment: String(body.treatment),
      dentist: String(body.dentist),
      status: String(body.status),
      date: String(body.date),
      time: String(body.time),
      notes: normalizeNullable(body.notes),
      patient_id: normalizeNullable(body.patient_id),
      patienttype: normalizeNullable(body.patienttype),
      insurance: normalizeNullable(body.insurance),
      insurance_member_id: normalizeNullable(body.insurance_member_id),
    });

    // 🔔 Automatically send confirmation email to patient
    // Send email asynchronously - don't wait for it
    sendAppointmentNotification('confirmation', created).catch(err => {
      console.error('Failed to send appointment confirmation email:', err);
    });

    res.status(201).json({ appointment: created });
  } catch (err) {
    console.error('Error in POST /appointments', err);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

app.patch('/appointments/:id', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Missing appointment id' });
      return;
    }

    await ensureAppointmentsTable();
    const body = req.body ?? {};

    // Reuse same normalizer as POST: empty strings → null
    const normalizeNullable = (value: unknown) => {
      if (value === null || value === undefined) return null;
      const str = String(value).trim();
      return str.length === 0 ? null : str;
    };

    // Only include fields that are actually present in the body, so we don't
    // accidentally overwrite NOT NULL columns with null.
    const updates: Record<string, unknown> = {};

    if (Object.prototype.hasOwnProperty.call(body, 'patient_name')) {
      updates.patient_name = body.patient_name;
    }
    if (Object.prototype.hasOwnProperty.call(body, 'patient_email')) {
      updates.patient_email = normalizeNullable(body.patient_email);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'patient_phone')) {
      updates.patient_phone = normalizeNullable(body.patient_phone);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'treatment')) {
      updates.treatment = body.treatment;
    }
    if (Object.prototype.hasOwnProperty.call(body, 'dentist')) {
      updates.dentist = body.dentist;
    }
    if (Object.prototype.hasOwnProperty.call(body, 'status')) {
      updates.status = body.status;
    }
    if (Object.prototype.hasOwnProperty.call(body, 'date')) {
      updates.date = body.date;
    }
    if (Object.prototype.hasOwnProperty.call(body, 'time')) {
      updates.time = body.time;
    }
    if (Object.prototype.hasOwnProperty.call(body, 'notes')) {
      updates.notes = normalizeNullable(body.notes);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'patient_id')) {
      updates.patient_id = normalizeNullable(body.patient_id);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'patienttype')) {
      updates.patienttype = normalizeNullable(body.patienttype);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'insurance')) {
      updates.insurance = normalizeNullable(body.insurance);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'insurance_member_id')) {
      updates.insurance_member_id = normalizeNullable(body.insurance_member_id);
    }

    // --- AUTO PATIENT CREATION LOGIC ---
    // If status is becoming 'Approved' (or is already 'Approved' and we are just now linking?)
    // And we don't have a linked patient_id yet (or the update didn't provide one)
    const isApproving = updates.status === 'Approved' || (body.status === 'Approved' && !updates.status);
    let finalPatientId = updates.patient_id as string | null | undefined;

    // If we haven't explicitly set a patient_id in this update, lets check existing record
    if (finalPatientId === undefined) {
      // We'd need to fetch the existing appointment to know if it already has one.
      // However, `updateAppointment` returns the updated record.
      // It's cleaner to check NOW before updating if we want to "inject" the patient_id into the update.
    }

    if (isApproving) {
      // Fetch current state of appointment to see details if not provided in body
      const { rows: existingApps } = await import('./db').then(m => m.pool.query<DbAppointment>('SELECT * FROM appointments WHERE id = $1', [id]));
      const currentApp = existingApps[0];

      if (currentApp) {
        // Determine effective values (update > current)
        const effPatientId = finalPatientId !== undefined ? finalPatientId : currentApp.patient_id;
        const effName = (updates.patient_name as string) || currentApp.patient_name;
        const effEmail = (updates.patient_email !== undefined ? updates.patient_email : currentApp.patient_email) as string | null;
        const effPhone = (updates.patient_phone !== undefined ? updates.patient_phone : currentApp.patient_phone) as string | null;
        // Use 'cash' as default if not specified
        const effType = ((updates.patienttype !== undefined ? updates.patienttype : currentApp.patienttype) || 'cash') as 'cash' | 'insurance';

        if (!effPatientId) {
          console.log(`[AUTO-CREATE] Appointment ${id} approved but no patient linked. Checking checks...`);

          // 1. Try to find existing patient
          const existingPatient = await findPatientByDetails(effName, effEmail, effPhone);

          if (existingPatient) {
            console.log(`[AUTO-CREATE] Found existing patient ${existingPatient.patient_id} (${existingPatient.name}). Linking...`);
            updates.patient_id = existingPatient.id;
          } else {
            // 2. Create new patient
            console.log(`[AUTO-CREATE] No existing patient found for "${effName}". Creating new...`);
            const newPatientIdStr = await generateNextPatientId();

            // Use appointment date as last_visit/created
            const appDate = (updates.date as string) || currentApp.date;

            const newPatient = await createDbPatient({
              patient_id: newPatientIdStr,
              name: effName,
              email: effEmail,
              phone: effPhone,
              date_of_birth: '1970-01-01', // Placeholder as it is required in DB but maybe unknown
              gender: 'Unknown',           // Placeholder
              address: 'Unknown',          // Placeholder
              emergency_contact: 'Unknown',
              emergency_phone: 'Unknown',
              patient_type: effType,
              last_visit: appDate,
              next_appointment: appDate // Set next appointment to this one? Or leave null?
            });

            console.log(`[AUTO-CREATE] Created new patient ${newPatient.patient_id} (${newPatient.name}). Linking...`);
            updates.patient_id = newPatient.id;
          }
        }
      }
    }

    // Fetch original appointment BEFORE update for comparison
    const { rows: originalRows } = await pool.query<DbAppointment>(
      'SELECT * FROM appointments WHERE id = $1',
      [id]
    );
    const original = originalRows[0];

    const updated = await updateAppointment(id, updates);
    if (!updated) {
      res.status(404).json({ error: 'Appointment not found' });
      return;
    }

    // 🔔 Automatically send modification email if date, time, or dentist changed
    if (original) {
      const dateChanged = updates.date && updates.date !== original.date;
      const timeChanged = updates.time && updates.time !== original.time;
      const dentistChanged = updates.dentist && updates.dentist !== original.dentist;
      const statusChanged = updates.status && updates.status !== original.status;

      // Send email if appointment details changed
      if (dateChanged || timeChanged || dentistChanged) {
        console.log('📧 Appointment modified - sending notification email');

        // Ensure we have phone number from original if not in updated
        if (!updated.patient_phone && original.patient_phone) {
          updated.patient_phone = original.patient_phone;
        }

        sendAppointmentNotification('modification', updated, original).catch(err => {
          console.error('Failed to send appointment modification email:', err);
        });
      }
      // Send confirmation email if status changed to 'approved'
      else if (statusChanged && updates.status === 'approved') {
        console.log('📧 Appointment approved - sending confirmation email');
        sendAppointmentNotification('confirmation', updated).catch(err => {
          console.error('Failed to send appointment approval email:', err);
        });
      }
    }

    res.json({ appointment: updated });
  } catch (err) {
    console.error('Error in PATCH /appointments/:id', err);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

app.delete('/appointments/:id', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Missing appointment id' });
      return;
    }

    await ensureAppointmentsTable();
    await deleteAppointment(id);
    res.status(204).send();
  } catch (err) {
    console.error('Error in DELETE /appointments/:id', err);
    res.status(500).json({ error: 'Failed to delete appointment' });
  }
});

// Email routes
app.post('/emails/appointment', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const body = req.body ?? {};
    const { type, payload } = body as {
      type?: AppointmentEmailType;
      payload?: any;
    };

    if (!type || !payload) {
      res.status(400).json({ error: 'Missing type or payload in request body' });
      return;
    }

    console.log('📧 /emails/appointment sending email:', { type, to: payload.patientEmail });

    const info = await sendAppointmentEmail(type, payload);

    res.json({
      success: true,
      messageId: info.messageId,
    });
  } catch (err) {
    console.error('Error in POST /emails/appointment', err);
    res.status(500).json({ error: 'Failed to send appointment email' });
  }
});

// ==================== LEAVE REQUESTS ROUTES ====================

// Create leave request
app.post('/leave-requests', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    await ensureLeaveRequestsTable();

    const { start_date, end_date, leave_type, reason } = req.body ?? {};

    if (!start_date || !end_date || !leave_type || !reason) {
      res.status(400).json({ error: 'start_date, end_date, leave_type, and reason are required' });
      return;
    }

    const leaveRequest = await createLeaveRequest({
      user_id: req.user!.id,
      start_date,
      end_date,
      leave_type,
      reason,
    });

    // Notify admin about new leave request
    try {
      // Get user's full name from database
      const userResult = await pool.query(
        'SELECT full_name, email FROM users WHERE id = $1',
        [req.user!.id]
      );
      const userName = userResult.rows[0]?.full_name || userResult.rows[0]?.email || req.user!.email;

      await pool.query(
        `INSERT INTO notifications (type, title, message, target_role)
         VALUES ($1, $2, $3, $4)`,
        [
          'leave_request_submitted',
          'New Leave Request',
          `${userName} has requested ${leave_type} leave from ${start_date} to ${end_date}`,
          'admin'
        ]
      );
      console.log('✅ Admin notified about new leave request');
    } catch (notifError) {
      console.error('Failed to create notification:', notifError);
    }

    res.status(201).json({ leaveRequest });
  } catch (err) {
    console.error('Error in POST /leave-requests', err);
    res.status(500).json({ error: 'Failed to create leave request' });
  }
});

// Get leave requests (admin gets all, staff gets their own)
app.get('/leave-requests', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    await ensureLeaveRequestsTable();

    const { status } = req.query;
    const isAdmin = req.user!.role === 'admin';

    const filters: any = {};

    // Non-admin users can only see their own requests
    if (!isAdmin) {
      filters.user_id = req.user!.id;
    }

    if (status) {
      filters.status = status as string;
    }

    const leaveRequests = await getLeaveRequests(filters);
    res.json({ leaveRequests });
  } catch (err) {
    console.error('Error in GET /leave-requests', err);
    res.status(500).json({ error: 'Failed to get leave requests' });
  }
});

// Get single leave request
app.get('/leave-requests/:id', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    await ensureLeaveRequestsTable();

    const { id } = req.params;
    const leaveRequest = await getLeaveRequestById(id);

    if (!leaveRequest) {
      res.status(404).json({ error: 'Leave request not found' });
      return;
    }

    // Check authorization: admin or own request
    const isAdmin = req.user!.role === 'admin';
    const isOwnRequest = leaveRequest.user_id === req.user!.id;

    if (!isAdmin && !isOwnRequest) {
      res.status(403).json({ error: 'Not authorized to view this leave request' });
      return;
    }

    res.json({ leaveRequest });
  } catch (err) {
    console.error('Error in GET /leave-requests/:id', err);
    res.status(500).json({ error: 'Failed to get leave request' });
  }
});

// Approve leave request (admin only)
app.patch('/leave-requests/:id/approve', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    await ensureLeaveRequestsTable();

    if (req.user!.role !== 'admin') {
      res.status(403).json({ error: 'Only admins can approve leave requests' });
      return;
    }

    const { id } = req.params;
    const { review_notes } = req.body ?? {};

    const leaveRequest = await updateLeaveRequestStatus(
      id,
      'approved',
      req.user!.id,
      review_notes
    );

    // Get the leave request details to notify the user
    const leaveDetails = await getLeaveRequestById(id);

    // Notify staff about approval
    if (leaveDetails) {
      try {
        await pool.query(
          `INSERT INTO notifications (type, title, message, target_user)
           VALUES ($1, $2, $3, $4)`,
          [
            'leave_request_approved',
            'Leave Request Approved',
            `Your ${leaveDetails.leave_type} leave request from ${leaveDetails.start_date} to ${leaveDetails.end_date} has been approved. ${review_notes ? `Note: ${review_notes}` : ''}`,
            leaveDetails.user_name || leaveDetails.user_email
          ]
        );
        console.log('✅ Staff notified about leave approval');
      } catch (notifError) {
        console.error('Failed to create notification:', notifError);
      }
    }

    res.json({ leaveRequest });
  } catch (err) {
    console.error('Error in PATCH /leave-requests/:id/approve', err);
    res.status(500).json({ error: 'Failed to approve leave request' });
  }
});

// Reject leave request (admin only)
app.patch('/leave-requests/:id/reject', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    await ensureLeaveRequestsTable();

    if (req.user!.role !== 'admin') {
      res.status(403).json({ error: 'Only admins can reject leave requests' });
      return;
    }

    const { id } = req.params;
    const { review_notes } = req.body ?? {};

    const leaveRequest = await updateLeaveRequestStatus(
      id,
      'rejected',
      req.user!.id,
      review_notes
    );

    // Get the leave request details to notify the user
    const leaveDetails = await getLeaveRequestById(id);

    // Notify staff about rejection
    if (leaveDetails) {
      try {
        await pool.query(
          `INSERT INTO notifications (type, title, message, target_user)
           VALUES ($1, $2, $3, $4)`,
          [
            'leave_request_rejected',
            'Leave Request Rejected',
            `Your ${leaveDetails.leave_type} leave request from ${leaveDetails.start_date} to ${leaveDetails.end_date} has been rejected. ${review_notes ? `Reason: ${review_notes}` : ''}`,
            leaveDetails.user_name || leaveDetails.user_email
          ]
        );
        console.log('✅ Staff notified about leave rejection');
      } catch (notifError) {
        console.error('Failed to create notification:', notifError);
      }
    }

    res.json({ leaveRequest });
  } catch (err) {
    console.error('Error in PATCH /leave-requests/:id/reject', err);
    res.status(500).json({ error: 'Failed to reject leave request' });
  }
});

// Delete leave request (own pending requests only)
app.delete('/leave-requests/:id', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    await ensureLeaveRequestsTable();

    const { id } = req.params;
    const leaveRequest = await getLeaveRequestById(id);

    if (!leaveRequest) {
      res.status(404).json({ error: 'Leave request not found' });
      return;
    }

    // Only allow deletion of own pending requests or admin can delete any
    const isAdmin = req.user!.role === 'admin';
    const isOwnRequest = leaveRequest.user_id === req.user!.id;
    const isPending = leaveRequest.status === 'pending';

    if (!isAdmin && (!isOwnRequest || !isPending)) {
      res.status(403).json({ error: 'Can only delete your own pending requests' });
      return;
    }

    await deleteLeaveRequest(id);
    res.json({ success: true });
  } catch (err) {
    console.error('Error in DELETE /leave-requests/:id', err);
    res.status(500).json({ error: 'Failed to delete leave request' });
  }
});

// Get pending leave requests count (for dashboard)
app.get('/leave-requests/stats/pending-count', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    await ensureLeaveRequestsTable();

    const count = await getPendingLeaveRequestsCount();
    res.json({ count });
  } catch (err) {
    console.error('Error in GET /leave-requests/stats/pending-count', err);
    res.status(500).json({ error: 'Failed to get pending count' });
  }
});

// Get user leave statistics
app.get('/leave-requests/stats/user/:userId', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    await ensureLeaveRequestsTable();

    const { userId } = req.params;
    const { year } = req.query;

    // Check authorization
    const isAdmin = req.user!.role === 'admin';
    const isOwnStats = userId === req.user!.id;

    if (!isAdmin && !isOwnStats) {
      res.status(403).json({ error: 'Not authorized to view these statistics' });
      return;
    }

    const stats = await getUserLeaveStats(userId, year ? parseInt(year as string) : undefined);
    res.json({ stats });
  } catch (err) {
    console.error('Error in GET /leave-requests/stats/user/:userId', err);
    res.status(500).json({ error: 'Failed to get user leave statistics' });
  }
});

// ============================================
// MUSIC PLAYER ENDPOINTS
// ============================================

// Configure multer for music file uploads
const musicStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Use absolute path to ensure uploads go to the correct location
    const uploadDir = path.resolve(process.cwd(), 'uploads/music');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    console.log('Upload directory:', uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const musicUpload = multer({
  storage: musicStorage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'];
    if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(mp3|wav|ogg)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files (MP3, WAV, OGG) are allowed'));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Upload music file
app.post('/music/upload', authMiddleware, musicUpload.single('file'), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    await ensureMusicTables();

    const filePath = `/uploads/music/${req.file.filename}`;
    let title = req.file.originalname.replace(/\.(mp3|wav|ogg)$/i, '');
    let artist = 'Unknown Artist';
    let album = 'Unknown Album';
    let duration = 0;

    // Try to extract metadata
    try {
      const metadata = await parseFile(req.file.path);
      if (metadata.common.title) title = metadata.common.title;
      if (metadata.common.artist) artist = metadata.common.artist;
      if (metadata.common.album) album = metadata.common.album;
      if (metadata.format.duration) duration = Math.floor(metadata.format.duration);
    } catch (metaErr) {
      console.log('Could not extract metadata, using defaults');
    }

    // Add to database
    const musicFile = await addMusicFile({
      filename: req.file.filename,
      title,
      artist,
      album,
      duration,
      file_path: filePath,
      file_size: req.file.size,
      uploaded_by: req.user!.id,
    });

    res.status(201).json({ file: musicFile });
  } catch (err) {
    console.error('Error in POST /music/upload', err);
    // Delete file if database insert failed
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkErr) {
        console.error('Error deleting file:', unlinkErr);
      }
    }
    res.status(500).json({ error: 'Failed to upload music file' });
  }
});

// Serve music files
app.get('/uploads/music/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.resolve(process.cwd(), 'uploads/music', filename);

  console.log('Serving music file:', filePath);

  if (fs.existsSync(filePath)) {
    // Set CORS headers to allow cross-origin audio playback
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Content-Type', 'audio/mpeg');
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

// Get all music files
app.get('/music/files', authMiddleware, async (_req: AuthenticatedRequest, res) => {
  try {
    await ensureMusicTables();
    const files = await getMusicFiles();
    res.json({ files });
  } catch (err) {
    console.error('Error in GET /music/files', err);
    res.status(500).json({ error: 'Failed to get music files' });
  }
});

// Get music file by ID
app.get('/music/files/:id', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const file = await getMusicFileById(id);
    if (!file) {
      res.status(404).json({ error: 'Music file not found' });
      return;
    }
    res.json({ file });
  } catch (err) {
    console.error('Error in GET /music/files/:id', err);
    res.status(500).json({ error: 'Failed to get music file' });
  }
});

// Add music file (simplified - for now just metadata, file upload later)
app.post('/music/files', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    await ensureMusicTables();
    const { filename, title, artist, album, duration, file_path, file_size } = req.body;

    if (!filename || !title || !file_path) {
      res.status(400).json({ error: 'Missing required fields: filename, title, file_path' });
      return;
    }

    const file = await addMusicFile({
      filename,
      title,
      artist,
      album,
      duration: duration || 0,
      file_path,
      file_size: file_size || 0,
      uploaded_by: req.user!.id,
    });

    res.status(201).json({ file });
  } catch (err) {
    console.error('Error in POST /music/files', err);
    res.status(500).json({ error: 'Failed to add music file' });
  }
});

// Delete music file
app.delete('/music/files/:id', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    // Get file info first to get the filename
    const musicFile = await getMusicFileById(id);
    if (!musicFile) {
      res.status(404).json({ error: 'Music file not found' });
      return;
    }

    // Delete physical file
    const filePath = path.resolve(process.cwd(), 'uploads/music', musicFile.filename);
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('Deleted physical file:', filePath);
      }
    } catch (fileErr) {
      console.error('Error deleting physical file:', fileErr);
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database
    const deleted = await deleteMusicFile(id);
    if (!deleted) {
      res.status(404).json({ error: 'Music file not found' });
      return;
    }

    res.json({ message: 'Music file deleted successfully' });
  } catch (err) {
    console.error('Error in DELETE /music/files/:id', err);
    res.status(500).json({ error: 'Failed to delete music file' });
  }
});

// Get all playlists
app.get('/music/playlists', authMiddleware, async (_req: AuthenticatedRequest, res) => {
  try {
    await ensureMusicTables();
    const playlists = await getPlaylists();
    res.json({ playlists });
  } catch (err) {
    console.error('Error in GET /music/playlists', err);
    res.status(500).json({ error: 'Failed to get playlists' });
  }
});

// Get playlist by ID
app.get('/music/playlists/:id', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const playlist = await getPlaylistById(id);
    if (!playlist) {
      res.status(404).json({ error: 'Playlist not found' });
      return;
    }
    res.json({ playlist });
  } catch (err) {
    console.error('Error in GET /music/playlists/:id', err);
    res.status(500).json({ error: 'Failed to get playlist' });
  }
});

// Create playlist
app.post('/music/playlists', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    await ensureMusicTables();
    const { name, description, is_default } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Missing required field: name' });
      return;
    }

    const playlist = await createPlaylist({
      name,
      description,
      is_default: is_default || false,
      created_by: req.user!.id,
    });

    res.status(201).json({ playlist });
  } catch (err) {
    console.error('Error in POST /music/playlists', err);
    res.status(500).json({ error: 'Failed to create playlist' });
  }
});

// Update playlist
app.put('/music/playlists/:id', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { name, description, is_default } = req.body;

    const playlist = await updatePlaylist(id, { name, description, is_default });
    if (!playlist) {
      res.status(404).json({ error: 'Playlist not found' });
      return;
    }

    res.json({ playlist });
  } catch (err) {
    console.error('Error in PUT /music/playlists/:id', err);
    res.status(500).json({ error: 'Failed to update playlist' });
  }
});

// Delete playlist
app.delete('/music/playlists/:id', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const deleted = await deletePlaylist(id);
    if (!deleted) {
      res.status(404).json({ error: 'Playlist not found' });
      return;
    }
    res.json({ message: 'Playlist deleted successfully' });
  } catch (err) {
    console.error('Error in DELETE /music/playlists/:id', err);
    res.status(500).json({ error: 'Failed to delete playlist' });
  }
});

// Get playlist songs
app.get('/music/playlists/:id/songs', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const songs = await getPlaylistItems(id);
    res.json({ songs });
  } catch (err) {
    console.error('Error in GET /music/playlists/:id/songs', err);
    res.status(500).json({ error: 'Failed to get playlist songs' });
  }
});

// Add song to playlist
app.post('/music/playlists/:id/songs', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { music_file_id } = req.body;

    if (!music_file_id) {
      res.status(400).json({ error: 'Missing required field: music_file_id' });
      return;
    }

    const item = await addSongToPlaylist(id, music_file_id);
    res.status(201).json({ item });
  } catch (err) {
    console.error('Error in POST /music/playlists/:id/songs', err);
    res.status(500).json({ error: 'Failed to add song to playlist' });
  }
});

// Remove song from playlist
app.delete('/music/playlists/:id/songs/:songId', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id, songId } = req.params;
    const deleted = await removeSongFromPlaylist(id, songId);
    if (!deleted) {
      res.status(404).json({ error: 'Song not found in playlist' });
      return;
    }
    res.json({ message: 'Song removed from playlist successfully' });
  } catch (err) {
    console.error('Error in DELETE /music/playlists/:id/songs/:songId', err);
    res.status(500).json({ error: 'Failed to remove song from playlist' });
  }
});

// Get user music settings
app.get('/music/settings', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    await ensureMusicTables();
    const settings = await getUserMusicSettings(req.user!.id);
    res.json({ settings: settings || { volume: 50, shuffle: false, repeat_mode: 'none', auto_play: false } });
  } catch (err) {
    console.error('Error in GET /music/settings', err);
    res.status(500).json({ error: 'Failed to get music settings' });
  }
});

// Update user music settings
app.put('/music/settings', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    await ensureMusicTables();
    const { volume, shuffle, repeat_mode, auto_play, default_playlist_id } = req.body;

    const settings = await updateUserMusicSettings(req.user!.id, {
      volume,
      shuffle,
      repeat_mode,
      auto_play,
      default_playlist_id,
    });

    res.json({ settings });
  } catch (err) {
    console.error('Error in PUT /music/settings', err);
    res.status(500).json({ error: 'Failed to update music settings' });
  }
});

// ============================================================================
// JUBILEE BULK SYNC ENDPOINTS
// ============================================================================

/**
 * Get pending preauthorizations for a patient
 */
app.get('/jubilee/preauthorizations/:patientId', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { patientId } = req.params;
    const preauths = await getPendingPreauthorizations(patientId);
    res.json({ preauthorizations: preauths });
  } catch (err) {
    console.error('Error in GET /jubilee/preauthorizations/:patientId', err);
    res.status(500).json({ error: 'Failed to fetch preauthorizations' });
  }
});

/**
 * Get all preauthorizations for a patient (including completed ones)
 */
app.get('/jubilee/preauthorizations/:patientId/all', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { patientId } = req.params;
    const preauths = await getPatientPreauthorizations(patientId);
    res.json({ preauthorizations: preauths });
  } catch (err) {
    console.error('Error in GET /jubilee/preauthorizations/:patientId/all', err);
    res.status(500).json({ error: 'Failed to fetch preauthorizations' });
  }
});

/**
 * Update claim status (used by bulk sync)
 */
app.put('/jubilee/claims/:claimId/status', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { claimId } = req.params;
    const { status, approvedAmount, authorizationNo, rawResponse } = req.body;

    const updated = await updateClaimStatus(
      claimId,
      status,
      approvedAmount || null,
      authorizationNo || null,
      rawResponse || {}
    );

    if (!updated) {
      res.status(404).json({ error: 'Claim not found' });
      return;
    }

    res.json({ success: true, message: 'Claim status updated' });
  } catch (err) {
    console.error('Error in PUT /jubilee/claims/:claimId/status', err);
    res.status(500).json({ error: 'Failed to update claim status' });
  }
});

// Simple root endpoint
app.get('/', (_req, res) => {
  res.json({
    name: 'Elite Dental Backend',
    status: 'running',
  });
});


