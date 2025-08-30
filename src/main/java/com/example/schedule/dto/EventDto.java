package com.example.schedule.dto;

import java.time.LocalDateTime;

public class EventDto {
    private Long id;
    private String title;
    private LocalDateTime start;
    private LocalDateTime end;

    // ПРЕМАХНАТО: Старото activity String поле
    // private String activity;

    // НОВО: Полета за activity relationship
    private Long activityId;
    private String activityName;

    private String leaveType;
    private String employeeName;

    // =====================================
    // КОНСТРУКТОРИ
    // =====================================

    /**
     * Конструктор с activity entity данни
     */
    public EventDto(Long id, String title, LocalDateTime start, LocalDateTime end,
                    Long activityId, String activityName, String leaveType, String employeeName) {
        this.id = id;
        this.title = title;
        this.start = start;
        this.end = end;
        this.activityId = activityId;
        this.activityName = activityName;
        this.leaveType = leaveType;
        this.employeeName = employeeName;
    }

    /**
     * LEGACY конструктор за съвместимост със стария код
     * (за случаи където все още се подава activity като String)
     */
    public EventDto(Long id, String title, LocalDateTime start, LocalDateTime end,
                    String activityName, String leaveType, String employeeName) {
        this.id = id;
        this.title = title;
        this.start = start;
        this.end = end;
        this.activityId = null; // Няма ID ако се подава само името
        this.activityName = activityName;
        this.leaveType = leaveType;
        this.employeeName = employeeName;
    }

    // =====================================
    // GETTERS AND SETTERS
    // =====================================

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public LocalDateTime getStart() {
        return start;
    }

    public void setStart(LocalDateTime start) {
        this.start = start;
    }

    public LocalDateTime getEnd() {
        return end;
    }

    public void setEnd(LocalDateTime end) {
        this.end = end;
    }

    // НОВО: Activity ID getter/setter
    public Long getActivityId() {
        return activityId;
    }

    public void setActivityId(Long activityId) {
        this.activityId = activityId;
    }

    // НОВО: Activity name getter/setter
    public String getActivityName() {
        return activityName;
    }

    public void setActivityName(String activityName) {
        this.activityName = activityName;
    }

    // LEGACY: За съвместимост със стария код
    public String getActivity() {
        return activityName;
    }

    public void setActivity(String activity) {
        this.activityName = activity;
    }

    public String getLeaveType() {
        return leaveType;
    }

    public void setLeaveType(String leaveType) {
        this.leaveType = leaveType;
    }

    public String getEmployeeName() {
        return employeeName;
    }

    public void setEmployeeName(String employeeName) {
        this.employeeName = employeeName;
    }

    // =====================================
    // UTILITY МЕТОДИ
    // =====================================

    @Override
    public String toString() {
        return "EventDto{" +
                "id=" + id +
                ", title='" + title + '\'' +
                ", start=" + start +
                ", end=" + end +
                ", activityId=" + activityId +
                ", activityName='" + activityName + '\'' +
                ", leaveType='" + leaveType + '\'' +
                ", employeeName='" + employeeName + '\'' +
                '}';
    }
}