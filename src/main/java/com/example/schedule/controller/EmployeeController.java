package com.example.schedule.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.schedule.dto.EmployeeDto;
import com.example.schedule.entity.Employee;
import com.example.schedule.repository.EmployeeRepository;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/employees")
public class EmployeeController {

    private final EmployeeRepository employeeRepository;

    @Autowired  // Explicitly adding @Autowired
    public EmployeeController(EmployeeRepository employeeRepository) {
        this.employeeRepository = employeeRepository;
    }

    @GetMapping
    public List<EmployeeDto> getAllEmployees() {
        return employeeRepository.findAll().stream()
                .map(emp -> new EmployeeDto(emp.getId(), emp.getName(),emp.getLastname(), emp.getEmail(), emp.getPosition(), emp.getHourlyRate()))
                .collect(Collectors.toList());
    }

    @PostMapping
    public ResponseEntity<EmployeeDto> createEmployee(@RequestBody EmployeeDto employeeDto) {
        Employee employee = new Employee(null, employeeDto.getName(), employeeDto.getLastname(), employeeDto.getEmail(), employeeDto.getPosition(), employeeDto.getHourlyRate());
        employee = employeeRepository.save(employee);
        return ResponseEntity.ok(new EmployeeDto(employee.getId(), employee.getName(), employee.getLastname(),employee.getEmail(), employee.getPosition(), employee.getHourlyRate()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEmployee(@PathVariable Long id) {
        if (!employeeRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        employeeRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<EmployeeDto> updateEmployee(@PathVariable Long id, @RequestBody EmployeeDto employeeDto) {
        // Проверка дали служителят съществува
        if (!employeeRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        // Вземаме съществуващия служител
        Employee existingEmployee = employeeRepository.findById(id).orElseThrow();

        // Актуализираме всички полета освен id
        existingEmployee.setName(employeeDto.getName());
        existingEmployee.setLastname(employeeDto.getLastname());
        existingEmployee.setEmail(employeeDto.getEmail());
        existingEmployee.setPosition(employeeDto.getPosition());
        existingEmployee.setHourlyRate(employeeDto.getHourlyRate());

        // Записваме промените
        employeeRepository.save(existingEmployee);

        // Връщаме обновените данни
        return ResponseEntity.ok(new EmployeeDto(
                existingEmployee.getId(),
                existingEmployee.getName(),
                existingEmployee.getLastname(),
                existingEmployee.getEmail(),
                existingEmployee.getPosition(),
                existingEmployee.getHourlyRate()
        ));
    }


}

