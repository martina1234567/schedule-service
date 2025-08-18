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
function initializeEmployeeManager() {
    // Load employees when the page starts
    loadEmployees();

    // Set up event listeners for employee-related buttons
    setupEmployeeEventListeners();

    // Initialize form validation and UI behaviors
    initializeFormBehaviors();
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
function handleEmployeeSubmit() {
    // Get form field values
    const name = document.getElementById('name').value;
    const lastname = document.getElementById('lastname').value;
    const email = document.getElementById('email').value;
    const position = document.getElementById('position').value;
    const hourlyRate = document.getElementById('hourlyRate').value;

    // Validate that all fields are filled
    if (name && lastname && email && position && hourlyRate) {
        // Determine if we're creating or updating
        let requestUrl = 'http://localhost:8080/employees';
        let method = 'POST'; // Default for creating new employee

        // If in edit mode, change to PUT request with specific ID
        if (isEditMode && editingEmployeeId) {
            requestUrl = `http://localhost:8080/employees/${editingEmployeeId}`;
            method = 'PUT';
        }

        // Send request to backend API
        fetch(requestUrl, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: name,
                lastname: lastname,
                email: email,
                position: position,
                hourlyRate: hourlyRate
            })
        })
        .then(response => response.json())
        .then(data => {
            // Show success message based on operation type
            if (isEditMode) {
                alert(`Employee updated successfully: ${data.name} ${data.lastname}`);
            } else {
                alert(`Employee added successfully: ${data.name} ${data.lastname}`);
            }

            // НОВА ФУНКЦИОНАЛНОСТ: Изчистваме запазеното състояние след успешен submit
            if (typeof clearAllSavedFormsState === 'function') {
                clearAllSavedFormsState();
                console.log('🗑️ Cleared saved form state after successful employee submission');
            }

            // Reset form and reload employee list
            resetEmployeeForm();
            loadEmployees();
        })
        .catch(error => {
            console.error('Error:', error);
            // При грешка НЕ изчистваме запазеното състояние, за да може потребителят да опита пак
        });
    } else {
        alert('All fields are required!');
        // При validation грешка също НЕ изчистваме запазеното състояние
    }
}

/**
 * Loads all employees from the backend and populates both dropdown and list
 */
function loadEmployees() {
    const employeeSelect = document.getElementById('employeeSelect');

    // Fetch employees from backend API
    fetch('http://localhost:8080/employees')
        .then(response => response.json())
        .then(data => {
            console.log("👥 Loaded employees from backend:", data);

            // Populate dropdown select element with "All Employees" option first
            employeeSelect.innerHTML = '<option value="">📋 All Employees</option>';
            data.forEach(employee => {
                let option = document.createElement('option');
                option.value = employee.id;
                // Use the exact same format as the backend returns
                const fullName = `${employee.name} ${employee.lastname}`;
                option.textContent = fullName;
                employeeSelect.appendChild(option);

                console.log(`➕ Added employee option: "${fullName}" (ID: ${employee.id})`);
            });

            // Populate employee list for management view
            populateEmployeeList(data);

            console.log("✅ Employees loaded successfully");
        })
        .catch(error => console.error('❌ Error loading employees:', error));
}

/**
 * Populates the employee list with edit and delete buttons
 * @param {Array} employees - Array of employee objects
 */
function populateEmployeeList(employees) {
    const employeeList = document.getElementById('employeeList');
    employeeList.innerHTML = ''; // Clear existing list

    employees.forEach(employee => {
        let listItem = document.createElement('li');
        listItem.innerHTML = `
            ${employee.name} ${employee.lastname}
            <button class="edit-btn" onclick="editEmployee(${employee.id}, '${employee.name}', '${employee.lastname}', '${employee.email}', '${employee.position}', ${employee.hourlyRate})">✏️</button>
            <button class="delete-btn" onclick="deleteEmployee(${employee.id})">❌</button>
        `;
        employeeList.appendChild(listItem);
    });
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
function editEmployee(id, name, lastname, email, position, hourlyRate) {
    console.log(`✏️ Editing employee: ${name} ${lastname} (ID: ${id})`);

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

    const hourlyRateSelect = document.getElementById('hourlyRate');
    if (hourlyRateSelect) {
        hourlyRateSelect.value = hourlyRate;
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
        submitBtn.textContent = '✔'; // Тикче за update
        submitBtn.innerHTML = '<span>✔</span>'; // Алтернативно с span
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





