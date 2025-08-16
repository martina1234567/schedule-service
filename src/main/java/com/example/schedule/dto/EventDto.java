package com.example.schedule.dto;

import java.time.LocalDateTime;

public class EventDto {
    private Long id;
    private String title;
    private LocalDateTime start;
    private LocalDateTime end;
    private String activity;
    private String leaveType;
    private String employeeName;

    public EventDto(Long id, String title, LocalDateTime start, LocalDateTime end, String activity, String leaveType, String employeeName) {
        this.id = id;
        this.title = title;
        this.start = start;
        this.end = end;
        this.activity = activity;
        this.leaveType = leaveType;
        this.employeeName = employeeName;
    }

    // Getters (може и с lombok)
    public Long getId() { return id; }
    public String getTitle() { return title; }
    public LocalDateTime getStart() { return start; }
    public LocalDateTime getEnd() { return end; }
    public String getActivity() { return activity; }
    public String getLeaveType() { return leaveType;}
    public String getEmployeeName() { return employeeName; }
}
