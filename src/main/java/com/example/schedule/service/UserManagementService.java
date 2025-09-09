package com.example.schedule.service;

import com.example.schedule.dto.UserDto;
import com.example.schedule.entity.Employee;
import com.example.schedule.entity.User;
import com.example.schedule.repository.UserRepository;
import com.example.schedule.repository.EmployeeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * SERVICE ЗА УПРАВЛЕНИЕ НА ПОТРЕБИТЕЛСКИ АКАУНТИ
 *
 * Този service обслужва бизнес логиката за:
 * - CRUD операции с потребители
 * - Преобразуване между Entity и DTO
 * - Валидиране на данни
 * - Статистика и отчети
 * - Управление на пароли (хеширане/валидиране)
 *
 * ВАЖНИ ОСОБЕНОСТИ:
 * - Паролите винаги се хешират преди съхранение
 * - Employee данни се включват в DTO резултатите
 * - Ролите се показват като списък от низове
 * - Поддържа се пълен audit trail на промените
 *
 * @author Schedule Management System
 * @version 1.0
 */
@Service
@Transactional
public class UserManagementService {

    // ===============================
    // DEPENDENCY INJECTION
    // ===============================

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private PasswordEncoder passwordEncoder; // За хеширане на паролите

    // ===============================
    // ОСНОВНИ CRUD ОПЕРАЦИИ
    // ===============================

    /**
     * ПОЛУЧАВАНЕ НА ВСИЧКИ ПОТРЕБИТЕЛИ С ПЪЛНА ИНФОРМАЦИЯ
     *
     * Връща всички потребители с включени Employee и Role данни
     * Паролите НЕ се включват в резултата за сигурност
     *
     * @return List<UserDto> - списък с всички потребители
     */
    @Transactional(readOnly = true)
    public List<UserDto> getAllUsersWithFullInfo() {
        System.out.println("📋 Service: Getting all users with full info...");

        try {
            // Използваме custom query за оптимизиране на заявките
            List<User> users = userRepository.findAllUsersWithFullInfo();

            // Преобразуваме Entity в DTO
            List<UserDto> userDtos = users.stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());

            System.out.println("✅ Service: Converted " + userDtos.size() + " users to DTOs");
            return userDtos;

        } catch (Exception e) {
            System.err.println("❌ Service: Error getting all users: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to load users from database", e);
        }
    }

//    /**
//     * ПОЛУЧАВАНЕ НА ПОТРЕБИТЕЛ ПО ID
//     *
//     * @param id ID на потребителя
//     * @return UserDto или null ако не съществува
//     */
//    @Transactional(readOnly = true)
//    public UserDto getUserById(Long id) {
//        System.out.println("👤 Service: Getting user by ID: " + id);
//
//        try {
//            Optional<User> userOpt = userRepository.findById(id);
//
//            if (userOpt.isPresent()) {
//                User user = userOpt.get();
//                UserDto userDto = convertToDto(user);
//                System.out.println("✅ Service: Found user: " + userDto.getUsername());
//                return userDto;
//            } else {
//                System.out.println("❌ Service: User not found with ID: " + id);
//                return null;
//            }
//
//        } catch (Exception e) {
//            System.err.println("❌ Service: Error getting user by ID: " + e.getMessage());
//            e.printStackTrace();
//            throw new RuntimeException("Failed to load user from database", e);
//        }
//    }

    /**
     * АКТУАЛИЗИРАНЕ НА ПОТРЕБИТЕЛСКИ АКАУНТ
     *
     * @param userDto DTO с новите данни
     * @param newPassword новата парола (null или празно ако не се променя)
     * @return UserDto - актуализираният потребител
     * @throws IllegalArgumentException при невалидни данни
     */
    @Transactional
    public UserDto updateUser(UserDto userDto, String newPassword) {
        System.out.println("✏️ Service: Updating user ID: " + userDto.getId());

        try {
            // СТЪПКА 1: Намираме съществуващия потребител
            Optional<User> existingUserOpt = userRepository.findById(userDto.getId());
            if (!existingUserOpt.isPresent()) {
                throw new IllegalArgumentException("User not found with ID: " + userDto.getId());
            }

            User existingUser = existingUserOpt.get();
            System.out.println("📋 Service: Found existing user: " + existingUser.getUsername());

            // СТЪПКА 2: Валидираме новите данни (без да изискваме employeeId да се променя)
            validateUserUpdateDataFlexible(userDto, existingUser.getId());

            // СТЪПКА 3: ПОПРАВКА - Използваме съществуващия employee ако не се подава нов
            Employee employeeToUse = existingUser.getEmployee(); // По подразбиране оставяме същия

            // Само ако се подава нов employeeId, го променяме
            if (userDto.getEmployeeId() != null && !userDto.getEmployeeId().equals(existingUser.getEmployee().getId())) {
                employeeToUse = employeeRepository.findById(userDto.getEmployeeId())
                        .orElseThrow(() -> new IllegalArgumentException("Employee not found with ID: " + userDto.getEmployeeId()));
                System.out.println("🔄 Service: Changing employee from ID " + existingUser.getEmployee().getId() + " to ID " + userDto.getEmployeeId());
            }

            // СТЪПКА 4: Актуализираме данните
            existingUser.setUsername(userDto.getUsername());
            existingUser.setEmployee(employeeToUse);
            existingUser.setIsActive(userDto.getIsActive());
            existingUser.setUpdatedAt(LocalDateTime.now());

            // СТЪПКА 5: Актуализираме паролата ако е дадена
            if (newPassword != null && !newPassword.trim().isEmpty()) {
                if (newPassword.length() < 4) {
                    throw new IllegalArgumentException("Password must be at least 4 characters long");
                }

                String hashedPassword = passwordEncoder.encode(newPassword);
                existingUser.setPassword(hashedPassword);
                System.out.println("🔐 Service: Password updated for user: " + existingUser.getUsername());
            } else {
                System.out.println("🔐 Service: Password not changed for user: " + existingUser.getUsername());
            }

            // СТЪПКА 6: Запазваме промените
            User savedUser = userRepository.save(existingUser);

            // СТЪПКА 7: Връщаме DTO
            UserDto updatedDto = convertToDto(savedUser);
            System.out.println("✅ Service: User updated successfully: " + updatedDto.getUsername());

            return updatedDto;

        } catch (IllegalArgumentException e) {
            System.err.println("❌ Service: Validation error: " + e.getMessage());
            throw e;
        } catch (Exception e) {
            System.err.println("❌ Service: Error updating user: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to update user in database", e);
        }
    }
    /**
     * ВАЛИДИРА ДАННИ ЗА АКТУАЛИЗИРАНЕ (ГЪВКАВА ВЕРСИЯ)
     * Тази версия не изисква employeeId да е задължително
     *
     * @param userDto данните за валидиране
     * @param currentUserId ID на текущия потребител
     * @throws IllegalArgumentException при невалидни данни
     */
    /**
     * ВАЛИДИРА ДАННИ ЗА АКТУАЛИЗИРАНЕ (МОДИФИЦИРАНА ВЕРСИЯ)
     * Тази версия не изисква employeeId да е задължително при обновяване
     *
     * @param userDto данните за валидиране
     * @param currentUserId ID на текущия потребител
     * @throws IllegalArgumentException при невалидни данни
     */
    private void validateUserUpdateDataFlexible(UserDto userDto, Long currentUserId) {
        System.out.println("✅ Service: Validating user update data...");

        // Проверка на username
        if (userDto.getUsername() == null || userDto.getUsername().trim().isEmpty()) {
            throw new IllegalArgumentException("Username cannot be empty");
        }

        if (userDto.getUsername().trim().length() < 3) {
            throw new IllegalArgumentException("Username must be at least 3 characters long");
        }

        if (userDto.getUsername().trim().length() > 50) {
            throw new IllegalArgumentException("Username cannot be longer than 50 characters");
        }

        // Проверка за уникалност на username
        if (!isUsernameAvailable(userDto.getUsername(), currentUserId)) {
            throw new IllegalArgumentException("Username '" + userDto.getUsername() + "' is already taken");
        }

        // ПОПРАВКА: employeeId вече не е задължително при обновяване
        // Проверяваме го само ако се подава
        if (userDto.getEmployeeId() != null && !employeeRepository.existsById(userDto.getEmployeeId())) {
            throw new IllegalArgumentException("Employee not found with ID: " + userDto.getEmployeeId());
        }

        // Проверка на isActive
        if (userDto.getIsActive() == null) {
            throw new IllegalArgumentException("Active status is required");
        }

        System.out.println("✅ Service: User data validation passed");
    }
    /**
     * НАМИРАНЕ НА ПОТРЕБИТЕЛ ПО ID
     *
     * @param userId ID на потребителя
     * @return Optional<UserDto> - потребителят ако съществува
     */
    @Transactional(readOnly = true)
    public Optional<UserDto> getUserById(Long userId) {
        System.out.println("🔍 Service: Getting user by ID: " + userId);

        try {
            Optional<User> userOpt = userRepository.findById(userId);

            if (userOpt.isPresent()) {
                UserDto userDto = convertToDto(userOpt.get());
                System.out.println("✅ Service: Found user: " + userDto.getUsername());
                return Optional.of(userDto);
            } else {
                System.out.println("❌ Service: User not found with ID: " + userId);
                return Optional.empty();
            }

        } catch (Exception e) {
            System.err.println("❌ Service: Error getting user by ID: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to get user by ID", e);
        }
    }

    /**
     * ПРЕВКЛЮЧВАНЕ НА АКТИВНИЯ СТАТУС НА ПОТРЕБИТЕЛ
     *
     * @param userId ID на потребителя
     * @return UserDto - актуализираният потребител
     */
    @Transactional
    public UserDto toggleUserActiveStatus(Long userId) {
        System.out.println("🔄 Service: Toggling active status for user ID: " + userId);

        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

            boolean oldStatus = user.getIsActive();
            boolean newStatus = !oldStatus;

            user.setIsActive(newStatus);
            user.setUpdatedAt(LocalDateTime.now());

            User savedUser = userRepository.save(user);

            String statusText = newStatus ? "activated" : "deactivated";
            System.out.println("✅ Service: User " + statusText + ": " + savedUser.getUsername());

            return convertToDto(savedUser);

        } catch (Exception e) {
            System.err.println("❌ Service: Error toggling user status: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to change user status", e);
        }
    }

    // ===============================
    // ВАЛИДИРАНЕ И ПРОВЕРКИ
    // ===============================

    /**
     * ПРОВЕРЯВА ДАЛИ ПОТРЕБИТЕЛСКО ИМЕ Е СВОБОДНО
     *
     * @param username потребителското име за проверка
     * @param excludeUserId ID на потребител за изключване (при редактиране)
     * @return true ако е свободно, false ако е заето
     */
    @Transactional(readOnly = true)
    public boolean isUsernameAvailable(String username, Long excludeUserId) {
        System.out.println("🔍 Service: Checking username availability: " + username);

        try {
            if (excludeUserId != null) {
                // При редактиране - изключваме текущия потребител
                boolean exists = userRepository.existsByUsernameAndIdNot(username, excludeUserId);
                System.out.println("🔍 Service: Username " + username + " availability (exclude ID " + excludeUserId + "): " + !exists);
                return !exists;
            } else {
                // При нов потребител
                boolean exists = userRepository.existsByUsername(username);
                System.out.println("🔍 Service: Username " + username + " availability: " + !exists);
                return !exists;
            }

        } catch (Exception e) {
            System.err.println("❌ Service: Error checking username availability: " + e.getMessage());
            e.printStackTrace();
            return false; // В случай на грешка - считаме че е заето
        }
    }

    /**
     * ВАЛИДИРАНЕ НА ДАННИ ЗА АКТУАЛИЗИРАНЕ
     *
     * @param userDto данните за валидиране
     * @param currentUserId ID на текущия потребител
     * @throws IllegalArgumentException при невалидни данни
     */
    private void validateUserUpdateData(UserDto userDto, Long currentUserId) {
        System.out.println("✅ Service: Validating user update data...");

        // Проверка на username
        if (userDto.getUsername() == null || userDto.getUsername().trim().isEmpty()) {
            throw new IllegalArgumentException("Username cannot be empty");
        }

        if (userDto.getUsername().trim().length() < 3) {
            throw new IllegalArgumentException("Username must be at least 3 characters long");
        }

        if (userDto.getUsername().trim().length() > 50) {
            throw new IllegalArgumentException("Username cannot be longer than 50 characters");
        }

        // Проверка за уникалност на username
        if (!isUsernameAvailable(userDto.getUsername(), currentUserId)) {
            throw new IllegalArgumentException("Username '" + userDto.getUsername() + "' is already taken");
        }

        // Проверка на employeeId
        if (userDto.getEmployeeId() == null) {
            throw new IllegalArgumentException("Employee ID is required");
        }

        // Проверка дали служителят съществува
        if (!employeeRepository.existsById(userDto.getEmployeeId())) {
            throw new IllegalArgumentException("Employee not found with ID: " + userDto.getEmployeeId());
        }

        // Проверка на isActive
        if (userDto.getIsActive() == null) {
            throw new IllegalArgumentException("Active status is required");
        }

        System.out.println("✅ Service: User data validation passed");
    }

    // ===============================
    // СТАТИСТИКА И ОТЧЕТИ
    // ===============================

    /**
     * ПОЛУЧАВАНЕ НА СТАТИСТИКА ЗА ПОТРЕБИТЕЛИТЕ
     *
     * @return Map със статистически данни
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getUserStatistics() {
        System.out.println("📊 Service: Calculating user statistics...");

        try {
            Map<String, Object> stats = new HashMap<>();

            // Общ брой потребители
            long totalUsers = userRepository.count();
            stats.put("totalUsers", totalUsers);

            // Активни потребители
            long activeUsers = userRepository.countByIsActive(true);
            stats.put("activeUsers", activeUsers);

            // Неактивни потребители
            long inactiveUsers = userRepository.countByIsActive(false);
            stats.put("inactiveUsers", inactiveUsers);

            // Потребители без логин
            LocalDateTime cutoffDate = LocalDateTime.now().minusDays(30);
            List<User> neverLoggedInUsers = userRepository.findByLastLoginIsNull();
            stats.put("neverLoggedIn", neverLoggedInUsers.size());

            // Неактивни в последните 30 дни
            List<User> inactiveRecently = userRepository.findByLastLoginBeforeOrLastLoginIsNull(cutoffDate);
            stats.put("inactiveLastMonth", inactiveRecently.size());

            // Последно създадени (топ 5)
            List<User> recentUsers = userRepository.findLatestUsers(5);
            List<UserDto> recentUserDtos = recentUsers.stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());
            stats.put("recentUsers", recentUserDtos);

            // Процентно разпределение
            if (totalUsers > 0) {
                stats.put("activePercentage", Math.round((activeUsers * 100.0) / totalUsers));
                stats.put("inactivePercentage", Math.round((inactiveUsers * 100.0) / totalUsers));
            } else {
                stats.put("activePercentage", 0);
                stats.put("inactivePercentage", 0);
            }

            // Дата на генериране
            stats.put("generatedAt", LocalDateTime.now());

            System.out.println("✅ Service: Statistics calculated successfully");
            return stats;

        } catch (Exception e) {
            System.err.println("❌ Service: Error calculating statistics: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to calculate user statistics", e);
        }
    }

    // ===============================
    // UTILITY МЕТОДИ И ПРЕОБРАЗУВАНИЯ
    // ===============================

    /**
     * ПРЕОБРАЗУВА USER ENTITY В USER DTO
     *
     * Включва всички необходими данни БЕЗ паролата за сигурност
     * Добавя Employee информация и ролите като списък от низове
     *
     * @param user User entity за преобразуване
     * @return UserDto с пълна информация
     */
    private UserDto convertToDto(User user) {
        UserDto dto = new UserDto();

        // Основни данни
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setIsActive(user.getIsActive());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        dto.setLastLogin(user.getLastLogin());

        // Employee данни
        if (user.getEmployee() != null) {
            Employee employee = user.getEmployee();
            dto.setEmployeeId(employee.getId());

            // Формираме пълното име от name и lastname
            String fullName = "";
            if (employee.getName() != null && !employee.getName().trim().isEmpty()) {
                fullName += employee.getName().trim();
            }
            if (employee.getLastname() != null && !employee.getLastname().trim().isEmpty()) {
                if (!fullName.isEmpty()) fullName += " ";
                fullName += employee.getLastname().trim();
            }

            // Ако няма име, показваме поне Employee ID
            if (fullName.isEmpty()) {
                fullName = "Employee #" + employee.getId();
            }

            dto.setEmployeeName(fullName);
        } else {
            dto.setEmployeeId(null);
            dto.setEmployeeName("No Employee Assigned");
        }

        // Ролите като списък от низове
        if (user.getRoles() != null && !user.getRoles().isEmpty()) {
            List<String> roleNames = user.getRoles().stream()
                    .map(role -> role.getName())
                    .collect(Collectors.toList());
            dto.setRoles(roleNames);
        } else {
            dto.setRoles(new ArrayList<>()); // Празен списък вместо null
        }

        return dto;
    }

    /**
     * HELPER: Проверява дали потребител има конкретна роля
     *
     * @param user потребителят за проверка
     * @param roleName името на ролята
     * @return true ако потребителят има тази роля
     */
    private boolean userHasRole(User user, String roleName) {
        return user.getRoles().stream()
                .anyMatch(role -> roleName.equals(role.getName()));
    }

    /**
     * HELPER: Форматира име на служител за показване
     *
     * @param employee Employee entity
     * @return форматирано име
     */
    private String formatEmployeeName(Employee employee) {
        if (employee == null) {
            return "Unknown Employee";
        }

        String name = employee.getName();
        String lastname = employee.getLastname();

        StringBuilder fullName = new StringBuilder();

        if (name != null && !name.trim().isEmpty()) {
            fullName.append(name.trim());
        }

        if (lastname != null && !lastname.trim().isEmpty()) {
            if (fullName.length() > 0) {
                fullName.append(" ");
            }
            fullName.append(lastname.trim());
        }

        return fullName.length() > 0 ? fullName.toString() : "Employee #" + employee.getId();
    }

    // ===============================
    // СПЕЦИАЛНИ QUERY МЕТОДИ
    // ===============================

    /**
     * НАМИРА ПОТРЕБИТЕЛИ ПО EMPLOYEE ID
     *
     * @param employeeId ID на служителя
     * @return списък с потребители за този служител
     */
    @Transactional(readOnly = true)
    public List<UserDto> getUsersByEmployeeId(Long employeeId) {
        System.out.println("👥 Service: Getting users by employee ID: " + employeeId);

        try {
            Optional<User> users = userRepository.findByEmployee_Id(employeeId);

            List<UserDto> userDtos = users.stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());

            System.out.println("✅ Service: Found " + userDtos.size() + " users for employee ID: " + employeeId);
            return userDtos;

        } catch (Exception e) {
            System.err.println("❌ Service: Error getting users by employee ID: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to load users by employee ID", e);
        }
    }

    /**
     * НАМИРА АКТИВНИ ПОТРЕБИТЕЛИ
     *
     * @return списък с всички активни потребители
     */
    @Transactional(readOnly = true)
    public List<UserDto> getActiveUsers() {
        System.out.println("✅ Service: Getting all active users...");

        try {
            List<User> activeUsers = userRepository.findByIsActiveTrue();

            List<UserDto> userDtos = activeUsers.stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());

            System.out.println("✅ Service: Found " + userDtos.size() + " active users");
            return userDtos;

        } catch (Exception e) {
            System.err.println("❌ Service: Error getting active users: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to load active users", e);
        }
    }

    /**
     * НАМИРА НЕАКТИВНИ ПОТРЕБИТЕЛИ
     *
     * @return списък с всички неактивни потребители
     */
    @Transactional(readOnly = true)
    public List<UserDto> getInactiveUsers() {
        System.out.println("❌ Service: Getting all inactive users...");

        try {
            List<User> inactiveUsers = userRepository.findByIsActiveFalse();

            List<UserDto> userDtos = inactiveUsers.stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());

            System.out.println("❌ Service: Found " + userDtos.size() + " inactive users");
            return userDtos;

        } catch (Exception e) {
            System.err.println("❌ Service: Error getting inactive users: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to load inactive users", e);
        }
    }

    /**
     * НАМИРА ПОТРЕБИТЕЛИ КОИТО НЕ СА ВЛИЗАЛИ СКОРО
     *
     * @param days брой дни за проверка
     * @return списък с потребители без скорошен логин
     */
    @Transactional(readOnly = true)
    public List<UserDto> getUsersWithoutRecentLogin(int days) {
        System.out.println("🕒 Service: Getting users without login in last " + days + " days...");

        try {
            LocalDateTime cutoffDate = LocalDateTime.now().minusDays(days);
            List<User> users = userRepository.findByLastLoginBeforeOrLastLoginIsNull(cutoffDate);

            List<UserDto> userDtos = users.stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());

            System.out.println("🕒 Service: Found " + userDtos.size() + " users without recent login");
            return userDtos;

        } catch (Exception e) {
            System.err.println("❌ Service: Error getting users without recent login: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to load users without recent login", e);
        }
    }

    // ===============================
    // BATCH OPERATIONS
    // ===============================

    /**
     * BATCH АКТИВИРАНЕ/ДЕАКТИВИРАНЕ НА ПОТРЕБИТЕЛИ
     *
     * @param userIds списък с ID-та на потребители
     * @param isActive новия активен статус
     * @return брой актуализирани потребители
     */
    @Transactional
    public int batchUpdateUserStatus(List<Long> userIds, boolean isActive) {
        System.out.println("📦 Service: Batch updating " + userIds.size() + " users to active=" + isActive);

        try {
            int updatedCount = 0;

            for (Long userId : userIds) {
                Optional<User> userOpt = userRepository.findById(userId);
                if (userOpt.isPresent()) {
                    User user = userOpt.get();
                    user.setIsActive(isActive);
                    user.setUpdatedAt(LocalDateTime.now());
                    userRepository.save(user);
                    updatedCount++;
                }
            }

            System.out.println("✅ Service: Successfully updated " + updatedCount + " users");
            return updatedCount;

        } catch (Exception e) {
            System.err.println("❌ Service: Error in batch update: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to batch update users", e);
        }
    }

    // ===============================
    // AUDIT И ЛОГИРАНЕ
    // ===============================

    /**
     * ЛОГИРА ПРОМЯНА В ПОТРЕБИТЕЛСКИ ДАННИ
     *
     * @param userId ID на потребителя
     * @param action извършеното действие
     * @param details детайли за промяната
     */
    private void logUserChange(Long userId, String action, String details) {
        System.out.println("📝 AUDIT: User " + userId + " - " + action + ": " + details);

        // В реална система тук би се записвала информацията в audit log таблица
        // За момента само логваме в конзолата

        // Пример за бъдещо разширение:
        // auditLogService.logUserChange(userId, action, details, getCurrentUser());
    }

    // ===============================
    // ВАЛИДИРАНЕ НА БИЗНЕС ПРАВИЛА
    // ===============================

    /**
     * ПРОВЕРЯВА ДАЛИ ПОТРЕБИТЕЛ МОЖЕ ДА БЪДЕ ИЗТРИТ
     *
     * @param userId ID на потребителя
     * @return true ако може да бъде изтрит
     */
    @Transactional(readOnly = true)
    public boolean canDeleteUser(Long userId) {
        System.out.println("🔍 Service: Checking if user " + userId + " can be deleted...");

        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                return false;
            }

            // Правило 1: Администраторите не могат да бъдат изтрити
            boolean isAdmin = userHasRole(user, "ADMIN");
            if (isAdmin) {
                System.out.println("❌ Service: Cannot delete admin user");
                return false;
            }

            // Правило 2: Потребители с активни schedule записи не могат да бъдат изтрити
            // Тук би трябвало да се провери дали има активни събития/графици
            // За момента предполагаме че може да се изтрие

            System.out.println("✅ Service: User can be deleted");
            return true;

        } catch (Exception e) {
            System.err.println("❌ Service: Error checking delete permissions: " + e.getMessage());
            return false;
        }
    }

    /**
     * ПРОВЕРЯВА ДАЛИ EMPLOYEE МОЖЕ ДА БЪДЕ ПРИСВОЕН НА ПОТРЕБИТЕЛ
     *
     * @param employeeId ID на служителя
     * @param excludeUserId ID на потребител за изключване (при редактиране)
     * @return true ако служителят е свободен
     */
    @Transactional(readOnly = true)
    public boolean isEmployeeAvailable(Long employeeId, Long excludeUserId) {
        System.out.println("🔍 Service: Checking if employee " + employeeId + " is available...");

        try {
            Optional<User> existingUser = userRepository.findByEmployeeId(employeeId);

            if (existingUser.isPresent()) {
                // Ако има потребител с този служител
                if (excludeUserId != null && existingUser.get().getId().equals(excludeUserId)) {
                    // Но това е същия потребител който редактираме - OK
                    System.out.println("✅ Service: Employee available (same user)");
                    return true;
                } else {
                    // Друг потребител използва този служител - NOT OK
                    System.out.println("❌ Service: Employee already assigned to user " + existingUser.get().getId());
                    return false;
                }
            } else {
                // Няма потребител с този служител - OK
                System.out.println("✅ Service: Employee is available");
                return true;
            }

        } catch (Exception e) {
            System.err.println("❌ Service: Error checking employee availability: " + e.getMessage());
            return false;
        }
    }
}