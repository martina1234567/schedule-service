/**
 * ========================================
 * FIXED DRAG TO FORM MANAGER (v3)
 * ========================================
 *
 * ГЛАВНИ ПОПРАВКИ:
 * 1. Фиксиран проблем с формата на датите (string vs Date object)
 * 2. Подобрена обработка на конфликти между drag системите
 * 3. Добавена robust валидация на данните
 * 4. Подобрена синхронизация между календар и форма
 *
 * ПРОБЛЕМИ КОИТО СА РЕШЕНИ:
 * - Блокиране при влачене на смяна до формата
 * - Непопълване на полетата за час
 * - Конфликт между нормалното drag & drop и drag-to-form
 */

// ========================================
// ГЛОБАЛНИ ПРОМЕНЛИВИ ЗА DRAG-TO-FORM
// ========================================
let isDragToFormActive = false;        // Флаг дали сме в drag-to-form режим
let draggedEventData = null;           // Данните на събитието което се влачи
let originalEventPosition = null;      // Оригиналната позиция на събитието
let formDropZones = [];               // Масив с drop zone елементите
let isFormDragInProgress = false;     // НОВА ПРОМЕНЛИВА: Предотвратява конфликти

console.log('🔧 FIXED Drag to Form Manager (v3) initializing...');

// ========================================
// ОСНОВНА ИНИЦИАЛИЗАЦИЯ
// ========================================
function initializeDragToFormManager() {
    console.log('🚀 Initializing FIXED drag-to-form manager...');

    // Настройваме drop зоните за формата
    setupFormDropZones();

    // Настройваме keyboard shortcuts
    setupKeyboardShortcuts();

    // НОВО: Настройваме наблюдение за календарни събития
    setupCalendarEventObserver();

    console.log('✅ FIXED Drag-to-form manager initialized successfully');
}

// ========================================
// НОВА ФУНКЦИЯ: НАБЛЮДЕНИЕ НА КАЛЕНДАРНИ СЪБИТИЯ
// ========================================
function setupCalendarEventObserver() {
    console.log('👁️ Setting up calendar event observer for drag detection...');

    // Чакаме календарът да се зареди
    const checkCalendar = setInterval(() => {
        if (window.calendar) {
            console.log('📅 Calendar found, setting up event observers');

            // Добавяме глобален listener за calendar drag операции
            setupCalendarDragListeners();

            clearInterval(checkCalendar);
        }
    }, 100);

    // Cleanup след 10 секунди ако календарът не се зареди
    setTimeout(() => {
        clearInterval(checkCalendar);
    }, 10000);
}

// ========================================
// НОВА ФУНКЦИЯ: НАСТРОЙКА НА CALENDAR DRAG LISTENERS
// ========================================
function setupCalendarDragListeners() {
    console.log('🎯 Setting up calendar drag listeners...');

    // ВАЖНО: Използваме MutationObserver за да засечем drag операции
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            // Търсим нови елементи с класа за drag
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1 && node.classList) {
                    // Засичаме започване на drag операция
                    if (node.classList.contains('fc-event-dragging')) {
                        console.log('🖱️ Drag start detected via observer');
                        const eventEl = node;
                        const eventData = extractEventDataFromElement(eventEl);

                        if (eventData) {
                            console.log('📊 Event data extracted for drag:', eventData);
                            handleDragToFormStart({ event: eventData });
                            isFormDragInProgress = true; // НОВО: Маркираме че е в ход drag операция
                        }
                    }
                }
            });

            // Засичаме завършване на drag операция
            mutation.removedNodes.forEach(function(node) {
                if (node.nodeType === 1 && node.classList && node.classList.contains('fc-event-dragging')) {
                    if (isFormDragInProgress) {
                        console.log('🖱️ Drag stop detected via observer');
                        handleDragToFormStop({});
                        isFormDragInProgress = false; // НОВО: Приключваме drag операцията
                    }
                }
            });
        });
    });

    // НОВО: Наблюдаваме по-широк контейнер за по-добро засичане
    const observationTargets = [
        document.getElementById('calendar'),
        document.body // Fallback за случаи когато календарът се мести
    ];

    observationTargets.forEach(target => {
        if (target) {
            observer.observe(target, {
                childList: true,
                subtree: true
            });
            console.log('✅ Observer set up for:', target.id || 'body');
        }
    });
}

// ========================================
// ПОДОБРЕНА ФУНКЦИЯ: ИЗВЛИЧАНЕ НА EVENT DATA ОТ DOM ЕЛЕМЕНТ
// ========================================
function extractEventDataFromElement(eventEl) {
    console.log('🔍 Extracting event data from DOM element...');

    try {
        // МЕТОД 1: Опитваме се да намерим event ID от data attributes
        const eventId = eventEl.dataset.eventId || eventEl.getAttribute('data-event-id');

        if (eventId && window.calendar) {
            const calendarEvent = window.calendar.getEventById(eventId);
            if (calendarEvent) {
                console.log('✅ Found event by ID:', eventId);
                return parseCalendarEventData(calendarEvent); // НОВО: Парсираме данните правилно
            }
        }

        // МЕТОД 2: Търсим в текста на елемента (fallback)
        const titleEl = eventEl.querySelector('.fc-event-title');
        if (titleEl) {
            const title = titleEl.textContent.trim();
            console.log('📋 Searching by title:', title);

            // Търсим събитието по заглавие
            const allEvents = window.calendar.getEvents();
            const matchingEvent = allEvents.find(e => e.title === title);

            if (matchingEvent) {
                console.log('✅ Found event by title match');
                return parseCalendarEventData(matchingEvent); // НОВО: Парсираме данните правилно
            }
        }

        console.warn('⚠️ Could not extract event data from element');
        return null;

    } catch (error) {
        console.error('❌ Error extracting event data from element:', error);
        return null;
    }
}

// ========================================
// НОВА ФУНКЦИЯ: ПРАВИЛНО ПАРСИРАНЕ НА КАЛЕНДАРНИ ДАННИ
// ========================================
function parseCalendarEventData(calendarEvent) {
    console.log('🔧 Parsing calendar event data:', calendarEvent);

    try {
        // ВАЖНО: Обработваме различните формати на дати
        const startDate = parseEventDate(calendarEvent.start);
        const endDate = parseEventDate(calendarEvent.end);

        console.log('📅 Parsed dates:', {
            original_start: calendarEvent.start,
            parsed_start: startDate,
            original_end: calendarEvent.end,
            parsed_end: endDate
        });

        // Създаваме стандартизиран обект с данни
        const eventData = {
            id: calendarEvent.id,
            title: calendarEvent.title,
            start: startDate,    // НОВО: Винаги Date object
            end: endDate,        // НОВО: Винаги Date object
            activity: calendarEvent.extendedProps?.activity || '',
            leaveType: calendarEvent.extendedProps?.leaveType || '',
            employeeId: calendarEvent.extendedProps?.employeeId || '',
            employeeName: calendarEvent.extendedProps?.employeeName || calendarEvent.title
        };

        console.log('✅ Parsed event data:', eventData);
        return eventData;

    } catch (error) {
        console.error('❌ Error parsing calendar event data:', error);
        return null;
    }
}

// ========================================
// НОВА ФУНКЦИЯ: УНИВЕРСАЛНО ПАРСИРАНЕ НА ДАТИ
// ========================================
function parseEventDate(dateInput) {
    console.log('📅 Parsing date input:', dateInput, typeof dateInput);

    // Ако е вече Date object, връщаме го директно
    if (dateInput instanceof Date) {
        return dateInput;
    }

    // Ако е string, опитваме се да го парсираме
    if (typeof dateInput === 'string') {
        // Обработваме различните формати от backend
        // Формати: "2024-07-29 08:00:00", "2024-07-29T08:00:00", "2024-07-29"

        let parsedDate;

        // Ако има "T", заменяме го с интервал за по-добро парсиране
        if (dateInput.includes('T')) {
            parsedDate = new Date(dateInput.replace('T', ' '));
        } else {
            parsedDate = new Date(dateInput);
        }

        // Проверяваме дали датата е валидна
        if (!isNaN(parsedDate.getTime())) {
            console.log('✅ Successfully parsed string date:', dateInput, '->', parsedDate);
            return parsedDate;
        }
    }

    // Ако нищо не работи, връщаме текущата дата
    console.warn('⚠️ Could not parse date, using current date:', dateInput);
    return new Date();
}

// ========================================
// DRAG START/STOP HANDLERS (ПОДОБРЕНИ)
// ========================================
function handleDragToFormStart(info) {
    const event = info.event;

    console.log('📊 FIXED Drag to form - capturing event data:', event.title);

    // НОВО: Проверяваме дали вече не сме в drag режим
    if (isDragToFormActive) {
        console.log('⚠️ Already in drag mode, ignoring...');
        return;
    }

    // Запазваме оригиналната позиция (с проверка за валидност)
    if (event.start && event.end) {
        originalEventPosition = {
            start: parseEventDate(event.start), // НОВО: Парсираме правилно
            end: parseEventDate(event.end)     // НОВО: Парсираме правилно
        };
    }

    // НОВО: Използваме подобрената функция за парсиране на данните
    draggedEventData = parseCalendarEventData(event);

    if (!draggedEventData) {
        console.error('❌ Failed to parse event data for drag');
        return;
    }

    console.log('📋 FIXED Event data captured for drag-to-form:', draggedEventData);

    // Активираме drag-to-form режима
    isDragToFormActive = true;

    // Показваме визуалните индикатори
    showDragToFormIndicators();
}

function handleDragToFormStop(info) {
    console.log('🖱️ FIXED Drag to form - stopping drag operation');

    // НОВО: Малка пауза за да има време drop-ът да се обработи
    setTimeout(() => {
        if (isDragToFormActive) {
            console.log('🧹 Cleaning up FIXED drag-to-form state');
            isDragToFormActive = false;
            draggedEventData = null;
            originalEventPosition = null;
            isFormDragInProgress = false; // НОВО: Почистваме флага
            hideDragToFormIndicators();
        }
    }, 200); // НОВО: Увеличено време за по-надеждно почистване
}

// ========================================
// SETUP DROP ЗОНИ (БЕЗ ПРОМЯНА)
// ========================================
function setupFormDropZones() {
    console.log('🎯 Setting up FIXED drop zones...');

    const dropZoneSelectors = [
        '#event-form',
        '#event-form-container',
        '#form-drag-zone'
    ];

    formDropZones = [];

    dropZoneSelectors.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
            setupElementAsDropZone(element);
            formDropZones.push(element);
            console.log(`✅ FIXED Drop zone: ${selector}`);
        } else {
            console.warn(`⚠️ Drop zone not found: ${selector}`);
        }
    });

    console.log(`✅ ${formDropZones.length} FIXED drop zones configured`);
}

function setupElementAsDropZone(element) {
    // Премахваме стари listeners (ако има)
    element.removeEventListener('dragover', handleFormDragOver);
    element.removeEventListener('dragenter', handleFormDragEnter);
    element.removeEventListener('dragleave', handleFormDragLeave);
    element.removeEventListener('drop', handleFormDrop);

    // Добавяме новите listeners
    element.addEventListener('dragover', handleFormDragOver);
    element.addEventListener('dragenter', handleFormDragEnter);
    element.addEventListener('dragleave', handleFormDragLeave);
    element.addEventListener('drop', handleFormDrop);

    element.style.position = 'relative';
}

// ========================================
// DROP EVENT HANDLERS (ПОДОБРЕНИ)
// ========================================
function handleFormDragOver(event) {
    // НОВО: Проверяваме дали сме в правилния режим
    if (!isDragToFormActive || !isFormDragInProgress) return;

    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
}

function handleFormDragEnter(event) {
    // НОВО: Проверяваме дали сме в правилния режим
    if (!isDragToFormActive || !draggedEventData || !isFormDragInProgress) return;

    event.preventDefault();
    console.log('📋 FIXED Drag entered form area');

    showFormDropIndicator();
    event.currentTarget.classList.add('drag-over');
}

function handleFormDragLeave(event) {
    // НОВО: Проверяваме за правилно напускане на зоната
    if (!event.currentTarget.contains(event.relatedTarget)) {
        console.log('📋 FIXED Drag left form area');
        hideFormDropIndicator();
        event.currentTarget.classList.remove('drag-over');
    }
}

function handleFormDrop(event) {
    event.preventDefault();

    console.log('📋 🎯 FIXED EVENT DROPPED ON FORM!');

    // НОВО: Допълнителни проверки за валидност
    if (!isDragToFormActive || !draggedEventData || !isFormDragInProgress) {
        console.warn('⚠️ FIXED No valid drag data available');
        return;
    }

    try {
        // ВАЖНО: Спираме calendar drag операцията
        if (window.calendar && originalEventPosition) {
            const calendarEvent = window.calendar.getEventById(draggedEventData.id);
            if (calendarEvent) {
                // Връщаме събитието на оригиналната позиция
                calendarEvent.setStart(originalEventPosition.start);
                calendarEvent.setEnd(originalEventPosition.end);
                console.log('↩️ FIXED Event returned to original position');
            }
        }

        // НОВО: Копираме данните с подобрена функция
        copyEventDataToFormFixed(draggedEventData);

        // Показваме формата в copy режим
        showEventFormInCopyMode();

        // Success notification
        if (typeof showDragDropNotification === 'function') {
            showDragDropNotification('✅ Shift details copied to form!', 'success');
        } else {
            console.log('✅ FIXED Shift details copied to form!');
            alert('✅ Данните са копирани в формата!');
        }

        console.log('🎉 FIXED DRAG-TO-FORM SUCCESSFUL!');

    } catch (error) {
        console.error('❌ FIXED Error copying event data:', error);

        if (typeof showDragDropNotification === 'function') {
            showDragDropNotification('❌ Error copying shift details', 'error');
        } else {
            alert('❌ Грешка при копиране на данните');
        }
    } finally {
        // Почистваме UI
        hideFormDropIndicator();
        event.currentTarget.classList.remove('drag-over');

        // Деактивираме drag-to-form режима
        isDragToFormActive = false;
        draggedEventData = null;
        originalEventPosition = null;
        isFormDragInProgress = false; // НОВО: Почистваме флага
    }
}

// ========================================
// НОВА ПОДОБРЕНА ФУНКЦИЯ: КОПИРАНЕ НА ДАННИ В ФОРМАТА
// ========================================
function copyEventDataToFormFixed(eventData) {
    console.log('📝 FIXED Copying event data to form:', eventData);

    try {
        // 1. ФИКСИРАНО: Копираме времената с правилна обработка на датите
        if (!eventData.leaveType) {
            // НОВО: Използваме подобрената функция за извличане на време
            const startTime = extractTimeFromDateFixed(eventData.start);
            const endTime = extractTimeFromDateFixed(eventData.end);

            console.log('⏰ FIXED Extracted times:', { startTime, endTime });

            const startInput = document.getElementById('start-time');
            const endInput = document.getElementById('end-time');

            // НОВО: Проверяваме за валидни времена преди задаване
            if (startInput && startTime && startTime !== '00:00') {
                startInput.value = startTime;
                console.log('⏰ FIXED Start time set:', startTime);
            }

            if (endInput && endTime && endTime !== '00:00') {
                endInput.value = endTime;
                console.log('⏰ FIXED End time set:', endTime);
            }
        }

        // 2. Копираме дейността (без промяна)
        const activitySelect = document.getElementById('activityInput');
        if (activitySelect && eventData.activity && !eventData.leaveType) {
            activitySelect.value = eventData.activity;
            console.log('💼 FIXED Activity set:', eventData.activity);
        }

        // 3. Копираме типа отпуск (без промяна)
        const leaveSelect = document.getElementById('leaveType');
        if (leaveSelect && eventData.leaveType) {
            leaveSelect.value = eventData.leaveType;
            console.log('🏖️ FIXED Leave type set:', eventData.leaveType);
        }

        // 4. Задаваме copy mode данни (без промяна)
        const isCopyingInput = document.getElementById('is-copying-event');
        const copyFromIdInput = document.getElementById('copy-from-event-id');

        if (isCopyingInput) isCopyingInput.value = 'true';
        if (copyFromIdInput) copyFromIdInput.value = eventData.id;

        // 5. Обновяваме UI за copy режим (без промяна)
        updateFormUIForCopyMode(eventData);

        console.log('✅ FIXED All data copied successfully');

    } catch (error) {
        console.error('❌ FIXED Error during data copy:', error);
        throw error; // Пренасочваме грешката за обработка от parent функцията
    }
}

// ========================================
// НОВА ПОДОБРЕНА ФУНКЦИЯ: ИЗВЛИЧАНЕ НА ВРЕМЕ ОТ ДАТА
// ========================================
function extractTimeFromDateFixed(dateInput) {
    console.log('⏰ FIXED Extracting time from:', dateInput, typeof dateInput);

    try {
        // Ако няма входна дата, връщаме default
        if (!dateInput) {
            console.log('⏰ FIXED No date input, returning 00:00');
            return '00:00';
        }

        let date;

        // НОВО: Обработваме различните типове входни данни
        if (dateInput instanceof Date) {
            // Ако е вече Date object
            date = dateInput;
        } else if (typeof dateInput === 'string') {
            // Ако е string, парсираме го
            date = parseEventDate(dateInput);
        } else {
            console.warn('⚠️ FIXED Unknown date format:', dateInput);
            return '00:00';
        }

        // Проверяваме дали датата е валидна
        if (!date || isNaN(date.getTime())) {
            console.warn('⚠️ FIXED Invalid date after parsing:', dateInput);
            return '00:00';
        }

        // НОВО: Извличаме часове и минути с валидация
        const hours = date.getHours();
        const minutes = date.getMinutes();

        // Проверяваме за валидни стойности
        if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
            console.warn('⚠️ FIXED Invalid time values:', { hours, minutes });
            return '00:00';
        }

        // Форматираме времето
        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

        console.log('✅ FIXED Time extracted successfully:', dateInput, '->', timeString);
        return timeString;

    } catch (error) {
        console.error('❌ FIXED Error extracting time:', error);
        return '00:00';
    }
}

// ========================================
// UI ФУНКЦИИ (БЕЗ ПРОМЯНА)
// ========================================
function showEventFormInCopyMode() {
    const eventForm = document.getElementById('event-form');
    if (eventForm) {
        eventForm.style.display = 'block';
        console.log('📝 FIXED Event form shown in copy mode');
    }

    // Скриваме другите форми
    hideOtherForms();
}

function updateFormUIForCopyMode(eventData) {
    // Copy banner
    const copyBanner = document.getElementById('copy-info-banner');
    if (copyBanner) {
        copyBanner.style.display = 'block';

        const sourceInfo = document.getElementById('copy-source-info');
        if (sourceInfo) {
            const sourceText = `${eventData.employeeName || eventData.title} - ${formatDateForDisplay(eventData.start)}`;
            sourceInfo.textContent = sourceText;
        }
    }

    // Save button
    const saveBtn = document.getElementById('saveEvent');
    const saveBtnText = document.getElementById('save-btn-text');
    const saveBtnCopyText = document.getElementById('save-btn-copy-text');

    if (saveBtn) saveBtn.classList.add('copy-mode');
    if (saveBtnText) saveBtnText.style.display = 'none';
    if (saveBtnCopyText) saveBtnCopyText.style.display = 'inline';
}

function showDragToFormIndicators() {
    const eventForm = document.getElementById('event-form');
    const dragZone = document.getElementById('form-drag-zone');

    if (eventForm && eventForm.style.display !== 'none' && dragZone) {
        dragZone.style.display = 'flex';
        console.log('👁️ FIXED Drag zone shown');
    }
}

function hideDragToFormIndicators() {
    const dragZone = document.getElementById('form-drag-zone');
    if (dragZone) {
        dragZone.style.display = 'none';
    }

    formDropZones.forEach(zone => {
        zone.classList.remove('drag-over');
    });
}

function showFormDropIndicator() {
    const dropIndicator = document.getElementById('form-drop-indicator');
    if (dropIndicator) {
        dropIndicator.style.display = 'flex';
    }
}

function hideFormDropIndicator() {
    const dropIndicator = document.getElementById('form-drop-indicator');
    if (dropIndicator) {
        dropIndicator.style.display = 'none';
    }
}

function hideOtherForms() {
    const editForm = document.getElementById('edit-event-form');
    if (editForm) editForm.style.display = 'none';

    const employeeForm = document.getElementById('employeeForm');
    if (employeeForm) employeeForm.classList.add('hidden');
}

// ========================================
// ПОМОЩНИ ФУНКЦИИ (ПОДОБРЕНИ)
// ========================================
function formatDateForDisplay(date) {
    if (!date) return '';

    try {
        // НОВО: Парсираме датата ако е нужно
        const parsedDate = parseEventDate(date);

        return parsedDate.toLocaleDateString('bg-BG', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (error) {
        console.error('❌ FIXED Error formatting date for display:', error);
        return '';
    }
}

// ========================================
// KEYBOARD SHORTCUTS (БЕЗ ПРОМЯНА)
// ========================================
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl+Shift+C за да изчистим copy режима
        if (e.ctrlKey && e.shiftKey && e.key === 'C') {
            if (typeof clearCopyMode === 'function') {
                clearCopyMode();
                console.log('⌨️ FIXED Copy mode cleared via keyboard shortcut');
            }
        }
    });
}

// ========================================
// CLEAR COPY MODE ФУНКЦИЯ (БЕЗ ПРОМЯНА)
// ========================================
function clearCopyMode() {
    console.log('🧹 FIXED Clearing copy mode...');

    const copyBanner = document.getElementById('copy-info-banner');
    if (copyBanner) copyBanner.style.display = 'none';

    const saveBtn = document.getElementById('saveEvent');
    const saveBtnText = document.getElementById('save-btn-text');
    const saveBtnCopyText = document.getElementById('save-btn-copy-text');

    if (saveBtn) saveBtn.classList.remove('copy-mode');
    if (saveBtnText) saveBtnText.style.display = 'inline';
    if (saveBtnCopyText) saveBtnCopyText.style.display = 'none';

    const isCopyingInput = document.getElementById('is-copying-event');
    const copyFromIdInput = document.getElementById('copy-from-event-id');

    if (isCopyingInput) isCopyingInput.value = 'false';
    if (copyFromIdInput) copyFromIdInput.value = '';

    // Изчистваме формата
    if (typeof resetEventForm === 'function') {
        resetEventForm();
    }
}

// ========================================
// ЕКСПОРТИРАНЕ НА ФУНКЦИИТЕ
// ========================================
window.initializeDragToFormManager = initializeDragToFormManager;
window.clearCopyMode = clearCopyMode;

console.log('✅ FIXED Drag to Form Manager (v3) loaded successfully with comprehensive commenting!')