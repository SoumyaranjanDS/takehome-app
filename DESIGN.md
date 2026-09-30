# System Design

## Architecture

The application adopts a standard two-tier architecture tailored for mobile-first experiences.
- **Frontend (Mobile App):** Built using React Native bare workflow, utilizing React Navigation for routing and Context API for global state management (Authentication and Onboarding flows). The UI follows a strict SaaS-inspired design language with custom reusable components.
- **Backend API:** A Node.js and Express.js REST API using PostgreSQL as the persistent data store. It serves as the single source of truth for user accounts, profiles, and task catalogue selections.

**Key Libraries:**
- **Frontend:** `react-navigation` (navigation stack control based on app state), `axios` (API requests), `react-native-safe-area-context` (handling notches and modern displays).
- **Backend:** `pg` (direct SQL querying without ORM overhead), `bcrypt` (password and OTP hashing), `jsonwebtoken` (stateless authentication), `nodemailer` (SMTP email integration).

## Main Trade-offs

1. **Context API vs. Redux/Zustand:**
   - *Trade-off:* Context API was used instead of a heavier state management library like Redux.
   - *Reasoning:* The current state requirements are relatively simple (authentication token, setup completion flags). Redux would add unnecessary boilerplate for this scale.

2. **Raw SQL (`pg`) vs. ORM (Prisma/Sequelize):**
   - *Trade-off:* Direct parameterized queries were used over an ORM.
   - *Reasoning:* Ensures absolute transparency and fine-grained control over the database schema and query performance, though it sacrifices some type safety and developer speed compared to an ORM like Prisma.

3. **Stateless JWT vs. Stateful Sessions:**
   - *Trade-off:* JWTs were chosen for authentication.
   - *Reasoning:* JWTs reduce database round-trips for route authorization, which is ideal for mobile apps facing intermittent connectivity. However, revoking JWTs before expiry is harder than destroying a session.

4. **OTP Hashing:**
   - *Trade-off:* OTPs are stored as bcrypt hashes in the database.
   - *Reasoning:* While OTPs are short-lived, hashing them ensures they cannot be read by an attacker with database access. The trade-off is the CPU cost of bcrypt hashing/comparing on verification, which is negligible for OTPs.

## What Was Left Out

- **Redux / Complex State Management:** Deferred due to scope constraints; Context API was sufficient.
- **Comprehensive E2E Testing:** We implemented unit tests for risky backend logic (auth/OTP), but mobile end-to-end testing (e.g., Detox or Appium) was excluded.
- **Offline Mode Persistence:** The app heavily relies on network calls. Local caching of tasks or profile data using MMKV or SQLite wasn't implemented.
- **Social Login:** OAuth integrations (Google/Apple) were omitted to focus on the core email/OTP flow.
- **Refresh Tokens:** The login flow provides a single JWT. A dual-token architecture (short-lived access token + long-lived refresh token) would be more secure.

## Next Steps (If given another week)

1. **Implement Refresh Tokens:** Upgrade the authentication system to use short-lived access tokens and secure refresh tokens to enhance security and allow seamless session resumption.
2. **Offline Support:** Introduce a local caching layer (e.g., React Native MMKV) to persist the task catalogue and user profile locally, ensuring the home screen loads instantly and gracefully handles network failures.
3. **End-to-End Testing:** Set up a Detox testing suite for the React Native app to automatically simulate user interactions (registration, OTP verification, task selection) across iOS and Android emulators.
4. **CI/CD Pipeline:** Create GitHub Actions workflows to automatically run the backend Vitest suite, lint the React Native codebase, and optionally trigger Fastlane for automated TestFlight and Play Store distribution.
5. **Business Name Requirement:** Add logic to handle the "Business Name" as an optional field depending on the user's role or plan tier, keeping the consumer flow minimal.
