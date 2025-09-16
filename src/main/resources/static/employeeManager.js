/**
 * Employee Management Module
 * Handles all employee-related operations including CRUD operations,
 * form management, and employee list display
 */

// Global variables for employee management state
let isEditMode = false; // Flag to track if we're in edit mode
let editingEmployeeId = null; // ID of the employee being edited

/**
 * Initializes employee management functionality
 * Sets up event listeners and loads initial data
 */
async function initializeEmployeeManager() {
    console.log('👥 Initializing Employee Manager...');

    // 1. Зареждаме служителите
    await loadEmployees();

    // 2. НОВО: Зареждаме hourly rates в dropdown-а
    await populateAllHourlyRateSelects();

    // 3. Настройваме event listeners
    setupEmployeeEventListeners();

    console.log('✅ Employee Manager initialized successfully');
}

/**
 * Sets up all event listeners for employee management
 */
function setupEmployeeEventListeners() {
    // Add Employee button click handler
    document.getElementById('addEmployeeBtn').addEventListener('click', function() {
        console.log("➕ Add Employee button clicked");

        // Скриваме всички възможни отворени форми и списъци
        hideAllFormsAndLists();

        // Hide employee selection dropdown and its label
        document.getElementById('employeeSelect').classList.add('hidden');
        document.querySelector('label[for="employeeSelect"]').classList.add('hidden');

        // Hide the add button and show the employee form
        document.getElementById('addEmployeeBtn').classList.add('hidden');
        document.getElementById('employeeForm').classList.remove('hidden');

        // Ensure we're in add mode, not edit mode
        isEditMode = false;
        editingEmployeeId = null;
        document.getElementById('submitEmployee').textContent = '✔';

        // Clear any existing form data
        clearEmployeeForm();

        console.log("📝 Employee add form opened");
    });

    // Submit Employee button click handler
    document.getElementById('submitEmployee').addEventListener('click', handleEmployeeSubmit);

    // View Employees button click handler
    document.getElementById('viewEmployeesBtn').addEventListener('click', function() {
        console.log("👥 View employees button clicked");

        // Ако сме в edit mode, първо reset-ваме формата
        if (isEditMode) {
            console.log("🔄 Exiting edit mode before showing employee list");
            resetEmployeeForm();
        }

        // Скриваме всички събития форми
        hideEventForms();

        // Toggle visibility of employee list container
        const employeeListContainer = document.getElementById('employeeListContainer');
        employeeListContainer.classList.toggle('hidden');

        // Hide other UI elements when showing employee list
        if (!employeeListContainer.classList.contains('hidden')) {
            document.getElementById('employeeForm').classList.add('hidden');
            document.getElementById('employeeSelect').classList.add('hidden');
            document.querySelector('label[for="employeeSelect"]').classList.add('hidden');
        } else {
            // If hiding employee list, show back the normal UI
            document.getElementById('employeeSelect').classList.remove('hidden');
            document.querySelector('label[for="employeeSelect"]').classList.remove('hidden');
        }

        // Show/hide search input based on list visibility
        const searchInput = document.getElementById('searchInput');
        if (!employeeListContainer.classList.contains('hidden') &&
            document.getElementById('employeeList').children.length > 0) {
            searchInput.style.display = "block";
        } else {
            searchInput.style.display = "none";
        }
    });
}

/**
 * ОБНОВЕНА ФУНКЦИЯ: Handles employee form submission for both create and update operations
 * Сега включва изчистване на запазеното състояние след успешен submit
 */
async function handleEmployeeSubmit() {
    console.log('📝 Processing employee form submission...');

    // Get form field values
    const name = document.getElementById('name').value;
    const lastname = document.getElementById('lastname').value;
    const email = document.getElementById('email').value;
    const position = document.getElementById('position').value;
    const hourlyRateId = document.getElementById('hourlyRate').value; // НОВО: Вземаме ID вместо име

    // Validate that all fields are filled
    if (name && lastname && email && position && hourlyRateId) {

        // Determine if we're creating or updating
        let requestUrl = 'http://localhost:8080/employees';
        let method = 'POST';

        if (isEditMode && editingEmployeeId) {
            requestUrl = `http://localhost:8080/employees/${editingEmployeeId}`;
            method = 'PUT';
        }

        try {
            // ПОПРАВЕНО: Сега изпращаме само основните данни БЕЗ hourlyRate в body
            const response = await fetch(requestUrl, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: name,
                    lastname: lastname,
                    email: email,
                    position: position
                    // НЕ ИЗПРАЩАМЕ hourlyRate в DTO-то
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const savedEmployee = await response.json();
            console.log('✅ Employee saved successfully:', savedEmployee);

            // СТЪПКА 2: Ако служителят е записан успешно, присвояваме hourly rate отделно
            if (hourlyRateId && hourlyRateId !== '') {
                try {
                    const assignResponse = await fetch(`http://localhost:8080/employees/${savedEmployee.id}/hourly-rate/${hourlyRateId}`, {
                        method: 'PUT'
                    });

                    if (assignResponse.ok) {
                        console.log(`✅ Hourly rate ${hourlyRateId} assigned to employee ${savedEmployee.id}`);
                    } else {
                        console.warn(`⚠️ Failed to assign hourly rate: ${assignResponse.statusText}`);
                    }
                } catch (error) {
                    console.warn('⚠️ Error assigning hourly rate:', error);
                }
            }

            // Show success message
            if (isEditMode) {
                alert(`Employee updated successfully: ${savedEmployee.name} ${savedEmployee.lastname}`);
            } else {
                alert(`Employee added successfully: ${savedEmployee.name} ${savedEmployee.lastname}`);
            }

            // Clear saved form state after successful submission
            if (typeof clearAllSavedFormsState === 'function') {
                clearAllSavedFormsState();
                console.log('🗑️ Cleared saved form state after successful employee submission');
            }

            // Reset form and reload employee list
            resetEmployeeForm();
            await loadEmployees();

        } catch (error) {
            console.error('❌ Error saving employee:', error);
            alert('Error saving employee: ' + error.message);
        }

    } else {
        alert('All fields are required!');
        console.warn('⚠️ Form validation failed - missing required fields');
    }
}
/**
 * НОВА ФУНКЦИЯ: Популира всички hourly rate select елементи
 * Може да се използва и за refresh на select-ите
 */
async function populateAllHourlyRateSelects() {
    console.log('💰 Populating all hourly rate selects...');

    const selectIds = ['hourlyRate']; // Добави други ID-та на select елементи тук ако има такива

    for (const selectId of selectIds) {
        const selectElement = document.getElementById(selectId);
        if (selectElement) {
            await loadHourlyRatesIntoSelectElement(selectElement);
        }
    }
}

/**
 * ПОМОЩНА ФУНКЦИЯ: Зарежда hourly rates в конкретен select елемент
 */
async function loadHourlyRatesIntoSelectElement(selectElement) {
    if (!selectElement) return;

    try {
        // Показваме loading индикатор
        const originalHTML = selectElement.innerHTML;
        selectElement.innerHTML = '<option value="" disabled selected>Loading rates...</option>';

        // Правим заявка към backend
        const response = await fetch('/api/hourly-rates/active');

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const hourlyRates = await response.json();

        // Изчистваме и добавяме опциите
        selectElement.innerHTML = '<option value="" disabled selected>Select hourly rate...</option>';

        hourlyRates.forEach(rate => {
            const option = document.createElement('option');
            option.value = rate.id;
            option.textContent = `${rate.rateName} (${rate.dailyHours}h/day)`;
            selectElement.appendChild(option);
        });

        console.log(`✅ Successfully populated select #${selectElement.id} with ${hourlyRates.length} hourly rates`);

    } catch (error) {
        console.error(`❌ Error loading hourly rates for select #${selectElement.id}:`, error);
        selectElement.innerHTML = '<option value="" disabled selected>Error loading rates</option>';
    }
}
/**
 * НОВА ПОМОЩНА ФУНКЦИЯ: Зарежда hourly rates в select елемента
 * Тази функция ще се извиква когато е нужно да се попълни select-ът
 */
async function loadHourlyRatesIntoSelect() {
    console.log('💰 Loading hourly rates into select...');

    const hourlyRateSelect = document.getElementById('hourlyRate');
    if (!hourlyRateSelect) {
        console.error('❌ Hourly rate select element not found');
        return;
    }

    try {
        // Показваме loading индикатор
        hourlyRateSelect.innerHTML = '<option value="" disabled selected>Loading rates...</option>';

        // Правим заявка към backend за активните hourly rates
        const response = await fetch('/api/hourly-rates/active');

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const hourlyRates = await response.json();
        console.log('📋 Loaded hourly rates:', hourlyRates);

        // Изчистваме select-а
        hourlyRateSelect.innerHTML = '<option value="" disabled selected>Select hourly rate...</option>';

        // Добавяме опциите
        hourlyRates.forEach(rate => {
            const option = document.createElement('option');
            option.value = rate.id;
            option.textContent = `${rate.rateName} (${rate.dailyHours}h/day)`;
            hourlyRateSelect.appendChild(option);
        });

        console.log(`✅ Successfully loaded ${hourlyRates.length} hourly rates into select`);

    } catch (error) {
        console.error('❌ Error loading hourly rates:', error);
        hourlyRateSelect.innerHTML = '<option value="" disabled selected>Error loading rates</option>';
    }
}

/**
 * Loads all employees from the backend and populates both dropdown and list
 */
async function loadEmployees() {
    console.log('📡 Loading employees from backend...');

    try {
        const response = await fetch('http://localhost:8080/employees');

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const employees = await response.json();
        console.log('✅ Loaded employees:', employees);

        // Populate employee select dropdown
        const employeeSelect = document.getElementById('employeeSelect');
        if (employeeSelect) {
            employeeSelect.innerHTML = '<option value="" disabled selected>Select Employee</option>';

            employees.forEach(employee => {
                const option = document.createElement('option');
                option.value = employee.id;
                option.textContent = `${employee.name} ${employee.lastname}`;
                employeeSelect.appendChild(option);
            });
        }

        // ПОПРАВКА: Използваме новата async функция за списъка
        await populateEmployeeList(employees);

        console.log(`✅ Successfully loaded and displayed ${employees.length} employees`);

    } catch (error) {
        console.error('❌ Error loading employees:', error);
        alert('Error loading employees: ' + error.message);
    }
}
/**
 * Populates the employee list with edit and delete buttons
 * @param {Array} employees - Array of employee objects
 */
/**
 * ПОПРАВЕНА: Populates the employee list with edit and delete buttons
 * Сега правилно зарежда hourly rate ID за всеки служител
 */
async function populateEmployeeList(employees) {
    const employeeList = document.getElementById('employeeList');
    employeeList.innerHTML = ''; // Clear existing list

    for (const employee of employees) {
        console.log(`🔍 Loading hourly rate for employee: ${employee.name} ${employee.lastname} (ID: ${employee.id})`);

        let hourlyRateId = null;

        try {
            // Правим заявка за пълните данни включително hourly rate
            const detailResponse = await fetch(`http://localhost:8080/employees/${employee.id}/with-hourly-rate`);

            if (detailResponse.ok) {
                const fullData = await detailResponse.json();
                console.log('🔍 DEBUG Full response:', fullData);
                if (fullData.hourlyRate && fullData.hourlyRate.id) {
                    hourlyRateId = fullData.hourlyRate.id;
                    console.log(`✅ Found hourly rate ID ${hourlyRateId} for employee ${employee.id}`);
                } else {
                    console.log(`ℹ️ No hourly rate found for employee ${employee.id}`);
                }
            } else {
                console.warn(`⚠️ HTTP ${detailResponse.status} for employee ${employee.id}`);
            }
        } catch (error) {
            console.warn(`⚠️ Error loading hourly rate for employee ${employee.id}:`, error);
        }

        let listItem = document.createElement('li');
        listItem.innerHTML = `
            ${employee.name} ${employee.lastname}
            <button class="edit-btn" onclick="editEmployee(${employee.id}, '${employee.name}', '${employee.lastname}', '${employee.email}', '${employee.position}', ${hourlyRateId})">✏️</button>
            <button class="delete-btn" onclick="deleteEmployee(${employee.id})">❌</button>
        `;
        employeeList.appendChild(listItem);
    }
}
/**
 * Prepares the form for editing an existing employee
 * @param {number} id - Employee ID
 * @param {string} name - Employee first name
 * @param {string} lastname - Employee last name
 * @param {string} email - Employee email
 * @param {string} position - Employee position
 * @param {number} hourlyRate - Employee hourly rate
 */
async function editEmployee(id, name, lastname, email, position, hourlyRateId) {
    console.log(`✏️ Editing employee: ${name} ${lastname} (ID: ${id})`);
    console.log(`🔢 Hourly Rate ID to set: ${hourlyRateId}`);

    // ВЕДНАГА затваряме списъка със служители
    const employeeListContainer = document.getElementById('employeeListContainer');
    if (employeeListContainer) {
        employeeListContainer.classList.add('hidden');
        console.log("📋 Employee list closed");
    }

    // Скриваме търсачката
    if (typeof toggleSearchVisibility === 'function') {
        toggleSearchVisibility(false);
    } else {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.style.display = 'none';
        }
    }

    // Populate form fields with employee data
    document.getElementById('name').value = name;
    document.getElementById('lastname').value = lastname;
    document.getElementById('email').value = email;

    // Handle select elements specially to trigger label positioning
    const positionSelect = document.getElementById('position');
    if (positionSelect) {
        positionSelect.value = position;
        positionSelect.dispatchEvent(new Event('change'));
    }

    // КЛЮЧОВА ПОПРАВКА: Правилно задаване на hourly rate в select-а
    const hourlyRateSelect = document.getElementById('hourlyRate');
    if (hourlyRateSelect && hourlyRateId) {
        console.log('💰 Setting hourly rate in select...');

        // СТЪПКА 1: Първо проверяваме дали select-ът има опции
        if (hourlyRateSelect.options.length <= 1) {
            console.log('📋 Hourly rate select is empty, loading options first...');
            await loadHourlyRatesIntoSelect();
        }

        // СТЪПКА 2: Задаваме стойността на select-а
        let optionFound = false;
        for (let option of hourlyRateSelect.options) {
            if (option.value == hourlyRateId) {
                hourlyRateSelect.value = hourlyRateId;
                optionFound = true;
                console.log(`✅ Successfully set hourly rate to: ${option.text} (ID: ${hourlyRateId})`);
                break;
            }
        }

        if (!optionFound) {
            console.warn(`⚠️ Could not find hourly rate option with ID: ${hourlyRateId}`);
            console.log('Available options:', Array.from(hourlyRateSelect.options).map(opt => ({value: opt.value, text: opt.text})));
        }

        // Задействаме change event за floating label
        hourlyRateSelect.dispatchEvent(new Event('change'));
    }

    // Switch to edit mode
    isEditMode = true;
    editingEmployeeId = id;

    // Update UI for edit mode
    document.getElementById('addEmployeeBtn').classList.add('hidden');
    document.getElementById('employeeSelect').classList.add('hidden');

    // Скриваме label-а на employeeSelect
    const selectLabel = document.querySelector('label[for="employeeSelect"]');
    if (selectLabel) {
        selectLabel.classList.add('hidden');
    }

    // Показваме формата за редактиране
    document.getElementById('employeeForm').classList.remove('hidden');

    // ПОПРАВКА: Задаваме правилния текст на submit бутона
    const submitBtn = document.getElementById('submitEmployee');
    if (submitBtn) {
        submitBtn.textContent = '✓'; // Тикче за update
        submitBtn.innerHTML = '<span>✓</span>'; // Алтернативно с span
        console.log("🔄 Submit button updated to checkmark for edit mode");
    }

    console.log("📝 Edit form opened and populated");

    // Фокусираме се на първото поле
    const nameInput = document.getElementById('name');
    if (nameInput) {
        nameInput.focus();
    }
}

/**
 * НОВА ПОМОЩНА ФУНКЦИЯ: Валидира hourly rate полето
 */
function validateHourlyRateSelection() {
    return validateHourlyRateSelect('hourlyRate');
}

/**
 * Deletes an employee after confirmation
 * @param {number} id - Employee ID to delete
 */
function deleteEmployee(id) {
    if (confirm("Are you sure you want to delete this employee?")) {
        fetch(`http://localhost:8080/employees/${id}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (response.ok) {
                alert("Employee deleted successfully!");
                loadEmployees(); // Refresh the employee list
            } else {
                alert("Error deleting employee.");
            }
        })
        .catch(error => console.error("Error deleting employee:", error));
    }
}

/**
 * ОБНОВЕНА ФУНКЦИЯ: Resets the employee form to its initial state
 * Сега включва изчистване на запазеното състояние
 */
function resetEmployeeForm() {
    console.log("🔄 Resetting employee form to initial state");

    // Hide form and show original UI elements
    document.getElementById('employeeForm').classList.add('hidden');
    document.getElementById('addEmployeeBtn').classList.remove('hidden');
    document.getElementById('employeeSelect').classList.remove('hidden');

    // Показваме обратно label-а на employeeSelect
    const selectLabel = document.querySelector('label[for="employeeSelect"]');
    if (selectLabel) {
        selectLabel.classList.remove('hidden');
    }

    // Clear all form fields
    document.getElementById('name').value = '';
    document.getElementById('lastname').value = '';
    document.getElementById('email').value = '';
    document.getElementById('position').value = '';
    document.getElementById('hourlyRate').value = '';

    // Reset edit mode flags
    isEditMode = false;
    editingEmployeeId = null;

    // Reset button text and hide search
    document.getElementById('submitEmployee').textContent = 'Add Employee';

    // Скриваме търсачката
    if (typeof toggleSearchVisibility === 'function') {
        toggleSearchVisibility(false);
    } else {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.style.display = 'none';
        }
    }

    // Уверяваме се че списъкът със служители е скрит
    const employeeListContainer = document.getElementById('employeeListContainer');
    if (employeeListContainer) {
        employeeListContainer.classList.add('hidden');
    }

    // НОВА ФУНКЦИОНАЛНОСТ: Изчистваме запазеното състояние когато потребителят изрично затваря формата
    if (typeof clearAllSavedFormsState === 'function') {
        clearAllSavedFormsState();
        console.log('🗑️ Cleared saved form state after form reset');
    }

    console.log("✅ Employee form reset completed");
}

/**
 * Filters the employee list based on search input
 */
function filterEmployees() {
    const input = document.getElementById('searchInput').value.toLowerCase();
    const employeeListItems = document.getElementById('employeeList').getElementsByTagName('li');

    // Loop through all list items and show/hide based on search
    for (let i = 0; i < employeeListItems.length; i++) {
        const employeeName = employeeListItems[i].textContent.toLowerCase();
        if (employeeName.includes(input)) {
            employeeListItems[i].style.display = ""; // Show matching results
        } else {
            employeeListItems[i].style.display = "none"; // Hide non-matching results
        }
    }
}

/**
 * Initializes form behaviors like floating labels for select elements
 */
function initializeFormBehaviors() {
    // Handle floating labels for select elements
    const selects = document.querySelectorAll("select");

    /**
     * Checks if select has value and positions label accordingly
     * @param {HTMLSelectElement} select - The select element to check
     */
    function checkFilled(select) {
        const label = document.querySelector(`label[for='${select.id}']`);
        if (select.value) {
            label.classList.add("active"); // Keep label at top
        } else {
            label.classList.remove("active"); // Return label to original position
        }
    }

    // Set up change listeners for all select elements
    selects.forEach(select => {
        select.addEventListener("change", function() {
            checkFilled(select);
        });

        // Check initial state on page load
        checkFilled(select);
    });
}

/**
 * Hides all forms and lists to ensure clean state transitions
 */
function hideAllFormsAndLists() {
    // Hide event forms
    hideEventForms();

    // Hide employee list
    const employeeListContainer = document.getElementById('employeeListContainer');
    if (employeeListContainer) {
        employeeListContainer.classList.add('hidden');
    }

    // Hide search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.style.display = 'none';
    }

    console.log("🧹 All forms and lists hidden");
}

/**
 * Hides all event-related forms
 */
function hideEventForms() {
    // Hide main event form
    const eventForm = document.getElementById('event-form');
    if (eventForm) {
        eventForm.style.display = 'none';
    }

    // Hide edit event form
    const editEventForm = document.getElementById('edit-event-form');
    if (editEventForm) {
        editEventForm.style.display = 'none';
    }

    console.log("📅 Event forms hidden");
}

/**
 * Clears all employee form fields
 */
function clearEmployeeForm() {
    document.getElementById('name').value = '';
    document.getElementById('lastname').value = '';
    document.getElementById('email').value = '';
    document.getElementById('position').value = '';
    document.getElementById('hourlyRate').value = '';

    // Reset any floating labels
    const labels = document.querySelectorAll('#employeeForm label');
    labels.forEach(label => label.classList.remove('active'));

    console.log("🗑️ Employee form cleared");
}



/**
 * НОВА ФУНКЦИЯ: Отменя текущата форма без да запазва промените
 * Полезно за "Cancel" бутон
 */
function cancelEmployeeForm() {
    console.log("❌ Cancelling employee form...");

    // Показваме диалог за потвърждение само ако има несъхранени промени
    const hasUnsavedChanges = checkForUnsavedChanges();

    if (hasUnsavedChanges) {
        const confirmCancel = confirm("Are you sure you want to cancel? Any unsaved changes will be lost.");
        if (!confirmCancel) {
            return; // Потребителят избра да НЕ отменя
        }
    }

    // Изчистваме запазеното състояние
    if (typeof clearAllSavedFormsState === 'function') {
        clearAllSavedFormsState();
    }

    // Reset формата
    resetEmployeeForm();

    console.log("✅ Employee form cancelled successfully");
}

/**
 * НОВА ПОМОЩНА ФУНКЦИЯ: Проверява дали има несъхранени промени във формата
 * @returns {boolean} True ако има промени в полетата
 */
function checkForUnsavedChanges() {
    const fields = ['name', 'lastname', 'email', 'position', 'hourlyRate'];

    for (let fieldId of fields) {
        const field = document.getElementById(fieldId);
        if (field && field.value.trim() !== '') {
            return true; // Намерихме поне едно попълнено поле
        }
    }

    return false; // Всички полета са празни
}

// НОВИ ЕКСПОРТИ: Правим новите функции достъпни глобално
window.cancelEmployeeForm = cancelEmployeeForm;
window.checkForUnsavedChanges = checkForUnsavedChanges;

// Make functions globally available
window.editEmployee = editEmployee;
window.deleteEmployee = deleteEmployee;
window.filterEmployees = filterEmployees;
window.hideAllFormsAndLists = hideAllFormsAndLists;
window.hideEventForms = hideEventForms;





