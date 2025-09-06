package com.example.schedule.controller;

import com.example.schedule.dto.UserDto;
import com.example.schedule.dto.UserRegistrationDto;
import com.example.schedule.entity.Employee;
import com.example.schedule.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * ПОПРАВЕН REST CONTROLLER ЗА АУТЕНТИФИКАЦИЯ
 * С ДОБАВЕН ENDPOINT ЗА ХЕШИРАНЕ НА ПАРОЛИ
 *
 * @author Schedule Management System
 * @version 2.0
 */
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;

    @Autowired
    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // ===============================
    // ЛОГИН ENDPOINT
    // ===============================

    /**
     * ENDPOINT ЗА ЛОГИН С BCRYPT ПРОВЕРКА
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginRequest) {
        try {
            String username = loginRequest.get("username");
            String password = loginRequest.get("password");

            System.out.println("🔐 Login attempt for: " + username);

            if (username == null || username.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(createErrorResponse("Потребителското име е задължително"));
            }

            if (password == null || password.isEmpty()) {
                return ResponseEntity.badRequest().body(createErrorResponse("Паролата е задължителна"));
            }

            UserDto user = authService.login(username.trim(), password);

            if (user != null) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("user", user);
                response.put("token", "demo-jwt-token-" + System.currentTimeMillis());
                response.put("message", "Успешен вход в системата");

                System.out.println("✅ Login successful for: " + username);
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse("Неправилно потребителско име или парола"));
            }

        } catch (Exception e) {
            System.err.println("❌ Login error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Възникна грешка при обработка на заявката"));
        }
    }

    // ===============================
    // РЕГИСТРАЦИЯ ENDPOINT
    // ===============================

    /**
     * ENDPOINT ЗА РЕГИСТРАЦИЯ НА НОВ ПОТРЕБИТЕЛ
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody UserRegistrationDto registrationDto) {
        try {
            System.out.println("📝 Registration attempt for: " + registrationDto.getUsername());

            UserDto user = authService.registerUser(registrationDto);

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
    // UTILITY ENDPOINTS ЗА ПАРОЛИ (САМО ЗА DEVELOPMENT)
    // ===============================

    /**
     * ENDPOINT ЗА ХЕШИРАНЕ НА ПАРОЛИ
     * ВАЖНО: Този endpoint трябва да се премахне в production!
     * Използва се само за генериране на хеширани пароли за SQL вмъкване
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
     * ENDPOINT ЗА ТЕСТВАНЕ НА ПАРОЛА
     * ВАЖНО: Този endpoint трябва да се премахне в production!
     */
    @PostMapping("/test-password")
    public ResponseEntity<?> testPassword(@RequestBody Map<String, String> testRequest) {
        try {
            String rawPassword = testRequest.get("rawPassword");
            String hashedPassword = testRequest.get("hashedPassword");

            if (rawPassword == null || hashedPassword == null) {
                return ResponseEntity.badRequest().body("И двете пароли са задължителни");
            }

            boolean matches = authService.testPassword(rawPassword, hashedPassword);

            Map<String, Object> response = new HashMap<>();
            response.put("rawPassword", rawPassword);
            response.put("hashedPassword", hashedPassword.substring(0, 20) + "...");
            response.put("matches", matches);
            response.put("message", matches ? "✅ Паролите съвпадат" : "❌ Паролите НЕ съвпадат");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("❌ Password test error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Грешка при тестване на паролата: " + e.getMessage());
        }
    }

    // ===============================
    // ПОТРЕБИТЕЛИ MANAGEMENT ENDPOINTS
    // ===============================

    /**
     * ПОЛУЧАВАНЕ НА ВСИЧКИ ПОТРЕБИТЕЛИ
     */
    @GetMapping("/users")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        try {
            List<UserDto> users = authService.getAllUsers();
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            System.err.println("❌ Error fetching users: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * ПОЛУЧАВАНЕ НА АКТИВНИ ПОТРЕБИТЕЛИ
     */
    @GetMapping("/users/active")
    public ResponseEntity<List<UserDto>> getActiveUsers() {
        try {
            List<UserDto> users = authService.getActiveUsers();
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            System.err.println("❌ Error fetching active users: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * ПОЛУЧАВАНЕ НА ПОТРЕБИТЕЛ ПО ID
     */
    @GetMapping("/users/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        try {
            UserDto user = authService.getUserById(id);
            if (user != null) {
                return ResponseEntity.ok(user);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            System.err.println("❌ Error fetching user: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * ДЕАКТИВИРАНЕ НА ПОТРЕБИТЕЛ
     */
    @PutMapping("/users/{id}/deactivate")
    public ResponseEntity<?> deactivateUser(@PathVariable Long id) {
        try {
            boolean success = authService.deactivateUser(id);
            if (success) {
                return ResponseEntity.ok(createSuccessResponse("Потребителят е деактивиран успешно"));
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            System.err.println("❌ Error deactivating user: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Грешка при деактивиране на потребителя"));
        }
    }

    /**
     * ПРОВЕРКА ДАЛИ ПОТРЕБИТЕЛ СЪЩЕСТВУВА
     */
    @GetMapping("/check-username")
    public ResponseEntity<?> checkUsername(@RequestParam String username) {
        try {
            boolean exists = authService.userExists(username);
            Map<String, Object> response = new HashMap<>();
            response.put("username", username);
            response.put("exists", exists);
            response.put("available", !exists);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("❌ Error checking username: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Грешка при проверка на потребителското име"));
        }
    }

    // ===============================
    // СЛУЖИТЕЛИ ENDPOINTS (ЗА РЕГИСТРАЦИЯ)
    // ===============================

    /**
     * ПОЛУЧАВАНЕ НА ВСИЧКИ СЛУЖИТЕЛИ БЕЗ ПОТРЕБИТЕЛСКИ АКАУНТИ
     * Този endpoint се използва в registration формата
     */
    @GetMapping("/available-employees")
    public ResponseEntity<List<Employee>> getAvailableEmployees() {
        try {
            // Тук трябва да добавите логика в AuthService за получаване на служители без акаунти
            // За момента връщаме празен списък
            return ResponseEntity.ok(List.of());
        } catch (Exception e) {
            System.err.println("❌ Error fetching available employees: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ===============================
    // UTILITY МЕТОДИ
    // ===============================

    /**
     * Създава стандартизиран error response
     */
    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("error", true);
        response.put("message", message);
        response.put("timestamp", System.currentTimeMillis());
        return response;
    }

    /**
     * Създава стандартизиран success response
     */
    private Map<String, Object> createSuccessResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("error", false);
        response.put("message", message);
        response.put("timestamp", System.currentTimeMillis());
        return response;
    }
}