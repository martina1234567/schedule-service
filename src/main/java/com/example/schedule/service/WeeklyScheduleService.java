package com.example.schedule.service;

import com.example.schedule.dto.DailyWorkHoursDto;
import com.example.schedule.dto.WeeklyScheduleDto;
import com.example.schedule.entity.Employee;
import com.example.schedule.entity.Event;
import com.example.schedule.entity.WeeklySchedule;
import com.example.schedule.repository.EmployeeRepository;
import com.example.schedule.repository.EventRepository;
import com.example.schedule.repository.WeeklyScheduleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.time.temporal.WeekFields;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service за управление на седмичните графици на служителите
 * ОБНОВЕН: Включва платените отпуски като работни часове
 *
 * НОВА ЛОГИКА ЗА ПЛАТЕНИ ОТПУСКИ:
 * - Paid leave, Sick leave, Maternity leave, Paternity leave → ВКЛЮЧВАТ СЕ като работни часове
 * - Day off, Unpaid leave, No Leave Selected → НЕ се включват като работни часове
 *
 * За платените отпуски използваме часовете от договора на служителя (4, 6 или 8 часа дневно)
 */
@Service
public class WeeklyScheduleService {

    @Autowired
    private WeeklyScheduleRepository weeklyScheduleRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private EventRepository eventRepository;

    /**
     * КОНСТАНТИ ЗА ТИПОВЕТЕ ПЛАТЕНИ ОТПУСКИ
     * Тези типове отпуски се считат за работни часове при изчисляването
     */
    private static final Set<String> PAID_LEAVE_TYPES = Set.of(
            "Paid leave",      // Платен отпуск
            "Sick leave",      // Болничен
            "Maternity leave", // Майчинство
            "Paternity leave"  // Бащинство
    );

    /**
     * КОНСТАНТИ ЗА ТИПОВЕТЕ НЕПЛАТЕНИ ОТПУСКИ
     * Тези типове отпуски НЕ се считат за работни часове
     */
    private static final Set<String> UNPAID_LEAVE_TYPES = Set.of(
            "Day off",        // Почивен ден
            "Unpaid leave"    // Неплатен отпуск
    );

    /**
     * Получава седмичните данни за служител за определен месец
     * @param employeeId - ID на служителя
     * @param year - година
     * @param month - месец (1-12)
     * @return списък със седмичните данни
     */
    @Transactional(readOnly = true)
    public List<WeeklyScheduleDto> getWeeklyScheduleForMonth(Long employeeId, Integer year, Integer month) {
        System.out.println(String.format("📅 Getting weekly schedule for employee %d, month %d/%d", employeeId, month, year));

        // Намираме служителя
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found: " + employeeId));

        // Получаваме всички седмици в месеца
        List<LocalDate> weeksInMonth = getWeeksForMonth(year, month);
        System.out.println(String.format("📋 Found %d weeks in %d/%d", weeksInMonth.size(), month, year));

        List<WeeklyScheduleDto> result = new ArrayList<>();

        for (LocalDate weekStart : weeksInMonth) {
            // Проверяваме дали има запис в базата
            Optional<WeeklySchedule> existingSchedule = weeklyScheduleRepository
                    .findByEmployeeIdAndWeekStartDate(employeeId, weekStart);

            WeeklyScheduleDto weekDto;
            if (existingSchedule.isPresent()) {
                // Използваме съществуващия запис
                weekDto = convertToDto(existingSchedule.get());
                System.out.println(String.format("✅ Found existing schedule for week %s: %s hours",
                        weekStart, weekDto.getFormattedPlannedHours()));
            } else {
                // Създаваме нов DTO за седмица без график
                weekDto = createEmptyWeekDto(employee, weekStart);
                System.out.println(String.format("➕ Created empty week DTO for %s", weekStart));
            }

            result.add(weekDto);
        }

        System.out.println(String.format("✅ Returning %d weekly schedules for employee %s",
                result.size(), employee.getName()));
        return result;
    }

    /**
     * Връща седмичния график за текущата седмица на служител
     * @param employeeId - ID на служителя
     * @param currentDate - текуща дата
     * @return Optional със седмичния график ако съществува
     */
    public Optional<WeeklySchedule> getCurrentWeekSchedule(Long employeeId, LocalDate currentDate) {
        LocalDate startOfWeek = currentDate.with(DayOfWeek.MONDAY);
        return weeklyScheduleRepository.findByEmployeeIdAndWeekStartDate(employeeId, startOfWeek);
    }

    /**
     * ОБНОВЕНА ФУНКЦИЯ: Актуализира седмичния график след промяна в събитията
     * НОВА ЛОГИКА: Включва платените отпуски като работни часове
     *
     * @param employeeId - ID на служителя
     * @param eventDate - датата на промененото събитие
     */
    @Transactional
    public void updateWeeklyScheduleForEvent(Long employeeId, LocalDate eventDate) {
        System.out.println(String.format("🔄 Updating weekly schedule for employee %d, event date %s (WITH PAID LEAVE LOGIC)",
                employeeId, eventDate));

        try {
            // Намираме служителя
            Employee employee = employeeRepository.findById(employeeId)
                    .orElseThrow(() -> new RuntimeException("Employee not found: " + employeeId));

            // Намираме началото на седмицата за тази дата
            LocalDate weekStart = getWeekStartDate(eventDate);
            Integer weekNumber = getWeekNumber(weekStart);
            Integer year = weekStart.getYear();

            System.out.println(String.format("📅 Week start: %s, week number: %d, year: %d",
                    weekStart, weekNumber, year));

            // НОВА ЛОГИКА: Изчисляваме планираните часове включително платените отпуски
            WeeklyHours weeklyHours = calculateWeeklyHoursWithPaidLeave(employeeId, weekStart, employee);

            // Намираме или създаваме записа в базата
            WeeklySchedule weeklySchedule = weeklyScheduleRepository
                    .findByEmployeeIdAndWeekStartDate(employeeId, weekStart)
                    .orElse(new WeeklySchedule(employee, weekStart, weekNumber, year));

            // Актуализираме данните
            weeklySchedule.setPlannedHours(weeklyHours.getWorkHours());
            weeklySchedule.setBreakHours(weeklyHours.getBreakHours());
            weeklySchedule.setActualWorkHours(weeklyHours.getWorkHours()); // За сега актуалните = планираните

            // Запазваме в базата данни
            weeklySchedule = weeklyScheduleRepository.save(weeklySchedule);

            System.out.println(String.format("✅ Updated weekly schedule ID %d: %.2f work hours (including paid leave), %.2f break hours",
                    weeklySchedule.getId(),
                    weeklyHours.getWorkHours(),
                    weeklyHours.getBreakHours()));

        } catch (Exception e) {
            System.err.println("❌ Error updating weekly schedule: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    /**
     * Изтрива седмичен график за служител (при изтриване на служител)
     * @param employeeId - ID на служителя
     */
    @Transactional
    public void deleteWeeklySchedulesForEmployee(Long employeeId) {
        System.out.println(String.format("🗑️ Deleting all weekly schedules for employee %d", employeeId));

        try {
            weeklyScheduleRepository.deleteByEmployeeId(employeeId);
            System.out.println("✅ Weekly schedules deleted successfully");
        } catch (Exception e) {
            System.err.println("❌ Error deleting weekly schedules: " + e.getMessage());
            throw e;
        }
    }

    /**
     * ОБНОВЕНА ФУНКЦИЯ: Преизчислява всички седмични графици за служител
     * НОВА ЛОГИКА: Включва платените отпуски
     *
     * @param employeeId - ID на служителя
     */
    @Transactional
    public void recalculateAllWeeklySchedules(Long employeeId) {
        System.out.println(String.format("🔄 Recalculating all weekly schedules for employee %d (WITH PAID LEAVE LOGIC)", employeeId));

        try {
            // Намираме служителя
            Employee employee = employeeRepository.findById(employeeId)
                    .orElseThrow(() -> new RuntimeException("Employee not found: " + employeeId));

            // СТЪПКА 1: Получаваме ВСИЧКИ събития на служителя (включително leave events)
            List<Event> allEvents = eventRepository.findAll().stream()
                    .filter(event -> event.getEmployee() != null &&
                            event.getEmployee().getId().equals(employeeId))
                    .filter(event -> event.getStart() != null && event.getEnd() != null)
                    .collect(Collectors.toList());

            System.out.println(String.format("📋 Found %d total events for employee (including leave events)", allEvents.size()));

            // СТЪПКА 2: Групираме събитията по седмици
            Map<LocalDate, List<Event>> eventsByWeek = allEvents.stream()
                    .collect(Collectors.groupingBy(event -> getWeekStartDate(event.getStart().toLocalDate())));

            System.out.println(String.format("📅 Events spread across %d weeks", eventsByWeek.size()));

            // СТЪПКА 3: За всяка седмица изчисляваме и запазваме данните
            for (Map.Entry<LocalDate, List<Event>> entry : eventsByWeek.entrySet()) {
                LocalDate weekStart = entry.getKey();

                // НОВА ЛОГИКА: Изчисляваме часовете включително платените отпуски
                WeeklyHours weeklyHours = calculateWeeklyHoursFromEventsWithPaidLeave(entry.getValue(), employee);

                Integer weekNumber = getWeekNumber(weekStart);
                Integer year = weekStart.getYear();

                // Намираме или създаваме записа
                WeeklySchedule weeklySchedule = weeklyScheduleRepository
                        .findByEmployeeIdAndWeekStartDate(employeeId, weekStart)
                        .orElse(new WeeklySchedule(employee, weekStart, weekNumber, year));

                // Актуализираме данните
                weeklySchedule.setPlannedHours(weeklyHours.getWorkHours());
                weeklySchedule.setBreakHours(weeklyHours.getBreakHours());
                weeklySchedule.setActualWorkHours(weeklyHours.getWorkHours());

                weeklyScheduleRepository.save(weeklySchedule);

                System.out.println(String.format("✅ Week %s: %.2f hours (including paid leave)",
                        weekStart, weeklyHours.getWorkHours()));
            }

            System.out.println("✅ All weekly schedules recalculated successfully with paid leave logic");

        } catch (Exception e) {
            System.err.println("❌ Error recalculating weekly schedules: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    /**
     * НОВА ГЛАВНА ФУНКЦИЯ: Изчислява работните часове за конкретна седмица ВКЛЮЧИТЕЛНО платените отпуски
     *
     * ЛОГИКА:
     * 1. Получаваме всички работни събития за седмицата
     * 2. Получаваме всички платени отпуски за седмицата
     * 3. За работните събития използваме стандартната логика
     * 4. За платените отпуски добавяме часовете от договора
     *
     * @param employeeId - ID на служителя
     * @param weekStart - начало на седмицата (понеделник)
     * @param employee - обектът на служителя (за достъп до hourlyRate)
     * @return обект с работни и почивни часове
     */
    private WeeklyHours calculateWeeklyHoursWithPaidLeave(Long employeeId, LocalDate weekStart, Employee employee) {
        LocalDate weekEnd = weekStart.plusDays(6); // Неделя

        System.out.println(String.format("🔍 Calculating hours for employee %d, week %s to %s (INCLUDING PAID LEAVE)",
                employeeId, weekStart, weekEnd));

        // СТЪПКА 1: Получаваме ВСИЧКИ събития за тази седмица (работни + отпуски)
        List<Event> allWeekEvents = eventRepository.findAll().stream()
                .filter(event -> {
                    // Проверяваме служителя
                    if (event.getEmployee() == null || !event.getEmployee().getId().equals(employeeId)) {
                        return false;
                    }

                    // Проверяваме датите
                    if (event.getStart() == null || event.getEnd() == null) {
                        return false;
                    }

                    // Проверяваме дали е в седмицата
                    LocalDate eventDate = event.getStart().toLocalDate();
                    return !eventDate.isBefore(weekStart) && !eventDate.isAfter(weekEnd);
                })
                .collect(Collectors.toList());

        System.out.println(String.format("📊 Found %d total events for week calculation", allWeekEvents.size()));

        // СТЪПКА 2: Разделяме събитията на работни и отпуски
        List<Event> workEvents = new ArrayList<>();
        List<Event> paidLeaveEvents = new ArrayList<>();
        List<Event> unpaidLeaveEvents = new ArrayList<>();

        for (Event event : allWeekEvents) {
            String leaveType = event.getLeaveType();

            if (leaveType == null || leaveType.trim().isEmpty()) {
                // Работно събитие
                workEvents.add(event);
                System.out.println(String.format("✅ Work event: %s on %s",
                        event.getActivity(), event.getStart().toLocalDate()));
            } else if (isPaidLeaveType(leaveType)) {
                // Платен отпуск
                paidLeaveEvents.add(event);
                System.out.println(String.format("💰 Paid leave event: %s on %s",
                        leaveType, event.getStart().toLocalDate()));
            } else {
                // Неплатен отпуск
                unpaidLeaveEvents.add(event);
                System.out.println(String.format("🚫 Unpaid leave event: %s on %s",
                        leaveType, event.getStart().toLocalDate()));
            }
        }

        System.out.println(String.format("📊 Event breakdown: %d work, %d paid leave, %d unpaid leave",
                workEvents.size(), paidLeaveEvents.size(), unpaidLeaveEvents.size()));

        // СТЪПКА 3: Изчисляваме часовете от работните събития
        WeeklyHours workHours = calculateWeeklyHoursFromEvents(workEvents);
        System.out.println(String.format("⏰ Work events total: %.2f work hours, %.2f break hours",
                workHours.getWorkHours(), workHours.getBreakHours()));

        // СТЪПКА 4: Изчисляваме часовете от платените отпуски
        WeeklyHours paidLeaveHours = calculateHoursFromPaidLeave(paidLeaveEvents, employee);
        System.out.println(String.format("💰 Paid leave total: %.2f hours",
                paidLeaveHours.getWorkHours()));

        // СТЪПКА 5: Събираме общо часовете
        BigDecimal totalWorkHours = workHours.getWorkHours().add(paidLeaveHours.getWorkHours());
        BigDecimal totalBreakHours = workHours.getBreakHours(); // Почивките се добавят само от работните събития

        System.out.println(String.format("🎯 FINAL WEEKLY TOTALS: %.2f work hours (%.2f from work + %.2f from paid leave), %.2f break hours",
                totalWorkHours.doubleValue(),
                workHours.getWorkHours().doubleValue(),
                paidLeaveHours.getWorkHours().doubleValue(),
                totalBreakHours.doubleValue()));

        return new WeeklyHours(totalWorkHours, totalBreakHours);
    }

    /**
     * НОВА ПОМОЩНА ФУНКЦИЯ: Изчислява часовете от платените отпуски
     *
     * ЛОГИКА:
     * - За всеки ден с платен отпуск добавяме часовете от договора на служителя
     * - hourlyRate в Employee entity всъщност представлява часовете дневно (4, 6 или 8)
     *
     * @param paidLeaveEvents - списък с платени отпуски
     * @param employee - служителят (за достъп до часовете от договора)
     * @return обект с часовете от платените отпуски
     */
    private WeeklyHours calculateHoursFromPaidLeave(List<Event> paidLeaveEvents, Employee employee) {
        // Получаваме часовете дневно от договора (hourlyRate в този контекст означава часове дневно)
        Integer dailyContractHours = employee.getHourlyRate();
        if (dailyContractHours == null) {
            System.out.println("⚠️ Employee has no hourly rate set, defaulting to 8 hours per day");
            dailyContractHours = 8; // Default стойност
        }

        System.out.println(String.format("📋 Employee contract: %d hours per day", dailyContractHours));

        // Групираме платените отпуски по дни (в случай че има няколко събитиz в един ден)
        Map<LocalDate, List<Event>> leaveEventsByDay = paidLeaveEvents.stream()
                .collect(Collectors.groupingBy(event -> event.getStart().toLocalDate()));

        BigDecimal totalPaidLeaveHours = BigDecimal.ZERO;

        for (Map.Entry<LocalDate, List<Event>> entry : leaveEventsByDay.entrySet()) {
            LocalDate leaveDate = entry.getKey();
            List<Event> leavesForDay = entry.getValue();

            // За всеки ден с платен отпуск добавяме часовете от договора
            // (независимо от броя leave events в деня - един ден = една дневна норма)
            BigDecimal dailyLeaveHours = BigDecimal.valueOf(dailyContractHours);
            totalPaidLeaveHours = totalPaidLeaveHours.add(dailyLeaveHours);

            System.out.println(String.format("💰 Paid leave day %s: +%d hours (contract rate)",
                    leaveDate, dailyContractHours));

            // Логваме типовете отпуски за този ден
            String leaveTypes = leavesForDay.stream()
                    .map(Event::getLeaveType)
                    .distinct()
                    .collect(Collectors.joining(", "));
            System.out.println(String.format("   Types: %s", leaveTypes));
        }

        System.out.println(String.format("💰 Total paid leave hours for week: %.2f hours from %d days",
                totalPaidLeaveHours.doubleValue(), leaveEventsByDay.size()));

        // Платените отпуски не генерират почивки
        return new WeeklyHours(totalPaidLeaveHours, BigDecimal.ZERO);
    }

    /**
     * ОБНОВЕНА ФУНКЦИЯ: Изчислява работните часове от списък със събития ВКЛЮЧИТЕЛНО платените отпуски
     *
     * @param events - списък със събития (може да включва и отпуски)
     * @param employee - служителят (за платените отпуски)
     * @return обект с работни и почивни часове
     */
    private WeeklyHours calculateWeeklyHoursFromEventsWithPaidLeave(List<Event> events, Employee employee) {
        System.out.println(String.format("🧮 Calculating hours from %d events (including potential paid leave)", events.size()));

        // Разделяме събитията на работни и отпуски
        List<Event> workEvents = new ArrayList<>();
        List<Event> paidLeaveEvents = new ArrayList<>();

        for (Event event : events) {
            String leaveType = event.getLeaveType();

            if (leaveType == null || leaveType.trim().isEmpty()) {
                workEvents.add(event);
            } else if (isPaidLeaveType(leaveType)) {
                paidLeaveEvents.add(event);
            }
            // Неплатените отпуски ги игнорираме
        }

        // Изчисляваме часовете от работните събития
        WeeklyHours workHours = calculateWeeklyHoursFromEvents(workEvents);

        // Изчисляваме часовете от платените отпуски
        WeeklyHours paidLeaveHours = calculateHoursFromPaidLeave(paidLeaveEvents, employee);

        // Събираме общо часовете
        BigDecimal totalWorkHours = workHours.getWorkHours().add(paidLeaveHours.getWorkHours());
        BigDecimal totalBreakHours = workHours.getBreakHours(); // Почивките само от работните събития

        System.out.println(String.format("✅ Combined totals: %.2fh work + %.2fh paid leave = %.2fh total, %.2fh break",
                workHours.getWorkHours().doubleValue(),
                paidLeaveHours.getWorkHours().doubleValue(),
                totalWorkHours.doubleValue(),
                totalBreakHours.doubleValue()));

        return new WeeklyHours(totalWorkHours, totalBreakHours);
    }

    /**
     * НОВА ПОМОЩНА ФУНКЦИЯ: Проверява дали даден тип отпуск е платен
     *
     * @param leaveType - типа отпуск
     * @return true ако е платен отпуск
     */
    private boolean isPaidLeaveType(String leaveType) {
        if (leaveType == null) {
            return false;
        }

        boolean isPaid = PAID_LEAVE_TYPES.contains(leaveType.trim());

        if (isPaid) {
            System.out.println(String.format("✅ '%s' is classified as PAID leave", leaveType));
        } else {
            System.out.println(String.format("🚫 '%s' is classified as UNPAID leave", leaveType));
        }

        return isPaid;
    }

    /**
     * ОРИГИНАЛНА ФУНКЦИЯ: Изчислява работните часове от списък със събития (БЕЗ отпуски)
     * Тази функция остава същата - работи само с работни събития
     *
     * @param events - списък със работни събития
     * @return обект с работни и почивни часове
     */
    private WeeklyHours calculateWeeklyHoursFromEvents(List<Event> events) {
        BigDecimal totalWorkHours = BigDecimal.ZERO;
        BigDecimal totalBreakHours = BigDecimal.ZERO;

        System.out.println(String.format("🧮 Calculating hours from %d work events", events.size()));

        for (Event event : events) {
            // Изчисляваме общата продължителност на смяната в часове
            long totalMinutes = ChronoUnit.MINUTES.between(event.getStart(), event.getEnd());
            BigDecimal totalShiftHours = BigDecimal.valueOf(totalMinutes).divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);

            // Определяме почивката и работните часове
            BigDecimal breakHours = BigDecimal.ZERO;
            BigDecimal workHours = totalShiftHours;

            if (totalShiftHours.compareTo(BigDecimal.valueOf(6)) > 0) {
                // Ако смяната е над 6 часа: почивка = 30 мин, работни часове = общо време - 30 мин
                breakHours = BigDecimal.valueOf(0.5); // 30 минути = 0.5 часа
                workHours = totalShiftHours.subtract(breakHours); // Изваждаме почивката от работните часове
            }
            // Ако смяната е точно 6 часа или по-малко: почивка = 0, работни часове = общо време

            totalWorkHours = totalWorkHours.add(workHours);
            totalBreakHours = totalBreakHours.add(breakHours);

            System.out.println(String.format("📊 Work event: %s -> %.2fh total, %.2fh work, %.2fh break",
                    event.getStart().toLocalDate(),
                    totalShiftHours.doubleValue(),
                    workHours.doubleValue(),
                    breakHours.doubleValue()));
        }

        System.out.println(String.format("✅ Work events totals: %.2fh work, %.2fh break",
                totalWorkHours.doubleValue(),
                totalBreakHours.doubleValue()));

        return new WeeklyHours(totalWorkHours, totalBreakHours);
    }

    /**
     * Получава всички седмици които засягат даден месец
     * @param year - година
     * @param month - месец (1-12)
     * @return списък с началните дати на седмиците (понеделници)
     */
    private List<LocalDate> getWeeksForMonth(Integer year, Integer month) {
        List<LocalDate> weeks = new ArrayList<>();

        // Първи ден от месеца
        LocalDate firstDayOfMonth = LocalDate.of(year, month, 1);
        // Последен ден от месеца
        LocalDate lastDayOfMonth = firstDayOfMonth.plusMonths(1).minusDays(1);

        // Намираме понеделника на първата седмица
        LocalDate weekStart = getWeekStartDate(firstDayOfMonth);

        // Добавяме всички седмици докато не излезем от месеца
        while (weekStart.isBefore(lastDayOfMonth) ||
                weekStart.plusDays(6).getMonthValue() == month) {
            weeks.add(weekStart);
            weekStart = weekStart.plusWeeks(1);
        }

        return weeks;
    }

    /**
     * Намира понеделника за дадена дата
     * @param date - дата
     * @return понеделника от седмицата на тази дата
     */
    private LocalDate getWeekStartDate(LocalDate date) {
        return date.with(java.time.DayOfWeek.MONDAY);
    }

    /**
     * Получава номера на седмицата в годината
     * @param date - дата
     * @return номер на седмицата (1-53)
     */
    private Integer getWeekNumber(LocalDate date) {
        WeekFields weekFields = WeekFields.of(java.time.DayOfWeek.MONDAY, 4);
        return date.get(weekFields.weekOfWeekBasedYear());
    }

    /**
     * Конвертира WeeklySchedule entity към DTO
     * @param weeklySchedule - entity обектът
     * @return DTO обектът
     */
    private WeeklyScheduleDto convertToDto(WeeklySchedule weeklySchedule) {
        return new WeeklyScheduleDto(
                weeklySchedule.getId(),
                weeklySchedule.getEmployee().getId(),
                weeklySchedule.getEmployee().getName() + " " + weeklySchedule.getEmployee().getLastname(),
                weeklySchedule.getWeekStartDate(),
                weeklySchedule.getWeekNumber(),
                weeklySchedule.getYear(),
                weeklySchedule.getPlannedHours(),
                weeklySchedule.getBreakHours(),
                weeklySchedule.getActualWorkHours()
        );
    }

    /**
     * Създава празен DTO за седмица без график
     * @param employee - служителят
     * @param weekStart - начало на седмицата
     * @return DTO с нулеви стойности
     */
    private WeeklyScheduleDto createEmptyWeekDto(Employee employee, LocalDate weekStart) {
        Integer weekNumber = getWeekNumber(weekStart);
        Integer year = weekStart.getYear();

        return new WeeklyScheduleDto(
                employee.getId(),
                employee.getName() + " " + employee.getLastname(),
                weekStart,
                weekNumber,
                year
        );
    }

    /**
     * Вътрешен клас за съхранение на часовете за една седмица
     */
    private static class WeeklyHours {
        private final BigDecimal workHours;
        private final BigDecimal breakHours;

        public WeeklyHours(BigDecimal workHours, BigDecimal breakHours) {
            this.workHours = workHours != null ? workHours : BigDecimal.ZERO;
            this.breakHours = breakHours != null ? breakHours : BigDecimal.ZERO;
        }

        public BigDecimal getWorkHours() { return workHours; }
        public BigDecimal getBreakHours() { return breakHours; }
    }

    /**
     * Връща всички седмични графици от базата данни (за всички служители)
     * @return списък с DTO обекти
     */
    @Transactional(readOnly = true)
    public List<WeeklyScheduleDto> getAllWeeklySchedules() {
        List<WeeklySchedule> schedules = weeklyScheduleRepository.findAll();
        return schedules.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    /**
     * Получава дневните работни часове за служител за определен период
     * Този метод чете от таблицата event и връща информация за всеки ден
     *
     * @param employeeId - ID на служителя
     * @param startDate - начална дата на периода
     * @param endDate - крайна дата на периода
     * @return списък с дневните работни часове за всеки ден в периода
     */
    @Transactional(readOnly = true)
    public List<DailyWorkHoursDto> getDailyWorkHours(Long employeeId, LocalDate startDate, LocalDate endDate) {
        System.out.println(String.format("📅 Getting daily work hours for employee %d from %s to %s (FIXED VERSION)",
                employeeId, startDate, endDate));

        // СТЪПКА 1: Намираме служителя
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found: " + employeeId));

        // СТЪПКА 2: ✅ ПОПРАВКА - Използваме EAGER loading вместо LAZY
        System.out.println("📋 Fetching events with EAGER loading...");

        // ОПЦИЯ 1: Използваме специфична заявка за този служител (по-ефективно)
        List<Event> allEmployeeEvents = eventRepository.findEventsByEmployeeIdWithEmployee(employeeId);

        // ОПЦИЯ 2: Ако нямаш време да добавиш новия метод, използвай това:
        // List<Event> allEmployeeEvents = eventRepository.findAllWithEmployee().stream()
        //     .filter(event -> event.getEmployee().getId().equals(employeeId))
        //     .collect(Collectors.toList());

        System.out.println(String.format("📊 Found %d total events for employee %d", allEmployeeEvents.size(), employeeId));

        // СТЪПКА 3: Филтрираме по дата (сега вече имаме Employee обектите заредени)
        List<Event> events = allEmployeeEvents.stream()
                .filter(event -> {
                    // Сега event.getEmployee() няма да е null!
                    if (event.getStart() == null) {
                        System.out.println("⚠️ Event with null start date: " + event.getId());
                        return false;
                    }

                    LocalDate eventDate = event.getStart().toLocalDate();
                    boolean inPeriod = !eventDate.isBefore(startDate) && !eventDate.isAfter(endDate);

                    if (inPeriod) {
                        System.out.println(String.format("✅ Including event: %s on %s (%s)",
                                event.getId(), eventDate,
                                event.getLeaveType() != null ? event.getLeaveType() : "Work"));
                    } else {
                        System.out.println(String.format("🚫 Excluding event: %s on %s (outside period)",
                                event.getId(), eventDate));
                    }

                    return inPeriod;
                })
                .collect(Collectors.toList());

        System.out.println(String.format("📋 Found %d events for employee in period %s to %s",
                events.size(), startDate, endDate));

        // СТЪПКА 4: DEBUG - Показваме всички събития за този период
        for (Event event : events) {
            System.out.println(String.format("🔍 DEBUG Event: ID=%d, Date=%s, Employee=%d, LeaveType=%s, Activity=%s",
                    event.getId(),
                    event.getStart().toLocalDate(),
                    event.getEmployee().getId(), // Сега това няма да е null!
                    event.getLeaveType(),
                    event.getActivity()));
        }

        // СТЪПКА 5: Създаваме map със събитията по дати за бърз достъп
        Map<LocalDate, Event> eventsByDate = new HashMap<>();
        for (Event event : events) {
            LocalDate eventDate = event.getStart().toLocalDate();
            eventsByDate.put(eventDate, event);

            System.out.println(String.format("📊 Mapped event on %s: %s (%s)",
                    eventDate,
                    event.getLeaveType() != null ? event.getLeaveType() : "Work",
                    event.getLeaveType() != null ? "Leave" :
                            String.format("%s - %s",
                                    event.getStart().toLocalTime(),
                                    event.getEnd().toLocalTime())));
        }

        // СТЪПКА 6: Създаваме списък с всички дни в периода
        List<DailyWorkHoursDto> dailyHours = new ArrayList<>();
        LocalDate currentDate = startDate;

        while (!currentDate.isAfter(endDate)) {
            DailyWorkHoursDto dayDto;

            // Проверяваме дали има събитие за този ден
            if (eventsByDate.containsKey(currentDate)) {
                Event event = eventsByDate.get(currentDate);

                // Проверяваме дали е отпуск или работен ден
                if (event.getLeaveType() != null && !event.getLeaveType().trim().isEmpty()) {
                    // Това е отпуск
                    dayDto = new DailyWorkHoursDto(currentDate, event.getLeaveType());
                    System.out.println(String.format("🏖️ %s: %s", currentDate, event.getLeaveType()));

                } else {
                    // Това е работен ден
                    LocalTime startTime = event.getStart().toLocalTime();
                    LocalTime endTime = event.getEnd().toLocalTime();
                    String activity = event.getActivity();

                    dayDto = new DailyWorkHoursDto(currentDate, startTime, endTime, activity);
                    System.out.println(String.format("💼 %s: %s - %s (%s)",
                            currentDate, startTime, endTime, activity));
                }
            } else {
                // Няма събитие за този ден = почивен ден
                dayDto = new DailyWorkHoursDto(currentDate); // Автоматично ще сложи "Day off"
                System.out.println(String.format("😴 %s: Day off", currentDate));
            }

            dailyHours.add(dayDto);
            currentDate = currentDate.plusDays(1); // Преминаваме към следващия ден
        }

        System.out.println(String.format("✅ Generated daily hours for %d days (FIXED VERSION)", dailyHours.size()));

        // ФИНАЛЕН DEBUG
        long workDays = dailyHours.stream().filter(d -> d.isWorkDay()).count();
        long dayOffs = dailyHours.stream().filter(d -> d.isDayOff()).count();
        long leaveDays = dailyHours.stream().filter(d -> d.getLeaveType() != null).count();

        System.out.println(String.format("📊 FINAL STATISTICS: %d work days, %d day offs, %d leave days",
                workDays, dayOffs, leaveDays));

        return dailyHours;
    }

    /**
     * Получава дневните работни часове за служител за цял месец
     * Удобен метод който автоматично изчислява началото и края на месеца
     *
     * @param employeeId - ID на служителя
     * @param year - година
     * @param month - месец (1-12)
     * @return списък с дневните работни часове за целия месец
     */
    @Transactional(readOnly = true)
    public List<DailyWorkHoursDto> getDailyWorkHoursForMonth(Long employeeId, Integer year, Integer month) {
        System.out.println(String.format("📅 Getting daily work hours for employee %d for month %d/%d",
                employeeId, month, year));

        // Изчисляваме началото и края на месеца
        LocalDate startOfMonth = LocalDate.of(year, month, 1);
        LocalDate endOfMonth = startOfMonth.withDayOfMonth(startOfMonth.lengthOfMonth());

        System.out.println(String.format("📊 Month period: %s to %s (%d days)",
                startOfMonth, endOfMonth, endOfMonth.getDayOfMonth()));

        // Използваме основния метод
        return getDailyWorkHours(employeeId, startOfMonth, endOfMonth);
    }

    /**
     * Получава дневните работни часове за служител за цяла седмица
     * Удобен метод за получаване на часовете за една седмица
     *
     * @param employeeId - ID на служителя
     * @param weekStartDate - началото на седмицата (понеделник)
     * @return списък с дневните работни часове за седмицата (7 дни)
     */
    @Transactional(readOnly = true)
    public List<DailyWorkHoursDto> getDailyWorkHoursForWeek(Long employeeId, LocalDate weekStartDate) {
        System.out.println(String.format("📅 Getting daily work hours for employee %d for week starting %s",
                employeeId, weekStartDate));

        // Изчисляваме края на седмицата (неделя)
        LocalDate weekEndDate = weekStartDate.plusDays(6);

        System.out.println(String.format("📊 Week period: %s to %s", weekStartDate, weekEndDate));

        // Използваме основния метод
        return getDailyWorkHours(employeeId, weekStartDate, weekEndDate);
    }
}