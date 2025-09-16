package com.example.schedule.controller;

import com.example.schedule.dto.UserRegistrationDto;
import com.example.schedule.dto.UserDto;
import com.example.schedule.dto.LoginRequestDto;
import com.example.schedule.entity.Employee;
import com.example.schedule.service.AuthService;

import jakarta.servlet.http.HttpServletRequest;
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
 * @version 2.1 - Поправена логика за role-based редирект
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

            // Проверка за validation грешки от анотациите
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

    // ===============================
    // АВТЕНТИКАЦИОННИ ENDPOINTS
    // ===============================

    /**
     * ЛОГИН НА ПОТРЕБИТЕЛ
     *
     * Автентикира потребител по username и парола
     * ПОПРАВЕНА ВЕРСИЯ с правилна role-based логика за пренасочване
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

            // Автентикация на потребителя
            UserDto user = authService.authenticateUser(loginRequest.getUsername(), loginRequest.getPassword());

            // ПОПРАВЕНА ЛОГИКА: Определяме към коя страница да пренасочим потребителя
            String redirectUrl = determineRedirectUrl(user);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("user", user);
            response.put("redirectUrl", redirectUrl);
            response.put("message", "Успешен логин");

            System.out.println("✅ Login successful for: " + user.getUsername() +
                    " (roles: " + user.getRoles() + ") -> redirecting to: " + redirectUrl);

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
     * ПОПРАВЕНА ЛОГИКА ЗА ОПРЕДЕЛЯНЕ НА REDIRECT URL
     *
     * Проверява ролите на потребителя и определя към коя страница да го пренасочи:
     * - ADMIN -> index.html (пълен административен панел)
     * - USER -> user-dashboard.html (опростен потребителски панел)
     *
     * @param user UserDto обект с информация за потребителя
     * @return String URL към който да се пренасочи потребителя
     */
    private String determineRedirectUrl(UserDto user) {
        System.out.println("🔍 Determining redirect URL for user: " + user.getUsername());

        // Проверка дали има роли
        if (user.getRoles() == null || user.getRoles().isEmpty()) {
            System.out.println("⚠️ No roles found for user, defaulting to user-dashboard.html");
            return "user-dashboard.html";
        }

        System.out.println("🔍 User roles: " + user.getRoles());

        // Проверяваме ролите - ADMIN има най-висок приоритет
        for (String role : user.getRoles()) {
            if ("ADMIN".equalsIgnoreCase(role)) {
                System.out.println("👑 ADMIN role detected -> redirecting to index.html");
                return "index.html"; // Пълен админ dashboard
            }
        }

        // Ако няма ADMIN роля, проверяваме за MANAGER
        for (String role : user.getRoles()) {
            if ("MANAGER".equalsIgnoreCase(role)) {
                System.out.println("👔 MANAGER role detected -> redirecting to index.html");
                return "index.html"; // За момента manager-ите също отиват към пълния dashboard
            }
        }

        // Всички останали роли (включително USER) отиват към опростената страница
        System.out.println("👤 USER role or other -> redirecting to user-dashboard.html");
        return "user-dashboard.html";
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
                    .body(createErrorResponse("Грешка при получаване на потребител"));
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
                    .body(createErrorResponse("Грешка при получаване на потребител"));
        }
    }

    // ===============================
    // UTILITY ENDPOINTS (САМО ЗА DEVELOPMENT)
    // ===============================

    /**
     * ENDPOINT ЗА ХЕШИРАНЕ НА ПАРОЛИ
     * ВАЖНО: Този endpoint трябва да се премахне в production!
     *
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
        response.put("version", "2.1 - Fixed role-based redirect");

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
    /**
     * ПОЛУЧАВАНЕ НА ТЕКУЩ ПОТРЕБИТЕЛ
     *
     * GET /api/auth/current-user
     * Връща информация за текущо логнатия потребител
     * За момента използва session storage или може да
     * се разшири за JWT token authentication
     */
    @GetMapping("/current-user")
    public ResponseEntity<?> getCurrentUser() {
        try {
            System.out.println("🔍 Getting current user info...");

            // ЗА МОМЕНТА: Използваме session storage approach
            // В реална система това ще се замени с JWT token validation

            // Опитваме се да намерим потребителя от session или token
            // Това е placeholder логика - трябва да се адаптира според вашата authentication стратегия

            // ВАЖНО: Това е временна логика за demo цели
            // В production трябва да използвате правилна session/token validation

            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Session expired or not authenticated");
            response.put("user", null);

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);

        } catch (Exception e) {
            System.err.println("❌ Error getting current user: " + e.getMessage());
            e.printStackTrace();

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Failed to get current user information");
            errorResponse.put("error", e.getMessage());

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * IMPROVED VERSION: Получаване на потребител от session storage
     * Този метод ще се използва от frontend-а за да провери кой е логнатия потребител
     */
    @PostMapping("/validate-session")
    public ResponseEntity<?> validateSession(@RequestBody Map<String, Object> sessionData) {
        try {
            System.out.println("🔐 Validating session data: " + sessionData);

            // Получаваме username от session data
            String username = (String) sessionData.get("username");

            if (username == null || username.trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse("No username provided in session"));
            }

            // Намираме потребителя в базата данни
            UserDto user = authService.findUserByUsername(username);

            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse("User not found"));
            }

            // Проверяваме дали потребителят е активен
            if (!user.isActiveUser()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse("User account is inactive"));
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("user", user);
            response.put("message", "Session valid");

            System.out.println("✅ Session validated for user: " + user.getUsername() +
                    " (Employee ID: " + user.getEmployeeId() + ")");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("❌ Session validation error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Session validation failed"));
        }
    }
    /**
     * ИЗТРИВАНЕ НА ПОТРЕБИТЕЛ
     */
    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        try {
            System.out.println("🗑️ Delete request for user ID: " + id);

            Optional<UserDto> userOpt = authService.getUserById(id);
            if (userOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            UserDto user = userOpt.get();
            if ("admin".equalsIgnoreCase(user.getUsername())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(createErrorResponse("Cannot delete admin users"));
            }

            boolean deleted = authService.deleteUserById(id);
            if (deleted) {
                return ResponseEntity.noContent().build();
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(createErrorResponse("Failed to delete user"));
            }

        } catch (Exception e) {
            System.err.println("❌ Error deleting user: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("An unexpected error occurred while deleting user"));
        }
    }
    
}