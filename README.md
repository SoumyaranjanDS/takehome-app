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
   Create a `.env` file in the `backend` directory. **For your convenience during review**, I have provided a `credentials.txt` file containing the necessary test database and Ethereal Email credentials. You can copy the contents of `credentials.txt` directly into your `.env` file:
   ```env
   PORT=5000
   DATABASE_URL=<paste_from_credentials.txt>
   JWT_SECRET=your_super_secret_jwt_key
   SMTP_HOST=smtp.ethereal.email
   SMTP_PORT=587
   SMTP_USER=<paste_from_credentials.txt>
   SMTP_PASS=<paste_from_credentials.txt>
   ```
   *Note: Ethereal Email is used for testing the OTP flow. The console will also log the OTP for easy local testing without checking the inbox.*

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

**Pre-built APK Connection Details:**
If you are installing the provided `.apk` file directly, please note that it is pre-configured to connect to the backend via `http://10.0.2.2:5000/api`. 
- **Android Emulator:** The APK will work out-of-the-box on an Android Emulator, as `10.0.2.2` automatically routes to your computer's `localhost`.
- **Physical Device:** If you are installing the APK on a physical Android phone, `10.0.2.2` will not work. You must run the project locally, update the IP address in `src/utils/api.js` to match your computer's local Wi-Fi IP address (e.g., `192.168.1.x`), and rebuild the app.

To run the app from source:

1. **Navigate to the mobile app directory:**
   ```bash
   cd PadosiProApp
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure API URL (if needed):**
   Update `src/utils/api.js` with your local IP if testing on a physical device.

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

> **⚠️ Windows Path Length Limitation (Important)**
> If you are building the APK on a Windows machine, you might encounter a build error like `Filename longer than 260 characters`. This is due to React Native's deeply nested C++ code generation. 
> **To fix this:** Move the project folder to a shorter path (e.g., `C:\PadosiPro`) before running the build command, or enable Long Paths in your Windows Registry.
