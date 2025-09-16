/**
 * LOGIN FORM WITH ROLE-BASED REDIRECT
 * Логин форма с автоматично пренасочване според ролята
 *
 * ПОПРАВЕНА ВЕРСИЯ 2.1:
 * - Подобрена логика за определяне на редирект URL
 * - По-добра обработка на грешки
 * - Детайлно логване за debugging
 * - Поддръжка за ADMIN и USER роли
 */

// Global variables
let isFormSubmitting = false;

/**
 * Инициализация при зареждане на страницата
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔐 Login page loaded - Role Manager v2.1');

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
 * Обработва login заявката с ПОПРАВЕНА role-based редирект логика
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

        // Детайлно логване за debugging
        console.log('📥 Full login response:', JSON.stringify(data, null, 2));
        console.log('🔍 Response success:', data.success);
        console.log('🔍 Response redirectUrl:', data.redirectUrl);
        console.log('🔍 User object:', data.user);

        if (data.user && data.user.roles) {
            console.log('🔍 User roles from server:', data.user.roles);
            console.log('🔍 User roles type:', typeof data.user.roles);
            console.log('🔍 User roles length:', data.user.roles.length);
        }

        if (response.ok && data.success) {
            console.log('✅ Login successful:', data);

            // Запазване на потребителски данни в sessionStorage
            sessionStorage.setItem('currentUser', JSON.stringify(data.user));
            sessionStorage.setItem('isLoggedIn', 'true');

            // Показване на success съобщение
            showSuccess('Успешен вход! Пренасочване...');

            // ПОПРАВЕНА ЛОГИКА: Използваме redirectUrl от сървъра със fallback
            let redirectUrl = data.redirectUrl;

            // Ако няма redirectUrl от сървъра, определяме го локално
            if (!redirectUrl) {
                console.log('⚠️ No redirectUrl from server, determining locally...');
                redirectUrl = determineRedirectUrl(data.user);
            }

            console.log('🔄 Final redirect URL:', redirectUrl);

            // Пренасочване след кратка пауза
            setTimeout(() => {
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
 * ПОПРАВЕНА ФУНКЦИЯ: Определя redirect URL според ролята на потребителя
 *
 * Тази функция се използва като fallback ако сървърът не върне redirectUrl
 * или за проверка на съществуващ login при зареждане на страницата
 *
 * @param {Object} user - Потребителски обект с роли
 * @returns {string} - URL към който да се пренасочи
 */
function determineRedirectUrl(user) {
    console.log('🔍 CLIENT: Determining redirect URL for user:', user ? user.username : 'undefined');

    // Проверка дали има потребител и роли
    if (!user || !user.roles || !Array.isArray(user.roles) || user.roles.length === 0) {
        console.log('👤 No user or roles found - redirecting to user dashboard');
        return 'user-dashboard.html'; // По подразбиране USER
    }

    console.log('🔍 CLIENT: User roles array:', user.roles);
    console.log('🔍 CLIENT: Checking roles...');

    // Проверяваме ролите с приоритет: ADMIN > MANAGER > USER
    // Конвертираме всички роли в uppercase за сигурност
    const roles = user.roles.map(role => role.toUpperCase());
    console.log('🔍 CLIENT: Normalized roles:', roles);

    if (roles.includes('ADMIN')) {
        console.log('👑 CLIENT: ADMIN role detected - redirecting to full dashboard (index.html)');
        return 'index.html';
    } else if (roles.includes('MANAGER')) {
        console.log('👔 CLIENT: MANAGER role detected - redirecting to full dashboard (index.html)');
        return 'index.html';
    } else {
        console.log('👤 CLIENT: USER role or other - redirecting to user dashboard (user-dashboard.html)');
        return 'user-dashboard.html';
    }
}

/**
 * Проверява дали потребителят е вече логнат при зареждане на страницата
 * ПОПРАВЕНА ВЕРСИЯ с по-добра обработка на грешки
 */
function checkExistingLogin() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const currentUser = sessionStorage.getItem('currentUser');

    console.log('🔍 Checking existing login...');
    console.log('🔍 isLoggedIn:', isLoggedIn);
    console.log('🔍 currentUser exists:', !!currentUser);

    if (isLoggedIn === 'true' && currentUser) {
        try {
            const user = JSON.parse(currentUser);
            console.log('🔍 Existing login detected for:', user.username);
            console.log('🔍 User roles from storage:', user.roles);

            // Пренасочване към подходящата страница
            const redirectUrl = determineRedirectUrl(user);
            console.log('🔄 Auto-redirecting to:', redirectUrl);

            // Добавяме малка пауза за да се покаже страницата преди редирект
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 100);

        } catch (error) {
            console.error('❌ Error parsing stored user data:', error);
            // Изчистване на невалидни данни
            sessionStorage.removeItem('currentUser');
            sessionStorage.removeItem('isLoggedIn');
            console.log('🧹 Cleared invalid session data');
        }
    } else {
        console.log('👋 No existing login found, showing login form');
    }
}

/**
 * LOGOUT ФУНКЦИЯ
 * Изчиства session данните и пренасочва към login страницата
 */
function logout() {
    console.log('🚪 Logging out user...');

    // Изчистване на session storage
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('isLoggedIn');

    console.log('🧹 Session data cleared');

    // Пренасочване към login страницата
    window.location.href = 'login.html';
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

        // Auto-hide error after 5 seconds
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    } else {
        // Fallback to alert if elements not found
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
    } else {
        console.log('✅ ' + message);
    }
}

function hideMessages() {
    const errorDiv = document.getElementById('error-message');
    const successDiv = document.getElementById('success-message');

    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
    if (successDiv) {
        successDiv.style.display = 'none';
    }
}

function setLoadingState(isLoading) {
    const submitButton = document.querySelector('button[type="submit"]');
    const form = document.getElementById('loginForm');

    if (submitButton) {
        if (isLoading) {
            submitButton.disabled = true;
            submitButton.textContent = 'Влизане...';
            submitButton.style.opacity = '0.7';
        } else {
            submitButton.disabled = false;
            submitButton.textContent = 'Влизане';
            submitButton.style.opacity = '1';
        }
    }

    if (form) {
        if (isLoading) {
            form.style.pointerEvents = 'none';
            form.style.opacity = '0.8';
        } else {
            form.style.pointerEvents = 'auto';
            form.style.opacity = '1';
        }
    }
}

/**
 * UTILITY ФУНКЦИИ ЗА DEBUGGING
 */

/**
 * Показва информация за текущия потребител в конзолата
 */
function debugCurrentUser() {
    const currentUser = sessionStorage.getItem('currentUser');
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');

    console.log('=== DEBUG: Current User Info ===');
    console.log('isLoggedIn:', isLoggedIn);

    if (currentUser) {
        try {
            const user = JSON.parse(currentUser);
            console.log('User object:', user);
            console.log('Username:', user.username);
            console.log('Roles:', user.roles);
            console.log('Is Admin:', user.roles && user.roles.includes('ADMIN'));
            console.log('Is User:', user.roles && user.roles.includes('USER'));
            console.log('Suggested redirect:', determineRedirectUrl(user));
        } catch (error) {
            console.error('Error parsing user data:', error);
        }
    } else {
        console.log('No current user data found');
    }
    console.log('=== END DEBUG ===');
}

/**
 * Тестова функция за симулиране на различни роли
 */
function testRedirectLogic() {
    console.log('=== TESTING REDIRECT LOGIC ===');

    // Тест с ADMIN роля
    const adminUser = { username: 'admin', roles: ['ADMIN'] };
    console.log('Admin user redirect:', determineRedirectUrl(adminUser));

    // Тест с USER роля
    const regularUser = { username: 'user', roles: ['USER'] };
    console.log('Regular user redirect:', determineRedirectUrl(regularUser));

    // Тест с множество роли
    const multiRoleUser = { username: 'multi', roles: ['USER', 'ADMIN'] };
    console.log('Multi-role user redirect:', determineRedirectUrl(multiRoleUser));

    // Тест без роли
    const noRoleUser = { username: 'norole', roles: [] };
    console.log('No role user redirect:', determineRedirectUrl(noRoleUser));

    // Тест с null потребител
    console.log('Null user redirect:', determineRedirectUrl(null));

    console.log('=== END TESTING ===');
}

// Експортиране на функции за глобално използване
window.logout = logout;
window.debugCurrentUser = debugCurrentUser;
window.testRedirectLogic = testRedirectLogic;