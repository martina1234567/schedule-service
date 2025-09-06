// ===============================
// JAVASCRIPT ФУНКЦИОНАЛНОСТ - ПОПРАВЕНА ВЕРСИЯ
// ===============================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔐 Login page loaded');
    initializeLoginPage();
});

/**
 * ГЛАВНА ФУНКЦИЯ ЗА ИНИЦИАЛИЗАЦИЯ НА ЛОГИН СТРАНИЦАТА
 */
function initializeLoginPage() {
    // Елементи от DOM
    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    const passwordToggle = document.getElementById('passwordToggle');
    const passwordInput = document.getElementById('password');
    const usernameInput = document.getElementById('username');
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');

    // Event listeners
    setupEventListeners(loginForm, loginBtn, passwordToggle, passwordInput, usernameInput, errorMessage, errorText);

    // Инициализиране на валидация
    setupValidation(usernameInput, passwordInput);

    console.log('✅ Login page initialized');
}

/**
 * НАСТРОЙКА НА EVENT LISTENERS
 */
function setupEventListeners(loginForm, loginBtn, passwordToggle, passwordInput, usernameInput, errorMessage, errorText) {
    // Форма submit
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        handleLogin(usernameInput.value, passwordInput.value, errorMessage, errorText, loginBtn);
    });

    // Показване/скриване на парола
    passwordToggle.addEventListener('click', function() {
        togglePasswordVisibility(passwordInput, passwordToggle);
    });

    // Скриване на error при typing
    usernameInput.addEventListener('input', () => hideError(errorMessage));
    passwordInput.addEventListener('input', () => hideError(errorMessage));

    // Enter key в полетата
    [usernameInput, passwordInput].forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                loginForm.dispatchEvent(new Event('submit'));
            }
        });
    });
}

/**
 * SETUP ВАЛИДАЦИЯ НА ПОЛЕТАТА
 */
function setupValidation(usernameInput, passwordInput) {
    // Real-time валидация за username
    usernameInput.addEventListener('blur', function() {
        validateField(usernameInput, usernameInput.value.length >= 3);
    });

    // Real-time валидация за password
    passwordInput.addEventListener('blur', function() {
        validateField(passwordInput, passwordInput.value.length >= 4);
    });
}

/**
 * ФУНКЦИЯ ЗА ВАЛИДАЦИЯ НА ПОЛЕ
 */
function validateField(input, isValid) {
    input.classList.remove('valid', 'invalid');
    input.classList.add(isValid ? 'valid' : 'invalid');
    return isValid;
}

/**
 * ПОКАЗВАНЕ/СКРИВАНЕ НА ПАРОЛА
 */
function togglePasswordVisibility(passwordInput, passwordToggle) {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    passwordToggle.textContent = isPassword ? '🙈' : '👁️';
    passwordToggle.title = isPassword ? 'Скрий парола' : 'Покажи парола';
}

/**
 * ГЛАВНА ФУНКЦИЯ ЗА ОБРАБОТКА НА ЛОГИН
 * ПОПРАВЕНА ВЕРСИЯ С РЕАЛНА REST ЗАЯВКА
 */
async function handleLogin(username, password, errorMessage, errorText, loginBtn) {
    console.log('🔐 Attempting real login for:', username);

    // Скриваме предишни грешки
    hideError(errorMessage);

    // Валидация на входните данни
    if (!validateLoginData(username, password, errorMessage, errorText)) {
        return;
    }

    // Показваме loading състояние
    setLoginLoading(loginBtn, true);

    try {
        console.log('📡 Making real HTTP request to backend...');
        
        // РЕАЛНА REST ЗАЯВКА КЪМ SPRING BOOT BACKEND
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username.trim(),
                password: password
            })
        });

        console.log('📊 Response status:', response.status);
        
        const data = await response.json();
        console.log('📄 Response data:', data);

        if (response.ok && data.success) {
            // Успешен логин
            console.log('✅ Login successful');
            handleLoginSuccess(data.user, data.token);
        } else {
            // Грешка при логин
            const errorMsg = data.message || 'Неправилно потребителско име или парола';
            console.log('❌ Login failed:', errorMsg);
            showError(errorMessage, errorText, errorMsg);
        }
    } catch (error) {
        console.error('❌ Network/Login error:', error);
        showError(errorMessage, errorText, 'Възникна грешка при свързване със сървъра. Проверете дали Spring Boot приложението работи.');
    } finally {
        // Премахваме loading състоянието
        setLoginLoading(loginBtn, false);
    }
}

/**
 * ВАЛИДАЦИЯ НА ВХОДНИТЕ ДАННИ
 */
function validateLoginData(username, password, errorMessage, errorText) {
    if (!username.trim()) {
        showError(errorMessage, errorText, 'Моля въведете потребителско име');
        return false;
    }

    if (username.length < 3) {
        showError(errorMessage, errorText, 'Потребителското име трябва да е поне 3 символа');
        return false;
    }

    if (!password) {
        showError(errorMessage, errorText, 'Моля въведете парола');
        return false;
    }

    if (password.length < 4) {
        showError(errorMessage, errorText, 'Паролата трябва да е поне 4 символа');
        return false;
    }

    return true;
}

/**
 * ОБРАБОТКА НА УСПЕШЕН ЛОГИН
 */
function handleLoginSuccess(user, token) {
    localStorage.setItem('authToken', token);
    localStorage.setItem('currentUser', JSON.stringify(user));
    console.log('✅ Login successful, redirecting...');
    window.location.href = '/index.html';
}
/**
 * ПОКАЗВАНЕ НА ГРЕШКА
 */
function showError(errorMessage, errorText, message) {
    errorText.textContent = message;
    errorMessage.classList.add('show');

    // Автоматично скриване след 5 секунди
    setTimeout(() => {
        hideError(errorMessage);
    }, 5000);
}

/**
 * ПОКАЗВАНЕ НА SUCCESS СЪОБЩЕНИЕ
 */
function showSuccess(errorMessage, errorText, message) {
    if (errorMessage && errorText) {
        errorText.textContent = message;
        errorMessage.classList.remove('show');
        errorMessage.classList.add('success', 'show');

        // Премахваме success класа след време
        setTimeout(() => {
            errorMessage.classList.remove('success');
        }, 2000);
    } else {
        // Fallback - показваме в конзолата
        console.log('✅ SUCCESS:', message);
    }
}

/**
 * СКРИВАНЕ НА ГРЕШКА
 */
function hideError(errorMessage) {
    if (errorMessage) {
        errorMessage.classList.remove('show', 'success');
    }
}

/**
 * УПРАВЛЕНИЕ НА LOADING СЪСТОЯНИЕТО НА БУТОНА
 */
function setLoginLoading(loginBtn, isLoading) {
    if (isLoading) {
        loginBtn.classList.add('loading');
        loginBtn.disabled = true;
        loginBtn.textContent = 'Влизане...';
    } else {
        loginBtn.classList.remove('loading');
        loginBtn.disabled = false;
        loginBtn.textContent = 'Log in';
    }
}

// ===============================
// DEBUGGING ФУНКЦИИ
// ===============================

/**
 * ФУНКЦИЯ ЗА ТЕСТВАНЕ НА BACKEND CONNECTION
 * Отворете Console и изпълнете: testBackendConnection()
 */
window.testBackendConnection = async function() {
    console.log('🧪 Testing backend connection...');
    
    try {
        const response = await fetch('/api/auth/hash-password?password=test123');
        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ Backend is working!', data);
            return true;
        } else {
            console.log('❌ Backend error:', data);
            return false;
        }
    } catch (error) {
        console.error('❌ Cannot connect to backend:', error);
        return false;
    }
};

/**
 * ФУНКЦИЯ ЗА ДИРЕКТНО ТЕСТВАНЕ НА LOGIN
 * Отворете Console и изпълнете: testLogin('admin', 'Admin123@')
 */
window.testLogin = async function(username, password) {
    console.log(`🧪 Testing login with: ${username} / ${password}`);
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ Login test successful:', data);
        } else {
            console.log('❌ Login test failed:', data);
        }
        
        return data;
    } catch (error) {
        console.error('❌ Login test error:', error);
        return null;
    }
};