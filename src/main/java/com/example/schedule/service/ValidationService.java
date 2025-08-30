package com.example.schedule.service;

import com.example.schedule.entity.Event;
import com.example.schedule.entity.Employee;
import com.example.schedule.repository.EventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.ArrayList;
import java.util.stream.Collectors;
import java.util.Set;
import java.util.HashSet;

/**
 * СЕРВИС ЗА ВАЛИДАЦИЯ НА РАБОТНИТЕ ЧАСОВЕ
 * Обновен с валидация за последователни работни дни
 */
@Service
@Component
public class ValidationService {

    @Autowired
    private EventRepository eventRepository;

    /**
     * КОНСТАНТИ ЗА ВАЛИДАЦИОННИТЕ ПРАВИЛА
     */
    private static final long MIN_REST_HOURS = 12;      // Минимум 12 часа почивка между смени
    private static final long MAX_DAILY_HOURS = 12;     // Максимум 12 часа работа на ден
    private static final int MAX_CONSECUTIVE_DAYS = 6;  // НОВО: Максимум 6 дни подред работа

    public ValidationService() {
        System.out.println("✅ ValidationService bean създаден успешно!");
    }

    @Autowired
    public void init() {
        System.out.println("🔧 ValidationService инициализиран с EventRepository: " +
                (eventRepository != null ? "✅ OK" : "❌ NULL"));
    }

    /**
     * ГЛАВНА ВАЛИДАЦИОННА ФУНКЦИЯ (ОБНОВЕНА С НОВА ВАЛИДАЦИЯ)
     */
    public ValidationResult validateEvent(Event event, boolean isUpdate) {
        System.out.println("🔍 Започваме валидация на събитие за служител: " +
                (event.getEmployee() != null ? event.getEmployee().getId() : "NULL"));

        System.out.println("🔧 DEBUG INFO:");
        System.out.println("  - isUpdate: " + isUpdate);
        System.out.println("  - event.getId(): " + event.getId());
        System.out.println("  - event.getTitle(): " + event.getTitle());
        System.out.println("  - event.getStart(): " + event.getStart());
        System.out.println("  - event.getEnd(): " + event.getEnd());

        // NULL CHECKS (същите като преди)
        if (event == null) {
            System.out.println("❌ Събитието е null");
            ValidationResult result = new ValidationResult();
            result.addError("Event cannot be null");
            return result;
        }

        if (event.getEmployee() == null) {
            System.out.println("❌ Служителят е null");
            ValidationResult result = new ValidationResult();
            result.addError("Employee cannot be null");
            return result;
        }

        if (event.getStart() == null || event.getEnd() == null) {
            System.out.println("❌ Start или End дата е null: start=" + event.getStart() + ", end=" + event.getEnd());

            if (event.getLeaveType() != null && !event.getLeaveType().trim().isEmpty()) {
                System.out.println("🏖️ Това е отпуск с null дати, това е нормално");
                return ValidationResult.success();
            }

            ValidationResult result = new ValidationResult();
            result.addError("Event start and end time cannot be null for work shifts");
            return result;
        }

        // Ако е leave type (отпуск), не валидираме работните часове
        if (event.getLeaveType() != null && !event.getLeaveType().trim().isEmpty()) {
            System.out.println("🏖️ Това е отпуск, пропускаме валидацията на работните часове");
            return ValidationResult.success();
        }

        // Създаваме резултат за валидацията
        ValidationResult result = new ValidationResult();

        // Получаваме всички work събития за този служител
        List<Event> employeeWorkEvents = getEmployeeWorkEvents(event.getEmployee().getId());

        System.out.println("📊 ПРЕДИ филтриране: " + employeeWorkEvents.size() + " work събития");

        // Изключваме оригиналното събитие при редактиране
        if (isUpdate) {
            System.out.println("🔄 Това е редактиране - изключваме оригиналното събитие");

            if (event.getId() != null) {
                int originalSize = employeeWorkEvents.size();

                employeeWorkEvents = employeeWorkEvents.stream()
                        .filter(e -> e.getId() != null && !e.getId().equals(event.getId()))
                        .collect(Collectors.toList());

                int newSize = employeeWorkEvents.size();
                System.out.println("✅ Изключено по ID: " + event.getId() + " (" + originalSize + " -> " + newSize + " събития)");

            } else {
                System.out.println("⚠️ Няма ID на събитието, опитваме се да намерим по дата и служител");

                LocalDateTime eventStart = event.getStart();
                List<Event> sameDayEvents = employeeWorkEvents.stream()
                        .filter(e -> e.getStart() != null &&
                                e.getStart().toLocalDate().equals(eventStart.toLocalDate()))
                        .collect(Collectors.toList());

                if (sameDayEvents.size() == 1) {
                    Event eventToExclude = sameDayEvents.get(0);
                    System.out.println("🎯 Намерено единствено събитие в същия ден - изключваме ID: " + eventToExclude.getId());

                    int originalSize = employeeWorkEvents.size();
                    employeeWorkEvents = employeeWorkEvents.stream()
                            .filter(e -> e.getId() != null && !e.getId().equals(eventToExclude.getId()))
                            .collect(Collectors.toList());

                    int newSize = employeeWorkEvents.size();
                    System.out.println("✅ Изключено по дата: " + eventToExclude.getId() + " (" + originalSize + " -> " + newSize + " събития)");
                }
            }
        } else {
            System.out.println("➕ Това е ново събитие - не изключваме нищо");
        }

        System.out.println("📊 СЛЕД филтриране: " + employeeWorkEvents.size() + " събития за валидация");

        // ВАЛИДАЦИЯ 1: Дневни часове
        String dailyHoursError = validateDailyHours(event, employeeWorkEvents);
        if (dailyHoursError != null) {
            result.addError(dailyHoursError);
        }

        // ВАЛИДАЦИЯ 2: Почивка между смени
        String restPeriodError = validateRestPeriod(event, employeeWorkEvents);
        if (restPeriodError != null) {
            result.addError(restPeriodError);
        }

        // ВАЛИДАЦИЯ 3: Седмични часове
        String weeklyHoursError = validateWeeklyHours(event, employeeWorkEvents);
        if (weeklyHoursError != null) {
            result.addError(weeklyHoursError);
        }

        // ВАЛИДАЦИЯ 4: НОВА - Последователни работни дни
        String consecutiveDaysError = validateConsecutiveWorkDays(event, employeeWorkEvents);
        if (consecutiveDaysError != null) {
            result.addError(consecutiveDaysError);
        }

        // Логваме резултата
        if (result.isValid()) {
            System.out.println("✅ Валидацията премина успешно");
        } else {
            System.out.println("❌ Валидацията не премина: " + result.getErrors());
        }

        return result;
    }

    /**
     * НОВА ВАЛИДАЦИЯ 4: ПОСЛЕДОВАТЕЛНИ РАБОТНИ ДНИ
     * Проверява дали служителят няма повече от 6 дни подред работа
     *
     * @param newEvent - Новото събитие
     * @param existingEvents - Съществуващи събития
     * @return String - Съобщение за грешка или null ако е валидно
     */
    private String validateConsecutiveWorkDays(Event newEvent, List<Event> existingEvents) {
        System.out.println("📅 Валидираме последователните работни дни...");

        // NULL CHECKS
        if (newEvent.getStart() == null) {
            System.out.println("❌ Новото събитие има null start дата");
            return "Event start date cannot be null";
        }

        LocalDate newEventDate;
        try {
            newEventDate = newEvent.getStart().toLocalDate();
        } catch (Exception e) {
            System.out.println("❌ Грешка при получаване на дата: " + e.getMessage());
            return "Invalid event start date";
        }

        // Създаваме множество с всички работни дни (включително новото)
        Set<LocalDate> workDays = new HashSet<>();

        // Добавяме датите от съществуващите събития
        for (Event event : existingEvents) {
            try {
                if (event.getStart() != null) {
                    LocalDate eventDate = event.getStart().toLocalDate();
                    workDays.add(eventDate);
                    System.out.println("📊 Съществуващ работен ден: " + eventDate);
                }
            } catch (Exception e) {
                System.out.println("⚠️ Грешка при обработка на дата за събитие: " + e.getMessage());
            }
        }

        // Добавяме новата дата
        workDays.add(newEventDate);
        System.out.println("📊 Нов работен ден: " + newEventDate);

        System.out.println("📋 Общо работни дни: " + workDays.size());

        // Намираме най-дългата поредица от последователни дни
        int maxConsecutiveDays = findMaxConsecutiveDays(workDays, newEventDate);

        System.out.println("⏱️ Най-дълга поредица последователни работни дни: " + maxConsecutiveDays + " / " + MAX_CONSECUTIVE_DAYS);

        // Проверяваме дали надвишава лимита
        if (maxConsecutiveDays > MAX_CONSECUTIVE_DAYS) {
            int excess = maxConsecutiveDays - MAX_CONSECUTIVE_DAYS;
            return String.format("Consecutive work days limit exceeded! Found: %d consecutive days (Max: %d).",
                    maxConsecutiveDays, MAX_CONSECUTIVE_DAYS, excess);
        }

        return null; // Валидно
    }

    /**
     * ПОМОЩНА ФУНКЦИЯ: Намира най-дългата поредица от последователни работни дни
     * @param workDays - Множество с всички работни дни
     * @param newEventDate - Датата на новото събитие
     * @return int - Най-дългата поредица последователни дни
     */
    private int findMaxConsecutiveDays(Set<LocalDate> workDays, LocalDate newEventDate) {
        if (workDays.isEmpty()) {
            return 0;
        }

        // Намираме диапазона от дати за проверка (2 седмици преди и след новото събитие)
        LocalDate startDate = newEventDate.minusWeeks(2);
        LocalDate endDate = newEventDate.plusWeeks(2);

        System.out.println("🔍 Проверяваме период: " + startDate + " до " + endDate);

        int maxConsecutive = 0;
        int currentConsecutive = 0;
        LocalDate currentDate = startDate;

        while (!currentDate.isAfter(endDate)) {
            if (workDays.contains(currentDate)) {
                currentConsecutive++;
                System.out.println("📊 Ден " + currentDate + ": Работен ден (поредица: " + currentConsecutive + ")");

                // Проверяваме дали тази поредица включва новото събитие
                if (currentDate.equals(newEventDate) || currentConsecutive > maxConsecutive) {
                    maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
                }
            } else {
                if (currentConsecutive > 0) {
                    System.out.println("📊 Ден " + currentDate + ": Почивка - прекъсваме поредицата от " + currentConsecutive + " дни");
                }
                currentConsecutive = 0;
            }

            currentDate = currentDate.plusDays(1);
        }

        // Финална проверка за случая когато поредицата продължава до края
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);

        System.out.println("🎯 Най-дълга поредица включваща новото събитие: " + maxConsecutive + " дни");

        return maxConsecutive;
    }

    /**
     * ПОМОЩНА ФУНКЦИЯ: Получава всички валидни work събития за служител (С NULL CHECKS)
     */
    private List<Event> getEmployeeWorkEvents(Long employeeId) {
        if (employeeId == null) {
            System.out.println("❌ Employee ID е null");
            return new ArrayList<>();
        }

        // Получаваме всички събития за служителя
        List<Event> allEvents = eventRepository.findAll().stream()
                .filter(event -> event != null &&
                        event.getEmployee() != null &&
                        event.getEmployee().getId() != null &&
                        event.getEmployee().getId().equals(employeeId))
                .collect(Collectors.toList());

        System.out.println("📋 Намерени " + allEvents.size() + " общо събития за служител " + employeeId);

        // Филтрираме само валидни work събития (не leave types и с валидни дати)
        List<Event> validWorkEvents = allEvents.stream()
                .filter(event -> {
                    // Проверяваме дали е work event (не leave type)
                    boolean isWorkEvent = (event.getLeaveType() == null || event.getLeaveType().trim().isEmpty());

                    // Проверяваме дали има валидни дати
                    boolean hasValidDates = (event.getStart() != null && event.getEnd() != null);

                    if (!isWorkEvent) {
                        System.out.println("⏭️ Пропускаме leave event: " + event.getLeaveType());
                    }

                    if (!hasValidDates) {
                        System.out.println("⚠️ Пропускаме събитие с null дати: ID=" + event.getId() +
                                ", start=" + event.getStart() + ", end=" + event.getEnd());
                    }

                    return isWorkEvent && hasValidDates;
                })
                .collect(Collectors.toList());

        System.out.println("✅ Намерени " + validWorkEvents.size() + " валидни work събития");

        return validWorkEvents;
    }

    /**
     * ВАЛИДАЦИЯ 1: ДНЕВНИ РАБОТНИ ЧАСОВЕ (С NULL CHECKS)
     */
    private String validateDailyHours(Event newEvent, List<Event> existingEvents) {
        System.out.println("⏰ Валидираме дневните работни часове...");

        // NULL CHECKS
        if (newEvent.getStart() == null || newEvent.getEnd() == null) {
            System.out.println("❌ Новото събитие има null дати");
            return "Event dates cannot be null";
        }

        // Получаваме датата на новото събитие
        LocalDate newEventDate;
        try {
            newEventDate = newEvent.getStart().toLocalDate();
        } catch (Exception e) {
            System.out.println("❌ Грешка при получаване на дата: " + e.getMessage());
            return "Invalid event start date";
        }

        // Намираме всички събития за същия ден
        List<Event> sameDayEvents = existingEvents.stream()
                .filter(event -> {
                    try {
                        return event.getStart() != null &&
                                event.getStart().toLocalDate().equals(newEventDate);
                    } catch (Exception e) {
                        System.out.println("⚠️ Пропускаме събитие с невалидна дата: " + e.getMessage());
                        return false;
                    }
                })
                .collect(Collectors.toList());

        System.out.println("📅 Намерени " + sameDayEvents.size() + " валидни събития за същия ден: " + newEventDate);

        // Изчисляваме общите часове за деня
        long totalDailyMinutes = 0;

        // Добавяме минутите от съществуващите събития
        for (Event event : sameDayEvents) {
            try {
                if (event.getStart() != null && event.getEnd() != null) {
                    long eventMinutes = ChronoUnit.MINUTES.between(event.getStart(), event.getEnd());
                    totalDailyMinutes += eventMinutes;
                    System.out.println("📊 Валидно събитие: " + (eventMinutes / 60.0) + " часа");
                }
            } catch (Exception e) {
                System.out.println("⚠️ Грешка при изчисляване на минути за събитие: " + e.getMessage());
            }
        }

        // Добавяме минутите от новото събитие
        try {
            long newEventMinutes = ChronoUnit.MINUTES.between(newEvent.getStart(), newEvent.getEnd());
            totalDailyMinutes += newEventMinutes;
        } catch (Exception e) {
            System.out.println("❌ Грешка при изчисляване на минути за ново събитие: " + e.getMessage());
            return "Invalid event duration";
        }

        // Конвертираме в часове
        double totalDailyHours = totalDailyMinutes / 60.0;

        System.out.println("⏱️ Общо дневни часове: " + String.format("%.1f", totalDailyHours) + " / " + MAX_DAILY_HOURS);

        // Проверяваме дали надвишава лимита
        if (totalDailyHours > MAX_DAILY_HOURS) {
            double excess = totalDailyHours - MAX_DAILY_HOURS;
            return String.format("Daily work limit exceeded! Total: %.1fh (Max: %dh).",
                    totalDailyHours, MAX_DAILY_HOURS, excess);
        }

        return null; // Валидно
    }

    /**
     * ВАЛИДАЦИЯ 2: ПОЧИВКА МЕЖДУ СМЕНИ (С NULL CHECKS)
     */
    private String validateRestPeriod(Event newEvent, List<Event> existingEvents) {
        System.out.println("😴 Валидираме почивката между смени...");

        // NULL CHECKS
        if (newEvent.getStart() == null || newEvent.getEnd() == null) {
            System.out.println("❌ Новото събитие има null дати");
            return "Event dates cannot be null";
        }

        LocalDateTime newStart = newEvent.getStart();
        LocalDateTime newEnd = newEvent.getEnd();

        // Проверяваме всички съществуващи събития
        for (Event event : existingEvents) {
            try {
                if (event.getStart() == null || event.getEnd() == null) {
                    System.out.println("⚠️ Пропускаме събитие с null дати");
                    continue;
                }

                LocalDateTime eventStart = event.getStart();
                LocalDateTime eventEnd = event.getEnd();

                // СЛУЧАЙ 1: Новото събитие започва скоро след края на съществуващо
                long hoursSinceEventEnd = ChronoUnit.HOURS.between(eventEnd, newStart);
                if (hoursSinceEventEnd >= 0 && hoursSinceEventEnd < MIN_REST_HOURS) {
                    long shortage = MIN_REST_HOURS - hoursSinceEventEnd;
                    System.out.println("❌ Недостатъчна почивка след смяна: " + hoursSinceEventEnd + "ч (Мин: " + MIN_REST_HOURS + "ч)");
                    return String.format("Insufficient rest period! Only %dh after previous shift (Min: %dh). Missing: %dh",
                            hoursSinceEventEnd, MIN_REST_HOURS, shortage);
                }

                // СЛУЧАЙ 2: Новото събитие завършва скоро преди началото на съществуващо
                long hoursUntilEventStart = ChronoUnit.HOURS.between(newEnd, eventStart);
                if (hoursUntilEventStart >= 0 && hoursUntilEventStart < MIN_REST_HOURS) {
                    long shortage = MIN_REST_HOURS - hoursUntilEventStart;
                    System.out.println("❌ Недостатъчна почивка преди смяна: " + hoursUntilEventStart + "ч (Мин: " + MIN_REST_HOURS + "ч)");
                    return String.format("Insufficient rest period! Only %dh before next shift (Min: %dh). Missing: %dh",
                            hoursUntilEventStart, MIN_REST_HOURS, shortage);
                }

            } catch (Exception e) {
                System.out.println("⚠️ Грешка при проверка на почивката за събитие: " + e.getMessage());
            }
        }

        System.out.println("✅ Валидацията на почивката премина");
        return null; // Валидно
    }

    /**
     * ВАЛИДАЦИЯ 3: СЕДМИЧНИ РАБОТНИ ЧАСОВЕ (С NULL CHECKS)
     *  * ВАЛИДАЦИЯ 3: СЕДМИЧНИ РАБОТНИ ЧАСОВЕ СПОРЕД ДОГОВОРА (ОБНОВЕНА)
     *  * Използва различни лимити според договорните часове на служителя:
     *  * - 4 часа дневно → максимум 30 часа седмично
     *  * - 6 часа дневно → максимум 40 часа седмично
     *  * - 8 часа дневно → максимум 53 часа седмично
     */
    private String validateWeeklyHours(Event newEvent, List<Event> existingEvents) {
        System.out.println("📅 Валидираме седмичните работни часове според договора...");

        // NULL CHECKS
        if (newEvent.getStart() == null) {
            System.out.println("❌ Новото събитие има null start дата");
            return "Event start date cannot be null";
        }

        // НОВА ЛОГИКА: Получаваме договорните часове на служителя
        Employee employee = newEvent.getEmployee();
        if (employee == null) {
            System.out.println("❌ Служител не е зададен");
            return "Employee information is required";
        }

        Integer dailyContractHours = employee.getHourlyRate();
        if (dailyContractHours == null) {
            System.out.println("⚠️ Служителят няма зададени договорни часове, използваме 8 часа по подразбиране");
            dailyContractHours = 8;
        }

        // НОВА ЛОГИКА: Определяме максималните седмични часове според договора
        long maxWeeklyHours;
        switch (dailyContractHours) {
            case 4:
                maxWeeklyHours = 30;
                break;
            case 6:
                maxWeeklyHours = 40;
                break;
            case 8:
                maxWeeklyHours = 53;
                break;
            default:
                System.out.println("⚠️ Нестандартни договорни часове: " + dailyContractHours + ", използваме 53 часа лимит");
                maxWeeklyHours = 53;
                break;
        }

        System.out.println("📊 Договорни часове: " + dailyContractHours + "ч/ден → Максимум седмично: " + maxWeeklyHours + "ч");

        LocalDate newEventDate;
        try {
            newEventDate = newEvent.getStart().toLocalDate();
        } catch (Exception e) {
            System.out.println("❌ Грешка при получаване на дата: " + e.getMessage());
            return "Invalid event start date";
        }

        // Намираме началото и края на седмицата
        LocalDate weekStart = newEventDate.with(java.time.DayOfWeek.MONDAY);
        LocalDate weekEnd = newEventDate.with(java.time.DayOfWeek.SUNDAY);

        System.out.println("📊 Седмица: " + weekStart + " до " + weekEnd);

        // Намираме всички събития в същата седмица
        List<Event> weekEvents = existingEvents.stream()
                .filter(event -> {
                    try {
                        if (event.getStart() == null) {
                            return false;
                        }
                        LocalDate eventDate = event.getStart().toLocalDate();
                        return !eventDate.isBefore(weekStart) && !eventDate.isAfter(weekEnd);
                    } catch (Exception e) {
                        System.out.println("⚠️ Пропускаме събитие с невалидна дата в седмичната проверка: " + e.getMessage());
                        return false;
                    }
                })
                .collect(Collectors.toList());

        System.out.println("📋 Намерени " + weekEvents.size() + " валидни събития в седмицата");

        // Изчисляваме общите часове за седмицата
        long totalWeeklyMinutes = 0;

        // Добавяме минутите от съществуващите събития
        for (Event event : weekEvents) {
            try {
                if (event.getStart() != null && event.getEnd() != null) {
                    long eventMinutes = ChronoUnit.MINUTES.between(event.getStart(), event.getEnd());
                    totalWeeklyMinutes += eventMinutes;
                    System.out.println("📊 Събитие в седмицата: " + (eventMinutes / 60.0) + " часа на " + event.getStart().toLocalDate());
                }
            } catch (Exception e) {
                System.out.println("⚠️ Грешка при изчисляване на минути за седмично събитие: " + e.getMessage());
            }
        }

        // Добавяме минутите от новото събитие
        try {
            if (newEvent.getEnd() != null) {
                long newEventMinutes = ChronoUnit.MINUTES.between(newEvent.getStart(), newEvent.getEnd());
                totalWeeklyMinutes += newEventMinutes;
            }
        } catch (Exception e) {
            System.out.println("❌ Грешка при изчисляване на минути за ново събитие в седмичната проверка: " + e.getMessage());
            return "Invalid event duration";
        }

        // Конвертираме в часове
        double totalWeeklyHours = totalWeeklyMinutes / 60.0;

        System.out.println("⏱️ Общо седмични часове: " + String.format("%.1f", totalWeeklyHours) + " / " + maxWeeklyHours);
        System.out.println("👤 Служител с договор " + dailyContractHours + "ч/ден");

        // Проверяваме дали надвишава лимита
        if (totalWeeklyHours > maxWeeklyHours) {
            double excess = totalWeeklyHours - maxWeeklyHours;
            String contractInfo = dailyContractHours + "-hour contract";
            return String.format("Weekly work limit exceeded for %s! Total: %.1fh (Max: %dh). Excess: %.1fh",
                    contractInfo, totalWeeklyHours, maxWeeklyHours, excess);
        }

        System.out.println("✅ Седмичната валидация премина за договор " + dailyContractHours + "ч/ден");
        return null; // Валидно
    }

    public void validateEvent(Event event) {
    }

    /**
     * ВЪТРЕШЕН КЛАС: ValidationResult
     */
    public static class ValidationResult {
        private List<String> errors;
        private boolean valid;

        public ValidationResult() {
            this.errors = new ArrayList<>();
            this.valid = true;
        }

        public void addError(String error) {
            this.errors.add(error);
            this.valid = false;
        }

        public boolean isValid() {
            return valid;
        }

        public List<String> getErrors() {
            return errors;
        }

        public String getFirstError() {
            return errors.isEmpty() ? null : errors.get(0);
        }

        public static ValidationResult success() {
            return new ValidationResult();
        }
    }
}