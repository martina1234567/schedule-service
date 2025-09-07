/**
 * LOGIN FORM WITH ROLE-BASED REDIRECT
 * Логин форма с автоматично пренасочване според ролята
 */

// Global variables
let isFormSubmitting = false;

/**
 * Инициализация при зареждане на страницата
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔐 Login page loaded');

    // Проверка за съществуващ login
    checkExistingLogin();

    // Setup на event listeners
    setupEventListeners();
});

/**
 * Setup event listeners
 */
function setupEventListeners() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Password toggle functionality
    const passwordToggle = document.getElementById('passwordToggle');
    const passwordField = document.getElementById('password');

    if (passwordToggle && passwordField) {
        passwordToggle.addEventListener('click', () => {
            const isPassword = passwordField.type === 'password';
            passwordField.type = isPassword ? 'text' : 'password';
            passwordToggle.textContent = isPassword ? '🙈' : '👁️';
        });
    }
}

/**
 * Обработва login заявката с role-based редирект
 */
async function handleLogin(event) {
    event.preventDefault();

    if (isFormSubmitting) {
        console.log('⏳ Form already submitting, ignoring...');
        return;
    }

    console.log('🔐 Processing login...');

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    // Основна валидация
    if (!username || !password) {
        showError('Моля въведете потребителско име и парола');
        return;
    }

    try {
        isFormSubmitting = true;
        setLoadingState(true);
        hideMessages();

        const loginData = {
            username: username,
            password: password
        };

        console.log('📤 Sending login request for:', username);

        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginData)
        });

        const data = await response.json();
        console.log('📥 Full login response:', JSON.stringify(data, null, 2));
        console.log('🔍 Response redirectUrl:', data.redirectUrl);
        console.log('🔍 User object:', data.user);
        console.log('🔍 User roles from server:', data.user?.roles);

        if (response.ok && data.success) {
            console.log('✅ Login successful:', data);

            // Запазване на потребителски данни в sessionStorage
            sessionStorage.setItem('currentUser', JSON.stringify(data.user));
            sessionStorage.setItem('isLoggedIn', 'true');

            // Показване на success съобщение
            showSuccess('Успешен вход! Пренасочване...');

            // Пренасочване според ролята
            setTimeout(() => {
                const redirectUrl = data.redirectUrl || determineRedirectUrl(data.user);
                console.log('🔄 Redirecting to:', redirectUrl);
                window.location.href = redirectUrl;
            }, 1500);

        } else {
            console.error('❌ Login failed:', data);
            const errorMessage = data.error || data.message || 'Невалидно потребителско име или парола';
            showError(errorMessage);
        }

    } catch (error) {
        console.error('❌ Login error:', error);
        showError('Възникна грешка при свързване със сървъра');
    } finally {
        isFormSubmitting = false;
        setLoadingState(false);
    }
}

/**
 * Определя redirect URL според ролята на потребителя (fallback)
 */
function determineRedirectUrl(user) {
    if (!user || !user.roles || user.roles.length === 0) {
        console.log('👤 No roles found - redirecting to user dashboard');
        return 'user-dashboard.html'; // По подразбиране USER
    }

    console.log('🔍 User roles:', user.roles);

    // Проверяваме ролите с приоритет: ADMIN > MANAGER > USER
    if (user.roles.includes('ADMIN')) {
        console.log('👑 Admin user detected - redirecting to full dashboard');
        return 'index.html';
    } else if (user.roles.includes('MANAGER')) {
        console.log('👔 Manager user detected - redirecting to full dashboard');
        return 'index.html';
    } else {
        console.log('👤 Regular user detected - redirecting to user dashboard');
        return 'user-dashboard.html';
    }
}

/**
 * Проверява дали потребителят е вече логнат при зареждане на страницата
 */
function checkExistingLogin() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const currentUser = sessionStorage.getItem('currentUser');

    if (isLoggedIn === 'true' && currentUser) {
        try {
            const user = JSON.parse(currentUser);
            console.log('🔍 Existing login detected for:', user.username);

            // Пренасочване към подходящата страница
            const redirectUrl = determineRedirectUrl(user);
            console.log('🔄 Auto-redirecting to:', redirectUrl);
            window.location.href = redirectUrl;

        } catch (error) {
            console.error('❌ Error parsing stored user data:', error);
            // Изчистване на невалидни данни
            sessionStorage.removeItem('currentUser');
            sessionStorage.removeItem('isLoggedIn');
        }
    }
}

/**
 * UI Helper Functions
 */
function showError(message) {
    const errorDiv = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');

    if (errorDiv && errorText) {
        errorText.textContent = message;
        errorDiv.style.display = 'block';

        // Hide success message if shown
        const successDiv = document.getElementById('success-message');
        if (successDiv) {
            successDiv.style.display = 'none';
        }

        // Scroll to error
        errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        // Fallback - ако няма error div, използваме alert
        console.error('Error div not found, using alert:', message);
        alert('Грешка: ' + message);
    }
}

function showSuccess(message) {
    const successDiv = document.getElementById('success-message');
    const successText = document.getElementById('success-text');

    if (successDiv && successText) {
        successText.textContent = message;
        successDiv.style.display = 'block';

        // Hide error message if shown
        const errorDiv = document.getElementById('error-message');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }

        // Scroll to success
        successDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        // Fallback - ако няма success div, използваме console.log
        console.log('Success:', message);
    }
}

function hideMessages() {
    const errorDiv = document.getElementById('error-message');
    const successDiv = document.getElementById('success-message');

    if (errorDiv) errorDiv.style.display = 'none';
    if (successDiv) successDiv.style.display = 'none';
}

/**
 * ПОПРАВЕНА ФУНКЦИЯ: setLoadingState с проверки за null
 */
function setLoadingState(isLoading) {
    const loginBtn = document.getElementById('loginBtn');

    if (!loginBtn) {
        console.warn('⚠️ Login button not found!');
        return;
    }

    const btnText = loginBtn.querySelector('.btn-text');
    const btnLoading = loginBtn.querySelector('.btn-loading');

    // Проверяваме дали елементите съществуват преди да ги използваме
    if (!btnText || !btnLoading) {
        console.warn('⚠️ Button text or loading elements not found!');
        // Fallback - променяме само текста и disabled състоянието
        if (isLoading) {
            loginBtn.disabled = true;
            loginBtn.textContent = 'Loading...';
        } else {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Login';
        }
        return;
    }

    // Нормално поведение когато елементите съществуват
    if (isLoading) {
        loginBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline-flex';
    } else {
        loginBtn.disabled = false;
        btnText.style.display = 'inline-flex';
        btnLoading.style.display = 'none';
    }
}

/**
 * Logout функция (за глобално използване)
 */
function handleLogout() {
    console.log('🚪 Logging out user...');

    // Изчистване на session данни
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUser');

    // Пренасочване към login
    window.location.href = 'login.html';
}

// Expose logout function globally for use in other pages
window.handleLogout = handleLogout;