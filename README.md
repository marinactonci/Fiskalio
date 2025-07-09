# Fiskalio 📊

**A comprehensive bill tracking and management application for modern households and properties.**

Fiskalio is a full-stack web application that helps you organize, track, and manage bills across multiple properties or profiles. Whether you're managing utilities for different apartments, tracking household expenses, or organizing business bills, Fiskalio provides an intuitive interface with powerful analytics and calendar views.

## ✨ Features

### 🏠 **Profile Management**

- Create and manage multiple profiles (properties, households, etc.)
- Customize each profile with colors and address information
- Track bill statistics and payment performance per profile

### 📄 **Bill Tracking**

- Add bills to specific profiles with optional e-bill information
- Create monthly bill instances with amounts, due dates, and descriptions
- Mark bills as paid/unpaid with automatic overdue detection
- Support for e-bill credentials (username, password, links)

### 📅 **Calendar View**

- Visual monthly calendar showing all bill instances
- Color-coded bills by profile with payment status indicators
- Filter by profile or payment status (all/paid/unpaid)
- Quick edit functionality directly from calendar view
- Overdue bill highlighting

### 📈 **Analytics & Dashboards**

- **Profile Dashboard**: Payment performance, monthly trends, top bills by amount
- **Bill Dashboard**: Instance statistics, financial summaries, current month highlights
- Real-time statistics with paid/unpaid/overdue counts
- Monthly comparison and change tracking

### 🎨 **Modern UI/UX**

- Beautiful, responsive design with dark/light mode support
- Gradient text headers and smooth animations
- Card-based layouts with hover effects
- Intuitive navigation and breadcrumbs

## 🛠️ Tech Stack

### **Frontend**

- **[Next.js 15](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** - UI library with latest features
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe development
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first styling
- **[Shadcn](https://ui.shadcn.com/)** - UI component library
- **[Lucide React](https://lucide.dev/)** - Beautiful icon library

### **Backend & Database**

- **[Convex](https://convex.dev/)** - Real-time backend platform
- Real-time queries and mutations
- Automatic type generation
- Built-in authentication integration

- **[Clerk](https://clerk.com/)** - Complete authentication solution
- User management and session handling
- Secure JWT token validation

### **Development Tools**

- **[ESLint](https://eslint.org/)** - Code linting
- **[Prettier](https://prettier.io/)** - Code formatting
- **[TypeScript](https://www.typescriptlang.org/)** - Static type checking

## 🏗️ Project Structure

```
├── app/                          # Next.js App Router
│   ├── _components/             # Shared app components
│   ├── bill/[id]/              # Individual bill pages
│   │   └── _components/        # Bill-specific components
│   ├── calendar/               # Calendar view
│   │   └── _components/        # Calendar components
│   ├── profile/[id]/           # Profile pages
│   │   └── _components/        # Profile-specific components
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Home page
├── components/                  # Reusable UI components
│   ├── ui/                     # Shadcn/ui components
│   ├── ConvexClientProvider.tsx # Convex provider
│   ├── Navbar.tsx              # Navigation component
│   └── ThemeProvider.tsx       # Theme provider
├── convex/                     # Backend logic
│   ├── _generated/             # Auto-generated types
│   ├── auth.config.ts          # Authentication config
│   ├── billInstances.ts        # Bill instance queries/mutations
│   ├── bills.ts                # Bill queries/mutations
│   ├── profiles.ts             # Profile queries/mutations
│   ├── schema.ts               # Database schema
│   └── crons.ts                # Scheduled functions
├── hooks/                      # Custom React hooks
├── lib/                        # Utility functions
├── schemas/                    # Validation schemas
└── package.json                # Dependencies and scripts
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- A [Convex](https://convex.dev/) account
- A [Clerk](https://clerk.com/) account

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/fiskalio.git
   cd fiskalio
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up Convex**

   ```bash
   npx convex dev
   ```

   Follow the prompts to create a new Convex project.

4. **Set up Clerk Authentication**
   - Create a new Clerk application
   - Copy your Clerk Publishable Key and Secret Key
   - Follow the [Convex Clerk integration guide](https://docs.convex.dev/auth/clerk)
   - Uncomment the Clerk provider in `convex/auth.config.ts`
   - Add `CLERK_JWT_ISSUER_DOMAIN` to your Convex environment variables

5. **Start the development server**
   ```bash
   npm run dev
   ```

The app will be available at `http://localhost:3000`.

## 📖 Usage

### Creating Your First Profile

1. Sign up/login using Clerk authentication
2. Create a new profile (e.g., "Main Apartment", "Summer House")
3. Add address and choose a color for easy identification

### Adding Bills

1. Navigate to a profile
2. Add bills with names and optional e-bill information
3. Create monthly instances with amounts and due dates

### Calendar Management

1. Use the calendar view to see all bills at a glance
2. Filter by profile or payment status
3. Click on bills to quickly edit or mark as paid

### Analytics

- View profile dashboards for payment performance insights
- Track monthly trends and spending patterns
- Monitor overdue bills and payment rates

## 🎯 Key Features Explained

### **Bill Instances**

Bills in Fiskalio work through a pattern of templates and instances:

- A **Bill** is the template (e.g., "Electricity Bill")
- A **Bill Instance** is the monthly occurrence with specific amount and due date
- This allows tracking the same bill type across multiple months

### **E-Bill Integration**

Store credentials for online bill portals:

- Website links for quick access
- Username/password storage (encrypted)
- Quick access to pay bills online

### **Smart Calendar**

- Color-coded by profile for easy identification
- Visual status indicators (paid/unpaid/overdue)
- Monthly navigation with quick edit capabilities

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Live Demo**: [https://fiskalio.vercel.app](https://fiskalio.vercel.app)
- **Portfolio**: [https://www.marinactonci.com/](https://www.marinactonci.com/)
- **LinkedIn**: [https://www.linkedin.com/in/marinactonci/](https://www.linkedin.com/in/marinactonci/)
