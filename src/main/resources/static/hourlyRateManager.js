/**
 * HOURLY RATE MANAGER MODULE
 * Управлява зареждането и показването на hourly rates в dropdown селектори
 */

/**
 * ГЛАВНА ФУНКЦИЯ: Инициализира hourly rate management
 */
async function initializeHourlyRateManager() {
    console.log('💰 Initializing Hourly Rate Manager...');

    try {
        await populateAllHourlyRateSelects();
        console.log('✅ Hourly Rate Manager initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing hourly rates:', error);
    }
}
/**
 * ФУНКЦИЯ: Зарежда активни hourly rates от API-то
 * @returns {Promise<Array>} Promise който връща масив с hourly rates
 */
async function loadHourlyRatesFromDatabase() {
    console.log('📡 Loading hourly rates from database...');

    try {
        // СТЪПКА 1: Правим заявка към backend API
        const response = await fetch('http://localhost:8080/api/hourly-rates/active');
        console.log(`📡 Backend response status: ${response.status}`);

        // СТЪПКА 2: Проверяваме дали заявката е успешна
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        // СТЪПКА 3: Парсираме JSON отговора
        const hourlyRates = await response.json();

        // СТЪПКА 4: Валидираме данните
        if (!Array.isArray(hourlyRates)) {
            throw new Error('Invalid response format: expected array of hourly rates');
        }

        console.log(`✅ Successfully loaded ${hourlyRates.length} hourly rates:`);
        hourlyRates.forEach(rate => {
            console.log(`   💵 ${rate.rateName} - ${rate.dailyHours}h/day (ID: ${rate.id})`);
        });

        return hourlyRates;

    } catch (error) {
        console.error('❌ Error loading hourly rates from database:', error);
        console.error('❌ Stack trace:', error.stack);

        // Връщаме празен масив в случай на грешка
        throw error;
    }
}

/**
 * ФУНКЦИЯ: Попълва HTML select елемент с hourly rates от базата данни
 * @param {string} selectId - ID на select елемента
 * @param {string|number} selectedValue - (опционално) стойност която трябва да бъде избрана
 */
async function populateHourlyRateSelect(selectId, selectedValue = null) {
    console.log(`📋 Populating select #${selectId} with hourly rates...`);

    try {
        // СТЪПКА 1: Намираме select елемента
        const selectElement = document.getElementById(selectId);
        if (!selectElement) {
            console.error(`❌ Select element #${selectId} not found`);
            return;
        }

        // СТЪПКА 2: Зареждаме hourly rates от базата данни
        const hourlyRates = await loadHourlyRatesFromDatabase();

        // СТЪПКА 3: Изчистваме текущите опции
        selectElement.innerHTML = '';

        // СТЪПКА 4: Добавяме placeholder опция
        const placeholderOption = document.createElement('option');
        placeholderOption.value = '';
        placeholderOption.disabled = true;
        placeholderOption.selected = true;
        placeholderOption.textContent = 'Select Hourly Rate';
        selectElement.appendChild(placeholderOption);

        // СТЪПКА 5: Добавяме hourly rates като опции
        hourlyRates.forEach(rate => {
            const option = document.createElement('option');
            option.value = rate.id; // Използваме ID като value
            option.textContent = `${rate.rateName} (${rate.dailyHours}h/day)`;

            // Задаваме description като data атрибут за бъдеща употреба
            if (rate.description) {
                option.setAttribute('data-description', rate.description);
            }

            selectElement.appendChild(option);
        });

        // СТЪПКА 6: Задаваме избраната стойност ако има такава
        if (selectedValue !== null && selectedValue !== undefined) {
            selectElement.value = selectedValue;
            console.log(`🎯 Selected hourly rate: ${selectedValue}`);
        }

        console.log(`✅ Successfully populated select #${selectId} with ${hourlyRates.length} hourly rates`);

    } catch (error) {
        console.error(`❌ Error populating select #${selectId}:`, error);

        // В случай на грешка, показваме error опция
        const selectElement = document.getElementById(selectId);
        if (selectElement) {
            selectElement.innerHTML = '<option value="" disabled selected>Error loading rates</option>';
        }
    }
}

/**
 * ФУНКЦИЯ: Попълва всички hourly rate селектори на страницата
 */
async function populateAllHourlyRateSelects() {
    console.log('🔄 Populating all hourly rate selects...');

    try {
        // Намираме всички hourly rate селектори
        const hourlyRateSelects = document.querySelectorAll('.hourly-rate-select, #hourlyRate, [name="hourlyRate"]');

        if (hourlyRateSelects.length === 0) {
            console.log('ℹ️ No hourly rate select elements found to initialize');
            return;
        }

        console.log(`📋 Found ${hourlyRateSelects.length} hourly rate select elements`);

        // Попълваме всеки select
        const promises = Array.from(hourlyRateSelects).map(async (select) => {
            const selectId = select.id || `hourly-rate-select-${Math.random().toString(36).substr(2, 9)}`;
            if (!select.id) {
                select.id = selectId;
            }

            try {
                await populateHourlyRateSelect(selectId);
                console.log(`   ✅ Initialized select: #${selectId}`);
            } catch (error) {
                console.error(`   ❌ Failed to initialize select: #${selectId}`, error);
            }
        });

        // Чакаме всички да приключат
        await Promise.all(promises);
        console.log('✅ All hourly rate selects initialized successfully');

    } catch (error) {
        console.error('❌ Error initializing hourly rate selects:', error);
    }
}

/**
 * ФУНКЦИЯ: Обновява конкретен hourly rate select (за refresh след промени)
 * @param {string} selectId - ID на select елемента за обновяване
 * @param {string|number} selectedValue - (опционално) стойност която да остане избрана
 */
async function refreshHourlyRateSelect(selectId, selectedValue = null) {
    console.log(`🔄 Refreshing hourly rate select #${selectId}...`);

    try {
        await populateHourlyRateSelect(selectId, selectedValue);
        console.log(`✅ Successfully refreshed select #${selectId}`);
    } catch (error) {
        console.error(`❌ Error refreshing select #${selectId}:`, error);
        throw error;
    }
}

/**
 * ПОМОЩНА ФУНКЦИЯ: Намиране на hourly rate ID по име
 * @param {string} rateName - името на ставката
 * @returns {Promise<number|null>} ID на ставката или null ако не е намерена
 */
async function getHourlyRateIdByName(rateName) {
    console.log(`🔍 Finding hourly rate ID for name: "${rateName}"`);

    try {
        const hourlyRates = await loadHourlyRatesFromDatabase();
        const rate = hourlyRates.find(r => r.rateName === rateName);

        if (rate) {
            console.log(`✅ Found hourly rate ID: ${rate.id} for name: "${rateName}"`);
            return rate.id;
        } else {
            console.log(`❌ Hourly rate not found with name: "${rateName}"`);
            return null;
        }
    } catch (error) {
        console.error('❌ Error finding hourly rate by name:', error);
        return null;
    }
}

/**
 * ПОМОЩНА ФУНКЦИЯ: Намиране на hourly rate име по ID
 * @param {number} rateId - ID на ставката
 * @returns {Promise<string|null>} името на ставката или null ако не е намерена
 */
async function getHourlyRateNameById(rateId) {
    console.log(`🔍 Finding hourly rate name for ID: ${rateId}`);

    try {
        const hourlyRates = await loadHourlyRatesFromDatabase();
        const rate = hourlyRates.find(r => r.id == rateId);

        if (rate) {
            console.log(`✅ Found hourly rate name: "${rate.rateName}" for ID: ${rateId}`);
            return rate.rateName;
        } else {
            console.log(`❌ Hourly rate not found with ID: ${rateId}`);
            return null;
        }
    } catch (error) {
        console.error('❌ Error finding hourly rate by ID:', error);
        return null;
    }
}

/**
 * НОВА ФУНКЦИЯ: Задава избрана стойност на hourly rate select
 * @param {string} selectId - ID на select елемента
 * @param {string|number} hourlyRateId - ID на hourly rate за избиране
 */
async function setSelectedHourlyRate(selectId, hourlyRateId) {
    console.log(`🎯 Setting selected hourly rate: ${hourlyRateId} in select #${selectId}`);

    try {
        const selectElement = document.getElementById(selectId);
        if (!selectElement) {
            console.error(`❌ Select element #${selectId} not found`);
            return;
        }

        // Ако селектора не е попълнен, попълваме го първо
        if (selectElement.children.length <= 1) {
            await populateHourlyRateSelect(selectId, hourlyRateId);
        } else {
            // Директно задаваме стойността
            selectElement.value = hourlyRateId;
        }

        // Trigger change event за да се активират listeners
        selectElement.dispatchEvent(new Event('change'));

        console.log(`✅ Successfully set hourly rate selection: ${hourlyRateId}`);

    } catch (error) {
        console.error(`❌ Error setting selected hourly rate:`, error);
    }
}

/**
 * ПОМОЩНА ФУНКЦИЯ: Валидира hourly rate селектора
 * @param {string} selectId - ID на select елемента
 * @returns {boolean} true ако е валиден
 */
function validateHourlyRateSelect(selectId) {
    const selectElement = document.getElementById(selectId);

    if (!selectElement) {
        console.error(`❌ Hourly rate select #${selectId} not found`);
        return false;
    }

    if (!selectElement.value || selectElement.value === '') {
        console.error(`❌ No hourly rate selected in #${selectId}`);
        return false;
    }

    console.log(`✅ Hourly rate select #${selectId} is valid: ${selectElement.value}`);
    return true;
}

// =====================================
// ГЛОБАЛНИ ЕКСПОРТИ
// =====================================

// Правим функциите достъпни глобално
window.initializeHourlyRateManager = initializeHourlyRateManager;
window.loadHourlyRatesFromDatabase = loadHourlyRatesFromDatabase;
window.populateHourlyRateSelect = populateHourlyRateSelect;
window.populateAllHourlyRateSelects = populateAllHourlyRateSelects;
window.refreshHourlyRateSelect = refreshHourlyRateSelect;
window.getHourlyRateIdByName = getHourlyRateIdByName;
window.getHourlyRateNameById = getHourlyRateNameById;
window.setSelectedHourlyRate = setSelectedHourlyRate;
window.validateHourlyRateSelect = validateHourlyRateSelect;

console.log('✅ Hourly Rate Manager module loaded successfully');