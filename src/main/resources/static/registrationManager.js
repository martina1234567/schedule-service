 /**
     * REGISTRATION FORM MANAGEMENT
     * Управлява валидацията и изпращането на регистрационната форма
     */
    
    // ===============================
    // ГЛОБАЛНИ ПРОМЕНЛИВИ
    // ===============================
    
    let availableEmployees = []; // Списък със служители без акаунти
    let isFormSubmitting = false; // Флаг за предотвратяване на множествено изпращане
    
    // ===============================
    // INITIALIZATION
    // ===============================
    
    /**
     * Инициализация на страницата при зареждане
     */
    document.addEventListener('DOMContentLoaded', function() {
        console.log('🚀 Registration page loaded');
        
        // Зареждане на служителите
        loadAvailableEmployees();
        
        // Настройка на event listeners
        setupEventListeners();
        
        // Настройка на валидация в реално време
        setupRealTimeValidation();
    });
    
    // ===============================
    // EMPLOYEE LOADING
    // ===============================
    
    /**
     * Зарежда списък със служители без потребителски акаунти
     */
    async function loadAvailableEmployees() {
        try {
            console.log('📋 Loading available employees...');
            
            const response = await fetch('/api/auth/available-employees');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('📋 Available employees data:', data);
            
            // Проверяваме дали имаме списък със служители
            availableEmployees = data.employees || data || [];
            
            populateEmployeeSelect();
            
        } catch (error) {
            console.error('❌ Error loading employees:', error);
            showError('Грешка при зареждане на служителите: ' + error.message);
        }
    }
    
    /**
     * Попълва select элемента със служители
     */
    function populateEmployeeSelect() {
        const select = document.getElementById('employeeSelect');
        
        // Изчистваме съществуващите опции (освен първата)
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }
        
        if (availableEmployees.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Няма налични служители';
            option.disabled = true;
            select.appendChild(option);
            
            showError('Всички служители вече имат потребителски акаунти');
            return;
        }
        
        // Добавяме опциите за служителите
        availableEmployees.forEach(employee => {
            const option = document.createElement('option');
            option.value = employee.id;
            option.textContent = `${employee.name} ${employee.lastname}`;
            select.appendChild(option);
        });
        
        console.log(`✅ Loaded ${availableEmployees.length} available employees`);
    }
    
    // ===============================
    // EVENT LISTENERS SETUP
    // ===============================
    
    /**
     * Настройва всички event listeners
     */
    function setupEventListeners() {
        // Form submission
        document.getElementById('registrationForm').addEventListener('submit', handleFormSubmit);
        
        // Password toggles
        document.getElementById('passwordToggle').addEventListener('click', () => togglePasswordVisibility('password'));
        document.getElementById('confirmPasswordToggle').addEventListener('click', () => togglePasswordVisibility('confirmPassword'));
        
        // Real-time validation
        document.getElementById('username').addEventListener('input', validateUsername);
        document.getElementById('password').addEventListener('input', validatePassword);
        document.getElementById('confirmPassword').addEventListener('input', validateConfirmPassword);
    }
    
    /**
     * Настройва валидация в реално време
     */
    function setupRealTimeValidation() {
        // Username валидация при всяка промяна
        const usernameField = document.getElementById('username');
        usernameField.addEventListener('blur', validateUsername);
        usernameField.addEventListener('input', debounce(validateUsername, 500));
        
        // Password match валидация
        const confirmPasswordField = document.getElementById('confirmPassword');
        confirmPasswordField.addEventListener('input', validateConfirmPassword);
        confirmPasswordField.addEventListener('blur', validateConfirmPassword);
    }
    
    // ===============================
    // VALIDATION FUNCTIONS
    // ===============================
    
    /**
     * Валидира потребителското име
     * Изисквания: поне 7 символа, поне една главна буква, поне един специален знак
     */
    function validateUsername() {
        const username = document.getElementById('username').value.trim();
        const errorElement = document.getElementById('username-error');
        
        if (!username) {
            showFieldError('username', 'Потребителското име е задължително');
            return false;
        }
        
        if (username.length < 7) {
            showFieldError('username', 'Потребителското име трябва да съдържа поне 7 символа');
            return false;
        }
        
        if (username.length > 50) {
            showFieldError('username', 'Потребителското име не може да бъде по-дълго от 50 символа');
            return false;
        }
        
        // Проверка за поне една главна буква
        if (!/[A-Z]/.test(username)) {
            showFieldError('username', 'Потребителското име трябва да съдържа поне една главна буква');
            return false;
        }
        
        // Проверка за поне един специален знак
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(username)) {
            showFieldError('username', 'Потребителското име трябва да съдържа поне един специален знак');
            return false;
        }
        
        hideFieldError('username');
        return true;
    }
    
    /**
     * Валидира паролата
     */
    function validatePassword() {
        const password = document.getElementById('password').value;
        
        if (!password) {
            showFieldError('password', 'Паролата е задължителна');
            return false;
        }
        
        if (password.length < 8) {
            showFieldError('password', 'Паролата трябва да съдържа поне 8 символа');
            return false;
        }
        
        if (password.length > 50) {
            showFieldError('password', 'Паролата не може да бъде по-дълга от 50 символа');
            return false;
        }
        
        hideFieldError('password');
        
        // Ако confirm password е попълнено, валидираме съвпадението
        const confirmPassword = document.getElementById('confirmPassword').value;
        if (confirmPassword) {
            validateConfirmPassword();
        }
        
        return true;
    }
    
    /**
     * Валидира потвърждението на паролата
     */
    function validateConfirmPassword() {
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (!confirmPassword) {
            showFieldError('confirmPassword', 'Потвърждението на паролата е задължително');
            return false;
        }
        
        if (password !== confirmPassword) {
            showFieldError('confirmPassword', 'Паролите не съвпадат');
            return false;
        }
        
        hideFieldError('confirmPassword');
        return true;
    }
    
    /**
     * Валидира целия формуляр
     */
    function validateForm() {
        let isValid = true;
        
        // Проверка на избраният служител
        const employeeId = document.getElementById('employeeSelect').value;
        if (!employeeId) {
            showFieldError('employeeSelect', 'Моля изберете служител');
            isValid = false;
        } else {
            hideFieldError('employeeSelect');
        }
        
        // Проверка на ролята
        const role = document.getElementById('roleSelect').value;
        if (!role) {
            showFieldError('roleSelect', 'Моля изберете роля');
            isValid = false;
        } else {
            hideFieldError('roleSelect');
        }
        
        // Валидация на отделните полета
        if (!validateUsername()) isValid = false;
        if (!validatePassword()) isValid = false;
        if (!validateConfirmPassword()) isValid = false;
        
        return isValid;
    }
    
    // ===============================
    // FORM SUBMISSION
    // ===============================
    
    /**
     * Обработва изпращането на формуляра
     */
    async function handleFormSubmit(event) {
        event.preventDefault();
        
        if (isFormSubmitting) {
            console.log('⏳ Form already submitting, ignoring...');
            return;
        }
        
        console.log('📝 Processing registration form...');
        
        // Валидация на формуляра
        if (!validateForm()) {
            console.log('❌ Form validation failed');
            return;
        }
        
        try {
            isFormSubmitting = true;
            setLoadingState(true);
            hideMessages();
            
            // Събиране на данните от формуляра
            const formData = {
                username: document.getElementById('username').value.trim(),
                password: document.getElementById('password').value,
                confirmPassword: document.getElementById('confirmPassword').value,
                employeeId: parseInt(document.getElementById('employeeSelect').value),
                role: document.getElementById('roleSelect').value
            };
            
            console.log('📤 Sending registration data:', {
                ...formData,
                password: '[HIDDEN]',
                confirmPassword: '[HIDDEN]'
            });
            
            // Изпращане на заявката
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            
            const responseData = await response.json();
            
            if (response.ok && responseData.success) {
                console.log('✅ Registration successful:', responseData);
                showSuccess('Потребителят е създаден успешно! Пренасочване към логин...');
                
                // Пренасочване към login след кратко забавяне
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
                
            } else {
                console.error('❌ Registration failed:', responseData);
                const errorMessage = responseData.message || responseData.error || 'Възникна грешка при създаването на акаунта';
                showError(errorMessage);
            }
            
        } catch (error) {
            console.error('❌ Registration error:', error);
            showError('Възникна неочаквана грешка: ' + error.message);
        } finally {
            isFormSubmitting = false;
            setLoadingState(false);
        }
    }
    
    // ===============================
    // UI HELPER FUNCTIONS
    // ===============================
    
    /**
     * Превключва видимостта на парола
     */
    function togglePasswordVisibility(fieldId) {
        const field = document.getElementById(fieldId);
        const isPassword = field.type === 'password';
        
        field.type = isPassword ? 'text' : 'password';
        
        // Намиране на съответния toggle бутон
        const toggleBtn = fieldId === 'password' ? 
            document.getElementById('passwordToggle') : 
            document.getElementById('confirmPasswordToggle');
        
        toggleBtn.textContent = isPassword ? '🙈' : '👁️';
    }
    
    /**
     * Показва грешка за специфично поле
     */
    function showFieldError(fieldId, message) {
        const errorElement = document.getElementById(fieldId + '-error');
        const fieldElement = document.getElementById(fieldId);
        
        if (errorElement && fieldElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            fieldElement.classList.add('error');
        }
    }
    
    /**
     * Скрива грешката за специфично поле
     */
    function hideFieldError(fieldId) {
        const errorElement = document.getElementById(fieldId + '-error');
        const fieldElement = document.getElementById(fieldId);
        
        if (errorElement && fieldElement) {
            errorElement.style.display = 'none';
            fieldElement.classList.remove('error');
        }
    }
    
    /**
     * Показва общо error съобщение
     */
    function showError(message) {
        const errorDiv = document.getElementById('error-message');
        const errorText = document.getElementById('error-text');
        
        errorText.textContent = message;
        errorDiv.style.display = 'block';
        
        // Скрий success съобщението ако е показано
        document.getElementById('success-message').style.display = 'none';
        
        // Scroll към top
        errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    /**
     * Показва success съобщение
     */
    function showSuccess(message) {
        const successDiv = document.getElementById('success-message');
        const successText = document.getElementById('success-text');
        
        successText.textContent = message;
        successDiv.style.display = 'block';
        
        // Скрий error съобщението ако е показано
        document.getElementById('error-message').style.display = 'none';
        
        // Scroll към top
        successDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    /**
     * Скрива всички съобщения
     */
    function hideMessages() {
        document.getElementById('error-message').style.display = 'none';
        document.getElementById('success-message').style.display = 'none';
    }
    
    /**
     * Задава loading състояние на формуляра
     */
    function setLoadingState(isLoading) {
        const registerBtn = document.getElementById('registerBtn');
        const btnText = registerBtn.querySelector('.btn-text');
        const btnLoading = registerBtn.querySelector('.btn-loading');
        
        if (isLoading) {
            registerBtn.disabled = true;
            btnText.style.display = 'none';
            btnLoading.style.display = 'inline';
        } else {
            registerBtn.disabled = false;
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
        }
    }
    
    // ===============================
    // UTILITY FUNCTIONS
    // ===============================
    
    /**
     * Debounce функция за ограничаване на честотата на извикване
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    /**
     * БУТОНИ "НАЗАД" И "ОТКАЗ" ЗА REGISTRATION ФОРМА
     */
    document.addEventListener('DOMContentLoaded', function() {
        console.log('🔧 Setting up navigation buttons...');

        // Намираме бутоните
        const cancelBtn = document.getElementById('cancelBtn');


        // Бутон "Отказ" под формата
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function(event) {
                event.preventDefault();
                console.log('❌ Cancel button clicked');
                handleBackNavigation();
            });
        }

        console.log('✅ Navigation buttons configured');
    });

    /**
     * Обработва навигацията назад към главната страница
     */
    function handleBackNavigation() {
        // Проверяваме дали формата е била модифицирана
        const form = document.getElementById('registrationForm');
        const hasChanges = checkFormChanges(form);

        if (hasChanges) {
            // Питаме потребителя дали е сигурен
            const confirmed = confirm(
                'Имате незапазени промени. Сигурни ли сте, че искате да се върнете назад?'
            );

            if (!confirmed) {
                console.log('🚫 User cancelled back navigation');
                return;
            }
        }

        // Показваме loading състояние
        showBackLoading();

        // Редиректваме
        setTimeout(() => {
            console.log('🔄 Redirecting back to index.html');
            window.location.href = 'http://localhost:8080/index.html';
        }, 500);
    }

    /**
     * Проверява дали формата има промени
     */
    function checkFormChanges(form) {
        const inputs = form.querySelectorAll('input, select');

        for (let input of inputs) {
            if (input.type !== 'hidden' && input.value.trim() !== '') {
                return true;
            }
        }

        return false;
    }

    /**
     * Показва loading състояние на бутоните
     */
    function showBackLoading() {
        const backBtn = document.getElementById('backBtn');
        const cancelBtn = document.getElementById('cancelBtn');

        if (backBtn) {
            backBtn.innerHTML = `
                <span class="back-icon">⏳</span>
                <span class="back-text">Зарежда...</span>
            `;
            backBtn.disabled = true;
            backBtn.style.opacity = '0.7';
        }

        if (cancelBtn) {
            cancelBtn.innerHTML = `
                <span class="cancel-icon">⏳</span>
                <span class="cancel-text">Зарежда...</span>
            `;
            cancelBtn.disabled = true;
            cancelBtn.style.opacity = '0.7';
        }
    }
