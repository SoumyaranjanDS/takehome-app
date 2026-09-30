# PadosiPro - Architecture & Design

## 1. System Architecture

The PadosiPro application follows a standard decoupled Client-Server architecture:

### Backend (Node.js & Express)
- **Framework**: Express.js was chosen for its lightweight nature and flexibility in building REST APIs quickly.
- **Database**: PostgreSQL (hosted on Neon.tech). I chose a relational database because the data (Users, Profiles, Tasks, Categories) has clear relationships and requires strict integrity constraints.
- **Data Access**: Used raw SQL queries via the `pg` driver rather than an ORM (like Prisma or TypeORM). This reduces abstraction overhead and keeps the footprint small for a project of this size.
- **Authentication**: JWT-based stateless authentication. Passwords are encrypted using `bcrypt`.
- **Email Service**: Uses `nodemailer` configured with a real SMTP provider for sending OTPs.

### Frontend (React Native)
- **Framework**: React Native CLI (Native implementation without WebViews or Expo overhead in the final build).
- **Navigation**: `@react-navigation/native-stack` for native, performant screen transitions.
- **State Management**: React's built-in `Context API` is used to manage global authentication and profile state.
- **Styling**: Standard `StyleSheet` with a centralized `colors.js` theme file to maintain design consistency based on the PadosiPro web reference.

---

## 2. Main Trade-offs

1. **Raw SQL vs. ORM**
   - *Decision*: Used raw `pg` queries.
   - *Trade-off*: Writing raw SQL means writing more boilerplate code and lacking TypeScript/ORM type-safety. However, it ensures exact control over the queries (like the `ON CONFLICT` constraints used in DB initialization) and keeps dependencies light.

2. **React Context API vs. Redux/Zustand**
   - *Decision*: Used React Context for global state.
   - *Trade-off*: Context API can lead to unnecessary re-renders if not carefully memoized. However, since the global state is strictly limited to user authentication (`userToken`, `hasProfile`), pulling in a heavy library like Redux would have been overkill.

3. **Cloud Postgres (Neon) vs. Local Docker**
   - *Decision*: Designed to run on a serverless Postgres instance.
   - *Trade-off*: While a `docker-compose.yml` is provided for strict local setups, defaulting to a cloud database removes local environment friction (like OS-specific Docker issues) and speeds up testing. 

---

## 3. What Was Left Out

Due to time constraints, a few production-level features were omitted:
- **Rate Limiting**: While OTP attempts are tracked in the database (max 5), there is no IP-based rate limiting (e.g., `express-rate-limit`) to prevent DDoS attacks on the `/register` endpoint.
- **Refresh Tokens**: The app currently uses a single long-lived JWT. A secure architecture would use short-lived access tokens alongside HTTP-only refresh tokens.
- **E2E Testing**: While the core logic can be unit tested, full end-to-end user flows on the emulator were left out.
- **Offline Caching**: The app currently relies heavily on a network connection. Selected tasks are not cached in `AsyncStorage` for offline viewing.

---

## 4. What I Would Do Next (With Another Week)

If given another week to polish the application, I would focus on:

1. **Robust Security & Caching**: Move the OTP storage from PostgreSQL to **Redis**. OTPs are highly transient data with strict expiry times; Redis TTL (Time To Live) is perfectly suited for this and removes load from the primary database.
2. **CI/CD Pipeline**: Set up **GitHub Actions** and Fastlane to automate linting, testing, and deployment to TestFlight and Google Play internal testing tracks.
3. **Advanced UI & Micro-animations**: Integrate `react-native-reanimated` to add smooth, 60fps micro-animations to the task selection screen (like spring animations when selecting tasks) to make the app feel incredibly premium.
4. **Comprehensive Testing Suite**: Introduce **Detox** for automated End-to-End (E2E) testing on the mobile application, ensuring that the full registration and task selection flow never breaks during updates.
