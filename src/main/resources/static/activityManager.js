/**
 * ПОМОЩНИ ФУНКЦИИ ЗА РАБОТА С ACTIVITY ID И NAMES
 */

/**
 * ФУНКЦИЯ: Намира activity ID по име
 * @param {string} activityName - името на activity
 * @returns {Promise<number|null>} ID на activity или null ако не е намерена
 */
async function getActivityIdByName(activityName) {
    console.log(`🔍 Finding activity ID for name: "${activityName}"`);

    try {
        const activities = await loadActivitiesFromDatabase();
        const activity = activities.find(a => a.name === activityName);

        if (activity) {
            console.log(`✅ Found activity ID: ${activity.id} for name: "${activityName}"`);
            return activity.id;
        } else {
            console.log(`❌ Activity not found with name: "${activityName}"`);
            return null;
        }
    } catch (error) {
        console.error('❌ Error finding activity by name:', error);
        return null;
    }
}

/**
 * ФУНКЦИЯ: Намира activity име по ID
 * @param {number} activityId - ID на activity
 * @returns {Promise<string|null>} името на activity или null ако не е намерена
 */
async function getActivityNameById(activityId) {
    console.log(`🔍 Finding activity name for ID: ${activityId}`);

    try {
        const activities = await loadActivitiesFromDatabase();
        const activity = activities.find(a => a.id == activityId);

        if (activity) {
            console.log(`✅ Found activity name: "${activity.name}" for ID: ${activityId}`);
            return activity.name;
        } else {
            console.log(`❌ Activity not found with ID: ${activityId}`);
            return null;
        }
    } catch (error) {
        console.error('❌ Error finding activity by ID:', error);
        return null;
    }
}

/**
 * ФУНКЦИЯ: Получава избраната activity от select елемент
 * @param {string} selectId - ID на select елемента
 * @returns {Object|null} обект с {id, name} или null
 */
async function getSelectedActivity(selectId) {
    const selectElement = document.getElementById(selectId);
    if (!selectElement || !selectElement.value) {
        return null;
    }

    const selectedValue = selectElement.value;
    const selectedOption = selectElement.selectedOptions[0];

    if (!selectedOption) {
        return null;
    }

    // Проверяваме дали value-то е ID или име
    if (selectedOption.hasAttribute('data-activity-name')) {
        // Value е ID, името е в data атрибут
        return {
            id: parseInt(selectedValue),
            name: selectedOption.getAttribute('data-activity-name')
        };
    } else if (selectedOption.hasAttribute('data-activity-id')) {
        // Value е име, ID-то е в data атрибут
        return {
            id: parseInt(selectedOption.getAttribute('data-activity-id')),
            name: selectedValue
        };
    } else {
        // Legacy режим - value е име, трябва да намерим ID
        const activityId = await getActivityIdByName(selectedValue);
        return {
            id: activityId,
            name: selectedValue
        };
    }
}

/**
 * ФУНКЦИЯ: Задава избрана activity в select елемент
 * @param {string} selectId - ID на select елемента
 * @param {number|string} value - ID или име на activity
 */
async function setSelectedActivity(selectId, value) {
    const selectElement = document.getElementById(selectId);
    if (!selectElement) {
        console.error(`Select element #${selectId} not found`);
        return;
    }

    // Опитваме се да намерим опцията по value
    const options = Array.from(selectElement.options);
    let targetOption = options.find(option => option.value == value);

    if (!targetOption) {
        // Ако не намерим по value, може би value е името а трябва да търсим по data атрибут
        targetOption = options.find(option =>
            option.getAttribute('data-activity-name') === value ||
            option.getAttribute('data-activity-id') == value
        );
    }

    if (targetOption) {
        selectElement.value = targetOption.value;
        console.log(`✅ Selected activity: ${targetOption.textContent} in select #${selectId}`);
    } else {
        console.error(`❌ Could not find activity option for value: ${value} in select #${selectId}`);
    }
}/**
 * ACTIVITY MANAGER
 * Модул за управление на дейностите (activities) в приложението
 * Заменя хардкоднатите activities със заявки към backend API-то
 */

/**
 * ГЛАВНА ФУНКЦИЯ: Зарежда всички активни activities от backend-а
 * @returns {Promise<Array>} масив с activity обекти
 */
async function loadActivitiesFromDatabase() {
    console.log('📋 Loading activities from database...');

    try {
        // СТЪПКА 1: Правим заявка към backend API-то
        const response = await fetch('/api/activities', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        // СТЪПКА 2: Проверяваме дали заявката е успешна
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        // СТЪПКА 3: Парсираме JSON отговора
        const activities = await response.json();

        // СТЪПКА 4: Валидираме данните
        if (!Array.isArray(activities)) {
            throw new Error('Invalid response format: expected array of activities');
        }

        console.log(`✅ Successfully loaded ${activities.length} activities:`);
        activities.forEach(activity => {
            console.log(`   🎯 ${activity.name} (ID: ${activity.id}, Order: ${activity.displayOrder})`);
        });

        return activities;

    } catch (error) {
        console.error('❌ Error loading activities from database:', error);
        console.error('❌ Stack trace:', error.stack);

        // Връщаме празен масив в случай на грешка
        throw error;
    }
}

/**
 * ФУНКЦИЯ: Популира HTML select елемент с activities от базата данни
 * @param {string} selectId - ID на select елемента
 * @param {string|number} selectedValue - (опционално) стойност която трябва да бъде избрана (може да е ID или име)
 * @param {boolean} useIdAsValue - (опционално) дали да използваме ID като value вместо име (default: true)
 */
async function populateActivitySelect(selectId, selectedValue = null, useIdAsValue = true) {
    console.log(`🔄 Populating select #${selectId} with activities...`);
    console.log(`🔧 Using ${useIdAsValue ? 'ID' : 'name'} as option values`);

    try {
        // СТЪПКА 1: Намираме select елемента
        const selectElement = document.getElementById(selectId);
        if (!selectElement) {
            throw new Error(`Select element with ID '${selectId}' not found`);
        }

        // СТЪПКА 2: Зареждаме activities от базата данни
        const activities = await loadActivitiesFromDatabase();

        // СТЪПКА 3: Изчистваме съществуващите опции (но запазваме placeholder ако има)
        const hasPlaceholder = selectElement.children[0] &&
                              selectElement.children[0].value === '';

        if (hasPlaceholder) {
            // Запазваме само първия placeholder елемент
            const placeholder = selectElement.children[0];
            selectElement.innerHTML = '';
            selectElement.appendChild(placeholder);
        } else {
            // Изчистваме всички опции
            selectElement.innerHTML = '';

            // Добавяме placeholder опция
            const placeholderOption = document.createElement('option');
            placeholderOption.value = '';
            placeholderOption.textContent = 'Select Activity';
            placeholderOption.disabled = true;
            placeholderOption.selected = !selectedValue; // Избрано ако няма selectedValue
            selectElement.appendChild(placeholderOption);
        }

        // СТЪПКА 4: Добавяме всяка activity като опция
        activities.forEach(activity => {
            const option = document.createElement('option');

            // НОВО: Използваме ID като value (по подразбиране) или име за съвместимост
            if (useIdAsValue) {
                option.value = activity.id; // Използваме ID като стойност
                option.setAttribute('data-activity-name', activity.name); // Запазваме името като data атрибут
            } else {
                option.value = activity.name; // Legacy режим - използваме името
                option.setAttribute('data-activity-id', activity.id); // Запазваме ID като data атрибут
            }

            option.textContent = activity.name;

            // Проверяваме за избор по ID или име
            let isSelected = false;
            if (selectedValue) {
                if (useIdAsValue) {
                    isSelected = activity.id == selectedValue; // Сравняваме ID
                } else {
                    isSelected = activity.name === selectedValue; // Сравняваме име
                }
            }

            if (isSelected) {
                option.selected = true;
                console.log(`   ✅ Selected option: ${activity.name} (ID: ${activity.id})`);
            }

            selectElement.appendChild(option);
        });

        console.log(`✅ Successfully populated select #${selectId} with ${activities.length} activities`);

    } catch (error) {
        console.error(`❌ Error populating select #${selectId}:`, error);

        // Показваме грешка в select-а
        const selectElement = document.getElementById(selectId);
        if (selectElement) {
            selectElement.innerHTML = '<option value="" disabled selected>Error loading activities</option>';
        }

        // Rethrow грешката за да може да се обработи от извикващия код
        throw error;
    }
}

/**
 * ФУНКЦИЯ: Инициализира activity селектите при зареждане на страницата
 * Автоматично намира всички select елементи с class 'activity-select' и ги популира
 * @param {boolean} useIdAsValue - дали да използваме ID като value (default: true)
 */
async function initializeActivitySelects(useIdAsValue = true) {
    console.log('🚀 Initializing all activity selects...');
    console.log(`🔧 Mode: Using ${useIdAsValue ? 'ID' : 'name'} as option values`);

    try {
        // Намираме всички select елементи за activities
        const activitySelects = document.querySelectorAll('.activity-select, #activity, [name="activity"]');

        if (activitySelects.length === 0) {
            console.log('ℹ️ No activity select elements found to initialize');
            return;
        }

        console.log(`📋 Found ${activitySelects.length} activity select elements`);

        // Популираме всеки select
        const promises = Array.from(activitySelects).map(async (select) => {
            const selectId = select.id || `select-${Math.random().toString(36).substr(2, 9)}`;
            if (!select.id) {
                select.id = selectId;
            }

            try {
                await populateActivitySelect(selectId, null, useIdAsValue);
                console.log(`   ✅ Initialized select: #${selectId}`);
            } catch (error) {
                console.error(`   ❌ Failed to initialize select: #${selectId}`, error);
            }
        });

        // Чакаме всички да приключат
        await Promise.all(promises);
        console.log('✅ All activity selects initialized successfully');

    } catch (error) {
        console.error('❌ Error initializing activity selects:', error);
    }
}

/**
 * ФУНКЦИЯ: Обновява конкретен activity select (за refresh след промени)
 * @param {string} selectId - ID на select елемента за обновяване
 * @param {string|number} selectedValue - (опционално) стойност която да остане избрана
 * @param {boolean} useIdAsValue - дали да използваме ID като value (default: true)
 */
async function refreshActivitySelect(selectId, selectedValue = null, useIdAsValue = true) {
    console.log(`🔄 Refreshing activity select #${selectId}...`);

    try {
        await populateActivitySelect(selectId, selectedValue, useIdAsValue);
        console.log(`✅ Successfully refreshed select #${selectId}`);
    } catch (error) {
        console.error(`❌ Error refreshing select #${selectId}:`, error);
        throw error;
    }
}

/**
 * ФУНКЦИЯ: Създава нова activity в базата данни
 * @param {Object} activityData - данни за новата activity
 * @returns {Promise<Object>} създадената activity
 */
async function createActivity(activityData) {
    console.log('➕ Creating new activity:', activityData);

    try {
        const response = await fetch('/api/activities', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(activityData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const createdActivity = await response.json();
        console.log('✅ Successfully created activity:', createdActivity);

        return createdActivity;

    } catch (error) {
        console.error('❌ Error creating activity:', error);
        throw error;
    }
}

/**
 * ФУНКЦИЯ: Актуализира съществуваща activity
 * @param {number} activityId - ID на activity за актуализиране
 * @param {Object} activityData - нови данни
 * @returns {Promise<Object>} актуализираната activity
 */
async function updateActivity(activityId, activityData) {
    console.log(`✏️ Updating activity ${activityId}:`, activityData);

    try {
        const response = await fetch(`/api/activities/${activityId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(activityData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const updatedActivity = await response.json();
        console.log('✅ Successfully updated activity:', updatedActivity);

        return updatedActivity;

    } catch (error) {
        console.error('❌ Error updating activity:', error);
        throw error;
    }
}

/**
 * ФУНКЦИЯ: Изтрива activity (soft delete)
 * @param {number} activityId - ID на activity за изтриване
 * @returns {Promise<boolean>} true ако е успешно
 */
async function deleteActivity(activityId) {
    console.log(`🗑️ Deleting activity ${activityId}...`);

    try {
        const response = await fetch(`/api/activities/${activityId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        console.log(`✅ Successfully deleted activity ${activityId}`);
        return true;

    } catch (error) {
        console.error('❌ Error deleting activity:', error);
        throw error;
    }
}

/**
 * ПОМОЩНА ФУНКЦИЯ: Показва loading индикатор в select
 * @param {string} selectId - ID на select елемента
 */
function showActivitySelectLoading(selectId) {
    const selectElement = document.getElementById(selectId);
    if (selectElement) {
        selectElement.innerHTML = '<option value="" disabled selected>Loading activities...</option>';
        selectElement.disabled = true;
    }
}

/**
 * ПОМОЩНА ФУНКЦИЯ: Премахва loading индикатора от select
 * @param {string} selectId - ID на select елемента
 */
function hideActivitySelectLoading(selectId) {
    const selectElement = document.getElementById(selectId);
    if (selectElement) {
        selectElement.disabled = false;
    }
}

/**
 * ФУНКЦИЯ ЗА ТЪРСЕНЕ: Намира activities по име (за autocomplete функционалност)
 * @param {string} searchTerm - текст за търсене
 * @returns {Promise<Array>} филтрирани activities
 */
async function searchActivities(searchTerm) {
    console.log(`🔍 Searching activities for: "${searchTerm}"`);

    try {
        const activities = await loadActivitiesFromDatabase();
        const filtered = activities.filter(activity =>
            activity.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        console.log(`✅ Found ${filtered.length} matching activities`);
        return filtered;

    } catch (error) {
        console.error('❌ Error searching activities:', error);
        throw error;
    }
}

// =====================================
// EVENT LISTENERS И ИНИЦИАЛИЗАЦИЯ
// =====================================

/**
 * Автоматично инициализиране на activity selects при зареждане на DOM
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM loaded - initializing activity management...');

    // Инициализираме activity selects с малко закъснение
    // за да сме сигурни че всички елементи са заредени
    setTimeout(() => {
        initializeActivitySelects().catch(error => {
            console.error('❌ Failed to initialize activity selects on page load:', error);
        });
    }, 100);
});

/**
 * EXPORT: Функции за използване в други модули
 * (ако използваш ES6 modules, можеш да разкоментираш това)
 */
/*
export {
    loadActivitiesFromDatabase,
    populateActivitySelect,
    initializeActivitySelects,
    refreshActivitySelect,
    createActivity,
    updateActivity,
    deleteActivity,
    searchActivities
};
*/

// =====================================
// ГЛОБАЛНИ ФУНКЦИИ (за съвместимост с existing код)
// =====================================

// Правим основните функции глобално достъпни за съвместимост
window.activityManager = {
    load: loadActivitiesFromDatabase,
    populate: populateActivitySelect,
    initialize: initializeActivitySelects,
    refresh: refreshActivitySelect,
    create: createActivity,
    update: updateActivity,
    delete: deleteActivity,
    search: searchActivities,
    // НОВО: Помощни функции за ID/име конвертиране
    getIdByName: getActivityIdByName,
    getNameById: getActivityNameById,
    getSelected: getSelectedActivity,
    setSelected: setSelectedActivity
};