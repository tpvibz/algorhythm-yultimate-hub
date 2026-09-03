# 🥏 YUltimate Hub - AI-Powered Ultimate Frisbee Platform

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg?cacheSeconds=2592000)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![React](https://img.shields.io/badge/react-18.3.1-blue.svg)

**Empowering Youth Through Sport & AI** 🤖⚡

*AI-driven platform for managing Ultimate Frisbee tournaments and youth coaching programs with real-time scoring, spirit tracking, and predictive analytics.*

</div>

---

## 📖 Project Overview

YUltimate Hub transforms how Ultimate Frisbee tournaments and coaching programs are managed. Moving beyond manual spreadsheets to a unified, intelligent, real-time digital ecosystem that empowers under-resourced communities through sports and technology.

### 🎯 Mission
Empowering children from under-resourced communities by teaching life skills like teamwork, fairness, and respect through Ultimate Frisbee, powered by cutting-edge Artificial Intelligence technology.

### 📸 Demo & Screenshots

> 🔗 **Live Demo:** [https://algorhythm-yultimate-hub.vercel.app/](https://algorhythm-yultimate-hub.vercel.app/)

#### 🧪 Test Credentials
All test accounts use password: **123456**

**Admin:**
- Username: `admin123`

**Coaches:**
- `COA-001`
- `COA-002`

**Players:**
- `PLA-1762279146255`
- `PLA-1762275683011`
- `PLA-1762275671666`

**Volunteers:**
- `VOL-1762276422711`
- `VOL-1762276417644`

---

## ⚡ Features

### 🏆 Tournament Management
- **Smart Registration System** - Automated team & player registration with approval workflows
- **Intelligent Scheduling** - AI-powered automated tournament scheduling and bracket generation
- **Real-time Scoring** - Live scoreboard updates with spirit-of-the-game tracking
- **Pool & Bracket Visualization** - Interactive tournament brackets with ReactFlow
- **Multi-format Support** - Pool play, single/double elimination, round-robin formats

### 🎓 Coaching Program Management
- **Centralized Student Profiles** - Comprehensive player tracking and development
- **Attendance Monitoring** - Real-time session attendance with automated notifications
- **Performance Analytics** - Player progress tracking and skill development metrics
- **Program Transfer Management** - Seamless student transfers between programs

### 🤖 AI-Powered Features
- **Predictive Analytics** - Attendance predictions and drop-off risk identification
- **Voice-Enabled Assistant** - Multilingual voice input for field data entry
- **Performance Insights** - AI-driven recommendations for player development
- **Automated Reporting** - Intelligent report generation and insights

### 📱 Modern User Experience
- **Multi-language Support** - Google Translate API integration
- **Real-time Notifications** - Email & SMS notifications via Nodemailer & Twilio
- **Responsive Design** - Mobile-first design with PWA capabilities
- **Role-based Access** - Admin, Coach, Player, and Volunteer dashboards

### 🔒 Fair Play & Transparency
- **Spirit Scoring System** - Digital spirit-of-the-game tracking
- **Audit Trail** - Comprehensive activity logging and history
- **Data Security** - JWT authentication and secure data handling

---

## 🛠️ Tech Stack

**Backend:**
- Node.js
- Express.js
- MongoDB
- JWT Authentication
- TypeScript

**Frontend:**
- React
- TypeScript
- Vite
- TailwindCSS
- Shadcn/ui

**AI & Services:**
- Google Cloud Translate
- Gemini AI
- Twilio (SMS)
- Nodemailer (Email)

**Additional Tools:**
- Cloudinary (Image Storage)
- Redis (Caching)
- React Flow (Visualizations)

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher)
- **npm** or **yarn**
- **MongoDB** (local or Atlas connection)
- **Git**

### 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/tpvibz/algorhythm-yultimate-hub.git
   cd algorhythm-yultimate-hub
   ```

2. **Install Backend Dependencies**
   ```bash
   cd BE
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../FE
   npm install
   ```

### 🔧 Environment Variables

Create a `.env` file in the `BE` directory with the following variables:

```env
# Server Configuration
PORT=9000

# Database
MONGO_URI=mongodb+srv://your-connection-string

# Authentication
JWT_SECRET=your-super-secret-jwt-key

# Email Configuration
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password

# Google Services
GOOGLE_TRANSLATE_API_KEY=your-google-translate-key
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash

# Cloudinary (Image Storage)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_SECURE=true

# Twilio (SMS)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=your-twilio-number
```

### ⚡ Usage

1. **Start the Backend Server**
   ```bash
   cd BE
   node server.js
   # or with nodemon for development
   nodemon server.js
   ```

2. **Start the Frontend Development Server**
   ```bash
   cd FE
   npm run dev
   ```

3. **Access the Application**
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:9000`

### 🧪 Testing

**Test Email Functionality:**
```bash
curl -X POST http://localhost:9000/api/test/email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","subject":"Test","message":"Testing email"}'
```

**Test SMS Functionality:**
```bash
curl -X POST http://localhost:9000/api/test/sms \
  -H "Content-Type: application/json" \
  -d '{"phone":"+1234567890","message":"Testing SMS"}'
```

---

## 📁 Project Structure

```
YUltimate-Hub/
├── BE/                          # Backend (Node.js + Express)
│   ├── controllers/             # Route controllers
│   ├── models/                  # MongoDB models
│   ├── routes/                  # API routes
│   ├── utils/                   # Utility functions
│   ├── config/                  # Configuration files
│   └── server.js                # Server entry point
├── FE/                          # Frontend (React + TypeScript)
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/               # Page components
│   │   ├── services/            # API services
│   │   ├── hooks/               # Custom React hooks
│   │   ├── lib/                 # Utility libraries
│   │   └── utils/               # Helper functions
│   ├── public/                  # Static assets
│   └── index.html               # HTML template
└── README.md                    # Project documentation
```

---

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/approve/:id` - Approve user registration

### Tournaments
- `GET /api/tournaments` - Get all tournaments
- `POST /api/tournaments` - Create tournament
- `PUT /api/tournaments/:id` - Update tournament
- `DELETE /api/tournaments/:id` - Delete tournament

### Teams & Players
- `GET /api/teams` - Get teams
- `POST /api/teams` - Create team
- `GET /api/players` - Get players
- `POST /api/players` - Create player

### Scheduling & Scoring
- `GET /api/schedule` - Get match schedule
- `POST /api/schedule/generate` - Generate matches
- `POST /api/score` - Submit match score

### Notifications
- `GET /api/notifications` - Get user notifications
- `POST /api/notifications` - Create notification

### Testing
- `POST /api/test/email` - Test email functionality
- `POST /api/test/sms` - Test SMS functionality

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Made with ❤️ for the Ultimate Frisbee Community**

⭐ Star this repository if you find it helpful!

</div>
