package com.example.schedule.repository;

import com.example.schedule.entity.HourlyRate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository интерфейс за HourlyRate entity
 * Подобен на ActivityRepository с методи за CRUD операции
 */
@Repository
public interface HourlyRateRepository extends JpaRepository<HourlyRate, Long> {

    /**
     * Намира всички активни hourly rates, подредени по display order и име
     * @return List<HourlyRate> - подредени активни ставки
     */
    @Query("SELECT hr FROM HourlyRate hr WHERE hr.isActive = true ORDER BY hr.displayOrder ASC, hr.rateName ASC")
    List<HourlyRate> findAllActiveOrderedByDisplayOrderAndName();

    /**
     * Намира hourly rate по име (case-insensitive)
     * @param rateName името на ставката
     * @return Optional<HourlyRate>
     */
    @Query("SELECT hr FROM HourlyRate hr WHERE LOWER(hr.rateName) = LOWER(:rateName)")
    Optional<HourlyRate> findByRateNameIgnoreCase(@Param("rateName") String rateName);

    /**
     * Намира всички активни hourly rates
     * @return List<HourlyRate>
     */
    List<HourlyRate> findByIsActiveTrueOrderByDisplayOrderAscRateNameAsc();

    /**
     * Намира всички hourly rates (активни и неактивни)
     * @return List<HourlyRate>
     */
    List<HourlyRate> findAllByOrderByDisplayOrderAscRateNameAsc();

    /**
     * Проверява дали съществува hourly rate с даденото име (за валидация при създаване)
     * @param rateName името за проверка
     * @return boolean
     */
    boolean existsByRateNameIgnoreCase(String rateName);

    /**
     * Проверява дали съществува активна hourly rate с даденото име
     * @param rateName името за проверка
     * @return boolean
     */
    @Query("SELECT COUNT(hr) > 0 FROM HourlyRate hr WHERE LOWER(hr.rateName) = LOWER(:rateName) AND hr.isActive = true")
    boolean existsActiveByRateNameIgnoreCase(@Param("rateName") String rateName);

    /**
     * Намира hourly rates по дневни часове
     * @param dailyHours броя дневни часове
     * @return List<HourlyRate>
     */
    List<HourlyRate> findByDailyHoursAndIsActiveTrueOrderByDisplayOrderAscRateNameAsc(Integer dailyHours);

    /**
     * Намира hourly rate с най-висок display order (за добавяне на нови)
     * @return максималния display order
     */
    @Query("SELECT COALESCE(MAX(hr.displayOrder), 0) FROM HourlyRate hr")
    Integer findMaxDisplayOrder();

    /**
     * Мека деактивация на hourly rate (вместо изтриване)
     * @param id ID на ставката
     */
    @Query("UPDATE HourlyRate hr SET hr.isActive = false, hr.updatedAt = CURRENT_TIMESTAMP WHERE hr.id = :id")
    void softDeleteById(@Param("id") Long id);

    /**
     * Активира отново hourly rate
     * @param id ID на ставката
     */
    @Query("UPDATE HourlyRate hr SET hr.isActive = true, hr.updatedAt = CURRENT_TIMESTAMP WHERE hr.id = :id")
    void reactivateById(@Param("id") Long id);
}