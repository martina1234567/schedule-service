package com.example.schedule.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.HashSet;

/**
 * ENTITY ЗА РОЛИ В СИСТЕМАТА
 * Този клас дефинира ролите на потребителите (admin, user)
 *
 * @author Schedule Management System
 * @version 1.0
 */
@Entity
@Table(name = "roles")
public class Role {

    // ===============================
    // ПОЛЕТА НА ENTITY
    // ===============================

    /**
     * Уникален идентификатор на ролята
     * Автоматично генериран първичен ключ
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    /**
     * Името на ролята (admin, user)
     * Трябва да е уникално в базата данни
     */
    @NotNull(message = "Role name cannot be null")
    @Size(min = 2, max = 50, message = "Role name must be between 2 and 50 characters")
    @Column(name = "name", unique = true, nullable = false, length = 50)
    private String name;

    /**
     * Описание на ролята (опционално)
     * Може да се използва за по-детайлно обяснение на ролята
     */
    @Size(max = 255, message = "Role description cannot exceed 255 characters")
    @Column(name = "description", length = 255)
    private String description;

    /**
     * Дата и час на създаване на ролята
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
     * Флаг дали ролята е активна
     * По подразбиране всички роли са активни
     */
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    /**
     * Връзка към потребителите с тази роля
     * Many-to-Many връзка с User entity
     * mappedBy указва, че User entity управлява връзката
     */
    @ManyToMany(mappedBy = "roles", fetch = FetchType.LAZY)
    private Set<User> users = new HashSet<>();

    // ===============================
    // КОНСТРУКТОРИ
    // ===============================

    /**
     * Празен конструктор (задължителен за JPA)
     */
    public Role() {
        // Празен конструктор за JPA
    }

    /**
     * Конструктор с основните полета
     * @param name името на ролята
     */
    public Role(String name) {
        this.name = name;
        this.isActive = true;
    }

    /**
     * Конструктор с всички полета
     * @param name името на ролята
     * @param description описанието на ролята
     */
    public Role(String name, String description) {
        this.name = name;
        this.description = description;
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

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
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

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public Set<User> getUsers() {
        return users;
    }

    public void setUsers(Set<User> users) {
        this.users = users;
    }

    // ===============================
    // UTILITY МЕТОДИ
    // ===============================

    /**
     * Добавя потребител към тази роля
     * @param user потребителя за добавяне
     */
    public void addUser(User user) {
        this.users.add(user);
        user.getRoles().add(this);
    }

    /**
     * Премахва потребител от тази роля
     * @param user потребителя за премахване
     */
    public void removeUser(User user) {
        this.users.remove(user);
        user.getRoles().remove(this);
    }

    // ===============================
    // EQUALS, HASHCODE И TOSTRING
    // ===============================

    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;

        Role role = (Role) obj;
        return name != null ? name.equals(role.name) : role.name == null;
    }

    @Override
    public int hashCode() {
        return name != null ? name.hashCode() : 0;
    }

    @Override
    public String toString() {
        return "Role{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", description='" + description + '\'' +
                ", isActive=" + isActive +
                ", createdAt=" + createdAt +
                '}';
    }
}