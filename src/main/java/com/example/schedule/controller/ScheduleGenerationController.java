package com.example.schedule.controller;

import com.example.schedule.service.ScheduleGeneratorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * КОНТРОЛЕР ЗА АВТОМАТИЧНО ГЕНЕРИРАНЕ НА РАБОТНИ ГРАФИЦИ
 * Обработва заявки от frontend-а за генериране на месечни графици
 */
@RestController
@RequestMapping("/api/schedule-generation")
@CrossOrigin(origins = "*") // Позволяваме CORS заявки от frontend
public class ScheduleGenerationController {

    @Autowired
    private ScheduleGeneratorService scheduleGeneratorService;

    /**
     * ENDPOINT: Генерира автоматично график за даден месец
     *
     * @param request JSON обект със година и месец
     * @return JSON отговор с резултата от генерирането
     *
     * Пример заявка:
     * POST /api/schedule-generation/generate
     * {
     *   "year": 2025,
     *   "month": 9
     * }
     */
    @PostMapping("/generate")
    public ResponseEntity<Map<String, Object>> generateSchedule(@RequestBody GenerateScheduleRequest request) {
        System.out.println("🚀 Получена заявка за генериране на график");
        System.out.println(String.format("📅 Период: %02d/%d", request.getMonth(), request.getYear()));

        Map<String, Object> response = new HashMap<>();

        try {
            // СТЪПКА 1: Валидираме входните данни
            if (request.getYear() < 2020 || request.getYear() > 2030) {
                response.put("success", false);
                response.put("error", "Невалидна година. Моля въведете година между 2020 и 2030.");
                return ResponseEntity.badRequest().body(response);
            }

            if (request.getMonth() < 1 || request.getMonth() > 12) {
                response.put("success", false);
                response.put("error", "Невалиден месец. Моля въведете месец между 1 и 12.");
                return ResponseEntity.badRequest().body(response);
            }

            // СТЪПКА 2: Стартираме генерирането на график
            System.out.println("⚙️ Стартиране на автоматично генериране...");
            int generatedShifts = scheduleGeneratorService.generateMonthlySchedule(request.getYear(), request.getMonth());

            // СТЪПКА 3: Подготвяме успешен отговор
            response.put("success", true);
            response.put("message", String.format("Графикът за %02d/%d е генериран успешно!",
                    request.getMonth(), request.getYear()));
            response.put("generatedShifts", generatedShifts);
            response.put("year", request.getYear());
            response.put("month", request.getMonth());

            System.out.println(String.format("✅ Генерирането завърши успешно! Създадени %d смени", generatedShifts));

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            // СТЪПКА 4: Обработваме грешки
            System.err.println("❌ Грешка при генериране на график: " + e.getMessage());
            e.printStackTrace();

            response.put("success", false);
            response.put("error", "Възникна грешка при генерирането: " + e.getMessage());
            response.put("details", e.getClass().getSimpleName());

            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * ENDPOINT: Получава информация за текущия месец (помощна функция)
     *
     * @return JSON с информация за текущия месец и година
     */
    @GetMapping("/current-month")
    public ResponseEntity<Map<String, Object>> getCurrentMonth() {
        Map<String, Object> response = new HashMap<>();

        java.time.LocalDate today = java.time.LocalDate.now();

        response.put("currentYear", today.getYear());
        response.put("currentMonth", today.getMonthValue());
        response.put("monthName", today.getMonth().toString());

        // Предлагаме и следващия месец като опция
        java.time.LocalDate nextMonth = today.plusMonths(1);
        response.put("nextMonthYear", nextMonth.getYear());
        response.put("nextMonth", nextMonth.getMonthValue());
        response.put("nextMonthName", nextMonth.getMonth().toString());

        return ResponseEntity.ok(response);
    }

    /**
     * ENDPOINT: Проверява дали има автоматично генерирани смени за даден месец
     *
     * @param year Година
     * @param month Месец
     * @return JSON с информация дали има генерирани смени
     */
    @GetMapping("/check-existing")
    public ResponseEntity<Map<String, Object>> checkExistingSchedule(
            @RequestParam int year,
            @RequestParam int month) {

        Map<String, Object> response = new HashMap<>();

        try {
            // Тук можем да добавим логика за проверка на съществуващи автоматично генерирани смени
            // За простота връщаме информация че винаги може да се генерира
            response.put("hasExistingSchedule", false);
            response.put("message", String.format("Готово за генериране на график за %02d/%d", month, year));

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("error", "Грешка при проверка: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * ВЪТРЕШЕН КЛАС: Модел за заявка за генериране на график
     */
    public static class GenerateScheduleRequest {
        private int year;
        private int month;

        // Конструктори
        public GenerateScheduleRequest() {}

        public GenerateScheduleRequest(int year, int month) {
            this.year = year;
            this.month = month;
        }

        // Getters и Setters
        public int getYear() {
            return year;
        }

        public void setYear(int year) {
            this.year = year;
        }

        public int getMonth() {
            return month;
        }

        public void setMonth(int month) {
            this.month = month;
        }

        @Override
        public String toString() {
            return String.format("GenerateScheduleRequest{year=%d, month=%d}", year, month);
        }
    }
}