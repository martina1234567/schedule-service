package com.example.schedule.repository;

import com.example.schedule.entity.Activity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository интерфейс за Activity entity
 * Предоставя методи за работа с activities в базата данни
 */
@Repository
public interface ActivityRepository extends JpaRepository<Activity, Long> {

    /**
     * Намира всички активни дейности, подредени по display_order и име
     * @return списък с активни activities
     */
    @Query("SELECT a FROM Activity a WHERE a.isActive = true ORDER BY a.displayOrder ASC, a.name ASC")
    List<Activity> findAllActiveOrderedByDisplayOrderAndName();

    /**
     * Намира activity по име (case-insensitive)
     * @param name името на activity
     * @return Optional с activity или празен
     */
    @Query("SELECT a FROM Activity a WHERE LOWER(a.name) = LOWER(?1)")
    Optional<Activity> findByNameIgnoreCase(String name);

    /**
     * Проверява дали съществува activity с дадено име (case-insensitive)
     * @param name името за проверка
     * @return true ако съществува
     */
    @Query("SELECT COUNT(a) > 0 FROM Activity a WHERE LOWER(a.name) = LOWER(?1)")
    boolean existsByNameIgnoreCase(String name);

    /**
     * Намира всички активни дейности
     * @return списък с активни activities
     */
    List<Activity> findByIsActiveTrueOrderByDisplayOrderAscNameAsc();

    /**
     * Намира максималния display_order за да може да добавим нова activity в края
     * @return максималния display_order или null ако няма activities
     */
    @Query("SELECT MAX(a.displayOrder) FROM Activity a")
    Integer findMaxDisplayOrder();
}