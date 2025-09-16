package com.example.schedule.exception;

import java.util.List;

/**
 * CUSTOM EXCEPTION ЗА ВАЛИДАЦИОННИ ГРЕШКИ
 * Тази exception се хвърля когато валидацията на работните часове не премине
 */
public class ValidationException extends RuntimeException {

    private List<String> errors;

    /**
     * Конструктор с един error
     * @param message - Съобщението за грешка
     */
    public ValidationException(String message) {
        super(message);
        this.errors = List.of(message);
    }

    /**
     * Конструктор с множество errors
     * @param errors - Списък с грешки
     */
    public ValidationException(List<String> errors) {
        super(errors.isEmpty() ? "Validation failed" : errors.get(0));
        this.errors = errors;
    }

    /**
     * Getter за всички грешки
     * @return List<String> - Списък с грешки
     */
    public List<String> getErrors() {
        return errors;
    }

    /**
     * Getter за първата грешка
     * @return String - Първата грешка
     */
    public String getFirstError() {
        return errors.isEmpty() ? "Validation failed" : errors.get(0);
    }
}