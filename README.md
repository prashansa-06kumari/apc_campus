# Campus Management System

A full-stack campus management application with role-based dashboards for **students**, **faculty**, and **administrators**. The backend is a Spring Boot REST API with JWT authentication; the frontend is a React single-page app served by Vite.

## Tech stack

| Layer | Technologies |
|-------|----------------|
| Backend | Java 17, Spring Boot 3.5, Spring Security, Spring Data JPA, JWT |
| Database | MySQL 8 (H2 available for local testing via commented config) |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Router, Axios |

## Features

- **Authentication** — Sign up, login, JWT sessions, role-based route protection
- **Student** — Dashboard, attendance, marks, fees, tests & assignments, timetable, library issues, feedback, notifications
- **Faculty** — Student list, attendance marking, tests & grading, marks, assignments, timetable, notifications
- **Admin** — User management, attendance/marks/fee reports, library book issuing, feedback responses, analytics

## Prerequisites

- [JDK 17](https://adoptium.net/) or newer
- [Apache Maven](https://maven.apache.org/)
- [Node.js](https://nodejs.org/) 18+ (for the frontend)
- [MySQL](https://www.mysql.com/) 8 running on `localhost:3306`

## Project structure

```
apc_campus/
├── src/main/java/          # Spring Boot API
├── src/main/resources/
│   └── application.properties
├── frontend/               # React + Vite app
│   ├── src/
│   └── package.json
└── pom.xml
```

## Configuration

Edit `src/main/resources/application.properties` before starting the backend:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/campus_management90?createDatabaseIfNotExist=true
spring.datasource.username=your_mysql_user
spring.datasource.password=your_mysql_password
server.port=8080
```

The database is created automatically if it does not exist (`createDatabaseIfNotExist=true`).

For quick local testing without MySQL, uncomment the H2 settings at the top of `application.properties` and comment out the MySQL block.

## Running locally

Start **both** the backend and frontend. The Vite dev server proxies `/api` requests to the backend.

### 1. Backend (port 8080)

From the `apc_campus` directory:

```powershell
mvn spring-boot:run
```

Wait until you see `Started CampusManagementApplication` in the logs.

### 2. Frontend (port 5173)

In a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

### Production build (frontend only)

```powershell
cd frontend
npm run build
npm run preview
```

## URLs

| Service | URL |
|---------|-----|
| Web app | http://localhost:5173 |
| REST API | http://localhost:8080/api |

## User roles

After sign-up or login, users are redirected to the dashboard for their role:

| Role | Route |
|------|-------|
| Student | `/student` |
| Faculty | `/faculty` |
| Admin | `/admin` |

## API overview

All authenticated endpoints expect a JWT in the `Authorization` header:

```
Authorization: Bearer <token>
```

| Prefix | Description |
|--------|-------------|
| `/api/auth` | Sign up, login, current user (`/me`) |
| `/api/student` | Student dashboard and academic data |
| `/api/faculty` | Faculty teaching and grading tools |
| `/api/admin` | Administration, reports, and user management |
| `/api/timetable` | Timetable CRUD and queries |

