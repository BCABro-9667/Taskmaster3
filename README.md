# Taskmaster3 - AI-Powered Task Management System

A modern, full-stack task management application built with Next.js 15, featuring AI capabilities, real-time collaboration, and offline-first architecture.

## 🚀 Features

### Core Functionality
- **Task Management**: Create, edit, assign, and track tasks with deadlines
- **Rich Notes**: Full-featured note-taking with Quill rich text editor
- **URL Storage**: Organize and categorize important links
- **Team Collaboration**: Manage assignees with profiles and designations
- **User Profiles**: Customizable profiles with feedback system

### Advanced Features
- **AI Integration**: 
  - Smart deadline suggestions using Google AI
  - URL shortening capabilities
- **Real-time Updates**: Socket.IO powered live synchronization
- **Offline Support**: PWA with service worker for offline functionality
- **Local Storage Sync**: Seamless switching between database and local storage
- **Responsive Design**: Mobile-first UI with bottom navigation
- **Dark Mode**: Full theme support with system preference detection

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + Lucide Icons
- **Forms**: React Hook Form + Zod validation
- **State Management**: TanStack Query (React Query)

### Backend
- **Database**: MongoDB (via Mongoose)
- **Authentication**: Firebase Auth + bcryptjs
- **Real-time**: Socket.IO
- **AI**: Google Genkit
- **Deployment**: Firebase Hosting

### Development Tools
- **Build**: Turbopack (Next.js 15)
- **Type Checking**: TypeScript strict mode
- **Linting**: ESLint
- **Package Manager**: npm

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- MongoDB instance (local or cloud)
- Firebase project (optional, for deployment)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Taskmaster3
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   # Database
   MONGODB_URI=your_mongodb_connection_string
   
   # Firebase (optional)
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   
   # Google AI (for AI features)
   GOOGLE_AI_API_KEY=your_google_ai_key
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:9002`

## 🎯 Available Scripts

```bash
# Development
npm run dev              # Start Next.js dev server (port 9002)
npm run genkit:dev       # Start Genkit AI development server
npm run genkit:watch     # Start Genkit with hot reload

# Production
npm run build            # Build for production
npm run start            # Start production server

# Code Quality
npm run lint             # Run ESLint
npm run typecheck        # Run TypeScript type checking
```

## 📁 Project Structure

```
Taskmaster3/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (app)/             # Authenticated app routes
│   │   │   ├── dashboard/     # Main task dashboard
│   │   │   ├── notes/         # Note management
│   │   │   ├── assignees/     # Team member management
│   │   │   ├── profile/       # User profile
│   │   │   └── url-storage/   # URL bookmark system
│   │   ├── (auth)/            # Authentication pages
│   │   └── api/               # API routes (Socket.IO)
│   ├── components/            # React components
│   │   ├── tasks/            # Task-related components
│   │   ├── notes/            # Note components (Quill editor)
│   │   ├── assignees/        # Assignee management
│   │   ├── shared/           # Shared components (Navbar, etc.)
│   │   └── ui/               # Reusable UI components
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utility functions & configs
│   │   └── local-storage/    # Offline storage utilities
│   ├── models/               # MongoDB/Mongoose models
│   ├── types/                # TypeScript type definitions
│   └── ai/                   # AI flows and configurations
├── public/                   # Static assets & PWA files
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.ts
```

## 🔑 Key Features Explained

### Task Management
- Create tasks with titles, descriptions, deadlines, and assignees
- Filter by assignee, sort by date or name
- Mark tasks as pending, in-progress, or completed
- Bulk delete completed tasks
- Print-friendly view for physical task lists

### Notes System
- Rich text editing with Quill editor (borderless design)
- Full-screen readable mode for distraction-free reading
- Full-screen edit mode with auto-save
- Lock/unlock notes with PIN protection
- Search notes by title or content
- Horizontal list view with 30-character previews

### Storage Modes
- **Database Mode**: Persistent cloud storage with MongoDB
- **Local Storage Mode**: Offline-first with browser storage
- Seamless switching between modes
- Automatic sync when reconnecting

### Real-time Collaboration
- Live updates across devices via Socket.IO
- Instant task/note synchronization
- Multi-user support with user-specific data isolation

## 🎨 UI/UX Highlights

- **Modern Design**: Clean, professional interface with Tailwind CSS
- **Responsive**: Mobile, tablet, and desktop optimized
- **Dark Mode**: System-aware theme switching
- **Accessibility**: Keyboard navigation and screen reader support
- **Loading States**: Smooth loading indicators and skeletons
- **Toast Notifications**: User-friendly feedback system

## 🔐 Security

- Firebase Authentication for secure user management
- bcryptjs password hashing
- PIN-based note locking system
- User-scoped data queries (users can only access their own data)
- Environment variable protection for sensitive keys

## 🚀 Deployment

The app is configured for Firebase Hosting:

```bash
# Build and deploy
npm run build
firebase deploy
```

Configuration is managed via `apphosting.yaml`.

## 📝 Environment Variables

Required environment variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `GOOGLE_AI_API_KEY` | Google AI API key for AI features | Optional |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase configuration | Optional |

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Built with Next.js 15 and the App Router
- UI components from Radix UI and shadcn/ui
- Icons from Lucide React
- AI powered by Google Genkit

## 📧 Support

For issues, questions, or suggestions, please open an issue on the repository.

---

**Made with ❤️ using Next.js 15 and TypeScript**
