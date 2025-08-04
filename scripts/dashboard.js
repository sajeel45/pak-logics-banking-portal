// Dashboard Management
class DashboardManager {
    constructor() {
        this.currentUser = null;
        this.accounts = [];
        this.transactions = [];
        this.init();
    }

    init() {
        this.checkAuth();
        this.loadUserData();
        this.bindEvents();
        this.updateUI();
    }

    checkAuth() {
        const user = localStorage.getItem('bankingPortalCurrentUser');
        if (!user) {
            window.location.href = 'index.html';
            return;
        }
        this.currentUser = JSON.parse(user);
    }

    loadUserData() {
        // Load user's accounts and transactions
        const users = JSON.parse(localStorage.getItem('bankingPortalUsers') || '[]');
        const fullUserData = users.find(u => u.id === this.currentUser.id);
        
        if (fullUserData) {
            this.accounts = fullUserData.accounts || [];
            this.transactions = fullUserData.transactions || [];
        }
    }

    bindEvents() {
        // Navigation events
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                this.navigateToPage(page);
            });
        });

        // Create account form
        document.getElementById('createAccountForm').addEventListener('submit', (e) => {
            this.handleCreateAccount(e);
        });

        // Deposit form
        document.getElementById('depositForm').addEventListener('submit', (e) => {
            this.handleDeposit(e);
        });

        // Withdraw form
        document.getElementById('withdrawForm').addEventListener('submit', (e) => {
            this.handleWithdraw(e);
        });

        // Account selection change for withdrawal (to show available balance)
        document.getElementById('withdrawAccount').addEventListener('change', (e) => {
            this.updateAvailableBalance(e.target.value);
        });

        // Filter events
        const accountFilter = document.getElementById('accountFilter');
        const typeFilter = document.getElementById('typeFilter');
        
        if (accountFilter) {
            accountFilter.addEventListener('change', () => this.filterTransactions());
        }
        
        if (typeFilter) {
            typeFilter.addEventListener('change', () => this.filterTransactions());
        }
    }

    updateUI() {
        this.updateUserInfo();
        this.updateDashboard();
        this.updateAccounts();
        this.updateTransactions();
    }

    updateUserInfo() {
        const userNameElements = document.querySelectorAll('#userName, #dashboardUserName');
        const userEmailElement = document.getElementById('userEmail');
        
        userNameElements.forEach(el => {
            el.textContent = this.currentUser.name;
        });
        
        if (userEmailElement) {
            userEmailElement.textContent = this.currentUser.email;
        }
    }

    updateDashboard() {
        // Calculate total balance
        const totalBalance = this.accounts.reduce((sum, account) => sum + account.balance, 0);
        document.getElementById('totalBalance').textContent = this.formatCurrency(totalBalance);
        
        // Update active accounts count
        document.getElementById('activeAccounts').textContent = this.accounts.length;
        
        // Update monthly transactions count
        const currentMonth = new Date().getMonth();
        const monthlyTransactions = this.transactions.filter(t => 
            new Date(t.date).getMonth() === currentMonth
        ).length;
        document.getElementById('monthlyTransactions').textContent = monthlyTransactions;

        // Update recent activity
        this.updateRecentActivity();
    }

    updateRecentActivity() {
        const container = document.getElementById('recentActivity');
        const recentTransactions = this.transactions
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);

        if (recentTransactions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-history"></i>
                    <p>No recent activity</p>
                    <span>Your transactions will appear here</span>
                </div>
            `;
            return;
        }

        container.innerHTML = recentTransactions.map(transaction => `
            <div class="transaction-item">
                <div class="transaction-info">
                    <div class="transaction-icon ${transaction.type}">
                        <i class="fas ${this.getTransactionIcon(transaction.type)}"></i>
                    </div>
                    <div class="transaction-details">
                        <h4>${transaction.description}</h4>
                        <p>${this.formatDate(transaction.date)}</p>
                    </div>
                </div>
                <div class="transaction-amount ${transaction.amount >= 0 ? 'positive' : 'negative'}">
                    ${transaction.amount >= 0 ? '+' : ''}${this.formatCurrency(Math.abs(transaction.amount))}
                </div>
            </div>
        `).join('');
    }

    updateAccounts() {
        const container = document.getElementById('accountsGrid');
        
        if (this.accounts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-credit-card"></i>
                    <p>No accounts yet</p>
                    <span>Create your first banking account to get started</span>
                    <button class="primary-btn" onclick="showCreateAccountModal()">
                        <i class="fas fa-plus"></i>
                        Create Account
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = this.accounts.map(account => `
            <div class="account-card">
                <div class="account-header">
                    <div class="account-type">
                        <i class="fas ${this.getAccountIcon(account.type)}"></i>
                        ${this.getAccountTypeName(account.type)}
                    </div>
                    <button class="secondary-btn" onclick="viewAccountDetails('${account.id}')">
                        <i class="fas fa-eye"></i>
                        View
                    </button>
                </div>
                <div class="account-name">${account.name}</div>
                <div class="account-balance">${this.formatCurrency(account.balance)}</div>
                <div class="account-number">**** **** **** ${account.number.slice(-4)}</div>
                <div class="account-actions">
                    <button class="action-btn deposit" onclick="showDepositModal('${account.id}')">
                        <i class="fas fa-plus"></i>
                        Deposit
                    </button>
                    <button class="action-btn withdraw" onclick="showWithdrawModal('${account.id}')">
                        <i class="fas fa-minus"></i>
                        Withdraw
                    </button>
                </div>
            </div>
        `).join('');

        // Update account filter and dropdowns
        this.updateAccountFilter();
        this.updateAccountDropdowns();
    }

    updateAccountFilter() {
        const filter = document.getElementById('accountFilter');
        if (filter) {
            filter.innerHTML = '<option value="">All Accounts</option>' +
                this.accounts.map(account => 
                    `<option value="${account.id}">${account.name}</option>`
                ).join('');
        }
    }

    updateTransactions() {
        this.filterTransactions();
    }

    filterTransactions() {
        const container = document.getElementById('transactionsList');
        const accountFilter = document.getElementById('accountFilter')?.value;
        const typeFilter = document.getElementById('typeFilter')?.value;

        let filteredTransactions = this.transactions;

        if (accountFilter) {
            filteredTransactions = filteredTransactions.filter(t => t.accountId === accountFilter);
        }

        if (typeFilter) {
            filteredTransactions = filteredTransactions.filter(t => t.type === typeFilter);
        }

        // Sort by date (newest first)
        filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (filteredTransactions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-receipt"></i>
                    <p>No transactions found</p>
                    <span>Try adjusting your filters</span>
                </div>
            `;
            return;
        }

        container.innerHTML = filteredTransactions.map(transaction => {
            const account = this.accounts.find(a => a.id === transaction.accountId);
            return `
                <div class="transaction-item">
                    <div class="transaction-info">
                        <div class="transaction-icon ${transaction.type}">
                            <i class="fas ${this.getTransactionIcon(transaction.type)}"></i>
                        </div>
                        <div class="transaction-details">
                            <h4>${transaction.description}</h4>
                            <p>${account ? account.name : 'Unknown Account'} • ${this.formatDate(transaction.date)}</p>
                        </div>
                    </div>
                    <div class="transaction-amount ${transaction.amount >= 0 ? 'positive' : 'negative'}">
                        ${transaction.amount >= 0 ? '+' : ''}${this.formatCurrency(Math.abs(transaction.amount))}
                    </div>
                </div>
            `;
        }).join('');
    }

    navigateToPage(page) {
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-page="${page}"]`).classList.add('active');

        // Show page
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });
        document.getElementById(`${page}Page`).classList.add('active');

        // Update data if needed
        if (page === 'accounts') {
            this.updateAccounts();
        } else if (page === 'transactions') {
            this.updateTransactions();
        }
    }

    async handleCreateAccount(e) {
        e.preventDefault();
        
        const name = document.getElementById('accountName').value.trim();
        const type = document.getElementById('accountType').value;
        const initialDeposit = parseFloat(document.getElementById('initialDeposit').value) || 0;
        const submitBtn = e.target.querySelector('button[type="submit"]');

        if (!name || !type) {
            this.showError('Please fill in all required fields');
            return;
        }

        this.setLoadingState(submitBtn, true);

        try {
            // Simulate API delay
            await this.delay(800);

            // Create new account
            const newAccount = {
                id: this.generateAccountId(),
                name: name,
                type: type,
                balance: initialDeposit,
                number: this.generateAccountNumber(),
                createdAt: new Date().toISOString(),
                userId: this.currentUser.id
            };

            // Add to accounts array
            this.accounts.push(newAccount);

            // Create initial deposit transaction if amount > 0
            if (initialDeposit > 0) {
                const transaction = {
                    id: this.generateTransactionId(),
                    accountId: newAccount.id,
                    type: 'deposit',
                    amount: initialDeposit,
                    description: 'Initial deposit',
                    date: new Date().toISOString(),
                    userId: this.currentUser.id
                };
                this.transactions.push(transaction);
            }

            // Save to localStorage
            this.saveUserData();

            // Show success message
            this.showSuccess('Account Created!', `Your ${this.getAccountTypeName(type).toLowerCase()} account "${name}" has been created successfully.`);

            // Reset form and close modal
            e.target.reset();
            this.hideCreateAccountModal();

            // Update UI
            this.updateUI();

        } catch (error) {
            this.showError('Failed to create account. Please try again.');
        } finally {
            this.setLoadingState(submitBtn, false);
        }
    }

    async handleDeposit(e) {
        e.preventDefault();
        
        const accountId = document.getElementById('depositAccount').value;
        const amount = parseFloat(document.getElementById('depositAmount').value);
        const description = document.getElementById('depositDescription').value.trim() || 'Deposit';
        const submitBtn = e.target.querySelector('button[type="submit"]');

        // Validate inputs
        if (!accountId || !amount || amount <= 0) {
            this.showError('Please fill in all required fields with valid values');
            return;
        }

        // Find the account before starting async operation
        const accountIndex = this.accounts.findIndex(acc => acc.id === accountId);
        if (accountIndex === -1) {
            this.showError('Account not found');
            return;
        }

        this.setLoadingState(submitBtn, true);

        try {
            // Simulate API delay
            await this.delay(800);

            // Update account balance
            this.accounts[accountIndex].balance += amount;

            // Create transaction record
            const transaction = {
                id: this.generateTransactionId(),
                accountId: accountId,
                type: 'deposit',
                amount: amount,
                description: description,
                date: new Date().toISOString(),
                userId: this.currentUser.id
            };
            this.transactions.push(transaction);

            // Save to localStorage
            this.saveUserData();

            // Show success message
            this.showSuccess('Deposit Successful!', `$${amount.toFixed(2)} has been deposited to your account.`);

            // Reset form and close modal
            e.target.reset();
            this.hideDepositModal();

            // Update UI
            this.updateUI();

        } catch (error) {
            console.error('Deposit error:', error);
            this.showError('Deposit failed. Please try again.');
        } finally {
            this.setLoadingState(submitBtn, false);
        }
    }

    async handleWithdraw(e) {
        e.preventDefault();
        
        const accountId = document.getElementById('withdrawAccount').value;
        const amount = parseFloat(document.getElementById('withdrawAmount').value);
        const description = document.getElementById('withdrawDescription').value.trim() || 'Withdrawal';
        const submitBtn = e.target.querySelector('button[type="submit"]');

        // Validate inputs
        if (!accountId || !amount || amount <= 0) {
            this.showError('Please fill in all required fields with valid values');
            return;
        }

        // Find the account before starting async operation
        const accountIndex = this.accounts.findIndex(acc => acc.id === accountId);
        if (accountIndex === -1) {
            this.showError('Account not found');
            return;
        }

        // Check if sufficient balance
        if (this.accounts[accountIndex].balance < amount) {
            this.showError('Insufficient balance for this withdrawal');
            return;
        }

        this.setLoadingState(submitBtn, true);

        try {
            // Simulate API delay
            await this.delay(800);

            // Update account balance
            this.accounts[accountIndex].balance -= amount;

            // Create transaction record
            const transaction = {
                id: this.generateTransactionId(),
                accountId: accountId,
                type: 'withdrawal',
                amount: -amount, // Negative for withdrawal
                description: description,
                date: new Date().toISOString(),
                userId: this.currentUser.id
            };
            this.transactions.push(transaction);

            // Save to localStorage
            this.saveUserData();

            // Show success message
            this.showSuccess('Withdrawal Successful!', `$${amount.toFixed(2)} has been withdrawn from your account.`);

            // Reset form and close modal
            e.target.reset();
            this.hideWithdrawModal();

            // Update UI
            this.updateUI();

        } catch (error) {
            console.error('Withdrawal error:', error);
            this.showError('Withdrawal failed. Please try again.');
        } finally {
            this.setLoadingState(submitBtn, false);
        }
    }

    updateAvailableBalance(accountId) {
        const balanceElement = document.getElementById('availableBalance');
        if (!accountId) {
            balanceElement.textContent = '$0.00';
            return;
        }

        const account = this.accounts.find(acc => acc.id === accountId);
        if (account) {
            balanceElement.textContent = this.formatCurrency(account.balance);
        } else {
            balanceElement.textContent = '$0.00';
        }
    }

    updateAccountDropdowns() {
        const depositSelect = document.getElementById('depositAccount');
        const withdrawSelect = document.getElementById('withdrawAccount');
        
        const accountOptions = this.accounts.map(account => 
            `<option value="${account.id}">${account.name} - ${this.formatCurrency(account.balance)}</option>`
        ).join('');

        if (depositSelect) {
            depositSelect.innerHTML = '<option value="">Choose an account</option>' + accountOptions;
        }
        
        if (withdrawSelect) {
            withdrawSelect.innerHTML = '<option value="">Choose an account</option>' + accountOptions;
        }
    }

    saveUserData() {
        const users = JSON.parse(localStorage.getItem('bankingPortalUsers') || '[]');
        const userIndex = users.findIndex(u => u.id === this.currentUser.id);
        
        if (userIndex !== -1) {
            users[userIndex].accounts = this.accounts;
            users[userIndex].transactions = this.transactions;
            localStorage.setItem('bankingPortalUsers', JSON.stringify(users));
        }
    }

    // Utility methods
    generateAccountId() {
        return 'acc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateTransactionId() {
        return 'txn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateAccountNumber() {
        return Math.random().toString().substr(2, 16);
    }

    getAccountIcon(type) {
        const icons = {
            checking: 'fa-credit-card',
            savings: 'fa-piggy-bank',
            business: 'fa-briefcase'
        };
        return icons[type] || 'fa-credit-card';
    }

    getAccountTypeName(type) {
        const names = {
            checking: 'Checking Account',
            savings: 'Savings Account',
            business: 'Business Account'
        };
        return names[type] || 'Account';
    }

    getTransactionIcon(type) {
        const icons = {
            deposit: 'fa-arrow-down',
            withdrawal: 'fa-arrow-up',
            transfer: 'fa-exchange-alt'
        };
        return icons[type] || 'fa-exchange-alt';
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    setLoadingState(button, isLoading) {
        if (isLoading) {
            button.disabled = true;
            button.style.opacity = '0.7';
            const icon = button.querySelector('i');
            if (icon) {
                icon.className = 'fas fa-spinner fa-spin';
            }
        } else {
            button.disabled = false;
            button.style.opacity = '1';
            const icon = button.querySelector('i');
            if (icon) {
                // Determine the correct icon based on button context
                const isCreateAccount = button.closest('#createAccountForm');
                const isDeposit = button.closest('#depositForm');
                const isWithdraw = button.closest('#withdrawForm');
                
                if (isCreateAccount) {
                    icon.className = 'fas fa-plus';
                } else if (isDeposit) {
                    icon.className = 'fas fa-plus';
                } else if (isWithdraw) {
                    icon.className = 'fas fa-minus';
                } else {
                    icon.className = 'fas fa-check';
                }
            }
        }
    }

    showError(message) {
        // Create a temporary error modal or use better error display
        const errorModal = document.createElement('div');
        errorModal.className = 'modal-overlay';
        errorModal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h2 style="color: var(--danger-color);">
                        <i class="fas fa-exclamation-triangle"></i>
                        Error
                    </h2>
                </div>
                <div style="padding: 20px;">
                    <p>${message}</p>
                </div>
                <div class="modal-footer">
                    <button class="primary-btn" onclick="this.closest('.modal-overlay').remove()">
                        OK
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(errorModal);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (errorModal.parentNode) {
                errorModal.remove();
            }
        }, 5000);
    }

    showSuccess(title, message) {
        document.getElementById('successTitle').textContent = title;
        document.getElementById('successMessage').textContent = message;
        document.getElementById('successModal').classList.remove('hidden');
    }

    hideCreateAccountModal() {
        document.getElementById('createAccountModal').classList.add('hidden');
    }

    hideDepositModal() {
        document.getElementById('depositModal').classList.add('hidden');
    }

    hideWithdrawModal() {
        document.getElementById('withdrawModal').classList.add('hidden');
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Global functions for UI interactions
function logout() {
    localStorage.removeItem('bankingPortalCurrentUser');
    window.location.href = 'index.html';
}

function navigateToPage(page) {
    if (window.dashboardManager) {
        window.dashboardManager.navigateToPage(page);
    }
}

function showCreateAccountModal() {
    document.getElementById('createAccountModal').classList.remove('hidden');
}

function hideCreateAccountModal() {
    document.getElementById('createAccountModal').classList.add('hidden');
}

function showDepositModal(accountId = null) {
    const modal = document.getElementById('depositModal');
    modal.classList.remove('hidden');
    
    // Pre-select account if provided
    if (accountId && window.dashboardManager) {
        setTimeout(() => {
            document.getElementById('depositAccount').value = accountId;
        }, 100);
    }
}

function hideDepositModal() {
    document.getElementById('depositModal').classList.add('hidden');
}

function showWithdrawModal(accountId = null) {
    const modal = document.getElementById('withdrawModal');
    modal.classList.remove('hidden');
    
    // Pre-select account if provided and update available balance
    if (accountId && window.dashboardManager) {
        setTimeout(() => {
            document.getElementById('withdrawAccount').value = accountId;
            window.dashboardManager.updateAvailableBalance(accountId);
        }, 100);
    }
}

function hideWithdrawModal() {
    document.getElementById('withdrawModal').classList.add('hidden');
}

function hideSuccessModal() {
    document.getElementById('successModal').classList.add('hidden');
}

function viewAccountDetails(accountId) {
    // This can be expanded to show detailed account information
    console.log('Viewing account details for:', accountId);
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardManager = new DashboardManager();
});
