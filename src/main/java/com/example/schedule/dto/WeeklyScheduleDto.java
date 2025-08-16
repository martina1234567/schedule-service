package com.example.schedule.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO за предаване на седмични данни към frontend-а
 * Съдържа информация за една седмица от графика на служителя
 */
public class WeeklyScheduleDto {

    private Long id;
    private Long employeeId;
    private String employeeName;

    // Седмица информация
    private LocalDate weekStartDate;    // Понеделник
    private LocalDate weekEndDate;      // Неделя
    private Integer weekNumber;         // Номер на седмицата (1-53)
    private Integer year;              // Година
    private String weekLabel;          // Етикет за показване (напр. "К.С. 27")

    // Часове информация
    private BigDecimal plannedHours;    // Планувани работни часове (без почивки)
    private BigDecimal breakHours;      // Часове почивки
    private BigDecimal totalHours;      // Общо часове (работни + почивки)
    private BigDecimal actualWorkHours; // Действителни работни часове

    // Статус информация
    private boolean isCurrentWeek;      // Дали е текущата седмица
    private boolean hasSchedule;        // Дали има планиран график
    private int workDaysCount;          // Брой работни дни в седмицата

    public WeeklyScheduleDto() {}

    public WeeklyScheduleDto(Long employeeId, String employeeName, LocalDate weekStartDate,
                             Integer weekNumber, Integer year) {
        this.employeeId = employeeId;
        this.employeeName = employeeName;
        this.weekStartDate = weekStartDate;
        this.weekEndDate = weekStartDate.plusDays(6); // Неделя
        this.weekNumber = weekNumber;
        this.year = year;
        this.weekLabel = "К.С. " + weekNumber;
        this.plannedHours = BigDecimal.ZERO;
        this.breakHours = BigDecimal.ZERO;
        this.totalHours = BigDecimal.ZERO;
        this.actualWorkHours = BigDecimal.ZERO;
        this.hasSchedule = false;
        this.isCurrentWeek = isCurrentWeekCalculated();
        this.workDaysCount = 0;
    }

    public WeeklyScheduleDto(Long id, Long employeeId, String employeeName,
                             LocalDate weekStartDate, Integer weekNumber, Integer year,
                             BigDecimal plannedHours, BigDecimal breakHours, BigDecimal actualWorkHours) {
        this.id = id;
        this.employeeId = employeeId;
        this.employeeName = employeeName;
        this.weekStartDate = weekStartDate;
        this.weekEndDate = weekStartDate.plusDays(6);
        this.weekNumber = weekNumber;
        this.year = year;
        this.weekLabel = "К.С. " + weekNumber;
        this.plannedHours = plannedHours != null ? plannedHours : BigDecimal.ZERO;
        this.breakHours = breakHours != null ? breakHours : BigDecimal.ZERO;
        this.actualWorkHours = actualWorkHours != null ? actualWorkHours : BigDecimal.ZERO;
        this.totalHours = this.plannedHours.add(this.breakHours);
        this.hasSchedule = this.plannedHours.compareTo(BigDecimal.ZERO) > 0;
        this.isCurrentWeek = isCurrentWeekCalculated();
        this.workDaysCount = 0;
    }

    /**
     * Проверява дали седмицата е текущата
     */
    private boolean isCurrentWeekCalculated() {
        LocalDate now = LocalDate.now();
        return !now.isBefore(weekStartDate) && !now.isAfter(weekEndDate);
    }

    public String getFormattedPlannedHours() {
        if (plannedHours == null) return "0";
        if (plannedHours.stripTrailingZeros().scale() <= 0) {
            return plannedHours.toBigInteger().toString();
        }
        return plannedHours.toString();
    }

    public String getFormattedTotalHours() {
        if (totalHours == null) return "0";
        if (totalHours.stripTrailingZeros().scale() <= 0) {
            return totalHours.toBigInteger().toString();
        }
        return totalHours.toString();
    }

    public String getWeekDescription() {
        return String.format("%s (%s - %s)",
                weekLabel,
                formatDateShort(weekStartDate),
                formatDateShort(weekEndDate));
    }

    private String formatDateShort(LocalDate date) {
        return String.format("%02d.%02d", date.getDayOfMonth(), date.getMonthValue());
    }

    // Getters и Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }

    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }

    public LocalDate getWeekStartDate() { return weekStartDate; }
    public void setWeekStartDate(LocalDate weekStartDate) {
        this.weekStartDate = weekStartDate;
        this.weekEndDate = weekStartDate != null ? weekStartDate.plusDays(6) : null;
        this.isCurrentWeek = isCurrentWeekCalculated();
    }

    public LocalDate getWeekEndDate() { return weekEndDate; }
    public void setWeekEndDate(LocalDate weekEndDate) { this.weekEndDate = weekEndDate; }

    public Integer getWeekNumber() { return weekNumber; }
    public void setWeekNumber(Integer weekNumber) {
        this.weekNumber = weekNumber;
        this.weekLabel = "К.С. " + weekNumber;
    }

    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }

    public String getWeekLabel() { return weekLabel; }
    public void setWeekLabel(String weekLabel) { this.weekLabel = weekLabel; }

    public BigDecimal getPlannedHours() { return plannedHours; }
    public void setPlannedHours(BigDecimal plannedHours) {
        this.plannedHours = plannedHours;
        updateTotalHours();
        this.hasSchedule = plannedHours != null && plannedHours.compareTo(BigDecimal.ZERO) > 0;
    }

    public BigDecimal getBreakHours() { return breakHours; }
    public void setBreakHours(BigDecimal breakHours) {
        this.breakHours = breakHours;
        updateTotalHours();
    }

    public BigDecimal getTotalHours() { return totalHours; }
    public void setTotalHours(BigDecimal totalHours) { this.totalHours = totalHours; }

    public BigDecimal getActualWorkHours() { return actualWorkHours; }
    public void setActualWorkHours(BigDecimal actualWorkHours) { this.actualWorkHours = actualWorkHours; }

    public boolean isCurrentWeek() { return isCurrentWeek; }
    public void setCurrentWeek(boolean currentWeek) { isCurrentWeek = currentWeek; }

    public boolean isHasSchedule() { return hasSchedule; }
    public void setHasSchedule(boolean hasSchedule) { this.hasSchedule = hasSchedule; }

    public int getWorkDaysCount() { return workDaysCount; }
    public void setWorkDaysCount(int workDaysCount) { this.workDaysCount = workDaysCount; }

    private void updateTotalHours() {
        BigDecimal planned = this.plannedHours != null ? this.plannedHours : BigDecimal.ZERO;
        BigDecimal breaks = this.breakHours != null ? this.breakHours : BigDecimal.ZERO;
        this.totalHours = planned.add(breaks);
    }

    @Override
    public String toString() {
        return String.format("WeeklyScheduleDto{weekLabel='%s', plannedHours=%s, totalHours=%s, hasSchedule=%s}",
                weekLabel, plannedHours, totalHours, hasSchedule);
    }
}
