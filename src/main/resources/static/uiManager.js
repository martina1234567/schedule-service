/**
 * UI Management Module
 * Handles general UI interactions, navigation, search functionality,
 * and form behaviors not specific to employees or events
 */

/**
 * Initializes all UI management functionality
 * Sets up navigation, search, sidebar toggle, and general form behaviors
 */
function initializeUIManager() {
    console.log('📱 Initializing UI Manager...');

    setupNavigationHandlers();
    setupSearchFunctionality();
    setupFormEnhancements();
    setupSessionStorage();
    setupSidebarToggle(); // Добавяме sidebar toggle функционалността
    setupCollapsedSidebarButtonHandlers(); // НОВА ФУНКЦИЯ: Добавяме специални handlers за бутоните когато sidebar е свит
    ensureEventFormInitialState(); // НОВА ФУНКЦИЯ: Уверяваме се че event формата е скрита в началото

    console.log('✅ UI Manager initialized successfully');
}

/**
 * Sets up navigation button handlers
 */
function setupNavigationHandlers() {
    // Employee Schedule navigation button
    document.getElementById('employeeScheduleBtn').addEventListener('click', function() {
        window.location.href = 'schedule.html';
    });

    // Schedule button (home page navigation)
    const scheduleBtn = document.getElementById('scheduleBtn');
    if (scheduleBtn) {
        scheduleBtn.addEventListener('click', goToHomePage);
    }
}

/**
 * Navigates to the home page and manages search visibility state
 */
function goToHomePage() {
    // Store state to hide search on home page
    sessionStorage.setItem('hideSearch', 'true');
    window.location.href = 'http://localhost:8080/';
}

/**
 * Sets up search functionality for employee filtering
 */
function setupSearchFunctionality() {
    const searchInput = document.getElementById('searchInput');

    // Initially hide the search input
    searchInput.style.display = 'none';

    // Set up the search input handler
    searchInput.addEventListener('keyup', filterEmployees);
}

/**
 * Sets up session storage handling for UI state persistence
 */
function setupSessionStorage() {
    // Check session storage state on page load
    document.addEventListener('DOMContentLoaded', function() {
        const searchInput = document.getElementById('searchInput');

        // Check if search should be hidden based on session storage
        if (sessionStorage.getItem('hideSearch') === 'true') {
            searchInput.style.display = 'none';
            sessionStorage.removeItem('hideSearch'); // Clean up
        } else {
            // Default behavior - search is hidden initially anyway
            searchInput.style.display = 'none';
        }
    });
}

/**
 * Sets up form enhancements like floating labels and time input formatting
 */
function setupFormEnhancements() {
    setupFloatingLabels();
    setupTimeInputFormatting();
}

/**
 * Initializes floating label behavior for form inputs
 * Handles the animation of labels moving up when inputs are focused or filled
 */
function setupFloatingLabels() {
    // Handle floating labels for regular input fields
    const inputs = document.querySelectorAll('input[type="text"], input[type="email"]');

    inputs.forEach(input => {
        // Check initial state
        checkInputFilled(input);

        // Add event listeners for focus and blur
        input.addEventListener('focus', function() {
            const label = document.querySelector(`label[for='${input.id}']`);
            if (label) {
                label.classList.add('active');
            }
        });

        input.addEventListener('blur', function() {
            checkInputFilled(input);
        });

        input.addEventListener('input', function() {
            checkInputFilled(input);
        });
    });
}

/**
 * Checks if an input field is filled and positions its label accordingly
 * @param {HTMLInputElement} input - The input element to check
 */
function checkInputFilled(input) {
    const label = document.querySelector(`label[for='${input.id}']`);
    if (label) {
        if (input.value.trim() !== '') {
            label.classList.add('active'); // Keep label at top
        } else {
            label.classList.remove('active'); // Return label to original position
        }
    }
}

/**
 * Sets up time input formatting to round minutes to 15-minute intervals
 * Enhances user experience by automatically formatting time inputs
 */
function setupTimeInputFormatting() {
    // Add event listener when DOM is loaded
    document.addEventListener("DOMContentLoaded", function() {
        const timeInputs = document.querySelectorAll("input[type='time']");

        timeInputs.forEach(input => {
            // Format time when user leaves the input field
            input.addEventListener("blur", function() {
                formatTimeInput(this);
            });
        });
    });
}

/**
 * Formats a time input to round minutes to the nearest 15-minute interval
 * @param {HTMLInputElement} timeInput - The time input element to format
 */
function formatTimeInput(timeInput) {
    let [hours, minutes] = timeInput.value.split(":");

    // Validate input
    if (!hours || !minutes) return;

    minutes = parseInt(minutes);
    if (isNaN(minutes)) return;

    // Round to nearest 15-minute interval
    if (minutes < 8) {
        minutes = "00";
    } else if (minutes < 23) {
        minutes = "15";
    } else if (minutes < 38) {
        minutes = "30";
    } else {
        minutes = "45";
    }

    // Ensure proper formatting (HH:MM)
    hours = hours.padStart(2, '0');
    minutes = minutes.padStart(2, '0');

    // Update the input value
    timeInput.value = `${hours}:${minutes}`;
}

/**
 * Manages form visibility and UI state transitions
 * @param {string} formToShow - ID of the form to show
 * @param {Array} formsToHide - Array of form IDs to hide
 */
function toggleFormVisibility(formToShow, formsToHide = []) {
    // Hide specified forms
    formsToHide.forEach(formId => {
        const form = document.getElementById(formId);
        if (form) {
            form.classList.add('hidden');
        }
    });

    // Show the target form
    const targetForm = document.getElementById(formToShow);
    if (targetForm) {
        targetForm.classList.remove('hidden');
    }
}

/**
 * Shows or hides the search input based on context
 * @param {boolean} show - Whether to show or hide the search
 */
function toggleSearchVisibility(show) {
    const searchInput = document.getElementById('searchInput');
    searchInput.style.display = show ? 'block' : 'none';
}

/**
 * Displays success or error messages to the user
 * @param {string} message - Message to display
 * @param {string} type - Type of message ('success', 'error', 'info')
 */
function showNotification(message, type = 'info') {
    // Simple alert for now - could be enhanced with custom notifications
    if (type === 'error') {
        alert(`Error: ${message}`);
    } else if (type === 'success') {
        alert(`Success: ${message}`);
    } else {
        alert(message);
    }
}

/**
 * Validates form fields and shows appropriate error messages
 * @param {Array} requiredFields - Array of objects with {id, name} for required fields
 * @returns {boolean} True if all fields are valid
 */
function validateRequiredFields(requiredFields) {
    const missingFields = [];

    requiredFields.forEach(field => {
        const element = document.getElementById(field.id);
        if (!element || !element.value.trim()) {
            missingFields.push(field.name);
        }
    });

    if (missingFields.length > 0) {
        showNotification(`Please fill in the following required fields: ${missingFields.join(', ')}`, 'error');
        return false;
    }

    return true;
}

/**
 * Clears all form fields in a given form
 * @param {string} formId - ID of the form to clear
 */
function clearForm(formId) {
    const form = document.getElementById(formId);
    if (form) {
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (input.type === 'checkbox' || input.type === 'radio') {
                input.checked = false;
            } else {
                input.value = '';
            }

            // Reset floating labels
            const label = document.querySelector(`label[for='${input.id}']`);
            if (label) {
                label.classList.remove('active');
            }
        });
    }
}

/**
 * Sets up window load event handlers
 */
window.onload = function() {
    // Hide search input on initial page load
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.style.display = 'none';
    }
};

/**
 * Sets up sidebar toggle functionality
 */
function setupSidebarToggle() {
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const calendarContainer = document.getElementById('calendar-container');

    if (!sidebar || !sidebarToggle) {
        console.warn('⚠️ Sidebar or toggle button not found');
        return;
    }

    // ПРОМЯНА: Винаги стартираме със свит sidebar независимо от localStorage
    // Коментирай следните редове за да отмениш запазването на състоянието:
    /*
    const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (isCollapsed) {
        sidebar.classList.add('collapsed');
        updateToggleButton(true);
    }
    */

    // НОВА ЛОГИКА: Винаги стартираме със свит sidebar
    console.log('🔄 Starting with collapsed sidebar by default...');
    sidebar.classList.add('collapsed');
    updateToggleButton(true);
    localStorage.setItem('sidebarCollapsed', 'true'); // Запазваме състоянието

    // Актуализираме размера на календара след малка пауза
    setTimeout(() => {
        if (window.calendar && typeof window.calendar.updateSize === 'function') {
            window.calendar.updateSize();
            console.log('📅 Calendar resized for initial collapsed state');
        }
    }, 100);

    console.log('✅ Sidebar initialized in collapsed state');

    // Event listener за toggle бутона
    sidebarToggle.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        const isCurrentlyCollapsed = sidebar.classList.contains('collapsed');

        if (isCurrentlyCollapsed) {
            // Разширяваме sidebar
            expandSidebar();
        } else {
            // Свиваме sidebar
            collapseSidebar();
        }
    });
}

/**
 * НОВА ФУНКЦИЯ: Настройва специални event listeners за бутоните когато sidebar е свит
 * Това е ключовата функция която решава твоя проблем!
 */
function setupCollapsedSidebarButtonHandlers() {
    // Намираме бутона за добавяне на служител (бутонът с иконата "+")
    const addEmployeeBtn = document.getElementById('addEmployeeBtn');

    // Намираме бутона за показване на списъка със служители (бутонът с иконата "👥")
    const viewEmployeesBtn = document.getElementById('viewEmployeesBtn');

    // Ако намерим бутона за добавяне на служител
    if (addEmployeeBtn) {
        console.log('🔧 Setting up collapsed sidebar handler for Add Employee button');

        // Добавяме event listener който ще се изпълнява ПРЕДИ оригиналния
        addEmployeeBtn.addEventListener('click', function(e) {
            const sidebar = document.getElementById('sidebar');

            // Проверяваме дали sidebar-ът е свит
            if (sidebar && sidebar.classList.contains('collapsed')) {
                console.log('📂 Sidebar is collapsed, expanding and opening add employee form...');

                // Предотвратяваме оригиналното поведение временно
                e.preventDefault();
                e.stopPropagation();

                // Първо разширяваме sidebar-а
                expandSidebar();

                // Чакаме CSS анимацията да завърши (300ms) и след това отваряме формата
                setTimeout(() => {
                    console.log('🎯 Opening add employee form after sidebar expansion');

                    // Симулираме кликване на бутона след като sidebar се е разширил
                    // Това ще активира оригиналната логика от employeeManager.js
                    triggerAddEmployeeForm();
                }, 350); // Малко повече от CSS transition времето

                return false; // Прекратяваме разпространението на event-а
            }

            // Ако sidebar НЕ е свит, нормалното поведение ще продължи
            console.log('📂 Sidebar is expanded, normal add employee behavior will proceed');
        }, true); // Използваме capture фаза за да се изпълни ПРЕДИ другите listeners
    }

    // Същата логика за бутона за показване на списъка със служители
    if (viewEmployeesBtn) {
        console.log('🔧 Setting up collapsed sidebar handler for View Employees button');

        viewEmployeesBtn.addEventListener('click', function(e) {
            const sidebar = document.getElementById('sidebar');

            // Проверяваме дали sidebar-ът е свит
            if (sidebar && sidebar.classList.contains('collapsed')) {
                console.log('📂 Sidebar is collapsed, expanding and opening employee list...');

                // Предотвратяваме оригиналното поведение временно
                e.preventDefault();
                e.stopPropagation();

                // Първо разширяваме sidebar-а
                expandSidebar();

                // Чакаме CSS анимацията да завърши и след това отваряме списъка
                setTimeout(() => {
                    console.log('🎯 Opening employee list after sidebar expansion');

                    // Симулираме кликване на бутона след като sidebar се е разширил
                    triggerViewEmployeesList();
                }, 350);

                return false;
            }

            console.log('📂 Sidebar is expanded, normal view employees behavior will proceed');
        }, true); // Capture фаза
    }
}

/**
 * НОВА ФУНКЦИЯ: Разширява sidebar-а и актуализира състоянието
 */
function expandSidebar() {
    const sidebar = document.getElementById('sidebar');

    if (sidebar) {
        console.log('📖 Expanding sidebar...');

        // Премахваме класа за свит sidebar
        sidebar.classList.remove('collapsed');

        // Актуализираме toggle бутона
        updateToggleButton(false);

        // Запазваме състоянието в localStorage
        localStorage.setItem('sidebarCollapsed', 'false');

        // НОВА ФУНКЦИОНАЛНОСТ: Възстановяваме състоянието на формите след разширяване
        setTimeout(() => {
            restoreAllFormsState();
        }, 100); // Малка пауза за да се завърши CSS анимацията

        // Актуализираме размера на календара след малка пауза
        setTimeout(() => {
            if (window.calendar && typeof window.calendar.updateSize === 'function') {
                window.calendar.updateSize();
                console.log('📅 Calendar resized after sidebar expansion');
            }
        }, 350);

        console.log('✅ Sidebar expanded successfully');
    }
}

/**
 * НОВА ФУНКЦИЯ: Свива sidebar-а и актуализира състоянието
 */
function collapseSidebar() {
    const sidebar = document.getElementById('sidebar');

    if (sidebar) {
        console.log('📕 Collapsing sidebar...');

        // НОВА ФУНКЦИОНАЛНОСТ: Запазваме състоянието на всички отворени форми преди да ги скрием
        saveAllFormsState();

        // Добавяме класа за свит sidebar
        sidebar.classList.add('collapsed');

        // Актуализираме toggle бутона
        updateToggleButton(true);

        // Запазваме състоянието в localStorage
        localStorage.setItem('sidebarCollapsed', 'true');

        // Скриваме всички отворени форми
        hideAllOpenForms();

        // Актуализираме размера на календара след малка пауза
        setTimeout(() => {
            if (window.calendar && typeof window.calendar.updateSize === 'function') {
                window.calendar.updateSize();
                console.log('📅 Calendar resized after sidebar collapse');
            }
        }, 350);

        console.log('✅ Sidebar collapsed successfully');
    }
}

/**
 * НОВА ФУНКЦИЯ: Активира формата за добавяне на служител
 * Тази функция симулира кликването на бутона за добавяне на служител
 */
function triggerAddEmployeeForm() {
    console.log('🎯 Triggering add employee form...');

    try {
        // Скриваме всички възможни отворени форми и списъци
        hideAllOpenForms();

        // Скриваме employee selection dropdown и неговия label
        const employeeSelect = document.getElementById('employeeSelect');
        const selectLabel = document.querySelector('label[for="employeeSelect"]');

        if (employeeSelect) {
            employeeSelect.classList.add('hidden');
        }
        if (selectLabel) {
            selectLabel.classList.add('hidden');
        }

        // Скриваме add бутона и показваме employee формата
        const addEmployeeBtn = document.getElementById('addEmployeeBtn');
        const employeeForm = document.getElementById('employeeForm');

        if (addEmployeeBtn) {
            addEmployeeBtn.classList.add('hidden');
        }
        if (employeeForm) {
            employeeForm.classList.remove('hidden');
        }

        // Настройваме формата за добавяне (не за редактиране)
        if (typeof window.isEditMode !== 'undefined') {
            window.isEditMode = false;
            window.editingEmployeeId = null;
        }

        // Актуализираме текста на submit бутона
        const submitBtn = document.getElementById('submitEmployee');
        if (submitBtn) {
            submitBtn.textContent = '✔';
        }

        // Изчистваме всякакви съществуващи данни от формата
        if (typeof clearEmployeeForm === 'function') {
            clearEmployeeForm();
        } else {
            // Backup метод за изчистване на формата
            clearFormFields(['name', 'lastname', 'email', 'position', 'hourlyRate']);
        }

        console.log('✅ Add employee form opened successfully');

        // Фокусираме първото поле за по-добро потребителско изживяване
        setTimeout(() => {
            const nameInput = document.getElementById('name');
            if (nameInput) {
                nameInput.focus();
            }
        }, 100);

    } catch (error) {
        console.error('❌ Error opening add employee form:', error);
        alert('Error opening add employee form. Please try again.');
    }
}

/**
 * НОВА ФУНКЦИЯ: Активира списъка със служители
 */
function triggerViewEmployeesList() {
    console.log('🎯 Triggering employee list view...');

    try {
        // Скриваме event форми
        const eventForm = document.getElementById('event-form');
        const editEventForm = document.getElementById('edit-event-form');

        if (eventForm) {
            eventForm.style.display = 'none';
        }
        if (editEventForm) {
            editEventForm.style.display = 'none';
        }

        // Показваме/скриваме employee list container
        const employeeListContainer = document.getElementById('employeeListContainer');
        const employeeForm = document.getElementById('employeeForm');
        const employeeSelect = document.getElementById('employeeSelect');
        const selectLabel = document.querySelector('label[for="employeeSelect"]');

        if (employeeListContainer) {
            // Toggle visibility на employee list container
            employeeListContainer.classList.toggle('hidden');

            if (!employeeListContainer.classList.contains('hidden')) {
                // Ако показваме списъка, скриваме другите елементи
                if (employeeForm) {
                    employeeForm.classList.add('hidden');
                }
                if (employeeSelect) {
                    employeeSelect.classList.add('hidden');
                }
                if (selectLabel) {
                    selectLabel.classList.add('hidden');
                }

                // Показваме search input ако има служители
                const employeeList = document.getElementById('employeeList');
                const searchInput = document.getElementById('searchInput');

                if (searchInput && employeeList && employeeList.children.length > 0) {
                    searchInput.style.display = "block";
                    console.log('🔍 Search input shown for employee filtering');
                }

                console.log('👥 Employee list opened');
            } else {
                // Ако скриваме списъка, показваме обратно нормалния UI
                if (employeeSelect) {
                    employeeSelect.classList.remove('hidden');
                }
                if (selectLabel) {
                    selectLabel.classList.remove('hidden');
                }

                // Скриваме search input
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    searchInput.style.display = "none";
                }

                console.log('👥 Employee list closed');
            }
        }

        console.log('✅ Employee list view toggled successfully');

    } catch (error) {
        console.error('❌ Error opening employee list:', error);
        alert('Error opening employee list. Please try again.');
    }
}

/**
 * НОВА ПОМОЩНА ФУНКЦИЯ: Изчиства определени полета от формата
 * @param {Array} fieldIds - Масив с ID-та на полетата за изчистване
 */
function clearFormFields(fieldIds) {
    fieldIds.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.value = '';

            // Премахваме floating label ако има такъв
            const label = document.querySelector(`label[for='${fieldId}']`);
            if (label) {
                label.classList.remove('active');
            }
        }
    });

    console.log('🗑️ Form fields cleared:', fieldIds);
}

/**
 * Updates the toggle button appearance based on sidebar state
 * @param {boolean} isCollapsed - Whether the sidebar is collapsed
 */
function updateToggleButton(isCollapsed) {
    const toggleButton = document.getElementById('sidebarToggle');
    const arrows = toggleButton.querySelector('.arrows');

    if (isCollapsed) {
        arrows.innerHTML = '&gt;&gt;'; // Двойна стрелка надясно ">>"
        toggleButton.title = 'Expand Sidebar';
    } else {
        arrows.innerHTML = '&lt;&lt;'; // Двойна стрелка наляво "<<"
        toggleButton.title = 'Collapse Sidebar';
    }
}

/**
 * Hides all open forms when sidebar is collapsed
 */
function hideAllOpenForms() {
    // Скриваме employee форми
    const employeeForm = document.getElementById('employeeForm');
    const employeeListContainer = document.getElementById('employeeListContainer');
    const searchInput = document.getElementById('searchInput');

    if (employeeForm) employeeForm.classList.add('hidden');
    if (employeeListContainer) employeeListContainer.classList.add('hidden');
    if (searchInput) searchInput.style.display = 'none';

    // Скриваме event форми
    const eventForm = document.getElementById('event-form');
    const editEventForm = document.getElementById('edit-event-form');

    if (eventForm) eventForm.style.display = 'none';
    if (editEventForm) editEventForm.style.display = 'none';

    // Показваме обратно основните елементи
    const employeeSelect = document.getElementById('employeeSelect');
    const selectLabel = document.querySelector('label[for="employeeSelect"]');
    const addEmployeeBtn = document.getElementById('addEmployeeBtn');

    if (employeeSelect) employeeSelect.classList.remove('hidden');
    if (selectLabel) selectLabel.classList.remove('hidden');
    if (addEmployeeBtn) addEmployeeBtn.classList.remove('hidden');

    console.log('🧹 All forms hidden due to sidebar collapse');
}

// Export functions for global use
window.goToHomePage = goToHomePage;
window.toggleFormVisibility = toggleFormVisibility;
window.toggleSearchVisibility = toggleSearchVisibility;
window.showNotification = showNotification;
window.validateRequiredFields = validateRequiredFields;
window.clearForm = clearForm;
window.initializeUIManager = initializeUIManager;
window.setupSidebarToggle = setupSidebarToggle;
// НОВИ ЕКСПОРТИ: Правим новите функции достъпни глобално за debugging
window.expandSidebar = expandSidebar;
window.collapseSidebar = collapseSidebar;
window.triggerAddEmployeeForm = triggerAddEmployeeForm;
window.triggerViewEmployeesList = triggerViewEmployeesList;

/**
 * =====================================
 * НОВИ ФУНКЦИИ ЗА ЗАПАЗВАНЕ НА СЪСТОЯНИЕТО НА ФОРМИТЕ
 * =====================================
 */

/**
 * НОВА ФУНКЦИЯ: Запазва състоянието на всички форми в sessionStorage
 * Тази функция се извиква преди свиване на sidebar-а
 */
function saveAllFormsState() {
    console.log('💾 Saving all forms state before sidebar collapse...');

    // НОВА ФУНКЦИОНАЛНОСТ: Сетваме флаг че възстановяваме след sidebar toggle
    sessionStorage.setItem('restoringFromSidebarToggle', 'true');

    try {
        // Запазваме състоянието на employee формата
        saveEmployeeFormState();

        // Запазваме състоянието на event формите
        saveEventFormsState();

        // Запазваме състоянието на UI елементите (кои форми са отворени)
        saveUIState();

        console.log('✅ All forms state saved successfully');

    } catch (error) {
        console.error('❌ Error saving forms state:', error);
    }
}

/**
 * НОВА ФУНКЦИЯ: Възстановява състоянието на всички форми от sessionStorage
 * Тази функция се извиква след разширяване на sidebar-а
 */
function restoreAllFormsState() {
    console.log('📂 Restoring all forms state after sidebar expansion...');

    try {
        // Първо възстановяваме UI състоянието (кои форми трябва да са отворени)
        restoreUIState();

        // След това възстановяваме данните в формите
        setTimeout(() => {
            restoreEmployeeFormState();
            restoreEventFormsState();
        }, 50); // Малка пауза за да се покажат формите първо

        console.log('✅ All forms state restored successfully');

    } catch (error) {
        console.error('❌ Error restoring forms state:', error);
    }
}

/**
 * НОВА ФУНКЦИЯ: Запазва състоянието на employee формата
 */
function saveEmployeeFormState() {
    const employeeForm = document.getElementById('employeeForm');

    // Проверяваме дали employee формата е видима
    if (employeeForm && !employeeForm.classList.contains('hidden')) {
        console.log('💾 Saving employee form state...');

        // Събираме данните от всички полета в employee формата
        const formData = {
            name: document.getElementById('name')?.value || '',
            lastname: document.getElementById('lastname')?.value || '',
            email: document.getElementById('email')?.value || '',
            position: document.getElementById('position')?.value || '',
            hourlyRate: document.getElementById('hourlyRate')?.value || '',
            isEditMode: window.isEditMode || false,
            editingEmployeeId: window.editingEmployeeId || null,
            submitButtonText: document.getElementById('submitEmployee')?.textContent || '✔'
        };

        // Запазваме в sessionStorage
        sessionStorage.setItem('employeeFormData', JSON.stringify(formData));
        console.log('✅ Employee form data saved:', formData);
    } else {
        // Ако формата не е отворена, премахваме запазените данни
        sessionStorage.removeItem('employeeFormData');
        console.log('🗑️ Employee form not open, cleared saved data');
    }
}

/**
 * НОВА ФУНКЦИЯ: Запазва състоянието на event формите
 */
function saveEventFormsState() {
    // Запазваме главната event форма САМО ако има избран служител
    const eventForm = document.getElementById('event-form');
    const employeeSelect = document.getElementById('employeeSelect');
    const hasSelectedEmployee = employeeSelect && employeeSelect.value.trim() !== '';

    // ПОПРАВКА: Запазваме event формата само ако е отворена И има избран служител
    if (eventForm && eventForm.style.display !== 'none' && hasSelectedEmployee) {
        console.log('💾 Saving main event form state...');

        const eventFormData = {
            selectedDate: document.getElementById('selected-date')?.value || '',
            startTime: document.getElementById('start-time')?.value || '',
            endTime: document.getElementById('end-time')?.value || '',
            activityInput: document.getElementById('activityInput')?.value || '',
            leaveType: document.getElementById('leaveType')?.value || '',
            selectedEmployeeId: employeeSelect.value, // НОВО: Запазваме избрания служител
            selectedEmployeeName: employeeSelect.options[employeeSelect.selectedIndex]?.text || ''
        };

        sessionStorage.setItem('eventFormData', JSON.stringify(eventFormData));
        console.log('✅ Event form data saved:', eventFormData);
    } else {
        // ПОПРАВКА: Винаги премахваме данните ако няма избран служител
        sessionStorage.removeItem('eventFormData');
        if (!hasSelectedEmployee) {
            console.log('🚫 Event form NOT saved - no employee selected');
        }
    }

    // Запазваме edit event формата
    const editEventForm = document.getElementById('edit-event-form');
    if (editEventForm && editEventForm.style.display !== 'none') {
        console.log('💾 Saving edit event form state...');

        const editEventFormData = {
            editEventId: document.getElementById('edit-event-id')?.value || '',
            currentEventDate: document.getElementById('current-event-date')?.value || '',
            editStartTime: document.getElementById('edit-start-time')?.value || '',
            editEndTime: document.getElementById('edit-end-time')?.value || '',
            editActivity: document.getElementById('edit-activity')?.value || ''
        };

        sessionStorage.setItem('editEventFormData', JSON.stringify(editEventFormData));
        console.log('✅ Edit event form data saved:', editEventFormData);
    } else {
        sessionStorage.removeItem('editEventFormData');
    }
}

/**
 * НОВА ФУНКЦИЯ: Запазва състоянието на UI елементите
 */
function saveUIState() {
    const employeeListContainer = document.getElementById('employeeListContainer');
    const searchInput = document.getElementById('searchInput');

    const uiState = {
        employeeListVisible: employeeListContainer && !employeeListContainer.classList.contains('hidden'),
        searchVisible: searchInput && searchInput.style.display !== 'none',
        searchValue: searchInput?.value || ''
    };

    sessionStorage.setItem('uiState', JSON.stringify(uiState));
    console.log('💾 UI state saved:', uiState);
}

/**
 * НОВА ФУНКЦИЯ: Възстановява състоянието на employee формата
 */
function restoreEmployeeFormState() {
    const savedData = sessionStorage.getItem('employeeFormData');

    if (savedData) {
        console.log('📂 Restoring employee form state...');

        try {
            const formData = JSON.parse(savedData);

            // Показваме employee формата
            const employeeForm = document.getElementById('employeeForm');
            const employeeSelect = document.getElementById('employeeSelect');
            const selectLabel = document.querySelector('label[for="employeeSelect"]');
            const addEmployeeBtn = document.getElementById('addEmployeeBtn');

            if (employeeForm) {
                employeeForm.classList.remove('hidden');
            }
            if (employeeSelect) {
                employeeSelect.classList.add('hidden');
            }
            if (selectLabel) {
                selectLabel.classList.add('hidden');
            }
            if (addEmployeeBtn) {
                addEmployeeBtn.classList.add('hidden');
            }

            // Възстановяваме данните в полетата
            if (document.getElementById('name')) {
                document.getElementById('name').value = formData.name;
            }
            if (document.getElementById('lastname')) {
                document.getElementById('lastname').value = formData.lastname;
            }
            if (document.getElementById('email')) {
                document.getElementById('email').value = formData.email;
            }
            if (document.getElementById('position')) {
                document.getElementById('position').value = formData.position;
            }
            if (document.getElementById('hourlyRate')) {
                document.getElementById('hourlyRate').value = formData.hourlyRate;
            }

            // Възстановяваме edit mode състоянието
            if (typeof window.isEditMode !== 'undefined') {
                window.isEditMode = formData.isEditMode;
                window.editingEmployeeId = formData.editingEmployeeId;
            }

            // Възстановяваме текста на submit бутона
            const submitBtn = document.getElementById('submitEmployee');
            if (submitBtn) {
                //submitBtn.textContent = formData.submitButtonText;
                submitBtn.textContent = '✔'; // Тикче за add
                submitBtn.innerHTML = '<span>✔</span>'; // Алтернативно с span
            }

            // Активираме floating labels за попълнените полета
            activateFloatingLabelsForFilledFields(['name', 'lastname', 'email', 'position', 'hourlyRate']);

            console.log('✅ Employee form state restored:', formData);

        } catch (error) {
            console.error('❌ Error parsing saved employee form data:', error);
            sessionStorage.removeItem('employeeFormData');
        }
    }
}

/**
 * НОВА ФУНКЦИЯ: Възстановява състоянието на event формите
 */
function restoreEventFormsState() {
    // Възстановяваме главната event форма
    const savedEventData = sessionStorage.getItem('eventFormData');
    if (savedEventData) {
        console.log('📂 Restoring main event form state...');

        try {
            const eventFormData = JSON.parse(savedEventData);

            // ПОПРАВКА: Проверяваме дали все още има избрания служител в select-а
            const employeeSelect = document.getElementById('employeeSelect');
            const currentSelectedEmployee = employeeSelect?.value?.trim() || '';

            // Възстановяваме само ако службеният е същия като запазения
            if (eventFormData.selectedEmployeeId &&
                currentSelectedEmployee === eventFormData.selectedEmployeeId) {

                console.log('✅ Employee still selected, restoring event form...');

                // Показваме event формата
                const eventForm = document.getElementById('event-form');
                if (eventForm) {
                    eventForm.style.display = 'block';
                }

                // Възстановяваме данните
                if (document.getElementById('selected-date')) {
                    document.getElementById('selected-date').value = eventFormData.selectedDate;
                }
                if (document.getElementById('start-time')) {
                    document.getElementById('start-time').value = eventFormData.startTime;
                }
                if (document.getElementById('end-time')) {
                    document.getElementById('end-time').value = eventFormData.endTime;
                }
                if (document.getElementById('activityInput')) {
                    document.getElementById('activityInput').value = eventFormData.activityInput;
                }
                if (document.getElementById('leaveType')) {
                    document.getElementById('leaveType').value = eventFormData.leaveType;
                }

                console.log('✅ Event form state restored:', eventFormData);
            } else {
                // ПОПРАВКА: Ако няма избран служител или е различен, не показваме формата
                console.log('🚫 Event form NOT restored - no matching employee selected');
                sessionStorage.removeItem('eventFormData'); // Изчистваме остарелите данни

                // Уверяваме се че формата е скрита
                const eventForm = document.getElementById('event-form');
                if (eventForm) {
                    eventForm.style.display = 'none';
                }
            }

        } catch (error) {
            console.error('❌ Error parsing saved event form data:', error);
            sessionStorage.removeItem('eventFormData');
        }
    } else {
        // ПОПРАВКА: Уверяваме се че event формата е скрита ако няма запазени данни
        const eventForm = document.getElementById('event-form');
        if (eventForm) {
            eventForm.style.display = 'none';
        }
    }

    // Възстановяваме edit event формата
    const savedEditData = sessionStorage.getItem('editEventFormData');
    if (savedEditData) {
        console.log('📂 Restoring edit event form state...');

        try {
            const editEventFormData = JSON.parse(savedEditData);

            // Показваме edit event формата
            const editEventForm = document.getElementById('edit-event-form');
            if (editEventForm) {
                editEventForm.style.display = 'block';
            }

            // Възстановяваме данните
            if (document.getElementById('edit-event-id')) {
                document.getElementById('edit-event-id').value = editEventFormData.editEventId;
            }
            if (document.getElementById('current-event-date')) {
                document.getElementById('current-event-date').value = editEventFormData.currentEventDate;
            }
            if (document.getElementById('edit-start-time')) {
                document.getElementById('edit-start-time').value = editEventFormData.editStartTime;
            }
            if (document.getElementById('edit-end-time')) {
                document.getElementById('edit-end-time').value = editEventFormData.editEndTime;
            }
            if (document.getElementById('edit-activity')) {
                document.getElementById('edit-activity').value = editEventFormData.editActivity;
            }

            console.log('✅ Edit event form state restored:', editEventFormData);

        } catch (error) {
            console.error('❌ Error parsing saved edit event form data:', error);
            sessionStorage.removeItem('editEventFormData');
        }
    }
}

/**
 * НОВА ФУНКЦИЯ: Възстановява състоянието на UI елементите
 */
function restoreUIState() {
    const savedUIState = sessionStorage.getItem('uiState');

    if (savedUIState) {
        console.log('📂 Restoring UI state...');

        try {
            const uiState = JSON.parse(savedUIState);

            // Възстановяваме employee list visibility
            if (uiState.employeeListVisible) {
                const employeeListContainer = document.getElementById('employeeListContainer');
                const employeeSelect = document.getElementById('employeeSelect');
                const selectLabel = document.querySelector('label[for="employeeSelect"]');

                if (employeeListContainer) {
                    employeeListContainer.classList.remove('hidden');
                }
                if (employeeSelect) {
                    employeeSelect.classList.add('hidden');
                }
                if (selectLabel) {
                    selectLabel.classList.add('hidden');
                }
            }

            // Възстановяваме search visibility и стойност
            if (uiState.searchVisible) {
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    searchInput.style.display = 'block';
                    searchInput.value = uiState.searchValue;

                    // Ако има търсене, приложи филтъра
                    if (uiState.searchValue && typeof filterEmployees === 'function') {
                        filterEmployees();
                    }
                }
            }

            console.log('✅ UI state restored:', uiState);

        } catch (error) {
            console.error('❌ Error parsing saved UI state:', error);
            sessionStorage.removeItem('uiState');
        }
    }
}

/**
 * НОВА ПОМОЩНА ФУНКЦИЯ: Активира floating labels за попълнени полета
 * @param {Array} fieldIds - Масив с ID-та на полетата за проверка
 */
function activateFloatingLabelsForFilledFields(fieldIds) {
    fieldIds.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        const label = document.querySelector(`label[for='${fieldId}']`);

        if (field && label && field.value.trim() !== '') {
            label.classList.add('active');
            console.log(`🏷️ Activated floating label for field: ${fieldId}`);
        }
    });
}

/**
 * НОВА ФУНКЦИЯ: Изчиства всички запазени състояния на формите
 * Използва се когато потребителят изрично затвори форма или submit-не данни
 */
function clearAllSavedFormsState() {
    console.log('🗑️ Clearing all saved forms state...');

    sessionStorage.removeItem('employeeFormData');
    sessionStorage.removeItem('eventFormData');
    sessionStorage.removeItem('editEventFormData');
    sessionStorage.removeItem('uiState');

    console.log('✅ All saved forms state cleared');
}


/**
 * ДОБАВКА КЪМ uiManager.js
 * Добави тези функции в края на файла за responsive календар
 */

/**
 * Initializes all UI management functionality
 * Sets up navigation, search, sidebar toggle, and general form behaviors
 */
function initializeUIManager() {
    console.log('📱 Initializing UI Manager...');

    setupNavigationHandlers();
    setupSearchFunctionality();
    setupFormEnhancements();
    setupSessionStorage();
    setupSidebarToggle();
    setupCollapsedSidebarButtonHandlers();
    ensureEventFormInitialState();
    setupResponsiveCalendar(); // НОВА ФУНКЦИЯ: Responsive календар

    console.log('✅ UI Manager initialized successfully');
}

/**
 * НОВА ФУНКЦИЯ: Настройва responsive поведение на календара
 */
function setupResponsiveCalendar() {
    console.log('📱 Setting up responsive calendar...');

    // Първоначално resize на календара
    setTimeout(() => {
        resizeCalendar();
    }, 500); // Чакаме календара да се инициализира

    // Добавяме resize listener с debouncing
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            console.log('📏 Window resized, updating calendar...');
            resizeCalendar();
            updateCalendarView();
        }, 300); // Debounce 300ms
    });

    // Добавяме orientation change listener за mobile устройства
    window.addEventListener('orientationchange', function() {
        setTimeout(() => {
            console.log('🔄 Orientation changed, updating calendar...');
            resizeCalendar();
            updateCalendarView();
        }, 500); // Чакаме orientation change да завърши
    });

    // Добавяме visibility change listener
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            setTimeout(() => {
                console.log('👁️ Page became visible, updating calendar...');
                resizeCalendar();
            }, 100);
        }
    });

    console.log('✅ Responsive calendar setup completed');
}

/**
 * НОВА ФУНКЦИЯ: Resize календара според текущия размер на прозореца
 */
function resizeCalendar() {
    if (window.calendar && typeof window.calendar.updateSize === 'function') {
        try {
            // Принудително обновяване на размера
            window.calendar.updateSize();

            // Допълнителна проверка за правилен размер
            const calendarEl = document.getElementById('calendar');
            if (calendarEl) {
                const containerHeight = calendarEl.offsetHeight;
                const windowHeight = window.innerHeight;

                console.log(`📊 Calendar resized - Container: ${containerHeight}px, Window: ${windowHeight}px`);

                // Ако календарът е по-висок от прозореца, корригираме
                if (containerHeight > windowHeight) {
                    console.log('⚠️ Calendar height exceeds window, adjusting...');
                    adjustCalendarHeight();
                }
            }

        } catch (error) {
            console.error('❌ Error resizing calendar:', error);
        }
    } else {
        console.warn('⚠️ Calendar instance not available for resize');
    }
}

/**
 * НОВА ФУНКЦИЯ: Коригира височината на календара при нужда
 */
function adjustCalendarHeight() {
    const calendarEl = document.getElementById('calendar');
    const sidebarEl = document.getElementById('sidebar');

    if (calendarEl && sidebarEl) {
        const windowHeight = window.innerHeight;
        const sidebarHeight = sidebarEl.offsetHeight;
        const isMobile = window.innerWidth <= 768;

        let availableHeight;

        if (isMobile) {
            // На mobile: височина = екран - sidebar - padding
            availableHeight = windowHeight - sidebarHeight - 20;
        } else {
            // На desktop: височина = екран - padding
            availableHeight = windowHeight - 30;
        }

        // Задаваме максимална височина
        calendarEl.style.height = `${availableHeight}px`;
        calendarEl.style.maxHeight = `${availableHeight}px`;

        console.log(`🔧 Calendar height adjusted to ${availableHeight}px`);

        // Обновяваме календара след корекцията
        if (window.calendar) {
            setTimeout(() => {
                window.calendar.updateSize();
            }, 100);
        }
    }
}

/**
 * НОВА ФУНКЦИЯ: Обновява view на календара според размера на екрана
 */
function updateCalendarView() {
    if (!window.calendar) return;

    const windowWidth = window.innerWidth;
    const currentView = window.calendar.view.type;

    try {
        // Определяме оптималния view според ширината на екрана
        let targetView = 'dayGridMonth'; // Default

        if (windowWidth <= 480) {
            // На телефон: седмичен изглед е по-удобен
            targetView = 'listWeek';
        } else if (windowWidth <= 768) {
            // На tablet: седмичен изглед или месечен
            targetView = 'dayGridWeek';
        } else {
            // На desktop: месечен изглед
            targetView = 'dayGridMonth';
        }

        // Променяме view само ако е различен от текущия
        if (currentView !== targetView) {
            console.log(`📅 Changing calendar view from ${currentView} to ${targetView}`);
            window.calendar.changeView(targetView);
        }

    } catch (error) {
        console.error('❌ Error updating calendar view:', error);
    }
}

/**
 * НОВА ФУНКЦИЯ: Проверява дали устройството е mobile
 */
function isMobileDevice() {
    return window.innerWidth <= 768;
}

/**
 * НОВА ФУНКЦИЯ: Проверява дали устройството е в landscape режим
 */
function isLandscapeMode() {
    return window.innerWidth > window.innerHeight;
}

/**
 * НОВА ФУНКЦИЯ: Получава оптималния размер на sidebar според устройството
 */
function getOptimalSidebarWidth() {
    const windowWidth = window.innerWidth;

    if (windowWidth <= 480) {
        return '100%'; // Пълна ширина на телефон
    } else if (windowWidth <= 768) {
        return '100%'; // Пълна ширина на tablet в portrait
    } else if (windowWidth <= 1200) {
        return '280px'; // Стандартна ширина на малки desktop
    } else {
        return '320px'; // По-голяма ширина на големи desktop
    }
}

/**
 * ОБНОВЕНА ФУНКЦИЯ: Разширява sidebar-а с responsive размери
 */
function expandSidebar() {
    const sidebar = document.getElementById('sidebar');

    if (sidebar) {
        console.log('📖 Expanding sidebar with responsive sizing...');

        // Премахваме класа за свит sidebar
        sidebar.classList.remove('collapsed');

        // Задаваме оптимална ширина според устройството
        const optimalWidth = getOptimalSidebarWidth();
        if (!isMobileDevice()) {
            sidebar.style.width = optimalWidth;
            sidebar.style.minWidth = optimalWidth;
        }

        // Актуализираме toggle бутона
        updateToggleButton(false);

        // Запазваме състоянието в localStorage
        localStorage.setItem('sidebarCollapsed', 'false');

        // Възстановяваме състоянието на формите
        setTimeout(() => {
            restoreAllFormsState();
        }, 100);

        // Актуализираме размера на календара
        setTimeout(() => {
            resizeCalendar();
        }, 350);

        console.log('✅ Sidebar expanded with responsive sizing');
    }
}

/**
 * ОБНОВЕНА ФУНКЦИЯ: Свива sidebar-а с responsive размери
 */
function collapseSidebar() {
    const sidebar = document.getElementById('sidebar');

    if (sidebar) {
        console.log('📕 Collapsing sidebar with responsive sizing...');

        // Запазваме състоянието на формите
        saveAllFormsState();

        // Добавяме класа за свит sidebar
        sidebar.classList.add('collapsed');

        // Актуализираме toggle бутона
        updateToggleButton(true);

        // Запазваме състоянието в localStorage
        localStorage.setItem('sidebarCollapsed', 'true');

        // Скриваме всички отворени форми
        hideAllOpenForms();

        // Актуализираме размера на календара
        setTimeout(() => {
            resizeCalendar();
        }, 350);

        console.log('✅ Sidebar collapsed with responsive sizing');
    }
}

// НОВИ ЕКСПОРТИ: Правим новите функции достъпни глобално
window.saveAllFormsState = saveAllFormsState;
window.restoreAllFormsState = restoreAllFormsState;
window.clearAllSavedFormsState = clearAllSavedFormsState;
window.setupResponsiveCalendar = setupResponsiveCalendar;
window.resizeCalendar = resizeCalendar;
window.adjustCalendarHeight = adjustCalendarHeight;
window.updateCalendarView = updateCalendarView;
window.isMobileDevice = isMobileDevice;
window.isLandscapeMode = isLandscapeMode;
window.getOptimalSidebarWidth = getOptimalSidebarWidth;

/**
 * НОВА ФУНКЦИЯ: Уверява се че event формата е скрита при зареждане на страницата
 * Тази функция се извиква в initializeUIManager()
 */
function ensureEventFormInitialState() {
    console.log('🔒 Ensuring event form is hidden on page load...');

    // Скриваме event формата независимо от всичко друго
    const eventForm = document.getElementById('event-form');
    if (eventForm) {
        eventForm.style.display = 'none';
        console.log('✅ Event form hidden on initialization');
    }

    // Скриваме и edit event формата
    const editEventForm = document.getElementById('edit-event-form');
    if (editEventForm) {
        editEventForm.style.display = 'none';
        console.log('✅ Edit event form hidden on initialization');
    }

    // Изчистваме всички event form данни от sessionStorage при първоначално зареждане
    // (освен ако не сме в процес на възстановяване след sidebar toggle)
    const isRestoringFromSidebarToggle = sessionStorage.getItem('restoringFromSidebarToggle') === 'true';

    if (!isRestoringFromSidebarToggle) {
        sessionStorage.removeItem('eventFormData');
        sessionStorage.removeItem('editEventFormData');
        console.log('🗑️ Cleared event form data on fresh page load');
    }

    // Премахваме флага за възстановяване
    sessionStorage.removeItem('restoringFromSidebarToggle');
}