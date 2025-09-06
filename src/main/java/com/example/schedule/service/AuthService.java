package com.example.schedule.service;

import com.example.schedule.dto.UserDto;
import com.example.schedule.dto.UserRegistrationDto;
import com.example.schedule.entity.Employee;
import com.example.schedule.entity.Role;
import com.example.schedule.entity.User;
import com.example.schedule.repository.EmployeeRepository;
import com.example.schedule.repository.RoleRepository;
import com.example.schedule.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * ПОПРАВЕН SERVICE ЗА АУТЕНТИФИКАЦИЯ С BCRYPT ХЕШИРАНЕ
 *
 * Този service клас обработва:
 * 1. Логин с BCrypt парола проверка
 * 2. Регистрация с BCrypt парола хеширане
 * 3. Управление на потребители
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

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder; // За BCrypt хеширане

    @Autowired
    public AuthService(UserRepository userRepository,
                       RoleRepository roleRepository,
                       EmployeeRepository employeeRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.employeeRepository = employeeRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // ===============================
    // АУТЕНТИФИКАЦИЯ
    // ===============================

    /**
     * ЛОГИН С BCRYPT ПАРОЛА ПРОВЕРКА
     *
     * @param username потребителското име
     * @param rawPassword необработената парола (plain text)
     * @return UserDto ако логинът е успешен, null ако неуспешен
     */
    public UserDto login(String username, String rawPassword) {
        System.out.println("🔐 Attempting login for user: " + username);

        // 1. Намираме потребителя по username
        Optional<User> userOpt = userRepository.findActiveUserByUsername(username);
        if (userOpt.isEmpty()) {
            System.out.println("❌ User not found or inactive: " + username);
            return null;
        }

        User user = userOpt.get();
        System.out.println("👤 Found user: " + user.getUsername());

        // 2. Проверяваме дали въведената парола съвпада с хешираната в базата
        boolean passwordMatches = passwordEncoder.matches(rawPassword, user.getPassword());

        if (!passwordMatches) {
            System.out.println("❌ Invalid password for user: " + username);
            System.out.println("   Raw password length: " + rawPassword.length());
            System.out.println("   Stored password starts with: " +
                    (user.getPassword().length() > 10 ? user.getPassword().substring(0, 10) + "..." : user.getPassword()));
            return null;
        }

        // 3. Успешен логин - обновяваме времето на последен логин
        user.updateLastLogin();
        userRepository.save(user);

        System.out.println("✅ Login successful for user: " + username);
        return convertToDto(user);
    }

    // ===============================
    // РЕГИСТРАЦИЯ
    // ===============================

    /**
     * РЕГИСТРАЦИЯ С BCRYPT ПАРОЛА ХЕШИРАНЕ
     *
     * @param registrationDto данните за регистрация
     * @return UserDto на новосъздадения потребител
     */
    public UserDto registerUser(UserRegistrationDto registrationDto) {
        System.out.println("👤 Registering new user: " + registrationDto.getUsername());

        // 1. Валидираме входните данни
        validateRegistrationData(registrationDto);

        // 2. Намираме служителя
        Employee employee = employeeRepository.findById(registrationDto.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Служителят не е намерен"));

        // 3. Проверяваме дали служителят вече има акаунт
        if (userRepository.existsByEmployee(employee)) {
            throw new RuntimeException("Този служител вече има потребителски акаунт");
        }

        // 4. Намираме ролята
        Role role = roleRepository.findByName(registrationDto.getRole())
                .orElseThrow(() -> new RuntimeException("Ролята '" + registrationDto.getRole() + "' не съществува"));

        // 5. ХЕШИРАМЕ ПАРОЛАТА С BCRYPT
        String hashedPassword = passwordEncoder.encode(registrationDto.getPassword());
        System.out.println("🔒 Password hashed successfully");

        // 6. Създаваме новия потребител
        User newUser = new User(
                registrationDto.getUsername().trim(),
                hashedPassword, // Запазваме хешираната парола
                employee
        );

        newUser.addRole(role);
        User savedUser = userRepository.save(newUser);

        System.out.println("✅ User registered successfully: " + savedUser.getUsername());
        return convertToDto(savedUser);
    }

    // ===============================
    // UTILITY МЕТОДИ ЗА ПАРОЛИ
    // ===============================

    /**
     * ХЕШИРА ПАРОЛА (ЗА РЪЧНО СЪЗДАВАНЕ В SQL)
     * Използвайте този метод за да получите хеширана парола за SQL INSERT
     *
     * @param rawPassword необработената парола
     * @return хешираната парола
     */
    public String hashPassword(String rawPassword) {
        String hashedPassword = passwordEncoder.encode(rawPassword);
        System.out.println("🔒 Password '" + rawPassword + "' hashed to: " + hashedPassword);
        return hashedPassword;
    }

    /**
     * ТЕСТВА ДАЛИ ПАРОЛА СЪВПАДА С ХЕШ
     * Полезно за debugging
     *
     * @param rawPassword необработената парола
     * @param hashedPassword хешираната парола
     * @return true ако съвпадат
     */
    public boolean testPassword(String rawPassword, String hashedPassword) {
        boolean matches = passwordEncoder.matches(rawPassword, hashedPassword);
        System.out.println("🧪 Password test: '" + rawPassword + "' matches hash: " + matches);
        return matches;
    }

    // ===============================
    // ДРУГИ МЕТОДИ
    // ===============================

    /**
     * Проверява дали потребител съществува
     */
    public boolean userExists(String username) {
        return userRepository.existsByUsername(username);
    }

    /**
     * Валидира данните за регистрация
     */
    private void validateRegistrationData(UserRegistrationDto registrationDto) {
        if (!registrationDto.isValid()) {
            throw new RuntimeException("Не всички задължителни полета са попълнени правилно");
        }

        if (userRepository.existsByUsername(registrationDto.getUsername())) {
            throw new RuntimeException("Потребителско име '" + registrationDto.getUsername() + "' вече съществува");
        }

        if (!registrationDto.isPasswordMatching()) {
            throw new RuntimeException("Паролите не съвпадат");
        }
    }

    /**
     * Получава всички потребители
     */
    public List<UserDto> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * Получава само активните потребители
     */
    public List<UserDto> getActiveUsers() {
        return userRepository.findByIsActiveTrue()
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * Получава потребител по ID
     */
    public UserDto getUserById(Long id) {
        Optional<User> userOpt = userRepository.findById(id);
        return userOpt.map(this::convertToDto).orElse(null);
    }

    /**
     * Деактивира потребител
     */
    public boolean deactivateUser(Long id) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setIsActive(false);
            userRepository.save(user);
            System.out.println("🚫 User deactivated: " + user.getUsername());
            return true;
        }
        return false;
    }

    // ===============================
    // CONVERSION МЕТОДИ
    // ===============================

    /**
     * Конвертира User entity към UserDto
     */
    private UserDto convertToDto(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());

        // Добавяме информация за служителя
        if (user.getEmployee() != null) {
            dto.setEmployeeId(user.getEmployee().getId());
            dto.setEmployeeName(user.getEmployee().getName());
        }

        // Добавяме ролите
        Set<String> roleNames = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toSet());
        dto.setRoles(roleNames);

        dto.setIsActive(user.getIsActive());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setLastLogin(user.getLastLogin());

        return dto;
    }
}