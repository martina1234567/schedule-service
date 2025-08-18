/**
 * МОДУЛ ЗА АВТОМАТИЧНО ГЕНЕРИРАНЕ НА ГРАФИК
 * Управлява UI и комуникацията с backend за генериране на месечни графици
 */

// ГЛОБАЛНИ ПРОМЕНЛИВИ
let scheduleGeneratorModal = null;
let isGenerating = false;

/**
 * ФУНКЦИЯ: Инициализира модула за генериране на график
 * Трябва да се извика при зареждане на страницата
 */
function initializeScheduleGenerator() {
    console.log('🚀 Инициализиране на модула за генериране на график...');

    // СТЪПКА 1: Създаваме бутона за генериране (ако не съществува)
    createGenerateScheduleButton();

    // СТЪПКА 2: Създаваме модалния прозорец
    createScheduleGeneratorModal();

    // СТЪПКА 3: Добавяме event listeners
    attachEventListeners();

    console.log('✅ Модулът за генериране на график е инициализиран');
}

/**
 * ФУНКЦИЯ: Създава бутон за генериране на график в UI
 */
function createGenerateScheduleButton() {
    // Търсим подходящо място за бутона (до други бутони в header-а)
    const headerButtons = document.querySelector('.header-buttons') ||
                         document.querySelector('header') ||
                         document.querySelector('#employee-section .form-actions');

    if (headerButtons) {
        // Проверяваме дали бутонът вече съществува
        if (!document.getElementById('generate-schedule-btn')) {
            const generateBtn = document.createElement('button');
            generateBtn.id = 'generate-schedule-btn';
            generateBtn.className = 'generate-schedule-btn';
            generateBtn.innerHTML = '🔄 Generate Monthly Schedule';
            generateBtn.title = 'Автоматично генериране на месечен график';

            headerButtons.appendChild(generateBtn);
            console.log('📋 Създаден бутон за генериране на график');
        }
    } else {
        console.warn('⚠️ Не е намерено място за бутона за генериране');
    }
}

/**
 * ФУНКЦИЯ: Създава модален прозорец за настройки на генерирането
 */
function createScheduleGeneratorModal() {
    // Премахваме стар modal ако съществува
    const existingModal = document.getElementById('schedule-generator-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // Създаваме новия modal
    const modal = document.createElement('div');
    modal.id = 'schedule-generator-modal';
    modal.className = 'modal-overlay';
    modal.style.display = 'none';

    // Получаваме текущия месец и година
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // JavaScript месеците са 0-based
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextMonthYear = currentMonth === 12 ? currentYear + 1 : currentYear;

    modal.innerHTML = `
        <div class="modal-content schedule-generator-modal">
            <div class="modal-header">
                <h2>🔄 Generate Monthly Schedule</h2>
                <button class="modal-close" onclick="closeScheduleGeneratorModal()">&times;</button>
            </div>

            <div class="modal-body">
                <div class="info-section">
                    <p><strong>📅 This will automatically generate a balanced work schedule for all employees.</strong></p>
                    <ul>
                        <li>✅ Balanced shift distribution (first, second, middle shifts)</li>
                        <li>✅ Respects contract hours (4h, 6h, 8h per day)</li>
                        <li>✅ Maximum 6 consecutive work days</li>
                        <li>✅ Minimum 12 hours rest between shifts</li>
                        <li>✅ Preserves manually created shifts</li>
                        <li>⚠️ Will delete existing auto-generated shifts for the selected month</li>
                    </ul>
                </div>

                <div class="generation-settings">
                    <div class="form-group">
                        <label for="generation-year">Year:</label>
                        <select id="generation-year" class="form-control">
                            <option value="${currentYear - 1}">${currentYear - 1}</option>
                            <option value="${currentYear}" selected>${currentYear}</option>
                            <option value="${currentYear + 1}">${currentYear + 1}</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="generation-month">Month:</label>
                        <select id="generation-month" class="form-control">
                            <option value="1">January</option>
                            <option value="2">February</option>
                            <option value="3">March</option>
                            <option value="4">April</option>
                            <option value="5">May</option>
                            <option value="6">June</option>
                            <option value="7">July</option>
                            <option value="8">August</option>
                            <option value="9">September</option>
                            <option value="10">October</option>
                            <option value="11">November</option>
                            <option value="12">December</option>
                        </select>
                    </div>

                    <div class="suggested-options">
                        <p><strong>Quick options:</strong></p>
                        <button type="button" class="quick-option-btn" onclick="setGenerationDate(${currentYear}, ${currentMonth})">
                            Current Month (${getMonthName(currentMonth)} ${currentYear})
                        </button>
                        <button type="button" class="quick-option-btn" onclick="setGenerationDate(${nextMonthYear}, ${nextMonth})">
                            Next Month (${getMonthName(nextMonth)} ${nextMonthYear})
                        </button>
                    </div>
                </div>

                <div id="generation-status" class="generation-status" style="display: none;">
                    <div class="loading-spinner"></div>
                    <span id="generation-status-text">Generating schedule...</span>
                </div>
            </div>

            <div class="modal-footer">
                <button type="button" class="cancel-btn" onclick="closeScheduleGeneratorModal()">Cancel</button>
                <button type="button" id="start-generation-btn" class="primary-btn" onclick="startScheduleGeneration()">
                    🚀 Generate Schedule
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    scheduleGeneratorModal = modal;

    // Задаваме по подразбиране следващия месец
    setGenerationDate(nextMonthYear, nextMonth);
}

/**
 * ФУНКЦИЯ: Добавя event listeners за функционалността
 */
function attachEventListeners() {
    // Event listener за главния бутон
    const generateBtn = document.getElementById('generate-schedule-btn');
    if (generateBtn) {
        generateBtn.addEventListener('click', showScheduleGeneratorModal);
    }

    // Event listener за затваряне на modal при клик извън него
    if (scheduleGeneratorModal) {
        scheduleGeneratorModal.addEventListener('click', function(event) {
            if (event.target === scheduleGeneratorModal) {
                closeScheduleGeneratorModal();
            }
        });
    }
}

/**
 * ФУНКЦИЯ: Показва модалния прозорец за генериране
 */
function showScheduleGeneratorModal() {
    console.log('📋 Отваряне на modal за генериране на график');

    if (scheduleGeneratorModal) {
        scheduleGeneratorModal.style.display = 'block';

        // Добавяме анимация
        setTimeout(() => {
            scheduleGeneratorModal.classList.add('show');
        }, 10);
    }
}

/**
 * ФУНКЦИЯ: Затваря модалния прозорец
 */
function closeScheduleGeneratorModal() {
    console.log('❌ Затваряне на modal за генериране');

    if (scheduleGeneratorModal && !isGenerating) {
        scheduleGeneratorModal.classList.remove('show');

        setTimeout(() => {
            scheduleGeneratorModal.style.display = 'none';
            resetGenerationStatus();
        }, 300);
    }
}

/**
 * ФУНКЦИЯ: Задава дата за генериране (за quick options)
 */
function setGenerationDate(year, month) {
    const yearSelect = document.getElementById('generation-year');
    const monthSelect = document.getElementById('generation-month');

    if (yearSelect && monthSelect) {
        yearSelect.value = year;
        monthSelect.value = month;

        console.log(`📅 Зададена дата за генериране: ${month}/${year}`);
    }
}

/**
 * ФУНКЦИЯ: Стартира процеса на генериране
 */
async function startScheduleGeneration() {
    console.log('🚀 Стартиране на генериране на график...');

    // СТЪПКА 1: Вземаме избраните стойности
    const year = parseInt(document.getElementById('generation-year').value);
    const month = parseInt(document.getElementById('generation-month').value);

    // СТЪПКА 2: Валидираме входните данни
    if (!year || !month || year < 2020 || year > 2030 || month < 1 || month > 12) {
        alert('Моля изберете валидна година и месец!');
        return;
    }

    // СТЪПКА 3: Потвърждение от потребителя
    const monthName = getMonthName(month);
    const confirmMessage = `Сигурни ли сте, че искате да генерирате график за ${monthName} ${year}?\n\nТова ще изтрие всички автоматично генерирани смени за този месец!`;

    if (!confirm(confirmMessage)) {
        console.log('❌ Потребителят отказа генерирането');
        return;
    }

    // СТЪПКА 4: Показваме loading състояние
    showGenerationInProgress();

    try {
        // СТЪПКА 5: Правим заявка към backend
        console.log(`📡 Праща заявка за генериране: ${month}/${year}`);

        const response = await fetch('/api/schedule-generation/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                year: year,
                month: month
            })
        });

        const result = await response.json();

        // СТЪПКА 6: Обработваме отговора
        if (response.ok && result.success) {
            // Успех
            showGenerationSuccess(result);

            // Опресняваме календара ако съществува
             if (typeof refreshCalendar === 'function') {
                 setTimeout(() => {
                     refreshCalendar();
                 }, 1000);
             }

             // ДОБАВИ ТЕЗИ РЕДОВЕ:
             // Обновяваме седмичните данни за избрания служител (ако има такъв)
            const selectedEmployeeSelect = document.getElementById('employeeSelect');
            if (selectedEmployeeSelect && selectedEmployeeSelect.value && typeof loadAndShowWeeklySchedule === 'function') {
                const selectedEmployeeId = selectedEmployeeSelect.value;
                const selectedEmployeeName = selectedEmployeeSelect.options[selectedEmployeeSelect.selectedIndex]?.text;

                console.log(`🔄 Refreshing weekly data for employee: ${selectedEmployeeName} (ID: ${selectedEmployeeId})`);

                setTimeout(() => {
                    console.log('📊 Calling loadAndShowWeeklySchedule to refresh sidebar data...');
                    loadAndShowWeeklySchedule(selectedEmployeeId, selectedEmployeeName);
                }, 2000); // Изчакваме 2 секунди за да се обнови календарът първо
            }

        } else {
            // Грешка от сървъра
            throw new Error(result.error || 'Неизвестна грешка от сървъра');
        }

    } catch (error) {
        console.error('❌ Грешка при генериране:', error);
        showGenerationError(error.message);
    }
}

/**
 * ФУНКЦИЯ: Показва loading състояние по време на генериране
 */
function showGenerationInProgress() {
    isGenerating = true;

    const statusDiv = document.getElementById('generation-status');
    const statusText = document.getElementById('generation-status-text');
    const generateBtn = document.getElementById('start-generation-btn');

    if (statusDiv && statusText && generateBtn) {
        statusText.textContent = 'Generating schedule... Please wait.';
        statusDiv.style.display = 'flex';
        generateBtn.disabled = true;
        generateBtn.textContent = 'Generating...';
    }
}

/**
 * ФУНКЦИЯ: Показва успешен резултат
 */
function showGenerationSuccess(result) {
    const statusDiv = document.getElementById('generation-status');
    const statusText = document.getElementById('generation-status-text');

    if (statusDiv && statusText) {
        statusDiv.className = 'generation-status success';
        statusText.innerHTML = `✅ ${result.message}<br>Generated ${result.generatedShifts} shifts successfully!`;

        // Автоматично затваряне след 3 секунди
        setTimeout(() => {
            closeScheduleGeneratorModal();
        }, 3000);
    }

    isGenerating = false;
}

/**
 * ФУНКЦИЯ: Показва грешка
 */
function showGenerationError(errorMessage) {
    const statusDiv = document.getElementById('generation-status');
    const statusText = document.getElementById('generation-status-text');
    const generateBtn = document.getElementById('start-generation-btn');

    if (statusDiv && statusText) {
        statusDiv.className = 'generation-status error';
        statusText.innerHTML = `❌ Error: ${errorMessage}`;
    }

    if (generateBtn) {
        generateBtn.disabled = false;
        generateBtn.textContent = '🚀 Generate Schedule';
    }

    isGenerating = false;
}

/**
 * ФУНКЦИЯ: Ресетва статуса на генерирането
 */
function resetGenerationStatus() {
    const statusDiv = document.getElementById('generation-status');
    const generateBtn = document.getElementById('start-generation-btn');

    if (statusDiv) {
        statusDiv.style.display = 'none';
        statusDiv.className = 'generation-status';
    }

    if (generateBtn) {
        generateBtn.disabled = false;
        generateBtn.textContent = '🚀 Generate Schedule';
    }

    isGenerating = false;
}

/**
 * ПОМОЩНА ФУНКЦИЯ: Връща име на месеца
 */
function getMonthName(month) {
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return monthNames[month - 1] || 'Unknown';
}

/**
 * ПОМОЩНА ФУНКЦИЯ: Опреснява календара (ако съществува)
 */
function refreshCalendar() {
    console.log('🔄 Опресняване на календара...');

    // Проверяваме дали съществува глобалния calendar обект от FullCalendar
    if (window.calendar && typeof window.calendar.refetchEvents === 'function') {
        window.calendar.refetchEvents();
        console.log('✅ Календарът е опреснен');
    } else {
        // Алтернативно опресняване чрез презареждане на страницата
        console.log('🔄 Презареждане на страницата за опресняване...');
        setTimeout(() => {
            window.location.reload();
        }, 2000);
    }
}

// АВТОМАТИЧНО ИНИЦИАЛИЗИРАНЕ ПРИ ЗАРЕЖДАНЕ НА ДОКУМЕНТА
document.addEventListener('DOMContentLoaded', function() {
    // Изчакваме малко преди инициализиране, за да се заредят другите модули
    setTimeout(initializeScheduleGenerator, 500);
});