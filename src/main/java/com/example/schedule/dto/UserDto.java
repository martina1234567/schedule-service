package com.example.schedule.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.HashSet;

/**
 * DTO (DATA TRANSFER OBJECT) ЗА USER ENTITY
 * Използва се за прехвърляне на данни между frontend и backend
 * Не съдържа чувствителни данни като пароли
 *
 * @author Schedule Management System
 * @version 1.0
 */
public class UserDto {

    // ===============================
    // ПОЛЕТА НА DTO
    // ===============================

    /**
     * ID на потребителя
     */
    private Long id;

    /**
     * Потребителско име
     */
    @NotNull(message = "Username cannot be null")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    private String username;

    /**
     * ID на служителя към когото принадлежи акаунтът
     */
    @NotNull(message = "Employee ID cannot be null")
    private Long employeeId;

    /**
     * Име на служителя (за показване в UI)
     */
    private String employeeName;

    /**
     * Фамилия на служителя (за показване в UI)
     */
    private String employeeLastname;

    /**
     * Email на служителя (за показване в UI)
     */
    private String employeeEmail;

    /**
     * Роли на потребителя (admin, user)
     */
    private Set<String> roles = new HashSet<>();

    /**
     * Дали акаунтът е активен
     */
    private Boolean isActive;

    /**
     * Дата на създаване
     */
    private LocalDateTime createdAt;

    /**
     * Последен логин
     */
    private LocalDateTime lastLogin;

    // ===============================
    // КОНСТРУКТОРИ
    // ===============================

    /**
     * Празен конструктор
     */
    public UserDto() {
        // Празен конструктор
    }

    /**
     * Конструктор с основните полета
     * @param id ID на потребителя
     * @param username потребителското име
     * @param employeeId ID на служителя
     * @param employeeName името на служителя
     * @param employeeLastname фамилията на служителя
     * @param isActive дали е активен
     */
    public UserDto(Long id, String username, Long employeeId, String employeeName,
                   String employeeLastname, Boolean isActive) {
        this.id = id;
        this.username = username;
        this.employeeId = employeeId;
        this.employeeName = employeeName;
        this.employeeLastname = employeeLastname;
        this.isActive = isActive;
    }

    /**
     * Пълен конструктор
     */
    public UserDto(Long id, String username, Long employeeId, String employeeName,
                   String employeeLastname, String employeeEmail, Set<String> roles,
                   Boolean isActive, LocalDateTime createdAt, LocalDateTime lastLogin) {
        this.id = id;
        this.username = username;
        this.employeeId = employeeId;
        this.employeeName = employeeName;
        this.employeeLastname = employeeLastname;
        this.employeeEmail = employeeEmail;
        this.roles = roles != null ? roles : new HashSet<>();
        this.isActive = isActive;
        this.createdAt = createdAt;
        this.lastLogin = lastLogin;
    }

    // ===============================
    // GETTER И SETTER МЕТОДИ
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

    public String getEmployeeLastname() {
        return employeeLastname;
    }

    public void setEmployeeLastname(String employeeLastname) {
        this.employeeLastname = employeeLastname;
    }

    public String getEmployeeEmail() {
        return employeeEmail;
    }

    public void setEmployeeEmail(String employeeEmail) {
        this.employeeEmail = employeeEmail;
    }

    public Set<String> getRoles() {
        return roles;
    }

    public void setRoles(Set<String> roles) {
        this.roles = roles != null ? roles : new HashSet<>();
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

    public LocalDateTime getLastLogin() {
        return lastLogin;
    }

    public void setLastLogin(LocalDateTime lastLogin) {
        this.lastLogin = lastLogin;
    }

    // ===============================
    // UTILITY МЕТОДИ
    // ===============================

    /**
     * Получава пълното име на служителя
     * @return пълното име (име + фамилия)
     */
    public String getEmployeeFullName() {
        if (employeeName == null && employeeLastname == null) {
            return "Unknown Employee";
        }
        if (employeeLastname == null) {
            return employeeName;
        }
        if (employeeName == null) {
            return employeeLastname;
        }
        return employeeName + " " + employeeLastname;
    }

    /**
     * Добавя роля към множеството роли
     * @param role ролята за добавяне
     */
    public void addRole(String role) {
        if (this.roles == null) {
            this.roles = new HashSet<>();
        }
        this.roles.add(role);
    }

    /**
     * Проверява дали потребителят има определена роля
     * @param role ролята за проверка
     * @return true ако има тази роля
     */
    public boolean hasRole(String role) {
        return roles != null && roles.contains(role);
    }

    /**
     * Проверява дали потребителят е администратор
     * @return true ако е админ
     */
    public boolean isAdmin() {
        return hasRole("admin");
    }

    /**
     * Получава ролите като comma-separated string
     * @return string с роли разделени със запетая
     */
    public String getRolesAsString() {
        if (roles == null || roles.isEmpty()) {
            return "No roles";
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
                ", employeeId=" + employeeId +
                ", employeeName='" + employeeName + '\'' +
                ", employeeLastname='" + employeeLastname + '\'' +
                ", roles=" + roles +
                ", isActive=" + isActive +
                ", createdAt=" + createdAt +
                ", lastLogin=" + lastLogin +
                '}';
    }
}