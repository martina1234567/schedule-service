// ===============================
// JAVASCRIPT ФУНКЦИОНАЛНОСТ ЗА РЕГИСТРАЦИЯ - ПОПРАВЕНО
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

    // Проверяваме дали елементите съществуват
    if (!employeeSelect) {
        console.error('❌ Employee select element not found!');
        return;
    }

    // Зареждаме служителите
    loadAvailableEmployees();

    // Event listeners
    setupRegistrationEventListeners();

    // ПРЕМАХНАТО: initializeSelectFloatingLabels();
    // Вместо това, само инициализираме обикновени input floating labels
    initializeInputFloatingLabels();

    console.log('✅ Registration page initialized');
}

/**
 * НОВА ФУНКЦИЯ: Инициализира floating labels САМО за input полетата
 * Select полето (Employee) има статичен label
 */
function initializeInputFloatingLabels() {
    // Вземаме САМО input елементите, НЕ select елементите
    const inputElements = document.querySelectorAll('input.form-input');

    inputElements.forEach(input => {
        const label = document.querySelector(`label[for='${input.id}']`);

        if (label) {
            updateInputLabelPosition(input, label);

            input.addEventListener('input', () => updateInputLabelPosition(input, label));
            input.addEventListener('focus', () => updateInputLabelPosition(input, label));
            input.addEventListener('blur', () => updateInputLabelPosition(input, label));
        }
    });

    console.log('📝 Floating labels initialized for input fields only');
}

/**
 * НОВА ФУНКЦИЯ: Обновява позицията на label само за input полета
 */
function updateInputLabelPosition(input, label) {
    if (input.value && input.value.trim() !== '') {
        label.classList.add('active');
    } else {
        label.classList.remove('active');
    }
}


/**
 * ПОПРАВЕНА ФУНКЦИЯ ЗА ЗАРЕЖДАНЕ НА СЛУЖИТЕЛИ БЕЗ АКАУНТИ
 * Използва правилния URL и обработва грешките правилно
 */
async function loadAvailableEmployees() {
    const employeeSelect = document.getElementById('employeeSelect');

    if (!employeeSelect) {
        console.error('❌ Employee select element not found');
        return;
    }

    try {
        console.log('📡 Loading available employees from backend...');

        // Показваме loading състояние
        employeeSelect.disabled = true;
        employeeSelect.innerHTML = '<option value="" disabled selected>Зареждане служители...</option>';

        // ПРЕМАХНАТО: Манипулации на label позиция
        // Label-ът остава винаги статичен

        const response = await fetch('/api/auth/available-employees', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'same-origin'
        });

        console.log('📊 Response status:', response.status);

        if (!response.ok) {
            let errorMessage;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || `HTTP ${response.status}: ${response.statusText}`;
            } catch (jsonError) {
                errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            }
            throw new Error(errorMessage);
        }

        // ПОПРАВКА: Правилно извличаме данните от response
        const responseData = await response.json();
        console.log('✅ Loaded response data:', responseData);

        // КРИТИЧНА ПОПРАВКА: Backend връща структуриран отговор
        let employees;

        if (Array.isArray(responseData)) {
            // Ако response е директно масив (стар формат)
            employees = responseData;
        } else if (responseData.employees && Array.isArray(responseData.employees)) {
            // Ако response е обект с employees масив (нов формат)
            employees = responseData.employees;
        } else {
            // Неочакван формат на response
            console.error('❌ Unexpected response format:', responseData);
            throw new Error('Неочакван формат на отговора от сървъра');
        }

        console.log('✅ Extracted employees array:', employees);

        // Попълваме dropdown-а със служителите
        employeeSelect.innerHTML = '<option value="" disabled selected>Избери служител</option>';

        if (!employees || employees.length === 0) {
            employeeSelect.innerHTML = '<option value="" disabled>Няма служители без акаунти</option>';
            employeeSelect.disabled = true;
            console.log('⚠️ No employees without accounts found');
        } else {
            employees.forEach(employee => {
                const option = document.createElement('option');
                option.value = employee.id;
                // Проверяваме дали има position преди да я използваме
                const positionText = employee.position ? ` - ${employee.position}` : '';
                option.textContent = `${employee.name} ${employee.lastname}${positionText}`;
                employeeSelect.appendChild(option);
            });

            employeeSelect.disabled = false;
            console.log(`✅ Successfully loaded ${employees.length} employees without accounts`);
        }

        // ПРЕМАХНАТО: updateLabelPosition(employeeSelect, label);
        // Label-ът остава винаги статичен

    } catch (error) {
        console.error('❌ Error loading employees:', error);

        // Показваме грешка в dropdown
        employeeSelect.innerHTML = '<option value="" disabled>Грешка при зареждане</option>';
        employeeSelect.disabled = true;

        // Показваме детайлна грешка в зависимост от типа
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            showError('Не може да се свърже със сървъра. Моля проверете дали Spring Boot работи на порт 8080');
            console.error('💡 Решение: Стартирайте Spring Boot приложението или проверете CORS настройките');
        } else if (error.message.includes('404')) {
            showError('Endpoint не е намерен. Проверете дали /api/auth/available-employees съществува');
        } else if (error.message.includes('500')) {
            showError('Сървърна грешка. Проверете логовете на Spring Boot приложението');
        } else {
            showError(`Грешка при зареждане на служителите: ${error.message}`);
        }
    }
}



/**
 * АЛТЕРНАТИВЕН МЕТОД ЗА ЗАРЕЖДАНЕ СЪС ПЪЛЕН URL
 * Използвайте този метод ако frontend и backend са на различни портове
 */
async function loadAvailableEmployeesWithFullURL() {
    const employeeSelect = document.getElementById('employeeSelect');

    if (!employeeSelect) {
        console.error('❌ Employee select element not found');
        return;
    }

    try {
        console.log('📡 Loading available employees with full URL...');

        employeeSelect.disabled = true;
        employeeSelect.innerHTML = '<option value="" disabled selected>Зареждане служители...</option>';

        // Използваме пълния URL за cross-origin заявки
        const response = await fetch('http://localhost:8080/api/auth/available-employees', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            // За cross-origin заявки
            mode: 'cors'
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // ПОПРАВКА: Същата логика за извличане на employees
        const responseData = await response.json();
        console.log('✅ Loaded response data:', responseData);

        let employees;
        if (Array.isArray(responseData)) {
            employees = responseData;
        } else if (responseData.employees && Array.isArray(responseData.employees)) {
            employees = responseData.employees;
        } else {
            throw new Error('Неочакван формат на отговора от сървъра');
        }

        // Същата логика за попълване на dropdown-а
        employeeSelect.innerHTML = '<option value="" disabled selected>Избери служител</option>';

        if (!employees || employees.length === 0) {
            employeeSelect.innerHTML = '<option value="" disabled>Няма служители без акаунти</option>';
            employeeSelect.disabled = true;
        } else {
            employees.forEach(employee => {
                const option = document.createElement('option');
                option.value = employee.id;
                const positionText = employee.position ? ` - ${employee.position}` : '';
                option.textContent = `${employee.name} ${employee.lastname}${positionText}`;
                employeeSelect.appendChild(option);
            });
            employeeSelect.disabled = false;
        }

    } catch (error) {
        console.error('❌ Error loading employees with full URL:', error);
        employeeSelect.innerHTML = '<option value="" disabled>Грешка при зареждане</option>';
        employeeSelect.disabled = true;
        showError(`Грешка: ${error.message}`);
    }
}
/**
 * ФУНКЦИЯ ЗА ПРОВЕРКА НА ПОТРЕБИТЕЛСКО ИМЕ
 */
async function validateUsername() {
    const usernameInput = document.getElementById('username');
    const username = usernameInput.value.trim();

    if (username.length < 3) {
        usernameInput.classList.add('invalid');
        usernameInput.classList.remove('valid');
        return false;
    }

    try {
        // Използваме относителен URL
        const response = await fetch(`/api/auth/check-username?username=${encodeURIComponent(username)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const result = await response.json();

            if (result.exists) {
                usernameInput.classList.add('invalid');
                usernameInput.classList.remove('valid');
                showError('Това потребителско име вече се използва');
                return false;
            } else {
                usernameInput.classList.add('valid');
                usernameInput.classList.remove('invalid');
                return true;
            }
        } else {
            console.warn('Username validation failed:', response.status);
            return true; // Позволяваме да продължи ако проверката не работи
        }
    } catch (error) {
        console.error('Username validation error:', error);
        return true; // Позволяваме да продължи ако има грешка
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

    if (!form) return;

    // Form submit
    form.addEventListener('submit', handleRegistration);

    // Password toggles
    if (passwordToggle) {
        passwordToggle.addEventListener('click', () => {
            togglePasswordVisibility(passwordInput, passwordToggle);
        });
    }

    if (confirmPasswordToggle) {
        confirmPasswordToggle.addEventListener('click', () => {
            togglePasswordVisibility(confirmPasswordInput, confirmPasswordToggle);
        });
    }

    // Real-time валидация
    if (usernameInput) {
        usernameInput.addEventListener('blur', () => validateUsername());
    }
    if (passwordInput) {
        passwordInput.addEventListener('input', () => validatePasswordStrength());
    }
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', () => validatePasswordMatch());
    }

    // Скриване на съобщения при typing
    [usernameInput, passwordInput, confirmPasswordInput].forEach(input => {
        if (input) {
            input.addEventListener('input', () => {
                hideError();
                hideSuccess();
            });
        }
    });

    // Промяна в employee select
    if (employeeSelect) {
        employeeSelect.addEventListener('change', () => {
            hideError();
            hideSuccess();
        });
    }
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
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                username: formData.username,
                password: formData.password,
                confirmPassword: formData.confirmPassword,
                employeeId: parseInt(formData.employeeId),
                role: formData.role || 'EMPLOYEE'
            })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            // Успешна регистрация
            console.log('✅ Registration successful:', result.user?.username);
            showSuccess(`Потребителят "${result.user?.username}" е създаден успешно!`);

            // Изчистваме формата
            clearForm();

            // Презареждаме списъка със служители след 1 секунда
            setTimeout(() => loadAvailableEmployees(), 1000);

        } else {
            // Грешка от сървъра
            console.error('❌ Registration failed:', result.message);
            showError(result.message || 'Възникна грешка при регистрацията');
        }

    } catch (error) {
        console.error('❌ Registration error:', error);

        if (error.message.includes('Failed to fetch')) {
            showError('Не може да се свърже със сървъра. Моля проверете дали Spring Boot работи на порт 8080');
        } else {
            showError('Възникна грешка при свързването със сървъра');
        }
    } finally {
        setRegistrationLoading(false);
    }
}

/**
 * СЪБИРАНЕ НА ДАННИ ОТ ФОРМАТА
 */
function collectFormData() {
    const employeeSelect = document.getElementById('employeeSelect');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const roleSelect = document.getElementById('role');

    return {
        employeeId: employeeSelect?.value,
        username: usernameInput?.value?.trim(),
        password: passwordInput?.value,
        confirmPassword: confirmPasswordInput?.value,
        role: roleSelect?.value || 'EMPLOYEE'
    };
}

/**
 * ВАЛИДАЦИЯ НА ДАННИТЕ ОТ ФОРМАТА
 */
function validateFormData(formData) {
    // Проверка за избран служител
    if (!formData.employeeId) {
        showError('Моля изберете служител');
        return false;
    }

    // Проверка за потребителско име
    if (!formData.username || formData.username.length < 3) {
        showError('Потребителското име трябва да е поне 3 символа');
        return false;
    }

    // Проверка за парола
    if (!formData.password || formData.password.length < 6) {
        showError('Паролата трябва да е поне 6 символа');
        return false;
    }

    // Проверка за съвпадение на паролите
    if (formData.password !== formData.confirmPassword) {
        showError('Паролите не съвпадат');
        return false;
    }

    return true;
}

/**
 * ИЗЧИСТВАНЕ НА ФОРМАТА
 */
function clearForm() {
    const form = document.getElementById('registrationForm');
    if (form) {
        form.reset();

        // Премахваме CSS класовете за валидация
        form.querySelectorAll('.valid, .invalid').forEach(element => {
            element.classList.remove('valid', 'invalid');
        });

        // Обновяваме label позициите
        initializeSelectFloatingLabels();
    }
}

/**
 * ПОКАЗВАНЕ НА LOADING СЪСТОЯНИЕ
 */
function setRegistrationLoading(isLoading) {
    const submitBtn = document.getElementById('registerBtn');
    const form = document.getElementById('registrationForm');

    if (submitBtn) {
        submitBtn.disabled = isLoading;
        submitBtn.textContent = isLoading ? 'Създаване...' : 'Създай потребител';
    }

    if (form) {
        if (isLoading) {
            form.classList.add('loading');
        } else {
            form.classList.remove('loading');
        }
    }
}

/**
 * ВАЛИДАЦИЯ НА СИЛАТА НА ПАРОЛАТА
 */
function validatePasswordStrength() {
    const passwordInput = document.getElementById('password');
    const password = passwordInput?.value;

    if (!password) return false;

    // Основна проверка за дължина
    if (password.length >= 6) {
        passwordInput.classList.add('valid');
        passwordInput.classList.remove('invalid');
        return true;
    } else {
        passwordInput.classList.add('invalid');
        passwordInput.classList.remove('valid');
        return false;
    }
}

/**
 * ВАЛИДАЦИЯ ЗА СЪВПАДЕНИЕ НА ПАРОЛИТЕ
 */
function validatePasswordMatch() {
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    const password = passwordInput?.value;
    const confirmPassword = confirmPasswordInput?.value;

    if (!confirmPassword) return false;

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
 * ПРЕВКЛЮЧВАНЕ НА ВИДИМОСТТА НА ПАРОЛАТА
 */
function togglePasswordVisibility(input, toggle) {
    if (!input || !toggle) return;

    if (input.type === 'password') {
        input.type = 'text';
        toggle.textContent = '🙈';
        toggle.title = 'Скрий парола';
    } else {
        input.type = 'password';
        toggle.textContent = '👁️';
        toggle.title = 'Покажи парола';
    }
}

/**
 * ФУНКЦИИ ЗА ПОКАЗВАНЕ НА СЪОБЩЕНИЯ
 */
function showError(message) {
    console.error('🚨 Error:', message);

    // Намираме елемента за грешки или създаваме такъв
    let errorElement = document.getElementById('errorMessage');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.id = 'errorMessage';
        errorElement.className = 'alert alert-error';
        const form = document.getElementById('registrationForm');
        if (form) {
            form.parentNode.insertBefore(errorElement, form);
        }
    }

    errorElement.textContent = message;
    errorElement.style.display = 'block';

    // Автоматично скриване след 5 секунди
    setTimeout(hideError, 5000);
}

function showSuccess(message) {
    console.log('✅ Success:', message);

    let successElement = document.getElementById('successMessage');
    if (!successElement) {
        successElement = document.createElement('div');
        successElement.id = 'successMessage';
        successElement.className = 'alert alert-success';
        const form = document.getElementById('registrationForm');
        if (form) {
            form.parentNode.insertBefore(successElement, form);
        }
    }

    successElement.textContent = message;
    successElement.style.display = 'block';

    // Автоматично скриване след 3 секунди
    setTimeout(hideSuccess, 3000);
}

function hideError() {
    const errorElement = document.getElementById('errorMessage');
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

function hideSuccess() {
    const successElement = document.getElementById('successMessage');
    if (successElement) {
        successElement.style.display = 'none';
    }
}

/**
 * ФУНКЦИИ ЗА ДЕБЪГВАНЕ
 */
function reloadEmployees() {
    console.log('🔄 Manually reloading employees...');
    loadAvailableEmployees();
}

async function testServerConnection() {
    try {
        console.log('🔍 Testing server connection...');

        const response = await fetch('/api/auth/available-employees', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            console.log('✅ Server connection successful');
            showSuccess('Връзката със сървъра е успешна');
            return true;
        } else {
            console.log('❌ Server responded with error:', response.status);
            showError(`Грешка от сървъра: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.log('❌ Cannot connect to server:', error.message);
        showError('Не може да се свърже със сървъра. Проверете дали Spring Boot работи на порт 8080');
        return false;
    }
}

/**
 * УПРАВЛЕНИЕ НА FLOATING LABELS ЗА SELECT ЕЛЕМЕНТИ
 */
function initializeSelectFloatingLabels() {
    const selectElements = document.querySelectorAll('.form-select');

    selectElements.forEach(select => {
        const label = document.querySelector(`label[for='${select.id}']`);

        if (label) {
            updateLabelPosition(select, label);

            select.addEventListener('change', () => updateLabelPosition(select, label));
            select.addEventListener('focus', () => updateLabelPosition(select, label));
            select.addEventListener('blur', () => updateLabelPosition(select, label));
        }
    });
}

function updateLabelPosition(select, label) {
    if (select.value && select.value !== '') {
        label.classList.add('active');
    } else {
        label.classList.remove('active');
    }
}

// Добавяме функции в глобалния scope за дебъгване
window.testServerConnection = testServerConnection;
window.reloadEmployees = reloadEmployees;
window.loadAvailableEmployeesWithFullURL = loadAvailableEmployeesWithFullURL;

console.log('🔧 Registration Manager loaded successfully');
console.log('💡 Debug functions available: testServerConnection(), reloadEmployees(), loadAvailableEmployeesWithFullURL()');