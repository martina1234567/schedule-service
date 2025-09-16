package com.example.schedule.controller;

import com.example.schedule.dto.UserDto;
import com.example.schedule.entity.Employee;
import com.example.schedule.entity.User;
import com.example.schedule.service.UserManagementService;
import com.example.schedule.repository.EmployeeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * REST CONTROLLER ЗА УПРАВЛЕНИЕ НА ПОТРЕБИТЕЛСКИ АКАУНТИ
 *
 * Този контролер обслужва заявки за:
 * - Показване на всички потребители
 * - Редактиране на потребителски акаунти
 * - Управление на активен статус
 * - Получаване на списък със служители
 *
 * ВАЖНИ ОСОБЕНОСТИ:
 * - Паролите не се показват в отговорите (само хешираните се съхраняват)
 * - isActive поле се управлява като Boolean (true/false)
 * - Employee данни се включват в отговорите
 * - Текущо логнатия потребител не може да редактира собствения си акаунт
 *
 * @author Schedule Management System
 * @version 1.0
 */
@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*") // За развойна среда - в продукция да се ограничи
public class UserManagementController {

    // ===============================
    // DEPENDENCY INJECTION
    // ===============================

    @Autowired
    private UserManagementService userManagementService;

    @Autowired
    private EmployeeRepository employeeRepository;

    // ===============================
    // ОСНОВНИ CRUD ОПЕРАЦИИ
    // ===============================

    /**
     * ПОЛУЧАВАНЕ НА ВСИЧКИ ПОТРЕБИТЕЛИ
     *
     * GET /api/users/all
     * Връща списък с всички потребители с пълна информация
     * Включва Employee данни и роли, но БЕЗ паролите
     */
    @GetMapping("/all")
    public ResponseEntity<?> getAllUsers() {
        try {
            System.out.println("📋 Getting all users with full info...");

            List<UserDto> users = userManagementService.getAllUsersWithFullInfo();

            System.out.println("✅ Found " + users.size() + " users");

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Users loaded successfully");
            response.put("data", users);
            response.put("count", users.size());
            response.put("timestamp", java.time.LocalDateTime.now());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("❌ Error getting all users: " + e.getMessage());
            e.printStackTrace();

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to load users: " + e.getMessage()));
        }
    }

    /**
     * ОБНОВЯВАНЕ НА ПОТРЕБИТЕЛСКИ АКАУНТ
     *
     * PUT /api/users/update/{id}
     * Позволява редактиране на username, парола, employeeId и активния статус
     *
     * REQUEST BODY:
     * {
     *   "username": "новото_потребителско_име",
     *   "password": "нова_парола", // ОПЦИОНАЛНО - ако е празно, паролата остава същата
     *   "employeeId": 123, // ОПЦИОНАЛНО - ако не се подава, остава същото
     *   "isActive": true  // true = достъп разрешен, false = достъп забранен
     * }
     */
    @PutMapping("/update/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody Map<String, Object> updateData) {
        try {
            System.out.println("✏️ Updating user ID: " + id);
            System.out.println("✏️ Update data: " + updateData);

            // Извличаме данните от заявката
            String username = (String) updateData.get("username");
            String password = (String) updateData.get("password"); // Може да е null или празно
            Object employeeIdObj = updateData.get("employeeId");
            Object isActiveObj = updateData.get("isActive");

            // Валидиране на задължителните полета
            if (username == null || username.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("Username is required"));
            }

            if (isActiveObj == null) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("Active status is required"));
            }

            // ПОПРАВКА: Извличаме съществуващия потребител правилно с Optional
            Optional<UserDto> existingUserOpt = userManagementService.getUserById(id);
            if (!existingUserOpt.isPresent()) { // Правилна проверка за Optional
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("User not found with ID: " + id));
            }

            UserDto existingUser = existingUserOpt.get(); // Правилно извличане от Optional

            // Конвертиране на типовете
            Long employeeId = existingUser.getEmployeeId(); // Използваме съществуващия employeeId по подразбиране
            Boolean isActive;

            try {
                // ПОПРАВКА: employeeId е опционално - само ако се подава нов, го използваме
                if (employeeIdObj != null && !employeeIdObj.toString().trim().isEmpty()) {
                    employeeId = Long.valueOf(employeeIdObj.toString());
                }
                isActive = Boolean.valueOf(isActiveObj.toString());
            } catch (NumberFormatException e) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("Invalid employee ID format"));
            }

            // Създаваме DTO за актуализация
            UserDto updateDto = new UserDto();
            updateDto.setId(id);
            updateDto.setUsername(username.trim());
            updateDto.setEmployeeId(employeeId); // Сега винаги има валидна стойност
            updateDto.setIsActive(isActive);

            // Актуализираме потребителя чрез service
            UserDto updatedUser = userManagementService.updateUser(updateDto, password);

            System.out.println("✅ User updated successfully: " + updatedUser.getUsername());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "User account updated successfully");
            response.put("data", updatedUser);
            response.put("timestamp", java.time.LocalDateTime.now());

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            System.err.println("❌ Validation error updating user: " + e.getMessage());
            return ResponseEntity.badRequest()
                    .body(createErrorResponse(e.getMessage()));

        } catch (Exception e) {
            System.err.println("❌ Error updating user: " + e.getMessage());
            e.printStackTrace();

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to update user: " + e.getMessage()));
        }
    }

    /**
     * АКТИВИРАНЕ/ДЕАКТИВИРАНЕ НА ПОТРЕБИТЕЛ
     *
     * PATCH /api/users/{id}/toggle-status
     * Превключва активния статус на потребител (активен ↔ неактивен)
     */
    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<?> toggleUserStatus(@PathVariable Long id) {
        try {
            System.out.println("🔄 Toggling status for user ID: " + id);

            UserDto user = userManagementService.toggleUserActiveStatus(id);

            String statusText = user.getIsActive() ? "activated" : "deactivated";
            System.out.println("✅ User " + statusText + " successfully: " + user.getUsername());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "User account " + statusText + " successfully");
            response.put("data", user);
            response.put("timestamp", java.time.LocalDateTime.now());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("❌ Error toggling user status: " + e.getMessage());
            e.printStackTrace();

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to change user status: " + e.getMessage()));
        }
    }

    // ===============================
    // HELPER ENDPOINTS
    // ===============================

    /**
     * ПОЛУЧАВАНЕ НА ВСИЧКИ СЛУЖИТЕЛИ
     *
     * GET /api/users/employees/all
     * Връща списък с всички служители за dropdown select
     * Използва се при редактиране на потребители
     */
    @GetMapping("/employees/all")
    public ResponseEntity<?> getAllEmployees() {
        try {
            System.out.println("👥 Getting all employees for dropdown...");

            List<Employee> employees = employeeRepository.findAll();

            System.out.println("✅ Found " + employees.size() + " employees");

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Employees loaded successfully");
            response.put("data", employees);
            response.put("count", employees.size());
            response.put("timestamp", java.time.LocalDateTime.now());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("❌ Error getting all employees: " + e.getMessage());
            e.printStackTrace();

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to load employees: " + e.getMessage()));
        }
    }

    /**
     * ПРОВЕРКА ЗА УНИКАЛНОСТ НА ПОТРЕБИТЕЛСКО ИМЕ
     *
     * GET /api/users/check-username?username=test&excludeId=123
     * Проверява дали дадено потребителско име вече съществува
     * Използва се при редактиране за валидиране
     */
    @GetMapping("/check-username")
    public ResponseEntity<?> checkUsernameAvailability(
            @RequestParam String username,
            @RequestParam(required = false) Long excludeId) {
        try {
            System.out.println("🔍 Checking username availability: " + username + " (exclude ID: " + excludeId + ")");

            boolean isAvailable = userManagementService.isUsernameAvailable(username, excludeId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("available", isAvailable);
            response.put("message", isAvailable ? "Username is available" : "Username is already taken");
            response.put("timestamp", java.time.LocalDateTime.now());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("❌ Error checking username availability: " + e.getMessage());
            e.printStackTrace();

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to check username availability: " + e.getMessage()));
        }
    }

    // ===============================
    // СТАТИСТИКА И ОТЧЕТИ
    // ===============================

    /**
     * ПОЛУЧАВАНЕ НА СТАТИСТИКА ЗА ПОТРЕБИТЕЛИТЕ
     *
     * GET /api/users/statistics
     * Връща обобщена статистика за всички потребители
     */
    @GetMapping("/statistics")
    public ResponseEntity<?> getUserStatistics() {
        try {
            System.out.println("📊 Getting user statistics...");

            Map<String, Object> stats = userManagementService.getUserStatistics();

            System.out.println("✅ Statistics calculated successfully");

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Statistics loaded successfully");
            response.put("data", stats);
            response.put("timestamp", java.time.LocalDateTime.now());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("❌ Error getting user statistics: " + e.getMessage());
            e.printStackTrace();

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to load statistics: " + e.getMessage()));
        }
    }

    // ===============================
    // UTILITY МЕТОДИ
    // ===============================

    /**
     * Създава стандартизиран error response
     *
     * @param message съобщението за грешка
     * @return Map с error response структура
     */
    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", message);
        response.put("data", null);
        response.put("timestamp", java.time.LocalDateTime.now());
        return response;
    }

    /**
     * Създава стандартизиран success response
     *
     * @param message съобщението за успех
     * @param data данните за връщане
     * @return Map с success response структура
     */
    private Map<String, Object> createSuccessResponse(String message, Object data) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", message);
        response.put("data", data);
        response.put("timestamp", java.time.LocalDateTime.now());
        return response;
    }
}