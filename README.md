# ⚡ Energy Trade-Off Dashboard — Akshaya Balakrishnan

An interactive frontend analytics application built from my Master’s final project, designed to explore residential energy consumption, analyze efficiency trade-offs, and surface predictive insights through a clean, user-focused dashboard.

---

## 🚀 Overview

This project transforms raw energy consumption data into actionable insights using modern frontend engineering and data visualization techniques.

It demonstrates how analytical models can be translated into intuitive, real-world decision tools for users.

---

## 🎯 Problem Being Solved

Residential energy systems generate large volumes of data, but:

- Patterns are not easily visible
- Inefficiencies are hard to detect
- Predictions are not accessible to users

This dashboard bridges that gap by enabling:

- Exploration of energy usage patterns
- Identification of efficient vs inefficient operating zones
- Visualization of relationships between variables (e.g., heat pump vs grid import)
- Simple predictive insights for future consumption

---

## 📊 Key Features

- 📈 **Interactive Visual Analytics**
  - Scatter plots (response mapping)
  - Efficiency curves
  - Feature importance charts

- 🔮 **Predictive Insight**
  - Short-horizon forecasting
  - Model-backed summaries (R², trends)

- ⚙️ **User-Controlled Analysis**
  - Adjustable sample size
  - Feature selection
  - Real-time recomputation

- 🧠 **System Indicators**
  - Median loads
  - Current consumption levels
  - Predictability score

---

## 🛠 Tech Stack

### Frontend

- React (TypeScript)
- Tailwind CSS
- D3.js (custom visualizations)
- Chart.js (analytics charts)

### Backend

- FastAPI
- Pandas & NumPy
- Scikit-learn (basic modeling)

---

## 🧩 Architecture

This project follows a simple frontend + analytics API pattern:

- Frontend → UI + visualization layer
- Backend → data processing, analytics, and prediction

The system mimics real-world data products where:

> analytical logic is separated from presentation, and exposed via APIs.

---

## ▶️ Running Locally

### 1. Frontend

```bash
cd frontend
npm install
npm start
```

---

### 2. Backend

```bash
cd backend
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8004
```

---

## 🌐 Local URLs

| Service  | URL                   |
| -------- | --------------------- |
| Frontend | http://localhost:3000 |
| Backend  | http://localhost:8004 |

---

## 🧠 What This Project Demonstrates

- Translating academic work into a production-style UI
- Building data-driven frontend applications
- Designing intuitive dashboards for non-technical users
- Combining analytics + visualization + UX

---

## 📌 Notes

- Built as part of MSc Data Science (Data Visualization track)
- Focused on frontend + analytics integration (not heavy ML)
- Emphasis on usability and interpretability

---

## 🔗 Source Code

GitHub: https://github.com/Aksha-1811/energy-tradeoff-dashboard

---

## 👩‍💻 Author

**Akshaya Balakrishnan**

Frontend Developer
Munich, Germany
