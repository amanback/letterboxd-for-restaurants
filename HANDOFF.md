# Social Food Blogging Platform - Project Handoff

This document provides a comprehensive overview of the Social Food Blogging Platform. It explains the architecture, the technology stack, the features implemented, and instructions on how to run and maintain the project.

## 🚀 Overview
The project is a production-ready, full-stack web application designed for food enthusiasts to log their meals, discover restaurants, follow friends, and get personalized recommendations.

It consists of two main parts:
1. **Backend**: A RESTful API built with Python and FastAPI.
2. **Frontend**: A modern web application built with React and Next.js.

---

## 🛠 Technology Stack

### Backend (`/backend`)
*   **Framework**: [FastAPI](https://fastapi.tiangolo.com/) - High performance, easy to use, and automatic interactive API documentation (Swagger UI).
*   **Database ORM**: [SQLAlchemy](https://www.sqlalchemy.org/) - Handles database interactions and models.
*   **Database**: SQLite (default for local dev) / PostgreSQL (production ready via Docker).
*   **Authentication**: JWT (JSON Web Tokens) with `passlib` (bcrypt) for password hashing.
*   **Real-time**: WebSockets for live feed updates.
*   **Environment**: Configured via `.env` files (using `pydantic-settings`).

### Frontend (`/frontend`)
*   **Framework**: [Next.js](https://nextjs.org/) (App Router) - React framework for SSR and routing.
*   **Styling**: Pure CSS (`globals.css`) using a modern, minimalist design system with CSS variables for easy theming.
*   **State Management**: React Hooks (`useState`, `useEffect`, `useContext` for Auth).
*   **API Client**: Custom `fetch` wrapper with automatic JWT injection.

---

## 📂 Project Structure

```text
/
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── models/           # SQLAlchemy Database Models (User, FoodLog, Restaurant, etc.)
│   │   ├── routers/          # API Endpoints (auth, users, feed, nearby, etc.)
│   │   ├── schemas/          # Pydantic Models for Request/Response validation
│   │   ├── services/         # Business Logic (Recommendations, Feed Websockets)
│   │   ├── config.py         # Environment configuration
│   │   ├── database.py       # DB engine and session setup
│   │   ├── deps.py           # Dependency injection (e.g., get_current_user)
│   │   └── main.py           # FastAPI application instance & routing
│   ├── uploads/              # Local storage for user uploaded images
│   ├── requirements.txt      # Python dependencies
│   └── .env                  # Backend environment variables
│
└── frontend/                 # Next.js Application
    ├── app/                  # Next.js App Router pages (/, /login, /restaurants, etc.)
    ├── components/           # Reusable React components (Navbar, Cards, Forms)
    ├── lib/                  # Utilities (API client)
    └── package.json          # Node.js dependencies
```

---

## ✨ Implemented Features

### 1. Authentication & Users
*   **JWT Auth**: Secure registration and login.
*   **Role-based Access**: Users can be standard users, restaurant owners, or admins.
*   **Profiles**: View user profiles, follow/unfollow functionality to build a social graph.

### 2. Food Logging
*   **Create Logs**: Users can log dishes with a name, rating, text review, cuisine tag, and photo upload.
*   **Media**: Images are uploaded to the backend and served statically from the `/uploads` directory.

### 3. Real-Time Social Feed
*   **WebSockets**: The feed page (`/`) uses WebSockets to receive instant updates when a followed user posts a new food log. No refreshing required.

### 4. Restaurant Discovery & Management
*   **Directory**: Browse and search restaurants by name, cuisine, or location.
*   **Nearby Integration**: Discover nearby restaurants (utilizes Google Places API).
*   **Reviews**: Users can leave reviews and ratings for specific restaurants.
*   **Ownership**: Users with the `owner` role can "claim" restaurants and reply to customer reviews.

### 5. Personalized Recommendations
*   **Taste Vectors**: The system analyzes a user's food logs to build a "Taste Profile" (e.g., 60% Japanese, 40% Italian).
*   **Algorithm**: Uses Cosine Similarity to match the user's taste vector against restaurant profiles, boosted by a "social influence" score (restaurants liked by people you follow rank higher).

### 6. Modern UI/UX
*   **Design System**: Recently updated to a clean, bright, minimalist UI with soft shadows, pill-shaped buttons, and skeleton loading states.
*   **Responsive**: Fully responsive design with a bottom tab bar for mobile users and a top navbar for desktop.

---

## 🚦 How to Run Locally

### 1. Start the Backend
```bash
cd backend

# Create a virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn app.main:app --reload --port 8000
```
*The backend runs on `http://localhost:8000`. You can view the interactive API docs at `http://localhost:8000/docs`.*

### 2. Start the Frontend
```bash
cd frontend

# Install dependencies
npm install

# Run the development server
npm run dev
```
*The frontend runs on `http://localhost:3000`.*

---

## 🔑 Environment Variables

### Backend (`/backend/.env`)
*   `DATABASE_URL`: Connection string (e.g., `sqlite:///./foodblog.db`)
*   `SECRET_KEY`: Used for JWT signing.
*   `ALGORITHM`: JWT algorithm (e.g., `HS256`).
*   `ACCESS_TOKEN_EXPIRE_MINUTES`: Token validity duration.
*   `UPLOAD_DIR`: Directory for storing images (e.g., `uploads`).
*   `GOOGLE_PLACES_API_KEY`: Required for the Nearby restaurants feature.

### Frontend (`/frontend/.env.local` or environment)
*   `NEXT_PUBLIC_API_URL`: Points to the backend (defaults to `http://localhost:8000` in the API client if not set).

---

## 🔮 Next Steps & Production Readiness

If deploying to production, consider the following:
1.  **Database**: Migrate from SQLite to PostgreSQL. The code is already compatible via SQLAlchemy; just change the `DATABASE_URL`.
2.  **Media Storage**: Move from local file uploads (`/uploads`) to a cloud provider like AWS S3 or Google Cloud Storage.
3.  **Redis**: For scalable WebSockets across multiple backend workers, implement a Redis pub/sub mechanism (the `ConnectionManager` currently holds connections in local memory).
4.  **Deployment**: Dockerize both applications using standard `Dockerfile`s and deploy via services like Render, AWS ECS, or Vercel (for the frontend).
