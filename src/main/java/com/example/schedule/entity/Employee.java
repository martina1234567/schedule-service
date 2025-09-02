package com.example.schedule.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

import java.util.List;

/**
 * Employee Entity клас
 * Почистен код БЕЗ автоматично генерирани getters/setters и Builder анотация
 * HourlyRate поле остава за вътрешна употреба, но не се показва в таблицата
 */
@Entity
@Table(name = "employee")
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "lastname")
    private String lastname;

    @Column(name = "email", nullable = false, unique = true)
    private String email;

    @Column(name = "position")
    private String position;

    // Връзка към HourlyRate entity (за вътрешна употреба)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hourly_rate_id", nullable = true)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private HourlyRate hourlyRate;

    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore // Избягваме безкрайна рекурсия
    private List<Event> events;

    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore // Избягваме рекурсия при седмичните графици
    private List<WeeklySchedule> weeklySchedules;

    // =====================================
    // КОНСТРУКТОРИ
    // =====================================

    /**
     * DEFAULT CONSTRUCTOR - ЗАДЪЛЖИТЕЛЕН ЗА HIBERNATE
     */
    public Employee() {}

    /**
     * Конструктор за създаване на служител БЕЗ HourlyRate
     */
    public Employee(String name, String lastname, String email, String position) {
        this.name = name;
        this.lastname = lastname;
        this.email = email;
        this.position = position;
        this.hourlyRate = null; // Няма часова ставка първоначално
    }

    /**
     * Конструктор с HourlyRate entity
     */
    public Employee(String name, String lastname, String email, String position, HourlyRate hourlyRate) {
        this.name = name;
        this.lastname = lastname;
        this.email = email;
        this.position = position;
        this.hourlyRate = hourlyRate;
    }

    /**
     * Пълен конструктор с ID
     */
    public Employee(Long id, String name, String lastname, String email, String position, HourlyRate hourlyRate) {
        this.id = id;
        this.name = name;
        this.lastname = lastname;
        this.email = email;
        this.position = position;
        this.hourlyRate = hourlyRate;
    }

    // =====================================
    // РЪЧНО НАПИСАНИ GETTERS AND SETTERS
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

    public String getLastname() {
        return lastname;
    }

    public void setLastname(String lastname) {
        this.lastname = lastname;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPosition() {
        return position;
    }

    public void setPosition(String position) {
        this.position = position;
    }

    public List<Event> getEvents() {
        return events;
    }

    public void setEvents(List<Event> events) {
        this.events = events;
    }

    public List<WeeklySchedule> getWeeklySchedules() {
        return weeklySchedules;
    }

    public void setWeeklySchedules(List<WeeklySchedule> weeklySchedules) {
        this.weeklySchedules = weeklySchedules;
    }

    // =====================================
    // HOURLY RATE МЕТОДИ
    // =====================================

    /**
     * Getter за HourlyRate entity (за вътрешна употреба)
     */
    public HourlyRate getHourlyRate() {
        return hourlyRate;
    }

    /**
     * Setter за HourlyRate entity
     */
    public void setHourlyRate(HourlyRate hourlyRate) {
        this.hourlyRate = hourlyRate;
    }

    // =====================================
    // ПОМОЩНИ МЕТОДИ ЗА СЪВМЕСТИМОСТ
    // =====================================

    /**
     * Връща името на ставката за логване/debugging
     */
    public String getHourlyRateName() {
        return hourlyRate != null ? hourlyRate.getRateName() : "Not Set";
    }

    /**
     * Връща ID на ставката
     */
    public Long getHourlyRateId() {
        return hourlyRate != null ? hourlyRate.getId() : null;
    }

    /**
     * Връща дневните часове за съвместимост със стария код
     * Използва се в WeeklyScheduleService за изчисления
     */
    public Integer getDailyHours() {
        return hourlyRate != null ? hourlyRate.getDailyHours() : 8; // default 8 часа
    }

    /**
     * Проверява дали служителят има зададена часова ставка
     */
    public boolean hasHourlyRate() {
        return hourlyRate != null;
    }

    // =====================================
    // UTILITY МЕТОДИ
    // =====================================

    @Override
    public String toString() {
        return "Employee{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", lastname='" + lastname + '\'' +
                ", email='" + email + '\'' +
                ", position='" + position + '\'' +
                ", hourlyRate=" + getHourlyRateName() +
                '}';
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Employee employee = (Employee) o;
        return id != null && id.equals(employee.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}