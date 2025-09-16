package com.example.schedule.repository;

import com.example.schedule.entity.User;
import com.example.schedule.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * REPOSITORY ИНТЕРФЕЙС ЗА USER ENTITY
 *
 * Този интерфейс дефинира всички операции за достъп до данни
 * свързани с потребителите в системата.
 *
 * Spring Data JPA автоматично имплементира този интерфейс
 * и предоставя основните CRUD операции плюс custom заявки.
 *
 * СЪВМЕСТИМОСТ: Всички методи са съвместими с Employee entity структурата:
 * - Employee.name (вместо firstName)
 * - Employee.lastname (вместо lastName)
 * - Няма Employee.department поле
 *
 * @author Schedule Management System
 * @version 2.0
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // ===============================
    // ОСНОВНИ QUERY МЕТОДИ
    // ===============================

    /**
     * Намира потребител по потребителско име
     * Използва се при логин и регистрация за проверка на уникалност
     *
     * @param username потребителското име
     * @return Optional<User> - потребителя ако съществува
     */
    Optional<User> findByUsername(String username);

    /**
     * Проверява дали съществува потребител с даденото име
     * Полезно за бърза проверка без зареждане на целия обект
     *
     * @param username потребителското име
     * @return true ако съществува
     */
    boolean existsByUsername(String username);

    /**
     * Намира потребител по Employee entity
     * Един служител може да има само един потребителски акаунт
     *
     * @param employee служителя
     * @return Optional<User> - потребителя ако съществува
     */
    Optional<User> findByEmployee(Employee employee);

    /**
     * Намира потребител по employee ID
     * Алтернативен начин за търсене по служител
     *
     * @param employeeId ID на служителя
     * @return Optional<User> - потребителя ако съществува
     */
    @Query("SELECT u FROM User u WHERE u.employee.id = :employeeId")
    Optional<User> findByEmployeeId(@Param("employeeId") Long employeeId);

    /**
     * Проверява дали съществува потребител за даден служител
     *
     * @param employee служителя
     * @return true ако съществува
     */
    boolean existsByEmployee(Employee employee);

    // ===============================
    // ФИЛТРИРАНЕ ПО СТАТУС
    // ===============================

    /**
     * Връща всички активни потребители
     *
     * @return списък с активни потребители
     */
    List<User> findByIsActiveTrue();

    /**
     * Връща всички неактивни потребители
     *
     * @return списък с неактивни потребители
     */
    List<User> findByIsActiveFalse();

    /**
     * Връща потребители по активен статус
     *
     * @param isActive активен статус
     * @return списък с потребители
     */
    List<User> findByIsActive(Boolean isActive);

    // ===============================
    // ФИЛТРИРАНЕ ПО ДАТА
    // ===============================

    /**
     * Намира потребители създадени след определена дата
     *
     * @param date датата за сравнение
     * @return списък с потребители
     */
    List<User> findByCreatedAtAfter(LocalDateTime date);

    /**
     * Намира потребители които са влизали след определена дата
     *
     * @param date датата за сравнение
     * @return списък с потребители
     */
    List<User> findByLastLoginAfter(LocalDateTime date);

    /**
     * Намира потребители които НЕ са влизали от определена дата
     *
     * @param date датата за сравнение
     * @return списък с потребители
     */
    List<User> findByLastLoginBeforeOrLastLoginIsNull(LocalDateTime date);

    // ===============================
    // СЛОЖНИ ЗАЯВКИ С @Query
    // ===============================

    /**
     * Намира всички потребители с техните Employee данни
     * Използва JOIN за оптимизация на заявките
     */
    @Query("SELECT u FROM User u JOIN FETCH u.employee e")
    List<User> findAllUsersWithEmployeeData();

    /**
     * Намира всички потребители с техните роли
     * Използва JOIN FETCH за eager loading на ролите
     */
    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.roles")
    List<User> findAllUsersWithRoles();

    /**
     * Намира потребители по име на роля
     *
     * @param roleName името на ролята
     * @return списък с потребители имащи тази роля
     */
    @Query("SELECT u FROM User u JOIN u.roles r WHERE r.name = :roleName")
    List<User> findByRoleName(@Param("roleName") String roleName);

    /**
     * Намира всички администратори в системата
     *
     * @return списък с admin потребители
     */
    @Query("SELECT u FROM User u JOIN u.roles r WHERE r.name = 'ADMIN'")
    List<User> findAllAdmins();

    /**
     * Намира всички обикновени потребители
     *
     * @return списък с user потребители
     */
    @Query("SELECT u FROM User u JOIN u.roles r WHERE r.name = 'USER'")
    List<User> findAllUsers();

    /**
     * Преброява потребителите по роля
     *
     * @param roleName името на ролята
     * @return броя потребители с тази роля
     */
    @Query("SELECT COUNT(u) FROM User u JOIN u.roles r WHERE r.name = :roleName")
    long countByRoleName(@Param("roleName") String roleName);

    // ===============================
    // СТАТИСТИЧЕСКИ ЗАЯВКИ
    // ===============================

    /**
     * Преброява всички активни потребители
     *
     * @return броя активни потребители
     */
    long countByIsActiveTrue();

    /**
     * Преброява всички неактивни потребители
     *
     * @return броя неактивни потребители
     */
    long countByIsActiveFalse();

    /**
     * Намира потребители които никога не са влизали
     *
     * @return списък с потребители без логин
     */
    List<User> findByLastLoginIsNull();

    /**
     * Преброява потребителите които никога не са влизали
     *
     * @return броя потребители без логин
     */
    long countByLastLoginIsNull();

    // ===============================
    // SEARCH И FILTERING
    // ===============================

    /**
     * Търси потребители по част от потребителското име
     * Case-insensitive търсене
     *
     * @param username част от потребителското име
     * @return списък с намерени потребители
     */
    @Query("SELECT u FROM User u WHERE LOWER(u.username) LIKE LOWER(CONCAT('%', :username, '%'))")
    List<User> findByUsernameContainingIgnoreCase(@Param("username") String username);

    /**
     * Търси потребители по име на служителя
     * СЪВМЕСТИМОСТ: Използва Employee.name и Employee.lastname полета
     *
     * @param name първо име (Employee.name)
     * @param lastname фамилия (Employee.lastname)
     * @return списък с намерени потребители
     */
    @Query("SELECT u FROM User u JOIN u.employee e WHERE " +
            "LOWER(e.name) LIKE LOWER(CONCAT('%', :name, '%')) AND " +
            "LOWER(e.lastname) LIKE LOWER(CONCAT('%', :lastname, '%'))")
    List<User> findByEmployeeNameContaining(@Param("name") String name,
                                            @Param("lastname") String lastname);

    // ===============================
    // ОПЕРАЦИИ ЗА МАСОВА АКТУАЛИЗАЦИЯ
    // ===============================

    /**
     * Актуализира последния логин за потребител
     *
     * @param userId ID на потребителя
     * @param loginTime времето на логин
     * @return броя актуализирани записи
     */
    @Modifying
    @Query("UPDATE User u SET u.lastLogin = :loginTime, u.updatedAt = :loginTime WHERE u.id = :userId")
    int updateLastLogin(@Param("userId") Long userId, @Param("loginTime") LocalDateTime loginTime);

    // ===============================
    // ПРОВЕРКИ ЗА ВАЛИДАЦИЯ
    // ===============================

    /**
     * Проверява дали потребителското име се използва от друг потребител
     * Полезно при редактиране на акаунт
     *
     * @param username потребителското име
     * @param userId ID на текущия потребител
     * @return true ако име се използва от друг
     */
    @Query("SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM User u " +
            "WHERE u.username = :username AND u.id != :userId")
    boolean existsByUsernameAndIdNot(@Param("username") String username, @Param("userId") Long userId);

    // ===============================
    // CUSTOM МЕТОДИ ЗА СЛОЖНИ ОПЕРАЦИИ
    // ===============================

    /**
     * Намира всички потребители с пълна информация за показване в админ панел
     * Включва Employee и Role данни
     */
    @Query("SELECT DISTINCT u FROM User u " +
            "LEFT JOIN FETCH u.employee e " +
            "LEFT JOIN FETCH u.roles r " +
            "ORDER BY u.createdAt DESC")
    List<User> findAllUsersWithFullInfo();

    /**
     * Намира последно създадените потребители
     *
     * @param limit максимален брой резултати
     * @return списък с последните потребители
     */
    @Query(value = "SELECT * FROM users u ORDER BY u.created_at DESC LIMIT :limit", nativeQuery = true)
    List<User> findLatestUsers(@Param("limit") int limit);

    /**
     * Намира потребители които не са влизали в системата
     * в последните X дни
     *
     * @param cutoffDate дата преди която се считат за неактивни
     * @return списък с неактивни потребители
     */
    @Query("SELECT u FROM User u WHERE u.lastLogin IS NULL OR u.lastLogin < :cutoffDate")
    List<User> findInactiveUsers(@Param("cutoffDate") LocalDateTime cutoffDate);

    // ===============================
    // СПЕЦИАЛНИ МЕТОДИ ЗА AUTH SERVICE
    // ===============================

    /**
     * Намира активен потребител по username
     * Комбинира проверка за съществуване и активен статус
     *
     * @param username потребителското име
     * @return Optional<User> - активен потребител ако съществува
     */
    @Query("SELECT u FROM User u WHERE u.username = :username AND u.isActive = true")
    Optional<User> findActiveUserByUsername(@Param("username") String username);

    // ===============================
// ДОПЪЛНИТЕЛНИ МЕТОДИ ЗА USERREPOSITORY.JAVA
// Тези методи трябва да се добавят в съществуващия UserRepository интерфейс
// ===============================

    /**
     * БРОЙ ПОТРЕБИТЕЛИ ПО АКТИВЕН СТАТУС
     *
     * @param isActive активен статус
     * @return брой потребители с този статус
     */
    long countByIsActive(Boolean isActive);

    /**
     * НАМИРА ПОТРЕБИТЕЛ ПО EMPLOYEE ID
     *
     * @param employeeId ID на служителя
     * @return Optional<User> - потребителя ако съществува
     */
    @Query("SELECT u FROM User u WHERE u.employee.id = :employeeId")
    Optional<User> findByEmployee_Id(@Param("employeeId") Long employeeId);

// ===============================
// ЗАБЕЛЕЖКА: Тези методи трябва да се добавят в UserRepository.java
// в съществуващия интерфейс заедно с другите методи
// ===============================
}