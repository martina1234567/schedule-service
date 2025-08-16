package com.example.schedule.repository;

import com.example.schedule.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    // Може да добавиш и специфични методи за търсене, ако е необходимо
    Employee findByName(String name);
}
