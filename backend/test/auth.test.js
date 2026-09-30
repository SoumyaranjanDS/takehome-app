import express from 'express';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';
import authRoutes from '../src/routes/auth.js';
import pool from '../src/db.js';
import * as mailer from '../src/utils/mailer.js';

vi.mock('../src/db.js', () => ({
  default: {
    query: vi.fn(),
  },
}));

vi.mock('../src/utils/mailer.js', () => ({
  sendOTP: vi.fn(),
}));

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Routes (Risky Logic)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('OTP Expiry', () => {
    it('should reject an expired OTP', async () => {
      const mockUser = { id: 1, is_verified: false };
      pool.query.mockResolvedValueOnce({ rows: [mockUser] }); // user query

      const hash = await bcrypt.hash('123456', 1);
      const expiredDate = new Date(Date.now() - 1000); // Past date
      
      pool.query.mockResolvedValueOnce({ 
        rows: [{ id: 1, otp_hash: hash, expires_at: expiredDate, attempts: 0 }] 
      }); // otp query

      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ email: 'test@example.com', otp: '123456' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('OTP has expired');
    });

    it('should accept a valid OTP within expiry', async () => {
      const mockUser = { id: 1, is_verified: false };
      pool.query.mockResolvedValueOnce({ rows: [mockUser] });

      const hash = await bcrypt.hash('123456', 1);
      const validDate = new Date(Date.now() + 60000); // Future date
      
      pool.query.mockResolvedValueOnce({ 
        rows: [{ id: 1, otp_hash: hash, expires_at: validDate, attempts: 0 }] 
      });

      pool.query.mockResolvedValueOnce({ rowCount: 1 }); // update user
      pool.query.mockResolvedValueOnce({ rowCount: 1 }); // delete otp

      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ email: 'test@example.com', otp: '123456' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Email verified successfully');
    });
  });

  describe('OTP Attempt Limits', () => {
    it('should reject and increment attempt if OTP is wrong', async () => {
      const mockUser = { id: 1, is_verified: false };
      pool.query.mockResolvedValueOnce({ rows: [mockUser] });

      const hash = await bcrypt.hash('654321', 1); // Correct is 654321
      const validDate = new Date(Date.now() + 60000);
      
      pool.query.mockResolvedValueOnce({ 
        rows: [{ id: 1, otp_hash: hash, expires_at: validDate, attempts: 2 }] 
      });

      pool.query.mockResolvedValueOnce({ rowCount: 1 }); // Increment attempt query

      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ email: 'test@example.com', otp: '123456' }); // Wrong OTP

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid OTP');
      
      // Check that the increment attempts query was called
      expect(pool.query).toHaveBeenCalledWith(
        'UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1',
        [1]
      );
    });

    it('should reject if maximum attempts reached', async () => {
      const mockUser = { id: 1, is_verified: false };
      pool.query.mockResolvedValueOnce({ rows: [mockUser] });

      const hash = await bcrypt.hash('123456', 1);
      const validDate = new Date(Date.now() + 60000);
      
      // 5 attempts already
      pool.query.mockResolvedValueOnce({ 
        rows: [{ id: 1, otp_hash: hash, expires_at: validDate, attempts: 5 }] 
      });

      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ email: 'test@example.com', otp: '123456' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Maximum attempts reached. Request a new OTP.');
    });
  });

  describe('OTP Resend Limits', () => {
    it('should enforce 30-second cooldown for resend', async () => {
      const mockUser = { id: 1, is_verified: false };
      pool.query.mockResolvedValueOnce({ rows: [mockUser] });

      const recentDate = new Date(Date.now() - 10000); // 10 seconds ago
      
      pool.query.mockResolvedValueOnce({ 
        rows: [{ last_sent_at: recentDate }] 
      });

      const res = await request(app)
        .post('/api/auth/resend-otp')
        .send({ email: 'test@example.com' });

      expect(res.status).toBe(429);
      expect(res.body.error).toContain('Please wait 30 seconds');
    });

    it('should allow resend after 30 seconds', async () => {
      const mockUser = { id: 1, is_verified: false };
      pool.query.mockResolvedValueOnce({ rows: [mockUser] });

      const oldDate = new Date(Date.now() - 40000); // 40 seconds ago
      
      pool.query.mockResolvedValueOnce({ 
        rows: [{ last_sent_at: oldDate }] 
      });

      pool.query.mockResolvedValueOnce({ rowCount: 1 }); // Insert new OTP

      const res = await request(app)
        .post('/api/auth/resend-otp')
        .send({ email: 'test@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('New OTP sent');
      expect(mailer.sendOTP).toHaveBeenCalled();
    });
  });

  describe('Login Rules', () => {
    it('should block login if user is unverified', async () => {
      const hash = await bcrypt.hash('password123', 1);
      pool.query.mockResolvedValueOnce({ 
        rows: [{ id: 1, password_hash: hash, is_verified: false }] 
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('User not verified');
      expect(res.body.requiresVerification).toBe(true);
    });

    it('should allow login if user is verified', async () => {
      const hash = await bcrypt.hash('password123', 1);
      pool.query.mockResolvedValueOnce({ 
        rows: [{ id: 1, password_hash: hash, is_verified: true }] 
      });
      // Check profile setup
      pool.query.mockResolvedValueOnce({ rows: [] }); 
      // Check tasks
      pool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.hasProfile).toBe(false);
      expect(res.body.hasTasks).toBe(false);
    });
  });
});
