/**
 * USER DASHBOARD JAVASCRIPT - FINAL FIXED VERSION
 * Shows only the personal schedule of the logged-in user
 * Uses real API calls to the backend
 */

// Global variables - avoid conflicts with other JS files
let userDashboardCalendar; // Changed name to avoid conflict
let currentUserData = null;
let currentWeekStart = null;

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 User Dashboard loading...');

    // Check if all required elements exist
    if (!checkRequiredElements()) {
        console.error('❌ Required HTML elements are missing');
        showError('Page structure error. Please contact administrator.');
        return;
    }

    // Initialize calendar
    initializeCalendar();

    // Load user data and events
    loadUserDataAndEvents();

    // Setup event listeners
    setupEventListeners();

    // Update current date display
    updateCurrentDate();

    // 🔧 CRITICAL FIX: Initialize weekly schedule manager AFTER calendar is created
    initializeWeeklyScheduleManagerForUserDashboard();

    // Hide loading screen
    setTimeout(() => {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
    }, 1000);
});

/**
 * 🔧 NEW FUNCTION: Initialize weekly schedule manager specifically for user dashboard
 */
function initializeWeeklyScheduleManagerForUserDashboard() {
    console.log('📊 Initializing Weekly Schedule Manager for User Dashboard...');

    // Initialize the weekly schedule manager if the function exists
    if (typeof initializeWeeklyScheduleManager === "function") {
        initializeWeeklyScheduleManager();
        console.log('✅ Weekly Schedule Manager initialized successfully');
    } else {
        console.warn('⚠️ initializeWeeklyScheduleManager function not found');
    }
}

/**
 * Check if all required HTML elements exist
 */
function checkRequiredElements() {
    const requiredElements = [
        'calendar',
        'userName',
        'userInitials'
    ];

    let allExist = true;

    requiredElements.forEach(elementId => {
        const element = document.getElementById(elementId);
        if (!element) {
            console.error(`❌ Missing required element: ${elementId}`);
            allExist = false;
        }
    });

    return allExist;
}

/**
 * Initialize FullCalendar for read-only view
 * 🔧 FIXED: Now properly exposes calendar to window for weeklyScheduleManager
 */
function initializeCalendar() {
    const calendarEl = document.getElementById('calendar');

    if (!calendarEl) {
        console.error('❌ Calendar element not found');
        return;
    }

    userDashboardCalendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek'
        },
        height: 'auto',
        eventTimeFormat: { // настройка на часа
                hour: '2-digit',
                minute: '2-digit',
                hour12: false // <--- това премахва AM/PM
            },
        selectable: false, // Read-only for users
        editable: false,   // No editing allowed
        droppable: false,  // No drag & drop
        eventDisplay: 'list-item',
        eventClassNames: ['fc-daygrid-dot-event'],
        dayMaxEvents: 3,

        // Event styling
        eventDidMount: function(info) {
            const event = info.event;

            // Style based on event type
            if (event.extendedProps.leaveType) {
                info.el.classList.add('leave-event');
            } else {
                info.el.classList.add('work-event');
            }
        },

        // Week change handler
        datesSet: function(info) {
            currentWeekStart = getWeekStart(info.start);
            updateWeeklyHours();
        },

        // Event click handler (read-only info)
        eventClick: function(info) {
            showEventDetails(info.event);
        }
    });

    userDashboardCalendar.render();

    // 🔧 CRITICAL FIX: Expose calendar globally for weeklyScheduleManager
    window.calendar = userDashboardCalendar;

    console.log('📅 User Dashboard Calendar initialized in read-only mode');
    console.log('✅ Calendar exposed globally as window.calendar for weeklyScheduleManager compatibility');
}

/**
 * MAIN FUNCTION: Loads user data and their events
 */
async function loadUserDataAndEvents() {
    try {
        console.log('🔍 Loading user data and events...');

        // STEP 1: Get current user information from session
        const userData = await getCurrentUserFromSession();

        if (!userData || !userData.success) {
            console.error('❌ Failed to get current user data');
            showError('Failed to load your profile. Please login again.');
            // Redirect to login page
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            return;
        }

        currentUserData = userData.user;
        console.log('✅ Current user loaded:', currentUserData.username, 'Employee ID:', currentUserData.employeeId);

        // STEP 2: Update display with user information
        updateUserDisplay();

        // STEP 3: Check if user has employee ID
        if (!currentUserData.employeeId) {
            console.error('❌ User has no employee ID assigned');
            showError('Your account is not linked to an employee profile. Please contact administrator.');
            return;
        }

        // STEP 4: Load user events
        await loadUserEvents(currentUserData.employeeId);

        // STEP 5: Initialize weekly schedule for the current user
        // Wait a bit to ensure everything is properly initialized
        setTimeout(() => {
            if (typeof loadAndShowWeeklySchedule === "function") {
                const employeeId = currentUserData.employeeId;
                const employeeName = currentUserData.employeeName || currentUserData.username;

                // Set value in hidden select to avoid errors
                const employeeSelect = document.getElementById("employeeSelect");
                if (employeeSelect) {
                    employeeSelect.innerHTML = `<option value="${employeeId}" selected>${employeeName}</option>`;
                }

                console.log('📊 Loading weekly schedule for current user...');
                loadAndShowWeeklySchedule(employeeId, employeeName);
            }
        }, 500);

    } catch (error) {
        console.error('❌ Error loading user data and events:', error);
        showError('Failed to load your data. Please try refreshing the page.');
    }
}

/**
 * NEW FUNCTION: Gets current user information from session storage
 */
async function getCurrentUserFromSession() {
    try {
        console.log('🔐 Getting current user from session...');

        // Check session storage
        const isLoggedIn = sessionStorage.getItem('isLoggedIn');
        const currentUserSessionData = sessionStorage.getItem('currentUser');

        if (!isLoggedIn || isLoggedIn !== 'true') {
            console.log('❌ User not logged in according to session');
            return { success: false, message: 'Not logged in' };
        }

        if (!currentUserSessionData) {
            console.log('❌ No user data in session');
            return { success: false, message: 'No user data in session' };
        }

        // Parse user data
        const user = JSON.parse(currentUserSessionData);
        console.log('📋 User data from session:', user);

        // IMPORTANT: Validate data with server
        const validation = await validateSessionWithServer(user.username);

        if (!validation.success) {
            console.log('❌ Session validation failed:', validation.message);
            // Clear invalid session
            sessionStorage.clear();
            return { success: false, message: 'Session expired' };
        }

        console.log('✅ Session validated successfully');
        return { success: true, user: validation.user };

    } catch (error) {
        console.error('❌ Error getting current user from session:', error);
        return { success: false, message: 'Session error' };
    }
}

/**
 * NEW FUNCTION: Validates session with server
 */
async function validateSessionWithServer(username) {
    try {
        console.log('🔐 Validating session with server for user:', username);

        const response = await fetch('/api/auth/validate-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username: username })
        });

        const data = await response.json();

        if (!response.ok) {
            console.log('❌ Server session validation failed:', data.message || 'Unknown error');
            return { success: false, message: data.message || 'Validation failed' };
        }

        console.log('✅ Server session validation successful');
        return data;

    } catch (error) {
        console.error('❌ Error validating session with server:', error);
        return { success: false, message: 'Server validation error' };
    }
}

/**
 * UPDATED FUNCTION: Loads events for specific employee
 */
async function loadUserEvents(employeeId) {
    try {
        console.log(`📅 Loading events for employee ID: ${employeeId}...`);

        // STEP 1: Check if we have permission to view this employee's events
        const accessValidation = await validateEmployeeAccess(employeeId);

        if (!accessValidation.hasAccess) {
            console.error('❌ Access denied to employee events:', accessValidation.reason);
            showError('You do not have permission to view this schedule.');
            return;
        }

        console.log('✅ Access granted:', accessValidation.reason);

        // STEP 2: Load events
        const response = await fetch(`/events/employee/${employeeId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const events = await response.json();
        console.log(`✅ Loaded ${events.length} events from server`);

        // STEP 3: Convert events to FullCalendar format
        const calendarEvents = events.map(event => {
            return {
                id: event.id,
                title: event.title,
                start: event.start,
                end: event.end,
                extendedProps: {
                    activity: event.activityName,
                    activityId: event.activityId,
                    leaveType: event.leaveType,
                    employeeName: event.employeeName,
                    employeeId: employeeId
                }
            };
        });

        // STEP 4: Add events to calendar
        if (userDashboardCalendar) {
            userDashboardCalendar.removeAllEvents();
            userDashboardCalendar.addEventSource(calendarEvents);
            console.log(`✅ Added ${calendarEvents.length} events to calendar`);
        }

        // Debug logging
        calendarEvents.forEach(event => {
            console.log(`   📌 Event: ${event.title} on ${new Date(event.start).toLocaleDateString()}
                        (${event.extendedProps.leaveType || event.extendedProps.activity || 'Work'})`);
        });

    } catch (error) {
        console.error('❌ Error loading user events:', error);
        showError('Failed to load your schedule. Please try refreshing the page.');
    }
}

/**
 * NEW FUNCTION: Checks if user has permission to view employee events
 */
async function validateEmployeeAccess(employeeId) {
    try {
        console.log(`🔐 Validating access to employee ${employeeId} events...`);

        const response = await fetch(`/events/employee/${employeeId}/validate-access`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: currentUserData.username
            })
        });

        if (!response.ok) {
            console.error(`❌ Access validation failed with status: ${response.status}`);
            return { hasAccess: false, reason: `Server error: ${response.status}` };
        }

        const data = await response.json();
        console.log('🔐 Access validation result:', data);

        return data;

    } catch (error) {
        console.error('❌ Error validating employee access:', error);
        return { hasAccess: false, reason: 'Validation error' };
    }
}

/**
 * Update user display information
 */
function updateUserDisplay() {
    if (!currentUserData) return;

    // Update user name - use employeeName if available, otherwise username
    const displayName = currentUserData.employeeName || currentUserData.username;

    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        userNameElement.textContent = displayName;
    }

    // Update user initials
    const initials = displayName.split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .substring(0, 2);

    const userInitialsElement = document.getElementById('userInitials');
    if (userInitialsElement) {
        userInitialsElement.textContent = initials;
    }

    console.log('✅ User display updated for:', displayName);
}

/**
 * Show event details in a popup/modal
 */
function showEventDetails(event) {
    const startTime = new Date(event.start);
    const endTime = event.end ? new Date(event.end) : null;

    let timeInfo = formatEventTime(event);
    let typeInfo = event.extendedProps.leaveType || event.extendedProps.activity || 'Work';

    let message = `📅 ${event.title}\n\n`;
    message += `⏰ ${timeInfo}\n`;
    message += `📋 Type: ${typeInfo}\n`;

    if (event.extendedProps.employeeName) {
        message += `👤 Employee: ${event.extendedProps.employeeName}\n`;
    }

    alert(message);
}

/**
 * Format event time for display
 */
function formatEventTime(event) {
    const start = new Date(event.start);
    const end = event.end ? new Date(event.end) : null;

    if (event.allDay || !end) {
        return start.toLocaleDateString();
    }

    const timeFormat = { hour: '2-digit', minute: '2-digit' };
    return `${start.toLocaleDateString()} ${start.toLocaleTimeString([], timeFormat)} - ${end.toLocaleTimeString([], timeFormat)}`;
}

/**
 * Update weekly hours display
 */
function updateWeeklyHours() {
    if (!currentWeekStart) return;

    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    console.log(`📊 Week: ${currentWeekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`);
}

/**
 * Get start of week (Monday)
 */
function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

/**
 * Update current date display
 */
function updateCurrentDate() {
    const now = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Logout button - check if exists
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    } else {
        console.warn('⚠️ Logout button not found');
    }
}

/**
 * Handle logout
 */
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        console.log('🚪 User logging out...');

        // Clear session data
        sessionStorage.clear();
        localStorage.clear();

        // Redirect to login
        window.location.href = 'login.html';
    }
}

/**
 * Show error message
 */
function showError(message) {
    console.error('❌ Error:', message);

    // Create professional error display
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #f8d7da;
        color: #721c24;
        padding: 12px 20px;
        border: 1px solid #f5c6cb;
        border-radius: 6px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 9999;
        max-width: 400px;
        font-family: inherit;
    `;
    errorDiv.textContent = message;

    document.body.appendChild(errorDiv);

    // Remove after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 5000);
}

/**
 * Show success message
 */
function showSuccess(message) {
    console.log('✅ Success:', message);

    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #d4edda;
        color: #155724;
        padding: 12px 20px;
        border: 1px solid #c3e6cb;
        border-radius: 6px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 9999;
        max-width: 400px;
        font-family: inherit;
    `;
    successDiv.textContent = message;

    document.body.appendChild(successDiv);

    // Remove after 3 seconds
    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.parentNode.removeChild(successDiv);
        }
    }, 3000);
}