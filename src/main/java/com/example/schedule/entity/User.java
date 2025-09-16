package com.example.schedule.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.HashSet;

/**
 * ENTITY ЗА ПОТРЕБИТЕЛИ В СИСТЕМАТА
 * Този клас дефинира потребителите които могат да влизат в системата
 * Всеки User е свързан с Employee и има роли (admin, user)
 *
 * @author Schedule Management System
 * @version 1.0
 */
@Entity
@Table(name = "users")
public class User {

    // ===============================
    // ПОЛЕТА НА ENTITY
    // ===============================

    /**
     * Уникален идентификатор на потребителя
     * Автоматично генериран първичен ключ
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    /**
     * Потребителско име за логин
     * Трябва да е уникално в базата данни
     */
    @NotNull(message = "Username cannot be null")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    @Column(name = "username", unique = true, nullable = false, length = 50)
    private String username;

    /**
     * Парола за логин (ще се хеширва)
     * В реална система трябва да се хешира с BCrypt или подобен алгоритъм
     */
    @NotNull(message = "Password cannot be null")
    @Size(min = 4, max = 255, message = "Password must be between 4 and 255 characters")
    @Column(name = "password", nullable = false, length = 255)
    private String password;

    /**
     * Връзка към служителя
     * Many-to-One връзка - един служител може да има само един потребителски акаунт
     * Но един потребителски акаунт принадлежи на точно един служител
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    /**
     * Роли на потребителя (admin, user)
     * Many-to-Many връзка с Role entity
     * Един потребител може да има множество роли
     * Една роля може да се присвоява на множество потребители
     */
    @ManyToMany(fetch = FetchType.EAGER, cascade = CascadeType.MERGE)
    @JoinTable(
            name = "user_roles",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<Role> roles = new HashSet<>();

    /**
     * Флаг дали потребителският акаунт е активен
     * Деактивирани потребители не могат да влизат в системата
     */
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    /**
     * Дата и час на създаване на потребителя
     * Автоматично се попълва при създаване на записа
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Дата и час на последна актуализация
     * Автоматично се обновява при всяка промяна
     */
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * Дата и час на последния логин
     * Обновява се всеки път когато потребителят влиза в системата
     */
    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    // ===============================
    // КОНСТРУКТОРИ
    // ===============================

    /**
     * Празен конструктор (задължителен за JPA)
     */
    public User() {
        // Празен конструктор за JPA
    }

    /**
     * Конструктор с основните полета
     * @param username потребителското име
     * @param password паролата (ще се хешира)
     * @param employee служителя към когото принадлежи акаунтът
     */
    public User(String username, String password, Employee employee) {
        this.username = username;
        this.password = password;
        this.employee = employee;
        this.isActive = true;
    }

    // ===============================
    // JPA LIFECYCLE CALLBACKS
    // ===============================

    /**
     * Извиква се преди persist операция
     * Настройва created_at и updated_at полетата
     */
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();

        // Ако isActive не е зададено, настрой го на true
        if (this.isActive == null) {
            this.isActive = true;
        }
    }

    /**
     * Извиква се преди update операция
     * Обновява updated_at полето
     */
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
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

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Employee getEmployee() {
        return employee;
    }

    public void setEmployee(Employee employee) {
        this.employee = employee;
    }

    public Set<Role> getRoles() {
        return roles;
    }

    public void setRoles(Set<Role> roles) {
        this.roles = roles;
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

    // ===============================
    // UTILITY МЕТОДИ ЗА РОЛИ
    // ===============================

    /**
     * Добавя роля към потребителя
     * @param role ролята за добавяне
     */
    public void addRole(Role role) {
        this.roles.add(role);
        role.getUsers().add(this);
    }

    /**
     * Премахва роля от потребителя
     * @param role ролята за премахване
     */
    public void removeRole(Role role) {
        this.roles.remove(role);
        role.getUsers().remove(this);
    }

    /**
     * Проверява дали потребителят има определена роля
     * @param roleName името на ролята за проверка
     * @return true ако потребителят има тази роля
     */
    public boolean hasRole(String roleName) {
        return roles.stream()
                .anyMatch(role -> role.getName().equalsIgnoreCase(roleName));
    }

    /**
     * Проверява дали потребителят е админ
     * @return true ако потребителят има admin роля
     */
    public boolean isAdmin() {
        return hasRole("admin");
    }

    /**
     * Обновява последния логин час
     */
    public void updateLastLogin() {
        this.lastLogin = LocalDateTime.now();
    }

    // ===============================
    // EQUALS, HASHCODE И TOSTRING
    // ===============================

    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;

        User user = (User) obj;
        return username != null ? username.equals(user.username) : user.username == null;
    }

    @Override
    public int hashCode() {
        return username != null ? username.hashCode() : 0;
    }

    @Override
    public String toString() {
        return "User{" +
                "id=" + id +
                ", username='" + username + '\'' +
                ", employee=" + (employee != null ? employee.getName() : "null") +
                ", roles=" + roles.size() + " roles" +
                ", isActive=" + isActive +
                ", createdAt=" + createdAt +
                ", lastLogin=" + lastLogin +
                '}';
    }
}