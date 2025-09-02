package com.example.schedule.repository;

import com.example.schedule.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository интерфейс за Employee entity
 * Добавени методи за работа с email валидация
 */
@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    /**
     * Намира служител по име
     * @param name името на служителя
     * @return Employee или null
     */
    Employee findByName(String name);

    /**
     * Намира служител по email адрес
     * @param email email адресът на служителя
     * @return Optional<Employee>
     */
    Optional<Employee> findByEmail(String email);

    /**
     * Проверява дали съществува служител с даден email адрес
     * @param email email адресът за проверка
     * @return boolean - true ако съществува, false ако не
     */
    boolean existsByEmail(String email);

    /**
     * Проверява дали съществува служител с даден email адрес (case-insensitive)
     * @param email email адресът за проверка
     * @return boolean - true ако съществува, false ако не
     */
    @Query("SELECT COUNT(e) > 0 FROM Employee e WHERE LOWER(e.email) = LOWER(:email)")
    boolean existsByEmailIgnoreCase(@Param("email") String email);

    /**
     * Намира служител по email адрес (case-insensitive)
     * @param email email адресът на служителя
     * @return Optional<Employee>
     */
    @Query("SELECT e FROM Employee e WHERE LOWER(e.email) = LOWER(:email)")
    Optional<Employee> findByEmailIgnoreCase(@Param("email") String email);

    /**
     * Проверява дали съществува служител с даден email адрес, изключвайки конкретен ID
     * Полезно при актуализиране на служител - да проверим дали новият email не е зает от друг
     * @param email email адресът за проверка
     * @param excludeId ID на служителя, който да изключим от проверката
     * @return boolean - true ако съществува друг служител с този email
     */
    @Query("SELECT COUNT(e) > 0 FROM Employee e WHERE LOWER(e.email) = LOWER(:email) AND e.id != :excludeId")
    boolean existsByEmailIgnoreCaseAndIdNot(@Param("email") String email, @Param("excludeId") Long excludeId);

    /**
     * Намира всички служители по позиция
     * @param position позицията на служителите
     * @return списък със служители с тази позиция
     */
    @Query("SELECT e FROM Employee e WHERE e.position = :position ORDER BY e.name ASC")
    Optional<Employee> findByPosition(@Param("position") String position);

    /**
     * Намира всички активни служители (които имат зададена HourlyRate)
     * @return списък с активни служители
     */
    @Query("SELECT e FROM Employee e WHERE e.hourlyRate IS NOT NULL ORDER BY e.name ASC")
    Optional<Employee> findActiveEmployees();

    /**
     * Брои служителите по позиция
     * @param position позицията за броене
     * @return броя служители с тази позиция
     */
    @Query("SELECT COUNT(e) FROM Employee e WHERE e.position = :position")
    Long countByPosition(@Param("position") String position);
}