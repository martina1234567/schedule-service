package com.example.schedule.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.schedule.dto.EmployeeDto;
import com.example.schedule.entity.Employee;
import com.example.schedule.entity.HourlyRate;
import com.example.schedule.repository.EmployeeRepository;
import com.example.schedule.repository.HourlyRateRepository;

import jakarta.validation.Valid;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * REST Controller за управление на служители
 * Поправен за работа с HourlyRate entity вместо Integer
 */
@RestController
@RequestMapping("/employees")
@CrossOrigin(origins = "*") // Позволяваме CORS заявки от frontend
public class EmployeeController {

    private final EmployeeRepository employeeRepository;
    private final HourlyRateRepository hourlyRateRepository;

    @Autowired
    public EmployeeController(EmployeeRepository employeeRepository, HourlyRateRepository hourlyRateRepository) {
        this.employeeRepository = employeeRepository;
        this.hourlyRateRepository = hourlyRateRepository;
    }

    /**
     * Получава всички служители
     * GET /employees
     * @return List<EmployeeDto> - списък със всички служители (БЕЗ hourlyRate в DTO)
     */
    @GetMapping
    public ResponseEntity<List<EmployeeDto>> getAllEmployees() {
        try {
            List<EmployeeDto> employees = employeeRepository.findAll().stream()
                    .map(emp -> new EmployeeDto(
                            emp.getId(),
                            emp.getName(),
                            emp.getLastname(),
                            emp.getEmail(),
                            emp.getPosition()
                            // ПРЕМАХНАХМЕ hourlyRate от DTO
                    ))
                    .collect(Collectors.toList());

            System.out.println("✅ Returning " + employees.size() + " employees");
            return ResponseEntity.ok(employees);

        } catch (Exception e) {
            System.err.println("❌ Error fetching employees: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Създава нов служител
     * POST /employees
     * @param employeeDto данните за новия служител
     * @return EmployeeDto - създаденият служител
     */
    @PostMapping
    public ResponseEntity<?> createEmployee(@Valid @RequestBody EmployeeDto employeeDto) {
        try {
            // Валидация на входните данни
            if (employeeDto.getName() == null || employeeDto.getName().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Name is required");
            }

            if (employeeDto.getEmail() == null || employeeDto.getEmail().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Email is required");
            }

            // Проверка дали email вече съществува (case-insensitive)
            if (employeeRepository.existsByEmailIgnoreCase(employeeDto.getEmail())) {
                return ResponseEntity.badRequest().body("Employee with this email already exists");
            }

            // Създаваме Employee entity БЕЗ HourlyRate (ще се зададе отделно ако е нужно)
            Employee employee = new Employee(
                    employeeDto.getName(),
                    employeeDto.getLastname(),
                    employeeDto.getEmail(),
                    employeeDto.getPosition(),
                    null // Не задаваме HourlyRate при създаване
            );

            // Записваме в базата данни
            employee = employeeRepository.save(employee);

            // Връщаме DTO (БЕЗ hourlyRate)
            EmployeeDto responseDto = new EmployeeDto(
                    employee.getId(),
                    employee.getName(),
                    employee.getLastname(),
                    employee.getEmail(),
                    employee.getPosition()
            );

            System.out.println("✅ Created employee: " + employee.getName() + " " + employee.getLastname());
            return ResponseEntity.status(HttpStatus.CREATED).body(responseDto);

        } catch (Exception e) {
            System.err.println("❌ Error creating employee: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error creating employee");
        }
    }

    /**
     * Изтрива служител
     * DELETE /employees/{id}
     * @param id ID на служителя за изтриване
     * @return ResponseEntity<Void>
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEmployee(@PathVariable Long id) {
        try {
            if (!employeeRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }

            employeeRepository.deleteById(id);
            System.out.println("✅ Deleted employee with ID: " + id);
            return ResponseEntity.noContent().build();

        } catch (Exception e) {
            System.err.println("❌ Error deleting employee: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Актуализира служител
     * PUT /employees/{id}
     * @param id ID на служителя за актуализиране
     * @param employeeDto новите данни
     * @return EmployeeDto - актуализираният служител
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateEmployee(@PathVariable Long id, @Valid @RequestBody EmployeeDto employeeDto) {
        try {
            // Проверка дали служителят съществува
            Optional<Employee> existingEmployeeOpt = employeeRepository.findById(id);
            if (existingEmployeeOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Employee existingEmployee = existingEmployeeOpt.get();

            // Проверка за дублиран email (ако се променя) - изключваме текущия служител
            if (!existingEmployee.getEmail().equals(employeeDto.getEmail()) &&
                    employeeRepository.existsByEmailIgnoreCaseAndIdNot(employeeDto.getEmail(), id)) {
                return ResponseEntity.badRequest().body("Employee with this email already exists");
            }

            // Актуализираме данните (БЕЗ hourlyRate)
            existingEmployee.setName(employeeDto.getName());
            existingEmployee.setLastname(employeeDto.getLastname());
            existingEmployee.setEmail(employeeDto.getEmail());
            existingEmployee.setPosition(employeeDto.getPosition());
            // НЕ ПИПАМЕ hourlyRate - остава както е

            // Записваме промените
            Employee updatedEmployee = employeeRepository.save(existingEmployee);

            // Връщаме DTO (БЕЗ hourlyRate)
            EmployeeDto responseDto = new EmployeeDto(
                    updatedEmployee.getId(),
                    updatedEmployee.getName(),
                    updatedEmployee.getLastname(),
                    updatedEmployee.getEmail(),
                    updatedEmployee.getPosition()
            );

            System.out.println("✅ Updated employee: " + updatedEmployee.getName() + " " + updatedEmployee.getLastname());
            return ResponseEntity.ok(responseDto);

        } catch (Exception e) {
            System.err.println("❌ Error updating employee: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error updating employee");
        }
    }

    /**
     * Получава служител по ID
     * GET /employees/{id}
     * @param id ID на служителя
     * @return EmployeeDto или 404
     */
    @GetMapping("/{id}")
    public ResponseEntity<EmployeeDto> getEmployeeById(@PathVariable Long id) {
        try {
            Optional<Employee> employeeOpt = employeeRepository.findById(id);

            if (employeeOpt.isPresent()) {
                Employee employee = employeeOpt.get();
                EmployeeDto dto = new EmployeeDto(
                        employee.getId(),
                        employee.getName(),
                        employee.getLastname(),
                        employee.getEmail(),
                        employee.getPosition()
                );
                return ResponseEntity.ok(dto);
            } else {
                return ResponseEntity.notFound().build();
            }

        } catch (Exception e) {
            System.err.println("❌ Error fetching employee: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Получава пълните данни за служител включително hourly rate
     * GET /employees/{id}/with-hourly-rate
     */
    @GetMapping("/{id}/with-hourly-rate")
    public ResponseEntity<?> getEmployeeWithHourlyRate(@PathVariable Long id) {
        try {
            Optional<Employee> employeeOpt = employeeRepository.findById(id);

            if (employeeOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Employee employee = employeeOpt.get();

            // Създаваме response с hourly rate данните
            Map<String, Object> response = new HashMap<>();
            response.put("id", employee.getId());
            response.put("name", employee.getName());
            response.put("lastname", employee.getLastname());
            response.put("email", employee.getEmail());
            response.put("position", employee.getPosition());

            if (employee.getHourlyRate() != null) {
                Map<String, Object> hourlyRateData = new HashMap<>();
                hourlyRateData.put("id", employee.getHourlyRate().getId());
                hourlyRateData.put("rateName", employee.getHourlyRate().getRateName());
                hourlyRateData.put("dailyHours", employee.getHourlyRate().getDailyHours());
                response.put("hourlyRate", hourlyRateData);
            } else {
                response.put("hourlyRate", null);
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("❌ Error fetching employee with hourly rate: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * ОПЦИОНАЛНО: Метод за задаване на HourlyRate на служител
     * PUT /employees/{id}/hourly-rate/{hourlyRateId}
     * @param id ID на служителя
     * @param hourlyRateId ID на часовата ставка
     * @return потвърждение
     */
    @PutMapping("/{id}/hourly-rate/{hourlyRateId}")
    public ResponseEntity<?> assignHourlyRateToEmployee(@PathVariable Long id, @PathVariable Long hourlyRateId) {
        try {
            // Намираме служителя
            Optional<Employee> employeeOpt = employeeRepository.findById(id);
            if (employeeOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            // Намираме часовата ставка
            Optional<HourlyRate> hourlyRateOpt = hourlyRateRepository.findById(hourlyRateId);
            if (hourlyRateOpt.isEmpty()) {
                return ResponseEntity.badRequest().body("Hourly rate not found");
            }

            // Задаваме ставката на служителя
            Employee employee = employeeOpt.get();
            employee.setHourlyRate(hourlyRateOpt.get());
            employeeRepository.save(employee);

            System.out.println("✅ Assigned hourly rate " + hourlyRateOpt.get().getRateName() +
                    " to employee " + employee.getName());

            return ResponseEntity.ok().body("Hourly rate assigned successfully");

        } catch (Exception e) {
            System.err.println("❌ Error assigning hourly rate: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error assigning hourly rate");
        }
    }

    /**
     * ОПЦИОНАЛНО: Премахва часовата ставка от служител
     * DELETE /employees/{id}/hourly-rate
     * @param id ID на служителя
     * @return потвърждение
     */
    @DeleteMapping("/{id}/hourly-rate")
    public ResponseEntity<?> removeHourlyRateFromEmployee(@PathVariable Long id) {
        try {
            Optional<Employee> employeeOpt = employeeRepository.findById(id);
            if (employeeOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Employee employee = employeeOpt.get();
            employee.setHourlyRate(null);
            employeeRepository.save(employee);

            System.out.println("✅ Removed hourly rate from employee " + employee.getName());
            return ResponseEntity.ok().body("Hourly rate removed successfully");

        } catch (Exception e) {
            System.err.println("❌ Error removing hourly rate: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error removing hourly rate");
        }
    }
}