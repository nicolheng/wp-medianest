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

## How to Run

### prerequisites

Install Node.js on your machine to run this project. Node.js includes npm (Node Package Manager).

* **Node.js**: Version 18.0.0 or higher.

Verify your installation by running these commands in your terminal:

```bash
node -v
npm -v
```

### Frontend Only [temp]


1. git clone the repo
2. at cmd, run `cd frontend`
3. run `npm install`
4. run `npm run dev`
5. go to localhost:8081/

### Backend Setup

1. Prerequisites

	- Node.js v18 or higher
	- A running MongoDB instance (MongoDB Atlas recommended)

2. Install and run

```bash
cd backend
npm install
# Create a local .env from the example and fill values
cp .env.example .env
# Start in production mode
npm start
# For development with automatic restarts (uses nodemon if installed):
npx nodemon server.js
```

3. Environment variables

- Copy `backend/.env.example` to `backend/.env` and fill real secrets.
- Important variables: `MONGO_URI`, `SESSION_SECRET`, `CLIENT_URL`, and API keys (`TMDB_KEY`, `LASTFM_KEY`, `NYT_KEY`, `GOOGLE_BOOKS_KEY`).

4. Tests

```bash
cd backend
npm test
```

5. Notes

- Keep real `.env` files out of version control. The repo's `.gitignore` already ignores `.env` and `.env.*`.
- Track only `backend/.env.example` in the repo so contributors know required variables.

