/**
 * ОБНОВЕН VALIDATION MANAGER
 * Сега работи с backend валидацията вместо frontend логика
 */

/**
 * ГЛАВНА ФУНКЦИЯ ЗА ВАЛИДАЦИЯ
 * Изпраща заявка към backend за валидация на събитието
 * @param {Object} eventData - Данните за събитието
 * @param {string} employeeId - ID на служителя
 * @param {string} originalEventId - ID на оригиналното събитие (при редактиране)
 * @returns {boolean} - true ако валидацията мине, false ако има грешки
 */
async function validateAndNotify(eventData, employeeId, originalEventId = null) {
    console.log('🔍 Starting backend validation...');
    console.log('📊 Event data for validation:', eventData);
    console.log('👤 Employee ID:', employeeId);
    console.log('🔄 Original event ID (if editing):', originalEventId);

    try {
        // Ако е leave type събитие, не валидираме (отпуските не влияят на работните часове)
        if (eventData.leaveType && eventData.leaveType.trim() !== '') {
            console.log('🏖️ Leave event detected, skipping validation');
            return true;
        }

        // Подготвяме данните за backend валидация
        const validationPayload = {
            id: originalEventId ? parseInt(originalEventId) : null,
            title: eventData.title,
            start: eventData.start,
            end: eventData.end,
            activity: eventData.activity,
            leaveType: eventData.leaveType,
            employee: {
                id: parseInt(employeeId)
            }
        };

        console.log('🚀 Sending validation request to backend:', validationPayload);

        // Изпращаме POST заявка за валидация към backend
        const response = await fetch('http://localhost:8080/api/validate/event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(validationPayload)
        });

        console.log('📡 Backend validation response status:', response.status);

        // Обработваме отговора
        const result = await response.json();
        console.log('📋 Backend validation result:', result);

        if (response.ok && result.valid) {
            // Валидацията премина успешно
            console.log('✅ Backend validation passed');
            return true;
        } else {
            // Валидацията не премина
            console.log('❌ Backend validation failed:', result.errors || [result.error]);

            // Показваме грешката/грешките
            const errors = result.errors || [result.error || 'Validation failed'];
            showValidationNotification(errors, 'error');

            return false;
        }

    } catch (error) {
        console.error('❌ Error during backend validation:', error);

        // При грешка в комуникацията с backend
        showValidationNotification(['Unable to validate schedule. Please try again.'], 'error');
        return false;
    }
}

/**
 * ФУНКЦИЯ ЗА ПОКАЗВАНЕ НА VALIDATION СЪОБЩЕНИЯ
 * Използва същия стил като drag & drop notification-ите
 * @param {Array} errors - Масив с грешки от валидацията
 * @param {string} type - Тип на съобщението ('error', 'warning', 'info')
 */
function showValidationNotification(errors, type = 'error') {
    // Ако няма грешки, не показваме нищо
    if (!errors || errors.length === 0) {
        return;
    }

    console.log('📢 Showing validation notification:', errors);

    // Създаваме съобщението - комбинираме всички грешки
    let message = errors.length === 1
        ? errors[0]
        : `Multiple validation errors:\n• ${errors.join('\n• ')}`;

    // Използваме същата notification система като drag & drop
    if (typeof showDragDropNotification === 'function') {
        showDragDropNotification(message, type);
    } else {
        // Fallback към alert ако функцията не е налична
        alert(`Validation Error:\n${message}`);
    }
}

/**
 * ОПРОСТЕНА ФУНКЦИЯ ЗА ВАЛИДАЦИЯ БЕЗ NOTIFICATION
 * Използва се когато искаме само да проверим валидацията без да показваме съобщения
 * @param {Object} eventData - Данните за събитието
 * @param {string} employeeId - ID на служителя
 * @param {string} originalEventId - ID на оригиналното събитие (при редактиране)
 * @returns {Object} - Резултат от валидацията {isValid: boolean, errors: Array}
 */
async function validateEmployeeSchedule(eventData, employeeId, originalEventId = null) {
    console.log('🔍 Starting backend validation (silent mode)...');

    try {
        // Ако е leave type събитие, не валидираме
        if (eventData.leaveType && eventData.leaveType.trim() !== '') {
            console.log('🏖️ Leave event detected, skipping validation');
            return { isValid: true, errors: [] };
        }

        // Подготвяме данните за backend валидация
        const validationPayload = {
            id: originalEventId ? parseInt(originalEventId) : null,
            title: eventData.title,
            start: eventData.start,
            end: eventData.end,
            activity: eventData.activity,
            leaveType: eventData.leaveType,
            employee: {
                id: parseInt(employeeId)
            }
        };

        console.log('🚀 Sending silent validation request to backend:', validationPayload);

        // Изпращаме POST заявка за валидация към backend
        const response = await fetch('http://localhost:8080/api/validate/event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(validationPayload)
        });

        // Обработваме отговора
        const result = await response.json();
        console.log('📋 Backend validation result (silent):', result);

        if (response.ok && result.valid) {
            // Валидацията премина успешно
            console.log('✅ Backend validation passed (silent)');
            return { isValid: true, errors: [] };
        } else {
            // Валидацията не премина
            console.log('❌ Backend validation failed (silent):', result.errors || [result.error]);

            const errors = result.errors || [result.error || 'Validation failed'];
            return { isValid: false, errors: errors };
        }

    } catch (error) {
        console.error('❌ Error during backend validation (silent):', error);
        return { isValid: false, errors: ['Unable to validate schedule. Please try again.'] };
    }
}

/**
 * DUMMY ФУНКЦИИ ЗА СЪВМЕСТИМОСТ
 * Тези функции се запазват за съвместимост с кода, но вече не се използват
 */
async function getEmployeeEvents(employeeId) {
    console.warn('⚠️ getEmployeeEvents is deprecated - validation is now handled by backend');
    return [];
}

function calculateEventDuration(startTime, endTime) {
    console.warn('⚠️ calculateEventDuration is deprecated - validation is now handled by backend');
    return 0;
}

function getWeekStart(date) {
    console.warn('⚠️ getWeekStart is deprecated - validation is now handled by backend');
    return new Date();
}

function getWeekEnd(date) {
    console.warn('⚠️ getWeekEnd is deprecated - validation is now handled by backend');
    return new Date();
}

// Експортираме функциите за използване в други модули
window.validateEmployeeSchedule = validateEmployeeSchedule;
window.validateAndNotify = validateAndNotify;
window.showValidationNotification = showValidationNotification;

// Запазваме dummy функциите за съвместимост
window.getEmployeeEvents = getEmployeeEvents;
window.calculateEventDuration = calculateEventDuration;
window.getWeekStart = getWeekStart;
window.getWeekEnd = getWeekEnd;