package com.example.schedule.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DATA TRANSFER OBJECT ЗА ЛОГИН ЗАЯВКИ
 *
 * Този DTO се използва за прехвърляне на данни от frontend към backend
 * при автентикация на потребители в системата.
 *
 * Съдържа само основните полета необходими за логин:
 * - Username
 * - Password
 *
 * @author Schedule Management System
 * @version 1.0
 */
public class LoginRequestDto {

    // ===============================
    // ПОЛЕТА НА DTO
    // ===============================

    /**
     * Потребителско име за логин
     * Трябва да съвпада с username в базата данни
     */
    @NotBlank(message = "Потребителското име е задължително")
    @Size(min = 1, max = 50, message = "Потребителското име трябва да бъде между 1 и 50 символа")
    private String username;

    /**
     * Парола за логин (сурова, ще се сравни с хешираната в базата)
     */
    @NotBlank(message = "Паролата е задължителна")
    @Size(min = 1, max = 255, message = "Паролата е твърде дълга")
    private String password;

    // ===============================
    // КОНСТРУКТОРИ
    // ===============================

    /**
     * Празен конструктор (задължителен за JSON deserialization)
     */
    public LoginRequestDto() {
        // Празен конструктор
    }

    /**
     * Конструктор с всички полета
     *
     * @param username потребителското име
     * @param password паролата
     */
    public LoginRequestDto(String username, String password) {
        this.username = username;
        this.password = password;
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

    // ===============================
    // ВАЛИДАЦИОННИ МЕТОДИ
    // ===============================

    /**
     * Проверява дали всички задължителни полета са попълнени
     * @return true ако username и password са валидни
     */
    public boolean isValid() {
        return username != null && !username.trim().isEmpty() &&
                password != null && !password.isEmpty();
    }

    /**
     * Почиства whitespace от потребителското име
     */
    public void trimFields() {
        if (username != null) {
            username = username.trim();
        }
    }

    // ===============================
    // UTILITY МЕТОДИ
    // ===============================

    /**
     * Създава копие на DTO-то за логване (без парола)
     * Използва се за безопасно логване на данните
     */
    public LoginRequestDto createSafeLogCopy() {
        LoginRequestDto safeCopy = new LoginRequestDto();
        safeCopy.username = this.username;
        // Паролата не се копира за сигурност
        return safeCopy;
    }

    // ===============================
    // TOSTRING (БЕЗ ПАРОЛА ЗА СИГУРНОСТ)
    // ===============================

    @Override
    public String toString() {
        return "LoginRequestDto{" +
                "username='" + username + '\'' +
                ", password='[HIDDEN]'" +
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

        LoginRequestDto that = (LoginRequestDto) o;

        return username != null ? username.equals(that.username) : that.username == null;
    }

    @Override
    public int hashCode() {
        return username != null ? username.hashCode() : 0;
    }
}