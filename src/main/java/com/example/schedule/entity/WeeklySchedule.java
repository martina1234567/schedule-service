package com.example.schedule.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Entity класът за седмичните планувани часове на служителите
 * Пази информация за всяка седмица колко часа е планиран да работи служителят
 * ПОПРАВЕН: Добавен default constructor за Hibernate
 */
@Entity
@Table(name = "weekly_schedule")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class WeeklySchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Връзка към служителя
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    @JsonIgnoreProperties("weeklySchedules") // Избягваме безкрайна рекурсия
    private Employee employee;

    // Начална дата на седмицата (винаги понеделник)
    @Column(name = "week_start_date", nullable = false)
    private LocalDate weekStartDate;

    // Номер на седмицата в годината (1-53)
    @Column(name = "week_number", nullable = false)
    private Integer weekNumber;

    // Година
    @Column(name = "year", nullable = false)
    private Integer year;

    // Планувани работни часове за седмицата (без почивките)
    @Column(name = "planned_hours", nullable = false, precision = 5, scale = 2)
    private BigDecimal plannedHours = BigDecimal.ZERO;

    // Действителни работни часове (може да се различават от планираните)
    @Column(name = "actual_work_hours", nullable = false, precision = 5, scale = 2)
    private BigDecimal actualWorkHours = BigDecimal.ZERO;

    // Общо часове почивки за седмицата
    @Column(name = "break_hours", nullable = false, precision = 5, scale = 2)
    private BigDecimal breakHours = BigDecimal.ZERO;

    // Дати за създаване и актуализиране
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // =====================================
    // КОНСТРУКТОРИ
    // =====================================

    /**
     * DEFAULT CONSTRUCTOR - ЗАДЪЛЖИТЕЛЕН ЗА HIBERNATE!
     * Hibernate изисква празен constructor за да може да създава instances
     */
    public WeeklySchedule() {
        // Инициализираме BigDecimal полетата с нулеви стойности
        this.plannedHours = BigDecimal.ZERO;
        this.actualWorkHours = BigDecimal.ZERO;
        this.breakHours = BigDecimal.ZERO;
    }

    /**
     * Конструктор с всички полета (използван от Lombok @AllArgsConstructor)
     * @param id - ID на записа
     * @param employee - служителят
     * @param weekStartDate - начална дата на седмицата
     * @param weekNumber - номер на седмицата
     * @param year - година
     * @param plannedHours - планувани часове
     * @param actualWorkHours - действителни работни часове
     * @param breakHours - часове почивки
     * @param createdAt - дата на създаване
     * @param updatedAt - дата на последна промяна
     */
    public WeeklySchedule(Long id, Employee employee, LocalDate weekStartDate,
                          Integer weekNumber, Integer year, BigDecimal plannedHours,
                          BigDecimal actualWorkHours, BigDecimal breakHours,
                          LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.employee = employee;
        this.weekStartDate = weekStartDate;
        this.weekNumber = weekNumber;
        this.year = year;
        this.plannedHours = plannedHours != null ? plannedHours : BigDecimal.ZERO;
        this.actualWorkHours = actualWorkHours != null ? actualWorkHours : BigDecimal.ZERO;
        this.breakHours = breakHours != null ? breakHours : BigDecimal.ZERO;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    /**
     * Конструктор с основните полета (най-често използван)
     * @param employee - служителят
     * @param weekStartDate - начална дата на седмицата (понеделник)
     * @param weekNumber - номер на седмицата в годината
     * @param year - година
     */
    public WeeklySchedule(Employee employee, LocalDate weekStartDate, Integer weekNumber, Integer year) {
        this.employee = employee;
        this.weekStartDate = weekStartDate;
        this.weekNumber = weekNumber;
        this.year = year;
        this.plannedHours = BigDecimal.ZERO;
        this.actualWorkHours = BigDecimal.ZERO;
        this.breakHours = BigDecimal.ZERO;
    }

    // =====================================
    // GETTERS - ЗАДЪЛЖИТЕЛНИ ЗА HIBERNATE
    // =====================================

    public Long getId() {
        return id;
    }

    public Employee getEmployee() {
        return employee;
    }

    public LocalDate getWeekStartDate() {
        return weekStartDate;
    }

    public Integer getWeekNumber() {
        return weekNumber;
    }

    public Integer getYear() {
        return year;
    }

    public BigDecimal getPlannedHours() {
        return plannedHours;
    }

    public BigDecimal getBreakHours() {
        return breakHours;
    }

    public BigDecimal getActualWorkHours() {
        return actualWorkHours;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    // =====================================
    // SETTERS - ЗАДЪЛЖИТЕЛНИ ЗА HIBERNATE
    // =====================================

    public void setId(Long id) {
        this.id = id;
    }

    public void setEmployee(Employee employee) {
        this.employee = employee;
    }

    public void setWeekStartDate(LocalDate weekStartDate) {
        this.weekStartDate = weekStartDate;
    }

    public void setWeekNumber(Integer weekNumber) {
        this.weekNumber = weekNumber;
    }

    public void setYear(Integer year) {
        this.year = year;
    }

    public void setPlannedHours(BigDecimal plannedHours) {
        this.plannedHours = plannedHours != null ? plannedHours : BigDecimal.ZERO;
    }

    public void setBreakHours(BigDecimal breakHours) {
        this.breakHours = breakHours != null ? breakHours : BigDecimal.ZERO;
    }

    public void setActualWorkHours(BigDecimal actualWorkHours) {
        this.actualWorkHours = actualWorkHours != null ? actualWorkHours : BigDecimal.ZERO;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    // =====================================
    // LIFECYCLE CALLBACKS
    // =====================================

    /**
     * Автоматично задава created_at при създаване
     */
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();

        // Уверяваме се че BigDecimal полетата не са null
        if (this.plannedHours == null) {
            this.plannedHours = BigDecimal.ZERO;
        }
        if (this.actualWorkHours == null) {
            this.actualWorkHours = BigDecimal.ZERO;
        }
        if (this.breakHours == null) {
            this.breakHours = BigDecimal.ZERO;
        }
    }

    /**
     * Автоматично обновява updated_at при промяна
     */
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();

        // Уверяваме се че BigDecimal полетата не са null
        if (this.plannedHours == null) {
            this.plannedHours = BigDecimal.ZERO;
        }
        if (this.actualWorkHours == null) {
            this.actualWorkHours = BigDecimal.ZERO;
        }
        if (this.breakHours == null) {
            this.breakHours = BigDecimal.ZERO;
        }
    }

    // =====================================
    // BUSINESS МЕТОДИ
    // =====================================

    /**
     * Добавя часове към планираните часове
     * @param hours - часовете за добавяне
     */
    public void addPlannedHours(BigDecimal hours) {
        if (hours != null && hours.compareTo(BigDecimal.ZERO) > 0) {
            this.plannedHours = this.plannedHours.add(hours);
        }
    }

    /**
     * Изважда часове от планираните часове
     * @param hours - часовете за изваждане
     */
    public void subtractPlannedHours(BigDecimal hours) {
        if (hours != null && hours.compareTo(BigDecimal.ZERO) > 0) {
            this.plannedHours = this.plannedHours.subtract(hours);
            // Не позволяваме отрицателни стойности
            if (this.plannedHours.compareTo(BigDecimal.ZERO) < 0) {
                this.plannedHours = BigDecimal.ZERO;
            }
        }
    }

    /**
     * Добавя часове почивка
     * @param hours - часовете почивка за добавяне
     */
    public void addBreakHours(BigDecimal hours) {
        if (hours != null && hours.compareTo(BigDecimal.ZERO) > 0) {
            this.breakHours = this.breakHours.add(hours);
        }
    }

    /**
     * Изважда часове почивка
     * @param hours - часовете почивка за изваждане
     */
    public void subtractBreakHours(BigDecimal hours) {
        if (hours != null && hours.compareTo(BigDecimal.ZERO) > 0) {
            this.breakHours = this.breakHours.subtract(hours);
            // Не позволяваме отрицателни стойности
            if (this.breakHours.compareTo(BigDecimal.ZERO) < 0) {
                this.breakHours = BigDecimal.ZERO;
            }
        }
    }

    /**
     * Пресмята общите работни часове включително почивките
     * @return общо часове (работни + почивки)
     */
    public BigDecimal getTotalHours() {
        return this.plannedHours.add(this.breakHours);
    }

    /**
     * Проверява дали записът е за текущата седмица
     * @return true ако е за текущата седмица
     */
    public boolean isCurrentWeek() {
        LocalDate now = LocalDate.now();
        LocalDate weekEnd = weekStartDate.plusDays(6); // неделя
        return !now.isBefore(weekStartDate) && !now.isAfter(weekEnd);
    }

    // =====================================
    // UTILITY МЕТОДИ
    // =====================================

    @Override
    public String toString() {
        return String.format("WeeklySchedule{id=%d, employee=%s, week=%d/%d, startDate=%s, plannedHours=%s}",
                id,
                employee != null ? employee.getName() : "Unknown",
                weekNumber,
                year,
                weekStartDate,
                plannedHours);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        WeeklySchedule that = (WeeklySchedule) o;

        if (id != null) {
            return id.equals(that.id);
        }

        // Ако няма id, сравняваме по employee, weekStartDate
        return employee != null && employee.equals(that.employee) &&
                weekStartDate != null && weekStartDate.equals(that.weekStartDate);
    }

    @Override
    public int hashCode() {
        if (id != null) {
            return id.hashCode();
        }

        int result = employee != null ? employee.hashCode() : 0;
        result = 31 * result + (weekStartDate != null ? weekStartDate.hashCode() : 0);
        return result;
    }
}