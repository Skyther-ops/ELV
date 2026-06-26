[README.md](https://github.com/user-attachments/files/29381988/README.md)
# ELV (Extra Low Voltage) System Management & Operations Dashboard

Welcome to the **ELV System Management & Operations Dashboard** repository. This is an enterprise-grade workspace that integrates a frontend client application with a robust backend service designed to manage, coordinate, and review Extra Low Voltage installations, cabling routing topologies, equipment inventory, building floor plan overlays, business costing tenders, and site inspections.

---

## 🏗️ System Architecture

Below is a conceptual visualization of how the frontend React app and backend Laravel service interact:

```mermaid
graph TD
    subgraph Frontend Client (elv-fe)
        FE[React 19 / Vite 6 SPA]
        MUI[MUI v7 UI Components]
        Map[Leaflet Interactive Maps / SVG Drawing]
        Sig[React Signature Canvas]
        Query[TanStack Query HTTP Services]
    end

    subgraph Backend Service (elv_be)
        BE[Laravel 12 API]
        Sanctum[Sanctum Auth Middleware]
        ProjScope[Project Scope Middleware]
        DB[(MySQL / SQLite Database)]
        Storage[Public Disk Storage]
    end

    FE -->|API requests| Sanctum
    Sanctum --> ProjScope
    ProjScope -->|Verifies X-Project-Id| BE
    BE -->|Eloquent ORM| DB
    BE -->|Saves photos & files| Storage
```

---

## 🌟 Core Features & Modules

### 1. Multi-Project & User Tenant Management
- **Role-based Authentication**: Secure user login, registration, and session management using Laravel Sanctum.
- **Role Assignments**: Users can be categorized into `superadmin`, `supervisor`, `member`, `businesses`, `business_admin`, and `business_higher_admin`.
- **Project Scoping**: Support for multiple active projects. All project-scoped API requests are automatically filtered using a custom backend middleware (`project.scope`) that validates the active project via the custom `X-Project-Id` HTTP header.

### 2. Interactive Floor Layouts & Drawings
- **SVG Annotation Overlays**: Draw components, legends, and zones directly onto floor layouts.
- **System Legends**: Customizable symbols for Public Address (PA), Telecommunication, Building Security (BSS), and custom ELV equipment.
- **Technical Layout Widgets**: Drag-and-drop environmental sensor widgets, status updates, and zone-specific objects.

### 3. Wiring Topology & Cable Routing
- **Ports & Connectors**: Define interactive cable ports on components.
- **Topology Tracing**: Graphically link ports across floors, build wiring circuits, map risers, and initialize server racks.
- **Cable ID Suggestions**: Auto-generate consistent cable nomenclature based on project definitions.

### 4. Business & Procurement (Tender Management)
- **Bill of Quantities (BOQ)**: Bulk upload and parse BOQ items from CSV files, map quantities directly to system designs, and mark components as supplied.
- **Tender Pricing & Estimating**: Manage costings, calculate SST (tax), and version control quotations.
- **Workflow Approvals**: Formally sign off on tenders through a strict verification pipeline:
  `Tender Created` ➡️ `Requested Verification` ➡️ `Checked` ➡️ `Verified` ➡️ `Approved` (with support for digital signature captures).

### 5. On-site Operations & Facilitator Logs
- **Safety Logs & Compliance**: Track Safety PPE audits, document records, safety agendas, and issue notifications.
- **Operations Reports**: Digital creation of Inspection, Daily, Maintenance, Incident, and PDU checksheets.
- **Digital Signatures**: Capture client and inspector signatures on-site using React Signature Canvas.
- **Photo Evidence**: Upload photos directly associated with incident reports or service reviews.

### 6. Team Collaboration
- **In-App Messaging**: Real-time or polled chat client to coordinate between on-site members and backend supervisor portals.
- **Notifications**: System notification alerts for critical events (approval requests, verification changes).

---

## 🛠️ Technology Stack

### Frontend (`elv-fe`)
| Technology / Library | Purpose |
| :--- | :--- |
| **React 19 & Vite 6** | Modern SPA framework and fast development tooling |
| **MUI 7 (Material-UI)** | Themeable UI library and pre-designed components |
| **TailwindCSS v4** | Utility-first CSS classes for layout adjustments |
| **TanStack Query v5** | Server state management and automatic caching |
| **Ky** | Lightweight HTTP client for fetch-based API requests |
| **Capacitor v8** | Native runtime wrapper to package as Android applications |
| **Leaflet & React Leaflet**| Interactive floor map viewing and vector overlays |
| **React Signature Canvas**| On-screen digital signature inputs |
| **Recharts** | Interactive statistics graphs |

### Backend (`elv_be`)
| Technology / Library | Purpose |
| :--- | :--- |
| **Laravel 12.0** | Robust MVC framework for RESTful API routing |
| **Laravel Sanctum** | API Token and Session authentication |
| **PHP >= 8.2** | Modern PHP syntax features |
| **MySQL / SQLite** | High-performance relational database storage |
| **Bitnami Docker Stack** | Standardized container environment |

---

## 📂 Repository Directory Layout

```text
ELV/
├── elv-fe/                        # React Frontend Project
│   ├── android/                   # Capacitor Android Platform Files
│   ├── src/
│   │   ├── @auth/                 # Authentication Providers & Hooks
│   │   ├── @fuse/                 # Base Fuse Layouts & Theming
│   │   ├── app/
│   │   │   ├── (auth)/            # Auth routes (Login, Register)
│   │   │   ├── (control-panel)/   # Main Dashboard pages (Business, Checklist, Wiring, Maintenance)
│   │   │   └── (public)/          # Publicly accessible pages
│   │   ├── api/                   # TanStack hooks, raw API services, and DTO types
│   │   ├── components/            # Reusable UI cards, forms, and views
│   │   └── configs/               # Global routing, menus, and context configurations
│   ├── capacitor.config.ts        # Capacitor configuration
│   └── vite.config.mts            # Vite bundler options
│
├── elv_be/                        # Laravel Backend Project
│   ├── app/
│   │   ├── Http/Controllers/Api/  # REST Controllers for scoped and global resources
│   │   ├── Http/Middleware/       # Scoping and auth check middleware
│   │   └── Models/                # Database Eloquent ORM Models (Tenders, Cables, Reports)
│   ├── database/
│   │   ├── migrations/            # DB Schema definitions (100+ migrations)
│   │   └── seeders/               # Test credentials and initial legend seeding
│   ├── routes/
│   │   └── api.php                # RESTful API route routes and route groups
│   ├── docker-compose.yml         # Container configuration for Bitnami Laravel 11
│   └── artisan                    # Laravel Command-Line Tool
```

---

## 🚀 Setup & Installation

### Backend Setup (`elv_be`)
1. **Navigate to backend directory**:
   ```bash
   cd elv_be
   ```
2. **Environment Variables**:
   Copy the example file and modify your database/environment configurations:
   ```bash
   cp .env.example .env
   ```
3. **Install dependencies**:
   ```bash
   composer install
   ```
4. **Generate Application Key**:
   ```bash
   php artisan key:generate
   ```
5. **Database Setup & Migrations**:
   Ensure you have MySQL running (or database configuration set to SQLite), then execute migrations and database seeders:
   ```bash
   php artisan migrate --seed
   ```
6. **Start Dev Services**:
   You can run Laravel dev servers concurrently (serve, queue, Vite) using the Composer shortcut:
   ```bash
   composer dev
   ```

### Frontend Setup (`elv-fe`)
1. **Navigate to frontend directory**:
   ```bash
   cd ../elv-fe
   ```
2. **Install Node Packages**:
   ```bash
   npm install
   ```
3. **Environment Setup**:
   Configure your backend API base URL (defaults to `http://localhost:8000`).
4. **Run Dev server**:
   ```bash
   npm run dev
   ```

---

## 🔑 Seeder Logins

When the database is seeded using `php artisan db:seed`, the following accounts are created for testing:

| Username / Email | Password | Default Role |
| :--- | :--- | :--- |
| `director@example.com` | `password123` | `superadmin` |
| `supervisor@example.com` | `password123` | `supervisor` |
| `test@example.com` | `password` | `supervisor` |
| `member@example.com` | `password` | `member` |
| `business_admin@example.com` | `password123` | `business_admin` |
| `business_higher_admin@example.com` | `password123` | `business_higher_admin` |
| `business_member@example.com` | `password123` | `businesses` |

---

## ✍️ Guidelines for Developers

### 1. File Placement & Code Consistency
For the frontend, follow the decision tree specified in [directory-structure.md](file:///home/skyther/ELV/elv-fe/directory-structure.md):
- **API integrations** must reside inside the corresponding features' `api/` directory (e.g., `api/hooks/`, `api/services/`).
- **UI Views & Modals** must reside inside `components/views/` or `components/ui/`.

### 2. Managing Project-scoped Data
Any API endpoints scoped under the `project.scope` middleware (see [api.php](file:///home/skyther/ELV/elv_be/routes/api.php)) require a project context.
- **Frontend Calls**: Always pass the `X-Project-Id` header containing the active project UUID or ID.
- **Backend Controllers**: Retrieve project information dynamically from the custom project scope handler.
