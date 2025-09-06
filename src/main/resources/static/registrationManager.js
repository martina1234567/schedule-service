// ===============================
// JAVASCRIPT ФУНКЦИОНАЛНОСТ ЗА РЕГИСТРАЦИЯ
// ===============================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 Registration page loaded');
    initializeRegistrationPage();
});

/**
 * ГЛАВНА ФУНКЦИЯ ЗА ИНИЦИАЛИЗАЦИЯ
 */
function initializeRegistrationPage() {
    // Елементи от DOM
    const form = document.getElementById('registrationForm');
    const employeeSelect = document.getElementById('employeeSelect');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const registerBtn = document.getElementById('registerBtn');

    // Зареждаме служителите
    loadAvailableEmployees();

    // Event listeners
    setupRegistrationEventListeners();

    console.log('✅ Registration page initialized');
}

/**
 * ЗАРЕЖДА СЛУЖИТЕЛИТЕ БЕЗ АКАУНТИ ЗА DROPDOWN
 */
async function loadAvailableEmployees() {
    const employeeSelect = document.getElementById('employeeSelect');

    try {
        employeeSelect.classList.add('loading');
        employeeSelect.innerHTML = '<option value="" disabled selected>Зареждане...</option>';

        const response = await fetch('/api/auth/available-employees');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const employees = await response.json();

        // Попълваме dropdown-а
        employeeSelect.innerHTML = '<option value="" disabled selected>Избери служител</option>';

        if (employees.length === 0) {
            employeeSelect.innerHTML = '<option value="" disabled>Няма служители без акаунти</option>';
            employeeSelect.disabled = true;
        } else {
            employees.forEach(employee => {
                const option = document.createElement('option');
                option.value = employee.id;
                option.textContent = `${employee.name} ${employee.lastname} - ${employee.position}`;
                employeeSelect.appendChild(option);
            });
        }

        console.log(`📋 Loaded ${employees.length} employees without accounts`);

    } catch (error) {
        console.error('❌ Error loading employees:', error);
        employeeSelect.innerHTML = '<option value="" disabled>Грешка при зареждане</option>';
        showError('Грешка при зареждане на служителите');
    } finally {
        employeeSelect.classList.remove('loading');
    }
}

/**
 * НАСТРОЙКА НА EVENT LISTENERS
 */
function setupRegistrationEventListeners() {
    const form = document.getElementById('registrationForm');
    const employeeSelect = document.getElementById('employeeSelect');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const passwordToggle = document.getElementById('passwordToggle');
    const confirmPasswordToggle = document.getElementById('confirmPasswordToggle');

    // Form submit
    form.addEventListener('submit', handleRegistration);

    // Password toggles
    passwordToggle.addEventListener('click', () => {
        togglePasswordVisibility(passwordInput, passwordToggle);
    });

    confirmPasswordToggle.addEventListener('click', () => {
        togglePasswordVisibility(confirmPasswordInput, confirmPasswordToggle);
    });

    // Real-time валидация
    usernameInput.addEventListener('blur', () => validateUsername());
    passwordInput.addEventListener('input', () => validatePasswordStrength());
    confirmPasswordInput.addEventListener('input', () => validatePasswordMatch());

    // Скриване на съобщения при typing
    [usernameInput, passwordInput, confirmPasswordInput].forEach(input => {
        input.addEventListener('input', () => {
            hideError();
            hideSuccess();
        });
    });

    // Промяна в employee select
    employeeSelect.addEventListener('change', () => {
        hideError();
        hideSuccess();
    });
}

/**
 * ГЛАВНА ФУНКЦИЯ ЗА ОБРАБОТКА НА РЕГИСТРАЦИЯ
 */
async function handleRegistration(event) {
    event.preventDefault();

    console.log('👤 Registration attempt...');

    // Събираме данните от формата
    const formData = collectFormData();

    // Валидираме данните
    if (!validateFormData(formData)) {
        return;
    }

    // Показваме loading състояние
    setRegistrationLoading(true);

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: formData.username,
                password: formData.password,
                confirmPassword: formData.confirmPassword,
                employeeId: parseInt(formData.employeeId),
                role: formData.role
            })
        });

        const result = await response.json();

        if (result.success) {
            // Успешна регистрация
            console.log('✅ Registration successful:', result.user.username);
            showSuccess(`Потребителят "${result.user.username}" е създаден успешно!`);

            // Изчистваме формата
            clearForm();

            // Презареждаме списъка със служители
            setTimeout(() => loadAvailableEmployees(), 1000);

        } else {
            // Грешка от сървъра
            console.error('❌ Registration failed:', result.message);
            showError(result.message || 'Грешка при създаване на потребителя');
        }

    } catch (error) {
        console.error('❌ Registration error:', error);
        showError('Възникна грешка при свързване със сървъра');
    } finally {
        setRegistrationLoading(false);
    }
}

/**
 * СЪБИРА ДАННИТЕ ОТ ФОРМАТА
 */
function collectFormData() {
    return {
        employeeId: document.getElementById('employeeSelect').value,
        username: document.getElementById('username').value.trim(),
        password: document.getElementById('password').value,
        confirmPassword: document.getElementById('confirmPassword').value,
        role: document.querySelector('input[name="role"]:checked').value
    };
}

/**
 * ВАЛИДИРА ВСИЧКИ ДАННИ ОТ ФОРМАТА
 */
function validateFormData(data) {
    const errors = [];

    // Проверка на служител
    if (!data.employeeId) {
        errors.push('Моля изберете служител');
    }

    // Проверка на потребителско име
    if (!data.username || data.username.length < 3) {
        errors.push('Потребителското име трябва да е поне 3 символа');
    }

    // Проверка на парола
    if (!data.password || data.password.length < 4) {
        errors.push('Паролата трябва да е поне 4 символа');
    }

    // Проверка на потвърждение на парола
    if (data.password !== data.confirmPassword) {
        errors.push('Паролите не съвпадат');
    }

    // Проверка на роля
    if (!data.role) {
        errors.push('Моля изберете роля');
    }

    if (errors.length > 0) {
        showError(errors.join('<br>'));
        return false;
    }

    return true;
}

/**
 * ВАЛИДИРА ПОТРЕБИТЕЛСКОТО ИМЕ В РЕАЛНО ВРЕМЕ
 */
async function validateUsername() {
    const usernameInput = document.getElementById('username');
    const username = usernameInput.value.trim();

    if (username.length < 3) {
        usernameInput.classList.add('invalid');
        return false;
    }

    try {
        // Проверяваме дали името е заето
        const response = await fetch(`/api/auth/check-username?username=${encodeURIComponent(username)}`);
        const result = await response.json();

        if (result.exists) {
            usernameInput.classList.add('invalid');
            usernameInput.classList.remove('valid');
            showError('Това потребителско име е заето');
            return false;
        } else {
            usernameInput.classList.add('valid');
            usernameInput.classList.remove('invalid');
            hideError();
            return true;
        }
    } catch (error) {
        console.error('Error checking username:', error);
        return true; // Не блокираме при мрежова грешка
    }
}

/**
 * ВАЛИДИРА СИЛАТА НА ПАРОЛАТА
 */
function validatePasswordStrength() {
    const passwordInput = document.getElementById('password');
    const password = passwordInput.value;

    if (password.length < 4) {
        passwordInput.classList.add('invalid');
        passwordInput.classList.remove('valid');
        return false;
    } else {
        passwordInput.classList.add('valid');
        passwordInput.classList.remove('invalid');
        return true;
    }
}

/**
 * ПРОВЕРЯВА ДАЛИ ПАРОЛИТЕ СЪВПАДАТ
 */
function validatePasswordMatch() {
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (confirmPassword.length === 0) {
        confirmPasswordInput.classList.remove('valid', 'invalid');
        return true;
    }

    if (password === confirmPassword) {
        confirmPasswordInput.classList.add('valid');
        confirmPasswordInput.classList.remove('invalid');
        return true;
    } else {
        confirmPasswordInput.classList.add('invalid');
        confirmPasswordInput.classList.remove('valid');
        return false;
    }
}

/**
 * ПОКАЗВАНЕ/СКРИВАНЕ НА ПАРОЛА
 */
function togglePasswordVisibility(input, toggle) {
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    toggle.textContent = isPassword ? '🙈' : '👁️';
    toggle.title = isPassword ? 'Скрий парола' : 'Покажи парола';
}

/**
 * ИЗЧИСТВА ФОРМАТА СЛЕД УСПЕШНА РЕГИСТРАЦИЯ
 */
function clearForm() {
    document.getElementById('registrationForm').reset();
    document.getElementById('employeeSelect').selectedIndex = 0;
    document.getElementById('roleUser').checked = true;

    // Премахваме всички validation класове
    document.querySelectorAll('.form-input, .form-select').forEach(input => {
        input.classList.remove('valid', invalid');
    });
}

/**
 * УПРАВЛЕНИЕ НА LOADING СЪСТОЯНИЕТО
 */
function setRegistrationLoading(isLoading) {
    const registerBtn = document.getElementById('registerBtn');
    const form = document.getElementById('registrationForm');

    if (isLoading) {
        registerBtn.classList.add('loading');
        registerBtn.disabled = true;
        registerBtn.textContent = 'Създаване...';

        // Деактивираме всички полета
        form.querySelectorAll('input, select').forEach(input => {
            input.disabled = true;
        });
    } else {
        registerBtn.classList.remove('loading');
        registerBtn.disabled = false;
        registerBtn.textContent = 'Създай потребител';

        // Активираме всички полета
        form.querySelectorAll('input, select').forEach(input => {
            input.disabled = false;
        });
    }
}

/**
 * ПОКАЗВАНЕ НА ГРЕШКА
 */
function showError(message) {
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');

    errorText.innerHTML = message;
    errorMessage.classList.add('show');

    // Скриваме success съобщението ако е показано
    hideSuccess();
}

/**
 * СКРИВАНЕ НА ГРЕШКА
 */
function hideError() {
    const errorMessage = document.getElementById('error-message');
    errorMessage.classList.remove('show');
}

/**
 * ПОКАЗВАНЕ НА SUCCESS СЪОБЩЕНИЕ
 */
function showSuccess(message) {
    const successMessage = document.getElementById('success-message');
    const successText = document.getElementById('success-text');

    successText.textContent = message;
    successMessage.classList.add('show');

    // Скриваме error съобщението ако е показано
    hideError();
}

/**
 * СКРИВАНЕ НА SUCCESS СЪОБЩЕНИЕ
 */
function hideSuccess() {
    const successMessage = document.getElementById('success-message');
    successMessage.classList.remove('show');
}