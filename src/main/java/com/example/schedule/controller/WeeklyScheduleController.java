package com.example.schedule.controller;

import com.example.schedule.dto.WeeklyScheduleDto;
import com.example.schedule.service.WeeklyScheduleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.schedule.dto.DailyWorkHoursDto;

import java.time.temporal.ChronoUnit;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * REST Controller за управление на седмичните графици на служителите
 * Предоставя endpoints за четене и актуализация на седмичните данни
 */
@RestController
@RequestMapping("/api/weekly-schedule")
@CrossOrigin(origins = "http://localhost:3000") // Позволява заявки от frontend
public class WeeklyScheduleController {

    @Autowired
    private WeeklyScheduleService weeklyScheduleService;

    /**
     * Получава седмичните данни за служител за определен месец
     * GET /api/weekly-schedule/{employeeId}?year=2025&month=6
     *
     * @param employeeId - ID на служителя
     * @param year       - година (опционален, по подразбиране текущата)
     * @param month      - месец 1-12 (опционален, по подразбиране текущия)
     * @return списък със седмичните данни за месеца
     */
    @GetMapping("/{employeeId}")
    public ResponseEntity<?> getWeeklyScheduleForEmployee(
            @PathVariable Long employeeId,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {

        System.out.println(String.format("📅 GET request for weekly schedule - Employee: %d, Year: %d, Month: %d",
                employeeId, year, month));

        try {
            // Ако не е зададена година или месец, използваме текущите
            if (year == null || month == null) {
                YearMonth current = YearMonth.now();
                year = year != null ? year : current.getYear();
                month = month != null ? month : current.getMonthValue();
            }

            // Валидация на входните данни
            if (month < 1 || month > 12) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("Invalid month. Must be between 1 and 12."));
            }

            if (year < 2020 || year > 2030) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("Invalid year. Must be between 2020 and 2030."));
            }

            // Получаваме седмичните данни от service
            List<WeeklyScheduleDto> weeklyData = weeklyScheduleService.getWeeklyScheduleForMonth(employeeId, year, month);

            System.out.println(String.format("✅ Returning %d weekly records for employee %d (%d/%d)",
                    weeklyData.size(), employeeId, month, year));

            // Създаваме response с метаданни
            Map<String, Object> response = new HashMap<>();
            response.put("employeeId", employeeId);
            response.put("year", year);
            response.put("month", month);
            response.put("monthName", getMonthName(month));
            response.put("totalWeeks", weeklyData.size());
            response.put("weeklySchedule", weeklyData);

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            // Грешка от service слоя (напр. служител не е намерен)
            System.err.println("❌ Business logic error: " + e.getMessage());
            return ResponseEntity.badRequest()
                    .body(createErrorResponse(e.getMessage()));

        } catch (Exception e) {
            // Неочаквана грешка
            System.err.println("❌ Unexpected error in getWeeklyScheduleForEmployee: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("An unexpected error occurred while fetching weekly schedule."));
        }
    }

    /**
     * Актуализира седмичен график след промяна в събитие
     * POST /api/weekly-schedule/update
     *
     * @param request - заявката с данни за актуализация
     * @return потвърждение за успешна актуализация
     */
    @PostMapping("/update")
    public ResponseEntity<?> updateWeeklySchedule(@RequestBody UpdateScheduleRequest request) {
        System.out.println(String.format("🔄 POST request to update weekly schedule - Employee: %d, Date: %s",
                request.getEmployeeId(), request.getEventDate()));

        try {
            // Валидация на входните данни
            if (request.getEmployeeId() == null) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("Employee ID is required."));
            }

            if (request.getEventDate() == null) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("Event date is required."));
            }

            // Актуализираме седмичния график
            weeklyScheduleService.updateWeeklyScheduleForEvent(request.getEmployeeId(), request.getEventDate());

            System.out.println("✅ Weekly schedule updated successfully");

            // Създаваме success response
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Weekly schedule updated successfully");
            response.put("employeeId", request.getEmployeeId());
            response.put("eventDate", request.getEventDate());
            response.put("updatedAt", LocalDate.now());

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            // Бизнес логика грешка
            System.err.println("❌ Business logic error in updateWeeklySchedule: " + e.getMessage());
            return ResponseEntity.badRequest()
                    .body(createErrorResponse(e.getMessage()));

        } catch (Exception e) {
            // Неочаквана грешка
            System.err.println("❌ Unexpected error in updateWeeklySchedule: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("An unexpected error occurred while updating weekly schedule."));
        }
    }

    /**
     * Преизчислява всички седмични графици за служител
     * POST /api/weekly-schedule/{employeeId}/recalculate
     *
     * @param employeeId - ID на служителя
     * @return потвърждение за успешно преизчисление
     */
    @PostMapping("/{employeeId}/recalculate")
    public ResponseEntity<?> recalculateWeeklySchedules(@PathVariable Long employeeId) {
        System.out.println(String.format("🔄 POST request to recalculate all schedules for employee %d", employeeId));

        try {
            // Преизчисляваме всички седмичници графици
            weeklyScheduleService.recalculateAllWeeklySchedules(employeeId);

            System.out.println("✅ All weekly schedules recalculated successfully");

            // Success response
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "All weekly schedules recalculated successfully");
            response.put("employeeId", employeeId);
            response.put("recalculatedAt", LocalDate.now());

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            // Бизнес логика грешка
            System.err.println("❌ Business logic error in recalculateWeeklySchedules: " + e.getMessage());
            return ResponseEntity.badRequest()
                    .body(createErrorResponse(e.getMessage()));

        } catch (Exception e) {
            // Неочаквана грешка
            System.err.println("❌ Unexpected error in recalculateWeeklySchedules: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("An unexpected error occurred while recalculating schedules."));
        }
    }

    /**
     * Получава кратка статистика за служител
     * GET /api/weekly-schedule/{employeeId}/stats?year=2025
     *
     * @param employeeId - ID на служителя
     * @param year       - година (опционален)
     * @return статистика за годината
     */
    @GetMapping("/{employeeId}/stats")
    public ResponseEntity<?> getEmployeeStats(@PathVariable Long employeeId,
                                              @RequestParam(required = false) Integer year) {
        System.out.println(String.format("📊 GET request for employee stats - Employee: %d, Year: %d",
                employeeId, year));

        try {
            // Ако няма година, използваме текущата
            if (year == null) {
                year = LocalDate.now().getYear();
            }

            // TODO: Можеш да добавиш статистика логика тук
            // За сега връщаме основна информация
            Map<String, Object> stats = new HashMap<>();
            stats.put("employeeId", employeeId);
            stats.put("year", year);
            stats.put("message", "Statistics feature coming soon");

            return ResponseEntity.ok(stats);

        } catch (Exception e) {
            System.err.println("❌ Error getting employee stats: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Error fetching employee statistics."));
        }
    }

    /**
     * ПОМОЩНА ФУНКЦИЯ: Създава error response
     *
     * @param message - съобщението за грешка
     * @return error response обект
     */
    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("success", false);
        errorResponse.put("error", message);
        errorResponse.put("timestamp", LocalDate.now().toString());
        return errorResponse;
    }

    /**
     * ПОМОЩНА ФУНКЦИЯ: Връща името на месеца на български
     *
     * @param month - номер на месеца (1-12)
     * @return името на месеца
     */
    private String getMonthName(Integer month) {
        String[] monthNames = {
                "Януари", "Февруари", "Март", "Април", "Май", "Юни",
                "Юли", "Август", "Септември", "Октомври", "Ноември", "Декември"
        };

        if (month >= 1 && month <= 12) {
            return monthNames[month - 1];
        }
        return "Неизвестен";
    }

    /**
     * DTO клас за заявка за актуализация на график
     */
    public static class UpdateScheduleRequest {
        private Long employeeId;
        private LocalDate eventDate;
        private String action; // "CREATE", "UPDATE", "DELETE"

        // Конструктори
        public UpdateScheduleRequest() {
        }

        public UpdateScheduleRequest(Long employeeId, LocalDate eventDate, String action) {
            this.employeeId = employeeId;
            this.eventDate = eventDate;
            this.action = action;
        }

        // Getters и Setters
        public Long getEmployeeId() {
            return employeeId;
        }

        public void setEmployeeId(Long employeeId) {
            this.employeeId = employeeId;
        }

        public LocalDate getEventDate() {
            return eventDate;
        }

        public void setEventDate(LocalDate eventDate) {
            this.eventDate = eventDate;
        }

        public String getAction() {
            return action;
        }

        public void setAction(String action) {
            this.action = action;
        }

        @Override
        public String toString() {
            return String.format("UpdateScheduleRequest{employeeId=%d, eventDate=%s, action='%s'}",
                    employeeId, eventDate, action);
        }
    }

    /**
     * Получава дневните работни часове за служител за определен месец
     * GET /api/weekly-schedule/{employeeId}/daily-hours?year=2025&month=7
     * <p>
     * Този endpoint връща информация за всеки ден в месеца:
     * - Ако има събитие в event таблицата: показва "08:00 - 16:00" (работен ден) или "Paid leave" (отпуск)
     * - Ако няма събитие: показва "Day off"
     *
     * @param employeeId - ID на служителя
     * @param year       - година (опционален, по подразбиране текущата)
     * @param month      - месец 1-12 (опционален, по подразбиране текущия)
     * @return списък с дневните работни часове за всеки ден в месеца
     */
    @GetMapping("/{employeeId}/daily-hours")
    public ResponseEntity<?> getDailyWorkHours(
            @PathVariable Long employeeId,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {

        System.out.println(String.format("📅 GET request for daily work hours - Employee: %d, Year: %d, Month: %d",
                employeeId, year, month));

        try {
            // Ако не е зададена година или месец, използваме текущите
            if (year == null || month == null) {
                YearMonth current = YearMonth.now();
                year = year != null ? year : current.getYear();
                month = month != null ? month : current.getMonthValue();
            }

            // Валидация на входните данни
            if (month < 1 || month > 12) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("Invalid month. Must be between 1 and 12."));
            }

            if (year < 2020 || year > 2030) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("Invalid year. Must be between 2020 and 2030."));
            }

            // Получаваме дневните работни часове от service
            List<DailyWorkHoursDto> dailyHours = weeklyScheduleService.getDailyWorkHoursForMonth(employeeId, year, month);

            System.out.println(String.format("✅ Returning %d daily records for employee %d (%d/%d)",
                    dailyHours.size(), employeeId, month, year));

            // Създаваме response с метаданни
            Map<String, Object> response = new HashMap<>();
            response.put("employeeId", employeeId);
            response.put("year", year);
            response.put("month", month);
            response.put("monthName", getMonthName(month));
            response.put("totalDays", dailyHours.size());
            response.put("dailyWorkHours", dailyHours);

            // Добавяме статистики
            long workDays = dailyHours.stream().mapToLong(d -> d.isWorkDay() ? 1 : 0).sum();
            long dayOffs = dailyHours.stream().mapToLong(d -> d.isDayOff() ? 1 : 0).sum();
            long leaveDays = dailyHours.stream().mapToLong(d -> d.getLeaveType() != null ? 1 : 0).sum();

            response.put("statistics", Map.of(
                    "workDays", workDays,
                    "dayOffs", dayOffs,
                    "leaveDays", leaveDays
            ));

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            // Грешка от service слоя (напр. служител не е намерен)
            System.err.println("❌ Business logic error: " + e.getMessage());
            return ResponseEntity.badRequest()
                    .body(createErrorResponse(e.getMessage()));

        } catch (Exception e) {
            // Неочаквана грешка
            System.err.println("❌ Unexpected error in getDailyWorkHours: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("An unexpected error occurred while fetching daily work hours."));
        }
    }

    /**
     * Получава дневните работни часове за служител за определен период
     * GET /api/weekly-schedule/{employeeId}/daily-hours/period?startDate=2025-07-01&endDate=2025-07-31
     * <p>
     * Позволява гъвкаво задаване на периода (може да е различен от месец)
     *
     * @param employeeId - ID на служителя
     * @param startDate  - начална дата на периода (YYYY-MM-DD)
     * @param endDate    - крайна дата на периода (YYYY-MM-DD)
     * @return списък с дневните работни часове за периода
     */
    @GetMapping("/{employeeId}/daily-hours/period")
    public ResponseEntity<?> getDailyWorkHoursForPeriod(
            @PathVariable Long employeeId,
            @RequestParam String startDate,
            @RequestParam String endDate) {

        System.out.println(String.format("📅 GET request for daily work hours period - Employee: %d, Period: %s to %s",
                employeeId, startDate, endDate));

        try {
            // Парсираме датите
            LocalDate start = LocalDate.parse(startDate);
            LocalDate end = LocalDate.parse(endDate);

            // Валидация на периода
            if (start.isAfter(end)) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("Start date cannot be after end date."));
            }

            // Проверяваме дали периодът не е твърде дълъг (максимум 3 месеца)
            if (ChronoUnit.DAYS.between(start, end) > 90) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("Period cannot be longer than 90 days."));
            }

            // Получаваме дневните работни часове от service
            List<DailyWorkHoursDto> dailyHours = weeklyScheduleService.getDailyWorkHours(employeeId, start, end);

            System.out.println(String.format("✅ Returning %d daily records for employee %d (period %s to %s)",
                    dailyHours.size(), employeeId, startDate, endDate));

            // Създаваме response
            Map<String, Object> response = new HashMap<>();
            response.put("employeeId", employeeId);
            response.put("startDate", start);
            response.put("endDate", end);
            response.put("totalDays", dailyHours.size());
            response.put("dailyWorkHours", dailyHours);

            // Добавяме статистики
            long workDays = dailyHours.stream().mapToLong(d -> d.isWorkDay() ? 1 : 0).sum();
            long dayOffs = dailyHours.stream().mapToLong(d -> d.isDayOff() ? 1 : 0).sum();
            long leaveDays = dailyHours.stream().mapToLong(d -> d.getLeaveType() != null ? 1 : 0).sum();

            response.put("statistics", Map.of(
                    "workDays", workDays,
                    "dayOffs", dayOffs,
                    "leaveDays", leaveDays
            ));

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("❌ Error in getDailyWorkHoursForPeriod: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("An unexpected error occurred while fetching daily work hours for period."));
        }
    }
}