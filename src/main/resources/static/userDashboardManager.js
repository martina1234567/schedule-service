 /**
     * USER DASHBOARD JAVASCRIPT
     * Опростена версия само за показване на личния график
     */

    // Global variables
    let calendar;
    let currentUser = null;
    let currentWeekStart = null;

    // Initialize application
    document.addEventListener('DOMContentLoaded', function() {
        console.log('🚀 User Dashboard loading...');

        // Initialize calendar
        initializeCalendar();

        // Load user data
        loadUserData();

        // Setup event listeners
        setupEventListeners();

        // Update current date display
        updateCurrentDate();

        // Hide loading screen
        setTimeout(() => {
            document.getElementById('loadingScreen').style.display = 'none';
        }, 1000);
    });

    /**
     * Initialize FullCalendar for read-only view
     */
    function initializeCalendar() {
        const calendarEl = document.getElementById('calendar');

        calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek'
            },
            height: 'auto',
            selectable: false, // Read-only for users
            editable: false,   // No editing allowed
            droppable: false,  // No drag & drop
            eventDisplay: 'block',
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

        calendar.render();
        console.log('📅 Calendar initialized in read-only mode');
    }

    /**
     * Load user data and events
     */
    async function loadUserData() {
        try {
            // For now, we'll use mock data
            // In real implementation, get user ID from session/token
            const mockUserId = 1; // This should come from authentication

            // Set user info
            currentUser = {
                id: mockUserId,
                name: "Current User", // This should come from auth
                role: "USER"
            };

            updateUserDisplay();

            // Load user's events
            await loadUserEvents(mockUserId);

        } catch (error) {
            console.error('❌ Error loading user data:', error);
            showError('Failed to load your data');
        }
    }

    /**
     * Load events for the current user only
     */
    async function loadUserEvents(userId) {
        try {
            console.log(`📅 Loading events for user ${userId}...`);

            // Mock events - replace with real API call
            const mockEvents = [
                {
                    id: 1,
                    title: 'Morning Shift',
                    start: '2025-09-07T08:00:00',
                    end: '2025-09-07T16:00:00',
                    extendedProps: {
                        activity: 'Cashier',
                        employeeId: userId
                    }
                },
                {
                    id: 2,
                    title: 'Vacation',
                    start: '2025-09-10',
                    end: '2025-09-11',
                    extendedProps: {
                        leaveType: 'Vacation',
                        employeeId: userId
                    }
                }
            ];

            // Add events to calendar
            calendar.removeAllEvents();
            calendar.addEventSource(mockEvents);

            console.log(`✅ Loaded ${mockEvents.length} events`);

        } catch (error) {
            console.error('❌ Error loading events:', error);
            showError('Failed to load your schedule');
        }
    }

    /**
     * Update user display information
     */
    function updateUserDisplay() {
        if (!currentUser) return;

        // Update user name
        document.getElementById('userName').textContent = currentUser.name;

        // Update user initials
        const initials = currentUser.name.split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 2);
        document.getElementById('userInitials').textContent = initials;
    }

    /**
     * Update weekly hours display
     */
    function updateWeeklyHours() {
        if (!currentWeekStart) return;

        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        // Get events for current week
        const weekEvents = calendar.getEvents().filter(event => {
            const eventStart = new Date(event.start);
            return eventStart >= currentWeekStart && eventStart <= weekEnd;
        });

        // Calculate hours
        let scheduledHours = 0;
        let workedHours = 0; // For now, same as scheduled

        weekEvents.forEach(event => {
            if (!event.extendedProps.leaveType && event.end) {
                const hours = (new Date(event.end) - new Date(event.start)) / (1000 * 60 * 60);
                scheduledHours += hours;
                workedHours += hours; // Mock data - in real app, track actual worked hours
            }
        });

        // Update display
        document.getElementById('currentWeekHours').textContent = `${scheduledHours}h`;
        document.getElementById('scheduledHours').textContent = `${scheduledHours}h`;
        document.getElementById('workedHours').textContent = `${workedHours}h`;
    }

    /**
     * Show event details in read-only mode
     */
    function showEventDetails(event) {
        const props = event.extendedProps;

        let details = `📅 ${event.title}\n`;
        details += `🕐 ${formatEventTime(event)}\n`;

        if (props.activity) {
            details += `💼 Activity: ${props.activity}\n`;
        }

        if (props.leaveType) {
            details += `🏖️ Leave Type: ${props.leaveType}\n`;
        }

        alert(details); // Simple alert for now
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
        document.getElementById('currentDate').textContent = now.toLocaleDateString('bg-BG', options);
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    }

    /**
     * Handle logout
     */
    function handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            console.log('🚪 User logging out...');

            // Clear any stored session data
            localStorage.removeItem('currentUser');
            sessionStorage.clear();

            // Redirect to login
            window.location.href = 'login.html';
        }
    }

    /**
     * Show error message
     */
    function showError(message) {
        console.error('❌ Error:', message);
        alert(`Error: ${message}`); // Simple alert for now
    }

    /**
     * Show success message
     */
    function showSuccess(message) {
        console.log('✅ Success:', message);
        // Could implement a toast notification here
    }