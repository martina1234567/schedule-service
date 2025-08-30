/**
 * Event Management Module - ПОПРАВЕНА ВЕРСИЯ БЕЗ TITLE ДУБЛИРАНЕ
 * Handles event creation, editing, and form management for calendar events
 * ОБНОВЕН: Включва copy режим, правилен datetime формат и седмична таблица актуализация
 */

/**
 * Initializes event management functionality
 * Sets up form handlers and leave type interactions
 */
function initializeEventManager() {
    console.log('📋 Event Manager starting initialization...');

    try {
        setupEventFormHandlers();
        setupLeaveTypeHandlers();
        setupEditFormHandlers();
        console.log('✅ Event Manager initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing Event Manager:', error);
        throw error;
    }
}

/**
 * Sets up event handlers for the main event creation form
 */
function setupEventFormHandlers() {
    const form = document.getElementById('event-form');

    if (!form) {
        console.error('❌ Event form not found!');
        return;
    }

    // Handle form submission for creating new events
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('📝 Event form submitted');
        handleEventCreation(); // Async function
    });

    console.log('✅ Event form handlers set up');
}

/**
 * Sets up handlers for leave type selection and related UI changes
 */
function setupLeaveTypeHandlers() {
    const leaveTypeInput = document.getElementById('leaveType');
    const startInput = document.getElementById('start-time');
    const endInput = document.getElementById('end-time');
    const activityInput = document.getElementById('activityInput');

    if (!leaveTypeInput || !startInput || !endInput || !activityInput) {
        console.error('❌ Some leave type form elements not found');
        return;
    }

    // Handle leave type selection changes
    leaveTypeInput.addEventListener('change', function() {
        const isLeave = leaveTypeInput.value !== "";

        // Disable/enable time and activity inputs based on leave selection
        startInput.disabled = isLeave;
        endInput.disabled = isLeave;
        activityInput.disabled = isLeave;

        if (isLeave) {
            // Set default values for leave days
            startInput.value = "00:00";
            endInput.value = "00:00";
            activityInput.value = "";
        } else {
            // Clear values for manual input
            startInput.value = "";
            endInput.value = "";
            activityInput.value = "";
        }
    });

    console.log('✅ Leave type handlers set up');
}

/**
 * Sets up handlers for the event editing form
 */
function setupEditFormHandlers() {
    const saveEditBtn = document.getElementById('save-edit-btn');

    if (!saveEditBtn) {
        console.error('❌ Save edit button not found');
        return;
    }

    // Handle edit form submission
    saveEditBtn.addEventListener('click', function(event) {
        event.preventDefault();
        console.log('✏️ Edit form submitted');
        handleEventUpdate(); // Async function
    });

    console.log('✅ Edit form handlers set up');
}

/**
 * ГЛАВНА ФУНКЦИЯ ЗА СЪЗДАВАНЕ НА СЪБИТИЯ
 * Поддържа COPY MODE и нормално създаване с правилен datetime формат
 */
async function handleEventCreation() {
    console.log('📝 Starting event creation process...');

    try {
        // Проверяваме дали сме в copy режим
        const isCopyingEventInput = document.getElementById('is-copying-event');
        const copyFromEventIdInput = document.getElementById('copy-from-event-id');
        const isCopyMode = isCopyingEventInput && isCopyingEventInput.value === 'true';
        const sourceEventId = copyFromEventIdInput ? copyFromEventIdInput.value : '';

        if (isCopyMode) {
            console.log('📋 Creating event in COPY MODE');
            console.log('📋 Source event ID:', sourceEventId);
        } else {
            console.log('📝 Creating event in NORMAL MODE');
        }

        // Получаваме избрания служител
        const employeeSelect = document.getElementById('employeeSelect');
        const employeeId = employeeSelect.value.trim();

        if (!employeeId) {
            alert('Please select an employee first.');
            console.log('❌ No employee selected');
            return;
        }

        // Получаваме данните от формата
        const selectedDate = document.getElementById('selected-date').value;
        const startTime = document.getElementById('start-time').value;
        const endTime = document.getElementById('end-time').value;
        const activity = document.getElementById('activityInput').value;
        const leaveType = document.getElementById('leaveType').value;

        // Валидация на задължителните полета
        if (!selectedDate) {
            alert('Please select a date.');
            console.log('❌ No date selected');
            return;
        }

        // Различна валидация за работни смени и отпуски
        if (leaveType) {
            console.log('📅 Creating leave event:', leaveType);
        } else {
            // За работни смени проверяваме часове и активност
            if (!startTime || !endTime) {
                alert('Please enter both start and end times for work shifts.');
                console.log('❌ Missing time information for work shift');
                return;
            }

            if (!activity) {
                alert('Please select an activity for work shifts.');
                console.log('❌ No activity selected for work shift');
                return;
            }

            // Проверка за валидни часове
            if (startTime >= endTime) {
                alert('End time must be after start time.');
                console.log('❌ Invalid time range');
                return;
            }

            // ВАЛИДАЦИЯ НА РАБОТНИТЕ ЧАСОВЕ (ако функцията съществува)
            if (typeof validateWorkingHours === 'function') {
                console.log('⏰ Validating working hours...');
                const validationResult = await validateWorkingHours(employeeId, selectedDate, startTime, endTime, activity);

                if (!validationResult.isValid) {
                    alert(validationResult.message);
                    console.log('❌ Working hours validation failed:', validationResult.message);
                    return;
                }
                console.log('✅ Working hours validation passed');
            }
        }

        // Подготовка на данните за backend - ПРАВИЛЕН ФОРМАТ
        let startDateTime, endDateTime;

        if (leaveType) {
            // За отпуски задаваме времето на 00:00
            startDateTime = formatDateTimeForApi(selectedDate, '00:00');
            endDateTime = formatDateTimeForApi(selectedDate, '00:00');
        } else {
            // За работни смени използваме реалните часове
            startDateTime = formatDateTimeForApi(selectedDate, startTime);
            endDateTime = formatDateTimeForApi(selectedDate, endTime);
        }

        // ПОПРАВЕНА ЛОГИКА ЗА TITLE - БЕЗ ДУБЛИРАНЕ
        const employeeName = employeeSelect.options[employeeSelect.selectedIndex].text;
        const firstName = employeeName.split(' ')[0]; // Извличаме само първото име

        // ВИНАГИ използваме само чистото първо име (за да избегнем дублиране)
        const eventTitle = firstName;

        console.log('👤 Event title will be:', eventTitle);
        console.log('📋 Copy mode:', isCopyMode ? 'YES' : 'NO');

        const eventData = {
            title: eventTitle,
            start: startDateTime,
            end: endDateTime,
            activity: leaveType ? null : activity,
            leaveType: leaveType || null,
            employee: {
                id: parseInt(employeeId)
            }
        };

        console.log('📦 Event data prepared for backend:', eventData);
        console.log('🕐 Formatted start time:', startDateTime);
        console.log('🕐 Formatted end time:', endDateTime);

        // Изпращане към backend
        console.log('📡 Sending event data to backend...');

        const response = await fetch('http://localhost:8080/events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(eventData)
        });

        console.log('📡 Backend response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Backend error response:', errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const newEvent = await response.json();
        console.log('✅ Event created successfully:', newEvent);

        // Добавяме събитието в календара
        if (window.calendar) {
            const calendarEvent = {
                id: newEvent.id,
                title: newEvent.title,
                start: newEvent.start,
                end: newEvent.end,
                backgroundColor: newEvent.backgroundColor,
                borderColor: newEvent.borderColor,
                textColor: newEvent.textColor,
                extendedProps: {
                    employeeId: newEvent.employeeId,
                    activity: newEvent.activity,
                    leaveType: newEvent.leaveType,
                    employeeName: newEvent.employeeName
                }
            };

            // Рефрешваме календара (зарежда отново от backend)
            window.calendar.refetchEvents();
            console.log('📅 Event added to calendar');
        } else {
            console.warn('⚠️ Calendar not available - page may need refresh');
        }

        // Обновяваме седмичната таблица (ако функцията съществува)
        if (typeof refreshWeeklyScheduleForEmployee === 'function') {
            console.log('🔄 Refreshing weekly schedule...');
            await refreshWeeklyScheduleForEmployee(employeeId);
            console.log('✅ Weekly schedule updated');
        }

        // Показваме success съобщение
        if (isCopyMode) {
            alert('✅ New shift created successfully from copied data!');
            console.log('🎉 Copy mode event creation completed successfully');
        } else {
            alert('✅ Event created successfully!');
            console.log('🎉 Normal event creation completed successfully');
        }

        // Изчистваме формата
        clearFormAfterSuccess();

    } catch (error) {
        console.error('❌ Error creating event:', error);
        alert(`Error creating event: ${error.message}`);
    }
}

/**
 * ПОМОЩНА ФУНКЦИЯ: Форматира дата и час за API заявки
 * @param {string} dateStr - Date string във формат YYYY-MM-DD
 * @param {string} timeStr - Time string във формат HH:MM
 * @returns {string} Форматиран datetime string за API (YYYY-MM-DD HH:MM:SS)
 */
function formatDateTimeForApi(dateStr, timeStr) {
    const [year, month, day] = dateStr.split('-');
    const [hours, minutes] = timeStr.split(':');

    // Връщаме във формат: YYYY-MM-DD HH:MM:SS (с интервал, не с T)
    return `${year}-${month}-${day} ${hours}:${minutes}:00`;
}

/**
 * ФУНКЦИЯ ЗА ОБНОВЯВАНЕ НА СЪБИТИЯ
 * Използва същата логика за datetime форматиране
 */
async function handleEventUpdate() {
    console.log('🔄 Starting event update process...');

    try {
        // Получаваме данните от формата
        const eventId = document.getElementById('edit-event-id').value;
        const startInput = document.getElementById('edit-start-time');
        const endInput = document.getElementById('edit-end-time');
        const activityInput = document.getElementById('edit-activity');
        const date = document.getElementById('current-event-date').value;

        const startTime = startInput.value;
        const endTime = endInput.value;
        const activity = activityInput.value;

        console.log("📝 Updating event with data:", {
            eventId: eventId,
            startTime: startTime,
            endTime: endTime,
            activity: activity,
            date: date
        });

        // Основна валидация
        if (!startTime || !endTime) {
            alert('Please fill in start and end time.');
            return;
        }

        if (startTime >= endTime) {
            alert('End time must be after start time.');
            return;
        }

        // Форматираме datetime strings за API с правилния формат
        const start = formatDateTimeForApi(date, startTime);
        const end = formatDateTimeForApi(date, endTime);

        console.log('🕐 Formatted update start time:', start);
        console.log('🕑 Formatted update end time:', end);

        // Създаваме update payload
        const updateData = {
            id: eventId,
            start: start,
            end: end,
            activity: activity || null,
            leaveType: null // Edit формата не поддържа leave types
        };

        console.log('📦 Update data prepared:', updateData);

        // Изпращаме PUT заявка към backend
        const response = await fetch(`http://localhost:8080/events/${eventId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData)
        });

        console.log('📡 Update response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Backend update error:', errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const updatedEvent = await response.json();
        console.log('✅ Event updated successfully:', updatedEvent);

        // Актуализираме събитието в календара
        if (window.calendar) {
            const calendarEvent = window.calendar.getEventById(eventId);
            if (calendarEvent) {
                calendarEvent.setProp('title', updatedEvent.title);
                calendarEvent.setStart(updatedEvent.start);
                calendarEvent.setEnd(updatedEvent.end);
                calendarEvent.setExtendedProp('activity', updatedEvent.activity);
                calendarEvent.setExtendedProp('leaveType', updatedEvent.leaveType);
                console.log('📅 Calendar event updated');
            }
        }

        // Обновяваме седмичната таблица
        const employeeSelect = document.getElementById('employeeSelect');
        const employeeId = employeeSelect ? employeeSelect.value.trim() : null;

        if (typeof refreshWeeklyScheduleForEmployee === 'function' && employeeId) {
            console.log('🔄 Refreshing weekly schedule after update...');
            await refreshWeeklyScheduleForEmployee(employeeId);
            console.log('✅ Weekly schedule updated after event update');
        }

        // Скриваме edit формата
        document.getElementById('edit-event-form').style.display = 'none';

        // Показваме success notification
        if (typeof showDragDropNotification === 'function') {
            showDragDropNotification('Event updated successfully!', 'success');
        } else {
            alert('Event updated successfully!');
        }

        console.log('🎉 Event update completed with all UI updates');

    } catch (error) {
        console.error('❌ Error updating event:', error);

        // Показваме error notification
        if (typeof showDragDropNotification === 'function') {
            showDragDropNotification(`Error updating event: ${error.message}`, 'error');
        } else {
            alert(`Error updating event: ${error.message}`);
        }
    }
}

/**
 * Изчиства формата и copy режима след успешно създаване
 */
function clearFormAfterSuccess() {
    console.log('🧹 Clearing form after successful creation...');

    // Изчистваме copy режима (ако е активиран)
    if (typeof clearCopyMode === 'function') {
        clearCopyMode();
    }

    // Скриваме формата
    const eventForm = document.getElementById('event-form');
    if (eventForm) {
        eventForm.style.display = 'none';
        console.log('🔒 Event form hidden');
    }

    // Изчистваме всички полета
    const startTimeInput = document.getElementById('start-time');
    const endTimeInput = document.getElementById('end-time');
    const activityInput = document.getElementById('activityInput');
    const leaveTypeInput = document.getElementById('leaveType');
    const selectedDateInput = document.getElementById('selected-date');

    if (startTimeInput) {
        startTimeInput.value = '';
        startTimeInput.disabled = false;
    }
    if (endTimeInput) {
        endTimeInput.value = '';
        endTimeInput.disabled = false;
    }
    if (activityInput) {
        activityInput.value = '';
        activityInput.disabled = false;
    }
    if (leaveTypeInput) leaveTypeInput.value = '';
    if (selectedDateInput) selectedDateInput.value = '';

    console.log('✅ Form cleared successfully');
}

/**
 * Resets the main event creation form to its initial state
 */
function resetEventForm() {
    const form = document.getElementById('event-form');
    if (form) {
        form.reset(); // Reset all form fields
        form.style.display = 'none'; // Hide the form
    }
}

/**
 * Opens the edit form with pre-populated data
 * @param {Object} eventData - Event data object
 */
function openEditForm(eventData) {
    const startDateTime = new Date(eventData.start);
    const endDateTime = new Date(eventData.end);

    // Populate edit form fields
    document.getElementById('edit-event-id').value = eventData.id;
    document.getElementById('edit-start-time').value = startDateTime.toTimeString().slice(0, 5);
    document.getElementById('edit-end-time').value = endDateTime.toTimeString().slice(0, 5);
    document.getElementById('edit-activity').value = eventData.extendedProps?.activity || "";

    // Extract date only (guaranteed correct format)
    const dateOnly = startDateTime.toISOString().split('T')[0];
    document.getElementById('current-event-date').value = dateOnly;

    // Show the edit form
    document.getElementById('edit-event-form').style.display = "block";
}

/**
 * Отменя редактирането на събитие без да запазва промените
 */
function cancelEventEditForm() {
    console.log("❌ Cancelling event edit form...");

    // Проверяваме дали има несъхранени промени
    const hasUnsavedChanges = checkForUnsavedEventChanges();

    if (hasUnsavedChanges) {
        const confirmCancel = confirm("Are you sure you want to cancel? Any unsaved changes will be lost.");

        if (!confirmCancel) {
            console.log("📝 User chose to continue editing");
            return; // Потребителят избра да продължи редактирането
        }
    }
    // Показваме обратно employee select elements
    const employeeSelect = document.getElementById('employeeSelect');
    const selectLabel = document.querySelector('label[for="employeeSelect"]');

    if (employeeSelect) employeeSelect.classList.remove('hidden');
    if (selectLabel) selectLabel.classList.remove('hidden');

    // Потребителят потвърди отмяната или няма несъхранени промени
    console.log("✅ Cancelling edit form confirmed");
    resetEventEditForm();
}

/**
 * Проверява дали има несъхранени промени в edit формата
 */
function checkForUnsavedEventChanges() {
    // Тази функция може да се имплементира ако е нужна
    // За сега връщаме false
    return false;
}

/**
 * Възстановява edit формата в първоначалното й състояние
 */
function resetEventEditForm() {
    console.log("🔄 Resetting event edit form...");

    // Скриваме формата
    const editEventForm = document.getElementById('edit-event-form');
    if (editEventForm) {
        editEventForm.style.display = 'none';
    }

    // Изчистваме полетата
    const editEventId = document.getElementById('edit-event-id');
    const editStartTime = document.getElementById('edit-start-time');
    const editEndTime = document.getElementById('edit-end-time');
    const editActivity = document.getElementById('edit-activity');
    const currentEventDate = document.getElementById('current-event-date');

    if (editEventId) editEventId.value = '';
    if (editStartTime) editStartTime.value = '';
    if (editEndTime) editEndTime.value = '';
    if (editActivity) editActivity.value = '';
    if (currentEventDate) currentEventDate.value = '';

    console.log("✅ Event edit form reset completed");
}

/**
 * ОБЩА ФУНКЦИЯ ЗА ИЗТРИВАНЕ НА СЪБИТИЕ
 * @param {string} eventId - ID на събитието за изтриване
 */
function deleteEventById(eventId) {
    console.log(`🗑️ Deleting event with ID: ${eventId}`);

    // Потвърждение за изтриване
    if (!confirm("Are you sure you want to delete this event?")) {
        console.log("❌ Event deletion cancelled by user");
        return;
    }

    fetch(`http://localhost:8080/events/${eventId}`, {
        method: 'DELETE'
    })
    .then(response => {
        console.log('📡 Delete response status:', response.status);

        if (response.ok) {
            // Премахване от FullCalendar
            const calendarEvent = window.calendar.getEventById(eventId);
            if (calendarEvent) {
                calendarEvent.remove();
                console.log('📅 Event removed from calendar');
            }

            // Обновяваме седмичната таблица
            const employeeSelect = document.getElementById('employeeSelect');
            const employeeId = employeeSelect.value.trim();

            if (typeof refreshWeeklyScheduleForEmployee === 'function' && employeeId) {
                refreshWeeklyScheduleForEmployee(employeeId)
                    .then(() => console.log('✅ Weekly schedule updated after deletion'))
                    .catch(error => console.error('❌ Error updating weekly schedule:', error));
            }

            // Скриваме edit формата ако е отворена
            const editForm = document.getElementById('edit-event-form');
            if (editForm) {
                editForm.style.display = 'none';
            }

            alert("✅ Event deleted successfully!");
            console.log('🎉 Event deletion completed successfully');
        } else {
            alert("⚠️ Failed to delete event.");
            console.error('❌ Failed to delete event, status:', response.status);
        }
    })
    .catch(error => {
        console.error("❌ Error deleting event:", error);
        alert("⚠️ An error occurred while deleting the event.");
    });
}

/**
 * Remove събитие от формата - използва общата логика
 */
function removeEventFromForm() {
    console.log("🗑️ Remove button clicked from edit form");

    // Получаваме event ID от скритото поле в формата
    const eventId = document.getElementById('edit-event-id').value;

    if (!eventId) {
        console.error("❌ No event ID found in form");
        alert("Error: No event selected for removal.");
        return;
    }

    // Използваме общата функция
    deleteEventById(eventId);
}

/**
 * Показва edit и delete бутоните
 */
function showEditDeleteButtons() {
    // Проверяваме дали има скрити бутони и ги показваме
    if (window.currentlyVisibleEditButton) {
        window.currentlyVisibleEditButton.style.display = 'inline-block';
        console.log('👁️ Edit button shown again');
    }
    if (window.currentlyVisibleDeleteButton) {
        window.currentlyVisibleDeleteButton.style.display = 'inline-block';
        console.log('👁️ Delete button shown again');
    }
}

/**
 * НОВА ФУНКЦИЯ: Актуализира седмичната таблица след drag & drop операция
 * @param {string} employeeId - ID на служителя
 */
async function updateWeeklyScheduleAfterDragDrop(employeeId) {
    if (typeof refreshWeeklyScheduleForEmployee === 'function' && employeeId) {
        try {
            console.log('🔄 Refreshing weekly schedule after drag & drop...');
            await refreshWeeklyScheduleForEmployee(employeeId);
            console.log('✅ Weekly schedule updated successfully after drag & drop');
        } catch (error) {
            console.error('❌ Error updating weekly schedule after drag & drop:', error);
        }
    } else {
        console.warn('⚠️ Cannot update weekly schedule - function not available or no employee ID');
    }
}

// ========================================
// ЕКСПОРТИРАНЕ НА ФУНКЦИИТЕ
// Export functions for global use
// ========================================

// Експортираме веднага след дефинициите
window.initializeEventManager = initializeEventManager;
window.handleEventCreation = handleEventCreation;
window.handleEventUpdate = handleEventUpdate;
window.clearFormAfterSuccess = clearFormAfterSuccess;
window.formatDateTimeForApi = formatDateTimeForApi;
window.openEditForm = openEditForm;
window.cancelEventEditForm = cancelEventEditForm;
window.checkForUnsavedEventChanges = checkForUnsavedEventChanges;
window.resetEventEditForm = resetEventEditForm;
window.showEditDeleteButtons = showEditDeleteButtons;
window.deleteEventById = deleteEventById;
window.removeEventFromForm = removeEventFromForm;
window.updateWeeklyScheduleAfterDragDrop = updateWeeklyScheduleAfterDragDrop;

// Debug log за проверка
console.log('🔧 Event Manager functions exported:');
console.log('- initializeEventManager:', typeof window.initializeEventManager);
console.log('- handleEventCreation:', typeof window.handleEventCreation);
console.log('- handleEventUpdate:', typeof window.handleEventUpdate);
console.log('- formatDateTimeForApi:', typeof window.formatDateTimeForApi);

// Debug: Потвърждаваме че файлът е зареден
console.log('✅ eventManager.js loaded successfully without title duplication issue!');