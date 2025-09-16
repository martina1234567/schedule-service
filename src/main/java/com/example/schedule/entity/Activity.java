package com.example.schedule.entity;

import jakarta.persistence.*;

/**
 * Entity класа за дейностите (activities) в приложението
 * Заменя хардкоднатите стойности от HTML-а
 */
@Entity
@Table(name = "activity")
public class Activity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Името на дейността (напр. "Cashier", "Bake off", и т.н.)
     */
    @Column(name = "name", nullable = false, unique = true, length = 100)
    private String name;

    /**
     * Описание на дейността (опционално)
     */
    @Column(name = "description", length = 255)
    private String description;

    /**
     * Дали дейността е активна/налична за избор
     */
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    /**
     * Ред за показване (за подреждане в списъка)
     */
    @Column(name = "display_order")
    private Integer displayOrder;

    // =====================================
    // КОНСТРУКТОРИ
    // =====================================

    /**
     * Default constructor - задължителен за Hibernate
     */
    public Activity() {}

    /**
     * Конструктор с основните полета
     * @param name името на дейността
     * @param description описание на дейността
     * @param isActive дали е активна
     * @param displayOrder ред за показване
     */
    public Activity(String name, String description, Boolean isActive, Integer displayOrder) {
        this.name = name;
        this.description = description;
        this.isActive = isActive != null ? isActive : true;
        this.displayOrder = displayOrder;
    }

    /**
     * Удобен конструктор само с име
     * @param name името на дейността
     */
    public Activity(String name) {
        this.name = name;
        this.isActive = true;
    }

    // =====================================
    // GETTERS И SETTERS
    // =====================================

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

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive != null ? isActive : true;
    }

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
    }

    // =====================================
    // UTILITY МЕТОДИ
    // =====================================

    @Override
    public String toString() {
        return "Activity{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", description='" + description + '\'' +
                ", isActive=" + isActive +
                ", displayOrder=" + displayOrder +
                '}';
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Activity)) return false;
        Activity activity = (Activity) o;
        return name != null ? name.equals(activity.name) : activity.name == null;
    }

    @Override
    public int hashCode() {
        return name != null ? name.hashCode() : 0;
    }
}