# PadosiPro - Full-Stack Developer Assignment

This repository contains the complete implementation of the PadosiPro Take-Home Assignment, featuring a React Native mobile application and a Node.js/PostgreSQL backend API.

## Features

- **Backend API:** Built with Node.js and Express, connected to a PostgreSQL database.
- **Security:** Secure password storage using bcrypt. JWT authentication for sessions.
- **OTP Verification:** Email verification flow using a 6-digit OTP (valid for 10 minutes, max 5 attempts, 30s resend cooldown).
- **Mobile App:** Built natively using React Native.
- **SaaS Aesthetic:** Clean, professional, minimal UI/UX for all screens, modeled on app.padosipro.com.

## Prerequisites

- Node.js (v18 or higher recommended)
- PostgreSQL (or Docker to run the database)
- Android Studio / Android Emulator (for running the mobile app locally)

## Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Variables:**
   A `.env.example` file is provided in the `backend` directory. 
   Create a `.env` file in the `backend` directory and configure the environment variables:
   ```env
   PORT=5000
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/padosipro
   JWT_SECRET=your_super_secret_jwt_key
   SMTP_HOST=smtp.ethereal.email
   SMTP_PORT=587
   SMTP_USER=your_ethereal_user
   SMTP_PASS=your_ethereal_pass
   ```
   *Note: Ethereal Email is recommended for testing the OTP flow. The console will also log the OTP for easy local testing.*

4. **Initialize Database:**
   Ensure PostgreSQL is running and the database specified in your `DATABASE_URL` exists.
   Run the database initialization script to create tables and seed tasks:
   ```bash
   npm run init-db
   ```

5. **Start the Backend Server:**
   ```bash
   npm run dev
   ```

## Mobile App Setup

1. **Navigate to the mobile app directory:**
   ```bash
   cd PadosiProApp
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure API URL:**
   If you are running the backend locally and testing on an Android Emulator, ensure the API URL in `src/utils/api.js` is set to `http://10.0.2.2:5000/api`. If testing on a physical device, use your machine's local IP address.

4. **Run the App:**
   ```bash
   npm run android
   ```

## Running Tests

Tests for the risky logic (OTP generation, expiry, attempt limits, and login rules) have been written for the backend using `vitest` and `supertest`.

To run the backend tests:
```bash
cd backend
npx vitest run
```

## Build APK

To generate a standalone APK for Android, you can run the following command from the `PadosiProApp/android` directory:

```bash
cd PadosiProApp/android
./gradlew assembleRelease
```
The built APK will be located at `PadosiProApp/android/app/build/outputs/apk/release/app-release.apk`.
