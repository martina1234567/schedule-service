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
function initializeApplication() {
    try {
        // 1. Initialize UI Manager first (handles basic UI interactions)
        console.log('📱 Initializing UI Manager...');
        initializeUIManager();

        // 2. Initialize Employee Manager (handles employee CRUD operations)
        console.log('👥 Initializing Employee Manager...');
        initializeEmployeeManager();



        // 4. Initialize Calendar (depends on employee data being available)
        console.log('📅 Initializing Calendar...');
        initializeCalendar();

        // 3. НОВА ЛИНИЯ: Initialize Weekly Schedule Manager (handles weekly hours table)
                console.log('📊 Initializing Weekly Schedule Manager...');
                initializeWeeklyScheduleManager();

        // 5. Initialize Event Manager (handles event creation and editing)
        console.log('📋 Initializing Event Manager...');
        initializeEventManager();

        // 6. Set up any additional global event listeners
        setupGlobalEventListeners();

        console.log('🎉 All modules initialized successfully');

    } catch (error) {
        console.error('❌ Error initializing application:', error);
        alert('An error occurred while starting the application. Please refresh the page.');
    }
}

/**
 * Sets up global event listeners that don't belong to specific modules
 */
function setupGlobalEventListeners() {
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
    toggleSearchVisibility(false);

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
 * Global error handler for unhandled promise rejections
 */
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);

    // Show user-friendly error message
    showNotification('An unexpected error occurred. Please try again.', 'error');

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
        showNotification('A technical error occurred. Please refresh the page.', 'error');
    }
});

/**
 * Application health check
 * Verifies that all required DOM elements are present
 */
function performHealthCheck() {
    const requiredElements = [
        'calendar',
        'employeeSelect',
        'addEmployeeBtn',
        'viewEmployeesBtn',
        'employeeForm',
        'event-form',
        'edit-event-form',
        'employeeListContainer',
        'weekly-schedule-section'  // НОВА ЛИНИЯ: Проверка за седмичната секция
    ];

    const missingElements = [];

    requiredElements.forEach(elementId => {
        const element = document.getElementById(elementId);
        if (!element) {
            missingElements.push(elementId);
        }
    });

    if (missingElements.length > 0) {
        console.error('❌ Missing required DOM elements:', missingElements);
        return false;
    }

    console.log('✅ All required DOM elements are present');
    return true;
}

/**
 * Utility function to check if all required modules are loaded
 */
function checkModuleAvailability() {
    const requiredFunctions = [
        'initializeUIManager',
        'initializeEmployeeManager',
        'initializeWeeklyScheduleManager',  // НОВА ЛИНИЯ: Проверка за седмичния модул
        'initializeCalendar',
        'initializeEventManager'
    ];

    const missingFunctions = [];

    requiredFunctions.forEach(functionName => {
        if (typeof window[functionName] !== 'function') {
            missingFunctions.push(functionName);
        }
    });

    if (missingFunctions.length > 0) {
        console.error('❌ Missing required functions:', missingFunctions);
        return false;
    }

    console.log('✅ All required modules are available');
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

// Application ready indicator
window.addEventListener('load', function() {
    console.log('🎯 Application fully loaded and ready');

    // Perform health check
    if (!performHealthCheck()) {
        console.error('❌ Application health check failed');
    }

    // Check module availability
    if (!checkModuleAvailability()) {
        console.error('❌ Module availability check failed');
    }
});

