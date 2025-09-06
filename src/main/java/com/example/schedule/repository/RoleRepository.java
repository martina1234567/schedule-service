package com.example.schedule.repository;

import com.example.schedule.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * REPOSITORY ИНТЕРФЕЙС ЗА ROLE ENTITY
 * Предоставя методи за работа с роли в базата данни
 * Наследява JpaRepository за основни CRUD операции
 *
 * @author Schedule Management System
 * @version 1.0
 */
@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {

    /**
     * Намира роля по име
     * @param name името на ролята (admin, user)
     * @return Optional<Role> - роля или празен резултат
     */
    Optional<Role> findByName(String name);

    /**
     * Проверява дали съществува роля с даденото име
     * @param name името на ролята за проверка
     * @return true ако ролята съществува, false ако не
     */
    boolean existsByName(String name);

    /**
     * Намира роля по име (case-insensitive)
     * Полезно когато не знаем точно как е записано името
     * @param name името на ролята
     * @return Optional<Role> - роля или празен резултат
     */
    @Query("SELECT r FROM Role r WHERE LOWER(r.name) = LOWER(?1)")
    Optional<Role> findByNameIgnoreCase(String name);

    /**
     * Намира всички активни роли
     * @return List<Role> - списък с активни роли
     */
    List<Role> findByIsActiveTrue();

    /**
     * Намира всички активни роли, подредени по име
     * @return List<Role> - списък с активни роли, подредени по име
     */
    @Query("SELECT r FROM Role r WHERE r.isActive = true ORDER BY r.name ASC")
    List<Role> findActiveRolesOrderedByName();

    /**
     * Брои колко потребители имат определена роля
     * @param roleName името на ролята
     * @return int - броя потребители с тази роля
     */
    @Query("SELECT COUNT(u) FROM User u JOIN u.roles r WHERE r.name = ?1")
    int countUsersByRoleName(String roleName);

    /**
     * Намира роля по ID, само ако е активна
     * @param id ID на ролята
     * @return Optional<Role> - активна роля или празен резултат
     */
    @Query("SELECT r FROM Role r WHERE r.id = ?1 AND r.isActive = true")
    Optional<Role> findActiveRoleById(Long id);
}