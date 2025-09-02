/**
 * Main Application Controller
 * Coordinates all modules and initializes the application
 * This is the main entry point that brings together all other modules
 */

/**
 * Application initialization
 * Called when the DOM is fully loaded
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Starting Employee Schedule Application...');

    // Initialize all application modules in the correct order
    initializeApplication();

    console.log('✅ Application initialized successfully');
});

/**
 * Main application initialization function
 * Coordinates the startup of all modules
 */
async function initializeApplication() {
    try {
        console.log('🔧 Starting application initialization...');

        // СТЪПКА 1: Initialize UI Manager first
        console.log('📱 Initializing UI Manager...');
        if (typeof initializeUIManager === 'function') {
            try {
                initializeUIManager();
            } catch (error) {
                console.error('Error in UI Manager:', error);
            }
        } else {
            console.warn('⚠️ initializeUIManager function not available yet');
        }

        // СТЪПКА 2: НОВО - Initialize Hourly Rate Manager
        console.log('💰 Initializing Hourly Rate Manager...');
        if (typeof initializeHourlyRateManager === 'function') {
            await initializeHourlyRateManager();
        } else {
            console.warn('⚠️ initializeHourlyRateManager function not available yet');
        }

        // СТЪПКА 3: Initialize Employee Manager (зависи от hourly rates)
        console.log('👥 Initializing Employee Manager...');
        if (typeof initializeEmployeeManager === 'function') {
            await initializeEmployeeManager();
        } else {
            console.warn('⚠️ initializeEmployeeManager function not available yet');
        }

        // СТЪПКА 4: Initialize Calendar
        console.log('📅 Initializing Calendar...');
        if (typeof initializeCalendar === 'function') {
            initializeCalendar();
        } else {
            console.warn('⚠️ initializeCalendar function not available yet');
        }

        // СТЪПКА 5: Initialize Weekly Schedule Manager
        console.log('📊 Initializing Weekly Schedule Manager...');
        if (typeof initializeWeeklyScheduleManager === 'function') {
            initializeWeeklyScheduleManager();
        } else {
            console.warn('⚠️ initializeWeeklyScheduleManager function not available yet');
        }

        // СТЪПКА 6: Initialize Event Manager
        console.log('📋 Initializing Event Manager...');
        if (typeof initializeEventManager === 'function') {
            initializeEventManager();
        } else {
            console.warn('⚠️ initializeEventManager function not available yet');
        }

        // НОВА СТЪПКА: Зареждаме hourly rates в select-а при стартиране
        console.log('💰 Step 2: Load hourly rates into selects...');
        if (typeof loadHourlyRatesIntoSelect === 'function') {
            await loadHourlyRatesIntoSelect();
        }
        // СТЪПКА 7: Set up global event listeners
        setupGlobalEventListeners();

        console.log('🎉 All available modules initialized successfully');

    } catch (error) {
        console.error('❌ Error initializing application:', error);

        // Show user-friendly error message
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff4444;
            color: white;
            padding: 15px;
            border-radius: 5px;
            z-index: 10000;
            max-width: 300px;
            font-family: Arial, sans-serif;
        `;
        errorDiv.textContent = 'Application failed to start. Please refresh the page.';
        document.body.appendChild(errorDiv);

        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }
}

/**
 * Sets up global event listeners that don't belong to specific modules
 */
function setupGlobalEventListeners() {
    console.log('🔧 Setting up global event listeners...');

    // Handle window resize for responsive calendar
    window.addEventListener('resize', function() {
        // Debounce resize events
        clearTimeout(window.resizeTimeout);
        window.resizeTimeout = setTimeout(function() {
            // Check if calendar exists and has updateSize method
            if (window.calendar && typeof window.calendar.updateSize === 'function') {
                window.calendar.updateSize();
            }
        }, 250);
    });

    // НОВО: Global listener за refresh на hourly rates когато е нужно
    document.addEventListener('hourlyRatesChanged', async function() {
        console.log('💰 Hourly rates changed - refreshing all selects...');

        if (typeof populateAllHourlyRateSelects === 'function') {
            try {
                await populateAllHourlyRateSelects();
                console.log('✅ All hourly rate selects refreshed successfully');
            } catch (error) {
                console.error('❌ Error refreshing hourly rate selects:', error);
            }
        }
    });

    // Handle global keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // ESC key to close forms and modals
        if (e.key === 'Escape') {
            closeAllForms();
        }

        // Ctrl+N to quickly add new employee
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            const addEmployeeBtn = document.getElementById('addEmployeeBtn');
            if (addEmployeeBtn) {
                addEmployeeBtn.click();
            }
        }
    });

    // Handle click outside to close dropdowns/forms
    document.addEventListener('click', function(e) {
        // Close employee list if clicking outside
        const employeeListContainer = document.getElementById('employeeListContainer');
        const viewEmployeesBtn = document.getElementById('viewEmployeesBtn');
        const searchInput = document.getElementById('searchInput'); // НОВА ЛИНИЯ: Добавяме референция към търсачката

        if (employeeListContainer && viewEmployeesBtn &&
            !employeeListContainer.contains(e.target) &&
            !viewEmployeesBtn.contains(e.target) &&
            e.target !== searchInput) { // НОВА ПРОВЕРКА: Изключваме кликове върху търсачката
            if (!employeeListContainer.classList.contains('hidden')) {
                employeeListContainer.classList.add('hidden');
                if (typeof toggleSearchVisibility === 'function') {
                    toggleSearchVisibility(false);
                }
            }
        }
    });

    console.log('✅ Global event listeners set up successfully');
}

/**
 * Closes all open forms and resets UI to default state
 */
function closeAllForms() {
    // Hide all forms
    const formsToHide = [
        'employeeForm',
        'event-form',
        'edit-event-form',
        'employeeListContainer',
        'weekly-schedule-section'  // НОВА ЛИНИЯ: Добавяме седмичната секция
    ];

    formsToHide.forEach(formId => {
        const form = document.getElementById(formId);
        if (form) {
            form.classList.add('hidden');
            form.style.display = 'none';
        }
    });

    // Hide search
    if (typeof toggleSearchVisibility === 'function') {
        toggleSearchVisibility(false);
    }

    // Show default UI elements
    const elementsToShow = [
        'employeeSelect',
        'addEmployeeBtn'
    ];

    elementsToShow.forEach(elementId => {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.remove('hidden');
        }
    });

    // Show employee select label
    const selectLabel = document.querySelector('label[for="employeeSelect"]');
    if (selectLabel) {
        selectLabel.classList.remove('hidden');
    }
}

/**
 * Universal cleanup function for forms when employee changes
 */
function cleanupFormsOnEmployeeChange() {
    console.log('🧹 Universal cleanup of forms due to employee change...');

    // Използваме универсалната функция ако съществува
    if (typeof hideAllFormsAndElements === 'function') {
        hideAllFormsAndElements();
        console.log('✅ Used universal hideAllFormsAndElements function');
    } else {
        // Fallback към ръчно скриване
        console.log('🔧 Using fallback manual form hiding...');

        // Скриваме всички форми ръчно
        const formsToHide = [
            { id: 'event-form', property: 'style.display', value: 'none' },
            { id: 'edit-event-form', property: 'style.display', value: 'none' },
            { id: 'employeeForm', property: 'classList', action: 'add', value: 'hidden' },
            { id: 'employeeListContainer', property: 'classList', action: 'add', value: 'hidden' },
            { id: 'searchInput', property: 'style.display', value: 'none' }
        ];

        formsToHide.forEach(form => {
            const element = document.getElementById(form.id);
            if (element) {
                if (form.property === 'style.display') {
                    element.style.display = form.value;
                } else if (form.property === 'classList') {
                    if (form.action === 'add') {
                        element.classList.add(form.value);
                    }
                }
                console.log(`🔒 ${form.id} hidden`);
            }
        });

        // Премахваме календарни бутони
        if (typeof removeExistingButtons === 'function') {
            removeExistingButtons();
        }

        // Показваме основните елементи
        const elementsToShow = ['employeeSelect', 'addEmployeeBtn'];
        elementsToShow.forEach(elementId => {
            const element = document.getElementById(elementId);
            if (element) {
                element.classList.remove('hidden');
            }
        });

        const selectLabel = document.querySelector('label[for="employeeSelect"]');
        if (selectLabel) selectLabel.classList.remove('hidden');
    }

    console.log('✅ Universal form cleanup completed');
}

/**
 * Global error handler for unhandled promise rejections
 */
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);

    // Show user-friendly error message
    if (typeof showNotification === 'function') {
        showNotification('An unexpected error occurred. Please try again.', 'error');
    }

    // Prevent the default browser behavior
    event.preventDefault();
});

/**
 * Global error handler for JavaScript errors
 */
window.addEventListener('error', function(event) {
    console.error('JavaScript error:', event.error);

    // Show user-friendly error message for critical errors
    if (event.error && event.error.message) {
        if (typeof showNotification === 'function') {
            showNotification('A technical error occurred. Please refresh the page.', 'error');
        }
    }
});

/**
 * Application health check
 * Verifies that all required DOM elements are present
 * ПОПРАВЕНО: Не блокира стартирането, само логва предупреждения
 */
function performHealthCheck() {
    const criticalElements = [
        'calendar'  // Само наистина критичните елементи
    ];

    // Опционални елементи - не блокират стартирането
    const optionalElements = [
        'employeeSelect',
        'addEmployeeBtn',
        'viewEmployeesBtn',
        'employeeForm',
        'event-form',
        'edit-event-form',
        'employeeListContainer',
        'weekly-schedule-section'
    ];

    const missingCritical = [];
    const missingOptional = [];

    // Проверяваме критичните елементи
    criticalElements.forEach(elementId => {
        const element = document.getElementById(elementId);
        if (!element) {
            missingCritical.push(elementId);
        }
    });

    // Проверяваме опционалните елементи
    optionalElements.forEach(elementId => {
        const element = document.getElementById(elementId);
        if (!element) {
            missingOptional.push(elementId);
        }
    });

    // Логваме резултатите
    if (missingCritical.length > 0) {
        console.warn('⚠️ Missing critical DOM elements:', missingCritical);
    } else {
        console.log('✅ All critical DOM elements are present');
    }

    if (missingOptional.length > 0) {
        console.warn('⚠️ Missing optional DOM elements (app will continue):', missingOptional);
    }

    // ВИНАГИ връщаме true - не блокираме стартирането
    return true;
}

/**
 * Utility function to check if all required modules are loaded
 * ПОПРАВЕНО: Не блокира стартирането, само логва информация
 */
function checkModuleAvailability() {
    const expectedFunctions = [
        'initializeUIManager',
        'initializeEmployeeManager',
        'initializeHourlyRateManager',  // НОВО: Добавен hourly rate manager
        'initializeWeeklyScheduleManager',  // НОВА ЛИНИЯ: Проверка за седмичния модул
        'initializeCalendar',
        'initializeEventManager',
        'filterEmployees'
    ];

    const availableFunctions = [];
    const missingFunctions = [];

    expectedFunctions.forEach(functionName => {
        if (typeof window[functionName] === 'function') {
            availableFunctions.push(functionName);
        } else {
            missingFunctions.push(functionName);
        }
    });

    console.log('✅ Available functions:', availableFunctions);

    if (missingFunctions.length > 0) {
        console.warn('⚠️ Missing functions (app will continue):', missingFunctions);
    }

    // ВИНАГИ връщаме true - приложението ще продължи дори с липсващи модули
    return true;
}

/**
 * Debug function to log application state
 * Useful for troubleshooting
 */
function logApplicationState() {
    console.log('📊 Application State Debug Info:');
    console.log('- Calendar initialized:', !!window.calendar);
    console.log('- Employee select value:', document.getElementById('employeeSelect')?.value);
    console.log('- Current forms visible:', {
        employeeForm: !document.getElementById('employeeForm')?.classList.contains('hidden'),
        eventForm: document.getElementById('event-form')?.style.display !== 'none',
        editForm: document.getElementById('edit-event-form')?.style.display !== 'none',
        weeklySchedule: !document.getElementById('weekly-schedule-section')?.classList.contains('hidden')  // НОВА ЛИНИЯ
    });
    console.log('- Employee list items:', document.getElementById('employeeList')?.children.length);
    console.log('- Weekly schedule visible:', typeof isWeeklyScheduleVisible === 'function' ? isWeeklyScheduleVisible() : 'unknown');  // НОВА ЛИНИЯ
}

/**
 * Fallback notification function
 */
function showNotification(message, type = 'info') {
    console.log(`📢 Notification (${type}): ${message}`);

    if (type === 'error') {
        alert('Error: ' + message);
    } else if (type === 'success') {
        alert('Success: ' + message);
    } else {
        console.log('Info: ' + message);
    }
}

// Инициализираме activity selects когато страницата е готова
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Page loaded - initializing activity selects...');

    // Използваме ID като value за новата структура
    if (window.activityManager) {
        window.activityManager.initialize(true) // true = използвай ID като value
            .then(() => {
                console.log('✅ Activity selects initialized successfully');
            })
            .catch(error => {
                console.error('❌ Failed to initialize activity selects:', error);
            });
    }
});

// Export functions for debugging and external use
window.closeAllForms = closeAllForms;
window.performHealthCheck = performHealthCheck;
window.checkModuleAvailability = checkModuleAvailability;
window.logApplicationState = logApplicationState;
window.cleanupFormsOnEmployeeChange = cleanupFormsOnEmployeeChange;
window.initializeApplication = initializeApplication;
window.setupGlobalEventListeners = setupGlobalEventListeners;

// Fallback functions
if (typeof window.showNotification !== 'function') {
    window.showNotification = showNotification;
}

// Application ready indicator
window.addEventListener('load', function() {
    console.log('🎯 Application fully loaded and ready');

    // Perform health check - НЕ блокира стартирането
    performHealthCheck();

    // Check module availability - НЕ блокира стартирането
    checkModuleAvailability();

    console.log('🚀 Application startup checks completed');
});

console.log('✅ App.js main controller loaded successfully');