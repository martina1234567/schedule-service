package com.example.schedule.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entity класа за часови ставки на служителите
 * Позволява различни ставки за различни позиции/роли
 * Подобно на Activity entity структурата
 */
@Entity
@Table(name = "hourly_rate")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class HourlyRate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Име/описание на ставката (напр. "Standard Rate", "Weekend Rate", "Holiday Rate")
    @Column(name = "rate_name", nullable = false, unique = true, length = 100)
    private String rateName;

    // Дневни часове за тази ставка (4, 6, 8 часа)
    @Column(name = "daily_hours", nullable = false)
    private Integer dailyHours;

    // Дали тази ставка е активна
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    // Ред за показване в dropdown (по-ниски числа се показват първи)
    @Column(name = "display_order", nullable = false)
    private Integer displayOrder = 1;

    // Описание/бележки за ставката
    @Column(name = "description", length = 255)
    private String description;

    // Дати за създаване и актуализиране
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // =====================================
    // КОНСТРУКТОРИ
    // =====================================

    /**
     * DEFAULT CONSTRUCTOR - ЗАДЪЛЖИТЕЛЕН ЗА HIBERNATE
     */
    public HourlyRate() {}

    /**
     * Конструктор с основни данни
     */
    public HourlyRate(String rateName, Integer dailyHours) {
        this.rateName = rateName;
        this.dailyHours = dailyHours;
        this.isActive = true;
        this.displayOrder = 1;
    }

    /**
     * Пълен конструктор
     */
    public HourlyRate(String rateName, Integer dailyHours,
                      Boolean isActive, Integer displayOrder, String description) {
        this.rateName = rateName;
        this.dailyHours = dailyHours;
        this.isActive = isActive;
        this.displayOrder = displayOrder;
        this.description = description;
    }

    // =====================================
    // LIFECYCLE CALLBACKS
    // =====================================

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();

        if (this.isActive == null) {
            this.isActive = true;
        }

        if (this.displayOrder == null) {
            this.displayOrder = 1;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // =====================================
    // GETTERS AND SETTERS
    // =====================================

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getRateName() {
        return rateName;
    }

    public void setRateName(String rateName) {
        this.rateName = rateName;
    }

    public Integer getDailyHours() {
        return dailyHours;
    }

    public void setDailyHours(Integer dailyHours) {
        this.dailyHours = dailyHours;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
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

    // =====================================
    // UTILITY МЕТОДИ
    // =====================================

    @Override
    public String toString() {
        return "HourlyRate{" +
                "id=" + id +
                ", rateName='" + rateName + '\'' +
                ", dailyHours=" + dailyHours +
                ", isActive=" + isActive +
                ", displayOrder=" + displayOrder +
                ", description='" + description + '\'' +
                '}';
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        HourlyRate that = (HourlyRate) o;
        return id != null && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}