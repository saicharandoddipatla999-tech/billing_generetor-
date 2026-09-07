# Premium Billing System

A modern, responsive, and aesthetically premium **Billing System & Invoice Generator** built with Python (Flask) and SQLite, featuring a beautiful glassmorphic dark-theme user interface and pixel-perfect print styling.

---

## Key Features

1. **Interactive Invoice Generator**:
   - Dynamic item additions and deletions.
   - Real-time automatic calculations of subtotals, flat or percentage discounts, customizable tax rates, and final grand totals.
   - Intelligent auto-generation of unique invoice numbers based on sequence and date (`INV-YYYYMMDD-XXXX`).

2. **Analytics & Management Dashboard**:
   - Quick visual statistics cards for **Total Revenue**, **Collected Payments**, **Outstanding Balances**, and **Total Invoice Counts**.
   - Interactive data table of all issued invoices.
   - Real-time filtering by payment status and text search by Client or Invoice Number.
   - Quick actions to toggle payment status (Paid/Unpaid) and delete invoices directly from the list.

3. **Premium Printable Invoices**:
   - Sleek design rendering professional invoices suited for standard paper size layout.
   - Visual payment status stamps.
   - Dedicated print-optimized CSS rules (`@media print`) that automatically hide non-printable dashboard elements and adjust styling for clean print or saving to PDF.

---

## Technical Stack

- **Backend**: Python, Flask
- **Database**: SQLite3 (automatically initialized schema)
- **Frontend**: Semantic HTML5, Vanilla CSS3, and Vanilla JavaScript

---

## Getting Started

### Prerequisites

- Python 3.8 or higher installed.

### Installation

1. Clone or copy this directory to your system:
   ```bash
   cd Billing_Generator
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Running the App

1. Run the Flask development server:
   ```bash
   python app.py
   ```

2. Open your web browser and navigate to:
   ```
   http://127.0.0.1:5000
   ```

*Note: The SQLite database (`billing.db`) will be automatically created in the root directory on the first launch.*

---

## Project Structure

```
Billing-System/
│
├── app.py                  # Backend logic, DB initialization, and REST API endpoints
├── requirements.txt        # Python dependency declaration
├── billing.db              # SQLite Database file (generated dynamically)
│
├── templates/
│   ├── base.html           # Main UI container shell (includes navbar, notifications)
│   ├── index.html          # Dynamic Invoice generation page
│   ├── history.html        # Analytics dashboard and registries log
│   └── invoice.html        # Detailed printable document sheet representation
│
├── static/
│   ├── style.css           # Custom theme variables, UI styling, transitions, and print media queries
│   └── script.js           # Client-side dynamic calculator, status toggles, and API calls
│
└── README.md               # Setup and project description
```
