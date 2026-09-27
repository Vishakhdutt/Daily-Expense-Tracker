# Daily Expense Tracker 💰

A beginner-friendly, full-stack web application to track daily expenses, categorize spending, and analyze financial summaries effortlessly. Built with a responsive Vanilla HTML/CSS/JS frontend and a robust FastAPI + PostgreSQL backend.

---

## 📌 Features

- **Expense Management (CRUD)**: Add, view, edit, and delete daily expense entries.
- **Categorization**: Group expenses into 7 predefined categories: *Food*, *Travel*, *Shopping*, *Bills*, *Education*, *Health*, and *Other*.
- **Category Filtering**: Easily filter recent expenses by category or view all entries at once.
- **Real-Time Dashboard Metrics**:
  - Total Expense
  - Today's Expense
  - This Month's Expense
  - Highest Single Expense
  - Total Number of Expenses
- **Category Summary**: Display category-wise total expenditure breakdowns.
- **Robust Validation & Error Handling**: Client-side validation with real-time toast notifications and Pydantic server-side validation.
- **Delete Confirmation Modal**: Custom dialog box preventing accidental deletions.
- **Responsive Design**: Designed to work seamlessly on desktops, tablets, and mobile devices.

---

## 🛠️ Technologies Used

### **Frontend**
- **HTML5**: Semantic markup and structure.
- **CSS3**: Custom styling using CSS Grid, Flexbox, CSS Variables, and animations (No Tailwind or Bootstrap).
- **Vanilla JavaScript (ES6+)**: Dynamic DOM manipulation, Fetch API, and state management.

### **Backend**
- **Python 3.10+**: Core programming language.
- **FastAPI**: Modern, fast web framework for building APIs.
- **Uvicorn**: High-performance ASGI server.
- **Pydantic v2**: Data validation and settings management.

### **Database & Environment**
- **PostgreSQL**: Relational database for persistent storage.
- **SQLAlchemy**: Object-Relational Mapping (ORM) library.
- **Psycopg2-binary**: PostgreSQL database adapter.
- **Python-dotenv**: Environment variable loader.

---

## 📂 Project Structure

```text
DailyExpenseTracker/
├── backend/
│   ├── database.py       # SQLAlchemy engine & session setup
│   ├── main.py           # FastAPI application, CORS, and API endpoints
│   ├── models.py         # SQLAlchemy database tables definition
│   ├── schemas.py        # Pydantic request/response validation models
│   ├── requirements.txt  # Python package dependencies
│   └── .env.example      # Environment variable template
├── frontend/
│   ├── index.html        # Main HTML web page structure
│   ├── style.css         # Custom CSS stylesheet and responsive media queries
│   └── script.js         # Frontend logic, API communication & UI handlers
├── .gitignore            # Git exclusion rules
└── README.md             # Project documentation
```

---

## ⚙️ Installation & Setup Guide

### 1. Prerequisites
Ensure you have the following installed on your system:
- [Python 3.10+](https://www.python.org/downloads/)
- [PostgreSQL](https://www.postgresql.org/download/)
- Web browser (Chrome, Firefox, Edge, Safari)

---

### 2. Clone the Repository
```bash
git clone https://github.com/your-username/DailyExpenseTracker.git
cd DailyExpenseTracker
```

---

### 3. Configure PostgreSQL Database
1. Open PostgreSQL CLI or pgAdmin.
2. Create a new database named `daily_expense_tracker`:
   ```sql
   CREATE DATABASE daily_expense_tracker;
   ```

---

### 4. Configure Environment Variables
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Open `.env` in your text editor and update the database connection details with your local PostgreSQL credentials:
   ```ini
   DB_USER=postgres
   DB_PASSWORD=your_postgres_password
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=daily_expense_tracker

   DATABASE_URL=postgresql://postgres:your_postgres_password@localhost:5432/daily_expense_tracker
   ```

---

### 5. Install Backend Dependencies
Create a virtual environment and install the required Python packages:

#### On Windows:
```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

#### On macOS / Linux:
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

### 6. Run the FastAPI Server
Start the development server using Uvicorn:
```bash
uvicorn main:app --reload
```
The backend API server will start running at:
- **API Server Base URL**: `http://127.0.0.1:8000`
- **Interactive Swagger API Docs**: `http://127.0.0.1:8000/docs`

---

### 7. Open the Frontend
Simply open `frontend/index.html` in your favorite web browser, or serve it using VS Code Live Server.

---

## 📡 API Endpoints Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | API health check message |
| `GET` | `/expenses` | Retrieve all recorded expenses |
| `GET` | `/expenses/{id}` | Retrieve details of a specific expense by ID |
| `POST` | `/expenses` | Add a new expense |
| `PUT` | `/expenses/{id}` | Update an existing expense by ID |
| `DELETE` | `/expenses/{id}` | Delete an expense by ID |

---

## 🚀 Future Improvements

- [ ] **Data Visualization**: Integrate chart libraries (e.g. Chart.js) for visual spending trends over time.
- [ ] **User Authentication**: Add multi-user login and JWT authentication.
- [ ] **Export Options**: Enable downloading expense reports in CSV and PDF formats.
- [ ] **Monthly Budgets**: Set spending thresholds with automated warning alerts.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
