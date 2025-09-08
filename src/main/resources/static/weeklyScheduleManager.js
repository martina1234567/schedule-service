/**
 * Weekly Schedule Manager Module
 * Управлява показването на седмичните планувани часове за служителите
 *
 * ОБНОВЕНА ЛОГИКА ЗА ПЛАТЕНИ ОТПУСКИ:
 * Backend-ът сега включва платените отпуски като работни часове:
 *
 * ВКЛЮЧВАТ СЕ като работни часове:
 * - Paid leave (Платен отпуск)
 * - Sick leave (Болничен)
 * - Maternity leave (Майчинство)
 * - Paternity leave (Бащинство)
 *
 * НЕ се включват като работни часове:
 * - Day off (Почивен ден)
 * - Unpaid leave (Неплатен отпуск)
 * - No Leave Selected (Без отпуск)
 *
 * За платените отпуски се използват часовете от договора (4, 6 или 8 часа дневно)
 */

// Глобални променливи за управление на състоянието
let currentWeeklyData = null;          // Текущо заредените седмични данни
let currentSelectedEmployeeId = null;   // ID на текущо избрания служител
let currentEmployeeHourlyRate = null;   // Дневните часове на служителя (4, 6 или 8)
let currentDetailedEvents = null; // Ще съхранява всички събития за текущия служител


/**
 * КОНСТАНТИ ЗА ТИПОВЕТЕ ПЛАТЕНИ ОТПУСКИ
 * Тези константи трябва да съвпадат с backend логиката
 */
const PAID_LEAVE_TYPES = new Set([
    'Paid leave',      // Платен отпуск
    'Sick leave',      // Болничен
    'Maternity leave', // Майчинство
    'Paternity leave'  // Бащинство
]);

/**
 * КОНСТАНТИ ЗА ТИПОВЕТЕ НЕПЛАТЕНИ ОТПУСКИ
 */
const UNPAID_LEAVE_TYPES = new Set([
    'Day off',        // Почивен ден
    'Unpaid leave'    // Неплатен отпуск
]);

/**
 * ГЛАВНА ФУНКЦИЯ: Инициализира модула за седмичните графици
 * Настройва event listeners и основната функционалност
 */
function initializeWeeklyScheduleManager() {
    console.log('📅 Initializing Weekly Schedule Manager with PAID LEAVE logic...');
    console.log('💰 Paid leave types that count as work hours:', Array.from(PAID_LEAVE_TYPES));
    console.log('🚫 Unpaid leave types that DON\'T count as work hours:', Array.from(UNPAID_LEAVE_TYPES));

    // Настройваме event listener за промяна в избора на служител
    setupEmployeeSelectionHandler();

    // Проверяваме дали HTML контейнерът вече съществува
    // (може да е създаден от HTML-а)
    ensureWeeklyScheduleContainer();
    setupWeeklyScheduleToggle();

    //Настройваме listener за промяна на месеца в календара
    setupCalendarMonthChangeListener();

    console.log('✅ Weekly Schedule Manager initialized successfully with paid leave support');
}

/**
 * ФУНКЦИЯ: Настройва event listener за промяна в избора на служител
 * Когато се избере служител, показваме седмичните данни
 * Когато се избере "All Employees", скриваме таблицата
 */
function setupEmployeeSelectionHandler() {
    const employeeSelect = document.getElementById('employeeSelect');

    if (employeeSelect) {
        console.log('🔧 Setting up employee selection handler with paid leave support...');

        // Добавяме listener за промяна в избора
        employeeSelect.addEventListener('change', function() {
            const selectedEmployeeId = employeeSelect.value.trim();
            const selectedEmployeeName = employeeSelect.options[employeeSelect.selectedIndex]?.textContent?.trim();

            console.log(`👤 Employee selection changed: "${selectedEmployeeName}" (ID: ${selectedEmployeeId})`);

            // ========================================
            // ЛОГИКА: СКРИВАМЕ ВСИЧКИ ОТВОРЕНИ ФОРМИ ПРИ ПРОМЯНА НА СЛУЖИТЕЛ
            // ========================================

            console.log('🧹 Cleaning up all open forms due to employee selection change...');

            // 1. Скриваме формата за нови събития (ако е отворена)
            const eventForm = document.getElementById('event-form');
            if (eventForm && eventForm.style.display !== 'none') {
                console.log('🔒 Hiding new event form - employee selection changed');
                eventForm.style.display = 'none';
            }

            // 2. Скриваме формата за редактиране на събития (ако е отворена)
            const editEventForm = document.getElementById('edit-event-form');
            if (editEventForm && editEventForm.style.display !== 'none') {
                console.log('🔒 Hiding edit event form - employee selection changed');
                editEventForm.style.display = 'none';

                // Показваме обратно edit/delete бутоните
                if (typeof showEditDeleteButtons === 'function') {
                    showEditDeleteButtons();
                }
            }

            // 3. Скриваме формата за служители (ако е отворена)
            const employeeForm = document.getElementById('employeeForm');
            if (employeeForm && !employeeForm.classList.contains('hidden')) {
                console.log('🔒 Hiding employee form - employee selection changed');
                employeeForm.classList.add('hidden');

                // Показваме обратно основните UI елементи
                const addEmployeeBtn = document.getElementById('addEmployeeBtn');
                if (addEmployeeBtn) addEmployeeBtn.classList.remove('hidden');
            }

            // 4. Скриваме списъка със служители (ако е отворен)
            const employeeListContainer = document.getElementById('employeeListContainer');
            if (employeeListContainer && !employeeListContainer.classList.contains('hidden')) {
                console.log('🔒 Hiding employee list - employee selection changed');
                employeeListContainer.classList.add('hidden');
            }

            // 5. Скриваме search input-а
            const searchInput = document.getElementById('searchInput');
            if (searchInput && searchInput.style.display !== 'none') {
                console.log('🔒 Hiding search input - employee selection changed');
                searchInput.style.display = 'none';
            }

            // 6. Премахваме всички edit/delete бутони от календара
            if (typeof removeExistingButtons === 'function') {
                removeExistingButtons();
                console.log('🔒 Removed calendar buttons - employee selection changed');
            }

            // 7. Показваме обратно основните UI елементи
            const selectLabel = document.querySelector('label[for="employeeSelect"]');
            if (selectLabel) selectLabel.classList.remove('hidden');

            // ========================================
            // АКТУАЛИЗИРАНА ЛОГИКА: УПРАВЛЕНИЕ НА СЕДМИЧНИТЕ ДАННИ С ПЛАТЕНИ ОТПУСКИ
            // ========================================

            if (selectedEmployeeId && selectedEmployeeId !== '') {
                // Ако е избран конкретен служител, показваме седмичните данни
                console.log('✅ Specific employee selected - loading weekly schedule with paid leave logic');
                currentSelectedEmployeeId = selectedEmployeeId;
                loadAndShowWeeklySchedule(selectedEmployeeId, selectedEmployeeName);
            } else {
                // Ако е избрано "All Employees", скриваме седмичните данни
                console.log('📋 All employees selected - hiding weekly schedule');
                currentSelectedEmployeeId = null;
                currentEmployeeHourlyRate = null;
                hideWeeklySchedule();
            }

            console.log('✅ Employee selection handled with complete form cleanup and paid leave support');
        });

        console.log('✅ Employee selection handler with paid leave support set up successfully');
    } else {
        console.warn('⚠️ Employee select element not found');
    }
}

/**
 * ФУНКЦИЯ: Уверява се че HTML контейнерът за таблицата съществува
 * Ако не съществува, го създава динамично
 * ОБНОВЕНО: Добавя информация за платените отпуски
 */
function ensureWeeklyScheduleContainer() {
    let weeklySection = document.getElementById('weekly-schedule-section');

    // Ако контейнерът вече съществува в HTML-а, просто го използваме
    if (weeklySection) {
        console.log('✅ Weekly schedule container found in HTML');
        return;
    }

    // Ако не съществува, го създаваме динамично
    console.log('🔧 Creating weekly schedule container dynamically with paid leave info...');

    const sidebar = document.getElementById('sidebar');
    if (!sidebar) {
        console.error('❌ Sidebar not found - cannot create weekly schedule container');
        return;
    }

    // Създаваме контейнера
    weeklySection = document.createElement('div');
    weeklySection.id = 'weekly-schedule-section';
    weeklySection.className = 'weekly-schedule-section hidden';

    // HTML структура на контейнера с информация за платените отпуски
    weeklySection.innerHTML = `
        <div class="weekly-schedule-header">
            <h3 id="weekly-schedule-title">📊 Weekly hours</h3>
            <div id="weekly-schedule-subtitle" class="weekly-schedule-subtitle">
                <!-- Тук ще се покаже името на служителя и месеца -->
            </div>
            <div class="paid-leave-info" style="font-size: 11px; color: #666; margin-top: 4px; line-height: 1.3;">
                💰 Includes paid leave: Paid leave, Sick leave, Maternity, Paternity<br>
                🚫 Excludes: Day off, Unpaid leave
            </div>
        </div>

        <!-- Loading индикатор -->
        <div id="weekly-schedule-loading" class="weekly-schedule-loading hidden">
            <span class="loading-spinner">⏳</span>
            <span>Loading...</span>
        </div>

        <!-- Контейнер за таблицата -->
        <div id="weekly-schedule-table-container" class="weekly-schedule-table-container">
            <table id="weekly-schedule-table" class="weekly-schedule-table">
                <thead>
                    <tr>
                        <th class="column-week">C.W.</th>
                        <th class="column-hourly-rate">Working hours</th>
                        <th class="column-total-hours">Total hours</th>
                    </tr>
                </thead>
                <tbody id="weekly-schedule-tbody">
                    <!-- Редовете ще се генерират динамично -->
                </tbody>
            </table>
        </div>

        <!-- Обобщена информация -->
        <div id="weekly-schedule-summary" class="weekly-schedule-summary">
            <!-- Тук ще се показва обобщена информация за месеца -->
        </div>

        <!-- Съобщение за грешка -->
        <div id="weekly-schedule-error" class="weekly-schedule-error hidden">
            <!-- Съобщения за грешки ще се показват тук -->
        </div>
    `;

    // Добавяме контейнера в sidebar-а (след employee select, преди employee form)
    const employeeFormGroup = document.querySelector('.form-group');
    if (employeeFormGroup && employeeFormGroup.nextSibling) {
        sidebar.insertBefore(weeklySection, employeeFormGroup.nextSibling);
    } else {
        sidebar.appendChild(weeklySection);
    }

    console.log('✅ Weekly schedule container created dynamically with paid leave information');
}

/**
 * ГЛАВНА ФУНКЦИЯ: Зарежда и показва седмичните данни за избран служител
 * ОБНОВЕНО: Сега данните от backend включват платените отпуски като работни часове
 *
 * @param {string} employeeId - ID на служителя
 * @param {string} employeeName - Име на служителя
 */
async function loadAndShowWeeklySchedule(employeeId, employeeName) {
    console.log(`📅 Loading weekly schedule for employee: ${employeeName} (ID: ${employeeId}) - WITH PAID LEAVE LOGIC`);

    // Показваме контейнера и loading индикатора
    showWeeklyScheduleContainer();
    showLoadingIndicator();

    // Актуализираме заглавието
    updateWeeklyScheduleTitle(employeeName);

    try {
        // СТЪПКА 1: Първо получаваме информацията за служителя (включително дневните часове)
        console.log('👤 Fetching employee information...');
        const employeeResponse = await fetch(`http://localhost:8080/employees`);

        if (!employeeResponse.ok) {
            throw new Error(`Failed to fetch employee info: HTTP ${employeeResponse.status}`);
        }

        const allEmployees = await employeeResponse.json();
        console.log("📋 Employees from backend:", allEmployees);

        // Покажи всички ID-та за дебъг
        const employeeIds = allEmployees.map(e => e.id);
        console.log("📋 Employee IDs available:", employeeIds);

        // Опитваме да намерим нашия user
        const selectedEmployee = allEmployees.find(emp => emp.id.toString() === employeeId.toString());

        if (!selectedEmployee) {
            console.error(`❌ Could not find employee with ID ${employeeId} in backend list`);
            console.warn("⚠️ Maybe currentUserData.employeeId is wrong or user is not in employees table?");
            throw new Error(`Employee with ID ${employeeId} not found (Available IDs: ${employeeIds.join(", ")})`);
        }


        // Запазваме дневните часове от договора (4, 6 или 8 часа дневно)
        currentEmployeeHourlyRate = selectedEmployee.hourlyRate;
        console.log(`⏰ Employee daily contract hours: ${currentEmployeeHourlyRate} hours/day`);
        console.log(`💰 IMPORTANT: Backend now includes paid leave as work hours based on contract rate`);

        // СТЪПКА 2: Получаваме седмичните данни за правилния месец
        let year, month;

        // Опитваме се да получим месеца от календара ако е възможно
        if (window.calendar && window.calendar.view && window.calendar.view.currentStart) {
            const calendarDate = new Date(window.calendar.view.currentStart);
            year = calendarDate.getFullYear();
            month = calendarDate.getMonth() + 1; // JavaScript месеците са 0-based
            console.log(`📅 Using calendar date: ${month}/${year}`);
        } else {
            // Fallback към текущата дата ако календарът не е наличен
            const now = new Date();
            year = now.getFullYear();
            month = now.getMonth() + 1;
            console.log(`📅 Using current date as fallback: ${month}/${year}`);
        }

        console.log(`📊 Fetching weekly schedule data for ${month}/${year} (includes paid leave hours)...`);

        // Правим заявка към backend-а за седмичните данни
        // ВАЖНО: Backend-ът вече връща данни които включват платените отпуски като работни часове
        const scheduleResponse = await fetch(`http://localhost:8080/api/weekly-schedule/${employeeId}?year=${year}&month=${month}`);

        console.log(`📡 Backend response status: ${scheduleResponse.status}`);

        if (!scheduleResponse.ok) {
            throw new Error(`HTTP ${scheduleResponse.status}: ${scheduleResponse.statusText}`);
        }

        const scheduleData = await scheduleResponse.json();
        console.log('📋 Weekly schedule data received (including paid leave):', scheduleData);

        // СТЪПКА 3: Запазваме данните глобално
        currentWeeklyData = scheduleData;

        // СТЪПКА 4: Скриваме loading индикатора
        hideLoadingIndicator();

        // СТЪПКА 5: Актуализираме заглавието с правилния месец
        updateWeeklyScheduleTitleWithDate(employeeName, year, month);

        // СТЪПКА 6: Генерираме и показваме таблицата
        generateWeeklyScheduleTable(scheduleData, selectedEmployee);

        console.log('✅ Weekly schedule loaded and displayed successfully WITH PAID LEAVE logic');

    } catch (error) {
        console.error('❌ Error loading weekly schedule:', error);

        // Скриваме loading индикатора и показваме грешка
        hideLoadingIndicator();
        showErrorMessage('Error loading weekly data: ' + error.message);
    }
}

/**
 * НОВА ПОМОЩНА ФУНКЦИЯ: Проверява дали даден тип отпуск се включва като работни часове
 * Тази функция трябва да съответства на backend логиката
 *
 * @param {string} leaveType - Типа отпуск
 * @returns {boolean} true ако се включва като работни часове
 */
function isPaidLeaveType(leaveType) {
    if (!leaveType) {
        return false;
    }

    const isPaid = PAID_LEAVE_TYPES.has(leaveType.trim());

    if (isPaid) {
        console.log(`✅ '${leaveType}' is counted as PAID leave (included in work hours)`);
    } else {
        console.log(`🚫 '${leaveType}' is counted as UNPAID leave (NOT included in work hours)`);
    }

    return isPaid;
}

/**
 * ПОМОЩНА ФУНКЦИЯ: Изчислява седмичните часове според договора
 * ОБНОВЕНО: Добавени коментари за взаимодействието с платените отпуски
 *
 * @param {number} dailyHours - Дневните часове според договора (4, 6 или 8)
 * @returns {number} Седмичните часове (dailyHours × 5 работни дни)
 */
function calculateWeeklyContractHours(dailyHours) {
    // ВАЖНО: Това изчислява само базовите седмични часове според договора
    // Backend-ът автоматично добавя платените отпуски към работните часове
    const weeklyHours = dailyHours * 5;

    console.log(`🧮 Calculating weekly contract hours: ${dailyHours} hours/day × 5 days = ${weeklyHours} hours/week`);
    console.log(`💰 NOTE: Actual work hours may be higher due to paid leave being included by backend`);

    return weeklyHours;
}

/**
 * ФУНКЦИЯ: Скрива седмичните данни (когато не е избран служител)
 */
function hideWeeklySchedule() {
    console.log('🔒 Hiding weekly schedule');

    const container = document.getElementById('weekly-schedule-section');
    if (container) {
        container.classList.add('hidden');
    }

    // Изчистваме глобалните данни
    currentWeeklyData = null;
    currentEmployeeHourlyRate = null;
}

/**
 * ФУНКЦИЯ: Показва контейнера за седмичните данни
 */
function showWeeklyScheduleContainer() {
    const container = document.getElementById('weekly-schedule-section');
    if (container) {
        container.classList.remove('hidden');
        console.log('👁️ Weekly schedule container shown');
    }
}

/**
 * ФУНКЦИЯ: Показва loading индикатора
 */
function showLoadingIndicator() {
    const loading = document.getElementById('weekly-schedule-loading');
    const tableContainer = document.getElementById('weekly-schedule-table-container');
    const errorElement = document.getElementById('weekly-schedule-error');
    const summaryElement = document.getElementById('weekly-schedule-summary');

    if (loading) loading.classList.remove('hidden');
    if (tableContainer) tableContainer.style.display = 'none';
    if (errorElement) errorElement.classList.add('hidden');
    if (summaryElement) summaryElement.style.display = 'none';

    console.log('⏳ Loading indicator shown');
}

/**
 * ФУНКЦИЯ: Скрива loading индикатора
 */
function hideLoadingIndicator() {
    const loading = document.getElementById('weekly-schedule-loading');
    const tableContainer = document.getElementById('weekly-schedule-table-container');
    const summaryElement = document.getElementById('weekly-schedule-summary');

    if (loading) loading.classList.add('hidden');
    if (tableContainer) tableContainer.style.display = 'block';
    if (summaryElement) summaryElement.style.display = 'block';

    console.log('✅ Loading indicator hidden');
}

/**
 * ФУНКЦИЯ: Показва съобщение за грешка
 * @param {string} message - Съобщението за грешка
 */
function showErrorMessage(message) {
    const errorElement = document.getElementById('weekly-schedule-error');
    const tableContainer = document.getElementById('weekly-schedule-table-container');
    const summaryElement = document.getElementById('weekly-schedule-summary');

    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
    }

    if (tableContainer) tableContainer.style.display = 'none';
    if (summaryElement) summaryElement.style.display = 'none';

    console.log('❌ Error message shown:', message);
}

/**
 * ФУНКЦИЯ: Актуализира заглавието на секцията
 * @param {string} employeeName - Име на служителя
 */
function updateWeeklyScheduleTitle(employeeName) {
    const title = document.getElementById('weekly-schedule-title');
    const subtitle = document.getElementById('weekly-schedule-subtitle');

    if (title) {
        title.textContent = '📊 Weekly hours';
    }

    if (subtitle) {
        const now = new Date();
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const currentMonth = monthNames[now.getMonth()];
        const currentYear = now.getFullYear();

        subtitle.textContent = `${employeeName} - ${currentMonth} ${currentYear}`;
        console.log(`📝 Title updated: ${employeeName} - ${currentMonth} ${currentYear}`);
    }
}

/**
 * ГЛАВНА ФУНКЦИЯ: Генерира и показва таблицата със седмичните данни
 * ОБНОВЕНО: Данните вече включват платените отпуски като работни часове (от backend)
 *
 * @param {Object} data - Данните от backend-а (вече включват платените отпуски)
 * @param {Object} employee - Информацията за служителя
 */
function generateWeeklyScheduleTable(data, employee) {
    console.log('📊 Generating weekly schedule table WITH PAID LEAVE logic...');
    console.log('💰 NOTE: Data from backend already includes paid leave as work hours');
    console.log('📋 Data structure:', data);
    console.log('👤 Employee info:', employee);

    const tbody = document.getElementById('weekly-schedule-tbody');
    const summaryContainer = document.getElementById('weekly-schedule-summary');

    if (!tbody) {
        console.error('❌ Table tbody not found');
        return;
    }

    // СТЪПКА 1: Изчистваме съществуващото съдържание
    tbody.innerHTML = '';
    if (summaryContainer) {
        summaryContainer.innerHTML = '';
    }

    // СТЪПКА 2: Проверяваме дали има седмични данни
    if (!data.weeklySchedule || data.weeklySchedule.length === 0) {
        console.log('📋 No weekly schedule data found');
        tbody.innerHTML = `
            <tr>
                <td colspan="3" style="text-align: center; padding: 20px; color: #666; font-style: italic;">
                    📋 No planned hours for ${data.monthName || 'this month'} ${data.year}
                </td>
            </tr>
        `;
        return;
    }

    // СТЪПКА 3: Получаваме текущата дата за маркиране на текущата седмица
    const today = new Date();
    const currentWeekStart = getWeekStartDate(today);
    console.log('📅 Current week start:', currentWeekStart);

    // СТЪПКА 4: Изчисляваме седмичните часове според договора (за сравнение)
    const dailyContractHours = currentEmployeeHourlyRate || employee.hourlyRate || 8; // Default 8 часа
    const weeklyContractHours = calculateWeeklyContractHours(dailyContractHours);

    console.log(`📊 Contract hours calculation: ${dailyContractHours} hours/day × 5 days = ${weeklyContractHours} hours/week`);
    console.log(`💰 IMPORTANT: Planned hours from backend include paid leave hours automatically`);

    // СТЪПКА 5: Променливи за обобщената информация
    let totalPlannedHours = 0;
    let weeksWithSchedule = 0;
    let totalWeeks = data.weeklySchedule.length;

    // СТЪПКА 6: Генерираме редовете на таблицата
    data.weeklySchedule.forEach((week, index) => {
        console.log(`📊 Processing week ${index + 1}:`, week);

        // Парсираме планираните часове (може да са string или number)
        // ВАЖНО: Тези часове вече включват платените отпуски от backend-а
        const plannedHours = parseFloat(week.plannedHours) || 0;
        const hasSchedule = plannedHours > 0;

        // Добавяме към общите часове
        totalPlannedHours += plannedHours;
        if (hasSchedule) {
            weeksWithSchedule++;
        }

        // Проверяваме дали е текущата седмица
        const weekStartDate = new Date(week.weekStartDate);
        const isCurrentWeek = isSameWeek(weekStartDate, today);

        console.log(`🔍 Week ${week.weekNumber}: planned=${plannedHours}h (includes paid leave), hasSchedule=${hasSchedule}, isCurrent=${isCurrentWeek}`);

        // Създаваме реда
        const row = document.createElement('tr');
        row.className = isCurrentWeek ? 'current-week' : '';

        // Добавяме tooltip с допълнителна информация
        const tooltipInfo = `Week ${week.weekNumber} (${formatDateShort(week.weekStartDate)} - ${formatDateShort(week.weekEndDate)}) - includes paid leave`;
        row.title = tooltipInfo;

        // КОЛОНА 1: Календарна седмица (К.С.)
        const weekCell = document.createElement('td');
        weekCell.innerHTML = `<span class="week-number">${week.weekNumber}</span>`;
        row.appendChild(weekCell);

        // КОЛОНА 2: Седмични часове според договора (базова норма за сравнение)
        const contractHoursCell = document.createElement('td');
        contractHoursCell.innerHTML = `<span class="contract-hours">${weeklyContractHours}</span>`;
        row.appendChild(contractHoursCell);

        console.log(`⏰ Week ${week.weekNumber}: Contract baseline = ${weeklyContractHours}h/week, Actual planned = ${plannedHours}h (includes paid leave)`);

        // КОЛОНА 3: Общо планирани часове (включват платените отпуски)
        const hoursCell = document.createElement('td');
        const hoursClass = hasSchedule ? 'total-hours' : 'total-hours no-hours';
        const hoursText = hasSchedule ? plannedHours.toFixed(1) : '0';
        hoursCell.innerHTML = `<span class="${hoursClass}">${hoursText}</span>`;
        row.appendChild(hoursCell);

        // Добавяме реда към таблицата
        tbody.appendChild(row);
    });

    // СТЪПКА 7: Генерираме обобщената информация
    generateSummaryInfoWithPaidLeave(summaryContainer, {
        totalWeeks,
        weeksWithSchedule,
        totalPlannedHours, // Тези часове вече включват платените отпуски
        dailyContractHours: dailyContractHours,
        weeklyContractHours: weeklyContractHours,
        employeeName: employee.name,
        monthName: data.monthName,
        year: data.year
    });

    console.log(`✅ Table generated with ${totalWeeks} weeks, ${weeksWithSchedule} with schedule, ${totalPlannedHours.toFixed(1)} total planned hours (INCLUDING PAID LEAVE)`);
}

/**
 * ГЛАВНА ФУНКЦИЯ: Изчислява договорените часове за служител в текущия месец
 * ВАЖНО: Тази функция изчислява базовата норма според договора
 * Backend-ът автоматично добавя платените отпуски към планираните часове
 *
 * ЛОГИКА:
 * 1. Определя кой месец показва календарът
 * 2. Проверява дали годината е високосна (за февруари)
 * 3. Брои съботите и неделите в месеца
 * 4. Изважда weekends от общите дни = работни дни
 * 5. Умножава работните дни по часовете от договора
 *
 * @param {number} contractHoursPerDay - Часове по договор дневно (4, 6 или 8)
 * @param {number} year - Година
 * @param {number} month - Месец (1-12)
 * @returns {Object} Обект с детайлни изчисления
 */
function calculateContractHoursForMonth(contractHoursPerDay, year, month) {
    console.log(`🎯 === ИЗЧИСЛЕНИЕ ЗА ДОГОВОРЕНИ ЧАСОВЕ (БАЗОВА НОРМА) ===`);
    console.log(`📋 Входни данни: ${contractHoursPerDay} часа/ден, ${month}/${year}`);
    console.log(`💰 NOTE: This calculates BASE contract hours. Paid leave hours are added by backend automatically.`);

    // СТЪПКА 1: Определяме колко дни има месецът
    const totalDaysInMonth = getDaysInMonth(year, month);
    console.log(`📅 Месец ${month}/${year} има ${totalDaysInMonth} дни общо`);

    // СТЪПКА 2: Броим съботите и неделите в месеца
    const weekendDays = countWeekendsInMonth(year, month);
    console.log(`🔴 Weekends (съботи + недели) в месеца: ${weekendDays} дни`);

    // СТЪПКА 3: Изчисляваме работните дни = общо дни - weekends
    const workingDays = totalDaysInMonth - weekendDays;
    console.log(`✅ Работни дни = ${totalDaysInMonth} общо - ${weekendDays} weekends = ${workingDays} работни дни`);

    // СТЪПКА 4: Изчисляваме договорените часове = работни дни × часове по договор
    const contractHours = workingDays * contractHoursPerDay;
    console.log(`⏰ Договорени часове (БАЗОВА НОРМА) = ${workingDays} дни × ${contractHoursPerDay} ч/ден = ${contractHours} часа`);
    console.log(`💰 IMPORTANT: Backend automatically adds paid leave hours to planned hours for comparison`);

    // СТЪПКА 5: Връщаме детайлен резултат
    const result = {
        year: year,
        month: month,
        totalDaysInMonth: totalDaysInMonth,
        weekendDays: weekendDays,
        workingDays: workingDays,
        contractHoursPerDay: contractHoursPerDay,
        totalContractHours: contractHours
    };

    console.log(`🎯 === РЕЗУЛТАТ (БАЗОВА НОРМА) ===`);
    console.log(`📊 Месец: ${month}/${year}`);
    console.log(`📋 Общо дни: ${totalDaysInMonth}`);
    console.log(`🔴 Weekends: ${weekendDays} дни`);
    console.log(`✅ Работни дни: ${workingDays} дни`);
    console.log(`💼 Договор: ${contractHoursPerDay} ч/ден`);
    console.log(`⏰ ДОГОВОРЕНИ ЧАСОВЕ (БАЗОВА НОРМА): ${contractHours} часа`);
    console.log(`💰 Planned hours from backend will include paid leave automatically`);

    return result;
}

/**
 * ПОМОЩНА ФУНКЦИЯ: Определя колко дни има даден месец
 * Взема предвид високосни години за февруари
 *
 * @param {number} year - Година
 * @param {number} month - Месец (1-12)
 * @returns {number} Броя дни в месеца
 */
function getDaysInMonth(year, month) {
    // Използваме JavaScript Date трик - месец 0 означава последния ден от предишния месец
    const lastDayOfMonth = new Date(year, month, 0).getDate();

    console.log(`📅 Проверяваме месец ${month}/${year}:`);

    // Специална проверка за февруари и високосни години
    if (month === 2) {
        const isLeapYear = isLeapYearCheck(year);
        console.log(`🗓️  Февруари ${year}: ${isLeapYear ? 'ВИСОКОСНА' : 'НОРМАЛНА'} година = ${lastDayOfMonth} дни`);
    } else {
        console.log(`🗓️  Месец ${month}: ${lastDayOfMonth} дни`);
    }

    return lastDayOfMonth;
}

/**
 * ПОМОЩНА ФУНКЦИЯ: Проверява дали година е високосна
 *
 * ПРАВИЛА ЗА ВИСОКОСНА ГОДИНА:
 * - Делима на 4 → високосна
 * - НО ако е делима на 100 → НЕ е високосна
 * - НО ако е делима на 400 → пак е високосна
 *
 * @param {number} year - Година
 * @returns {boolean} true ако е високосна година
 */
function isLeapYearCheck(year) {
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);

    console.log(`🔍 Проверка за високосна година ${year}:`);
    console.log(`   - Делима на 4: ${year % 4 === 0}`);
    console.log(`   - Делима на 100: ${year % 100 === 0}`);
    console.log(`   - Делима на 400: ${year % 400 === 0}`);
    console.log(`   - РЕЗУЛТАТ: ${isLeap ? 'ВИСОКОСНА' : 'НОРМАЛНА'} година`);

    return isLeap;
}

/**
 * КЛЮЧОВА ФУНКЦИЯ: Брои съботите и неделите в месеца
 *
 * ЛОГИКА:
 * - Преминава през всички дни в месеца (от 1 до край)
 * - За всеки ден проверява дали е събота (6) или неделя (0)
 * - Брои колко са общо
 *
 * @param {number} year - Година
 * @param {number} month - Месец (1-12)
 * @returns {number} Броя weekends (съботи + недели) в месеца
 */
function countWeekendsInMonth(year, month) {
    console.log(`🔍 Започваме броене на weekends за ${month}/${year}:`);

    const totalDays = getDaysInMonth(year, month);
    let weekendCount = 0;
    let saturdayCount = 0;
    let sundayCount = 0;

    // Преминаваме през всички дни в месеца
    for (let day = 1; day <= totalDays; day++) {
        // Създаваме Date обект за текущия ден
        const currentDate = new Date(year, month - 1, day); // month-1 защото JS месеците са 0-based
        const dayOfWeek = currentDate.getDay(); // 0=неделя, 1=пон, 2=вт, 3=ср, 4=чет, 5=пет, 6=събота

        // Проверяваме дали е weekend (събота или неделя)
        if (dayOfWeek === 0) { // Неделя
            weekendCount++;
            sundayCount++;
            console.log(`🔴 Ден ${day}: НЕДЕЛЯ`);
        } else if (dayOfWeek === 6) { // Събота
            weekendCount++;
            saturdayCount++;
            console.log(`🔴 Ден ${day}: СЪБОТА`);
        } else {
            // Работен ден - показваме само първите няколко за debug
            if (day <= 5) {
                console.log(`✅ Ден ${day}: ${getDayNameBulgarian(dayOfWeek)} (работен ден)`);
            }
        }
    }

    console.log(`📊 ОБОБЩЕНИЕ за weekends в ${month}/${year}:`);
    console.log(`   - Събота: ${saturdayCount} дни`);
    console.log(`   - Неделя: ${sundayCount} дни`);
    console.log(`   - ОБЩО weekends: ${weekendCount} дни`);

    return weekendCount;
}

/**
 * ПОМОЩНА ФУНКЦИЯ: Получава българското име на деня
 * @param {number} dayOfWeek - Ден от седмицата (0-6)
 * @returns {string} Име на деня на български
 */
function getDayNameBulgarian(dayOfWeek) {
    const days = ['Неделя', 'Понеделник', 'Вторник', 'Сряда', 'Четвъртък', 'Петък', 'Събота'];
    return days[dayOfWeek];
}

/**
 * ФУНКЦИЯ: Получава текущия месец и година от календара
 * @returns {Object} Обект с година и месец от календара
 */
function getCurrentCalendarMonth() {
    let year, month;

    // Опитваме се да получим месеца от календара ако е възможно
    if (window.calendar && window.calendar.view && window.calendar.view.currentStart) {
        const calendarDate = new Date(window.calendar.view.currentStart);
        year = calendarDate.getFullYear();
        month = calendarDate.getMonth() + 1; // JavaScript месеците са 0-based
        console.log(`📅 Получен месец от календара: ${month}/${year}`);
    } else {
        // Fallback към текущата дата ако календарът не е наличен
        const now = new Date();
        year = now.getFullYear();
        month = now.getMonth() + 1;
        console.log(`📅 Fallback към текуща дата: ${month}/${year}`);
    }

    return { year, month };
}

/**
 * ОБНОВЕНА ФУНКЦИЯ: Генерира обобщената информация под таблицата
 * ОБНОВЕНО: Ясно показва че планираните часове включват платените отпуски
 *
 * @param {HTMLElement} container - Контейнерът за обобщената информация
 * @param {Object} stats - Статистиките за месеца
 */
function generateSummaryInfoWithPaidLeave(container, stats) {
    if (!container) return;

    console.log('📊 === ЗАПОЧВА ГЕНЕРИРАНЕ НА SUMMARY С PDF БУТОН ===');
    console.log('📋 Входни данни за summary:', stats);

    // СТЪПКА 1: Получаваме текущия месец от календара
    const calendarMonth = getCurrentCalendarMonth();

    // СТЪПКА 2: Изчисляваме договорените часове (базова норма)
    const contractCalculation = calculateContractHoursForMonth(
        stats.dailyContractHours,
        calendarMonth.year,
        calendarMonth.month
    );

    // СТЪПКА 3: Изчисляваме разликата и средните стойности
    const hoursDifference = stats.totalPlannedHours - contractCalculation.totalContractHours;
    const averageHoursPerWeek = stats.weeksWithSchedule > 0 ?
        (stats.totalPlannedHours / stats.weeksWithSchedule).toFixed(1) : '0';

    // СТЪПКА 4: Генерираме HTML съдържанието с PDF БУТОН
    container.innerHTML = `
        <!-- СЪЩЕСТВУВАЩИТЕ SUMMARY РЕДОВЕ -->
        <div class="summary-row">
            <span class="summary-label">📅 Месец:</span>
            <span class="summary-value">${stats.monthName} ${stats.year}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">📋 Договор:</span>
            <span class="summary-value">${stats.dailyContractHours}ч/ден</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">⏰ Планувани часове:</span>
            <span class="summary-value highlight" title="Включва платени отпуски">${stats.totalPlannedHours.toFixed(1)} ч *</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">📊 Договорени часове:</span>
            <span class="summary-value">${contractCalculation.totalContractHours} ч</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">📈 Разлика:</span>
            <span class="summary-value ${hoursDifference >= 0 ? 'highlight' : ''}"
                  style="color: ${hoursDifference >= 0 ? '#28a745' : '#dc3545'}">
                ${hoursDifference >= 0 ? '+' : ''}${hoursDifference.toFixed(1)} ч
            </span>
        </div>
        <div class="summary-row">
            <span class="summary-label">📊 Средно на седмица:</span>
            <span class="summary-value">${averageHoursPerWeek} ч</span>
        </div>


        <!-- НОВА ЧАСТ: PDF DOWNLOAD БУТОН -->
        <div class="summary-actions" style="margin-top: 12px; border-top: 1px solid #eee; padding-top: 10px;">
            <button id="download-schedule-pdf"
                    class="pdf-download-btn"
                    onclick="downloadSchedulePDF('${stats.employeeName}', ${calendarMonth.year}, ${calendarMonth.month})"
                    style="
                        width: 100%;
                        padding: 8px 12px;
                        background: linear-gradient(135deg, #007bff, #0056b3);
                        color: white;
                        border: none;
                        border-radius: 6px;
                        font-size: 12px;
                        font-weight: bold;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        box-shadow: 0 2px 4px rgba(0,123,255,0.3);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 6px;
                    "
                    onmouseover="this.style.background='linear-gradient(135deg, #0056b3, #003d82)'; this.style.transform='translateY(-1px)'"
                    onmouseout="this.style.background='linear-gradient(135deg, #007bff, #0056b3)'; this.style.transform='translateY(0)'">
                <span>📄</span>
                <span>Download PDF Schedule</span>
            </button>
        </div>

        <!-- ИНФОРМАЦИОННА БЕЛЕЖКА -->
        <div class="summary-note" style="font-size: 10px; color: #666; margin-top: 8px; border-top: 1px solid #eee; padding-top: 6px;">
            * Planned hours include paid leave based on contract rate
        </div>
    `;

    console.log('✅ Summary с PDF бутон генериран успешно');
}
/**
 * ПОМОЩНА ФУНКЦИЯ: Форматира дата в кратък формат (ДД.ММ)
 * @param {string} dateString - Дата във формат YYYY-MM-DD
 * @returns {string} Форматирана дата
 */
function formatDateShort(dateString) {
    if (!dateString) return '';

    try {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${day}.${month}`;
    } catch (error) {
        console.warn('⚠️ Error formatting date:', dateString);
        return dateString;
    }
}

/**
 * ПОМОЩНА ФУНКЦИЯ: Получава началото на седмицата (понеделник) за дадена дата
 * @param {Date} date - Датата
 * @returns {Date} Понеделника от седмицата
 */
function getWeekStartDate(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Коригираме за неделя
    return new Date(d.setDate(diff));
}

/**
 * ПОМОЩНА ФУНКЦИЯ: Проверява дали две дати са в същата седмица
 * @param {Date} date1 - Първата дата
 * @param {Date} date2 - Втората дата
 * @returns {boolean} true ако са в същата седмица
 */
function isSameWeek(date1, date2) {
    const week1Start = getWeekStartDate(date1);
    const week2Start = getWeekStartDate(date2);
    return week1Start.getTime() === week2Start.getTime();
}

/**
 * ПУБЛИЧНА ФУНКЦИЯ: Актуализира седмичните данни след промяна в събитие
 * ОБНОВЕНО: Сега backend-ът автоматично включва платените отпуски
 *
 * @param {string} employeeId - ID на служителя
 */
async function refreshWeeklyScheduleForEmployee(employeeId) {
    console.log(`🔄 Refreshing weekly schedule for employee ${employeeId} (with paid leave logic)`);

    // Проверяваме дали в момента показваме данни за този служител
    if (currentSelectedEmployeeId !== employeeId) {
        console.log('ℹ️ Not currently showing data for this employee, skipping refresh');
        return;
    }

    // Проверяваме дали седмичните данни са видими
    const container = document.getElementById('weekly-schedule-section');
    if (!container || container.classList.contains('hidden')) {
        console.log('ℹ️ Weekly schedule is not visible, skipping refresh');
        return;
    }

    try {
        // Получаваме името на служителя от select-а
        const employeeSelect = document.getElementById('employeeSelect');
        const employeeName = employeeSelect && employeeSelect.value === employeeId ?
            employeeSelect.options[employeeSelect.selectedIndex]?.textContent?.trim() :
            'Служител';

        // Презареждаме данните (backend автоматично включва платените отпуски)
        await loadAndShowWeeklySchedule(employeeId, employeeName);

        console.log('✅ Weekly schedule refreshed successfully (with paid leave logic)');

    } catch (error) {
        console.error('❌ Error refreshing weekly schedule:', error);
        showErrorMessage('Error updating weekly data');
    }
}

/**
 * ПУБЛИЧНА ФУНКЦИЯ: Проверява дали седмичните данни са видими в момента
 * @returns {boolean} true ако са видими
 */
function isWeeklyScheduleVisible() {
    const container = document.getElementById('weekly-schedule-section');
    return container && !container.classList.contains('hidden');
}

/**
 * ПУБЛИЧНА ФУНКЦИЯ: Получава ID на текущо избрания служител
 * @returns {string|null} ID на служителя или null
 */
function getCurrentSelectedEmployeeId() {
    // Проверяваме employeeSelect dropdown
    const employeeSelect = document.getElementById('employeeSelect');
    if (employeeSelect && employeeSelect.value) {
        console.log(`🔍 Found employee ID from dropdown: ${employeeSelect.value}`);
        return employeeSelect.value;
    }

    // Ако няма dropdown, търсим в URL параметрите
    const urlParams = new URLSearchParams(window.location.search);
    const employeeId = urlParams.get('employeeId');
    if (employeeId) {
        console.log(`🔍 Found employee ID from URL: ${employeeId}`);
        return employeeId;
    }

    console.warn('⚠️ No employee ID found');
    return null;
}

/**
 * ПУБЛИЧНА ФУНКЦИЯ: Получава дневните часове според договора
 * @returns {number|null} Дневните часове от договора или null
 */
function getCurrentEmployeeHourlyRate() {
    return currentEmployeeHourlyRate;
}

/**
 * ПУБЛИЧНА ФУНКЦИЯ: Получава седмичните часове според договора
 * @returns {number|null} Седмичните часове според договора или null
 */
function getCurrentEmployeeWeeklyContractHours() {
    if (!currentEmployeeHourlyRate) {
        return null;
    }
    return calculateWeeklyContractHours(currentEmployeeHourlyRate);
}

/**
 * FUNCTION: Sets up calendar month change listener
 * When user navigates to another month, updates the weekly schedule table
 * 🔧 FIXED: Now properly handles both admin dashboard and user dashboard
 */
function setupCalendarMonthChangeListener() {
    console.log('📅 Setting up calendar month change listener with paid leave support...');

    // Function to add listener when calendar is ready
    function addCalendarListener() {
        if (!window.calendar) {
            console.log('⏳ Calendar not ready yet, waiting...');
            return false;
        }

        try {
            // Check if calendar has on() method
            if (typeof window.calendar.on !== 'function') {
                console.log('⏳ Calendar API not fully loaded, waiting...');
                return false;
            }

            // Add event listener for view change (month change)
            window.calendar.on('datesSet', function(info) {
                console.log('📅 Calendar month/view changed:', {
                    start: info.start,
                    end: info.end,
                    viewType: info.view.type
                });

                // 🔧 CRITICAL FIX: Handle both admin dashboard and user dashboard cases
                handleCalendarMonthChange();
            });

            console.log('✅ Calendar month change listener set up successfully with paid leave support');
            return true;

        } catch (error) {
            console.warn('⚠️ Error setting up calendar listener:', error);
            return false;
        }
    }

    // Try to add listener immediately
    if (addCalendarListener()) {
        return; // Successfully added
    }

    // If we fail, wait for calendar to initialize
    let attempts = 0;
    const maxAttempts = 10;
    const interval = setInterval(() => {
        attempts++;
        console.log(`📅 Attempt ${attempts}/${maxAttempts} to set up calendar listener...`);

        if (addCalendarListener()) {
            clearInterval(interval);
        } else if (attempts >= maxAttempts) {
            clearInterval(interval);
            console.warn('⚠️ Failed to set up calendar month change listener after maximum attempts');
        }
    }, 500); // Check every 500ms
}

/**
 * 🔧 NEW FUNCTION: Handles calendar month change for both admin and user dashboards
 */
function handleCalendarMonthChange() {
    console.log('🔄 Handling calendar month change...');

    // CASE 1: Admin dashboard - has employee selection dropdown
    if (currentSelectedEmployeeId) {
        console.log('🏢 Admin dashboard: Employee selected, refreshing weekly schedule');

        const employeeSelect = document.getElementById('employeeSelect');
        const selectedEmployeeName = employeeSelect && employeeSelect.value === currentSelectedEmployeeId ?
            employeeSelect.options[employeeSelect.selectedIndex]?.textContent?.trim() :
            'Employee';

        console.log(`📄 Calendar month changed, refreshing weekly schedule for employee ${selectedEmployeeName} (ID: ${currentSelectedEmployeeId}) with paid leave logic`);

        // Update the table for the new month (includes paid leave)
        loadAndShowWeeklySchedule(currentSelectedEmployeeId, selectedEmployeeName);
        return;
    }

    // CASE 2: User dashboard - check if we're in user dashboard mode
    const isUserDashboard = checkIfUserDashboard();

    if (isUserDashboard) {
        console.log('👤 User dashboard detected: Refreshing weekly schedule for current user');

        // Try to get current user data from global variable or session
        const currentUser = getCurrentUserDataForDashboard();

        if (currentUser && currentUser.employeeId) {
            console.log(`📄 User dashboard: Refreshing weekly schedule for user ${currentUser.employeeName || currentUser.username} (ID: ${currentUser.employeeId})`);

            // Set the global variable so future changes work
            currentSelectedEmployeeId = currentUser.employeeId;

            // Load weekly schedule for the current user
            loadAndShowWeeklySchedule(currentUser.employeeId, currentUser.employeeName || currentUser.username);
        } else {
            console.warn('⚠️ User dashboard: No user data found for weekly schedule refresh');
        }
        return;
    }

    // CASE 3: Admin dashboard but no employee selected
    console.log('ℹ️ Admin dashboard: No employee selected, skipping weekly schedule refresh');
}

/**
 * 🔧 NEW FUNCTION: Checks if we're currently in user dashboard mode
 */
function checkIfUserDashboard() {
    // Check multiple indicators that we're in user dashboard
    const indicators = [
        // Check if we're on user-dashboard.html page
        window.location.pathname.includes('user-dashboard'),

        // Check if there's user info display (user dashboard specific)
        document.getElementById('userInitials') !== null,

        // Check if there's NO employee dropdown (user dashboard has hidden one)
        !document.getElementById('addEmployeeBtn'),

        // Check if the employee select is hidden/dummy
        (() => {
            const employeeSelect = document.getElementById('employeeSelect');
            return employeeSelect && (
                employeeSelect.style.display === 'none' ||
                employeeSelect.closest('[style*="display:none"]') !== null ||
                employeeSelect.closest('[style*="display: none"]') !== null
            );
        })()
    ];

    const isUserDashboard = indicators.some(indicator => indicator === true);

    console.log('🔍 Dashboard type check:', {
        pathname: window.location.pathname,
        hasUserInitials: !!document.getElementById('userInitials'),
        hasAddEmployeeBtn: !!document.getElementById('addEmployeeBtn'),
        employeeSelectHidden: (() => {
            const employeeSelect = document.getElementById('employeeSelect');
            return employeeSelect && (
                employeeSelect.style.display === 'none' ||
                employeeSelect.closest('[style*="display:none"]') !== null
            );
        })(),
        conclusion: isUserDashboard ? 'USER DASHBOARD' : 'ADMIN DASHBOARD'
    });

    return isUserDashboard;
}

/**
 * 🔧 NEW FUNCTION: Gets current user data for dashboard refresh
 */
function getCurrentUserDataForDashboard() {
    // Try multiple sources for current user data

    // Source 1: Global variable from userDashboardManager.js
    if (typeof currentUserData !== 'undefined' && currentUserData) {
        console.log('📋 Found user data from global variable:', currentUserData);
        return currentUserData;
    }

    // Source 2: Session storage
    try {
        const sessionUserData = sessionStorage.getItem('currentUser');
        if (sessionUserData) {
            const userData = JSON.parse(sessionUserData);
            console.log('📋 Found user data from session storage:', userData);
            return userData;
        }
    } catch (error) {
        console.warn('⚠️ Error reading user data from session storage:', error);
    }

    // Source 3: Hidden employee select (set by userDashboardManager)
    try {
        const employeeSelect = document.getElementById('employeeSelect');
        if (employeeSelect && employeeSelect.value) {
            const selectedOption = employeeSelect.options[employeeSelect.selectedIndex];
            if (selectedOption && selectedOption.textContent) {
                console.log('📋 Found user data from hidden employee select');
                return {
                    employeeId: employeeSelect.value,
                    employeeName: selectedOption.textContent.trim(),
                    username: selectedOption.textContent.trim()
                };
            }
        }
    } catch (error) {
        console.warn('⚠️ Error reading user data from employee select:', error);
    }

    console.warn('⚠️ No user data found from any source');
    return null;
}

/**
 * ФУНКЦИЯ: Актуализира заглавието със специфична дата
 * @param {string} employeeName - Име на служителя
 * @param {number} year - Година
 * @param {number} month - Месец (1-12)
 */
function updateWeeklyScheduleTitleWithDate(employeeName, year, month) {
    const title = document.getElementById('weekly-schedule-title');
    const subtitle = document.getElementById('weekly-schedule-subtitle');

    if (title) {
        title.textContent = '📊 Weekly hours';
    }

    if (subtitle) {
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const monthName = monthNames[month - 1];

        subtitle.textContent = `${employeeName} - ${monthName} ${year}`;
        console.log(`📝 Title updated with calendar date: ${employeeName} - ${monthName} ${year}`);
    }
}

/**
 * ФУНКЦИЯ: Настройва toggle бутона за показване/скриване на таблицата
 */
function setupWeeklyScheduleToggle() {
    const toggleBtn = document.getElementById('weekly-schedule-toggle');
    const content = document.getElementById('weekly-schedule-content');
    const toggleIcon = document.querySelector('.toggle-icon');
    const toggleText = document.querySelector('.toggle-text');

    if (!toggleBtn || !content) {
        console.warn('⚠️ Weekly schedule toggle elements not found');
        return;
    }

    toggleBtn.addEventListener('click', function() {
        const isHidden = content.classList.contains('hidden');

        if (isHidden) {
            // Показваме таблицата
            content.classList.remove('hidden');
            toggleIcon.textContent = '📋';
            toggleText.textContent = 'Hide Info';
            toggleBtn.classList.add('expanded');
            console.log('📊 Weekly schedule table shown');
        } else {
            // Скриваме таблицата
            content.classList.add('hidden');
            toggleIcon.textContent = '📊';
            toggleText.textContent = 'More Info';
            toggleBtn.classList.remove('expanded');
            console.log('📊 Weekly schedule table hidden');
        }
    });

    console.log('✅ Weekly schedule toggle set up successfully');
}

/**
 * СТЪПКА 3: ГЛАВНА ФУНКЦИЯ ЗА ГЕНЕРИРАНЕ НА PDF
 * Тази функция се извиква когато потребителят кликне на "Download PDF Schedule" бутона
 *
 * @param {string} employeeName - Името на служителя
 * @param {number} year - Година
 * @param {number} month - Месец (1-12)
 */
async function downloadSchedulePDF(employeeName, year, month) {
    console.log(`🎯 === ЗАПОЧВА PDF ГЕНЕРИРАНЕ (ПОПРАВЕНА ВЕРСИЯ) ===`);
    console.log(`👤 Employee: ${employeeName}`);
    console.log(`📅 Period: ${month}/${year}`);

    try {
        // СТЪПКА 1: Подготвяме UI-а
        const downloadBtn = document.getElementById('download-schedule-pdf');
        const originalText = downloadBtn.innerHTML;
        downloadBtn.innerHTML = '<span>⏳</span><span>Generating PDF...</span>';
        downloadBtn.disabled = true;

        // СТЪПКА 2: Получаваме ID на служителя
        const employeeId = getCurrentSelectedEmployeeId();
        if (!employeeId) {
            throw new Error('No employee selected');
        }
        console.log(`🔍 Employee ID: ${employeeId}`);

        // СТЪПКА 3: ВАЖНО! Използваме dailyHoursManager вместо старата система
        console.log('📋 Fetching daily work hours from backend (USING DAILY HOURS MANAGER)...');

        // Тук използваме правилната функция от dailyHoursManager.js
        const dailyHoursData = await getDailyWorkHoursForEmployee(employeeId, year, month);
        console.log(`📊 Retrieved ${dailyHoursData.tableRows.length} days with proper work hours`);

        // СТЪПКА 4: Генерираме PDF документа с правилните данни
        console.log('📄 Generating PDF document with work hours...');
        await generatePDFDocumentWithWorkHours(employeeName, year, month, dailyHoursData);

        // СТЪПКА 5: Възстановяваме бутона
        downloadBtn.innerHTML = originalText;
        downloadBtn.disabled = false;

        console.log('✅ PDF generated successfully with work hours!');

    } catch (error) {
        console.error('❌ Error generating PDF:', error);

        // Възстановяваме бутона при грешка
        const downloadBtn = document.getElementById('download-schedule-pdf');
        if (downloadBtn) {
            downloadBtn.innerHTML = '<span>📄</span><span>Download PDF</span>';
            downloadBtn.disabled = false;
        }

        alert('Error generating PDF: ' + error.message);
    }
}

/**
 * СТЪПКА 3.A: ПОМОЩНА ФУНКЦИЯ - Получава всички събития за служител за месец
 *
 * @param {string} employeeId - ID на служителя
 * @param {number} year - Година
 * @param {number} month - Месец (1-12)
 * @returns {Array} Масив със събития за месеца
 */
/**
 * ПОПРАВЕНА СТЪПКА 6: ФУНКЦИИ ЗА ПРАВИЛНО ИЗВЛИЧАНЕ НА СМЕНИТЕ
 * Замени функциите fetchEmployeeEventsForMonth и createDailyScheduleTable с тези версии
 */

/**
 * ПОПРАВЕНА ФУНКЦИЯ: Получава всички събития за служител за месец
 * ПОДОБРЕНА ЛОГИКА: По-точно филтриране и debug информация
 *
 * @param {string} employeeId - ID на служителя
 * @param {number} year - Година
 * @param {number} month - Месец (1-12)
 * @returns {Array} Масив със събития за месеца
 */
async function fetchEmployeeEventsForMonth(employeeId, year, month) {
    console.log(`🔍 === ЗАПОЧВА ИЗВЛИЧАНЕ НА СЪБИТИЯ ===`);
    console.log(`👤 Employee ID: ${employeeId} (type: ${typeof employeeId})`);
    console.log(`📅 Target month: ${month}/${year}`);

    try {
        // СТЪПКА 6.1: Правим заявка към backend за всички събития
        console.log('📡 Fetching all events from backend...');
        const response = await fetch('http://localhost:8080/events');

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Failed to fetch events`);
        }

        const allEvents = await response.json();
        console.log(`📊 Backend returned ${allEvents.length} total events`);

        // СТЪПКА 6.2: Debug - показваме първите няколко събития за анализ
        if (allEvents.length > 0) {
            console.log('🔍 Sample event structure:', allEvents[0]);
            console.log('📋 First 3 events:');
            allEvents.slice(0, 3).forEach((event, index) => {
                console.log(`  ${index + 1}. Employee ID: ${event.employee?.id} (${typeof event.employee?.id}), Title: "${event.title}", Start: "${event.start}"`);
            });
        }

        // СТЪПКА 6.3: Филтрираме събития за конкретния служител
        console.log(`🎯 Filtering events for employee ID: ${employeeId}`);

        const employeeEvents = allEvents.filter(event => {
            // Проверяваме дали съществува employee обект
            if (!event.employee || !event.employee.id) {
                console.log(`⚠️ Event without employee: ${event.id}`);
                return false;
            }

            // Сравняваме ID-тата като strings за сигурност
            const eventEmployeeId = event.employee.id.toString();
            const targetEmployeeId = employeeId.toString();

            const isMatch = eventEmployeeId === targetEmployeeId;

            if (isMatch) {
                console.log(`✅ Employee match found: Event ID ${event.id}, Employee ID ${eventEmployeeId}`);
            }

            return isMatch;
        });

        console.log(`📊 Found ${employeeEvents.length} events for employee ${employeeId}`);

        // СТЪПКА 6.4: Филтрираме по месец и година
        console.log(`📅 Filtering events for ${month}/${year}...`);

        const employeeEventsForMonth = employeeEvents.filter(event => {
            // Проверяваме дали има start дата
            if (!event.start) {
                console.log(`⚠️ Event ${event.id} has no start date`);
                return false;
            }

            try {
                // Парсираме датата - backend връща формат "YYYY-MM-DD HH:MM:SS"
                const eventDate = new Date(event.start);

                // Проверяваме дали датата е валидна
                if (isNaN(eventDate.getTime())) {
                    console.log(`⚠️ Invalid date in event ${event.id}: "${event.start}"`);
                    return false;
                }

                const eventYear = eventDate.getFullYear();
                const eventMonth = eventDate.getMonth() + 1; // JS месеците са 0-based (0-11)

                const isInTargetMonth = eventYear === year && eventMonth === month;

                if (isInTargetMonth) {
                    console.log(`✅ Event in target month: ID ${event.id}, Date: ${eventDate.toLocaleDateString()}, Start: "${event.start}"`);
                } else {
                    console.log(`❌ Event NOT in target month: ID ${event.id}, Event date: ${eventMonth}/${eventYear}, Target: ${month}/${year}`);
                }

                return isInTargetMonth;

            } catch (error) {
                console.warn(`⚠️ Error parsing date for event ${event.id}: "${event.start}" - ${error.message}`);
                return false;
            }
        });

        console.log(`✅ Final result: ${employeeEventsForMonth.length} events for employee ${employeeId} in ${month}/${year}`);

        // СТЪПКА 6.5: Debug - показваме финалните събития
        if (employeeEventsForMonth.length > 0) {
            console.log('📋 Events found for the month:');
            employeeEventsForMonth.forEach((event, index) => {
                const eventDate = new Date(event.start);
                const day = eventDate.getDate();
                const timeStr = eventDate.toLocaleTimeString('bg-BG', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
                console.log(`  ${index + 1}. Day ${day}: ${timeStr} - ${event.activity || event.leaveType || 'Work'}`);
            });
        } else {
            console.log('❌ NO EVENTS found for this employee in this month!');
            console.log('🔍 Debugging info:');
            console.log(`   - Total events in system: ${allEvents.length}`);
            console.log(`   - Events for employee ${employeeId}: ${employeeEvents.length}`);
            console.log(`   - Target month/year: ${month}/${year}`);
        }

        // СТЪПКА 6.6: Сортираме събитията по дата
        employeeEventsForMonth.sort((a, b) => {
            const dateA = new Date(a.start);
            const dateB = new Date(b.start);
            return dateA - dateB;
        });

        return employeeEventsForMonth;

    } catch (error) {
        console.error('❌ Error fetching employee events:', error);
        throw error;
    }
}

/**
 * ПОПРАВЕНА ФУНКЦИЯ: Създава таблица с всички дни от месеца
 * ПОДОБРЕНА ЛОГИКА: По-точно съпоставяне на събития по дати
 *
 * @param {number} year - Година
 * @param {number} month - Месец (1-12)
 * @param {Array} events - Масив със събития за месеца
 * @returns {Array} Масив с обекти {day, date, event} за всеки ден
 */
function createDailyScheduleTable(year, month, events) {
    console.log(`📅 === СЪЗДАВАНЕ НА ДНЕВНА ТАБЛИЦА ===`);
    console.log(`📊 Input: ${month}/${year} with ${events.length} events`);

    // СТЪПКА 6.7: Определяме колко дни има месецът
    const daysInMonth = getDaysInMonth(year, month);
    console.log(`📋 Month ${month}/${year} has ${daysInMonth} days`);

    // СТЪПКА 6.8: Създаваме подробен map със събитията по дати
    console.log('🗂️ Creating events map by day...');
    const eventsByDate = new Map();

    events.forEach((event, eventIndex) => {
        try {
            // Парсираме датата на събитието
            const eventDate = new Date(event.start);

            // Получаваме деня от месеца (1-31)
            const dayOfMonth = eventDate.getDate();

            console.log(`📌 Processing event ${eventIndex + 1}:`);
            console.log(`   - Event ID: ${event.id}`);
            console.log(`   - Start: "${event.start}"`);
            console.log(`   - Parsed date: ${eventDate.toLocaleDateString()}`);
            console.log(`   - Day of month: ${dayOfMonth}`);
            console.log(`   - Activity/Leave: ${event.activity || event.leaveType || 'Work'}`);

            // Ако вече има събития за този ден, добавяме го към масива
            if (!eventsByDate.has(dayOfMonth)) {
                eventsByDate.set(dayOfMonth, []);
                console.log(`   - Created new array for day ${dayOfMonth}`);
            }

            eventsByDate.get(dayOfMonth).push(event);
            console.log(`   - Added to day ${dayOfMonth} (total events for day: ${eventsByDate.get(dayOfMonth).length})`);

        } catch (error) {
            console.error(`❌ Error processing event ${eventIndex + 1}:`, error);
            console.error(`   - Event data:`, event);
        }
    });

    console.log(`🗂️ Events map created:`);
    eventsByDate.forEach((dayEvents, day) => {
        console.log(`   - Day ${day}: ${dayEvents.length} events`);
    });

    // СТЪПКА 6.9: Създаваме масив с всички дни от месеца
    console.log('📋 Creating daily schedule array...');
    const dailySchedule = [];

    for (let day = 1; day <= daysInMonth; day++) {
        // СТЪПКА 6.10: Създаваме датата за текущия ден
        const currentDate = new Date(year, month - 1, day); // month-1 защото JS месеците са 0-based
        const dayName = getDayNameBulgarian(currentDate.getDay());

        console.log(`📅 Processing day ${day} (${dayName}):`);

        // СТЪПКА 6.11: Проверяваме дали има събития за този ден
        const dayEvents = eventsByDate.get(day) || [];
        console.log(`   - Found ${dayEvents.length} events for day ${day}`);

        let eventDescription = '';

        if (dayEvents.length > 0) {
            // СТЪПКА 6.12: Ако има събития, форматираме ги
            console.log(`   - Processing ${dayEvents.length} events...`);

            eventDescription = dayEvents.map((event, eventIndex) => {
                console.log(`     Event ${eventIndex + 1}:`);

                if (event.leaveType && event.leaveType.trim() !== '') {
                    // За отпуски показваме типа отпуск
                    console.log(`       - Leave type: ${event.leaveType}`);
                    return `${event.leaveType}`;
                } else {
                    // За работни събития показваме времето и активността
                    try {
                        const startTime = new Date(event.start).toLocaleTimeString('bg-BG', {
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                        const endTime = new Date(event.end).toLocaleTimeString('bg-BG', {
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                        const activity = event.activity || 'Work';

                        const formattedEvent = `${startTime}-${endTime} (${activity})`;
                        console.log(`       - Work shift: ${formattedEvent}`);
                        return formattedEvent;

                    } catch (timeError) {
                        console.error(`       - Error formatting time:`, timeError);
                        return `Work shift (${event.activity || 'Work'})`;
                    }
                }
            }).join(', ');

            console.log(`   - Final description: "${eventDescription}"`);
        } else {
            // СТЪПКА 6.13: Ако няма събитие, определяме типа ден
            console.log(`   - No events found for day ${day}`);

            if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
                // Събота (6) или неделя (0)
                eventDescription = 'Weekend';
                console.log(`   - Marked as Weekend (day of week: ${currentDate.getDay()})`);
            } else {
                // Работен ден без планувано събитие
                eventDescription = 'Day off';
                console.log(`   - Marked as Day off (workday with no events)`);
            }
        }

        // СТЪПКА 6.14: Добавяме реда в таблицата
        const dayData = {
            day: day,
            dayName: dayName,
            fullDate: currentDate.toLocaleDateString('bg-BG'),
            eventDescription: eventDescription,
            hasEvent: dayEvents.length > 0
        };

        dailySchedule.push(dayData);
        console.log(`✅ Day ${day} added: ${eventDescription}`);
    }

    console.log(`✅ === ДНЕВНА ТАБЛИЦА ЗАВЪРШЕНА ===`);
    console.log(`📊 Created ${dailySchedule.length} entries for ${month}/${year}`);

    // СТЪПКА 6.15: Финален debug - показваме статистика
    const daysWithEvents = dailySchedule.filter(day => day.hasEvent).length;
    const dayOffs = dailySchedule.filter(day => day.eventDescription === 'Day off').length;
    const weekends = dailySchedule.filter(day => day.eventDescription === 'Weekend').length;

    console.log(`📈 Statistics:`);
    console.log(`   - Days with events: ${daysWithEvents}`);
    console.log(`   - Day offs: ${dayOffs}`);
    console.log(`   - Weekends: ${weekends}`);
    console.log(`   - Total: ${daysWithEvents + dayOffs + weekends} (should be ${daysInMonth})`);

    return dailySchedule;
}

/**
 * ПОМОЩНА ФУНКЦИЯ: Подобрена версия за получаване на дните в месеца
 * Също така прави debug проверка
 */
function getDaysInMonth(year, month) {
    // Използваме JavaScript Date трик
    const lastDayOfMonth = new Date(year, month, 0).getDate();

    console.log(`📅 Days in month ${month}/${year}: ${lastDayOfMonth}`);

    // Debug проверка за февруари и високосни години
    if (month === 2) {
        const isLeap = ((year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0));
        console.log(`🗓️ February ${year}: ${isLeap ? 'LEAP' : 'NORMAL'} year = ${lastDayOfMonth} days`);
    }

    return lastDayOfMonth;
}

/**
 * ПОМОЩНА ФУНКЦИЯ: Получава българското име на деня (подобрена версия)
 */
function getDayNameBulgarian(dayIndex) {
    const englishDays = [
        'Sunday',    // 0 - Неделя
        'Monday',    // 1 - Понеделник
        'Tuesday',   // 2 - Вторник
        'Wednesday', // 3 - Сряда
        'Thursday',  // 4 - Четвъртък
        'Friday',    // 5 - Петък
        'Saturday'   // 6 - Събота
    ];

    return englishDays[dayIndex] || 'Unknown';
}

// ЕКСПОРТИРАНЕ на поправените функции
window.fetchEmployeeEventsForMonth = fetchEmployeeEventsForMonth;
window.createDailyScheduleTable = createDailyScheduleTable;
window.getDaysInMonth = getDaysInMonth;
window.getDayNameBulgarian = getDayNameBulgarian;

console.log('✅ ПОПРАВЕНИ PDF функции заредени успешно с подобрен debug!');
/**
 * НОВА ФУНКЦИЯ: Генерира PDF документ с правилните работни часове
 * Заменя старата generatePDFDocument функция
 *
 * @param {string} employeeName - име на служителя
 * @param {number} year - година
 * @param {number} month - месец
 * @param {Object} dailyHoursData - данни от dailyHoursManager
 */
async function generatePDFDocumentWithWorkHours(employeeName, year, month, dailyHoursData) {
    console.log('📄 === ЗАПОЧВА ГЕНЕРИРАНЕ НА PDF ДОКУМЕНТ С ЧАСОВЕ ОБОБЩЕНИЕ ===');

    try {
        // СТЪПКА 1: Инициализираме jsPDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Получаваме ширината на страницата
        const pageWidth = doc.internal.pageSize.getWidth();

        function drawCenteredText(doc, text, y, fontSize = 10, fontStyle = 'normal', color = [80, 80, 80]) {
            doc.setFontSize(fontSize);
            doc.setFont('helvetica', fontStyle);
            doc.setTextColor(...color);
            const textWidth = doc.getTextWidth(text);
            const x = (pageWidth - textWidth) / 2;
            doc.text(text, x, y);
        }


        // СТЪПКА 2: Добавяме заглавие
        console.log('📝 Adding PDF header...');
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const monthName = monthNames[month - 1];

        // Заглавие на документа (центрирано)
        const titleText = `Work Schedule - ${monthName} ${year}`;
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(40, 40, 40);
        doc.text(titleText, (pageWidth - doc.getTextWidth(titleText)) / 2, 25);

        // Име на служителя (центрирано)
        const employeeText = `Employee: ${employeeName}`;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);
        doc.text(employeeText, (pageWidth - doc.getTextWidth(employeeText)) / 2, 35);

        // СТЪПКА 3: Добавяме обобщена статистика (центрирана)
        console.log('📊 Adding summary statistics...');
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        const summary = dailyHoursData.summary;
        const summaryText = `Total Days: ${summary.totalDays} | Work Days: ${summary.workDays} | Days Off: ${summary.dayOffs} | Leave Days: ${summary.leaveDays}`;
        doc.text(summaryText, (pageWidth - doc.getTextWidth(summaryText)) / 2, 45);
        // СТЪПКА 4: Създаваме данните за таблицата
        console.log('📋 Creating table data...');

        // Заглавия на колоните
        const tableHeaders = [['Date', 'Day', 'Work Hours']];

        // Данни за редовете
        const tableData = dailyHoursData.tableRows.map(row => [
            row.date,           // Дата (ДД.ММ)
            row.dayOfWeek,      // Ден от седмицата (Mon, Tue...)
            row.workHours       // Работни часове или статус
        ]);

        // Първо дефинирай желаната ширина на таблицата (сумата на cellWidth)
        const tableWidth = 25 + 25 + 60; // Или каквито стойности имаш в columnStyles

        // Изчисли хоризонталния margin
        const horizontalMargin = (pageWidth - tableWidth) / 2;

        // СТЪПКА 5: Добавяме таблицата с autoTable
        console.log('📊 Adding schedule table...');
        doc.autoTable({
            head: tableHeaders,
            body: tableData,
            startY: 55,
            margin: { left: horizontalMargin },
            theme: 'grid',
            styles: {
                fontSize: 9,
                cellPadding: 3,
            },
            headStyles: {
                fillColor: [41, 128, 185],
                textColor: 255,
                fontStyle: 'bold'
            },
            columnStyles: {
                0: { cellWidth: 25, halign: 'center' },  // Date column
                1: { cellWidth: 25, halign: 'center' },  // Day column
                2: { cellWidth: 60, halign: 'left' }     // Work Hours column
            },
            didParseCell: function(data) {
                // СТЪПКА 5a: Стилизираме различните типове дни с цветове
                if (data.section === 'body') {
                    const workHours = data.cell.raw;

                    // Работни часове (съдържат тире)
                    if (typeof workHours === 'string' && workHours.includes(' - ')) {
                        data.cell.styles.fillColor = [217, 237, 217]; // Светло зелено
                        data.cell.styles.textColor = [27, 94, 32];
                    }
                    // Отпуски (съдържат "leave")
                    else if (typeof workHours === 'string' && workHours.toLowerCase().includes('leave')) {
                        data.cell.styles.fillColor = [255, 228, 225]; // Светло червено
                        data.cell.styles.textColor = [183, 28, 28];
                    }
                    // Почивни дни
                    else if (workHours === 'Day off') {
                        data.cell.styles.fillColor = [255, 248, 225]; // Светло жълто
                        data.cell.styles.textColor = [255, 111, 0];
                    }
                    // Уикенди
                    else if (workHours === 'Weekend') {
                        data.cell.styles.fillColor = [248, 248, 248]; // Светло сиво
                        data.cell.styles.textColor = [117, 117, 117];
                    }
                }
            }
        });

        // СТЪПКА 6: ✅ НОВА ЧАСТ - ИЗПОЛЗВАМЕ СЪЩЕСТВУВАЩИТЕ ФУНКЦИИ
        console.log('⏰ === ДОБАВЯМЕ ОБОБЩЕНИЕ С ЧАСОВЕ (ИЗПОЛЗВАМЕ СЪЩЕСТВУВАЩИ ФУНКЦИИ) ===');

        // Получаваме позицията след таблицата
        const finalY = doc.lastAutoTable.finalY || 100;
        let currentY = finalY + 15;

        // ✅ ИЗПОЛЗВАМЕ твоите съществуващи функции и данни:

        // 1. Получаваме часовете от договора
        const contractHoursPerDay = currentEmployeeHourlyRate || 8; // Използваме глобалната променлива

        // 2. Използваме твоята функция calculateContractHoursForMonth
        console.log('🧮 Using existing calculateContractHoursForMonth function...');
        const contractCalculation = calculateContractHoursForMonth(contractHoursPerDay, year, month);
        const expectedHours = contractCalculation.totalContractHours;

        // 3. Получаваме планираните часове от currentWeeklyData (ако е налично)
        let actualPlannedHours = 0;
        if (currentWeeklyData && currentWeeklyData.weeklySchedule) {
            // Сумираме всички планирани часове от седмиците
            actualPlannedHours = currentWeeklyData.weeklySchedule.reduce((total, week) => {
                return total + (parseFloat(week.plannedHours) || 0);
            }, 0);
            console.log(`📊 Using currentWeeklyData: ${actualPlannedHours}h planned`);
        } else {
            // Fallback: Изчисляваме от dailyHoursData
            actualPlannedHours = calculateHoursFromDailyData(dailyHoursData.tableRows, contractHoursPerDay);
            console.log(`📊 Fallback calculation: ${actualPlannedHours}h planned`);
        }

        // 4. Изчисляваме разликата (използваме същата логика като в summary-то)
        const hoursDifference = actualPlannedHours - expectedHours;

        console.log(`📊 Hours calculation summary:`);
        console.log(`   Expected (contract): ${expectedHours}h`);
        console.log(`   Actual (planned): ${actualPlannedHours.toFixed(1)}h`);
        console.log(`   Difference: ${hoursDifference >= 0 ? '+' : ''}${hoursDifference.toFixed(1)}h`);

        // СТЪПКА 6a: Заглавие на обобщението
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(40, 40, 40);
        const summaryTitle = 'Monthly Hours Summary';
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(40, 40, 40);
        doc.text(summaryTitle, (pageWidth - doc.getTextWidth(summaryTitle)) / 2, currentY);
        currentY += 10;

        // СТЪПКА 6b: Добавяме линия за разделяне
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(20, currentY, 190, currentY);
        currentY += 8;

        // СТЪПКА 6c: Информация за договора
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);

        // Ред 1: Договорена норма
        drawCenteredText(doc, `Contract: ${contractHoursPerDay} hours/day × ${contractCalculation.workingDays} working days`, currentY, 10, 'normal', [80, 80, 80]);
        currentY += 6;

        // Ред 2: Очаквани часове
        drawCenteredText(doc, `Expected Hours: ${expectedHours} hours`, currentY, 10, 'bold', [80, 80, 80]);
        currentY += 8;

        // Ред 3: Действителни планувани часове
       drawCenteredText(doc, `Actual Planned: ${actualPlannedHours.toFixed(1)} hours`, currentY, 10, 'bold', [80, 80, 80]);
       currentY += 8;

        // Ред 4: Разликата (с цвят според знака)
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');

        // Определяме цвета според разликата
        let diffText = `Difference: ${hoursDifference >= 0 ? '+' : ''}${hoursDifference.toFixed(1)} hours`;
        let diffNote = hoursDifference > 0 ? ' (above target)' :
                       hoursDifference < 0 ? ' (below target)' :
                       ' (exactly on target)';
        let diffColor = hoursDifference > 0 ? [27, 94, 32] :
                        hoursDifference < 0 ? [183, 28, 28] :
                        [80, 80, 80];

        drawCenteredText(doc, `${diffText}${diffNote}`, currentY, 11, 'bold', diffColor);
        currentY += 8;

        // СТЪПКА 6d: Допълнителна информация
        drawCenteredText(
            doc,
            `Working days calculation: ${contractCalculation.totalDaysInMonth} total days - ${contractCalculation.weekendDays} weekends = ${contractCalculation.workingDays} working days`,
            currentY,
            8,
            'italic',
            [100, 100, 100]
        );
        currentY += 5;

        drawCenteredText(
            doc,
            `* Paid leave days are included in planned hours`,
            currentY,
            8,
            'italic',
            [100, 100, 100]
        );


        // СТЪПКА 7: Добавяме footer (преместен по-надолу)
        console.log('📝 Adding footer...');
        const pageHeight = doc.internal.pageSize.height;
        const footerY = pageHeight - 20;

        // Тънка линия
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.line(20, footerY - 5, 190, footerY - 5);

        // Footer текст
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('Generated by Employee Schedule System', 20, footerY);

        // Дата на генериране
        const now = new Date();
        const generatedDateTime = now.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        doc.text(`Generated: ${generatedDateTime}`, 190, footerY, { align: 'right' });

        // СТЪПКА 8: Записваме файла
        console.log('💾 Saving PDF file...');
        const fileName = `Schedule_${employeeName.replace(/\s+/g, '')}_${year}_${monthName}_with_hours.pdf`;
        doc.save(fileName);

        console.log(`✅ PDF saved as: ${fileName}`);
        console.log('🎉 PDF generation completed successfully with hours summary using existing functions!');

    } catch (error) {
        console.error('❌ Error generating PDF document:', error);
        throw error;
    }
}

// СТЪПКА 4.10: ПОМОЩНА ФУНКЦИЯ за получаване на българските имена на дните
// (Използва се в createDailyScheduleTable функцията)
function getDayNameBulgarian(dayIndex) {
    // dayIndex: 0=Неделя, 1=Понеделник, 2=Вторник, и т.н.
    const bulgarianDays = [
        'Sunday',    // 0 - Неделя
        'Monday',    // 1 - Понеделник
        'Tuesday',   // 2 - Вторник
        'Wednesday', // 3 - Сряда
        'Thursday',  // 4 - Четвъртък
        'Friday',    // 5 - Петък
        'Saturday'   // 6 - Събота
    ];

    return bulgarianDays[dayIndex] || 'Unknown';
}

/**
 * ✅ ПОМОЩНА ФУНКЦИЯ: Изчислява часовете от дневните данни (fallback ако няма currentWeeklyData)
 * @param {Array} tableRows - редовете от таблицата
 * @param {number} contractHoursPerDay - часове от договора
 * @returns {number} общо изчислени часове
 */
function calculateHoursFromDailyData(tableRows, contractHoursPerDay) {
    let totalHours = 0;

    console.log('🧮 Calculating hours from daily data (fallback method)...');

    tableRows.forEach((row, index) => {
        if (row.workHours && typeof row.workHours === 'string') {

            // СЛУЧАЙ 1: Работни часове (съдържат тире, напр. "13:30 - 22:30")
            if (row.workHours.includes(' - ')) {
                const hours = calculateHoursFromTimeRange(row.workHours);
                totalHours += hours;
                console.log(`   Day ${index + 1}: ${row.date} - ${row.workHours} = ${hours}h`);
            }
            // СЛУЧАЙ 2: Платени отпуски (count as work hours)
            else if (row.workHours.toLowerCase().includes('paid leave') ||
                     row.workHours.toLowerCase().includes('vacation')) {
                totalHours += contractHoursPerDay;
                console.log(`   Day ${index + 1}: ${row.date} - ${row.workHours} = ${contractHoursPerDay}h (paid leave)`);
            }
            // СЛУЧАЙ 3: Неплатени отпуски или почивни дни (не броим)
            else {
                console.log(`   Day ${index + 1}: ${row.date} - ${row.workHours} = 0h (not counted)`);
            }
        }
    });

    console.log(`📊 Total calculated hours from daily data: ${totalHours}h`);
    return totalHours;
}

/**
 * ✅ ПОМОЩНА ФУНКЦИЯ: Изчислява часовете от интервал от време
 * @param {string} timeRange - напр. "13:30 - 22:30"
 * @returns {number} часовете
 */
function calculateHoursFromTimeRange(timeRange) {
    try {
        const parts = timeRange.split(' - ');
        if (parts.length !== 2) return 0;

        const startTime = parts[0].trim();
        const endTime = parts[1].trim();

        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);

        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;

        const diffMinutes = endMinutes - startMinutes;
        const hours = diffMinutes / 60;

        return Math.max(0, hours);

    } catch (error) {
        console.error('❌ Error calculating hours from time range:', timeRange, error);
        return 0;
    }
}
window.calculateHoursFromDailyData = calculateHoursFromDailyData;
window.calculateHoursFromTimeRange = calculateHoursFromTimeRange;
// СТЪПКА 4.11: ЕКСПОРТИРАНЕ на новите функции за глобално използване
window.downloadSchedulePDF = downloadSchedulePDF;
//window.fetchEmployeeEventsForMonth = fetchEmployeeEventsForMonth;
//window.createDailyScheduleTable = createDailyScheduleTable;
window.generatePDFDocumentWithWorkHours = generatePDFDocumentWithWorkHours;

// =====================================
// ЕКСПОРТИРАНЕ НА ФУНКЦИИТЕ
// Правим функциите достъпни глобално за използване в други модули
// =====================================

window.initializeWeeklyScheduleManager = initializeWeeklyScheduleManager;
window.refreshWeeklyScheduleForEmployee = refreshWeeklyScheduleForEmployee;
window.isWeeklyScheduleVisible = isWeeklyScheduleVisible;
window.getCurrentSelectedEmployeeId = getCurrentSelectedEmployeeId;
window.getCurrentEmployeeHourlyRate = getCurrentEmployeeHourlyRate;
window.getCurrentEmployeeWeeklyContractHours = getCurrentEmployeeWeeklyContractHours;
window.calculateWeeklyContractHours = calculateWeeklyContractHours;

// НОВИ ФУНКЦИИ ЗА ПЛАТЕНИ ОТПУСКИ:
window.isPaidLeaveType = isPaidLeaveType; // НОВА: Проверява дали отпускът е платен
window.generateSummaryInfoWithPaidLeave = generateSummaryInfoWithPaidLeave; // ОБНОВЕНА ФУНКЦИЯ

// ФУНКЦИИ ЗА ТОЧНО ИЗЧИСЛЕНИЕ НА ДОГОВОРЕНИТЕ ЧАСОВЕ:
window.calculateContractHoursForMonth = calculateContractHoursForMonth;
window.getDaysInMonth = getDaysInMonth;
window.isLeapYearCheck = isLeapYearCheck;
window.countWeekendsInMonth = countWeekendsInMonth;
window.getDayNameBulgarian = getDayNameBulgarian;
window.getCurrentCalendarMonth = getCurrentCalendarMonth;

// СТАРИ ФУНКЦИИ (ЗАПАЗЕНИ ЗА СЪВМЕСТИМОСТ):
window.setupCalendarMonthChangeListener = setupCalendarMonthChangeListener;
window.updateWeeklyScheduleTitleWithDate = updateWeeklyScheduleTitleWithDate;
window.setupWeeklyScheduleToggle = setupWeeklyScheduleToggle;

console.log('✅ Weekly Schedule Manager with PAID LEAVE support loaded successfully');
console.log('💰 Supported paid leave types:', Array.from(PAID_LEAVE_TYPES));
console.log('🚫 Unsupported leave types:', Array.from(UNPAID_LEAVE_TYPES));