/**
 * Calendar Management Module
 * Handles FullCalendar initialization, event rendering, and calendar interactions
 * ПОПРАВЕНА ВЕРСИЯ: Решава проблема с tooltip-овете при drag & drop
 */

// Global calendar instance
let calendar = null;

// Global variables for event management
let currentlyVisibleEditButton = null; // Tracks currently visible edit button
let currentlyVisibleDeleteButton = null; // Tracks currently visible delete button

// НОВИ ГЛОБАЛНИ ПРОМЕНЛИВИ ЗА TOOLTIP УПРАВЛЕНИЕ
let activeTooltips = new Set(); // Набор от активни tooltip-ове
let isDragging = false; // Флаг дали има активна drag операция

/**
 * Initializes the FullCalendar instance with responsive configurations
 */
/**
 * Initializes the FullCalendar instance with scrollable popover
 */
function initializeCalendar() {
    const calendarEl = document.getElementById('calendar');
    const employeeSelect = document.getElementById('employeeSelect');

    // Определяме initial view според размера на екрана
    let initialView = 'dayGridMonth';
    const windowWidth = window.innerWidth;

    if (windowWidth <= 480) {
        initialView = 'listWeek';
    } else if (windowWidth <= 768) {
        initialView = 'dayGridWeek';
    } else {
        initialView = 'dayGridMonth';
    }

    console.log(`📅 Initializing calendar with drag & drop - view: ${initialView}`);

    // Create new FullCalendar instance
    calendar = new FullCalendar.Calendar(calendarEl, {
        // ========================================
        // ПОПРАВЕНИ DRAG & DROP НАСТРОЙКИ
        // ========================================
        editable: true,         // ✅ ВАЛИДНА ОПЦИЯ: Позволява редактиране на събития
        droppable: true,        // ✅ ВАЛИДНА ОПЦИЯ: Позволява пускане на събития

        // ========================================
        // RESPONSIVE CALENDAR НАСТРОЙКИ
        // ========================================
        initialView: initialView,
        selectable: true,
        displayEventTime: windowWidth > 768,

        // КЛЮЧОВА НАСТРОЙКА: dayMaxEvents определя кога да се показва "+more"
        dayMaxEvents: 3,

        // ВАЖНО: moreLinkClick с custom функция за скролер
        moreLinkClick: function(info) {
            console.log('📋 +more clicked, showing scrollable popover');
            const popover = 'popover';
            setTimeout(() => {
                addScrollToPopover();
            }, 100);
            return popover;
        },

        // Responsive header toolbar
        headerToolbar: {
            left: windowWidth <= 480 ? 'prev,next' : 'prev,next today',
            center: 'title',
            right: windowWidth <= 480 ? 'listWeek' :
                   windowWidth <= 768 ? 'dayGridWeek,dayGridMonth' :
                   'dayGridMonth,dayGridWeek,listWeek'
        },

        // Responsive height
        height: 'auto',
        contentHeight: 'auto',

        // Time formatting
        eventTimeFormat: {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        },

        // Responsive dayMaxEvents според размера на екрана
        views: {
            dayGridMonth: {
                dayMaxEvents: 3,
            },
            dayGridWeek: {
                dayMaxEvents: 5,
            },
            listWeek: {
                dayMaxEvents: false
            }
        },

        // Event rendering
        eventDidMount: function(info) {
            handleEventRendering(info);
        },

        // Event loading
        events: function(fetchInfo, successCallback, failureCallback) {
            // ПОПРАВКА: Почистваме преди всяко заземване
            if (calendar) {
                calendar.removeAllEvents();
            }
            loadCalendarEvents(employeeSelect, successCallback, failureCallback);
        },

        // Date selection
        select: function(info) {
            handleDateSelection(info, employeeSelect);
        },

        // ========================================
        // ПОПРАВЕНИ DRAG & DROP CALLBACKS
        // ========================================

        // Когато събитие се започне да drag-ва
        eventDragStart: function(info) {
            console.log('🖱️ Started dragging event:', info.event.title);

            // КРИТИЧНО: Скриваме всички tooltip-ове в началото на drag операцията
            isDragging = true;
            hideAllTooltips();

            // Скриваме всички edit/delete бутони по време на drag
            if (typeof removeExistingButtons === 'function') {
                removeExistingButtons();
            }

            // Добавяме визуален индикатор за drag
            info.el.style.opacity = '0.7';
            info.el.style.transform = 'scale(1.05)';
        },

        // ВАЛИДНА ОПЦИЯ: eventDrop се извиква когато събитие се пусне на нова позиция
        eventDrop: function(info) {
            console.log('🎯 Event dropped! Updating backend...');
            handleEventDrop(info); // Тази функция е async
        },

        // Когато drag операцията се отмени
        eventDragStop: function(info) {
            console.log('🖱️ Stopped dragging event');

            // Възстановяваме визуалния стил
            info.el.style.opacity = '';
            info.el.style.transform = '';

            // КРИТИЧНО: Възстановяваме tooltip функционалността след приключване на drag операцията
            setTimeout(() => {
                isDragging = false;
                console.log('✅ Drag operation completed - tooltips re-enabled');
            }, 200);
        },

        // Window resize handler
        windowResize: function(arg) {
            console.log('📐 Calendar resized, updating responsive settings...');
            updateCalendarResponsiveSettings();
        }
    });

    // Render the calendar
    calendar.render();
    window.calendar = calendar;

    // НОВО: Настройваме глобалните drag listeners
    setupGlobalDragListeners();

    // Setup employee selection change handler
    setupEmployeeChangeHandler(employeeSelect);

    // Apply initial responsive adjustments
    setTimeout(() => {
        updateCalendarResponsiveSettings();
    }, 100);

    console.log('✅ Calendar with FIXED drag & drop initialized successfully');
}

/**
 * ПОПРАВЕНА ФУНКЦИЯ: Обработва event drop с tooltip cleanup
 */
async function handleEventDrop(info) {
    console.log('🖱️ Starting FIXED drag & drop process...');

    // КРИТИЧНО: Скриваме всички tooltip-ове в началото на drag операцията
    hideAllTooltips();
    isDragging = true;

    const event = info.event;
    const eventId = event.id;
    const newStart = event.start;
    const newEnd = event.end;

    console.log('📊 Event drop details:', {
        eventId: eventId,
        title: event.title,
        oldStart: info.oldEvent.start,
        newStart: newStart,
        oldEnd: info.oldEvent.end,
        newEnd: newEnd
    });

    // Показваме loading индикатор
    event.setProp('title', event.title + ' (Checking...)');
    event.setExtendedProp('isUpdating', true);

    // Подготвяме данните за валидация в правилния формат
    const validationData = {
        start: formatDateTimeForBackend(newStart),
        end: formatDateTimeForBackend(newEnd),
        activity: event.extendedProps.activity || null,
        leaveType: event.extendedProps.leaveType || null
    };

    console.log('🔍 Validation data for drag & drop:', validationData);

    // ========================================
    // ВАЛИДАЦИЯ НА РАБОТНИТЕ ЧАСОВЕ
    // ========================================

    // Получаваме employeeId за това събитие
    let employeeId = null;

    try {
        // Опитваме се да получим employeeId от event properties
        if (event.extendedProps && event.extendedProps.employeeId) {
            employeeId = event.extendedProps.employeeId;
        } else {
            // Ако няма в extendedProps, правим заявка към backend
            console.log('🔍 Getting employee ID from backend for drag & drop...');

            const response = await fetch(`http://localhost:8080/events/${eventId}`);
            if (response.ok) {
                const eventDetails = await response.json();
                employeeId = eventDetails.employee?.id;
                console.log('📡 Employee ID retrieved for drag & drop:', employeeId);
            } else {
                throw new Error('Failed to get event details for validation');
            }
        }

    } catch (error) {
        console.error('⚠️ Error getting employee ID for drag & drop:', error);
        // При грешка връщаме събитието на старата позиция
        console.log('🔄 Reverting drag & drop due to employee ID error');
        info.revert();
        event.setProp('title', event.title.replace(' (Checking...)', ''));
        event.setExtendedProp('isUpdating', false);
        showDragDropNotification('Error validating move. Please try again.', 'error');

        // Възстановяваме tooltip функционалността
        setTimeout(() => {
            isDragging = false;
        }, 300);
        return;
    }

    // Проверяваме дали функцията за валидация е налична
    if (typeof validateAndNotify === 'function' && employeeId) {
        console.log('🔍 Starting work hours validation for drag & drop...');

        // Обновяваме loading съобщението
        event.setProp('title', event.title.replace(' (Checking...)', ' (Validating...)'));

        try {
            // Извършваме валидацията с originalEventId за да изключим текущото събитие
            const isValid = await validateAndNotify(validationData, employeeId, eventId);

            if (!isValid) {
                // Ако валидацията не мине, връщаме събитието на старата позиция
                console.log('⚠️ Drag & drop blocked due to validation errors');
                info.revert();

                // Премахваме loading индикатора
                event.setProp('title', event.title.replace(' (Validating...)', ''));
                event.setExtendedProp('isUpdating', false);

                // Validation notification вече е показана от validateAndNotify()

                // Възстановяваме tooltip функционалността
                setTimeout(() => {
                    isDragging = false;
                }, 300);
                return; // Излизаме от функцията без да правим update
            }

            console.log('✅ Validation passed for drag & drop, proceeding with update');

        } catch (error) {
            console.error('⚠️ Error during drag & drop validation:', error);
            // При грешка връщаме събитието на старата позиция
            info.revert();
            event.setProp('title', event.title.replace(' (Validating...)', ''));
            event.setExtendedProp('isUpdating', false);
            showDragDropNotification('Error validating move. Please try again.', 'error');

            // Възстановяваме tooltip функционалността
            setTimeout(() => {
                isDragging = false;
            }, 300);
            return;
        }
    } else {
        if (!employeeId) {
            console.warn('⚠️ Employee ID not available for drag & drop validation');
        } else {
            console.warn('⚠️ Validation function not available for drag & drop');
        }
    }

    // ========================================
    // ОБНОВЯВАНЕ В BACKEND
    // ========================================

    // Обновяваме loading съобщението
    event.setProp('title', event.title.replace(' (Validating...)', ' (Updating...)').replace(' (Checking...)', ' (Updating...)'));

    // Подготвяме данните за backend в правилния формат
    const updateData = {
        id: eventId,
        start: formatDateTimeForBackend(newStart),
        end: formatDateTimeForBackend(newEnd),
        activity: event.extendedProps.activity || null,
        leaveType: event.extendedProps.leaveType || null
    };

    console.log('🚀 Sending drag & drop update to backend:', updateData);

    try {
        // Изпращаме PUT заявка към backend
        const response = await fetch(`http://localhost:8080/events/${eventId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(updateData)
        });

        console.log('📡 Drag & drop backend response status:', response.status);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Failed to update event`);
        }

        const updatedEvent = await response.json();
        console.log('✅ Drag & drop event updated successfully in backend:', updatedEvent);

        // Обновяваме календара
        console.log('🔄 Refreshing calendar after drag & drop...');
        if (window.calendar) {
            window.calendar.refetchEvents();
            console.log('📅 Calendar refreshed with correct titles');
        }

        // 🆕 ДИРЕКТНО ОБНОВЯВАНЕ НА СЕДМИЧНИТЕ ДАННИ (заобикаляме проверките)
        try {
            const employeeSelect = document.getElementById('employeeSelect');
            const currentEmployeeId = employeeSelect ? employeeSelect.value : employeeId;
            const employeeName = employeeSelect && employeeSelect.options[employeeSelect.selectedIndex]
                ? employeeSelect.options[employeeSelect.selectedIndex].textContent.trim()
                : 'Employee';

            if (currentEmployeeId && typeof loadAndShowWeeklySchedule === 'function') {
                console.log('🔄 Directly reloading weekly schedule after drag & drop...');

                // Показваме weekly schedule контейнера ако е скрит
                const weeklyContainer = document.getElementById('weekly-schedule-section');
                if (weeklyContainer) {
                    weeklyContainer.classList.remove('hidden');
                }

                // Директно презареждаме седмичните данни
                await loadAndShowWeeklySchedule(currentEmployeeId, employeeName);
                console.log('✅ Weekly schedule reloaded successfully after drag & drop');
            } else {
                console.warn('⚠️ Cannot reload weekly schedule - missing data or function');
            }
        } catch (error) {
            console.error('⚠️ Error reloading weekly schedule:', error);
        }

        // Показваме success съобщение
        showDragDropNotification('Event moved successfully!', 'success');

        console.log('🎯 Drag & drop completed successfully');

    } catch (error) {
        console.error('⚠️ Error updating event via drag & drop:', error);

        // Връщаме събитието на старата позиция при грешка
        console.log('🔄 Reverting event to original position due to backend error');
        info.revert();

        // Показваме error съобщение
        showDragDropNotification('Failed to move event. Please try again.', 'error');
    }

    // КРИТИЧНО: Възстановяваме tooltip функционалността след приключване на drag операцията
    setTimeout(() => {
        isDragging = false;
        console.log('✅ Drag operation completed - tooltips re-enabled');
    }, 300); // Достатъчно време за да приключи цялата операция
}

/**
 * НОВА ФУНКЦИЯ: Настройва глобални drag listeners за цялото приложение
 */
function setupGlobalDragListeners() {
    console.log('🔧 Setting up global drag listeners for tooltip management');

    // Глобален listener за drag операции в документа
    document.addEventListener('dragstart', function(e) {
        console.log('🌍 Global drag start detected');
        isDragging = true;
        hideAllTooltips();
    });

    document.addEventListener('dragend', function(e) {
        console.log('🌍 Global drag end detected');
        setTimeout(() => {
            isDragging = false;
            console.log('✅ Global drag ended - tooltips re-enabled');
        }, 200);
    });

    // Listener за FullCalendar специфични drag операции
    document.addEventListener('mousedown', function(e) {
        // Проверяваме дали се кликва върху FullCalendar event
        if (e.target.closest('.fc-event')) {
            console.log('📅 Potential FullCalendar drag detected');
            setTimeout(() => {
                hideAllTooltips();
            }, 50);
        }
    });
}

/**
 * НОВА ПОМОЩНА ФУНКЦИЯ: Форматира дата за backend API
 * @param {Date} date - JavaScript Date обект
 * @returns {string} Форматирана дата в формат "YYYY-MM-DD HH:MM:SS"
 */
function formatDateTimeForBackend(date) {
    if (!date) return null;

    // Уверяваме се че имаме Date обект
    const d = new Date(date);

    // Форматираме в формата който очаква backend: "YYYY-MM-DD HH:MM:SS"
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    const formatted = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    console.log(`📅 Formatted date: ${date} -> ${formatted}`);

    return formatted;
}

/**
 * НОВА ПОМОЩНА ФУНКЦИЯ: Показва notification за drag & drop операции
 * @param {string} message - Съобщението за показване
 * @param {string} type - Типа на съобщението ('success', 'error', 'info')
 */
function showDragDropNotification(message, type = 'info') {
    // Създаваме notification елемент
    const notification = document.createElement('div');
    notification.className = `drag-drop-notification ${type}`;
    notification.textContent = message;

    // Добавяме стилове директно
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-weight: bold;
        z-index: 10000;
        opacity: 0;
        transform: translateX(300px);
        transition: all 0.3s ease;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;

    // Цветове според типа
    switch(type) {
        case 'success':
            notification.style.backgroundColor = '#28a745';
            break;
        case 'error':
            notification.style.backgroundColor = '#dc3545';
            break;
        default:
            notification.style.backgroundColor = '#007bff';
    }

    // Добавяме към страницата
    document.body.appendChild(notification);

    // Анимация за появяване
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 100);

    // Автоматично премахване след 3 секунди
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(300px)';

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);

    console.log(`📢 Notification shown: ${message} (${type})`);
}

/**
 * СТЪПКА 2: Простата функция за добавяне на скролер към popover
 */
/**
 * ПОДОБРЕНА ФУНКЦИЯ ЗА СКРОЛЕР С DEBUGGING
 * Решава проблеми с появяването на скролер в popover прозорчето
 */
function addScrollToPopover() {
    console.log('🔧 Starting addScrollToPopover...');

    try {
        let attempts = 0;
        const maxAttempts = 5;

        const findAndProcessPopover = () => {
            attempts++;
            console.log(`🔍 Attempt ${attempts}: Looking for popovers...`);

            const popovers = document.querySelectorAll('.fc-popover');

            if (popovers.length === 0) {
                if (attempts < maxAttempts) {
                    setTimeout(findAndProcessPopover, 100);
                    return;
                }
                console.warn('❌ No popovers found after all attempts');
                return;
            }

            popovers.forEach((popover, index) => {
                const popoverBody = popover.querySelector('.fc-popover-body');
                if (!popoverBody) return;

                const events = popoverBody.querySelectorAll('.fc-event');
                const eventCount = events.length;

                console.log(`📊 Found ${eventCount} events in popover ${index + 1}`);

                if (eventCount > 5) {
                    popoverBody.classList.add('scrollable');
                    console.log('✅ Scrollable class applied');
                } else {
                    popoverBody.classList.remove('scrollable');
                    console.log('ℹ️ No scroll needed, class removed');
                }
            });
        };

        findAndProcessPopover();
    } catch (error) {
        console.error('❌ Error in addScrollToPopover:', error);
    }
}


/**
 * НОВА ФУНКЦИЯ: Форсирано добавяне на скролер към всички popover елементи
 */
function forceAddScrollToAllPopovers() {
    console.log('🔨 FORCE: Adding scroll to ALL popover-like elements...');

    // Търсим всички възможни popover елементи
    const selectors = [
        '.fc-popover',
        '[class*="popover"]',
        '[class*="popup"]',
        '[class*="tooltip"]'
    ];

    selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        console.log(`🔍 Found ${elements.length} elements for selector: ${selector}`);

        elements.forEach((element, index) => {
            console.log(`🎯 Processing element ${index + 1} for ${selector}:`, element);

            // Прилагаме скролер директно към елемента
            element.style.maxHeight = '250px';
            element.style.overflowY = 'auto';
            element.style.overflowX = 'hidden';

            // Също и към децата му
            const children = element.querySelectorAll('*');
            children.forEach(child => {
                if (child.children.length > 5) {  // Ако има много деца
                    child.style.maxHeight = '250px';
                    child.style.overflowY = 'auto';
                    child.style.overflowX = 'hidden';
                }
            });
        });
    });
}

/**
 * Handles the rendering and styling of individual events
 * @param {Object} info - FullCalendar event info object
 */
function handleEventRendering(info) {
    const leaveType = info.event.extendedProps.leaveType;
    const employeeId = document.getElementById('employeeSelect')?.value?.trim();
    const isSingleEmployeeSelected = employeeId !== '';

    // Apply styling and icons only if a single employee is selected
    if (leaveType && isSingleEmployeeSelected) {
        applyLeaveTypeStyling(info, leaveType);
    }

    // Ensure proper event title display based on view mode
    updateEventTitle(info, isSingleEmployeeSelected);

    // Always add tooltip functionality
    addEventTooltip(info);

    // Add click handlers for edit/delete buttons
    addEventClickHandlers(info);
}

/**
 * Updates event title based on whether we're viewing single or all employees
 * @param {Object} info - FullCalendar event info object
 * @param {boolean} isSingleEmployeeSelected - Whether a single employee is selected
 */
function updateEventTitle(info, isSingleEmployeeSelected) {
    const titleElement = info.el.querySelector('.fc-event-title');
    if (!titleElement) return;

    const leaveType = info.event.extendedProps.leaveType;
    const eventTitle = info.event.title; // This contains the first name
    const employeeName = info.event.extendedProps.employeeName; // Full name if available

    let displayTitle = '';

    if (isSingleEmployeeSelected) {
        // Single employee view - show only first name
        displayTitle = eventTitle; // Just the first name
    } else {
        // All employees view - show first name only (no activity)
        displayTitle = eventTitle; // Just the first name
    }

    // Exception: for leave types, show the leave type instead of name
    if (leaveType) {
        if (isSingleEmployeeSelected) {
            displayTitle = leaveType; // Show leave type for single employee view
        } else {
            displayTitle = `${eventTitle}: ${leaveType}`; // Show name + leave type for all employees view
        }
    }

    if (titleElement.textContent !== displayTitle) {
        titleElement.textContent = displayTitle;
        console.log(`🔧 Fixed duplicate title: "${titleElement.textContent}" → "${displayTitle}"`);
    }
}

/**
 * Applies CSS classes and icons based on leave type
 * @param {Object} info - FullCalendar event info object
 * @param {string} leaveType - Type of leave (e.g., "Paid leave", "Sick leave")
 */
function applyLeaveTypeStyling(info, leaveType) {
    // Generate CSS class name from leave type
    const className = `leave-${leaveType.toLowerCase().replace(/\s+/g, '-')}`;
    const cellEl = info.el.closest('.fc-daygrid-day');

    if (cellEl) {
        cellEl.classList.add(className);

        // Remove existing icon if present (for re-renders)
        const existingIcon = cellEl.querySelector('.leave-icon');
        if (existingIcon) {
            existingIcon.remove();
        }

        // Add appropriate icon based on leave type
        const icon = getLeaveTypeIcon(leaveType);
        if (icon) {
            const iconEl = document.createElement('div');
            iconEl.className = 'leave-icon';
            if (typeof icon === 'string' && icon.endsWith('.png')) {
                const img = document.createElement('img');
                img.src = icon;
                img.alt = leaveType;
                img.style.width = '20px';
                img.style.height = '20px';
                iconEl.appendChild(img);
            } else {
                iconEl.textContent = icon; // Ако е emoji
            }
            cellEl.appendChild(iconEl);
        }
    }
}

/**
 * Returns the appropriate emoji icon for a leave type
 * @param {string} leaveType - Type of leave
 * @returns {string} Emoji icon
 */
function getLeaveTypeIcon(leaveType) {
    switch (leaveType.toLowerCase()) {
        case 'paid leave':
        case 'unpaid leave':
            return '🛫'; // Airplane emoji
        case 'maternity':
        case 'paternity':
            return '🍼'; // Baby bottle emoji
        case 'sick leave':
            return '🌡️'; // Thermometer emoji
        case 'training':
            return '📚'; // Books emoji
        default:
            return '';
    }
}

/**
 * ПОПРАВЕНА ФУНКЦИЯ: Добавя tooltip към събитие с drag handling
 * @param {Object} info - FullCalendar event info object
 */
function addEventTooltip(info) {
    console.log('🏷️ Adding FIXED tooltip to event:', info.event.title);

    const leaveType = info.event.extendedProps.leaveType;

    // Създаваме уникален tooltip за всяко събитие
    const tooltip = document.createElement('div');
    tooltip.className = 'event-tooltip';
    tooltip.style.cssText = `
        position: absolute;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        line-height: 1.4;
        white-space: nowrap;
        z-index: 10000;
        pointer-events: none;
        display: none;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        max-width: 250px;
        word-wrap: break-word;
        white-space: normal;
    `;

    // Подготвяме съдържанието на tooltip-а
    const eventTitle = info.event.title;
    const employeeName = info.event.extendedProps.employeeName;
    const activity = info.event.extendedProps.activity;
    const employeeId = document.getElementById('employeeSelect')?.value?.trim();
    const isSingleEmployeeSelected = employeeId !== '';

    const nameToShow = employeeName || eventTitle;
    let tooltipContent = '';

    if (leaveType) {
        // Leave event tooltip
        if (isSingleEmployeeSelected) {
            tooltipContent = `<strong>${leaveType}</strong>`;
        } else {
            tooltipContent = `<strong>${nameToShow}</strong><br>${leaveType}`;
        }
    } else {
        // Regular work event tooltip with time and activity
        const startTime = new Date(info.event.start).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
        const endTime = new Date(info.event.end).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });

        if (isSingleEmployeeSelected) {
            tooltipContent = `<strong>${startTime} - ${endTime}</strong><br>${activity || 'Work Shift'}`;
        } else {
            tooltipContent = `<strong>${nameToShow}</strong><br>${startTime} - ${endTime}<br>${activity || 'Work Shift'}`;
        }
    }

    tooltip.innerHTML = tooltipContent;
    document.body.appendChild(tooltip);

    // Добавяме tooltip към набора от активни tooltip-ове
    activeTooltips.add(tooltip);

    // Намираме title елемента
    const titleElement = info.el.querySelector('.fc-event-title');
    if (titleElement) {
        titleElement.style.cursor = 'pointer';

        // ПОПРАВЕНИ EVENT LISTENERS С DRAG HANDLING

        // Показване на tooltip
        const showTooltipHandler = function(e) {
            // Не показваме tooltip ако има активна drag операция
            if (isDragging) {
                console.log('🚫 Tooltip blocked - drag in progress');
                return;
            }

            tooltip.style.display = 'block';
            tooltip.style.left = e.pageX + 10 + 'px';
            tooltip.style.top = e.pageY + 10 + 'px';
            console.log('👁️ Tooltip shown for:', info.event.title);
        };

        // Движение на tooltip
        const moveTooltipHandler = function(e) {
            // Скриваме tooltip ако има активна drag операция
            if (isDragging) {
                tooltip.style.display = 'none';
                return;
            }

            if (tooltip.style.display !== 'none') {
                tooltip.style.left = e.pageX + 10 + 'px';
                tooltip.style.top = e.pageY + 10 + 'px';
            }
        };

        // Скриване на tooltip
        const hideTooltipHandler = function() {
            tooltip.style.display = 'none';
            console.log('👁️ Tooltip hidden for:', info.event.title);
        };

        // НОВИ DRAG EVENT HANDLERS
        const dragStartHandler = function(e) {
            console.log('🖱️ Drag started - hiding all tooltips');
            isDragging = true;
            hideAllTooltips();
        };

        const dragEndHandler = function(e) {
            console.log('🖱️ Drag ended - enabling tooltips');
            // Малка забавка за да се уверим че drag операцията е приключила
            setTimeout(() => {
                isDragging = false;
            }, 100);
        };

        // Добавяме mouse event listeners
        titleElement.addEventListener('mouseenter', showTooltipHandler);
        titleElement.addEventListener('mousemove', moveTooltipHandler);
        titleElement.addEventListener('mouseleave', hideTooltipHandler);

        // КРИТИЧНО: Добавяме drag event listeners
        titleElement.addEventListener('dragstart', dragStartHandler);
        titleElement.addEventListener('dragend', dragEndHandler);

        // За FullCalendar drag събития
        info.el.addEventListener('dragstart', dragStartHandler);
        info.el.addEventListener('dragend', dragEndHandler);

        // Запазваме референции към handlers за eventual cleanup
        tooltip._handlers = {
            showTooltipHandler,
            moveTooltipHandler,
            hideTooltipHandler,
            dragStartHandler,
            dragEndHandler
        };
        tooltip._titleElement = titleElement;
        tooltip._eventElement = info.el;
    }

    console.log('✅ FIXED tooltip added with drag handling');
}

/**
 * НОВА ФУНКЦИЯ: Скрива всички активни tooltip-ове
 */
function hideAllTooltips() {
    console.log(`🧹 Hiding ${activeTooltips.size} active tooltips`);

    activeTooltips.forEach(tooltip => {
        if (tooltip && tooltip.style) {
            tooltip.style.display = 'none';
            tooltip.style.visibility = 'hidden';
            tooltip.style.opacity = '0';
        }
    });
}

/**
 * НОВА ФУНКЦИЯ: Почиства всички tooltip-ове
 */
function cleanupAllTooltips() {
    console.log(`🗑️ Cleaning up ${activeTooltips.size} tooltips`);

    activeTooltips.forEach(tooltip => {
        try {
            // Премахваме event listeners
            if (tooltip._handlers && tooltip._titleElement) {
                const handlers = tooltip._handlers;
                const titleElement = tooltip._titleElement;
                const eventElement = tooltip._eventElement;

                titleElement.removeEventListener('mouseenter', handlers.showTooltipHandler);
                titleElement.removeEventListener('mousemove', handlers.moveTooltipHandler);
                titleElement.removeEventListener('mouseleave', handlers.hideTooltipHandler);
                titleElement.removeEventListener('dragstart', handlers.dragStartHandler);
                titleElement.removeEventListener('dragend', handlers.dragEndHandler);

                if (eventElement) {
                    eventElement.removeEventListener('dragstart', handlers.dragStartHandler);
                    eventElement.removeEventListener('dragend', handlers.dragEndHandler);
                }
            }

            // Премахваме tooltip от DOM
            if (tooltip.parentNode) {
                tooltip.parentNode.removeChild(tooltip);
            }
        } catch (error) {
            console.error('⚠️ Error cleaning up tooltip:', error);
        }
    });

    // Изчистваме набора
    activeTooltips.clear();
}

/**
 * Adds click handlers for edit and delete functionality
 * @param {Object} info - FullCalendar event info object
 */
function addEventClickHandlers(info) {
    const titleElement = info.el.querySelector('.fc-event-title');
    if (!titleElement) return;

    // Click handler с условна логика
    titleElement.addEventListener('click', function(event) {
        event.stopPropagation(); // Спираме event bubbling

        // ПРОВЕРЯВАМЕ ДАЛИ ФОРМАТА ЗА НОВИ СЪБИТИЯ Е ОТВОРЕНА
        const eventForm = document.getElementById('event-form');
        const isNewEventFormOpen = eventForm &&
                                   eventForm.style.display !== 'none' &&
                                   !eventForm.classList.contains('hidden');

        console.log('🖱️ Event clicked');
        console.log('📋 New event form open:', isNewEventFormOpen);

        if (isNewEventFormOpen) {
            // COPY РЕЖИМ - Формата за нови събития е отворена
            console.log('📋 Copy mode activated - copying event data to form');
            handleEventCopy(info, event);
        } else {
            // EDIT/DELETE РЕЖИМ - Формата не е отворена, показваме бутони
            console.log('✏️ Edit mode activated - showing edit/delete buttons');
            handleEventEditButtons(info);
        }
    });

    // ДОБАВЯНЕ ВИЗУАЛЕН HINT ЗА ПОТРЕБИТЕЛЯ
    titleElement.style.cursor = 'pointer';

    // Динамичен tooltip според контекста
    const eventForm = document.getElementById('event-form');
    const isFormOpen = eventForm &&
                       eventForm.style.display !== 'none' &&
                       !eventForm.classList.contains('hidden');

    if (isFormOpen) {
        titleElement.title = 'Click to copy this shift\'s details to create a new one';
    } else {
        titleElement.title = 'Click to edit or delete this shift';
    }
}

/**
 * НОВА ПОМОЩНА ФУНКЦИЯ: Скрива всички форми и бутони
 */
function hideAllFormsAndButtons() {
    console.log('📒 Hiding all forms and buttons...');

    // Скриваме edit формата
    const editEventForm = document.getElementById('edit-event-form');
    if (editEventForm) {
        editEventForm.style.display = 'none';
    }

    // Скриваме employee формата
    const employeeForm = document.getElementById('employeeForm');
    if (employeeForm) {
        employeeForm.classList.add('hidden');
    }

    // Скриваме employee list
    const employeeListContainer = document.getElementById('employeeListContainer');
    if (employeeListContainer) {
        employeeListContainer.classList.add('hidden');
    }

    // Премахваме съществуващи edit/delete бутони
    if (typeof removeExistingButtons === 'function') {
        removeExistingButtons();
    }

    console.log('✅ All forms and buttons hidden');
}

/**
 * НОВА ПОМОЩНА ФУНКЦИЯ: Копира данните от събитието в полетата на новата форма
 * @param {Object} eventObj - FullCalendar event object
 */
function copyEventDataToNewEventForm(eventObj) {
    console.log('📝 Copying event data to new event form...');

    // Получаваме form полетата
    const startTimeInput = document.getElementById('start-time');
    const endTimeInput = document.getElementById('end-time');
    const activityInput = document.getElementById('activityInput');
    const leaveTypeInput = document.getElementById('leaveType');

    // ПРОВЕРЯВАМЕ ДАЛИ Е ОТПУСК
    const leaveType = eventObj.extendedProps?.leaveType;

    if (leaveType) {
        // АКО Е ОТПУСК - копираме само типа отпуск
        console.log('📅 Copying leave type:', leaveType);

        if (leaveTypeInput) {
            leaveTypeInput.value = leaveType;

            // Задействаме change event за да се активира логиката за отпуск
            const changeEvent = new Event('change', { bubbles: true });
            leaveTypeInput.dispatchEvent(changeEvent);
        }

        // За отпуск не копираме часове и активност
        if (startTimeInput) startTimeInput.value = '';
        if (endTimeInput) endTimeInput.value = '';
        if (activityInput) activityInput.value = '';

    } else {
        // АКО Е РАБОТНА СМЯНА - копираме часове и активност
        console.log('⏰ Copying work shift data...');

        // Изчистваме отпуска първо
        if (leaveTypeInput) {
            leaveTypeInput.value = '';
        }

        // Копираме часовете
        if (startTimeInput && eventObj.start) {
            const startTime = formatTimeForInput(new Date(eventObj.start));
            startTimeInput.value = startTime;
            console.log('🕐 Start time copied:', startTime);
        }

        if (endTimeInput && eventObj.end) {
            const endTime = formatTimeForInput(new Date(eventObj.end));
            endTimeInput.value = endTime;
            console.log('🕕 End time copied:', endTime);
        }

        // Копираме активността
        const activity = eventObj.extendedProps?.activity;
        if (activityInput && activity) {
            activityInput.value = activity;
            console.log('📋 Activity copied:', activity);

            // Активираме floating label ако има
            const activityLabel = document.querySelector('label[for="activityInput"]');
            if (activityLabel) {
                activityLabel.classList.add('floating');
            }
        }
    }

    console.log('✅ Event data copied to form fields');
}

/**
 * НОВА ПОМОЩНА ФУНКЦИЯ: Показва новата форма в copy режим
 * @param {Object} eventObj - FullCalendar event object
 */
function showNewEventFormInCopyMode(eventObj) {
    console.log('📝 Showing new event form in copy mode...');

    // Показваме формата
    const eventForm = document.getElementById('event-form');
    if (eventForm) {
        eventForm.style.display = 'block';
    }

    // Задаваме copy режим флаговете
    const copyFromEventIdInput = document.getElementById('copy-from-event-id');
    const isCopyingEventInput = document.getElementById('is-copying-event');
    const copyInfoBanner = document.getElementById('copy-info-banner');
    const copySourceInfo = document.getElementById('copy-source-info');
    const saveBtnText = document.getElementById('save-btn-text');
    const saveBtnCopyText = document.getElementById('save-btn-copy-text');

    // Задаваме copy данни
    if (copyFromEventIdInput) {
        copyFromEventIdInput.value = eventObj.id;
    }

    if (isCopyingEventInput) {
        isCopyingEventInput.value = 'true';
    }

    // Показваме copy banner
    if (copyInfoBanner && copySourceInfo) {
        const startTime = formatTimeForInput(new Date(eventObj.start));
        const endTime = formatTimeForInput(new Date(eventObj.end));
        const sourceText = `${eventObj.title} (${startTime} - ${endTime})`;
        copySourceInfo.textContent = sourceText;
        copyInfoBanner.style.display = 'block';
    }

    // Променяме текста на Save бутона
    if (saveBtnText && saveBtnCopyText) {
        saveBtnText.style.display = 'none';
        saveBtnCopyText.style.display = 'inline';
    }

    // Фокусираме върху първото поле за редактиране
    setTimeout(() => {
        const startTimeInput = document.getElementById('start-time');
        if (startTimeInput && !startTimeInput.disabled) {
            startTimeInput.focus();
        }
    }, 100);

    console.log('✅ New event form shown in copy mode');
}

function handleEventCopy(info, clickEvent) {
    console.log('📋 Event data:', {
        id: info.event.id,
        title: info.event.title,
        start: info.event.start,
        end: info.event.end,
        activity: info.event.extendedProps.activity,
        leaveType: info.event.extendedProps.leaveType
    });

    // Проверяваме дали е избран служител
    const employeeSelect = document.getElementById('employeeSelect');
    const employeeId = employeeSelect?.value?.trim();

    if (!employeeId) {
        alert('Please select an employee before copying shift data.');
        console.log('🚫 No employee selected - cannot copy shift data');
        return;
    }

    // Скриваме всички други форми и бутони
    hideAllFormsAndButtons();

    // Копираме данните от събитието в новата форма
    copyEventDataToNewEventForm(info.event);

    // Показваме формата в copy режим
    showNewEventFormInCopyMode(info.event);

    // Запазваме избраната дата (ако има) или задаваме днешната
    setSelectedDateForNewEvent();

    console.log('✅ Event data copied to form, preserving selected date');
}

/**
 * НОВА ФУНКЦИЯ: Обработва edit/delete бутоните (стария режим)
 */
function handleEventEditButtons(info) {
    console.log('✏️ Showing edit/delete buttons for event:', info.event.title);

    // Премахваме съществуващи бутони
    removeExistingButtons();

    // Създаваме и добавяме edit бутон
    createEditButton(info, info.el.querySelector('.fc-event-title'));

    // Създаваме и добавяме delete бутон
    createDeleteButton(info, info.el.querySelector('.fc-event-title'));

}

/**
 * НОВА ФУНКЦИЯ: Задава дата за новото събитие
 * ЛОГИКА: Запазва вече избраната дата, ако има такава
 */
function setSelectedDateForNewEvent() {
    const selectedDateInput = document.getElementById('selected-date');
    if (selectedDateInput) {
        // Проверяваме дали вече има избрана дата
        if (selectedDateInput.value && selectedDateInput.value.trim() !== '') {
            // Има вече избрана дата - запазваме я
            console.log('📅 Keeping previously selected date:', selectedDateInput.value);
            return;
        }

        // Няма избрана дата - задаваме днешната
        const today = new Date();
        const todayString = today.toISOString().split('T')[0]; // YYYY-MM-DD формат
        selectedDateInput.value = todayString;
        console.log('📅 No date selected - setting today as default:', todayString);
    }
}

/**
 * НОВА ФУНКЦИЯ: Изчиства copy режима и връща формата в нормално състояние
 * Тази функция се извиква когато потребителят кликне на X бутона в copy banner-а
 */
function clearCopyMode() {
    console.log('🧹 Clearing copy mode...');

    // Изчистваме copy флаговете
    const copyFromEventIdInput = document.getElementById('copy-from-event-id');
    const isCopyingEventInput = document.getElementById('is-copying-event');

    if (copyFromEventIdInput) {
        copyFromEventIdInput.value = '';
    }

    if (isCopyingEventInput) {
        isCopyingEventInput.value = 'false';
    }

    // Скриваме copy banner
    const copyInfoBanner = document.getElementById('copy-info-banner');
    if (copyInfoBanner) {
        copyInfoBanner.style.display = 'none';
    }

    // Възстановяваме оригиналния текст на Save бутона
    const saveBtnText = document.getElementById('save-btn-text');
    const saveBtnCopyText = document.getElementById('save-btn-copy-text');

    if (saveBtnText && saveBtnCopyText) {
        saveBtnText.style.display = 'inline';
        saveBtnCopyText.style.display = 'none';
    }

    // Изчистваме всички полета в формата
    clearAllFormFields();

    console.log('✅ Copy mode cleared successfully');
}

/**
 * ПОМОЩНА ФУНКЦИЯ: Изчиства всички полета в формата
 */
function clearAllFormFields() {
    console.log('🧹 Clearing all form fields...');

    // Изчистваме времевите полета
    const startTimeInput = document.getElementById('start-time');
    const endTimeInput = document.getElementById('end-time');

    if (startTimeInput) {
        startTimeInput.value = '';
        startTimeInput.disabled = false;
    }

    if (endTimeInput) {
        endTimeInput.value = '';
        endTimeInput.disabled = false;
    }

    // Изчистваме activity полето
    const activityInput = document.getElementById('activityInput');
    if (activityInput) {
        activityInput.value = '';
        activityInput.disabled = false;

        // Премахваме floating label класа
        const activityLabel = document.querySelector('label[for="activityInput"]');
        if (activityLabel) {
            activityLabel.classList.remove('floating');
        }
    }

    // Изчистваме leave type полето
    const leaveTypeInput = document.getElementById('leaveType');
    if (leaveTypeInput) {
        leaveTypeInput.value = '';
    }

    // Изчистваме selected date полето
    const selectedDateInput = document.getElementById('selected-date');
    if (selectedDateInput) {
        selectedDateInput.value = '';
    }

    console.log('✅ All form fields cleared');
}

/**
 * Removes existing edit/delete buttons and hides edit form
 */
function removeExistingButtons() {
    // Премахваме edit бутона
    if (currentlyVisibleEditButton) {
        currentlyVisibleEditButton.remove();
        currentlyVisibleEditButton = null;
        console.log('🗑️ Edit button removed');
    }

    // Премахваме delete бутона
    if (currentlyVisibleDeleteButton) {
        currentlyVisibleDeleteButton.remove();
        currentlyVisibleDeleteButton = null;
        console.log('🗑️ Delete button removed');
    }

    // Скриваме edit формата
    const editEventForm = document.getElementById('edit-event-form');
    if (editEventForm) {
        editEventForm.style.display = 'none';
        console.log('📝 Edit event form hidden');
    }
}

/**
 * Creates and displays the edit button for an event
 * @param {Object} info - FullCalendar event info object
 * @param {HTMLElement} titleElement - Event title element
 */
function createEditButton(info, titleElement) {
    // Създаваме edit бутона както преди
    const editButton = document.createElement('button');
    editButton.className = 'edit-button';
    editButton.innerHTML = '✏️';
    titleElement.parentNode.appendChild(editButton);
    currentlyVisibleEditButton = editButton;

    // Добавяме event listener за кликване върху edit бутона
    editButton.addEventListener('click', function(e) {
        e.stopPropagation();

        console.log('✏️ Edit button clicked - opening edit form');

        // ========================================
        // НОВА ЛОГИКА: СКРИВАНЕ ВСИЧКИ ДРУГИ ФОРМИ ПРЕДИ ОТВОРИМ EDIT ФОРМАТА
        // ========================================

        // 1. Скриваме формата за нови събития (ако е отворена)
        const eventForm = document.getElementById('event-form');
        if (eventForm && eventForm.style.display !== 'none') {
            console.log('📒 Hiding new event form to show edit form');
            eventForm.style.display = 'none';
        }

        // 2. Скриваме формата за добавяне на служители (ако е отворена)
        const employeeForm = document.getElementById('employeeForm');
        if (employeeForm && !employeeForm.classList.contains('hidden')) {
            console.log('📒 Hiding employee form to show edit form');
            employeeForm.classList.add('hidden');

            // Показваме обратно employee select елементите
            const employeeSelect = document.getElementById('employeeSelect');
            const selectLabel = document.querySelector('label[for="employeeSelect"]');
            const addEmployeeBtn = document.getElementById('addEmployeeBtn');

            if (employeeSelect) employeeSelect.classList.remove('hidden');
            if (selectLabel) selectLabel.classList.remove('hidden');
            if (addEmployeeBtn) addEmployeeBtn.classList.remove('hidden');
        }

        // 3. НОВО: Скриваме employee select dropdown и неговия label
        const employeeSelectForHiding = document.getElementById('employeeSelect');
        const selectLabelForHiding = document.querySelector('label[for="employeeSelect"]');

        if (employeeSelectForHiding) {
            employeeSelectForHiding.classList.add('hidden');
            console.log('🔒 Employee select hidden during event edit');
        }
        if (selectLabelForHiding) {
            selectLabelForHiding.classList.add('hidden');
            console.log('🔒 Employee select label hidden during event edit');
        }

        // 4. Скриваме списъка със служители (ако е отворен)
        const employeeListContainer = document.getElementById('employeeListContainer');
        if (employeeListContainer && !employeeListContainer.classList.contains('hidden')) {
            console.log('📒 Hiding employee list to show edit form');
            employeeListContainer.classList.add('hidden');

            // Скриваме и search input-а
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.style.display = 'none';
            }
        }

        // 5. Скриваме седмичната таблица (ако е отворена)
        const weeklyScheduleSection = document.getElementById('weekly-schedule-section');
        if (weeklyScheduleSection && !weeklyScheduleSection.classList.contains('hidden')) {
            console.log('📒 Hiding weekly schedule to show edit form');
            weeklyScheduleSection.classList.add('hidden');
        }

        // ========================================
        // ОРИГИНАЛНА ЛОГИКА: РАЗШИРЯВАНЕ НА SIDEBAR (АКО Е НУЖНО)
        // ========================================

        // ДИРЕКТНО РАЗШИРЯВАНЕ: Проверяваме и разширяваме sidebar
        const sidebar = document.getElementById('sidebar');
        if (sidebar && sidebar.classList.contains('collapsed')) {
            console.log('📂 Sidebar is collapsed, expanding for edit form...');

            // Премахваме collapsed класа директно
            sidebar.classList.remove('collapsed');

            // Актуализираме toggle бутона
            if (typeof updateToggleButton === 'function') {
                updateToggleButton(false);
            }

            // Запазваме състоянието
            localStorage.setItem('sidebarCollapsed', 'false');

            // Актуализираме календара
            setTimeout(() => {
                if (window.calendar && typeof window.calendar.updateSize === 'function') {
                    window.calendar.updateSize();
                }
            }, 350);
        }

        // ========================================
        // ОРИГИНАЛНА ЛОГИКА: ПОКАЗВАНЕ НА EDIT ФОРМАТА
        // ========================================

        // Показваме формата след малка пауза (ако sidebar беше свит)
        const delay = sidebar && sidebar.classList.contains('collapsed') ? 350 : 0;
        setTimeout(() => {
            console.log('📝 Populating and showing edit form...');

            // Попълваме данните в edit формата
            const start = new Date(info.event.start);
            const end = new Date(info.event.end);
            const dateOnly = start.toISOString().split('T')[0];

            // Задаваме основните стойности в полетата на формата
            document.getElementById('edit-event-id').value = info.event.id;
            document.getElementById('edit-start-time').value = formatTimeForInput(start);
            document.getElementById('edit-end-time').value = formatTimeForInput(end);
            document.getElementById('current-event-date').value = dateOnly;

            const activitySelect = document.getElementById('edit-activity');
            // Задаваме activity стойността
            // ПОПРАВЕНО: Извличаме activity името правилно
            let activityValue = '';
            if (info.event.extendedProps.activity) {
                activityValue = info.event.extendedProps.activity;
            } else if (info.event.extendedProps.activityName) {
                activityValue = info.event.extendedProps.activityName;  // Backup ако activity е в activityName
            }

            console.log('🎯 Activity value for edit form:', activityValue);
            console.log('🔍 All extendedProps:', info.event.extendedProps);

            console.log('🎯 Setting activity value:', activityValue);

            if (activitySelect) {
                // Първо изчистваме всички selected атрибути
                Array.from(activitySelect.options).forEach(option => {
                    option.selected = false;
                });

                // Задаваме стойността
                activitySelect.value = activityValue;

                // Принудително намираме и маркираме правилната опция като selected
                const correctOption = Array.from(activitySelect.options).find(option =>
                    option.text === activityValue || option.value === activityValue
                );

                if (correctOption) {
                    correctOption.selected = true;
                    activitySelect.value = correctOption.value; // Задаваме правилното ID
                    console.log('✅ Activity option selected:', correctOption.text, 'with value:', correctOption.value);
                } else {
                    console.warn('⚠️ Activity option not found for name:', activityValue);

                    // DEBUG: Показваме всички налични опции
                    console.log('Available options:');
                    Array.from(activitySelect.options).forEach(option => {
                        console.log(`  "${option.text}" (value: ${option.value})`);
                    });
                }

                // Активираме floating label за activity полето ако има стойност
                const activityLabel = document.querySelector('label[for="edit-activity"]');
                if (activitySelect.value && activityLabel) {
                    activityLabel.classList.add('floating');
                    console.log('🏷️ Activity floating label activated');
                }
            }

            // Показваме edit формата
            document.getElementById('edit-event-form').style.display = 'block';

            // Скриваме edit и delete бутоните след като формата се покаже
            hideEditDeleteButtons();
            console.log('📒 Edit and delete buttons hidden after form opened');
            console.log('✅ Edit form opened successfully');

        }, delay);
    });
}

// НОВА ПОМОЩНА ФУНКЦИЯ: Скрива edit и delete бутоните
function hideEditDeleteButtons() {
    if (currentlyVisibleEditButton) {
        currentlyVisibleEditButton.style.display = 'none';
        console.log('📒 Edit button hidden while form is open');
    }
    if (currentlyVisibleDeleteButton) {
        currentlyVisibleDeleteButton.style.display = 'none';
        console.log('📒 Delete button hidden while form is open');
    }
}

/**
 * Creates and displays the delete button for an event
 * Сега използва общата логика за изтриване
 * @param {Object} info - FullCalendar event info object
 * @param {HTMLElement} titleElement - Event title element
 */
function createDeleteButton(info, titleElement) {
    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-button';
    deleteButton.innerHTML = '❌';
    titleElement.parentNode.appendChild(deleteButton);
    currentlyVisibleDeleteButton = deleteButton;

    deleteButton.addEventListener('click', function (e) {
        e.stopPropagation();

        if (confirm("Are you sure you want to delete this event?")) {
            fetch(`http://localhost:8080/events/${info.event.id}`, {
                method: 'DELETE'
            })
            .then(response => {
                if (response.ok) {
                    // Премахване от FullCalendar
                    const calendarEvent = calendar.getEventById(info.event.id);
                    if (calendarEvent) {
                        calendarEvent.remove(); // 🔥 важно!
                    }

                    // Премахване на leave-* класове
                    const eventDate = info.event.startStr;
                    const cell = document.querySelector(`[data-date="${eventDate}"]`);
                    if (cell) {
                        [...cell.classList].forEach(cls => {
                            if (cls.startsWith('leave-')) {
                                cell.classList.remove(cls);
                            }
                        });
                        const icon = cell.querySelector('.leave-icon');
                        if (icon) icon.remove();
                    }

                    // Почисти UI бутони (ако има)
                    removeExistingButtons();

                    // 🔄 Презареди събитията (по избор, ако не работи .remove())
                    calendar.refetchEvents?.(); // само ако използваш dynamic fetch

                    alert("✅ Event deleted successfully!");
                } else {
                    alert("⚠️ Failed to delete event.");
                }
            })
            .catch(error => {
                console.error("⚠️ Error deleting event:", error);
                alert("⚠️ An error occurred while deleting the event.");
            });
        }
    });

}

/**
 * Loads events from the backend API
 * Handles both individual employee view and all employees view
 * @param {HTMLSelectElement} employeeSelect - Employee selection dropdown
 * @param {Function} successCallback - Callback for successful load
 * @param {Function} failureCallback - Callback for failed load
 */
function loadCalendarEvents(employeeSelect, successCallback, failureCallback) {
    const employeeId = employeeSelect.value.trim();
    const url = 'http://localhost:8080/events'; // Always load all events from backend

    console.log(`📄 Loading events for employee ID: "${employeeId}" (empty = all employees)`);

    fetch(url)
        .then(response => {
            console.log("📡 Response status:", response.status);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return response.json();
        })
        .then(allEvents => {
            console.log("📥 All events from server:", allEvents);

            // Ensure we have an array
            if (!Array.isArray(allEvents)) {
                console.warn("⚠️ Server returned non-array data, converting to array");
                allEvents = [];
            }

            let filteredEvents = allEvents;

            // If specific employee is selected, filter events to show only that employee's schedule
            if (employeeId && employeeId !== "") {
                const selectedEmployeeName = employeeSelect.options[employeeSelect.selectedIndex]?.textContent?.trim();
                const selectedFirstName = selectedEmployeeName.split(' ')[0]; // Extract first name only

                console.log(`🎯 Filtering events for employee: "${selectedEmployeeName}" (first name: "${selectedFirstName}")`);

                // Filter events by matching first name (since title contains only first name)
                filteredEvents = allEvents.filter(event => {
                    const eventTitle = event.title?.trim();
                    const eventEmployeeName = event.employeeName?.trim();
                    const eventEmployeeId = event.employee?.id?.toString();

                    // Strategy 1: Match by first name in title (most likely scenario)
                    const matchByTitle = eventTitle === selectedFirstName;

                    // Strategy 2: Match by first name in employeeName field
                    const eventFirstName = eventEmployeeName?.split(' ')[0];
                    const matchByEmployeeName = eventFirstName === selectedFirstName;

                    // Strategy 3: Match by employee ID (most reliable)
                    const matchByEmployeeId = eventEmployeeId === employeeId;

                    const matches = matchByTitle || matchByEmployeeName || matchByEmployeeId;

                    if (matches) {
                        console.log(`✅ Event matches:`, {
                            eventTitle: eventTitle,
                            eventEmployeeName: eventEmployeeName,
                            selectedFirstName: selectedFirstName,
                            selectedFullName: selectedEmployeeName,
                            matchStrategy: matchByTitle ? 'title(firstName)' :
                                         matchByEmployeeName ? 'employeeName(firstName)' :
                                         matchByEmployeeId ? 'employeeId' : 'unknown'
                        });
                    }

                    return matches;
                });

                console.log(`📊 Filtered to ${filteredEvents.length} events for ${selectedEmployeeName} (searching by first name: ${selectedFirstName})`);

                // If no events found, show debugging info
                if (filteredEvents.length === 0) {
                    console.warn("🚨 No events found! Debugging info:");
                    console.log("Selected employee ID:", employeeId);
                    console.log("Selected first name:", selectedFirstName);
                    console.log("All event titles:", allEvents.map(e => e.title).filter(Boolean));
                    console.log("All employee IDs in events:", allEvents.map(e => e.employee?.id).filter(Boolean));
                }
            } else {
                // No employee selected - show all employees' events
                console.log(`📊 Showing all events (${filteredEvents.length} total)`);
            }

            console.log("📋 Final filtered events:", filteredEvents);

            // Clean up previous styling before rendering new events
            cleanupPreviousEventStyling();

            // Pass the filtered events to FullCalendar
            successCallback(filteredEvents);
        })
        .catch(error => {
            console.error('⚠️ Error loading events:', error);

            // Show more detailed error information
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                console.error('📌 Network error - check if backend server is running on http://localhost:8080');
                alert('Cannot connect to server. Please check if the backend is running.');
            } else {
                console.error('📡 Server error:', error.message);
                alert(`Error loading events: ${error.message}`);
            }

            failureCallback(error);
        });
}

/**
 * Removes CSS classes and icons from previous event renderings
 */
function cleanupPreviousEventStyling() {
    console.log('🧹 Cleaning up previous event styling...');

    // Намираме всички календарни клетки
    const calendarCells = document.querySelectorAll('.fc-daygrid-day');
    let cleanedItems = 0;

    calendarCells.forEach(cell => {
        // СТЪПКА 1: Премахваме всички leave CSS класове
        const classesToRemove = [];
        cell.classList.forEach(className => {
            if (className.startsWith('leave-')) {
                classesToRemove.push(className);
            }
        });

        classesToRemove.forEach(className => {
            cell.classList.remove(className);
            cleanedItems++;
            console.log(`🗑️ Removed CSS class: ${className}`);
        });

        // СТЪПКА 2: Премахваме всички leave иконки
        const leaveIcons = cell.querySelectorAll('.leave-icon');
        leaveIcons.forEach(icon => {
            icon.remove();
            cleanedItems++;
            console.log('🗑️ Removed leave icon');
        });
    });

    console.log(`✅ Cleanup completed: ${cleanedItems} items removed`);
}

/**
 * ПОПРАВКА ЗА calendarManager.js
 * Намери функцията handleDateSelection и замени с тази версия:
 */

/**
 * Handles date selection for creating new events
 * @param {Object} info - FullCalendar selection info object
 * @param {HTMLSelectElement} employeeSelect - Employee selection dropdown
 */
function handleDateSelection(info, employeeSelect) {
    const employeeId = employeeSelect.value.trim();

    // НОВА ЛИНИЯ: Изчистваме copy режима при избор на нова дата
    if (typeof clearCopyMode === 'function') {
        clearCopyMode();
    }

    console.log('📅 Date selected for new event creation');

    // Проверка дали е избран служител
    if (!employeeId) {
        alert('Please select an employee before adding an event.');
        console.log('🚫 Event form not opened - no employee selected');
        return;
    }

    console.log('✅ Employee selected, proceeding to open event form for employee:', employeeId);

    // Скриваме всички други форми
    hideAllFormsAndButtons();

    console.log('📝 Opening new event form...');

    // Показваме event формата
    const form = document.getElementById('event-form');
    if (form) {
        form.style.display = 'block';
        console.log('✅ New event form opened successfully');
    }

    // Задаваме избраната дата във формата
    const selectedDateInput = document.getElementById('selected-date');
    if (selectedDateInput) {
        selectedDateInput.value = info.startStr;
        console.log('📅 Selected date set in form:', info.startStr);
    }

    // Фокусираме върху start time полето
    const startTimeInput = document.getElementById('start-time');
    if (startTimeInput) {
        setTimeout(() => {
            startTimeInput.focus();
            console.log('🎯 Focus set on start time input');
        }, 100);
    }
}

/**
 * Sets up the employee selection change handler
 * @param {HTMLSelectElement} employeeSelect - Employee selection dropdown
 */
function setupEmployeeChangeHandler(employeeSelect) {
    employeeSelect.addEventListener('change', function() {
        const selectedValue = employeeSelect.value;
        const selectedText = employeeSelect.options[employeeSelect.selectedIndex]?.textContent;

        console.log('📄 Employee selection changed in calendar manager');

        // ========================================
        // НОВА ЛОГИКА: СКРИВАНЕ ВСИЧКИ ОТВОРЕНИ ФОРМИ ПРИ ПРОМЯНА НА СЛУЖИТЕЛ
        // ========================================

        console.log('🧹 Hiding all forms due to employee selection change...');

        // 1. Скриваме формата за нови събития (ако е отворена)
        const eventForm = document.getElementById('event-form');
        if (eventForm && eventForm.style.display !== 'none') {
            console.log('📒 Hiding new event form due to employee change');
            eventForm.style.display = 'none';
        }

        // 2. Скриваме формата за редактиране на събития (ако е отворена)
        const editEventForm = document.getElementById('edit-event-form');
        if (editEventForm && editEventForm.style.display !== 'none') {
            console.log('📒 Hiding edit event form due to employee change');
            editEventForm.style.display = 'none';

            // Показваме обратно edit/delete бутоните
            if (typeof showEditDeleteButtons === 'function') {
                showEditDeleteButtons();
            }
        }

        // 3. Скриваме формата за служители (ако е отворена)
        const employeeForm = document.getElementById('employeeForm');
        if (employeeForm && !employeeForm.classList.contains('hidden')) {
            console.log('📒 Hiding employee form due to employee change');
            employeeForm.classList.add('hidden');

            // Показваме обратно основните UI елементи
            const addEmployeeBtn = document.getElementById('addEmployeeBtn');
            if (addEmployeeBtn) addEmployeeBtn.classList.remove('hidden');
        }

        // 4. Скриваме списъка със служители (ако е отворен)
        const employeeListContainer = document.getElementById('employeeListContainer');
        if (employeeListContainer && !employeeListContainer.classList.contains('hidden')) {
            console.log('📒 Hiding employee list due to employee change');
            employeeListContainer.classList.add('hidden');
        }

        // 5. Скриваме search input-а
        const searchInput = document.getElementById('searchInput');
        if (searchInput && searchInput.style.display !== 'none') {
            console.log('📒 Hiding search input due to employee change');
            searchInput.style.display = 'none';
        }

        // 6. Премахваме всички edit/delete бутони от календара
        if (typeof removeExistingButtons === 'function') {
            removeExistingButtons();
            console.log('📒 Removed calendar edit/delete buttons due to employee change');
        }

        // 7. Показваме обратно основните UI елементи
        const selectLabel = document.querySelector('label[for="employeeSelect"]');
        if (selectLabel) selectLabel.classList.remove('hidden');

        // ========================================
        // ОРИГИНАЛНА ЛОГИКА: ЛОГВАНЕ И ПРОМЯНА НА КАЛЕНДАРА
        // ========================================

        if (selectedValue) {
            console.log(`👤 Employee selected: ${selectedText} (ID: ${selectedValue})`);
            console.log("📅 Switching to individual employee view");
        } else {
            console.log("👥 No employee selected - showing all employees");
            console.log("📅 Switching to all employees view");
        }

        // Clear current events and reload for new selection
        calendar.removeAllEvents();
        calendar.refetchEvents();

        console.log('✅ Employee selection change handled with form cleanup');
    });
}

/**
 * Formats a Date object to HH:MM format for time input fields
 * @param {Date} date - Date object to format
 * @returns {string} Time in HH:MM format
 */
function formatTimeForInput(date) {
    const d = new Date(date);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

/**
 * Refreshes calendar events (used after creating/updating events)
 * Refreshes calendar events with responsive adjustments
 */
function refreshCalendarEvents() {
    if (calendar && typeof calendar.refetchEvents === 'function') {
        console.log('📄 Refreshing calendar events with leave styles cleanup...');

        // НОВА ЛОГИКА: Почистваме всички leave стилове преди refresh
        cleanupAllLeaveStyles();

        // ПОПРАВКА: Почистваме старите събития преди да добавим нови
        calendar.removeAllEvents();

        // Refresh-ваме събитията
        calendar.refetchEvents();

        // Обновяваме responsive настройките
        setTimeout(() => {
            updateCalendarResponsiveSettings();
        }, 100);

        console.log("📄 Calendar events refreshed with leave styles cleanup");
    } else {
        console.warn("⚠️ Calendar not initialized or refetchEvents method not available");
    }
}

/**
 * НОВА ФУНКЦИЯ: Обновява responsive настройките на календара
 */
function updateCalendarResponsiveSettings() {
    if (!window.calendar) return;

    const windowWidth = window.innerWidth;

    try {
        // Обновяваме header toolbar
        const newHeaderToolbar = {
            left: windowWidth <= 480 ? 'prev,next' : 'prev,next today',
            center: 'title',
            right: windowWidth <= 480 ? 'listWeek' :
                   windowWidth <= 768 ? 'dayGridWeek,dayGridMonth' :
                   'dayGridMonth,dayGridWeek,listWeek'
        };

        // ОБНОВЕНА ЛОГИКА: dayMaxEvents според размера на екрана
        let newDayMaxEvents;
        if (windowWidth <= 480) {
            newDayMaxEvents = 2; // На телефон: максимум 2 събития
        } else if (windowWidth <= 768) {
            newDayMaxEvents = 3; // На tablet: максимум 3 събития
        } else {
            newDayMaxEvents = 3; // На desktop: максимум 3 събития
        }

        // Прилагаме новите настройки
        window.calendar.setOption('headerToolbar', newHeaderToolbar);
        window.calendar.setOption('dayMaxEvents', newDayMaxEvents);
        window.calendar.setOption('displayEventTime', windowWidth > 768);

        console.log(`📱 Calendar responsive settings updated - dayMaxEvents: ${newDayMaxEvents} for ${windowWidth}px width`);

    } catch (error) {
        console.error('⚠️ Error updating calendar responsive settings:', error);
    }
}

/**
 * НОВА ФУНКЦИЯ: Получава оптималния календарен view според устройството
 */
function getOptimalCalendarView() {
    const windowWidth = window.innerWidth;

    if (windowWidth <= 480) {
        return 'listWeek'; // List view на телефон за по-добра четимост
    } else if (windowWidth <= 768) {
        return 'dayGridWeek'; // Седмичен view на tablet
    } else {
        return 'dayGridMonth'; // Месечен view на desktop
    }
}

/**
 * НОВА ФУНКЦИЯ: Добавя custom tooltip към "+more" линка
 * @param {Object} info - FullCalendar more link info object
 */
function addMoreLinkTooltip(info) {
    try {
        const moreLinkElement = info.el;
        const dayDate = info.date;

        if (!moreLinkElement || !dayDate) {
            console.warn('⚠️ Invalid info object for more link tooltip');
            return;
        }

        // Създаваме tooltip елемент със стилове веднага
        const tooltip = document.createElement('div');
        tooltip.className = 'more-events-tooltip';

        // ВАЖНО: Задаваме всички стилове директно
        tooltip.style.cssText = `
            position: fixed !important;
            background: rgba(0, 0, 0, 0.95) !important;
            color: white !important;
            padding: 12px 15px !important;
            border-radius: 8px !important;
            font-size: 13px !important;
            z-index: 999999 !important;
            max-width: 280px !important;
            min-width: 200px !important;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.5) !important;
            pointer-events: none !important;
            display: none !important;
            white-space: normal !important;
            line-height: 1.4 !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
            visibility: hidden !important;
            opacity: 0 !important;
        `;

        document.body.appendChild(tooltip);

        // Event listeners
        const showTooltip = function(e) {
            try {
                console.log('🖱️ Mouse entered "+more" link');
                showMoreEventsTooltipSafe(tooltip, dayDate, e);
            } catch (error) {
                console.error('⚠️ Error showing tooltip:', error);
                tooltip.style.display = 'none';
            }
        };

        const moveTooltip = function(e) {
            try {
                if (tooltip.style.display !== 'none') {
                    positionTooltipSafe(tooltip, e);
                }
            } catch (error) {
                console.error('⚠️ Error positioning tooltip:', error);
            }
        };

        const hideTooltip = function() {
            try {
                console.log('🖱️ Mouse left "+more" link');
                tooltip.style.display = 'none';
                tooltip.style.visibility = 'hidden';
                tooltip.style.opacity = '0';
            } catch (error) {
                console.error('⚠️ Error hiding tooltip:', error);
            }
        };

        moreLinkElement.addEventListener('mouseenter', showTooltip);
        moreLinkElement.addEventListener('mousemove', moveTooltip);
        moreLinkElement.addEventListener('mouseleave', hideTooltip);

        console.log('✅ Tooltip with forced z-index created');

    } catch (error) {
        console.error('⚠️ Error in addMoreLinkTooltip:', error);
    }
}

/**
 * БЕЗОПАСНА ФУНКЦИЯ: Показва tooltip със скритите събития
 * @param {HTMLElement} tooltip - Tooltip елементът
 * @param {Date} date - Датата на ден
 * @param {Event} mouseEvent - Mouse event за позициониране
 */
function showMoreEventsTooltipSafe(tooltip, date, mouseEvent) {
    try {
        // Валидация на входните параметри
        if (!tooltip || !date || !mouseEvent) {
            console.warn('⚠️ Invalid parameters for tooltip');
            return;
        }

        // Получаваме всички събития за тази дата
        const eventsForDate = getEventsForDateSafe(date);

        if (!eventsForDate || eventsForDate.length === 0) {
            tooltip.style.display = 'none';
            return;
        }

        // Взeмаме само скритите събития (след първите 3)
        const hiddenEvents = eventsForDate.slice(3);

        if (hiddenEvents.length === 0) {
            tooltip.style.display = 'none';
            return;
        }

        // ОПРОСТЕНО съдържание на tooltip-а
        let tooltipContent = `<strong>📅 ${formatDateForTooltipSafe(date)}</strong><br>`;
        tooltipContent += `<span style="color: #ccc;">Additional Events (${hiddenEvents.length}):</span><br><br>`;

        hiddenEvents.forEach((event, index) => {
            try {
                const eventTitle = (event.title || 'Unknown Employee').toString();
                const leaveType = event.extendedProps?.leaveType;

                tooltipContent += `• <strong>${eventTitle}</strong>`;

                if (leaveType) {
                    tooltipContent += ` - ${leaveType}`;
                } else {
                    const startTime = event.start ? formatTimeForTooltipSafe(event.start) : '';
                    const endTime = event.end ? formatTimeForTooltipSafe(event.end) : '';
                    if (startTime && endTime) {
                        tooltipContent += ` (${startTime}-${endTime})`;
                    }
                }

                if (index < hiddenEvents.length - 1) {
                    tooltipContent += '<br>';
                }
            } catch (eventError) {
                console.error('⚠️ Error processing event:', eventError);
                tooltipContent += `• Error loading event<br>`;
            }
        });

        tooltip.innerHTML = tooltipContent;

        // КЛЮЧОВА ПОПРАВКА: Задаваме стилове директно с JavaScript
        tooltip.style.position = 'fixed';
        tooltip.style.zIndex = '999999'; // Много висок z-index
        tooltip.style.background = 'rgba(0, 0, 0, 0.95)';
        tooltip.style.color = 'white';
        tooltip.style.padding = '12px 15px';
        tooltip.style.borderRadius = '8px';
        tooltip.style.fontSize = '13px';
        tooltip.style.maxWidth = '280px';
        tooltip.style.minWidth = '200px';
        tooltip.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.5)';
        tooltip.style.pointerEvents = 'none';
        tooltip.style.whiteSpace = 'normal';
        tooltip.style.lineHeight = '1.4';
        tooltip.style.border = '1px solid rgba(255, 255, 255, 0.1)';

        // Позициониране
        positionTooltipSafe(tooltip, mouseEvent);

        // ВАЖНО: Показваме tooltip-а
        tooltip.style.display = 'block';
        tooltip.style.visibility = 'visible';
        tooltip.style.opacity = '1';

        // ДОПЪЛНИТЕЛНА ПОПРАВКА: Скриваме временно всички popover-и
        const popovers = document.querySelectorAll('.fc-popover');
        popovers.forEach(popover => {
            popover.style.zIndex = '1000';
        });

        console.log(`📋 Tooltip shown with z-index: ${tooltip.style.zIndex}`);
        console.log(`📋 Tooltip visibility: ${tooltip.style.visibility}`);

    } catch (error) {
        console.error('⚠️ Error in showMoreEventsTooltipSafe:', error);
        tooltip.style.display = 'none';
    }
}

/**
 * БЕЗОПАСНА ФУНКЦИЯ: Получава всички събития за определена дата
 * @param {Date} date - Датата за която търсим събития
 * @returns {Array} Масив със събития за тази дата
 */
function getEventsForDateSafe(date) {
    try {
        if (!window.calendar || !date) {
            return [];
        }

        // Форматираме датата в ISO формат за сравнение
        const targetDate = date.toISOString().split('T')[0];

        // Получаваме всички събития от календара
        const allEvents = window.calendar.getEvents();

        if (!allEvents || !Array.isArray(allEvents)) {
            return [];
        }

        // Филтрираме събития за конкретната дата
        const eventsForDate = allEvents.filter(event => {
            try {
                if (!event || !event.start) return false;

                const eventDate = event.start.toISOString().split('T')[0];
                return eventDate === targetDate;
            } catch (filterError) {
                console.warn('⚠️ Error filtering event:', filterError);
                return false;
            }
        });

        console.log(`📊 Found ${eventsForDate.length} events for date ${targetDate}`);
        return eventsForDate;

    } catch (error) {
        console.error('⚠️ Error in getEventsForDateSafe:', error);
        return [];
    }
}

/**
 * БЕЗОПАСНА ФУНКЦИЯ: Позиционира tooltip-а според позицията на мишката
 * @param {HTMLElement} tooltip - Tooltip елементът
 * @param {Event} mouseEvent - Mouse event
 */
function positionTooltipSafe(tooltip, mouseEvent) {
    try {
        if (!tooltip || !mouseEvent) {
            return;
        }

        const windowWidth = window.innerWidth || 1000;
        const windowHeight = window.innerHeight || 800;

        // Използваме clientX/clientY за fixed positioning
        let left = (mouseEvent.clientX || 0) + 10;
        let top = (mouseEvent.clientY || 0) + 10;

        // Опростена логика за позициониране
        if (left > windowWidth - 300) {
            left = (mouseEvent.clientX || 0) - 260;
        }

        if (top > windowHeight - 200) {
            top = (mouseEvent.clientY || 0) - 150;
        }

        // Уверяваме се че не излиза извън екрана
        if (left < 10) left = 10;
        if (top < 10) top = 10;

        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';

        console.log(`📍 Tooltip positioned at: left=${left}px, top=${top}px`);

    } catch (error) {
        console.error('⚠️ Error in positionTooltipSafe:', error);
    }
}

/**
 * БЕЗОПАСНА ФУНКЦИЯ: Форматира дата за показване в tooltip
 * @param {Date} date - Датата за форматиране
 * @returns {string} Форматирана дата
 */
function formatDateForTooltipSafe(date) {
    try {
        if (!date) return 'Unknown Date';

        const options = {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        };
        return date.toLocaleDateString('en-US', options);
    } catch (error) {
        console.error('⚠️ Error formatting date:', error);
        return 'Invalid Date';
    }
}

/**
 * БЕЗОПАСНА ФУНКЦИЯ: Форматира време за показване в tooltip
 * @param {Date} date - Датата с време за форматиране
 * @returns {string} Форматирано време
 */
function formatTimeForTooltipSafe(date) {
    try {
        if (!date) return '';

        return date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    } catch (error) {
        console.error('⚠️ Error formatting time:', error);
        return '';
    }
}

function cleanupAllLeaveStyles() {
    const calendarCells = document.querySelectorAll('.fc-daygrid-day');
    calendarCells.forEach(cell => {
        // Премахваме всички leave-* класове
        const classesToRemove = [...cell.classList].filter(cls => cls.startsWith('leave-'));
        classesToRemove.forEach(cls => cell.classList.remove(cls));

        // Премахваме leave иконите
        const icons = cell.querySelectorAll('.leave-icon');
        icons.forEach(icon => icon.remove());
    });

    console.log('✅ Global leave styles cleaned up');
}

/**
 * НОВА ПОМОЩНА ФУНКЦИЯ: Скрива всички отворени форми
 * Използва се за да се уверим че само една форма е видима в даден момент
 */
function hideAllOpenForms() {
    console.log('🧹 Hiding all open forms to ensure clean UI state');

    // Скриваме формата за нови събития
    const eventForm = document.getElementById('event-form');
    if (eventForm) {
        eventForm.style.display = 'none';
        console.log('📒 New event form hidden');
    }

    // Скриваме edit формата
    const editEventForm = document.getElementById('edit-event-form');
    if (editEventForm) {
        editEventForm.style.display = 'none';
        console.log('📒 Edit event form hidden');
    }

    // Скриваме формата за служители
    const employeeForm = document.getElementById('employeeForm');
    if (employeeForm) {
        employeeForm.classList.add('hidden');
        console.log('📒 Employee form hidden');
    }

    // Скриваме списъка със служители
    const employeeListContainer = document.getElementById('employeeListContainer');
    if (employeeListContainer) {
        employeeListContainer.classList.add('hidden');
        console.log('📒 Employee list hidden');
    }

    // Скриваме search input-а
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.style.display = 'none';
        console.log('📒 Search input hidden');
    }

    // Показваме обратно основните UI елементи
    const employeeSelect = document.getElementById('employeeSelect');
    const selectLabel = document.querySelector('label[for="employeeSelect"]');
    const addEmployeeBtn = document.getElementById('addEmployeeBtn');

    if (employeeSelect) employeeSelect.classList.remove('hidden');
    if (selectLabel) selectLabel.classList.remove('hidden');
    if (addEmployeeBtn) addEmployeeBtn.classList.remove('hidden');

    console.log('✅ All forms hidden, main UI elements restored');
}

/**
 * НОВА ПОМОЩНА ФУНКЦИЯ: Скрива event формата когато се кликне "Add Employee"
 * Тази функция се използва като event listener
 */
function hideEventFormOnAddEmployee() {
    console.log('👤 Add Employee button clicked - hiding event form');

    const eventForm = document.getElementById('event-form');
    if (eventForm) {
        eventForm.style.display = 'none';
        console.log('📒 Event form hidden due to Add Employee action');
    }
}

/**
 * ===================================================================
 * TOOLTIP MANAGEMENT ЗА COLLAPSED SIDEBAR БУТОНИ
 * ===================================================================
 *
 * Този скрипт управлява показването на tooltip-и за бутоните
 * когато sidebar-а е в collapsed режим.
 */

(function() {
    'use strict';

    console.log('🔧 Initializing tooltip management system...');

    // Проверяваме дали сме в браузър
    if (typeof document === 'undefined') {
        console.warn('⚠️ Document not available - skipping tooltip initialization');
        return;
    }

    /**
     * Изчислява позицията на tooltip спрямо бутона
     * @param {HTMLElement} button - Бутонът
     * @returns {Object} - Обект с left и top координати
     */
    function calculateTooltipPosition(button) {
        const buttonRect = button.getBoundingClientRect();
        const tooltipOffset = 10;

        // Основна позиция - дясно от бутона
        let left = buttonRect.right + tooltipOffset;
        let top = buttonRect.top + (buttonRect.height / 2);

        // Проверяваме дали tooltip ще излезе извън viewport
        const viewportWidth = window.innerWidth;
        const estimatedTooltipWidth = 200; // Приблизителна ширина на tooltip

        if (left + estimatedTooltipWidth > viewportWidth) {
            // Показваме tooltip отляво от бутона
            left = buttonRect.left - tooltipOffset - estimatedTooltipWidth;
            return { left, top, position: 'left' };
        }

        return { left, top, position: 'right' };
    }

    /**
     * Позиционира tooltip на правилното място
     * @param {HTMLElement} tooltip - Tooltip елементът
     * @param {HTMLElement} button - Бутонът
     */
    function positionTooltip(tooltip, button) {
        const position = calculateTooltipPosition(button);

        tooltip.style.left = position.left + 'px';
        tooltip.style.top = position.top + 'px';

        // Добавяме клас за позицията (за стрелката)
        if (position.position === 'left') {
            tooltip.classList.add('left-positioned');
        } else {
            tooltip.classList.remove('left-positioned');
        }

        console.log(`📍 Positioned tooltip at: left=${position.left}, top=${position.top}, position=${position.position}`);
    }
    /**
     * Създава tooltip елемент за даден бутон
     * @param {HTMLElement} button - Бутонът за който създаваме tooltip
     * @param {string} text - Текстът на tooltip-а
     * @returns {HTMLElement} - Създаденият tooltip елемент
     */
    function createTooltip(button, text) {
        console.log(`📝 Creating tooltip for button with text: "${text}"`);

        // Премахваме съществуващия tooltip ако има такъв
        const existingTooltip = document.querySelector('.button-tooltip');
        if (existingTooltip) {
            existingTooltip.remove();
        }

        // Създаваме новия tooltip - добавяме го към body за максимален z-index
        const tooltip = document.createElement('div');
        tooltip.className = 'button-tooltip';
        tooltip.textContent = text;

        // Добавяме tooltip към body вместо към бутона
        document.body.appendChild(tooltip);

        // Позиционираме tooltip спрямо бутона
        positionTooltip(tooltip, button);

        return tooltip;
    }

    /**
     * Показва tooltip за даден бутон
     * @param {HTMLElement} button - Бутонът
     * @param {string} text - Текстът на tooltip-а
     */
    function showTooltip(button, text) {
        console.log(`👆 Showing tooltip for button: "${text}"`);

        const tooltip = createTooltip(button, text);

        // Малко забавяне за по-плавен ефект
        setTimeout(() => {
            tooltip.classList.add('show');
        }, 50);
    }

    /**
     * Скрива tooltip за даден бутон
     * @param {HTMLElement} button - Бутонът
     */
    function hideTooltip(button) {
        console.log('👇 Hiding tooltip');

        // Търсим tooltip в целия документ
        const tooltip = document.querySelector('.button-tooltip');
        if (tooltip) {
            tooltip.classList.remove('show');

            // Премахваме tooltip след анимацията
            setTimeout(() => {
                if (tooltip.parentNode) {
                    tooltip.remove();
                }
            }, 200);
        }
    }

    /**
     * Проверява дали sidebar-а е в collapsed режим
     * @returns {boolean}
     */
    function isSidebarCollapsed() {
        const sidebar = document.getElementById('sidebar');
        return sidebar && sidebar.classList.contains('collapsed');
    }

    /**
     * Добавя tooltip функционалност към бутон
     * @param {HTMLElement} button - Бутонът
     */
    function addTooltipToButton(button) {
        const tooltipText = button.getAttribute('data-tooltip');

        if (!tooltipText) {
            console.warn('⚠️ Button missing data-tooltip attribute:', button);
            return;
        }

        console.log(`🔗 Adding tooltip functionality to button: ${button.id || 'unnamed'}`);

        // Mouse enter event
        button.addEventListener('mouseenter', function() {
            if (isSidebarCollapsed()) {
                console.log(`🖱️ Mouse enter on ${button.id || 'button'} - sidebar collapsed`);
                showTooltip(button, tooltipText);
            }
        });

        // Mouse leave event
        button.addEventListener('mouseleave', function() {
            if (isSidebarCollapsed()) {
                console.log(`🖱️ Mouse leave on ${button.id || 'button'}`);
                hideTooltip(button);
            }
        });

        // Обновяваме позицията при scroll или resize
        window.addEventListener('scroll', function() {
            const tooltip = document.querySelector('.button-tooltip');
            if (tooltip && isSidebarCollapsed()) {
                positionTooltip(tooltip, button);
            }
        });

        window.addEventListener('resize', function() {
            const tooltip = document.querySelector('.button-tooltip');
            if (tooltip && isSidebarCollapsed()) {
                positionTooltip(tooltip, button);
            }
        });
    }

    /**
     * Инициализира tooltip системата
     */
    function initializeTooltips() {
        console.log('🚀 Initializing tooltips...');

        // Селектираме всички бутони в sidebar, освен toggle бутона
        const sidebar = document.getElementById('sidebar');
        if (!sidebar) {
            console.error('❌ Sidebar not found!');
            return;
        }

        const buttons = sidebar.querySelectorAll('button:not(.sidebar-toggle)');
        console.log(`🔍 Found ${buttons.length} buttons to add tooltips to`);

        buttons.forEach((button, index) => {
            console.log(`📌 Processing button ${index + 1}:`, button.id || 'unnamed');
            addTooltipToButton(button);
        });

        console.log('✅ Tooltip initialization complete!');
    }

    /**
     * Почиства всички tooltips когато sidebar се разширява
     */
    function cleanupTooltips() {
        console.log('🧹 Cleaning up tooltips...');

        const tooltips = document.querySelectorAll('.button-tooltip');
        tooltips.forEach(tooltip => {
            tooltip.remove();
        });
    }

    /**
     * Слуша за промени в sidebar състоянието
     */
    function watchSidebarChanges() {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar) {
            console.error('❌ Sidebar not found for watching changes!');
            return;
        }

        // Използваме MutationObserver за да следим промени в class атрибута
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const isCollapsed = sidebar.classList.contains('collapsed');
                    console.log(`📊 Sidebar state changed - collapsed: ${isCollapsed}`);

                    if (!isCollapsed) {
                        // Ако sidebar се разшири, почистваме tooltips
                        cleanupTooltips();
                    }
                }
            });
        });

        observer.observe(sidebar, {
            attributes: true,
            attributeFilter: ['class']
        });

        console.log('👀 Sidebar state observer initialized');
    }

    // ===================================================================
    // INITIALIZATION
    // ===================================================================

    /**
     * Главна функция за инициализация
     */
    function init() {
        console.log('🎯 Starting tooltip system initialization...');

        // Проверяваме дали DOM е готов
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                console.log('📄 DOM loaded - initializing tooltips');
                initializeTooltips();
                watchSidebarChanges();
            });
        } else {
            console.log('📄 DOM already loaded - initializing tooltips immediately');
            initializeTooltips();
            watchSidebarChanges();
        }
    }

    // Стартираме системата
    init();

    // ===================================================================
    // EXPORT ЗА ГЛОБАЛЕН ДОСТЪП (ако е необходимо)
    // ===================================================================

    // Правим функциите достъпни глобално за debugging
    window.TooltipManager = {
        initialize: initializeTooltips,
        cleanup: cleanupTooltips,
        isSidebarCollapsed: isSidebarCollapsed,
        showTooltip: showTooltip,
        hideTooltip: hideTooltip
    };

    console.log('✨ Tooltip management system fully loaded!');

})();

// ЕКСПОРТИРАНЕ НА ФУНКЦИИ ЗА ГЛОБАЛНО ИЗПОЛЗВАНЕ
window.clearCopyMode = clearCopyMode;
// Export functions for use in other modules
window.initializeCalendar = initializeCalendar;
window.refreshCalendarEvents = refreshCalendarEvents;
window.formatTimeForInput = formatTimeForInput;
window.updateCalendarResponsiveSettings = updateCalendarResponsiveSettings;
window.getOptimalCalendarView = getOptimalCalendarView;
window.addMoreLinkTooltip = addMoreLinkTooltip;
window.getEventsForDateSafe = getEventsForDateSafe;
window.positionTooltipSafe = positionTooltipSafe;
window.formatDateForTooltipSafe = formatDateForTooltipSafe;
window.formatTimeForTooltipSafe = formatTimeForTooltipSafe;
window.cleanupAllTooltips = cleanupAllTooltips;
window.hideEditDeleteButtons = hideEditDeleteButtons;
// Cleanup при refresh на страницата
window.addEventListener('beforeunload', cleanupAllTooltips);
window.handleEventDrop = handleEventDrop;
window.formatDateTimeForBackend = formatDateTimeForBackend;
window.showDragDropNotification = showDragDropNotification;
window.hideAllOpenForms = hideAllOpenForms;
window.hideEventFormOnAddEmployee = hideEventFormOnAddEmployee;
window.cleanupAllLeaveStyles = cleanupAllLeaveStyles;
window.removeExistingButtons = removeExistingButtons;
window.createEditButton = createEditButton;
window.createDeleteButton = createDeleteButton;

// НОВИ ЕКСПОРТИ ЗА