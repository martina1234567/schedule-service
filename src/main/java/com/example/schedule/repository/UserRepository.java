package com.example.schedule.repository;

import com.example.schedule.entity.User;
import com.example.schedule.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * REPOSITORY ИНТЕРФЕЙС ЗА USER ENTITY
 * Предоставя методи за работа с потребители в базата данни
 * Наследява JpaRepository за основни CRUD операции
 *
 * @author Schedule Management System
 * @version 1.0
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // ===============================
    // ОСНОВНИ ТЪРСЕНИЯ ПО ПОТРЕБИТЕЛСКО ИМЕ
    // ===============================

    /**
     * Намира потребител по потребителско име
     * Използва се за логин операции
     * @param username потребителското име
     * @return Optional<User> - потребител или празен резултат
     */
    Optional<User> findByUsername(String username);

    /**
     * Проверява дали съществува потребител с даденото име
     * @param username потребителското име за проверка
     * @return true ако потребителят съществува, false ако не
     */
    boolean existsByUsername(String username);

    /**
     * Намира потребител по потребителско име (case-insensitive)
     * @param username потребителското име
     * @return Optional<User> - потребител или празен резултат
     */
    @Query("SELECT u FROM User u WHERE LOWER(u.username) = LOWER(?1)")
    Optional<User> findByUsernameIgnoreCase(String username);

    // ===============================
    // ТЪРСЕНИЯ ПО СЛУЖИТЕЛ
    // ===============================

    /**
     * Намира потребител по служител
     * Един служител може да има само един потребителски акаунт
     * @param employee служителя
     * @return Optional<User> - потребител или празен резултат
     */
    Optional<User> findByEmployee(Employee employee);

    /**
     * Намира потребител по ID на служител
     * @param employeeId ID на служителя
     * @return Optional<User> - потребител или празен резултат
     */
    Optional<User> findByEmployeeId(Long employeeId);

    /**
     * Проверява дали даден служител вече има потребителски акаунт
     * @param employee служителя за проверка
     * @return true ако служителят има акаунт, false ако няма
     */
    boolean existsByEmployee(Employee employee);

    /**
     * Проверява дали служител с дадено ID има потребителски акаунт
     * @param employeeId ID на служителя
     * @return true ако служителят има акаунт, false ако няма
     */
    boolean existsByEmployeeId(Long employeeId);

    // ===============================
    // ТЪРСЕНИЯ ПО АКТИВНОСТ И РОЛИ
    // ===============================

    /**
     * Намира всички активни потребители
     * @return List<User> - списък с активни потребители
     */
    List<User> findByIsActiveTrue();

    /**
     * Намира потребител по потребителско име, само ако е активен
     * Използва се за логин - деактивирани потребители не могат да влизат
     * @param username потребителското име
     * @return Optional<User> - активен потребител или празен резултат
     */
    @Query("SELECT u FROM User u WHERE u.username = ?1 AND u.isActive = true")
    Optional<User> findActiveUserByUsername(String username);

    /**
     * Намира всички потребители с определена роля
     * @param roleName името на ролята (admin, user)
     * @return List<User> - списък с потребители с тази роля
     */
    @Query("SELECT u FROM User u JOIN u.roles r WHERE r.name = ?1")
    List<User> findByRoleName(String roleName);

    /**
     * Намира всички активни администратори
     * @return List<User> - списък с активни админи
     */
    @Query("SELECT u FROM User u JOIN u.roles r WHERE r.name = 'admin' AND u.isActive = true")
    List<User> findActiveAdmins();

    // ===============================
    // СТАТИСТИКИ И ОТЧЕТИ
    // ===============================

    /**
     * Брои всички активни потребители
     * @return int - броя активни потребители
     */
    int countByIsActiveTrue();

    /**
     * Брои потребителите създадени в даден период
     * @param startDate начална дата
     * @param endDate крайна дата
     * @return int - броя потребители създадени в периода
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.createdAt BETWEEN ?1 AND ?2")
    int countUsersCreatedBetween(LocalDateTime startDate, LocalDateTime endDate);

    /**
     * Намира потребителите които са влизали наскоро
     * @param sinceDate дата от която да търси
     * @return List<User> - потребители влизали след тази дата
     */
    @Query("SELECT u FROM User u WHERE u.lastLogin > ?1 ORDER BY u.lastLogin DESC")
    List<User> findUsersLoggedInSince(LocalDateTime sinceDate);

    // ===============================
    // СПЕЦИАЛНИ ЗАЯВКИ ЗА ВАЛИДАЦИЯ
    // ===============================

    /**
     * Проверява дали потребителско име е заето от друг потребител (при актуализиране)
     * @param username потребителското име за проверка
     * @param excludeId ID на потребителя, който да изключим от проверката
     * @return true ако името е заето от друг потребител
     */
    @Query("SELECT COUNT(u) > 0 FROM User u WHERE u.username = :username AND u.id != :excludeId")
    boolean existsByUsernameAndIdNot(@Param("username") String username, @Param("excludeId") Long excludeId);

    /**
     * Намира служители които все още нямат потребителски акаунти
     * Полезно за dropdown в registration формата
     * @return List<Employee> - служители без потребителски акаунти
     */
    @Query("SELECT e FROM Employee e WHERE e.id NOT IN (SELECT u.employee.id FROM User u WHERE u.employee IS NOT NULL)")
    List<Employee> findEmployeesWithoutUserAccounts();
}