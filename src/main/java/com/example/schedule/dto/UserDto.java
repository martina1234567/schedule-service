package com.example.schedule.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DATA TRANSFER OBJECT ЗА ПОТРЕБИТЕЛСКА ИНФОРМАЦИЯ
 *
 * Този DTO се използва за прехвърляне на потребителски данни от backend към frontend.
 * Съдържа всички публични данни за потребителя, но БЕЗ паролата за сигурност.
 *
 * Използва се при:
 * - Връщане на резултат от успешна регистрация
 * - Връщане на резултат от успешен логин
 * - Показване на списъци с потребители
 * - Показване на профилна информация
 *
 * @author Schedule Management System
 * @version 1.0
 */
public class UserDto {

    // ===============================
    // ПОЛЕТА НА DTO
    // ===============================

    /**
     * Уникален идентификатор на потребителя
     */
    private Long id;

    /**
     * Потребителско име за логин
     */
    private String username;

    /**
     * Флаг дали потребителският акаунт е активен
     */
    private Boolean isActive;

    /**
     * Дата и час на създаване на потребителя
     */
    private LocalDateTime createdAt;

    /**
     * Дата и час на последна актуализация
     */
    private LocalDateTime updatedAt;

    /**
     * Дата и час на последния логин
     */
    private LocalDateTime lastLogin;

    /**
     * ID на служителя към когото принадлежи акаунтът
     */
    private Long employeeId;

    /**
     * Име на служителя (firstName + lastName)
     */
    private String employeeName;

    /**
     * Списък с роли на потребителя (admin, user, etc.)
     */
    private List<String> roles;

    // ===============================
    // КОНСТРУКТОРИ
    // ===============================

    /**
     * Празен конструктор (задължителен за JSON serialization)
     */
    public UserDto() {
        // Празен конструктор
    }

    /**
     * Конструктор с основните полета
     *
     * @param id ID на потребителя
     * @param username потребителското име
     * @param isActive дали е активен
     * @param employeeId ID на служителя
     * @param employeeName име на служителя
     */
    public UserDto(Long id, String username, Boolean isActive, Long employeeId, String employeeName) {
        this.id = id;
        this.username = username;
        this.isActive = isActive;
        this.employeeId = employeeId;
        this.employeeName = employeeName;
    }

    // ===============================
    // GETTERS AND SETTERS
    // ===============================

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public LocalDateTime getLastLogin() {
        return lastLogin;
    }

    public void setLastLogin(LocalDateTime lastLogin) {
        this.lastLogin = lastLogin;
    }

    public Long getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(Long employeeId) {
        this.employeeId = employeeId;
    }

    public String getEmployeeName() {
        return employeeName;
    }

    public void setEmployeeName(String employeeName) {
        this.employeeName = employeeName;
    }

    public List<String> getRoles() {
        return roles;
    }

    public void setRoles(List<String> roles) {
        this.roles = roles;
    }

    // ===============================
    // БИЗНЕС ЛОГИКА МЕТОДИ
    // ===============================

    /**
     * Проверява дали потребителят е администратор
     * @return true ако има роля "ADMIN"
     */
    public boolean isAdmin() {
        return roles != null && roles.contains("ADMIN");
    }

    /**
     * Проверява дали потребителят е обикновен user
     * @return true ако има роля "USER"
     */
    public boolean isUser() {
        return roles != null && roles.contains("USER");
    }

    /**
     * Проверява дали потребителят е влизал някога в системата
     * @return true ако lastLogin не е null
     */
    public boolean hasEverLoggedIn() {
        return lastLogin != null;
    }

    /**
     * Проверява дали потребителят е активен
     * @return true ако isActive е true
     */
    public boolean isActiveUser() {
        return isActive != null && isActive;
    }

    /**
     * Получава главната роля на потребителя
     * @return първата роля от списъка или "UNKNOWN" ако няма роли
     */
    public String getPrimaryRole() {
        if (roles == null || roles.isEmpty()) {
            return "UNKNOWN";
        }
        return roles.get(0);
    }

    /**
     * Получава форматирано име за показване
     * @return employeeName ако е зададено, иначе username
     */
    public String getDisplayName() {
        return employeeName != null && !employeeName.trim().isEmpty() ?
                employeeName : username;
    }

    // ===============================
    // UTILITY МЕТОДИ
    // ===============================

    /**
     * Създава кратко описание на потребителя за логване
     */
    public String getShortDescription() {
        return String.format("User[id=%d, username=%s, active=%s, role=%s]",
                id, username, isActive, getPrimaryRole());
    }

    /**
     * Проверява дали потребителят има специфична роля
     * @param roleName име на ролята за проверка
     * @return true ако има тази роля
     */
    public boolean hasRole(String roleName) {
        return roles != null && roles.contains(roleName.toUpperCase());
    }

    /**
     * Добавя роля към потребителя
     * @param roleName име на ролята
     */
    public void addRole(String roleName) {
        if (roles == null) {
            roles = new java.util.ArrayList<>();
        }
        String upperRoleName = roleName.toUpperCase();
        if (!roles.contains(upperRoleName)) {
            roles.add(upperRoleName);
        }
    }

    /**
     * Премахва роля от потребителя
     * @param roleName име на ролята
     */
    public void removeRole(String roleName) {
        if (roles != null) {
            roles.remove(roleName.toUpperCase());
        }
    }

    /**
     * Получава броя на дните от последния логин
     * @return броя дни или -1 ако никога не е влизал
     */
    public long getDaysSinceLastLogin() {
        if (lastLogin == null) {
            return -1;
        }
        return java.time.temporal.ChronoUnit.DAYS.between(lastLogin.toLocalDate(),
                LocalDateTime.now().toLocalDate());
    }

    /**
     * Получава броя на дните от създаването на акаунта
     * @return броя дни или 0 ако createdAt е null
     */
    public long getDaysSinceCreation() {
        if (createdAt == null) {
            return 0;
        }
        return java.time.temporal.ChronoUnit.DAYS.between(createdAt.toLocalDate(),
                LocalDateTime.now().toLocalDate());
    }

    // ===============================
    // FORMATTING МЕТОДИ
    // ===============================

    /**
     * Форматира датата на създаване за показване
     * @return форматирана дата или "Неизвестна"
     */
    public String getFormattedCreatedAt() {
        if (createdAt == null) {
            return "Неизвестна";
        }
        return createdAt.format(java.time.format.DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm"));
    }

    /**
     * Форматира датата на последен логин за показване
     * @return форматирана дата или "Никога"
     */
    public String getFormattedLastLogin() {
        if (lastLogin == null) {
            return "Никога";
        }
        return lastLogin.format(java.time.format.DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm"));
    }

    /**
     * Форматира датата на последна актуализация за показване
     * @return форматирана дата или "Неизвестна"
     */
    public String getFormattedUpdatedAt() {
        if (updatedAt == null) {
            return "Неизвестна";
        }
        return updatedAt.format(java.time.format.DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm"));
    }

    /**
     * Получава статуса на потребителя като текст
     * @return "Активен", "Неактивен" или "Неизвестен"
     */
    public String getStatusText() {
        if (isActive == null) {
            return "Неизвестен";
        }
        return isActive ? "Активен" : "Неактивен";
    }

    /**
     * Получава всички роли като един стринг
     * @return роли разделени със запетая или "Няма роли"
     */
    public String getRolesAsString() {
        if (roles == null || roles.isEmpty()) {
            return "Няма роли";
        }
        return String.join(", ", roles);
    }

    // ===============================
    // TOSTRING
    // ===============================

    @Override
    public String toString() {
        return "UserDto{" +
                "id=" + id +
                ", username='" + username + '\'' +
                ", isActive=" + isActive +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                ", lastLogin=" + lastLogin +
                ", employeeId=" + employeeId +
                ", employeeName='" + employeeName + '\'' +
                ", roles=" + roles +
                '}';
    }

    // ===============================
    // EQUALS AND HASHCODE
    // ===============================

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        UserDto userDto = (UserDto) o;

        if (id != null ? !id.equals(userDto.id) : userDto.id != null) return false;
        return username != null ? username.equals(userDto.username) : userDto.username == null;
    }

    @Override
    public int hashCode() {
        int result = id != null ? id.hashCode() : 0;
        result = 31 * result + (username != null ? username.hashCode() : 0);
        return result;
    }

    // ===============================
    // BUILDER PATTERN (OPTIONAL)
    // ===============================

    /**
     * Builder pattern за по-лесно създаване на UserDto обекти
     */
    public static class Builder {
        private UserDto userDto;

        public Builder() {
            this.userDto = new UserDto();
        }

        public Builder id(Long id) {
            userDto.id = id;
            return this;
        }

        public Builder username(String username) {
            userDto.username = username;
            return this;
        }

        public Builder isActive(Boolean isActive) {
            userDto.isActive = isActive;
            return this;
        }

        public Builder createdAt(LocalDateTime createdAt) {
            userDto.createdAt = createdAt;
            return this;
        }

        public Builder updatedAt(LocalDateTime updatedAt) {
            userDto.updatedAt = updatedAt;
            return this;
        }

        public Builder lastLogin(LocalDateTime lastLogin) {
            userDto.lastLogin = lastLogin;
            return this;
        }

        public Builder employeeId(Long employeeId) {
            userDto.employeeId = employeeId;
            return this;
        }

        public Builder employeeName(String employeeName) {
            userDto.employeeName = employeeName;
            return this;
        }

        public Builder roles(List<String> roles) {
            userDto.roles = roles;
            return this;
        }

        public UserDto build() {
            return userDto;
        }
    }

    /**
     * Статичен метод за започване на builder pattern
     * @return нов Builder обект
     */
    public static Builder builder() {
        return new Builder();
    }
}