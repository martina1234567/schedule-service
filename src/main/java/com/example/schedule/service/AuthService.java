package com.example.schedule.service;

import com.example.schedule.dto.UserRegistrationDto;
import com.example.schedule.dto.UserDto;
import com.example.schedule.entity.User;
import com.example.schedule.entity.Employee;
import com.example.schedule.entity.Role;
import com.example.schedule.repository.UserRepository;
import com.example.schedule.repository.EmployeeRepository;
import com.example.schedule.repository.RoleRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.HashSet;
import java.util.stream.Collectors;

/**
 * СЕРВИС ЗА АВТЕНТИКАЦИЯ И УПРАВЛЕНИЕ НА ПОТРЕБИТЕЛИ
 *
 * Този сервис обработва всички операции свързани с:
 * - Регистрация на нови потребители
 * - Автентикация при логин
 * - Управление на потребителски акаунти
 * - Хеширане на пароли
 * - Работа с роли и права
 *
 * @author Schedule Management System
 * @version 2.0
 */
@Service
@Transactional
public class AuthService {

    // ===============================
    // DEPENDENCY INJECTION
    // ===============================

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // ===============================
    // РЕГИСТРАЦИЯ НА ПОТРЕБИТЕЛИ
    // ===============================

    /**
     * Регистрира нов потребител в системата
     *
     * Процесът включва:
     * 1. Валидация на входните данни
     * 2. Проверка дали служителят съществува
     * 3. Проверка дали служителят вече няма акаунт
     * 4. Проверка дали username е свободен
     * 5. Хеширане на паролата
     * 6. Създаване на потребителя
     * 7. Присвояване на роля
     * 8. Запазване в базата данни
     *
     * @param registrationDto данни за регистрация
     * @return UserDto с информация за създадения потребител
     * @throws RuntimeException при различни грешки в процеса
     */
    public UserDto registerUser(UserRegistrationDto registrationDto) {
        System.out.println("🔍 Starting user registration process for: " + registrationDto.getUsername());

        // Стъпка 1: Почистване и валидация на входните данни
        registrationDto.trimFields();
        validateRegistrationData(registrationDto);

        // Стъпка 2: Проверка дали служителят съществува
        Employee employee = validateAndGetEmployee(registrationDto.getEmployeeId());

        // Стъпка 3: Проверка дали служителят вече има акаунт
        checkEmployeeHasNoExistingAccount(employee);

        // Стъпка 4: Проверка дали username е свободен
        checkUsernameAvailability(registrationDto.getUsername());

        // Стъпка 5: Проверка и получаване на ролята
        Role role = validateAndGetRole(registrationDto.getRole());

        // Стъпка 6: Хеширане на паролата
        String hashedPassword = hashPassword(registrationDto.getPassword());

        // Стъпка 7: Създаване на потребителя
        User newUser = createUser(registrationDto, employee, hashedPassword);

        // Стъпка 8: Присвояване на роля
        assignRoleToUser(newUser, role);

        // Стъпка 9: Запазване в базата данни
        User savedUser = userRepository.save(newUser);

        System.out.println("✅ User successfully registered with ID: " + savedUser.getId());

        // Стъпка 10: Връщане на DTO с данните
        return convertToUserDto(savedUser);
    }

    /**
     * Валидира данните за регистрация
     */
    private void validateRegistrationData(UserRegistrationDto registrationDto) {
        System.out.println("🔍 Validating registration data...");

        if (registrationDto == null) {
            throw new RuntimeException("Данните за регистрация не могат да бъдат null");
        }

        if (!registrationDto.isValid()) {
            String errors = registrationDto.getValidationErrors();
            System.err.println("❌ Validation errors: " + errors);
            throw new RuntimeException("Невалидни данни за регистрация: " + errors);
        }

        if (!registrationDto.isPasswordMatching()) {
            throw new RuntimeException("Паролите не съвпадат");
        }

        System.out.println("✅ Registration data validation passed");
    }

    /**
     * Валидира и връща служителя по ID
     */
    private Employee validateAndGetEmployee(Long employeeId) {
        System.out.println("🔍 Validating employee with ID: " + employeeId);

        Optional<Employee> employeeOpt = employeeRepository.findById(employeeId);

        if (employeeOpt.isEmpty()) {
            System.err.println("❌ Employee not found with ID: " + employeeId);
            throw new RuntimeException("Служител с ID " + employeeId + " не съществува");
        }

        Employee employee = employeeOpt.get();
        // ПОПРАВКА: Използваме getName() и getLastname() вместо getFirstName() и getLastName()
        System.out.println("✅ Employee found: " + employee.getName() + " " + employee.getLastname());

        return employee;
    }

    /**
     * Проверява дали служителят вече има потребителски акаунт
     */
    private void checkEmployeeHasNoExistingAccount(Employee employee) {
        System.out.println("🔍 Checking if employee already has an account...");

        Optional<User> existingUser = userRepository.findByEmployee(employee);

        if (existingUser.isPresent()) {
            System.err.println("❌ Employee already has an account: " + existingUser.get().getUsername());
            // ПОПРАВКА: Използваме getName() и getLastname()
            throw new RuntimeException("Служителят " + employee.getName() + " " +
                    employee.getLastname() + " вече има потребителски акаунт");
        }

        System.out.println("✅ Employee has no existing account");
    }

    /**
     * Проверява дали потребителското име е свободно
     */
    private void checkUsernameAvailability(String username) {
        System.out.println("🔍 Checking username availability: " + username);

        Optional<User> existingUser = userRepository.findByUsername(username);

        if (existingUser.isPresent()) {
            System.err.println("❌ Username already taken: " + username);
            throw new RuntimeException("Потребителското име '" + username + "' вече се използва");
        }

        System.out.println("✅ Username is available");
    }

    /**
     * Валидира и връща ролята по име
     */
    private Role validateAndGetRole(String roleName) {
        System.out.println("🔍 Getting role: " + roleName);

        Optional<Role> roleOpt = roleRepository.findByName(roleName.toUpperCase());

        if (roleOpt.isEmpty()) {
            System.err.println("❌ Role not found: " + roleName);
            throw new RuntimeException("Роля '" + roleName + "' не съществува в системата");
        }

        Role role = roleOpt.get();
        System.out.println("✅ Role found: " + role.getName());

        return role;
    }

    /**
     * Създава новия User обект
     */
    private User createUser(UserRegistrationDto registrationDto, Employee employee, String hashedPassword) {
        System.out.println("🔍 Creating new user object...");

        LocalDateTime now = LocalDateTime.now();

        User newUser = new User();
        newUser.setUsername(registrationDto.getUsername());
        newUser.setPassword(hashedPassword);
        newUser.setEmployee(employee);
        newUser.setIsActive(true);
        newUser.setCreatedAt(now);
        newUser.setUpdatedAt(now);
        // last_login ще се попълни при първия логин

        System.out.println("✅ User object created successfully");
        return newUser;
    }

    /**
     * Присвоява роля на потребителя
     */
    private void assignRoleToUser(User user, Role role) {
        System.out.println("🔍 Assigning role to user: " + role.getName());

        Set<Role> roles = new HashSet<>();
        roles.add(role);
        user.setRoles(roles);

        System.out.println("✅ Role assigned successfully");
    }

    // ===============================
    // УПРАВЛЕНИЕ НА ПАРОЛИ
    // ===============================

    /**
     * Хешира парола с BCrypt
     *
     * @param rawPassword суровата парола
     * @return хеширана парола
     */
    public String hashPassword(String rawPassword) {
        if (rawPassword == null || rawPassword.isEmpty()) {
            throw new RuntimeException("Паролата не може да бъде празна");
        }

        System.out.println("🔒 Hashing password...");
        String hashedPassword = passwordEncoder.encode(rawPassword);
        System.out.println("✅ Password hashed successfully");

        return hashedPassword;
    }

    /**
     * Проверява дали суровата парола съвпада с хешираната
     *
     * @param rawPassword суровата парола
     * @param hashedPassword хешираната парола
     * @return true ако паролите съвпадат
     */
    public boolean verifyPassword(String rawPassword, String hashedPassword) {
        if (rawPassword == null || hashedPassword == null) {
            return false;
        }

        return passwordEncoder.matches(rawPassword, hashedPassword);
    }

    // ===============================
    // QUERY МЕТОДИ ЗА СЛУЖИТЕЛИ
    // ===============================

    /**
     * Връща всички служители които НЯМАТ потребителски акаунти
     * Използва се в регистрационната форма
     *
     * @return списък със служители без акаунти
     */
    public List<Employee> getEmployeesWithoutAccounts() {
        System.out.println("🔍 Finding employees without user accounts...");

        try {
            List<Employee> allEmployees = employeeRepository.findAll();
            System.out.println("📋 Total employees found: " + allEmployees.size());

            List<Employee> employeesWithAccounts = userRepository.findAll()
                    .stream()
                    .map(User::getEmployee)
                    .filter(emp -> emp != null) // Филтрираме null стойности
                    .collect(Collectors.toList());

            System.out.println("📋 Employees with accounts: " + employeesWithAccounts.size());

            List<Employee> employeesWithoutAccounts = allEmployees.stream()
                    .filter(employee -> !employeesWithAccounts.contains(employee))
                    .collect(Collectors.toList());

            System.out.println("✅ Found " + employeesWithoutAccounts.size() + " employees without accounts");

            // Логваме първите няколко служители за debugging
            employeesWithoutAccounts.stream()
                    .limit(3)
                    .forEach(emp -> System.out.println("   - " + emp.getName() + " " + emp.getLastname()));

            return employeesWithoutAccounts;

        } catch (Exception e) {
            System.err.println("❌ Error finding employees without accounts: " + e.getMessage());
            e.printStackTrace();
            return new java.util.ArrayList<>(); // Връщаме празен списък при грешка
        }
    }

    /**
     * Връща всички служители които НЯМАТ роли (legacy метод)
     * Това е различно от служители без акаунти
     */
    public List<Employee> getEmployeesWithoutRoles() {
        System.out.println("🔍 Finding employees without roles...");

        // Това е по-сложна логика която може да се имплементира при нужда
        // За момента връщаме служителите без акаунти
        return getEmployeesWithoutAccounts();
    }

    /**
     * МЕТОД ЗА ПОЛУЧАВАНЕ НА ВСИЧКИ СЛУЖИТЕЛИ (за debugging)
     * @return List<Employee> - всички служители
     */
    public List<Employee> getAllEmployeesForDebugging() {
        List<Employee> allEmployees = employeeRepository.findAll();
        System.out.println("👥 Total employees in database: " + allEmployees.size());

        for (Employee emp : allEmployees) {
            Optional<User> userOpt = userRepository.findByEmployeeId(emp.getId());
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                // ПОПРАВКА: Използваме getName() и getLastname()
                System.out.println("   Employee: " + emp.getName() + " " + emp.getLastname() +
                        " -> User: " + user.getUsername() +
                        " -> Roles: " + user.getRoles().size());
            } else {
                // ПОПРАВКА: Използваме getName() и getLastname()
                System.out.println("   Employee: " + emp.getName() + " " + emp.getLastname() + " -> NO USER ACCOUNT");
            }
        }

        return allEmployees;
    }

    // ===============================
    // QUERY МЕТОДИ ЗА ПОТРЕБИТЕЛИ
    // ===============================

    /**
     * Връща всички потребители в системата
     */
    public List<UserDto> getAllUsers() {
        System.out.println("🔍 Getting all users...");

        List<User> users = userRepository.findAll();
        List<UserDto> userDtos = users.stream()
                .map(this::convertToUserDto)
                .collect(Collectors.toList());

        System.out.println("✅ Retrieved " + userDtos.size() + " users");

        return userDtos;
    }

    /**
     * Връща всички активни потребители
     */
    public List<UserDto> getActiveUsers() {
        System.out.println("🔍 Getting active users...");

        List<User> activeUsers = userRepository.findByIsActiveTrue();
        List<UserDto> userDtos = activeUsers.stream()
                .map(this::convertToUserDto)
                .collect(Collectors.toList());

        System.out.println("✅ Retrieved " + userDtos.size() + " active users");

        return userDtos;
    }

    /**
     * Намира потребител по ID
     */
    public Optional<UserDto> getUserById(Long id) {
        System.out.println("🔍 Getting user by ID: " + id);

        Optional<User> userOpt = userRepository.findById(id);

        if (userOpt.isPresent()) {
            UserDto userDto = convertToUserDto(userOpt.get());
            System.out.println("✅ User found: " + userDto.getUsername());
            return Optional.of(userDto);
        } else {
            System.out.println("❌ User not found with ID: " + id);
            return Optional.empty();
        }
    }

    /**
     * Намира потребител по потребителско име
     */
    public Optional<UserDto> getUserByUsername(String username) {
        System.out.println("🔍 Getting user by username: " + username);

        Optional<User> userOpt = userRepository.findByUsername(username);

        if (userOpt.isPresent()) {
            UserDto userDto = convertToUserDto(userOpt.get());
            System.out.println("✅ User found: " + userDto.getUsername());
            return Optional.of(userDto);
        } else {
            System.out.println("❌ User not found with username: " + username);
            return Optional.empty();
        }
    }

    // ===============================
    // АВТЕНТИКАЦИЯ
    // ===============================

    /**
     * Автентикира потребител по username и парола
     *
     * @param username потребителското име
     * @param password суровата парола
     * @return UserDto ако автентикацията е успешна
     * @throws RuntimeException при неуспешна автентикация
     */
    public UserDto authenticateUser(String username, String password) {
        System.out.println("🔍 Authenticating user: " + username);

        Optional<User> userOpt = userRepository.findByUsername(username);

        if (userOpt.isEmpty()) {
            System.err.println("❌ User not found: " + username);
            throw new RuntimeException("Невалидно потребителско име или парола");
        }

        User user = userOpt.get();

        if (!user.getIsActive()) {
            System.err.println("❌ User account is deactivated: " + username);
            throw new RuntimeException("Потребителският акаунт е деактивиран");
        }

        if (!verifyPassword(password, user.getPassword())) {
            System.err.println("❌ Invalid password for user: " + username);
            throw new RuntimeException("Невалидно потребителско име или парола");
        }

        // Обновяване на последен логин
        user.setLastLogin(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        System.out.println("✅ User authenticated successfully: " + username);

        return convertToUserDto(user);
    }

    // ===============================
    // CONVERSION МЕТОДИ
    // ===============================

    /**
     * Конвертира User entity към UserDto
     */
    private UserDto convertToUserDto(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setIsActive(user.getIsActive());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        dto.setLastLogin(user.getLastLogin());

        // Employee информация
        if (user.getEmployee() != null) {
            dto.setEmployeeId(user.getEmployee().getId());
            // ПОПРАВКА: Използваме getName() и getLastname()
            dto.setEmployeeName(user.getEmployee().getName() + " " + user.getEmployee().getLastname());
        }

        // Роли - ВАЖНО: Трябва да конвертираме към List<String>
        if (user.getRoles() != null && !user.getRoles().isEmpty()) {
            List<String> roleNames = user.getRoles().stream()
                    .map(Role::getName)
                    .collect(Collectors.toList());
            dto.setRoles(roleNames);

            // Debug logging за ролите
            System.out.println("🔍 User " + user.getUsername() + " roles: " + roleNames);
        } else {
            System.out.println("⚠️ User " + user.getUsername() + " has no roles!");
            dto.setRoles(new java.util.ArrayList<>()); // Празен списък вместо null
        }

        return dto;
    }
    /**
     * Намира потребител по username и връща UserDto
     * Този метод се използва за валидация на сесии
     *
     * @param username - потребителското име
     * @return UserDto обект или null ако не е намерен
     */
    public UserDto findUserByUsername(String username) {
        try {
            System.out.println("🔍 Finding user by username: " + username);

            if (username == null || username.trim().isEmpty()) {
                System.out.println("❌ Username is null or empty");
                return null;
            }

            // Намираме потребителя в базата данни
            Optional<User> userOpt = userRepository.findByUsername(username.trim());

            if (userOpt.isEmpty()) {
                System.out.println("❌ User not found: " + username);
                return null;
            }

            User user = userOpt.get();
            System.out.println("✅ User found: " + user.getUsername());

            // Конвертираме към UserDto
            UserDto userDto = convertToUserDto(user);

            System.out.println("✅ UserDto created - Employee ID: " + userDto.getEmployeeId() +
                    ", Roles: " + userDto.getRoles());

            return userDto;

        } catch (Exception e) {
            System.err.println("❌ Error finding user by username: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }
    /**
     * Проверява дали потребител има конкретна роля
     * Помощен метод за авторизация
     *
     * @param user - UserDto обект
     * @param roleName - името на ролята за проверка
     * @return true ако потребителят има ролята
     */
    public boolean userHasRole(UserDto user, String roleName) {
        if (user == null || user.getRoles() == null || roleName == null) {
            return false;
        }

        return user.getRoles().stream()
                .anyMatch(role -> role.equalsIgnoreCase(roleName.trim()));
    }

    /**
     * Проверява дали потребител може да достъпи данните на конкретен служител
     * Бизнес логика за контрол на достъпа
     *
     * @param user - UserDto на потребителя който прави заявката
     * @param targetEmployeeId - ID на служителя чиито данни искаме
     * @return true ако има достъп
     */
    public boolean canAccessEmployeeData(UserDto user, Long targetEmployeeId) {
        if (user == null || targetEmployeeId == null) {
            return false;
        }

        // Админите могат да виждат всичко
        if (userHasRole(user, "ADMIN")) {
            System.out.println("✅ Access granted: Admin role");
            return true;
        }

        // Мениджърите могат да виждат всичко
        if (userHasRole(user, "MANAGER")) {
            System.out.println("✅ Access granted: Manager role");
            return true;
        }

        // Обикновените потребители могат да виждат само своите данни
        // Проверяваме за USER роля (case-insensitive)
        if (userHasRole(user, "USER") || userHasRole(user, "user")) {
            if (user.getEmployeeId() != null && user.getEmployeeId().equals(targetEmployeeId)) {
                System.out.println("✅ Access granted: Own employee data");
                return true;
            } else {
                System.out.println("❌ Access denied: Can only view own employee data");
                System.out.println("User employee ID: " + user.getEmployeeId() + ", Requested: " + targetEmployeeId);
                return false;
            }
        }

        System.out.println("❌ Access denied: No valid role found");
        return false;
    }

}