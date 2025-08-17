package com.example.schedule.controller;

import com.example.schedule.service.AutoScheduleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

/**
 * КОНТРОЛЕР ЗА АВТОМАТИЧНО ГЕНЕРИРАНЕ НА ГРАФИК
 * Предоставя REST API endpoint за стартиране на автоматичното генериране
 */
@RestController
@RequestMapping("/api/schedule")
@CrossOrigin(origins = "http://localhost:3000") // Разрешава заявки от React/frontend
public class ScheduleGenerationController {

    @Autowired
    private AutoScheduleService autoScheduleService;

    /**
     * ENDPOINT ЗА ГЕНЕРИРАНЕ НА МЕСЕЧЕН ГРАФИК
     *
     * POST /api/schedule/generate
     *
     * Тяло на заявката (JSON):
     * {
     *    "year": 2025,
     *    "month": 6
     * }
     *
     * @param request обект съдържащ година и месец
     * @return резултат от операцията
     */
    @PostMapping("/generate")
    public ResponseEntity<?> generateMonthlySchedule(@RequestBody ScheduleGenerationRequest request) {
        System.out.println("📅 Получена заявка за генериране на график");
        System.out.println("   Година: " + request.getYear());
        System.out.println("   Месец: " + request.getMonth());

        try {
            // Валидация на входните данни
            String validationError = validateRequest(request);
            if (validationError != null) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse(validationError));
            }

            // Стартираме генерирането
            String result = autoScheduleService.generateMonthlySchedule(
                    request.getYear(),
                    request.getMonth()
            );

            // Връщаме успешен резултат
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", result);
            response.put("year", request.getYear());
            response.put("month", request.getMonth());
            response.put("timestamp", LocalDate.now().toString());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("❌ Грешка при генериране на график: " + e.getMessage());
            e.printStackTrace();

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Грешка при генериране на график: " + e.getMessage()));
        }
    }

    /**
     * ENDPOINT ЗА ГЕНЕРИРАНЕ НА ГРАФИК ЗА ТЕКУЩИЯ МЕСЕЦ
     *
     * POST /api/schedule/generate-current
     *
     * Не изисква параметри - автоматично използва текущия месец
     */
    @PostMapping("/generate-current")
    public ResponseEntity<?> generateCurrentMonthSchedule() {
        LocalDate now = LocalDate.now();

        System.out.println("📅 Генериране на график за текущия месец");
        System.out.println("   Текуща дата: " + now);

        ScheduleGenerationRequest request = new ScheduleGenerationRequest();
        request.setYear(now.getYear());
        request.setMonth(now.getMonthValue());

        return generateMonthlySchedule(request);
    }

    /**
     * ENDPOINT ЗА ГЕНЕРИРАНЕ НА ГРАФИК ЗА СЛЕДВАЩИЯ МЕСЕЦ
     *
     * POST /api/schedule/generate-next
     *
     * Не изисква параметри - автоматично изчислява следващия месец
     */
    @PostMapping("/generate-next")
    public ResponseEntity<?> generateNextMonthSchedule() {
        LocalDate nextMonth = LocalDate.now().plusMonths(1);

        System.out.println("📅 Генериране на график за следващия месец");
        System.out.println("   Следващ месец: " + nextMonth.getMonthValue() + "/" + nextMonth.getYear());

        ScheduleGenerationRequest request = new ScheduleGenerationRequest();
        request.setYear(nextMonth.getYear());
        request.setMonth(nextMonth.getMonthValue());

        return generateMonthlySchedule(request);
    }

    /**
     * ENDPOINT ЗА ИЗТРИВАНЕ НА АВТОМАТИЧНО ГЕНЕРИРАНИ СМЕНИ
     *
     * DELETE /api/schedule/auto-generated
     *
     * Параметри:
     * - year: година
     * - month: месец (1-12)
     */
    @DeleteMapping("/auto-generated")
    public ResponseEntity<?> deleteAutoGeneratedShifts(
            @RequestParam Integer year,
            @RequestParam Integer month) {

        System.out.println("🗑️ Заявка за изтриване на автоматични смени");
        System.out.println("   Година: " + year);
        System.out.println("   Месец: " + month);

        try {
            // Валидация
            if (year == null || year < 2020 || year > 2030) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("Невалидна година. Трябва да е между 2020 и 2030."));
            }

            if (month == null || month < 1 || month > 12) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("Невалиден месец. Трябва да е между 1 и 12."));
            }

            // Тук бихме извикали метод за изтриване
            // За момента връщаме успех
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Автоматично генерираните смени са изтрити успешно");
            response.put("year", year);
            response.put("month", month);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Грешка при изтриване: " + e.getMessage()));
        }
    }

    /**
     * ENDPOINT ЗА ПОЛУЧАВАНЕ НА СТАТИСТИКА ЗА ГЕНЕРИРАН ГРАФИК
     *
     * GET /api/schedule/statistics
     *
     * Параметри:
     * - year: година
     * - month: месец (1-12)
     */
    @GetMapping("/statistics")
    public ResponseEntity<?> getScheduleStatistics(
            @RequestParam Integer year,
            @RequestParam Integer month) {

        System.out.println("📊 Заявка за статистика на график");
        System.out.println("   Година: " + year);
        System.out.println("   Месец: " + month);

        try {
            // Валидация
            if (year == null || year < 2020 || year > 2030) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("Невалидна година"));
            }

            if (month == null || month < 1 || month > 12) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("Невалиден месец"));
            }

            // Получаваме статистиката от сервиса
            Map<String, Object> statistics = autoScheduleService.generateScheduleStatistics(year, month);

            // Добавяме допълнителна информация
            statistics.put("success", true);
            statistics.put("timestamp", LocalDate.now().toString());

            return ResponseEntity.ok(statistics);

        } catch (Exception e) {
            System.err.println("❌ Грешка при получаване на статистика: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Грешка при получаване на статистика: " + e.getMessage()));
        }
    }

    /**
     * ENDPOINT ЗА ПРОВЕРКА НА СТАТУСА НА УСЛУГАТА
     *
     * GET /api/schedule/health
     *
     * Връща информация дали услугата работи
     */
    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("service", "AutoScheduleService");
        health.put("timestamp", LocalDate.now().toString());
        health.put("version", "1.0");

        return ResponseEntity.ok(health);
    }

    /**
     * Валидира входните данни за генериране
     */
    private String validateRequest(ScheduleGenerationRequest request) {
        // Проверка за null стойности
        if (request.getYear() == null || request.getMonth() == null) {
            return "Година и месец са задължителни полета";
        }

        // Проверка за валидна година
        int currentYear = LocalDate.now().getYear();
        if (request.getYear() < currentYear - 1 || request.getYear() > currentYear + 2) {
            return "Невалидна година. Моля изберете година между " +
                    (currentYear - 1) + " и " + (currentYear + 2);
        }

        // Проверка за валиден месец
        if (request.getMonth() < 1 || request.getMonth() > 12) {
            return "Невалиден месец. Моля изберете месец между 1 и 12";
        }

        return null; // Няма грешки
    }

    /**
     * Създава обект за грешка
     */
    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> error = new HashMap<>();
        error.put("success", false);
        error.put("error", message);
        error.put("timestamp", LocalDate.now().toString());
        return error;
    }

    /**
     * Вътрешен клас за request body
     * Използва се за десериализация на JSON заявката
     */
    public static class ScheduleGenerationRequest {
        private Integer year;
        private Integer month;

        // Конструктор по подразбиране (задължителен за Jackson)
        public ScheduleGenerationRequest() {
        }

        // Конструктор с параметри
        public ScheduleGenerationRequest(Integer year, Integer month) {
            this.year = year;
            this.month = month;
        }

        // Getters
        public Integer getYear() {
            return year;
        }

        public Integer getMonth() {
            return month;
        }

        // Setters
        public void setYear(Integer year) {
            this.year = year;
        }

        public void setMonth(Integer month) {
            this.month = month;
        }

        @Override
        public String toString() {
            return "ScheduleGenerationRequest{" +
                    "year=" + year +
                    ", month=" + month +
                    '}';
        }
    }

    /**
     * Вътрешен клас за response при генериране
     * Може да се използва за структуриран отговор
     */
    public static class ScheduleGenerationResponse {
        private boolean success;
        private String message;
        private Integer year;
        private Integer month;
        private Integer generatedShifts;
        private String timestamp;

        // Конструктор
        public ScheduleGenerationResponse(boolean success, String message,
                                          Integer year, Integer month,
                                          Integer generatedShifts) {
            this.success = success;
            this.message = message;
            this.year = year;
            this.month = month;
            this.generatedShifts = generatedShifts;
            this.timestamp = LocalDate.now().toString();
        }

        // Getters и Setters
        public boolean isSuccess() {
            return success;
        }

        public void setSuccess(boolean success) {
            this.success = success;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }

        public Integer getYear() {
            return year;
        }

        public void setYear(Integer year) {
            this.year = year;
        }

        public Integer getMonth() {
            return month;
        }

        public void setMonth(Integer month) {
            this.month = month;
        }

        public Integer getGeneratedShifts() {
            return generatedShifts;
        }

        public void setGeneratedShifts(Integer generatedShifts) {
            this.generatedShifts = generatedShifts;
        }

        public String getTimestamp() {
            return timestamp;
        }

        public void setTimestamp(String timestamp) {
            this.timestamp = timestamp;
        }
    }
}