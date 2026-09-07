document.addEventListener("DOMContentLoaded", () => {
    // 1. Hook up Invoice Form Calculator
    const invoiceForm = document.getElementById("invoice-form");
    if (invoiceForm) {
        // Initial setup
        setupCalculators();
        
        // Add row button
        const btnAddItem = document.getElementById("btn-add-item");
        if (btnAddItem) {
            btnAddItem.addEventListener("click", addInvoiceRow);
        }
        
        // Form submission
        invoiceForm.addEventListener("submit", handleFormSubmit);
    }
});

/* Toast Notification Utility */
function showToast(message, type = "success") {
    const container = document.getElementById("toast-container");
    if (!container) return;
    
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    
    let iconClass = "fa-circle-check";
    if (type === "error") iconClass = "fa-circle-xmark";
    if (type === "info") iconClass = "fa-circle-info";
    
    toast.innerHTML = `
        <i class="fa-solid ${iconClass}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.classList.add("show");
    }, 50);
    
    // Auto dismiss
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => {
            toast.remove();
        }, 400);
    }, 4000);
}

/* Dynamic Table Management */
function addInvoiceRow() {
    const itemsBody = document.getElementById("items-body");
    if (!itemsBody) return;
    
    const newRow = document.createElement("tr");
    newRow.className = "item-row fade-in";
    newRow.innerHTML = `
        <td>
            <input type="text" name="item_desc" class="form-control item-desc" placeholder="Product/Service description" required>
        </td>
        <td>
            <input type="number" name="item_qty" class="form-control text-right item-qty" value="1" min="0.01" step="any" required>
        </td>
        <td>
            <input type="number" name="item_price" class="form-control text-right item-price" value="0.00" min="0" step="0.01" required>
        </td>
        <td class="item-total-cell text-right">0.00</td>
        <td class="text-center">
            <button type="button" class="btn-remove" onclick="removeRow(this)">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        </td>
    `;
    
    itemsBody.appendChild(newRow);
    
    // Add event listeners to new inputs
    const qtyInput = newRow.querySelector(".item-qty");
    const priceInput = newRow.querySelector(".item-price");
    
    qtyInput.addEventListener("input", calculateTotals);
    priceInput.addEventListener("input", calculateTotals);
    
    calculateTotals();
    showToast("Added new item row", "info");
}

function removeRow(button) {
    const row = button.closest("tr");
    const tbody = row.parentNode;
    
    // Ensure we keep at least one row
    if (tbody.querySelectorAll("tr").length <= 1) {
        showToast("Invoice must contain at least one item", "error");
        return;
    }
    
    row.classList.add("fade-out");
    setTimeout(() => {
        row.remove();
        calculateTotals();
        showToast("Removed item row", "info");
    }, 300);
}

/* Calculation Engine */
function setupCalculators() {
    // Add input change listeners to default row items
    const qtyInputs = document.querySelectorAll(".item-qty");
    const priceInputs = document.querySelectorAll(".item-price");
    
    qtyInputs.forEach(input => input.addEventListener("input", calculateTotals));
    priceInputs.forEach(input => input.addEventListener("input", calculateTotals));
    
    // Global inputs listeners
    const discountInput = document.getElementById("discount");
    const discountType = document.getElementById("discount_type");
    const taxInput = document.getElementById("tax_rate");
    
    if (discountInput) discountInput.addEventListener("input", calculateTotals);
    if (discountType) discountType.addEventListener("change", calculateTotals);
    if (taxInput) taxInput.addEventListener("input", calculateTotals);
    
    // Initial run
    calculateTotals();
}

function calculateTotals() {
    const rows = document.querySelectorAll(".item-row");
    let subtotal = 0;
    
    rows.forEach(row => {
        const qty = parseFloat(row.querySelector(".item-qty").value) || 0;
        const price = parseFloat(row.querySelector(".item-price").value) || 0;
        
        const rowTotal = qty * price;
        subtotal += rowTotal;
        
        // Update row total cell
        row.querySelector(".item-total-cell").textContent = rowTotal.toFixed(2);
    });
    
    // Fetch discount and tax values
    const discountVal = parseFloat(document.getElementById("discount")?.value) || 0;
    const discountType = document.getElementById("discount_type")?.value || "flat";
    const taxRate = parseFloat(document.getElementById("tax_rate")?.value) || 0;
    
    // Calculate Discount
    let discountDeduction = 0;
    if (discountVal > 0) {
        if (discountType === "percent") {
            discountDeduction = subtotal * (discountVal / 100);
        } else {
            discountDeduction = discountVal;
        }
    }
    
    // Subtotal after discount
    const taxableBasis = Math.max(0, subtotal - discountDeduction);
    
    // Calculate Tax
    const taxCharged = taxableBasis * (taxRate / 100);
    
    // Calculate Grand Total
    const grandTotal = taxableBasis + taxCharged;
    
    // Update visual summary labels
    const subtotalLabel = document.getElementById("summary-subtotal");
    const discountLabel = document.getElementById("summary-discount");
    const taxLabel = document.getElementById("summary-tax");
    const totalLabel = document.getElementById("summary-total");
    
    if (subtotalLabel) subtotalLabel.textContent = `$${subtotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    if (discountLabel) discountLabel.textContent = `-$${discountDeduction.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    if (taxLabel) taxLabel.textContent = `+$${taxCharged.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    if (totalLabel) totalLabel.textContent = `$${grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
}

/* Save Form Handler */
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const invoiceNumber = document.getElementById("invoice_number").value;
    const clientName = document.getElementById("client_name").value;
    const clientEmail = document.getElementById("client_email").value;
    const clientAddress = document.getElementById("client_address").value;
    const createdAt = document.getElementById("created_at").value;
    const dueDate = document.getElementById("due_date").value;
    const discount = parseFloat(document.getElementById("discount").value) || 0;
    const discountType = document.getElementById("discount_type").value;
    const taxRate = parseFloat(document.getElementById("tax_rate").value) || 0;
    const status = document.getElementById("status").value;
    const notes = document.getElementById("notes").value;
    
    // Build items list
    const items = [];
    const rows = document.querySelectorAll(".item-row");
    let hasEmptyItem = false;
    
    rows.forEach(row => {
        const description = row.querySelector(".item-desc").value.trim();
        const quantity = parseFloat(row.querySelector(".item-qty").value) || 0;
        const unitPrice = parseFloat(row.querySelector(".item-price").value) || 0;
        
        if (!description) {
            hasEmptyItem = true;
            return;
        }
        
        items.push({
            description,
            quantity,
            unit_price: unitPrice,
            amount: quantity * unitPrice
        });
    });
    
    if (hasEmptyItem || items.length === 0) {
        showToast("Please fill in description details for all items.", "error");
        return;
    }
    
    // Parse calculations
    let subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    let discountAmt = (discountType === 'percent') ? (subtotal * (discount / 100)) : discount;
    let totalAmount = Math.max(0, subtotal - discountAmt) * (1 + (taxRate / 100));
    
    const payload = {
        invoice_number: invoiceNumber,
        client_name: clientName,
        client_email: clientEmail,
        client_address: clientAddress,
        created_at: createdAt,
        due_date: dueDate,
        tax_rate: taxRate,
        discount: discount,
        discount_type: discountType,
        total_amount: totalAmount,
        status: status,
        notes: notes,
        items: items
    };
    
    const saveBtn = document.getElementById("btn-save-invoice");
    const originalText = saveBtn.innerHTML;
    saveBtn.disabled = true;
    saveBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Saving...`;
    
    try {
        const response = await fetch("/api/invoices", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showToast(`Invoice ${result.invoice_number} saved successfully!`, "success");
            // Redirect to generated invoice page
            setTimeout(() => {
                window.location.href = `/invoice/${result.invoice_number}`;
            }, 1000);
        } else {
            showToast(result.error || "Failed to save invoice", "error");
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalText;
        }
    } catch (err) {
        console.error("Save error:", err);
        showToast("Network error occurred while saving invoice.", "error");
        saveBtn.disabled = false;
        saveBtn.innerHTML = originalText;
    }
}

/* API Dashboard Interactions */
async function toggleStatus(invoiceId, currentStatus) {
    const newStatus = currentStatus === "Paid" ? "Unpaid" : "Paid";
    
    try {
        const response = await fetch(`/api/invoices/${invoiceId}/status`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (response.ok) {
            showToast(`Status updated to ${newStatus}`, "success");
            
            // Reload page to update UI statistics
            setTimeout(() => {
                window.location.reload();
            }, 500);
        } else {
            const err = await response.json();
            showToast(err.error || "Failed to update status", "error");
        }
    } catch (err) {
        console.error("Toggle status error:", err);
        showToast("Error connecting to server.", "error");
    }
}

async function deleteInvoice(invoiceId) {
    if (!confirm("Are you sure you want to permanently delete this invoice?")) {
        return;
    }
    
    try {
        const response = await fetch(`/api/invoices/${invoiceId}`, {
            method: "DELETE"
        });
        
        if (response.ok) {
            showToast("Invoice deleted successfully", "success");
            
            // Fade out the row from dashboard list if present
            const row = document.querySelector(`.invoice-row[data-invoice-id="${invoiceId}"]`);
            if (row) {
                row.style.opacity = 0;
                row.style.transform = "translateX(50px)";
                setTimeout(() => {
                    row.remove();
                    // If no invoices are left, reload to show empty state
                    const remainingRows = document.querySelectorAll(".invoice-row");
                    if (remainingRows.length === 0) {
                        window.location.reload();
                    } else {
                        // Dynamically update dashboard numbers without full reload
                        updateDashboardStats();
                    }
                }, 400);
            } else {
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            }
        } else {
            const err = await response.json();
            showToast(err.error || "Failed to delete invoice", "error");
        }
    } catch (err) {
        console.error("Delete error:", err);
        showToast("Error connecting to server.", "error");
    }
}

// Function to calculate and update dashboard statistics dynamically
function updateDashboardStats() {
    const rows = document.querySelectorAll(".invoice-row");
    let totalRevenue = 0;
    let paidSum = 0;
    let unpaidSum = 0;
    
    rows.forEach(row => {
        const status = row.querySelector(".status-text").textContent.trim();
        const amountText = row.querySelector("td:nth-child(5)").textContent.replace("$", "").replace(/,/g, "");
        const amount = parseFloat(amountText) || 0;
        
        totalRevenue += amount;
        if (status === "Paid") {
            paidSum += amount;
        } else {
            unpaidSum += amount;
        }
    });
    
    const countVal = rows.length;
    
    // Update elements
    const revenueElem = document.getElementById("stat-revenue");
    const collectedElem = document.getElementById("stat-collected");
    const outstandingElem = document.getElementById("stat-outstanding");
    const countElem = document.getElementById("stat-count");
    
    if (revenueElem) revenueElem.textContent = `$${totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    if (collectedElem) collectedElem.textContent = `$${paidSum.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    if (outstandingElem) outstandingElem.textContent = `$${unpaidSum.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    if (countElem) countElem.textContent = countVal;
}

/* Registry Searching & Status Filtering */
const searchInput = document.getElementById("search-input");
const statusFilter = document.getElementById("status-filter");

if (searchInput) {
    searchInput.addEventListener("input", filterRegistryTable);
}
if (statusFilter) {
    statusFilter.addEventListener("change", filterRegistryTable);
}

function filterRegistryTable() {
    const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const filter = statusFilter ? statusFilter.value : "all";
    const rows = document.querySelectorAll(".invoice-row");
    
    let visibleCount = 0;
    
    rows.forEach(row => {
        const invNum = row.querySelector("td:first-child a").textContent.toLowerCase();
        const client = row.querySelector(".client-name-cell").textContent.toLowerCase();
        const status = row.querySelector(".status-text").textContent.trim();
        
        const matchesSearch = invNum.includes(query) || client.includes(query);
        const matchesFilter = filter === "all" || status === filter;
        
        if (matchesSearch && matchesFilter) {
            row.style.display = "";
            visibleCount++;
        } else {
            row.style.display = "none";
        }
    });
    
    // Manage empty states when filtering yields nothing
    const tbody = document.getElementById("invoices-body");
    const existingEmptyRow = document.getElementById("filter-empty-row");
    
    if (visibleCount === 0 && rows.length > 0) {
        if (!existingEmptyRow) {
            const emptyRow = document.createElement("tr");
            emptyRow.id = "filter-empty-row";
            emptyRow.innerHTML = `
                <td colspan="7" class="text-center py-4">
                    <p class="text-muted"><i class="fa-solid fa-face-frown mr-2"></i> No records match your criteria.</p>
                </td>
            `;
            tbody.appendChild(emptyRow);
        }
    } else {
        if (existingEmptyRow) {
            existingEmptyRow.remove();
        }
    }
}
function toggleProfileMenu() {
    const menu = document.getElementById("profileMenu");

    menu.classList.toggle("show");
}

function showProfile(event) {
    event.stopPropagation();

    document.getElementById("profileModal").classList.add("show");
}

function closeProfile() {
    document.getElementById("profileModal").classList.remove("show");
}

function showSettings(event) {
    event.stopPropagation();

    document.getElementById("settingsModal").classList.add("show");
}

function closeSettings() {
    document.getElementById("settingsModal").classList.remove("show");
}
function saveSettings() {

    const adminName = document.getElementById("adminName").value;
    const adminRole = document.getElementById("adminRole").value;
    const businessName = document.getElementById("businessName").value;
    const notifications = document.getElementById("notifications").value;
    const invoiceFormat = document.getElementById("invoiceFormat").value;

    localStorage.setItem("adminName", adminName);
    localStorage.setItem("adminRole", adminRole);
    localStorage.setItem("businessName", businessName);
    localStorage.setItem("notifications", notifications);
    localStorage.setItem("invoiceFormat", invoiceFormat);

    document.querySelector(".profile-name").textContent = adminName;
    document.querySelector(".profile-role").textContent = adminRole;

    alert("Settings saved successfully!");

    closeSettings();
}
function logout(event) {
    event.stopPropagation();

    const confirmLogout = confirm("Are you sure you want to logout?");

    if (confirmLogout) {
        window.location.href = "/logout";
    }
}

document.addEventListener("click", function(event) {

    const profile = document.querySelector(".user-profile");
    const menu = document.getElementById("profileMenu");

    if (profile && menu && !profile.contains(event.target)) {
        menu.classList.remove("show");
    }

});