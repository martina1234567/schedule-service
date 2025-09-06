package com.example.schedule.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * DTO ЗА РЕГИСТРАЦИЯ НА НОВИ ПОТРЕБИТЕЛИ
 * Използва се когато администратор създава нови потребителски акаунти
 * Съдържа всички необходими данни за създаване на User entity
 *
 * @author Schedule Management System
 * @version 1.0
 */
public class UserRegistrationDto {

    // ===============================
    // ПОЛЕТА ЗА РЕГИСТРАЦИЯ
    // ===============================

    /**
     * Потребителско име за новия акаунт
     * Трябва да е уникално в системата
     */
    @NotNull(message = "Потребителското име не може да бъде празно")
    @Size(min = 3, max = 50, message = "Потребителското име трябва да е между 3 и 50 символа")
    private String username;

    /**
     * Парола за новия акаунт
     * Ще се хеширва преди запазване в базата
     */
    @NotNull(message = "Паролата не може да бъде празна")
    @Size(min = 4, max = 50, message = "Паролата трябва да е между 4 и 50 символа")
    private String password;

    /**
     * Потвърждение на паролата
     * Трябва да съвпада с password полето
     */
    @NotNull(message = "Потвърждението на паролата не може да бъде празно")
    private String confirmPassword;

    /**
     * ID на служителя за когото се създава акаунтът
     * Избира се от dropdown с всички служители без акаунти
     */
    @NotNull(message = "Трябва да изберете служител")
    private Long employeeId;

    /**
     * Роля на новия потребител
     * По подразбиране ще бъде "user", но админът може да избере "admin"
     */
    private String role = "user";

    // ===============================
    // КОНСТРУКТОРИ
    // ===============================

    /**
     * Празен конструктор
     */
    public UserRegistrationDto() {
        // Празен конструктор
    }

    /**
     * Конструктор с основните полета
     * @param username потребителско име
     * @param password парола
     * @param confirmPassword потвърждение на парола
     * @param employeeId ID на служителя
     */
    public UserRegistrationDto(String username, String password, String confirmPassword, Long employeeId) {
        this.username = username;
        this.password = password;
        this.confirmPassword = confirmPassword;
        this.employeeId = employeeId;
        this.role = "user"; // По подразбиране
    }

    /**
     * Пълен конструктор
     * @param username потребителско име
     * @param password парола
     * @param confirmPassword потвърждение на парола
     * @param employeeId ID на служителя
     * @param role роля на потребителя
     */
    public UserRegistrationDto(String username, String password, String confirmPassword, Long employeeId, String role) {
        this.username = username;
        this.password = password;
        this.confirmPassword = confirmPassword;
        this.employeeId = employeeId;
        this.role = role != null ? role : "user";
    }

    // ===============================
    // GETTER И SETTER МЕТОДИ
    // ===============================

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getConfirmPassword() {
        return confirmPassword;
    }

    public void setConfirmPassword(String confirmPassword) {
        this.confirmPassword = confirmPassword;
    }

    public Long getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(Long employeeId) {
        this.employeeId = employeeId;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role != null ? role : "user";
    }

    // ===============================
    // ВАЛИДАЦИОННИ МЕТОДИ
    // ===============================

    /**
     * Проверява дали паролите съвпадат
     * @return true ако паролите са еднакви
     */
    public boolean isPasswordMatching() {
        if (password == null || confirmPassword == null) {
            return false;
        }
        return password.equals(confirmPassword);
    }

    /**
     * Проверява дали ролята е валидна
     * @return true ако ролята е admin или user
     */
    public boolean isValidRole() {
        return role != null && (role.equals("admin") || role.equals("user"));
    }

    /**
     * Проверява дали всички задължителни полета са попълнени
     * @return true ако всички полета са валидни
     */
    public boolean isValid() {
        return username != null && !username.trim().isEmpty() &&
                username.length() >= 3 && username.length() <= 50 &&
                password != null && !password.isEmpty() &&
                password.length() >= 4 && password.length() <= 50 &&
                confirmPassword != null && !confirmPassword.isEmpty() &&
                isPasswordMatching() &&
                employeeId != null &&
                isValidRole();
    }

    // ===============================
    // UTILITY МЕТОДИ
    // ===============================

    /**
     * Почиства whitespace от потребителското име
     */
    public void trimUsername() {
        if (username != null) {
            username = username.trim();
        }
    }

    /**
     * Проверява дали потребителя ще бъде админ
     * @return true ако ролята е admin
     */
    public boolean isAdminRole() {
        return "admin".equals(role);
    }

    /**
     * Задава роля на потребителя като admin
     */
    public void setAsAdmin() {
        this.role = "admin";
    }

    /**
     * Задава роля на потребителя като обикновен user
     */
    public void setAsUser() {
        this.role = "user";
    }

    // ===============================
    // TOSTRING (БЕЗ ПАРОЛИ ЗА СИГУРНОСТ)
    // ===============================

    @Override
    public String toString() {
        return "UserRegistrationDto{" +
                "username='" + username + '\'' +
                ", employeeId=" + employeeId +
                ", role='" + role + '\'' +
                ", passwordsMatch=" + isPasswordMatching() +
                '}';
    }
}