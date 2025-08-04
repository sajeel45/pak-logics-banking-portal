// Authentication Management
class AuthManager {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAuthStatus();
    }

    bindEvents() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        loginForm.addEventListener('submit', (e) => this.handleLogin(e));

        // Signup form
        const signupForm = document.getElementById('signupForm');
        signupForm.addEventListener('submit', (e) => this.handleSignup(e));

        // Real-time validation
        this.setupRealtimeValidation();
    }

    setupRealtimeValidation() {
        const inputs = document.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });

        // Password confirmation validation
        const confirmPassword = document.getElementById('confirmPassword');
        const signupPassword = document.getElementById('signupPassword');
        
        if (confirmPassword && signupPassword) {
            confirmPassword.addEventListener('input', () => {
                this.validatePasswordMatch(signupPassword.value, confirmPassword.value, confirmPassword);
            });
        }
    }

    validateField(input) {
        const value = input.value.trim();
        let isValid = true;
        let errorMessage = '';

        // Remove existing error
        this.clearFieldError(input);

        switch (input.type) {
            case 'email':
                isValid = this.isValidEmail(value);
                errorMessage = 'Please enter a valid email address';
                break;
            case 'password':
                if (input.id === 'confirmPassword') {
                    const password = document.getElementById('signupPassword').value;
                    isValid = value === password && value.length >= 6;
                    errorMessage = value !== password ? 'Passwords do not match' : 'Password must be at least 6 characters';
                } else {
                    isValid = value.length >= 6;
                    errorMessage = 'Password must be at least 6 characters';
                }
                break;
            case 'text':
                isValid = value.length >= 2;
                errorMessage = 'Name must be at least 2 characters';
                break;
        }

        if (!isValid && value.length > 0) {
            this.showFieldError(input, errorMessage);
        } else if (isValid && value.length > 0) {
            input.classList.add('valid');
        }

        return isValid;
    }

    validatePasswordMatch(password, confirmPassword, confirmInput) {
        if (confirmPassword.length > 0) {
            if (password === confirmPassword && password.length >= 6) {
                confirmInput.classList.remove('invalid');
                confirmInput.classList.add('valid');
                this.clearFieldError(confirmInput);
            } else {
                confirmInput.classList.add('invalid');
                confirmInput.classList.remove('valid');
                const message = password !== confirmPassword ? 'Passwords do not match' : 'Password must be at least 6 characters';
                this.showFieldError(confirmInput, message);
            }
        }
    }

    showFieldError(input, message) {
        input.classList.add('invalid');
        input.classList.remove('valid');
        
        // Remove existing error message
        const existingError = input.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        // Add new error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        input.parentNode.appendChild(errorDiv);
    }

    clearFieldError(input) {
        input.classList.remove('invalid');
        const errorMessage = input.parentNode.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.remove();
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const submitBtn = e.target.querySelector('button[type="submit"]');

        // Validate inputs
        if (!this.isValidEmail(email)) {
            this.showError('Please enter a valid email address');
            return;
        }

        if (password.length < 6) {
            this.showError('Password must be at least 6 characters');
            return;
        }

        // Show loading state
        this.setLoadingState(submitBtn, true);

        try {
            // Simulate API call delay
            await this.delay(1000);

            // Check if user exists in localStorage
            const users = this.getStoredUsers();
            const user = users.find(u => u.email === email && u.password === password);

            if (user) {
                // Login successful
                this.setCurrentUser(user);
                this.showSuccess('Login successful!', 'Redirecting to your dashboard...');
                
                // Redirect to dashboard after delay
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            } else {
                this.showError('Invalid email or password. Please try again.');
            }
        } catch (error) {
            this.showError('Login failed. Please try again.');
        } finally {
            this.setLoadingState(submitBtn, false);
        }
    }

    async handleSignup(e) {
        e.preventDefault();
        
        const name = document.getElementById('signupName').value.trim();
        const email = document.getElementById('signupEmail').value.trim();
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const submitBtn = e.target.querySelector('button[type="submit"]');

        // Validate inputs
        if (name.length < 2) {
            this.showError('Name must be at least 2 characters');
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showError('Please enter a valid email address');
            return;
        }

        if (password.length < 6) {
            this.showError('Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            this.showError('Passwords do not match');
            return;
        }

        // Show loading state
        this.setLoadingState(submitBtn, true);

        try {
            // Simulate API call delay
            await this.delay(1200);

            // Check if user already exists
            const users = this.getStoredUsers();
            const existingUser = users.find(u => u.email === email);

            if (existingUser) {
                this.showError('An account with this email already exists');
                return;
            }

            // Create new user
            const newUser = {
                id: this.generateUserId(),
                name: name,
                email: email,
                password: password, // In production, this should be hashed
                createdAt: new Date().toISOString(),
                accounts: []
            };

            // Save user
            users.push(newUser);
            localStorage.setItem('bankingPortalUsers', JSON.stringify(users));

            // Set as current user
            this.setCurrentUser(newUser);

            // Show success message
            this.showSuccess('Account created successfully!', 'Welcome to SecureBank. Redirecting to your dashboard...');

            // Redirect to dashboard after delay
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);

        } catch (error) {
            this.showError('Registration failed. Please try again.');
        } finally {
            this.setLoadingState(submitBtn, false);
        }
    }

    checkAuthStatus() {
        const currentUser = this.getCurrentUser();
        if (currentUser && (window.location.pathname.includes('index.html') || window.location.pathname === '/')) {
            // User is logged in but on auth page, redirect to dashboard
            window.location.href = 'dashboard.html';
        }
    }

    // Utility methods
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    getStoredUsers() {
        const users = localStorage.getItem('bankingPortalUsers');
        return users ? JSON.parse(users) : [];
    }

    setCurrentUser(user) {
        // Don't store password in current user session
        const userSession = {
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt
        };
        localStorage.setItem('bankingPortalCurrentUser', JSON.stringify(userSession));
    }

    getCurrentUser() {
        const user = localStorage.getItem('bankingPortalCurrentUser');
        return user ? JSON.parse(user) : null;
    }

    setLoadingState(button, isLoading) {
        if (isLoading) {
            button.classList.add('loading');
            button.disabled = true;
            const icon = button.querySelector('i');
            if (icon) {
                icon.className = 'fas fa-spinner';
            }
        } else {
            button.classList.remove('loading');
            button.disabled = false;
            const icon = button.querySelector('i');
            if (icon) {
                const isLogin = button.closest('#loginForm');
                icon.className = isLogin ? 'fas fa-sign-in-alt' : 'fas fa-user-plus';
            }
        }
    }

    showError(message) {
        // You can implement a toast notification system here
        // For now, using alert
        alert('Error: ' + message);
    }

    showSuccess(title, message) {
        const overlay = document.getElementById('messageOverlay');
        const titleEl = document.getElementById('messageTitle');
        const textEl = document.getElementById('messageText');

        titleEl.textContent = title;
        textEl.textContent = message;
        
        overlay.classList.remove('hidden');
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// UI Helper Functions
function showLogin() {
    document.getElementById('loginContainer').classList.remove('hidden');
    document.getElementById('signupContainer').classList.add('hidden');
}

function showSignup() {
    document.getElementById('loginContainer').classList.add('hidden');
    document.getElementById('signupContainer').classList.remove('hidden');
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.nextElementSibling;
    const icon = button.querySelector('i');

    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

function hideMessage() {
    document.getElementById('messageOverlay').classList.add('hidden');
}

// Initialize authentication manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AuthManager();
});

// Export for other modules
window.AuthManager = AuthManager;
