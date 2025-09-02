package com.example.schedule.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * DTO клас за Employee без hourlyRate поле
 * Премахнахме hourlyRate защото не искаме да показваме заплатата в таблицата
 */
public class EmployeeDto {
    private Long id;

    @NotBlank
    private String name;

    private String lastname;

    @Email
    @NotBlank
    private String email;

    private String position;

    // =====================================
    // КОНСТРУКТОРИ
    // =====================================

    /**
     * DEFAULT CONSTRUCTOR
     */
    public EmployeeDto() {}

    /**
     * Конструктор с всички полета (БЕЗ hourlyRate)
     */
    public EmployeeDto(Long id, String name, String lastname, String email, String position) {
        this.id = id;
        this.name = name;
        this.lastname = lastname;
        this.email = email;
        this.position = position;
    }

    // =====================================
    // GETTERS AND SETTERS (РЪЧНО НАПИСАНИ)
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

    // =====================================
    // UTILITY МЕТОДИ
    // =====================================

    @Override
    public String toString() {
        return "EmployeeDto{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", lastname='" + lastname + '\'' +
                ", email='" + email + '\'' +
                ", position='" + position + '\'' +
                '}';
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        EmployeeDto that = (EmployeeDto) o;
        return id != null && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}