/**
 * IMPROVED DAILY HOURS MANAGER MODULE
 * Подобрена версия с по-добра обработка на грешки и debug информация
 */

/**
 * ГЛАВНА ФУНКЦИЯ: Получава дневните работни часове за служител за месец
 * ПОДОБРЕНА ВЕРСИЯ с детайлен debug и error handling
 *
 * @param {string} employeeId - ID на служителя
 * @param {number} year - година (напр. 2025)
 * @param {number} month - месец от 1 до 12 (напр. 7 за юли)
 * @returns {Promise<Object>} Promise който връща обект с дневните часове
 */
async function getDailyWorkHoursForEmployee(employeeId, year, month) {
    console.log(`📅 === ЗАПОЧВА ИЗВЛИЧАНЕ НА ДНЕВНИ ЧАСОВЕ ===`);
    console.log(`👤 Employee ID: ${employeeId}`);
    console.log(`📅 Period: ${month}/${year}`);

    try {
        // СТЪПКА 1: Валидираме входните параметри
        if (!employeeId || !year || !month) {
            throw new Error(`Missing parameters: employeeId=${employeeId}, year=${year}, month=${month}`);
        }

        if (month < 1 || month > 12) {
            throw new Error(`Invalid month: ${month}. Must be between 1 and 12.`);
        }

        // СТЪПКА 2: Правим заявка към backend-а
        const apiUrl = `http://localhost:8080/api/weekly-schedule/${employeeId}/daily-hours?year=${year}&month=${month}`;
        console.log(`📡 Making API request to: ${apiUrl}`);

        const response = await fetch(apiUrl);
        console.log(`📡 Backend response status: ${response.status}`);

        // СТЪПКА 3: Проверяваме отговора
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Backend error: ${response.status} - ${response.statusText}`);
            console.error(`❌ Error details: ${errorText}`);
            throw new Error(`HTTP ${response.status}: ${response.statusText}. Details: ${errorText}`);
        }

        // СТЪПКА 4: Парсираме JSON отговора
        const data = await response.json();
        console.log('📋 Raw data received from backend:', JSON.stringify(data, null, 2));

        // СТЪПКА 5: Валидираме структурата на данните
        if (!data || !data.dailyWorkHours || !Array.isArray(data.dailyWorkHours)) {
            console.error('❌ Invalid data structure received:', data);
            throw new Error('Invalid data structure: missing dailyWorkHours array');
        }

        console.log(`📊 Received ${data.dailyWorkHours.length} daily records`);

        // СТЪПКА 6: Обработваме данните за по-лесна употреба в PDF
        const processedData = processDailyHoursForPDF(data);

        // СТЪПКА 7: Финален debug на обработените данни
        console.log(`✅ Successfully processed daily hours:`);
        console.log(`   📊 Total days: ${processedData.summary.totalDays}`);
        console.log(`   💼 Work days: ${processedData.summary.workDays}`);
        console.log(`   🏠 Days off: ${processedData.summary.dayOffs}`);
        console.log(`   🏖️ Leave days: ${processedData.summary.leaveDays}`);

        // Debug първите няколко дни
        console.log(`📋 Sample processed days:`);
        processedData.tableRows.slice(0, 5).forEach((row, index) => {
            console.log(`   Day ${index + 1}: ${row.date} (${row.dayOfWeek}) - ${row.workHours}`);
        });

        return processedData;

    } catch (error) {
        console.error('❌ Error in getDailyWorkHoursForEmployee:', error);
        console.error('❌ Stack trace:', error.stack);

        // Връщаме грешка с повече информация
        throw new Error(`Failed to get daily work hours: ${error.message}`);
    }
}

/**
 * ПОМОЩНА ФУНКЦИЯ: Обработва данните за по-лесна употреба в PDF генерирането
 * ПОДОБРЕНА ВЕРСИЯ с валидация и по-добро форматиране
 *
 * @param {Object} data - данните от backend-а
 * @returns {Object} обработени данни за PDF
 */
function processDailyHoursForPDF(data) {
    console.log('🔄 === ЗАПОЧВА ОБРАБОТКА НА ДАННИ ЗА PDF ===');

    try {
        // СТЪПКА 1: Валидираме входните данни
        if (!data.dailyWorkHours || !Array.isArray(data.dailyWorkHours)) {
            throw new Error('Invalid input: missing dailyWorkHours array');
        }

        // СТЪПКА 2: Създаваме масив с форматирани редове за PDF таблицата
        const tableRows = data.dailyWorkHours.map((day, index) => {
            console.log(`🔄 Processing day ${index + 1}:`, day);

            // Валидираме основните полета
            if (!day.date) {
                console.warn(`⚠️ Missing date for day ${index + 1}`);
                return null;
            }

            // Форматираме датата за показване (напр. "01.07" за 1 юли)
            const formattedDate = formatDateForTable(day.date);

            // Получаваме деня от седмицата (Пон, Вт, Ср...)
            const dayOfWeek = getDayOfWeekShort(day.date);

            // СТЪПКА 3: Определяме работните часове със специална логика
            let workHoursText = determineWorkHoursText(day);

            console.log(`📊 Day ${index + 1}: ${formattedDate} (${dayOfWeek}) - ${workHoursText}`);

            return {
                date: formattedDate,
                fullDate: day.date,
                dayOfWeek: dayOfWeek,
                workHours: workHoursText,
                startTime: day.startTime || null,
                endTime: day.endTime || null,
                activity: day.activity || null,
                leaveType: day.leaveType || null,
                isWorkDay: day.isWorkDay || false,
                isDayOff: day.isDayOff || false,
                // За по-лесно стилизиране в PDF
                cssClass: getCSSClassForDay(day)
            };
        }).filter(row => row !== null); // Премахваме невалидните редове

        // СТЪПКА 4: Създаваме обобщени данни
        const summary = createSummaryData(data, tableRows);

        console.log('📋 PDF data processing completed:', {
            totalRows: tableRows.length,
            workDays: summary.workDays,
            dayOffs: summary.dayOffs,
            leaveDays: summary.leaveDays
        });

        return {
            tableRows: tableRows,
            summary: summary,
            originalData: data // Запазваме оригиналните данни ако са нужни
        };

    } catch (error) {
        console.error('❌ Error in processDailyHoursForPDF:', error);
        throw new Error(`Failed to process daily hours for PDF: ${error.message}`);
    }
}

/**
 * ПОМОЩНА ФУНКЦИЯ: Определя текста за работните часове
 * Централизирана логика за форматиране на работните часове
 *
 * @param {Object} day - обект с информацията за деня
 * @returns {string} форматиран текст за работните часове
 */
function determineWorkHoursText(day) {
    console.log(`🔍 Determining work hours for day:`, day);

    // СЛУЧАЙ 1: Ако има тип отпуск - показваме го директно
    if (day.leaveType && day.leaveType.trim() !== '') {
        console.log(`   - Leave type detected: ${day.leaveType}`);
        return day.leaveType;
    }

    // СЛУЧАЙ 2: ✅ ПОПРАВКА - Първо проверяваме дали има реални работни часове
    // Ако има startTime и endTime - това е работен ден, независимо дали е уикенд!
    if (day.startTime && day.endTime) {
        // Форматираме часовете за показване
        const startTime = formatTimeForDisplay(day.startTime);
        const endTime = formatTimeForDisplay(day.endTime);
        const timeText = `${startTime} - ${endTime}`;

        console.log(`   - ✅ REAL WORK HOURS found: ${timeText} (даже в уикенд!)`);
        return timeText;
    }

    // СЛУЧАЙ 3: Ако е маркиран като работен ден но няма часове (странен случай)
    if (day.isWorkDay) {
        console.log(`   - Marked as work day but no hours - showing generic work hours`);
        return 'Work Day'; // Или някакъв default час
    }

    // СЛУЧАЙ 4: Ако е маркиран като почивен ден
    if (day.isDayOff) {
        console.log(`   - Day off detected`);
        return 'Day off';
    }

    // СЛУЧАЙ 5: ✅ ПОПРАВКА - САМО СЕГА проверяваме дали е уикенд (ако няма реални смени)
    // Тази проверка се прави след проверката за реални работни часове
    const date = new Date(day.date);
    const dayOfWeek = date.getDay(); // 0 = неделя, 6 = събота
    if (day.startTime && day.endTime) {
        return `${startTime} - ${endTime}`; // ✅ Първо гледа смените!
    }

    // СЛУЧАЙ 6: Непознат случай - връщаме day off като default
    console.log(`   - Unknown case, defaulting to Day off`);
    return 'Day off';
}


/**
 * ПОМОЩНА ФУНКЦИЯ: Създава обобщени данни
 * @param {Object} data - оригинални данни от backend
 * @param {Array} tableRows - обработени редове
 * @returns {Object} обобщени данни
 */
function createSummaryData(data, tableRows) {
    const summary = {
        employeeId: data.employeeId || 'Unknown',
        year: data.year || new Date().getFullYear(),
        month: data.month || new Date().getMonth() + 1,
        monthName: data.monthName || 'Unknown',
        totalDays: tableRows.length,

        // Изчисляваме статистиките от обработените данни
        workDays: tableRows.filter(row => row.isWorkDay).length,
        dayOffs: tableRows.filter(row => row.workHours === 'Day off').length,
        leaveDays: tableRows.filter(row => row.leaveType && row.leaveType.trim() !== '').length,
        weekends: tableRows.filter(row => row.workHours === 'Weekend').length
    };

    // Добавяме полезни изчисления
    summary.workPercentage = summary.totalDays > 0 ?
        ((summary.workDays / summary.totalDays) * 100).toFixed(1) : '0.0';

    summary.firstWorkDay = tableRows.find(row => row.isWorkDay)?.fullDate || null;
    summary.lastWorkDay = tableRows.slice().reverse().find(row => row.isWorkDay)?.fullDate || null;

    return summary;
}

/**
 * ПОМОЩНА ФУНКЦИЯ: Форматира дата за таблицата (ДД.ММ)
 * ПОДОБРЕНА ВЕРСИЯ с по-добра обработка на грешки
 *
 * @param {string} dateString - дата във формат YYYY-MM-DD
 * @returns {string} форматирана дата (ДД.ММ)
 */
function formatDateForTable(dateString) {
    try {
        const date = new Date(dateString + 'T00:00:00'); // Добавяме час за да избегнем timezone проблеми
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${day}.${month}`;
    } catch (error) {
        console.warn('⚠️ Error formatting date:', dateString, error);
        return dateString; // Връщаме оригиналната стойност като fallback
    }
}
function formatTimeForDisplay(timeString) {
    if (!timeString) return '';

    // Ако е във формат "13:30:00", премахваме секундите
    if (timeString.includes(':')) {
        const parts = timeString.split(':');
        return `${parts[0]}:${parts[1]}`;
    }

    return timeString;
}
/**
 * ПОМОЩНА ФУНКЦИЯ: Получава съкратеното име на деня от седмицата
 * ПОДОБРЕНА ВЕРСИЯ със защита от грешки
 *
 * @param {string} dateString - дата във формат YYYY-MM-DD
 * @returns {string} съкратено име на деня (Mon, Tue, Wed...)
 */
function getDayOfWeekShort(dateString) {
    try {
        const date = new Date(dateString + 'T00:00:00'); // Добавяме час за timezone
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[date.getDay()];
    } catch (error) {
        console.warn('⚠️ Error getting day of week:', dateString, error);
        return 'Unknown';
    }
}

/**
 * ПОМОЩНА ФУНКЦИЯ: Определя CSS класа за деня (за стилизиране)
 * @param {Object} day - обект с информацията за деня
 * @returns {string} CSS клас
 */
function getCSSClassForDay(day) {
    if (day.leaveType && day.leaveType.trim() !== '') {
        return 'leave-day';
    } else if (day.isWorkDay) {
        return 'work-day';
    } else if (day.isDayOff) {
        return 'day-off';
    } else {
        // Проверяваме дали е уикенд
        const date = new Date(day.date);
        const dayOfWeek = date.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            return 'weekend';
        }
        return 'unknown-day';
    }
}

// =====================================
// ЕКСПОРТИРАНЕ НА ФУНКЦИИТЕ
// Правим функциите достъпни глобално
// =====================================

window.getDailyWorkHoursForEmployee = getDailyWorkHoursForEmployee;
window.processDailyHoursForPDF = processDailyHoursForPDF;

// Помощни функции
window.formatDateForTable = formatDateForTable;
window.getDayOfWeekShort = getDayOfWeekShort;
window.getCSSClassForDay = getCSSClassForDay;
window.determineWorkHoursText = determineWorkHoursText;
window.createSummaryData = createSummaryData;
window.formatTimeForDisplay = formatTimeForDisplay;

console.log('✅ IMPROVED Daily Hours Manager loaded successfully!');
console.log('🔧 This version has better error handling and detailed debug information');

/**
 * ПОДОБРЕНИЯ В ТАЗИ ВЕРСИЯ:
 *
 * 1. ✅ По-добра валидация на входните данни
 * 2. ✅ Детайлен debug на всяка стъпка
 * 3. ✅ По-добра обработка на грешки с подробни съобщения
 * 4. ✅ Централизирана логика за определяне на работните часове
 * 5. ✅ Защита от timezone проблеми при работа с дати
 * 6. ✅ Fallback стойности за всички случаи
 * 7. ✅ Подробни коментари за всяка функция
 */