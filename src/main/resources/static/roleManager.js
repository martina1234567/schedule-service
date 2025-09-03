  // ===============================
    // JAVASCRIPT ФУНКЦИОНАЛНОСТ
    // ===============================

    document.addEventListener('DOMContentLoaded', function() {
        console.log('🔐 Login page loaded');

        // Инициализиране на функционалността
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
     */
    async function handleLogin(username, password, errorMessage, errorText, loginBtn) {
        console.log('🔐 Attempting login...');

        // Скриваме предишни грешки
        hideError(errorMessage);

        // Валидация на входните данни
        if (!validateLoginData(username, password, errorMessage, errorText)) {
            return;
        }

        // Показваме loading състояние
        setLoginLoading(loginBtn, true);

        try {
            // Симулирам заявка към сървъра
            // В реалното приложение тук ще има fetch заявка към Spring Boot backend
            const response = await mockLoginRequest(username, password);

            if (response.success) {
                // Успешен логин
                console.log('✅ Login successful');
                handleLoginSuccess(response.user, response.token);
            } else {
                // Грешка при логин
                showError(errorMessage, errorText, response.message || 'Неправилно потребителско име или парола');
            }
        } catch (error) {
            console.error('❌ Login error:', error);
            showError(errorMessage, errorText, 'Възникна грешка при свързване със сървъра');
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
     * MOCK ФУНКЦИЯ ЗА ЛОГИН ЗАЯВКА - ЗА ДЕМО ЦЕЛИ
     * В реалното приложение тук ще има HTTP заявка към Spring Boot backend
     */
    async function mockLoginRequest(username, password) {
        // Симулираме мрежова заявка
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Demo потребители за тестване
        const demoUsers = {
            'admin': { password: 'admin123', role: 'admin', name: 'Администратор' },
            'manager': { password: 'manager123', role: 'user', name: 'Мениджър' },
            'user': { password: 'user123', role: 'user', name: 'Потребител' }
        };

        const user = demoUsers[username.toLowerCase()];

        if (user && user.password === password) {
            return {
                success: true,
                user: {
                    id: Math.floor(Math.random() * 1000),
                    username: username,
                    name: user.name,
                    role: user.role
                },
                token: 'demo-jwt-token-' + Date.now()
            };
        } else {
            return {
                success: false,
                message: 'Неправилно потребителско име или парола'
            };
        }
    }

    /**
     * ОБРАБОТКА НА УСПЕШЕН ЛОГИН
     */
    function handleLoginSuccess(user, token) {
        // Запазваме данните за потребителя и токена
        localStorage.setItem('authToken', token);
        localStorage.setItem('currentUser', JSON.stringify(user));

        // Показваме success съобщение
        console.log('👤 User logged in:', user);

        // Пренасочване към главната страница
        // В реалното приложение тук ще има redirect към index.html
        setTimeout(() => {
            // За демо цели показваме alert
            alert(`Добре дошли, ${user.name}! Ще бъдете пренасочени към главната страница.`);
            // window.location.href = 'index.html';
        }, 500);
    }

    /**
     * ПОКАЗВАНЕ НА ГРЕШКА
     */
    function showError(errorMessage, errorText, message) {
        errorText.textContent = message;
        errorMessage.classList.add('show');
    }

    /**
     * СКРИВАНЕ НА ГРЕШКА
     */
    function hideError(errorMessage) {
        errorMessage.classList.remove('show');
    }

    /**
     * УПРАВЛЕНИЕ НА LOADING СЪСТОЯНИЕТО НА БУТОНА
     */
    function setLoginLoading(loginBtn, isLoading) {
        if (isLoading) {
            loginBtn.classList.add('loading');
            loginBtn.disabled = true;
        } else {
            loginBtn.classList.remove('loading');
            loginBtn.disabled = false;
        }
    }