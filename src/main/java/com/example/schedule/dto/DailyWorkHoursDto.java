package com.example.schedule.dto;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * DTO за дневните работни часове
 * Съдържа информация за работните часове за конкретен ден
 */
public class DailyWorkHoursDto {

    private LocalDate date;           // Датата на деня
    private LocalTime startTime;      // Час на започване на работа
    private LocalTime endTime;        // Час на завършване на работа
    private String workHours;         // Форматиран текст "08:00 - 16:00" или "Day off"
    private String activity;          // Дейността (Cashier, Manager, и т.н.)
    private String leaveType;         // Типа отпуск ако има
    private boolean isWorkDay;        // Дали е работен ден
    private boolean isDayOff;         // Дали е почивен ден

    // Конструктори
    public DailyWorkHoursDto() {}

    /**
     * Конструктор за работен ден
     * @param date - датата
     * @param startTime - час на започване
     * @param endTime - час на завършване
     * @param activity - дейността
     */
    public DailyWorkHoursDto(LocalDate date, LocalTime startTime, LocalTime endTime, String activity) {
        this.date = date;
        this.startTime = startTime;
        this.endTime = endTime;
        this.activity = activity;
        this.isWorkDay = true;
        this.isDayOff = false;
        this.workHours = formatWorkHours(startTime, endTime);
    }

    /**
     * Конструктор за почивен ден
     * @param date - датата
     */
    public DailyWorkHoursDto(LocalDate date) {
        this.date = date;
        this.isWorkDay = false;
        this.isDayOff = true;
        this.workHours = "Day off";
    }

    /**
     * Конструктор за отпуск
     * @param date - датата
     * @param leaveType - типа отпуск
     */
    public DailyWorkHoursDto(LocalDate date, String leaveType) {
        this.date = date;
        this.leaveType = leaveType;
        this.isWorkDay = false;
        this.isDayOff = false;
        this.workHours = leaveType; // "Paid leave", "Sick leave", etc.
    }

    /**
     * Форматира работните часове в текст
     * @param start - час на започване
     * @param end - час на завършване
     * @return форматиран текст "08:00 - 16:00"
     */
    private String formatWorkHours(LocalTime start, LocalTime end) {
        if (start == null || end == null) {
            return "Day off";
        }
        return String.format("%02d:%02d - %02d:%02d",
                start.getHour(), start.getMinute(),
                end.getHour(), end.getMinute());
    }

    // Getters и Setters
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public LocalTime getStartTime() { return startTime; }
    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
        this.workHours = formatWorkHours(startTime, endTime);
    }

    public LocalTime getEndTime() { return endTime; }
    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
        this.workHours = formatWorkHours(startTime, endTime);
    }

    public String getWorkHours() { return workHours; }
    public void setWorkHours(String workHours) { this.workHours = workHours; }

    public String getActivity() { return activity; }
    public void setActivity(String activity) { this.activity = activity; }

    public String getLeaveType() { return leaveType; }
    public void setLeaveType(String leaveType) { this.leaveType = leaveType; }

    public boolean isWorkDay() { return isWorkDay; }
    public void setWorkDay(boolean workDay) { isWorkDay = workDay; }

    public boolean isDayOff() { return isDayOff; }
    public void setDayOff(boolean dayOff) { isDayOff = dayOff; }

    @Override
    public String toString() {
        return String.format("DailyWorkHoursDto{date=%s, workHours='%s', activity='%s'}",
                date, workHours, activity);
    }
}