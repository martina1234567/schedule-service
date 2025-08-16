package com.example.schedule.controller;

import com.example.schedule.dto.EventDto;
import com.example.schedule.dto.WeeklyScheduleDto;
import com.example.schedule.entity.Employee;
import com.example.schedule.entity.Event;
import com.example.schedule.exception.ValidationException;
import com.example.schedule.repository.EventRepository;
import com.example.schedule.repository.EmployeeRepository;
import com.example.schedule.service.ValidationService;
import com.example.schedule.service.WeeklyScheduleService;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/events")
@CrossOrigin(origins = "http://localhost:3000")  // Разрешава заявки от React/HTML
public class EventController {

    private final EventRepository eventRepository;
    private final EmployeeRepository employeeRepository;
    private final ValidationService validationService; // НОВА ЗАВИСИМОСТ
    private final WeeklyScheduleService weeklyScheduleService;

    /**
     * Конструктор с всички dependencies
     * @param eventRepository - Repository за събития
     * @param employeeRepository - Repository за служители
     * @param validationService - Сервис за валидация
     */
    public EventController(EventRepository eventRepository,
                           EmployeeRepository employeeRepository,
                           ValidationService validationService,
                           WeeklyScheduleService weeklyScheduleService) {
        this.eventRepository = eventRepository;
        this.employeeRepository = employeeRepository;
        this.validationService = validationService; // ИНЖЕКТИРАМЕ VALIDATION SERVICE
        this.weeklyScheduleService = weeklyScheduleService;
    }

    /**
     * GET метод за извличане на всички събития
     * @return List<EventDto> - Списък с всички събития
     */
    @GetMapping
    public List<EventDto> getAllEvents() {
        return eventRepository.findAllEventDtos();
    }

    /**
     * ОБНОВЕН POST МЕТОД ЗА СЪЗДАВАНЕ НА СЪБИТИЕ С ВАЛИДАЦИЯ
     * Добавена е валидация на работните часове преди създаване на събитие
     *
     * @param event - Събитието за създаване
     * @return ResponseEntity<Event> - Резултат от операцията
     */
    @PostMapping
    public ResponseEntity<?> createEvent(@RequestBody Event event) {
        System.out.println("📝 Получена заявка за създаване на събитие: " + event.getTitle());

        try {
            // Основна валидация
            if (event.getEmployee() == null || event.getEmployee().getId() == null) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("Employee information is required"));
            }

            // Намираме служителя
            Optional<Employee> employeeOpt = employeeRepository.findById(event.getEmployee().getId());
            if (employeeOpt.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("Employee not found"));
            }

            Employee employee = employeeOpt.get();
            event.setEmployee(employee); // Задаваме пълната информация за служителя

            // ПОПРАВКА: Използваме title-а от заявката или само първото име
            if (event.getTitle() == null || event.getTitle().trim().isEmpty()) {
                // Ако няма title, използваме първото име
                event.setTitle(employee.getName().split(" ")[0]);
            } else {
                // Ако има title, го запазваме
                String requestTitle = event.getTitle().trim();
                // За сигурност използваме само първото име ако title-а е твърде дълъг
                if (requestTitle.length() > 20) {
                    event.setTitle(employee.getName().split(" ")[0]);
                }
                // Иначе запазваме title-а от заявката (който вече е първото име)
            }

            System.out.println("👤 Final event title set to: " + event.getTitle());

            String leaveType = event.getLeaveType();

            // Специална логика за отпуски
            if (leaveType != null && !leaveType.isEmpty()) {
                // Използваме start като източник на дата, ако е null — отказваме
                if (event.getStart() == null) {
                    return ResponseEntity.badRequest()
                            .body(createErrorResponse("Start date is required"));
                }

                LocalDate selectedDate = event.getStart().toLocalDate();
                LocalDateTime dateTimeAtMidnight = selectedDate.atTime(0, 0); // 00:00

                event.setStart(dateTimeAtMidnight);
                event.setEnd(dateTimeAtMidnight);
                event.setActivity(null); // Activity не е нужно при отпуск
            }

            // ========================================
            // НОВА ЧАСТ: ВАЛИДАЦИЯ НА РАБОТНИТЕ ЧАСОВЕ
            // ========================================

            System.out.println("🔍 Започваме валидация на работните часове...");

            // Извършваме валидацията (false = не е редактиране)
            ValidationService.ValidationResult validationResult = validationService.validateEvent(event, true);

            if (!validationResult.isValid()) {
                // Ако валидацията не мине, връщаме грешка
                System.out.println("❌ Валидацията не премина: " + validationResult.getErrors());
                return ResponseEntity.badRequest()
                        .body(createErrorResponse(validationResult.getFirstError()));
            }

            System.out.println("✅ Валидацията премина успешно");

            // ========================================
            // ЗАПАЗВАНЕ В БАЗАТА ДАННИ
            // ========================================

            // Запазваме събитието в базата данни
            Event savedEvent = eventRepository.save(event);

            System.out.println("✅ Събитието е запазено успешно с ID: " + savedEvent.getId());
            // ========================================
            // НОВА ЧАСТ: АКТУАЛИЗИРАМЕ СЕДМИЧНИЯ ГРАФИК
            // ========================================
            try {
                // Актуализираме седмичния график за този служител
                weeklyScheduleService.updateWeeklyScheduleForEvent(
                        employee.getId(),
                        savedEvent.getStart().toLocalDate()
                );
                System.out.println("✅ Седмичният график е актуализиран успешно");
            } catch (Exception e) {
                System.err.println("⚠️    private final EventRepository eventRepository");
                final EmployeeRepository employeeRepository;
                final ValidationService validationService; // НОВА ЗАВИСИМОСТ
                final WeeklyScheduleService weeklyScheduleService; // ДОБАВЯМЕ WEEKLY SCHEDULE SERVICE
            }


            return ResponseEntity.status(HttpStatus.CREATED).body(savedEvent);

        } catch (ValidationException e) {
            // Валидационни грешки
            System.out.println("❌ Валидационна грешка: " + e.getMessage());
            return ResponseEntity.badRequest()
                    .body(createErrorResponse(e.getFirstError()));

        } catch (Exception e) {
            // Общи грешки
            System.out.println("❌ Неочаквана грешка: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("An unexpected error occurred"));
        }
    }

    /**
     * GET метод за получаване на събитие по ID
     * @param id - ID на събитието
     * @return ResponseEntity<Event> - Събитието или 404
     */
    @GetMapping("/{id}")
    public ResponseEntity<Event> getEventById(@PathVariable Long id) {
        return eventRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * ОБНОВЕН PUT МЕТОД ЗА РЕДАКТИРАНЕ НА СЪБИТИЕ С ВАЛИДАЦИЯ
     * Добавена е валидация на работните часове преди редактиране на събитие
     *
     * @param id - ID на събитието
     * @param updatedEvent - Новите данни за събитието
     * @return ResponseEntity<?> - Резултат от операцията
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateEvent(@PathVariable Long id, @RequestBody Event updatedEvent) {
        System.out.println("📝 Получена заявка за редактиране на събитие с ID: " + id);

        try {
            // Проверяваме дали събитието съществува
            Optional<Event> existingOpt = eventRepository.findById(id);
            if (existingOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Event existing = existingOpt.get();

            // ВАЖНО: Задаваме ID на updatedEvent за да може валидацията да го изключи
            updatedEvent.setId(id);
            updatedEvent.setEmployee(existing.getEmployee()); // Запазваме служителя

            // ПОПРАВКА: Не презаписваме title-а автоматично
            if (updatedEvent.getTitle() == null || updatedEvent.getTitle().trim().isEmpty()) {
                // Ако няма title, използваме първото име
                updatedEvent.setTitle(existing.getEmployee().getName().split(" ")[0]);
            }

            System.out.println("👤 Updated event title set to: " + updatedEvent.getTitle());

            System.out.println("🔧 DEBUG INFO за редактиране:");
            System.out.println("  - Existing event ID: " + existing.getId());
            System.out.println("  - Updated event ID: " + updatedEvent.getId());
            System.out.println("  - Employee ID: " + updatedEvent.getEmployee().getId());

            // Специална логика за отпуски
            if (updatedEvent.getLeaveType() != null && !updatedEvent.getLeaveType().isEmpty()) {
                // За отпуски задаваме време 00:00
                if (updatedEvent.getStart() != null) {
                    LocalDate selectedDate = updatedEvent.getStart().toLocalDate();
                    LocalDateTime dateTimeAtMidnight = selectedDate.atTime(0, 0);
                    updatedEvent.setStart(dateTimeAtMidnight);
                    updatedEvent.setEnd(dateTimeAtMidnight);
                }
                updatedEvent.setActivity(null);
            }

            // ========================================
            // ВАЛИДАЦИЯ НА РАБОТНИТЕ ЧАСОВЕ
            // ========================================

            System.out.println("🔍 Започваме валидация на работните часове при редактиране...");

            ValidationService.ValidationResult validationResult = validationService.validateEvent(updatedEvent, true);

            if (!validationResult.isValid()) {
                System.out.println("❌ Валидацията не премина: " + validationResult.getErrors());
                return ResponseEntity.badRequest()
                        .body(createErrorResponse(validationResult.getFirstError()));
            }

            System.out.println("✅ Валидацията при редактиране премина успешно");

            // ========================================
            // ЗАПАЗВАНЕ НА ПРОМЕНИТЕ
            // ========================================

            // Запазваме промените в базата данни
            Event saved = eventRepository.save(updatedEvent);

            System.out.println("✅ Събитието е редактирано успешно");

            // ========================================
            // НОВА ЧАСТ: АКТУАЛИЗАЦИЯ НА СЕДМИЧНИЯ ГРАФИК
            // ========================================
            try {
                // Актуализираме седмичния график за този служител
                weeklyScheduleService.updateWeeklyScheduleForEvent(
                        saved.getEmployee().getId(),
                        saved.getStart().toLocalDate()
                );
                System.out.println("✅ Седмичният график е актуализиран след редактиране на събитие");
            } catch (Exception e) {
                System.err.println("⚠️ Грешка при актуализация на седмичния график: " + e.getMessage());
                // Не спираме процеса, само логваме грешката
            }

            return ResponseEntity.ok(saved);

        } catch (ValidationException e) {
            System.out.println("❌ Валидационна грешка при редактиране: " + e.getMessage());
            return ResponseEntity.badRequest()
                    .body(createErrorResponse(e.getFirstError()));

        } catch (Exception e) {
            System.out.println("❌ Неочаквана грешка при редактиране: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("An unexpected error occurred"));
        }
    }
    /**
     * DELETE метод за изтриване на събитие
     * @param id - ID на събитието
     * @return ResponseEntity<Void> - Резултат от операцията
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvent(@PathVariable Long id) {
        System.out.println("🗑️ Получена заявка за изтриване на събитие с ID: " + id);

        if (eventRepository.existsById(id)) {
            eventRepository.deleteById(id);
            System.out.println("✅ Събитието е изтрито успешно");
            return ResponseEntity.noContent().build();
        } else {
            System.out.println("❌ Събитието не е намерено");
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * ПОМОЩНА ФУНКЦИЯ: Създава error response в правилния формат
     * @param message - Съобщението за грешка
     * @return Map<String, String> - Error response
     */
    private Map<String, String> createErrorResponse(String message) {
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("error", message);
        errorResponse.put("timestamp", LocalDateTime.now().toString());
        return errorResponse;
    }
    @GetMapping("/schedules")
    public List<WeeklyScheduleDto> getWeeklySchedules() {
        return weeklyScheduleService.getAllWeeklySchedules();
    }

}