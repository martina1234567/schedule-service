package com.example.schedule.dto;

import jakarta.validation.constraints.*;
import java.util.regex.Pattern;

/**
 * DATA TRANSFER OBJECT ЗА РЕГИСТРАЦИЯ НА ПОТРЕБИТЕЛИ
 *
 * Този DTO се използва за прехвърляне на данни от frontend към backend
 * при създаване на нови потребителски акаунти в системата.
 *
 * Включва всички необходими валидации за създаване на сигурни потребителски акаунти:
 * - Username с поне 7 символа, главна буква и специален знак
 * - Парола с минимум 8 символа
 * - Потвърждение на парола
 * - Избор на служител от базата данни
 * - Задаване на роля (admin/user)
 *
 * @author Schedule Management System
 * @version 2.0
 */
public class UserRegistrationDto {

    // ===============================
    // КОНСТАНТИ ЗА ВАЛИДАЦИЯ
    // ===============================

    /**
     * Regex pattern за проверка на специални символи в username
     * Позволени специални символи: !@#$%^&*()_+-=[]{}|;':\",./<>?
     */
    private static final String SPECIAL_CHARS_PATTERN = "[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?]";

    /**
     * Regex pattern за проверка на главни букви
     */
    private static final String UPPERCASE_PATTERN = "[A-Z]";

    // ===============================
    // ПОЛЕТА НА DTO
    // ===============================

    /**
     * Потребителско име за логин
     * Изисквания:
     * - Минимум 7 символа
     * - Максимум 50 символа
     * - Поне една главна буква
     * - Поне един специален знак
     * - Не може да бъде null или празно
     */
    @NotBlank(message = "Потребителското име е задължително")
    @Size(min = 7, max = 50, message = "Потребителското име трябва да бъде между 7 и 50 символа")
    private String username;

    /**
     * Парола за логин
     * Изисквания:
     * - Минимум 8 символа
     * - Максимум 255 символа (за да има място за хеширането)
     * - Не може да бъде null или празна
     */
    @NotBlank(message = "Паролата е задължителна")
    @Size(min = 8, max = 255, message = "Паролата трябва да бъде между 8 и 255 символа")
    private String password;

    /**
     * Потвърждение на паролата
     * Трябва да съвпада точно с паролата
     */
    @NotBlank(message = "Потвърждението на паролата е задължително")
    private String confirmPassword;

    /**
     * ID на служителя за когото се създава акаунтът
     * Трябва да съществува в таблицата employees
     */
    @NotNull(message = "Служителят е задължителен")
    @Positive(message = "ID на служителя трябва да бъде положително число")
    private Long employeeId;

    /**
     * Роля на потребителя в системата
     * Възможни стойности: "admin", "user"
     */
    @NotBlank(message = "Ролята е задължителна")
    @jakarta.validation.constraints.Pattern(
            regexp = "^(admin|user)$",
            message = "Ролята трябва да бъде 'admin' или 'user'"
    )
    private String role;


    // ===============================
    // КОНСТРУКТОРИ
    // ===============================

    /**
     * Празен конструктор (задължителен за JSON deserialization)
     */
    public UserRegistrationDto() {
        // Празен конструктор
    }

    /**
     * Конструктор с всички полета
     *
     * @param username потребителското име
     * @param password паролата
     * @param confirmPassword потвърждението на паролата
     * @param employeeId ID на служителя
     * @param role ролята на потребителя
     */
    public UserRegistrationDto(String username, String password, String confirmPassword,
                               Long employeeId, String role) {
        this.username = username;
        this.password = password;
        this.confirmPassword = confirmPassword;
        this.employeeId = employeeId;
        this.role = role;
    }

    // ===============================
    // GETTERS AND SETTERS
    // ===============================

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username != null ? username.trim() : null;
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
        this.role = role;
    }

    // ===============================
    // БИЗНЕС ЛОГИКА И ВАЛИДАЦИЯ
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
     * Проверява дали потребителското име отговаря на изискванията
     * - Поне 7 символа
     * - Поне една главна буква
     * - Поне един специален знак
     *
     * @return true ако username е валиден
     */
    public boolean isUsernameValid() {
        if (username == null || username.trim().isEmpty()) {
            return false;
        }

        String trimmedUsername = username.trim();

        // Проверка за дължина
        if (trimmedUsername.length() < 7 || trimmedUsername.length() > 50) {
            return false;
        }

        // Проверка за поне една главна буква
        if (!Pattern.compile(UPPERCASE_PATTERN).matcher(trimmedUsername).find()) {
            return false;
        }

        // Проверка за поне един специален знак
        if (!Pattern.compile(SPECIAL_CHARS_PATTERN).matcher(trimmedUsername).find()) {
            return false;
        }

        return true;
    }

    /**
     * Проверява дали ролята е валидна
     * @return true ако ролята е admin или user
     */
    public boolean isValidRole() {
        return role != null && (role.equals("admin") || role.equals("user"));
    }

    /**
     * Проверява дали всички задължителни полета са попълнени и валидни
     * @return true ако всички полета са валидни
     */
    public boolean isValid() {
        return isUsernameValid() &&
                password != null && password.length() >= 8 && password.length() <= 255 &&
                isPasswordMatching() &&
                employeeId != null && employeeId > 0 &&
                isValidRole();
    }

    /**
     * Връща подробно съобщение за грешки във валидацията
     * @return String с описание на грешките или null ако няма грешки
     */
    public String getValidationErrors() {
        StringBuilder errors = new StringBuilder();

        if (!isUsernameValid()) {
            errors.append("Потребителското име трябва да съдържа поне 7 символа, поне една главна буква и поне един специален знак. ");
        }

        if (password == null || password.length() < 8) {
            errors.append("Паролата трябва да съдържа поне 8 символа. ");
        }

        if (password != null && password.length() > 255) {
            errors.append("Паролата е прекалено дълга. ");
        }

        if (!isPasswordMatching()) {
            errors.append("Паролите не съвпадат. ");
        }

        if (employeeId == null || employeeId <= 0) {
            errors.append("Трябва да изберете валиден служител. ");
        }

        if (!isValidRole()) {
            errors.append("Трябва да изберете валидна роля (admin или user). ");
        }

        return errors.length() > 0 ? errors.toString().trim() : null;
    }

    // ===============================
    // UTILITY МЕТОДИ
    // ===============================

    /**
     * Почиства whitespace от потребителското име
     */
    public void trimFields() {
        if (username != null) {
            username = username.trim();
        }
        if (role != null) {
            role = role.trim().toLowerCase();
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

    /**
     * Създава копие на DTO-то за логване (без пароли)
     * Използва се за безопасно логване на данните
     */
    public UserRegistrationDto createSafeLogCopy() {
        UserRegistrationDto safeCopy = new UserRegistrationDto();
        safeCopy.username = this.username;
        safeCopy.employeeId = this.employeeId;
        safeCopy.role = this.role;
        // Паролите не се копират за сигурност
        return safeCopy;
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
                ", usernameValid=" + isUsernameValid() +
                ", isValid=" + isValid() +
                '}';
    }

    // ===============================
    // EQUALS AND HASHCODE
    // ===============================

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        UserRegistrationDto that = (UserRegistrationDto) o;

        if (username != null ? !username.equals(that.username) : that.username != null) return false;
        if (employeeId != null ? !employeeId.equals(that.employeeId) : that.employeeId != null) return false;
        return role != null ? role.equals(that.role) : that.role == null;
    }

    @Override
    public int hashCode() {
        int result = username != null ? username.hashCode() : 0;
        result = 31 * result + (employeeId != null ? employeeId.hashCode() : 0);
        result = 31 * result + (role != null ? role.hashCode() : 0);
        return result;
    }
}