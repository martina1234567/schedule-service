package com.example.schedule.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor

@Builder
public class EmployeeDto {
    private Long id;


    public EmployeeDto(Long id, String name, String lastname, String email, String position, Integer hourlyRate) {
        this.id = id;
        this.name = name;
        this.lastname = lastname;
        this.email = email;
        this.position = position;
        this.hourlyRate = hourlyRate;
    }

    @NotBlank
    private String name;

    private String lastname;

    @Email
    @NotBlank
    private String email;

    private String position;

    private Integer hourlyRate;

    public Long getId() {
        return id;
    }
    public String getEmail() {
        return email;
    }

    public String getPosition() {
        return position;
    }

    public String getName() {
        return name;
    }

    public String getLastname() {
        return lastname;
    }

    public Integer getHourlyRate() {
        return hourlyRate;
    }

}
