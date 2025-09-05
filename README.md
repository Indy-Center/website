# Indianapolis Center (ZID) Community Website

> The official community website for Indianapolis Air Route Traffic Control Center on the VATSIM network.

This is the next-generation community platform for Indianapolis Center (ZID), designed to serve flight simulation enthusiasts, virtual air traffic controllers, and virtual pilot clubs in our region. The site will replace the current flyindycenter.com with modern tools for community management, event coordination, and controller certification tracking.

## 🎯 About Indianapolis Center

Indianapolis Center covers 73,000 square miles across 7 states, mirroring the real-world Indianapolis ARTCC. We're building a vibrant community of aviation enthusiasts who share a passion for realistic flight simulation and air traffic control on the VATSIM network.

**What we offer:**
- 🏢 Virtual air traffic control training and operations
- ✈️ Community events and fly-ins
- 📚 Controller certification and mentorship programs
- 🤝 Collaboration with virtual pilot clubs and organizations
- 💬 Active Discord community for real-time coordination

## 🏗️ Architecture Overview

This is a **monorepo** containing two main components:

### Site (`/site`)
- **SvelteKit 5** application running on **Cloudflare Workers**
- **Cloudflare D1** database with **Drizzle ORM**
- **VATSIM Connect** authentication
- Real-time aviation data integration
- Responsive design optimized for aviation operations

### Task Runners (`/task-runners`)
- **Cloudflare Workers** running cron jobs every 5 minutes
- Automatic roster synchronization with VATUSA API
- Controller certification management
- Membership level automation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm 8+
- Cloudflare account with Workers and D1 access

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/IndyCenter/website.git
   cd website
   ```

2. **Install dependencies**
   ```bash
   npm install --workspaces
   ```

3. **Set up environment variables**
   ```bash
   # In site/ directory
   cp .env.example .env.local
   # Configure VATSIM Connect credentials and database connections
   ```

4. **Initialize database**
   ```bash
   npm run db:push
   npm run db:migrate
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## 📋 Available Scripts

### Development
- `npm run dev` - Start site development server
- `npm run dev:site` - Start site development server
- `npm run dev:tasks` - Start task runners development server

### Deployment
- `npm run deploy` - Deploy both site and all task runners
- `npm run deploy:site` - Deploy website only
- `npm run deploy:tasks` - Deploy all task runner environments
- `npm run deploy:sync-memberships` - Deploy membership sync worker
- `npm run deploy:process-roster` - Deploy roster processing worker
- `npm run deploy:process-certificates` - Deploy certificate processing worker

### Database Management
- `npm run db:push` - Push schema changes to production
- `npm run db:migrate` - Run pending migrations
- `npm run db:studio` - Open Drizzle Studio for database management

### Code Quality
- `npm run lint` - Check code formatting
- `npm run format` - Auto-format code
- `npm run check` - TypeScript and Svelte checks

## 👥 User Types & Permissions

### Basic Members
- **Requirements:** Valid VATSIM account
- **Access:** Submit controller feedback, request events
- **Purpose:** Minimum requirement for community participation

### Community Members *(Coming Soon)*
- **Requirements:** Basic membership + community policy agreement
- **Access:** Discord participation, community shaping, enhanced features
- **Purpose:** Active community builders and contributors

### Controllers
- **Requirements:** Community membership + active on ZID roster
- **Access:** Full controller features, certification tracking
- **Grace Period:** 6 months after leaving roster before certificate expiration

### Administrators
- **Access:** User management, system configuration, full administrative control

## 🎓 Controller Certification System

Our progressive certification system mirrors real-world ATC training:

1. **DEL** - Clearance Delivery
2. **GND** - Ground Control (Surface/Apron)
3. **TWR** - Tower Control (Surface/Apron/Tower)
4. **APR** - Approach Control
5. **CTR** - Center Control

**Automatic Features:**
- Certificates assigned based on VATSIM rating upon roster join
- 6-month grace period for returning controllers
- Activity-based certificate maintenance
- Integration with VATUSA roster data

## 🔄 Data Synchronization

Three automated workers maintain real-time data accuracy:

### Roster Processing (Every 5 minutes)
- Fetches complete roster from VATUSA API
- Updates local database with current membership
- Preserves historical data for auditing

### Membership Sync (Every 5 minutes)
- Promotes users to controller status when added to roster
- Demotes to community level when removed from roster
- Assigns appropriate certificates based on VATSIM rating

### Certificate Management (Every 5 minutes)
- Expires certificates after 6 months of inactivity
- Maintains sync status for active roster members
- Supports grace period for returning controllers

## 🔒 Authentication & Security

- **VATSIM Connect OAuth** - Official VATSIM authentication system
- **Secure session management** - HTTP-only cookies with proper expiration
- **Role-based access control** - Granular permissions by membership level
- **Admin protection** - Secured administrative routes with middleware
- **No credential storage** - OAuth tokens managed securely

## 📊 Real-Time Aviation Data

- **Live Events** - VATSIM event feed integration
- **Weather Data** - Real-time METAR for major airports
- **Online Controllers** - Current facility staffing via VNAS
- **Roster Information** - Up-to-date controller qualifications and ratings

## 🛠️ Technology Stack

### Frontend
- **SvelteKit 5** - Modern web framework with TypeScript
- **TailwindCSS 4** - Utility-first styling with forms/typography plugins
- **Unplugin Icons** - Icon system with Material Design icons
- **SvelteKit Superforms** - Enhanced form handling and validation

### Backend
- **Cloudflare Workers** - Serverless edge computing
- **Cloudflare D1** - Serverless SQLite database
- **Drizzle ORM** - Type-safe database operations
- **Arctic** - OAuth client library for secure authentication

### Infrastructure
- **Cloudflare Pages** - Static asset hosting and global CDN
- **Custom Domain** - new.flyindycenter.com
- **Observability** - Built-in monitoring and logging
- **Node.js Compatibility** - Full Node.js API support in Workers

## 📁 Project Structure

```
/
├── package.json              # Workspace root with unified scripts
├── site/                     # SvelteKit website
│   ├── src/
│   │   ├── routes/          # Page routes and API endpoints
│   │   ├── lib/             # Shared components and utilities
│   │   ├── hooks.server.ts  # Authentication middleware
│   │   └── app.html         # HTML template
│   ├── drizzle/             # Database migrations and schema
│   ├── static/              # Static assets
│   └── wrangler.jsonc       # Cloudflare Workers configuration
├── task-runners/             # Cron job workers
│   ├── src/index.ts         # Worker entry point
│   └── wrangler.jsonc       # Multi-environment configuration
└── docs/                    # Documentation (see docs/INDEX.md)
```

## 🤝 Contributing

We welcome contributions from the Indianapolis Center community! Please see our [Contributing Guide](docs/CONTRIBUTING.md) for details on:

- Development workflow
- Code style guidelines
- Testing requirements
- Deployment process

## 📖 Documentation

Detailed documentation is available in the `/docs` folder:

- [Architecture Overview](docs/INDEX.md) - System design and component interactions
- [Database Schema](docs/DATABASE.md) - Table structures and relationships
- [API Documentation](docs/API.md) - Endpoint specifications and usage
- [Authentication Flow](docs/AUTHENTICATION.md) - VATSIM Connect integration
- [Deployment Guide](docs/DEPLOYMENT.md) - Production deployment process

## 🎯 Roadmap

### Phase 1: Core Platform ✅
- [x] User authentication and management
- [x] Controller roster integration
- [x] Certification tracking system
- [x] Real-time data synchronization

### Phase 2: Community Features (In Progress)
- [ ] Event management system
- [ ] Community member tier implementation
- [ ] Enhanced Discord integration
- [ ] Feedback and request systems

### Phase 3: Advanced Features (Planned)
- [ ] Training resource management
- [ ] Analytics and reporting
- [ ] Mobile application
- [ ] Integration with pilot clubs

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏢 Indianapolis Center (ZID)

**Coverage Area:** 73,000 square miles across Indiana, Illinois, Kentucky, Ohio, Michigan, Tennessee, and West Virginia

**Visit Us:**
- **Website:** [new.flyindycenter.com](https://new.flyindycenter.com) (you are here!)
- **Discord:** [discord.indy.center](https://discord.indy.center)
- **VATSIM:** Indianapolis Center (ZID)

---

*Built with ❤️ for the Indianapolis Center community on VATSIM*