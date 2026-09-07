import os
import sqlite3
from datetime import datetime, date
from flask import Flask, render_template, request, jsonify, redirect, url_for

app = Flask(__name__)
DATABASE = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'billing.db')

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    # Create invoices table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS invoices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            invoice_number TEXT UNIQUE NOT NULL,
            client_name TEXT NOT NULL,
            client_email TEXT,
            client_address TEXT,
            created_at TEXT DEFAULT (date('now')),
            due_date TEXT,
            tax_rate REAL DEFAULT 0.0,
            discount REAL DEFAULT 0.0,
            discount_type TEXT DEFAULT 'flat',
            total_amount REAL NOT NULL,
            status TEXT DEFAULT 'Unpaid',
            notes TEXT
        )
    """)
    # Create invoice_items table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS invoice_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            invoice_id INTEGER NOT NULL,
            description TEXT NOT NULL,
            quantity REAL NOT NULL,
            unit_price REAL NOT NULL,
            amount REAL NOT NULL,
            FOREIGN KEY(invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
        )
    """)
    conn.commit()
    conn.close()

def generate_invoice_number():
    date_str = datetime.now().strftime("%Y%m%d")
    conn = get_db_connection()
    cursor = conn.cursor()
    # Search for invoices created on the same day
    cursor.execute("SELECT COUNT(*) FROM invoices WHERE created_at = date('now')")
    count = cursor.fetchone()[0] + 1
    conn.close()
    return f"INV-{date_str}-{count:04d}"

@app.route('/')
def index():
    invoice_number = generate_invoice_number()
    today_str = date.today().strftime("%Y-%m-%d")
    return render_template('index.html', invoice_number=invoice_number, today=today_str)

@app.route('/history')
def history():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get analytics stats
    cursor.execute("SELECT COUNT(*) FROM invoices")
    total_invoices = cursor.fetchone()[0]
    
    cursor.execute("SELECT SUM(total_amount) FROM invoices WHERE status = 'Paid'")
    paid_sum = cursor.fetchone()[0] or 0.0
    
    cursor.execute("SELECT SUM(total_amount) FROM invoices WHERE status = 'Unpaid'")
    unpaid_sum = cursor.fetchone()[0] or 0.0
    
    total_revenue = paid_sum + unpaid_sum
    
    # Get recent invoices list
    cursor.execute("SELECT * FROM invoices ORDER BY id DESC")
    invoices = cursor.fetchall()
    conn.close()
    
    return render_template('history.html', 
                           total_invoices=total_invoices,
                           paid_sum=paid_sum,
                           unpaid_sum=unpaid_sum,
                           total_revenue=total_revenue,
                           invoices=invoices)

@app.route('/invoice/<invoice_number>')
def invoice_detail(invoice_number):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM invoices WHERE invoice_number = ?", (invoice_number,))
    invoice = cursor.fetchone()
    
    if invoice is None:
        conn.close()
        return "Invoice not found", 404
        
    cursor.execute("SELECT * FROM invoice_items WHERE invoice_id = ?", (invoice['id'],))
    items = cursor.fetchall()
    conn.close()
    
    return render_template('invoice.html', invoice=invoice, items=items)

# API: Save Invoice
@app.route('/api/invoices', methods=['POST'])
def save_invoice():
    data = request.json
    if not data:
        return jsonify({"error": "Invalid payload"}), 400
        
    invoice_number = data.get('invoice_number')
    client_name = data.get('client_name')
    client_email = data.get('client_email', '')
    client_address = data.get('client_address', '')
    created_at = data.get('created_at', date.today().strftime("%Y-%m-%d"))
    due_date = data.get('due_date', '')
    if due_date == '':
        due_date = 'N/A'
    tax_rate = float(data.get('tax_rate', 0.0))
    discount = float(data.get('discount', 0.0))
    discount_type = data.get('discount_type', 'flat')
    total_amount = float(data.get('total_amount', 0.0))
    status = data.get('status', 'Unpaid')
    notes = data.get('notes', '')
    items = data.get('items', [])
    
    if not invoice_number or not client_name or not items:
        return jsonify({"error": "Invoice number, Client name, and at least one item are required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Check if invoice number already exists
        cursor.execute("SELECT id FROM invoices WHERE invoice_number = ?", (invoice_number,))
        if cursor.fetchone():
            # If so, generate a new one to prevent duplication
            invoice_number = generate_invoice_number()

        cursor.execute("""
            INSERT INTO invoices (invoice_number, client_name, client_email, client_address, created_at, due_date, tax_rate, discount, discount_type, total_amount, status, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (invoice_number, client_name, client_email, client_address, created_at, due_date, tax_rate, discount, discount_type, total_amount, status, notes))
        
        invoice_id = cursor.lastrowid
        
        for item in items:
            desc = item.get('description', '')
            qty = float(item.get('quantity', 0.0))
            price = float(item.get('unit_price', 0.0))
            amt = float(item.get('amount', qty * price))
            
            if not desc:
                continue
                
            cursor.execute("""
                INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, amount)
                VALUES (?, ?, ?, ?, ?)
            """, (invoice_id, desc, qty, price, amt))
            
        conn.commit()
        return jsonify({"status": "success", "invoice_number": invoice_number, "id": invoice_id})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

# API: Update Invoice Status
@app.route('/api/invoices/<int:invoice_id>/status', methods=['PATCH'])
def update_invoice_status(invoice_id):
    data = request.json
    if not data or 'status' not in data:
        return jsonify({"error": "Status is required"}), 400
        
    status = data['status']
    if status not in ['Paid', 'Unpaid']:
        return jsonify({"error": "Invalid status"}), 400
        
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE invoices SET status = ? WHERE id = ?", (status, invoice_id))
        conn.commit()
        if cursor.rowcount == 0:
            return jsonify({"error": "Invoice not found"}), 404
        return jsonify({"status": "success"})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

# API: Delete Invoice
@app.route('/api/invoices/<int:invoice_id>', methods=['DELETE'])
def delete_invoice(invoice_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM invoices WHERE id = ?", (invoice_id,))
        conn.commit()
        if cursor.rowcount == 0:
            return jsonify({"error": "Invoice not found"}), 404
        return jsonify({"status": "success"})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

if __name__ == '__main__':
    init_db()
    app.run(debug=True)
