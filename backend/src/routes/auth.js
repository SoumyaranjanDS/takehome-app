import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../db.js";
import { sendOTP } from "../utils/mailer.js";

const router = express.Router();

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

router.post("/register", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email and password required" });

  try {
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email],
    );
    if (existingUser.rows.length > 0)
      return res.status(400).json({ error: "Email already registered" });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id",
      [email, passwordHash],
    );
    const userId = newUser.rows[0].id;

    // Generate and send OTP
    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60000); // 10 mins
    const now = new Date();

    await pool.query(
      "INSERT INTO otp_codes (user_id, otp_hash, expires_at, last_sent_at) VALUES ($1, $2, $3, $4)",
      [userId, otpHash, expiresAt, now],
    );

    await sendOTP(email, otp);

    res
      .status(201)
      .json({ message: "Registration successful. OTP sent.", userId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error during registration" });
  }
});

router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp)
    return res.status(400).json({ error: "Email and OTP required" });

  try {
    const userRes = await pool.query(
      "SELECT id, is_verified FROM users WHERE email = $1",
      [email],
    );
    if (userRes.rows.length === 0)
      return res.status(404).json({ error: "User not found" });
    const user = userRes.rows[0];

    if (user.is_verified)
      return res.status(400).json({ error: "User already verified" });

    const otpRes = await pool.query(
      "SELECT * FROM otp_codes WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
      [user.id],
    );
    if (otpRes.rows.length === 0)
      return res.status(400).json({ error: "No OTP found for this user" });

    const otpData = otpRes.rows[0];

    if (new Date() > new Date(otpData.expires_at)) {
      return res.status(400).json({ error: "OTP has expired" });
    }

    if (otpData.attempts >= 5) {
      return res
        .status(400)
        .json({ error: "Maximum attempts reached. Request a new OTP." });
    }

    const isMatch = await bcrypt.compare(otp, otpData.otp_hash);
    if (!isMatch) {
      await pool.query(
        "UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1",
        [otpData.id],
      );
      return res.status(400).json({ error: "Invalid OTP" });
    }

    // Success
    await pool.query("UPDATE users SET is_verified = TRUE WHERE id = $1", [
      user.id,
    ]);
    await pool.query("DELETE FROM otp_codes WHERE user_id = $1", [user.id]); // Single use

    res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error during verification" });
  }
});

router.post("/resend-otp", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  try {
    const userRes = await pool.query(
      "SELECT id, is_verified FROM users WHERE email = $1",
      [email],
    );
    if (userRes.rows.length === 0)
      return res.status(404).json({ error: "User not found" });
    const user = userRes.rows[0];

    if (user.is_verified)
      return res.status(400).json({ error: "User already verified" });

    const otpRes = await pool.query(
      "SELECT * FROM otp_codes WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
      [user.id],
    );

    if (otpRes.rows.length > 0) {
      const lastSent = new Date(otpRes.rows[0].last_sent_at);
      const diffSeconds = (new Date() - lastSent) / 1000;
      if (diffSeconds < 30) {
        return res
          .status(429)
          .json({
            error: "Please wait 30 seconds before requesting a new OTP",
          });
      }
    }

    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60000);
    const now = new Date();

    await pool.query(
      "INSERT INTO otp_codes (user_id, otp_hash, expires_at, last_sent_at) VALUES ($1, $2, $3, $4)",
      [user.id, otpHash, expiresAt, now],
    );

    await sendOTP(email, otp);
    res.status(200).json({ message: "New OTP sent" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error during resend" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email and password required" });

  try {
    const userRes = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (userRes.rows.length === 0)
      return res.status(401).json({ error: "Invalid credentials" });
    const user = userRes.rows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    if (!user.is_verified) {
      return res
        .status(403)
        .json({ error: "User not verified", requiresVerification: true });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || "your_super_secret_jwt_key",
      { expiresIn: "7d" },
    );

    // Check if user has profile setup
    const profileRes = await pool.query(
      "SELECT * FROM user_profiles WHERE user_id = $1",
      [user.id],
    );
    const hasProfile = profileRes.rows.length > 0;

    // Check if user has tasks selected
    const tasksRes = await pool.query(
      "SELECT * FROM user_tasks WHERE user_id = $1 LIMIT 1",
      [user.id],
    );
    const hasTasks = tasksRes.rows.length > 0;

    res.status(200).json({ token, hasProfile, hasTasks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error during login" });
  }
});

export default router;
