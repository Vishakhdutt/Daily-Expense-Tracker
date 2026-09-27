// ==========================================
// 1. BACKEND API CONFIGURATION
// ==========================================
const API_BASE_URL = 'http://127.0.0.1:8000';

// Global state variables
let expenses = [];
let editingExpenseId = null;
let pendingDeleteId = null;

// ==========================================
// 2. DOM ELEMENTS SELECTION
// ==========================================
const expenseForm = document.getElementById('expenseForm');
const formTitle = document.getElementById('formTitle');
const amountInput = document.getElementById('amount');
const categoryInput = document.getElementById('category');
const dateInput = document.getElementById('date');
const descriptionInput = document.getElementById('description');
const submitBtn = document.getElementById('submitBtn');
const cancelBtn = document.getElementById('cancelBtn');

const expenseTableBody = document.getElementById('expenseTableBody');
const categoryFilter = document.getElementById('categoryFilter');
const categorySummaryGrid = document.getElementById('categorySummaryGrid');

const todayExpenseEl = document.getElementById('todayExpense');
const monthExpenseEl = document.getElementById('monthExpense');
const totalExpenseEl = document.getElementById('totalExpense');
const highestExpenseEl = document.getElementById('highestExpense');
const expenseCountEl = document.getElementById('expenseCount');

// Modal Elements
const deleteModal = document.getElementById('deleteModal');
const deleteExpenseText = document.getElementById('deleteExpenseText');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const modalCloseBtn = document.getElementById('modalCloseBtn');

// Set default value of date input to today's date (YYYY-MM-DD)
dateInput.value = getTodayString();

// ==========================================
// 3. APP INITIALIZATION & EVENT LISTENERS
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    fetchExpenses();
});

// Event Listener for Cancel Edit button
cancelBtn.addEventListener('click', resetForm);

// Event Listener for Category Filter dropdown change
if (categoryFilter) {
    categoryFilter.addEventListener('change', () => {
        renderTable();
    });
}

// Modal Event Listeners
if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeDeleteModal);
if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeDeleteModal);
if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', confirmDeleteExpense);

// Close modal when clicking outside backdrop
if (deleteModal) {
    deleteModal.addEventListener('click', (e) => {
        if (e.target === deleteModal) closeDeleteModal();
    });
}

// ==========================================
// 4. API CALL: LOAD EXPENSES (GET /expenses)
// ==========================================
async function fetchExpenses() {
    try {
        // Show loading spinner in table
        expenseTableBody.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="table-loading">
                        <div class="spinner"></div>
                        <span>Loading expenses from server...</span>
                    </div>
                </td>
            </tr>
        `;

        const response = await fetch(`${API_BASE_URL}/expenses`);

        if (!response.ok) {
            throw new Error(`Failed to fetch expenses (Status: ${response.status})`);
        }

        expenses = await response.json();

        // Render table and calculate dashboard totals & category summary
        renderTable();
        updateDashboard();

    } catch (error) {
        console.error('API Error:', error);
        showToast(`Unable to connect to backend server: ${error.message}`, 'error');
        expenseTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-message" style="color: #ef4444;">
                    ❌ Unable to connect to backend server (${API_BASE_URL}).<br>
                    Please ensure FastAPI is running using: <code>uvicorn main:app --reload</code>
                </td>
            </tr>
        `;
    }
}

// ==========================================
// 5. RENDER TABLE WITH CATEGORY FILTERING & EMPTY STATE
// ==========================================
function renderTable() {
    expenseTableBody.innerHTML = '';

    const selectedFilter = categoryFilter ? categoryFilter.value : 'all';

    // Filter expenses based on selected dropdown category
    let filteredExpenses = expenses;
    if (selectedFilter && selectedFilter !== 'all') {
        filteredExpenses = expenses.filter(
            (expense) => (expense.category || '').toLowerCase() === selectedFilter.toLowerCase()
        );
    }

    if (filteredExpenses.length === 0) {
        const isAll = selectedFilter === 'all';
        const title = isAll ? 'No expenses recorded yet' : `No expenses found for "${selectedFilter}"`;
        const subtitle = isAll ? 'Use the form on the left to add your first daily expense!' : 'Try selecting a different category filter above.';

        expenseTableBody.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="empty-state">
                        <div class="empty-icon">💸</div>
                        <div class="empty-title">${escapeHTML(title)}</div>
                        <div class="empty-subtitle">${escapeHTML(subtitle)}</div>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    // Sort expenses by date descending (newest first)
    const sortedExpenses = [...filteredExpenses].sort((a, b) => new Date(b.date) - new Date(a.date));

    const validCategories = ['food', 'travel', 'shopping', 'bills', 'education', 'health', 'other'];

    sortedExpenses.forEach((expense) => {
        const tr = document.createElement('tr');
        const catLower = (expense.category || '').toLowerCase();
        const badgeClass = validCategories.includes(catLower) ? `badge-${catLower}` : 'badge-other';

        tr.innerHTML = `
            <td>${formatDate(expense.date)}</td>
            <td><span class="badge ${badgeClass}">${escapeHTML(expense.category)}</span></td>
            <td>${escapeHTML(expense.description || '-')}</td>
            <td class="amount-cell">₹${Number(expense.amount).toFixed(2)}</td>
            <td class="actions-cell">
                <button class="btn-action btn-edit" onclick="editExpense(${expense.id})">Edit</button>
                <button class="btn-action btn-delete" onclick="openDeleteModal(${expense.id})">Delete</button>
            </td>
        `;

        expenseTableBody.appendChild(tr);
    });
}

// ==========================================
// 6. UPDATE DASHBOARD & CATEGORY TOTALS
// ==========================================
function updateDashboard() {
    const todayStr = getTodayString();
    const currentYearMonth = todayStr.substring(0, 7); // "YYYY-MM"

    let overallTotal = 0;
    let todayTotal = 0;
    let monthTotal = 0;
    let highestExpense = 0;
    let expenseCount = expenses.length;

    // List of predefined categories in required order
    const categoriesList = ['Food', 'Travel', 'Shopping', 'Bills', 'Education', 'Health', 'Other'];

    // Initialize category totals object
    const categoryTotals = {};
    categoriesList.forEach(cat => {
        categoryTotals[cat] = 0;
    });

    expenses.forEach((expense) => {
        const amt = Number(expense.amount) || 0;
        
        // 1. Total Expense sum
        overallTotal += amt;

        // 2. Today's Expense sum
        if (expense.date === todayStr) {
            todayTotal += amt;
        }

        // 3. This Month's Expense sum
        if (expense.date && expense.date.startsWith(currentYearMonth)) {
            monthTotal += amt;
        }

        // 4. Highest Expense tracking
        if (amt > highestExpense) {
            highestExpense = amt;
        }

        // Match category case-insensitively or default to 'Other'
        const matchedCategory = categoriesList.find(
            c => c.toLowerCase() === (expense.category || '').toLowerCase()
        ) || 'Other';

        categoryTotals[matchedCategory] += amt;
    });

    // Update top dashboard total elements
    totalExpenseEl.textContent = `₹${overallTotal.toFixed(2)}`;
    todayExpenseEl.textContent = `₹${todayTotal.toFixed(2)}`;
    monthExpenseEl.textContent = `₹${monthTotal.toFixed(2)}`;
    highestExpenseEl.textContent = `₹${highestExpense.toFixed(2)}`;
    expenseCountEl.textContent = expenseCount;

    // Render Category Summary Cards
    renderCategorySummary(categoryTotals);
}

// Function to render category summary cards
function renderCategorySummary(categoryTotals) {
    if (!categorySummaryGrid) return;
    categorySummaryGrid.innerHTML = '';

    const categoriesList = ['Food', 'Travel', 'Shopping', 'Bills', 'Education', 'Health', 'Other'];

    categoriesList.forEach((category) => {
        const total = categoryTotals[category] || 0;
        const card = document.createElement('div');
        card.className = 'category-summary-card';
        card.innerHTML = `
            <div class="category-summary-name">${escapeHTML(category)}</div>
            <div class="category-summary-amount">₹${total.toFixed(2)}</div>
        `;
        categorySummaryGrid.appendChild(card);
    });
}

// ==========================================
// 7. FORM SUBMISSION (ADD / UPDATE EXPENSE)
// ==========================================
expenseForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const amount = parseFloat(amountInput.value);
    const category = categoryInput.value;
    const date = dateInput.value;
    const description = (descriptionInput.value || '').trim();

    // ------------------------------------------
    // FRONTEND VALIDATION CHECKS
    // ------------------------------------------
    // 1. Amount validation (> 0)
    if (isNaN(amount) || amount <= 0) {
        showToast('Amount must be a positive number greater than ₹0.00.', 'error');
        amountInput.focus();
        return;
    }

    // 2. Category validation
    const validCategories = ['Food', 'Travel', 'Shopping', 'Bills', 'Education', 'Health', 'Other'];
    if (!category || !validCategories.includes(category)) {
        showToast('Please select a valid category from the dropdown.', 'error');
        categoryInput.focus();
        return;
    }

    // 3. Date validation
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        showToast('Please select a valid date.', 'error');
        dateInput.focus();
        return;
    }

    // 4. Description validation (1 to 200 characters)
    if (!description || description.length === 0) {
        showToast('Please enter a description for the expense.', 'error');
        descriptionInput.focus();
        return;
    }

    if (description.length > 200) {
        showToast('Description is too long (maximum 200 characters allowed).', 'error');
        descriptionInput.focus();
        return;
    }

    const payload = {
        amount: amount,
        category: category,
        date: date,
        description: description
    };

    submitBtn.disabled = true;

    try {
        if (editingExpenseId === null) {
            // ------------------------------------------
            // ADD EXPENSE (POST /expenses)
            // ------------------------------------------
            submitBtn.textContent = 'Adding...';

            const response = await fetch(`${API_BASE_URL}/expenses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                let errorMsg = 'Failed to add expense';
                try {
                    const errData = await response.json();
                    errorMsg = errData.detail || errorMsg;
                } catch (e) {
                    errorMsg = `Server error (Status: ${response.status})`;
                }
                throw new Error(errorMsg);
            }

            showToast('Expense added successfully!', 'success');
        } else {
            // ------------------------------------------
            // EDIT EXPENSE (PUT /expenses/{id})
            // ------------------------------------------
            submitBtn.textContent = 'Updating...';

            const response = await fetch(`${API_BASE_URL}/expenses/${editingExpenseId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                let errorMsg = 'Failed to update expense';
                try {
                    const errData = await response.json();
                    errorMsg = errData.detail || errorMsg;
                } catch (e) {
                    errorMsg = `Server error (Status: ${response.status})`;
                }
                throw new Error(errorMsg);
            }

            showToast('Expense updated successfully!', 'success');
        }

        // Reset form & reload fresh expenses from backend
        resetForm();
        await fetchExpenses();

    } catch (error) {
        console.error('Error submitting form:', error);
        showToast(error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        if (editingExpenseId !== null) {
            submitBtn.textContent = 'Update Expense';
        } else {
            submitBtn.textContent = 'Add Expense';
        }
    }
});

// ==========================================
// 8. EDIT EXPENSE (POPULATE FORM)
// ==========================================
function editExpense(id) {
    const expense = expenses.find(item => item.id === id);
    if (!expense) return;

    // Populate form fields with existing data
    amountInput.value = expense.amount;
    categoryInput.value = expense.category;
    dateInput.value = expense.date;
    descriptionInput.value = expense.description || '';

    // Switch form into Edit mode
    editingExpenseId = id;
    formTitle.textContent = 'Edit Expense';
    submitBtn.textContent = 'Update Expense';
    cancelBtn.classList.remove('hidden');

    // Scroll form into view smoothly
    expenseForm.scrollIntoView({ behavior: 'smooth' });
}

// Reset form to Add mode
function resetForm() {
    editingExpenseId = null;
    expenseForm.reset();
    dateInput.value = getTodayString();
    formTitle.textContent = 'Add New Expense';
    submitBtn.textContent = 'Add Expense';
    cancelBtn.classList.add('hidden');
}

// ==========================================
// 9. DELETE CONFIRMATION MODAL & ACTION
// ==========================================
function openDeleteModal(id) {
    const expense = expenses.find(item => item.id === id);
    pendingDeleteId = id;

    if (deleteExpenseText) {
        deleteExpenseText.textContent = expense ? `"${expense.description || expense.category}"` : 'this expense';
    }

    if (deleteModal) {
        deleteModal.classList.remove('hidden');
    }
}

function closeDeleteModal() {
    pendingDeleteId = null;
    if (deleteModal) {
        deleteModal.classList.add('hidden');
    }
}

async function confirmDeleteExpense() {
    if (!pendingDeleteId) return;

    const id = pendingDeleteId;
    closeDeleteModal();

    try {
        const response = await fetch(`${API_BASE_URL}/expenses/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            let errorMsg = 'Failed to delete expense';
            try {
                const errData = await response.json();
                errorMsg = errData.detail || errorMsg;
            } catch (e) {
                errorMsg = `Server error (Status: ${response.status})`;
            }
            throw new Error(errorMsg);
        }

        showToast('Expense deleted successfully!', 'success');

        // If currently editing the item being deleted, reset form
        if (editingExpenseId === id) {
            resetForm();
        }

        // Refresh table and dashboard
        await fetchExpenses();

    } catch (error) {
        console.error('Error deleting expense:', error);
        showToast(error.message, 'error');
    }
}

// ==========================================
// 10. TOAST NOTIFICATION SYSTEM
// ==========================================
function showToast(message, type = 'success', duration = 3500) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';

    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${escapeHTML(message)}</span>
        <button class="toast-close" aria-label="Close">&times;</button>
    `;

    container.appendChild(toast);

    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.remove();
    });

    setTimeout(() => {
        if (toast.parentNode) {
            toast.classList.add('toast-fade-out');
            setTimeout(() => toast.remove(), 300);
        }
    }, duration);
}

// ==========================================
// 11. HELPER FUNCTIONS
// ==========================================
function getTodayString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDate(dateString) {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    const dateObj = new Date(year, month - 1, day);
    return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}
