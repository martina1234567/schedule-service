/**
 * LOGOUT MANAGER MODULE
 * Управлява функционалността за изход от системата
 * Почиства сесията и пренасочва към login страницата
 */

/**
 * ГЛОБАЛНИ ПРОМЕНЛИВИ ЗА LOGOUT ФУНКЦИОНАЛНОСТТА
 */
let isLoggingOut = false; // Предотвратява множествени logout опити
let logoutTimer = null;   // За автоматичен logout при неактивност

/**
 * ГЛАВНА ФУНКЦИЯ: Инициализира logout функционалността
 * Трябва да се извика при зареждане на index.html
 */
function initializeLogoutManager() {
    console.log('🚪 Initializing Logout Manager...');

    // СТЪПКА 1: Настройваме event listeners за logout бутоните
    setupLogoutButtonHandlers();

    // СТЪПКА 2: Настройваме автоматичен logout при неактивност (опционално)
    setupInactivityLogout();

    // СТЪПКА 3: Проверяваме за валидна сесия при зареждане
    checkSessionValidity();

    // СТЪПКА 4: Настройваме keyboard shortcuts (опционално)
    setupLogoutKeyboardShortcuts();

    console.log('✅ Logout Manager initialized successfully');
}

/**
 * ФУНКЦИЯ: Настройва event listeners за всички logout бутони
 * Работи с различни селектори за максимална съвместимост
 */
function setupLogoutButtonHandlers() {
    // Всички възможни селектори за logout бутони
    const logoutSelectors = [
        '#logout-btn',
        '.logout-btn',
        'button[onclick*="logout"]',
        'button[data-action="logout"]',
        '[data-logout]',
        '.btn-logout'
    ];

    logoutSelectors.forEach(selector => {
        const buttons = document.querySelectorAll(selector);
        buttons.forEach(button => {
            // Премахваме стари event listeners за да избегнем дублиране
            button.removeEventListener('click', handleLogoutClick);

            // Добавяме новия event listener
            button.addEventListener('click', handleLogoutClick);

            console.log(`🔗 Logout handler attached to button: ${selector}`);
        });
    });

    // Ако няма намерени logout бутони, показваме предупреждение
    const totalButtons = logoutSelectors.reduce((count, selector) => {
        return count + document.querySelectorAll(selector).length;
    }, 0);

    if (totalButtons === 0) {
        console.warn('⚠️ No logout buttons found. Make sure logout button has one of these attributes:');
        console.warn('   - id="logout-btn"');
        console.warn('   - class="logout-btn"');
        console.warn('   - onclick="logout()" or similar');
        console.warn('   - data-action="logout"');
    } else {
        console.log(`✅ Found and configured ${totalButtons} logout button(s)`);
    }
}

/**
 * ФУНКЦИЯ: Обработва клика върху logout бутон
 * @param {Event} event - Click event обектът
 */
function handleLogoutClick(event) {
    // Предотвратяваме default поведението
    event.preventDefault();
    event.stopPropagation();

    console.log('🚪 Logout button clicked');

    // Ако вече се извършва logout, игнорираме клика
    if (isLoggingOut) {
        console.log('⏳ Logout already in progress, ignoring click');
        return;
    }

    // Извикваме главната logout функция
    performLogout();
}

/**
 * ГЛАВНА LOGOUT ФУНКЦИЯ: Извършва пълния процес на изход
 * Може да се извика директно от други части на приложението
 */
async function performLogout() {
    if (isLoggingOut) {
        return; // Предотвратяваме множествени logout опити
    }

    console.log('🔄 Starting logout process...');
    isLoggingOut = true;

    try {
        // СТЪПКА 1: Показваме loading индикатор
        showLogoutLoadingIndicator();

        // СТЪПКА 2: Почистваме session storage
        clearSessionData();

        // СТЪПКА 3: Почистваме local storage (опционално)
        clearLocalStorageData();

        // СТЪПКА 4: Изпращаме logout заявка към сървъра (ако е необходимо)
        await sendLogoutRequestToServer();

        // СТЪПКА 5: Почистваме всички timer-и и event listeners
        cleanup();

        // СТЪПКА 6: Показваме success съобщение
        showLogoutSuccessMessage();

        // СТЪПКА 7: Пренасочваме към login страницата
        redirectToLogin();

    } catch (error) {
        console.error('❌ Error during logout:', error);
        handleLogoutError(error);
    } finally {
        isLoggingOut = false;
    }
}

/**
 * ФУНКЦИЯ: Показва loading индикатор по време на logout
 */
function showLogoutLoadingIndicator() {
    console.log('⏳ Showing logout loading indicator...');

    // Намираме logout бутона и променяме текста му
    const logoutButtons = document.querySelectorAll('#logout-btn, .logout-btn, button[onclick*="logout"]');
    logoutButtons.forEach(button => {
        button.disabled = true;
        button.classList.add('logging-out');
        const originalText = button.textContent;
        button.setAttribute('data-original-text', originalText);
        button.innerHTML = '⏳ Logging out...';
    });

    // Създаваме overlay loading screen (опционално)
    createLogoutOverlay();
}

/**
 * ФУНКЦИЯ: Създава overlay loading екран
 */
function createLogoutOverlay() {
    // Проверяваме дали вече съществува overlay
    if (document.getElementById('logout-overlay')) {
        return;
    }

    const overlay = document.createElement('div');
    overlay.id = 'logout-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 999999;
        backdrop-filter: blur(5px);
    `;

    overlay.innerHTML = `
        <div style="
            background: white;
            padding: 30px;
            border-radius: 12px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            min-width: 250px;
        ">
            <div style="
                width: 40px;
                height: 40px;
                border: 4px solid #f3f3f3;
                border-top: 4px solid #007bff;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 20px;
            "></div>
            <h3 style="margin: 0 0 10px; color: #333;">Logging out...</h3>
            <p style="margin: 0; color: #666;">Please wait while we sign you out</p>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;

    document.body.appendChild(overlay);
}

/**
 * ФУНКЦИЯ: Почиства session storage данните
 */
function clearSessionData() {
    console.log('🗑️ Clearing session data...');

    try {
        // Почистваме всички session storage данни
        if (typeof(Storage) !== "undefined" && sessionStorage) {
            sessionStorage.clear();
            console.log('✅ Session storage cleared');
        }

        // Почистваме специфични session данни (ако знаем ключовете)
        const sessionKeys = [
            'currentUser',
            'userToken',
            'authToken',
            'sessionId',
            'userRole',
            'employeeId',
            'isLoggedIn'
        ];

        sessionKeys.forEach(key => {
            sessionStorage.removeItem(key);
        });

    } catch (error) {
        console.warn('⚠️ Could not clear session storage:', error);
    }
}

/**
 * ФУНКЦИЯ: Почиства local storage данните (опционално)
 */
function clearLocalStorageData() {
    console.log('🗑️ Clearing local storage data...');

    try {
        // Почистваме само специфични ключове, не всичко
        const localStorageKeys = [
            'rememberMe',
            'userPreferences',
            'cachedEmployeeData',
            'tempScheduleData'
        ];

        localStorageKeys.forEach(key => {
            localStorage.removeItem(key);
        });

        console.log('✅ Local storage cleaned');

    } catch (error) {
        console.warn('⚠️ Could not clear local storage:', error);
    }
}

/**
 * ФУНКЦИЯ: Изпраща logout заявка към сървъра
 */
async function sendLogoutRequestToServer() {
    console.log('📡 Sending logout request to server...');

    try {
        // Ако имате backend endpoint за logout
        const response = await fetch('/api/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Добавете authorization header ако е необходим
                // 'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
            },
            credentials: 'include' // За cookies
        });

        if (response.ok) {
            console.log('✅ Server logout successful');
        } else {
            console.warn('⚠️ Server logout returned non-OK status:', response.status);
        }

    } catch (error) {
        // Не спираме logout процеса дори ако server заявката е неуспешна
        console.warn('⚠️ Server logout request failed:', error);
        console.log('ℹ️ Continuing with client-side logout...');
    }
}

/**
 * ФУНКЦИЯ: Почиства timer-и и event listeners
 */
function cleanup() {
    console.log('🧹 Cleaning up timers and listeners...');

    // Почистваме inactivity timer
    if (logoutTimer) {
        clearTimeout(logoutTimer);
        logoutTimer = null;
    }

    // Почистваме всички интервали (ако има такива)
    // Забележка: Това е агресивен подход, използвайте внимателно
    // for (let i = 1; i < 99999; i++) window.clearInterval(i);
}

/**
 * ФУНКЦИЯ: Показва success съобщение
 */
function showLogoutSuccessMessage() {
    console.log('✅ Showing logout success message...');

    // Можем да променим overlay-я или да създадем ново съобщение
    const overlay = document.getElementById('logout-overlay');
    if (overlay) {
        overlay.innerHTML = `
            <div style="
                background: white;
                padding: 30px;
                border-radius: 12px;
                text-align: center;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                min-width: 250px;
            ">
                <div style="
                    width: 50px;
                    height: 50px;
                    background: #28a745;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 20px;
                    color: white;
                    font-size: 20px;
                ">✓</div>
                <h3 style="margin: 0 0 10px; color: #333;">Logged out successfully!</h3>
                <p style="margin: 0; color: #666;">Redirecting to login page...</p>
            </div>
        `;
    }
}

/**
 * ФУНКЦИЯ: Пренасочва към login страницата
 */
function redirectToLogin() {
    console.log('🔄 Redirecting to login page...');

    // Добавяме кратко забавяне за да се види success съобщението
    setTimeout(() => {
        // Различни начини за пренасочване
        try {
            // Метод 1: Използване на window.location.href (препоръчително)
            window.location.href = 'login.html';

            // Метод 2: Алтернативно - window.location.replace (не позволява back button)
            // window.location.replace('login.html');

            // Метод 3: Ако сте в SPA (Single Page Application)
            // history.pushState(null, null, 'login.html');

        } catch (error) {
            console.error('❌ Error redirecting to login:', error);
            // Fallback опция
            document.location = 'login.html';
        }
    }, 1500); // 1.5 секунди забавяне
}

/**
 * ФУНКЦИЯ: Обработва грешки по време на logout
 */
function handleLogoutError(error) {
    console.error('❌ Logout error handler called:', error);

    // Показваме error съобщение на потребителя
    const overlay = document.getElementById('logout-overlay');
    if (overlay) {
        overlay.innerHTML = `
            <div style="
                background: white;
                padding: 30px;
                border-radius: 12px;
                text-align: center;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                min-width: 250px;
            ">
                <div style="
                    width: 50px;
                    height: 50px;
                    background: #dc3545;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 20px;
                    color: white;
                    font-size: 20px;
                ">!</div>
                <h3 style="margin: 0 0 10px; color: #333;">Logout Error</h3>
                <p style="margin: 0 0 20px; color: #666;">There was an issue logging out. Redirecting anyway...</p>
                <button onclick="forceLogout()" style="
                    background: #007bff;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                ">Continue to Login</button>
            </div>
        `;
    }

    // Въпреки грешката, пренасочваме към login след 3 секунди
    setTimeout(() => {
        redirectToLogin();
    }, 3000);
}

/**
 * ФУНКЦИЯ: Принудителен logout (fallback опция)
 */
function forceLogout() {
    console.log('🚨 Force logout initiated...');

    // Почистваме всичко възможно
    try {
        sessionStorage.clear();
        localStorage.clear();
    } catch (e) {
        console.warn('Could not clear storage:', e);
    }

    // Принудително пренасочване
    window.location.replace('login.html');
}

/**
 * ФУНКЦИЯ: Настройва автоматичен logout при неактивност (опционално)
 */
function setupInactivityLogout() {
    const INACTIVITY_TIME = 30 * 60 * 1000; // 30 минути в милисекунди

    let inactivityTimer;

    // Функция за reset на timer-а
    function resetInactivityTimer() {
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => {
            console.log('⏰ Auto logout due to inactivity');
            alert('Your session has expired due to inactivity. You will be logged out.');
            performLogout();
        }, INACTIVITY_TIME);
    }

    // Events които reset-ват timer-а
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    activityEvents.forEach(event => {
        document.addEventListener(event, resetInactivityTimer, true);
    });

    // Стартираме timer-а
    resetInactivityTimer();

    console.log(`⏰ Inactivity logout set to ${INACTIVITY_TIME / 60000} minutes`);
}

/**
 * ФУНКЦИЯ: Проверява валидността на сесията при зареждане
 */
function checkSessionValidity() {
    // Проверяваме дали потребителят е логнат
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const userToken = sessionStorage.getItem('userToken') || sessionStorage.getItem('authToken');

    if (!isLoggedIn && !userToken) {
        console.log('ℹ️ No valid session found, user should login');
        // Опционално: Пренасочване към login ако няма валидна сесия
        // redirectToLogin();
    } else {
        console.log('✅ Valid session found');
    }
}

/**
 * ФУНКЦИЯ: Настройва keyboard shortcuts за logout (опционално)
 */
function setupLogoutKeyboardShortcuts() {
    document.addEventListener('keydown', function(event) {
        // Ctrl+Shift+L за logout
        if (event.ctrlKey && event.shiftKey && event.key === 'L') {
            event.preventDefault();
            console.log('⌨️ Logout triggered by keyboard shortcut');

            if (confirm('Are you sure you want to log out?')) {
                performLogout();
            }
        }
    });

    console.log('⌨️ Logout keyboard shortcut enabled: Ctrl+Shift+L');
}

/**
 * ПУБЛИЧНИ ФУНКЦИИ ЗА ВЪНШНА УПОТРЕБА
 */

// Директна logout функция за извикване от HTML onclick
function logout() {
    performLogout();
}

// Logout с потвърждение
function logoutWithConfirmation() {
    if (confirm('Are you sure you want to log out?')) {
        performLogout();
    }
}

// Бърз logout без въпроси
function quickLogout() {
    performLogout();
}

/**
 * ЕКСПОРТ НА ФУНКЦИИТЕ (ако използвате ES6 modules)
 */
// export { initializeLogoutManager, performLogout, logout, logoutWithConfirmation, quickLogout };

/**
 * AUTO-ИНИЦИАЛИЗАЦИЯ ПРИ ЗАРЕЖДАНЕ (опционално)
 * Uncomment следващите редове ако искате автоматична инициализация
 */
/*
document.addEventListener('DOMContentLoaded', function() {
    initializeLogoutManager();
});
*/