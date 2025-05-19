# Project Management System

This is a project management system built with Express.js, PostgreSQL, and Prisma ORM. It provides functionalities for admin and client roles, including project management and user management.

## Prerequisites

*   Node.js (v16 or newer recommended)
*   npm or yarn
*   PostgreSQL server running

## Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd project-management-system
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root directory and copy the contents of `.env.example` (if you create one) or configure it manually:
    ```dotenv
    DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE_NAME?schema=public"
    PORT=3000
    JWT_SECRET="your_strong_jwt_secret"
    ```
    Replace placeholders with your actual PostgreSQL connection details and a strong JWT secret. Make sure the database `DATABASE_NAME` exists.

4.  **Run database migrations:**
    This will create the necessary tables in your database based on the Prisma schema.
    ```bash
    npx prisma migrate dev
    ```
    (Optional) Generate Prisma Client:
    ```bash
    npx prisma generate
    ```

5.  **(Optional) Seed initial data (if you create a seed script):**
    ```bash
    npx prisma db seed
    ```
    (You might need to add a seed script configuration in `package.json` and a `prisma/seed.js` file for this).

## Running the Application

*   **Development mode (with auto-reload using nodemon):**
    ```bash
    npm run dev
    ```

*   **Production mode:**
    ```bash
    npm start
    ```

The server will start on `http://localhost:3000` (or the port specified in your `.env` file).

## API Endpoints

(You would list your main API endpoints here later)

### Auth
*   `POST /api/auth/register` (Admin only: Creates a new user - admin or client)
*   `POST /api/auth/login` (Any user: Logs in and gets a JWT)
*   `GET /api/auth/me` (Authenticated user: Gets their own profile)

### Clients (Managed by Admin)
*   `POST /api/clients` (Admin only: Creates a new client user)
*   `GET /api/clients` (Admin only: Gets all client users)
*   `GET /api/clients/:id` (Admin only: Gets a specific client user)
*   `PUT /api/clients/:id` (Admin only: Updates a client user)
*   `DELETE /api/clients/:id` (Admin only: Deletes a client user)

### Projects
*   `POST /api/projects` (Admin only: Creates a new project)
*   `GET /api/projects/all` (Admin only: Gets all projects)
*   `GET /api/projects/mine` (Client only: Gets projects assigned to the authenticated client)
*   `GET /api/projects/:id` (Admin or assigned Client: Gets a specific project)
*   `PUT /api/projects/:id` (Admin only: Updates a project)
*   `DELETE /api/projects/:id` (Admin only: Deletes a project)


## Prisma Studio (Optional GUI for your database)
```bash
npx prisma studio

**How to Run and Test**

1.  **Start your PostgreSQL server.**
2.  **Ensure your `.env` file is correctly configured.**
3.  **Open your terminal in the project root.**
4.  Run `npm install`.
5.  Run `npx prisma migrate dev` (answer 'y' if prompted to create the db, provide a migration name like 'init').
6.  Run `npm run dev`.
7.  Use a tool like Postman or Insomnia to test the API endpoints.

    *   **First, create an ADMIN user:**
        *   You'll need to either:
            *   Temporarily remove `protect` and `authorize('ADMIN')` from the `/api/auth/register` route to create your first admin user, then add the protection back.
            *   Or, use `npx prisma studio` to manually insert an admin user into the `users` table (remember to hash the password if you do it manually, or set a simple one and change it via API later).
            *   **Easier way for first admin:** Temporarily modify `authController.js`'s `registerUser` to bypass auth for the first user, or make the `role` default to ADMIN if no users exist.
            *   *Let's do the manual Prisma Studio approach or a quick seed for the first admin for simplicity here.*

    *   **Example: Manually create an Admin user via `npx prisma studio`:**
        1.  Run `npx prisma studio`.
        2.  Go to the `User` model.
        3.  Click "Add record".
        4.  Fill in:
            *   `email`: `admin@example.com`
            *   `password`: `hashed_admin_password` (You'd need to pre-hash this. For testing, you can put a plain password and then immediately use the API to "register" this admin properly if your login allows unhashed for a moment, or just use a known hash. *For initial setup, it's often easier to make a small seed script.*)
            *   `name`: `Admin User`
            *   `role`: `ADMIN`
        5.  Save.

    *   **Alternative: Quick Seed for First Admin**
        Create `prisma/seed.js`:
        ```javascript
        import { PrismaClient } from '@prisma/client';
        import bcrypt from 'bcryptjs';

        const prisma = new PrismaClient();

        async function hashPassword(password) {
          const salt = await bcrypt.genSalt(10);
          return bcrypt.hash(password, salt);
        }

        async function main() {
          const adminPassword = await hashPassword('admin123');
          const adminUser = await prisma.user.upsert({
            where: { email: 'admin@example.com' },
            update: {},
            create: {
              email: 'admin@example.com',
              name: 'Super Admin',
              password: adminPassword,
              role: 'ADMIN',
            },
          });
          console.log({ adminUser });
        }

        main()
          .catch(async (e) => {
            console.error(e);
            await prisma.$disconnect();
            process.exit(1);
          })
          .finally(async () => {
            await prisma.$disconnect();
          });
        ```
        Add to `package.json` scripts:
        `"prisma:seed": "node prisma/seed.js"`
        Then run: `npm run prisma:seed`
        (You'll need `bcryptjs` in `devDependencies` too or install it globally for the seed script to run standalone like this, or ensure your `package.json` `type` is `module` and use imports.)

    *   **Once Admin exists:**
        1.  `POST /api/auth/login` with admin credentials to get a token.
        2.  Use this token in the `Authorization: Bearer <token>` header for all protected admin routes.
        3.  `POST /api/auth/register` (as Admin) to create a `CLIENT` user. (e.g., `{ "name": "Test Client", "email": "client@example.com", "password": "password123", "role": "CLIENT" }`)
        4.  Or use `POST /api/clients` (as Admin) to create a `CLIENT` user (e.g., `{ "name": "Another Client", "email": "client2@example.com", "password": "password123" }`).
        5.  Login as the client user (`POST /api/auth/login`) to get their token.
        6.  Test client-specific routes (e.g., `GET /api/projects/mine`).
        7.  Test admin CRUD operations for projects and clients.

This provides a comprehensive setup for your project management system, excluding the payment-related features as requested. Remember to thoroughly test each endpoint and role permission.