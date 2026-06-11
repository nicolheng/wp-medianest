# 🎬 Medianest
### *A Full-Stack Cross-Platform Discovery Tool*

The **Medianest** is a MEN-Stack web application designed to be a one-stop destination for discovering Movies, Books, and Music. By integrating various global APIs, the platform allows users to explore top charts, search for specific titles, and manage their personal entertainment preferences.

---

## 🛠️ Tech Stack
* **Database:** MongoDB Atlas
* **Backend:** Node.js & Express.js
* **Frontend:** HTML5, CSS3, JavaScript & Bootstrap 5

---

## 👥 Our Team

| Name | Role | Primary Responsibilities |
| :--- | :--- | :--- |
| **Syn Yee** | **Database Designer & Auth** | Designing the database architecture, setting up MongoDB, managing user registration/login, and creating the Global UI template. |
| **Jia Xin** | **Profile Management** | Developing the user profile system, including updating user details, password management, and account deletion logic. |
| **Phoebe** | **Ratings & Reviews** | Building the interaction system for viewing items, submitting user ratings, and managing community reviews. |
| **Jing Ying** | **Home & Top Charts** | Researching entertainment APIs, designing the landing page, and displaying real-time top charts for movies, books, and music. |
| **Xiao Wen** | **Search & Recommendations** | Implementing the search functionality and building recommendation criteria to help users find new content. |
| **Nicol** | **Watchlist** | Developing the "Favorite" system and creating the UI for users to save and manage their personal watchlists. |

---

## 🌟 Key Features
* **Unified Discovery:** Explore different media types (Movies, Books, Music) in a single interface.
* **Polymorphic Data:** A flexible database structure that handles diverse media details seamlessly.
* **User Personalization:** Personalized profiles, watchlists, and rating systems.
* **Real-time Data:** Integration with industry-standard APIs for the most up-to-date entertainment charts.

---

## 📜 Data Acknowledgements
This project pulls data and chart information from the following industry-standard sources:
* **Movies & Shows:** TMDB 
* **Books:** Google Books & The New York Times
* **Music:** iTunes & Last.fm

---

## 🚀 Installation & Deployment Guide

### 📋 System Prerequisites

Your environment must run **Node.js v18.0.0 or higher** (which bundles the `npm` package manager). Verify your runtime versions before initiating builds:

```bash
node -v
npm -v

```

---

### 📂 Step 1: Clone the Application Repository

```bash
git clone <your-repository-url>
cd medianest

```

---

### 💻 Step 2: Frontend Environment Configuration

The frontend client relies on structural environment constants situated directly within its source cluster.

1. Navigate to the frontend directory:
```bash
cd frontend

```


2. Build your local configuration out of the repository placeholder inside the source folder:
```bash
cp src/.env.example src/.env

```


3. Open `src/.env` in your editor and input your client-side keys and server access origins.
4. Install local node dependencies and spin up the development compiler:
```bash
npm install
npm run dev

```


5. The interface will bind locally. Launch your web browser and open: `http://localhost:8081/`

---

### ⚙️ Step 3: Backend Server Configuration

1. Navigate into the application server root directory:
```bash
cd ../backend

```


2. Construct your isolated application context out of the configuration template:
```bash
cp .env.example .env

```


3. Open the newly generated `.env` file and supply your distinct cluster credentials and access secrets:
```env
# Core Connections & Cryptography Secrets
PORT=5000
MONGO_URI=mongodb://<username>:<password>@host:port/dbname
SESSION_SECRET=MediaNestSuperSecureSecretKey2026!
CLIENT_URL=http://localhost:8081

# Third-Party Upstream Access Tokens
TMDB_KEY=your_tmdb_api_key
LASTFM_KEY=your_lastfm_api_key
NYT_KEY=your_nyt_api_key
GOOGLE_BOOKS_KEY=your_google_books_api_key

```


4. Install server dependencies and execute the daemon application boot script:
```bash
npm install
# Launches server environment with hot-reloading tracking
npx nodemon server.js

```