package com.example.schedule.controller;

import com.example.schedule.entity.Event;
import com.example.schedule.service.ValidationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.schedule.repository.EventRepository;

import java.util.List;
import java.util.stream.Collectors;


import java.util.Map;
import java.util.HashMap;

/**
 * VALIDATION CONTROLLER ЗА ТЕСТВАНЕ
 * Този контролер позволява тестване на валидацията без да се запазват данни в базата
 */
@RestController
@RequestMapping("/api/validate")
@CrossOrigin(origins = "http://localhost:3000")
public class ValidationController {

    @Autowired
    private ValidationService validationService;

    /**
     * ДОБАВИ ТОЗИ МЕТОД КЪМ ValidationController.java
     * Почиства събития с null start/end дати
     */

    @Autowired
    private EventRepository eventRepository;

    /**
     * ENDPOINT ЗА ПОЧИСТВАНЕ НА ПОВРЕДЕНИ ДАННИ
     * ВНИМАНИЕ: Използвай само ако си сигурен че искаш да изтриеш повредените данни!
     */
    @PostMapping("/event")
    public ResponseEntity<?> validateEvent(@RequestBody Event event) {
        System.out.println("🔍 Тестваме валидацията на събитие: " + event.getTitle());

        try {
            // НОВА ЛОГИКА: Определяме автоматично дали е update
            boolean isUpdate = (event.getId() != null);

            System.out.println("🔧 ValidationController DEBUG:");
            System.out.println("  - event.getId(): " + event.getId());
            System.out.println("  - Auto-determined isUpdate: " + isUpdate);

            // Извършваме валидацията
            ValidationService.ValidationResult result = validationService.validateEvent(event, isUpdate);

            // Създаваме response
            Map<String, Object> response = new HashMap<>();
            response.put("valid", result.isValid());
            response.put("errors", result.getErrors());
            response.put("isUpdate", isUpdate); // Добавяме за debugging

            if (result.isValid()) {
                response.put("message", "Validation passed successfully");
                System.out.println("✅ Валидацията премина успешно");
                return ResponseEntity.ok(response);
            } else {
                response.put("message", "Validation failed");
                System.out.println("❌ Валидацията не премина: " + result.getErrors());
                return ResponseEntity.badRequest().body(response);
            }

        } catch (Exception e) {
            System.out.println("❌ Грешка при валидация: " + e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("valid", false);
            errorResponse.put("error", "Validation error: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
}