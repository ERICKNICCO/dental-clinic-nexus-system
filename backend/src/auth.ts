
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { pool } from './db';

// Shape of a user row in the database
export interface User {
  id: string;
  email: string;
  password_hash: string;
  full_name: string | null;
  role: string | null;
  created_at: Date;
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES_IN = '7d'; // 7 days - extended for clinic operations

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role?: string | null;
  };
}

// Ensure the users table exists (idempotent)
export async function ensureUsersTable(): Promise<void> {
  // Ensure UUID support is available
  await pool.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');

  await pool.query(
    `
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT,
        role TEXT,
        phone TEXT,
        specialization TEXT,
        license_number TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `,
  );
}

export async function ensureInviteCodesTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS invite_codes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL,
      max_uses INTEGER NOT NULL DEFAULT 1,
      uses_count INTEGER NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      expires_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const { rows } = await pool.query<User>(
    'SELECT * FROM users WHERE email = $1 LIMIT 1',
    [email.toLowerCase().trim()],
  );
  return rows[0] ?? null;
}

export async function createUser(
  email: string,
  password: string,
  fullName?: string,
  role: string = 'staff',
): Promise<User> {
  const normalizedEmail = email.toLowerCase().trim();
  const passwordHash = await bcrypt.hash(password, 10);

  const { rows } = await pool.query<User>(
    `
      INSERT INTO users (email, password_hash, full_name, role)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
    [normalizedEmail, passwordHash, fullName ?? null, role],
  );

  return rows[0];
}

export function signJwt(user: User): string {
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.slice('Bearer '.length).trim();

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      sub: string;
      email: string;
      role?: string | null;
    };

    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (err) {
    console.error('JWT verification error', err);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
