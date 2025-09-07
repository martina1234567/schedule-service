package com.example.schedule.controller;

import com.example.schedule.dto.UserRegistrationDto;
import com.example.schedule.dto.UserDto;
import com.example.schedule.dto.LoginRequestDto;
import com.example.schedule.entity.Employee;
import com.example.schedule.service.AuthService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * REST КОНТРОЛЕР ЗА АВТЕНТИКАЦИЯ И УПРАВЛЕНИЕ НА ПОТРЕБИТЕЛИ
 *
 * Този контролер обработва всички HTTP заявки свързани с:
 * - Регистрация на нови потребители
 * - Автентикация при логин
 * - Управление на потребителски акаунти
 * - Получаване на списъци със служители и потребители
 * - Utility функции за тестване
 *
 * Всички endpoints са под /api/auth префикса
 *
 * @author Schedule Management System
 * @version 2.0
 */
@RestController
@RequestMapping("/api/auth")
@Validated
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class AuthController {

    // ===============================
    // DEPENDENCY INJECTION
    // ===============================

    @Autowired
    private AuthService authService;

    // ===============================
    // РЕГИСТРАЦИОННИ ENDPOINTS
    // ===============================

    /**
     * РЕГИСТРАЦИЯ НА НОВ ПОТРЕБИТЕЛ
     *
     * Този endpoint създава нов потребителски акаунт в системата.
     * Процесът включва валидация, хеширане на парола и присвояване на роли.
     *
     * POST /api/auth/register
     * Content-Type: application/json
     *
     * Request Body:
     * {
     *   "username": "TestUser1!",
     *   "password": "password123",
     *   "confirmPassword": "password123",
     *   "employeeId": 1,
     *   "role": "user"
     * }
     *
     * Response 201:
     * {
     *   "success": true,
     *   "user": { ... },
     *   "message": "Потребителят е създаден успешно"
     * }
     *
     * Response 400:
     * {
     *   "success": false,
     *   "error": "Описание на грешката"
     * }
     */
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody UserRegistrationDto registrationDto,
                                          BindingResult bindingResult) {
        try {
            System.out.println("📝 Registration attempt for: " + registrationDto.getUsername());

            // Проверка за validation грешки от аннотациите
            if (bindingResult.hasErrors()) {
                StringBuilder errors = new StringBuilder();
                bindingResult.getFieldErrors().forEach(error -> {
                    errors.append(error.getDefaultMessage()).append(". ");
                });

                System.err.println("❌ Validation errors: " + errors.toString());
                return ResponseEntity.badRequest().body(createErrorResponse(errors.toString().trim()));
            }

            // Извикване на сервиза за регистрация
            UserDto user = authService.registerUser(registrationDto);

            // Създаване на success response
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("user", user);
            response.put("message", "Потребителят е създаден успешно");

            System.out.println("✅ Registration successful for: " + user.getUsername());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (RuntimeException e) {
            System.err.println("❌ Registration error: " + e.getMessage());
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            System.err.println("❌ Unexpected registration error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Възникна неочаквана грешка"));
        }
    }

    /**
     * Определя към коя страница да пренасочи потребителя според ролята му
     */
    private String determineRedirectUrl(UserDto user) {
        if (user.getRoles() == null || user.getRoles().isEmpty()) {
            return "user-dashboard.html"; // По подразбиране към USER dashboard
        }

        // Проверяваме ролите - ADMIN има най-висок приоритет
        if (user.getRoles().contains("ADMIN")) {
            return "index.html"; // Пълен админ dashboard
        } else if (user.getRoles().contains("MANAGER")) {
            return "index.html"; // За момента manager-ите също отиват към пълния dashboard
        } else {
            return "user-dashboard.html"; // USER роля - опростена страница
        }
    }

    // ===============================
    // АВТЕНТИКАЦИОННИ ENDPOINTS
    // ===============================

    /**
     * ЛОГИН НА ПОТРЕБИТЕЛ
     *
     * Автентикира потребител по username и парола
     *
     * POST /api/auth/login
     * Content-Type: application/json
     *
     * Request Body:
     * {
     *   "username": "TestUser1!",
     *   "password": "password123"
     * }
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequestDto loginRequest) {
        try {
            System.out.println("🔐 Login attempt for: " + loginRequest.getUsername());

            UserDto user = authService.authenticateUser(loginRequest.getUsername(), loginRequest.getPassword());

            // Определяме към коя страница да пренасочим потребителя
            String redirectUrl = determineRedirectUrl(user);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("user", user);
            response.put("redirectUrl", redirectUrl);
            response.put("message", "Успешен логин");

            System.out.println("✅ Login successful for: " + user.getUsername() + " -> " + redirectUrl);
            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            System.err.println("❌ Login error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            System.err.println("❌ Unexpected login error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Възникна неочаквана грешка"));
        }
    }

    /**
     * ПОЛУЧАВАНЕ НА ТЕКУЩ ПОТРЕБИТЕЛ
     *
     * GET /api/auth/current-user
     * Връща информация за текущо логнатия потребител
     * За момента използва session storage или може да се имплементира с JWT
     */
    @GetMapping("/current-user")
    public ResponseEntity<?> getCurrentUser() {
        try {
            // За момента ще върнем mock данни
            // В реална имплементация това ще идва от security context или JWT токен

            // Mock current user - това трябва да се замени с реална логика
            Map<String, Object> currentUser = new HashMap<>();
            currentUser.put("id", 1);
            currentUser.put("username", "TestUser");
            currentUser.put("employeeName", "Test Employee");
            currentUser.put("roles", java.util.Arrays.asList("USER"));
            currentUser.put("isActive", true);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("user", currentUser);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("❌ Error getting current user: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Грешка при получаване на потребителски данни"));
        }
    }

    /**
     * ПОЛУЧАВАНЕ НА СЪБИТИЯ ЗА ПОТРЕБИТЕЛ
     *
     * GET /api/auth/user-events/{userId}
     * Връща събитията само за конкретния потребител
     */
    @GetMapping("/user-events/{userId}")
    public ResponseEntity<?> getUserEvents(@PathVariable Long userId) {
        try {
            System.out.println("📅 Getting events for user: " + userId);

            // Mock events - в реалната имплементация ще се извлича от базата
            List<Map<String, Object>> mockEvents = new java.util.ArrayList<>();

            // Work shift event
            Map<String, Object> workEvent = new HashMap<>();
            workEvent.put("id", 1);
            workEvent.put("title", "Morning Shift");
            workEvent.put("start", "2025-09-07T08:00:00");
            workEvent.put("end", "2025-09-07T16:00:00");
            workEvent.put("activity", "Cashier");
            workEvent.put("employeeId", userId);
            mockEvents.add(workEvent);

            // Leave event
            Map<String, Object> leaveEvent = new HashMap<>();
            leaveEvent.put("id", 2);
            leaveEvent.put("title", "Vacation");
            leaveEvent.put("start", "2025-09-10");
            leaveEvent.put("end", "2025-09-11");
            leaveEvent.put("leaveType", "Vacation");
            leaveEvent.put("employeeId", userId);
            mockEvents.add(leaveEvent);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("events", mockEvents);
            response.put("count", mockEvents.size());

            System.out.println("✅ Retrieved " + mockEvents.size() + " events for user " + userId);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("❌ Error getting user events: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Грешка при получаване на събития"));
        }
    }

    // ===============================
    // СЛУЖИТЕЛИ MANAGEMENT ENDPOINTS
    // ===============================

    /**
     * ПОЛУЧАВАНЕ НА СЛУЖИТЕЛИ БЕЗ ПОТРЕБИТЕЛСКИ АКАУНТИ
     *
     * Този endpoint се използва в регистрационната форма за попълване
     * на dropdown менюто със служители които още нямат потребителски акаунти
     *
     * GET /api/auth/available-employees
     *
     * Response 200:
     * {
     *   "employees": [
     *     {
     *       "id": 1,
     *       "name": "Иван",
     *       "lastname": "Петров",
     *       "email": "ivan.petrov@company.com"
     *     }
     *   ],
     *   "count": 1,
     *   "message": "Намерени са 1 налични служители"
     * }
     */
    @GetMapping("/available-employees")
    public ResponseEntity<?> getAvailableEmployees() {
        try {
            System.out.println("📋 Getting available employees for registration...");

            List<Employee> availableEmployees = authService.getEmployeesWithoutAccounts();
            System.out.println("📋 AuthController: Retrieved " + availableEmployees.size() + " employees");

            Map<String, Object> response = new HashMap<>();
            response.put("employees", availableEmployees);
            response.put("count", availableEmployees.size());

            if (availableEmployees.isEmpty()) {
                response.put("message", "Всички служители вече имат потребителски акаунти");
                System.out.println("⚠️ No available employees found");
            } else {
                response.put("message", "Намерени са " + availableEmployees.size() + " налични служители");
                System.out.println("✅ Found " + availableEmployees.size() + " available employees");

                // Логваме имената на първите служители за debugging
                availableEmployees.stream()
                        .limit(3)
                        .forEach(emp -> System.out.println("   Employee: " + emp.getName() + " " + emp.getLastname()));
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("❌ Error getting available employees: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Грешка при получаване на служителите"));
        }
    }

    /**
     * ПОЛУЧАВАНЕ НА СЛУЖИТЕЛИ БЕЗ РОЛИ (LEGACY)
     * Това е legacy endpoint който може да се използва за различни цели
     */
    @GetMapping("/employees-without-roles")
    public ResponseEntity<?> getEmployeesWithoutRoles() {
        try {
            List<Employee> employeesWithoutRoles = authService.getEmployeesWithoutRoles();

            System.out.println("📋 Found " + employeesWithoutRoles.size() + " employees without roles");
            return ResponseEntity.ok(employeesWithoutRoles);

        } catch (Exception e) {
            System.err.println("❌ Error getting employees without roles: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Грешка при получаване на служителите без роли"));
        }
    }

    // ===============================
    // ПОТРЕБИТЕЛИ MANAGEMENT ENDPOINTS
    // ===============================

    /**
     * ПОЛУЧАВАНЕ НА ВСИЧКИ ПОТРЕБИТЕЛИ
     *
     * GET /api/auth/users
     */
    @GetMapping("/users")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        try {
            System.out.println("📋 Getting all users...");
            List<UserDto> users = authService.getAllUsers();
            System.out.println("✅ Retrieved " + users.size() + " users");
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            System.err.println("❌ Error fetching users: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * ПОЛУЧАВАНЕ НА АКТИВНИ ПОТРЕБИТЕЛИ
     *
     * GET /api/auth/users/active
     */
    @GetMapping("/users/active")
    public ResponseEntity<List<UserDto>> getActiveUsers() {
        try {
            System.out.println("📋 Getting active users...");
            List<UserDto> users = authService.getActiveUsers();
            System.out.println("✅ Retrieved " + users.size() + " active users");
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            System.err.println("❌ Error fetching active users: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * ПОЛУЧАВАНЕ НА ПОТРЕБИТЕЛ ПО ID
     *
     * GET /api/auth/users/{id}
     */
    @GetMapping("/users/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        try {
            System.out.println("📋 Getting user by ID: " + id);

            Optional<UserDto> userOpt = authService.getUserById(id);

            if (userOpt.isPresent()) {
                System.out.println("✅ User found: " + userOpt.get().getUsername());
                return ResponseEntity.ok(userOpt.get());
            } else {
                System.out.println("❌ User not found with ID: " + id);
                return ResponseEntity.notFound().build();
            }

        } catch (Exception e) {
            System.err.println("❌ Error fetching user by ID: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Грешка при получаване на потребителя"));
        }
    }

    /**
     * ПОЛУЧАВАНЕ НА ПОТРЕБИТЕЛ ПО USERNAME
     *
     * GET /api/auth/users/username/{username}
     */
    @GetMapping("/users/username/{username}")
    public ResponseEntity<?> getUserByUsername(@PathVariable String username) {
        try {
            System.out.println("📋 Getting user by username: " + username);

            Optional<UserDto> userOpt = authService.getUserByUsername(username);

            if (userOpt.isPresent()) {
                System.out.println("✅ User found: " + userOpt.get().getUsername());
                return ResponseEntity.ok(userOpt.get());
            } else {
                System.out.println("❌ User not found with username: " + username);
                return ResponseEntity.notFound().build();
            }

        } catch (Exception e) {
            System.err.println("❌ Error fetching user by username: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Грешка при получаване на потребителя"));
        }
    }

    // ===============================
    // UTILITY ENDPOINTS (САМО ЗА DEVELOPMENT)
    // ===============================

    /**
     * ENDPOINT ЗА ХЕШИРАНЕ НА ПАРОЛИ
     * ВАЖНО: Този endpoint трябва да се премахне в production!
     * Използва се само за генериране на хеширани пароли за SQL вмъкване
     *
     * GET /api/auth/hash-password?password=yourpassword
     */
    @GetMapping("/hash-password")
    public ResponseEntity<?> hashPassword(@RequestParam String password) {
        try {
            if (password == null || password.isEmpty()) {
                return ResponseEntity.badRequest().body("Паролата не може да бъде празна");
            }

            String hashedPassword = authService.hashPassword(password);

            Map<String, Object> response = new HashMap<>();
            response.put("originalPassword", password);
            response.put("hashedPassword", hashedPassword);
            response.put("sqlCommand", "UPDATE users SET password = '" + hashedPassword + "' WHERE username = 'your_username';");
            response.put("warning", "⚠️ Този endpoint трябва да се премахне в production!");

            System.out.println("🔒 Password hashed for development purposes");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("❌ Password hashing error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Грешка при хеширане на паролата: " + e.getMessage());
        }
    }

    /**
     * ТЕСТВАНЕ НА ПАРОЛИ
     * ВАЖНО: Този endpoint трябва да се премахне в production!
     *
     * POST /api/auth/test-password
     * Content-Type: application/json
     *
     * Request Body:
     * {
     *   "rawPassword": "password123",
     *   "hashedPassword": "$2a$10$..."
     * }
     */
    @PostMapping("/test-password")
    public ResponseEntity<?> testPassword(@RequestBody Map<String, String> request) {
        try {
            String rawPassword = request.get("rawPassword");
            String hashedPassword = request.get("hashedPassword");

            if (rawPassword == null || hashedPassword == null) {
                return ResponseEntity.badRequest().body("rawPassword и hashedPassword са задължителни");
            }

            boolean matches = authService.verifyPassword(rawPassword, hashedPassword);

            Map<String, Object> response = new HashMap<>();
            response.put("rawPassword", rawPassword);
            response.put("hashedPassword", hashedPassword);
            response.put("matches", matches);
            response.put("result", matches ? "✅ Паролите съвпадат" : "❌ Паролите НЕ съвпадат");
            response.put("warning", "⚠️ Този endpoint трябва да се премахне в production!");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("❌ Password test error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Грешка при тестване на паролата: " + e.getMessage());
        }
    }

    // ===============================
    // HEALTH CHECK ENDPOINTS
    // ===============================

    /**
     * HEALTH CHECK ЗА API
     *
     * GET /api/auth/health
     */
    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "OK");
        response.put("service", "AuthController");
        response.put("timestamp", java.time.LocalDateTime.now());
        response.put("message", "Authentication service is running");

        return ResponseEntity.ok(response);
    }

    // ===============================
    // HELPER МЕТОДИ
    // ===============================

    /**
     * Създава стандартизиран error response
     */
    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("error", message);
        response.put("timestamp", java.time.LocalDateTime.now());
        return response;
    }

    /**
     * Създава стандартизиран success response
     */
    private Map<String, Object> createSuccessResponse(String message, Object data) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", message);
        response.put("data", data);
        response.put("timestamp", java.time.LocalDateTime.now());
        return response;
    }

    // ===============================
    // EXCEPTION HANDLING
    // ===============================

    /**
     * Global exception handler за този контролер
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGlobalException(Exception e) {
        System.err.println("❌ Unexpected error in AuthController: " + e.getMessage());
        e.printStackTrace();

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(createErrorResponse("Възникна неочаквана грешка в сървъра"));
    }

    /**
     * Validation exception handler
     */
    @ExceptionHandler(org.springframework.web.bind.MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidationException(org.springframework.web.bind.MethodArgumentNotValidException e) {
        StringBuilder errors = new StringBuilder();
        e.getBindingResult().getFieldErrors().forEach(error -> {
            errors.append(error.getDefaultMessage()).append(". ");
        });

        System.err.println("❌ Validation error: " + errors.toString());
        return ResponseEntity.badRequest().body(createErrorResponse(errors.toString().trim()));
    }
}