package com.example.schedule.repository;

import com.example.schedule.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * REPOSITORY ИНТЕРФЕЙС ЗА ROLE ENTITY
 *
 * Този интерфейс дефинира всички операции за достъп до данни
 * свързани с ролите в системата.
 *
 * Ролите определят правата на потребителите:
 * - ADMIN: пълни права за управление
 * - USER: основни права за използване на системата
 * - MANAGER: допълнителни права за управление на графици
 *
 * @author Schedule Management System
 * @version 1.0
 */
@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {

    // ===============================
    // ОСНОВНИ QUERY МЕТОДИ
    // ===============================

    /**
     * Намира роля по име
     * Използва се при присвояване на роли на потребители
     *
     * @param name името на ролята (ADMIN, USER, MANAGER)
     * @return Optional<Role> - ролята ако съществува
     */
    Optional<Role> findByName(String name);

    /**
     * Проверява дали съществува роля с даденото име
     *
     * @param name името на ролята
     * @return true ако съществува
     */
    boolean existsByName(String name);

    /**
     * Намира роля по име (case-insensitive)
     *
     * @param name името на ролята
     * @return Optional<Role> - ролята ако съществува
     */
    @Query("SELECT r FROM Role r WHERE UPPER(r.name) = UPPER(:name)")
    Optional<Role> findByNameIgnoreCase(@Param("name") String name);

    // ===============================
    // СПЕЦИАЛИЗИРАНИ QUERY МЕТОДИ
    // ===============================

    /**
     * Намира всички роли подредени по име
     *
     * @return списък с роли
     */
    List<Role> findAllByOrderByNameAsc();

    /**
     * Намира активни роли ако имаме поле isActive
     * За момента всички роли са активни по подразбиране
     *
     * @return списък с активни роли
     */
    @Query("SELECT r FROM Role r ORDER BY r.name")
    List<Role> findAllActiveRoles();

    // ===============================
    // АДМИНИСТРАТОРСКИ МЕТОДИ
    // ===============================

    /**
     * Намира ролята ADMIN
     * Бърз достъп до админ ролята
     *
     * @return Optional<Role> - админ ролята
     */
    @Query("SELECT r FROM Role r WHERE r.name = 'ADMIN'")
    Optional<Role> findAdminRole();

    /**
     * Намира ролята USER
     * Бърз достъп до user ролята
     *
     * @return Optional<Role> - user ролята
     */
    @Query("SELECT r FROM Role r WHERE r.name = 'USER'")
    Optional<Role> findUserRole();

    /**
     * Намира ролята MANAGER ако съществува
     *
     * @return Optional<Role> - manager ролята
     */
    @Query("SELECT r FROM Role r WHERE r.name = 'MANAGER'")
    Optional<Role> findManagerRole();

    // ===============================
    // СТАТИСТИЧЕСКИ МЕТОДИ
    // ===============================

    /**
     * Преброява потребителите с определена роля
     *
     * @param roleName името на ролята
     * @return броя потребители с тази роля
     */
    @Query("SELECT COUNT(u) FROM Role r JOIN r.users u WHERE r.name = :roleName")
    long countUsersByRoleName(@Param("roleName") String roleName);

    /**
     * Намира роли които не са присвоени на никой потребител
     *
     * @return списък с неизползвани роли
     */
    @Query("SELECT r FROM Role r WHERE r.users IS EMPTY")
    List<Role> findUnusedRoles();

    /**
     * Намира роли които имат поне един потребител
     *
     * @return списък с използвани роли
     */
    @Query("SELECT DISTINCT r FROM Role r WHERE r.users IS NOT EMPTY")
    List<Role> findUsedRoles();

    // ===============================
    // МЕТОДИ ЗА ВАЛИДАЦИЯ
    // ===============================

    /**
     * Проверява дали дадено име на роля е валидно
     * Валидни роли са: ADMIN, USER, MANAGER
     *
     * @param name името за проверка
     * @return true ако е валидно
     */
    @Query("SELECT CASE WHEN COUNT(r) > 0 THEN true ELSE false END FROM Role r " +
            "WHERE UPPER(r.name) IN ('ADMIN', 'USER', 'MANAGER') AND UPPER(r.name) = UPPER(:name)")
    boolean isValidRoleName(@Param("name") String name);

    // ===============================
    // ИНИЦИАЛИЗАЦИОННИ МЕТОДИ
    // ===============================

    /**
     * Проверява дали всички основни роли съществуват
     * Използва се при стартиране на приложението
     *
     * @return true ако всички основни роли са налични
     */
    @Query("SELECT CASE WHEN COUNT(r) >= 2 THEN true ELSE false END FROM Role r " +
            "WHERE r.name IN ('ADMIN', 'USER')")
    boolean allBasicRolesExist();

    /**
     * Намира липсващи основни роли
     * Помага при инициализация на системата
     *
     * @return списък с имена на липсващи роли
     */
    @Query("SELECT name FROM " +
            "(SELECT 'ADMIN' as name UNION SELECT 'USER' as name) AS basic_roles " +
            "WHERE name NOT IN (SELECT r.name FROM Role r)")
    List<String> findMissingBasicRoles();
}