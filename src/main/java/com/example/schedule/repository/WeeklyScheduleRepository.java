package com.example.schedule.repository;

import com.example.schedule.entity.WeeklySchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Repository за управление на седмичните графици на служителите
 */
@Repository
public interface WeeklyScheduleRepository extends JpaRepository<WeeklySchedule, Long> {

    /**
     * Намира седмичен график за конкретен служител и седмица
     * @param employeeId - ID на служителя
     * @param weekStartDate - начална дата на седмицата (понеделник)
     * @return седмичния график ако съществува
     */
    @Query("SELECT ws FROM WeeklySchedule ws WHERE ws.employee.id = :employeeId AND ws.weekStartDate = :weekStartDate")
    Optional<WeeklySchedule> findByEmployeeIdAndWeekStartDate(@Param("employeeId") Long employeeId,
                                                              @Param("weekStartDate") LocalDate weekStartDate);

    /**
     * Намира всички седмични графици за служител в определен месец
     * @param employeeId - ID на служителя
     * @param year - година
     * @param month - месец (1-12)
     * @return списък със седмичните графици за месеца
     */
    @Query("SELECT ws FROM WeeklySchedule ws WHERE ws.employee.id = :employeeId " +
            "AND ws.year = :year " +
            "AND MONTH(ws.weekStartDate) = :month " +
            "ORDER BY ws.weekStartDate ASC")
    List<WeeklySchedule> findByEmployeeIdAndMonth(@Param("employeeId") Long employeeId,
                                                  @Param("year") Integer year,
                                                  @Param("month") Integer month);

    /**
     * Намира всички седмични графици за служител в определена година
     * @param employeeId - ID на служителя
     * @param year - година
     * @return списък със седмичните графици за годината
     */
    @Query("SELECT ws FROM WeeklySchedule ws WHERE ws.employee.id = :employeeId AND ws.year = :year ORDER BY ws.weekStartDate ASC")
    List<WeeklySchedule> findByEmployeeIdAndYear(@Param("employeeId") Long employeeId, @Param("year") Integer year);

    /**
     * Намира всички седмични графици за служител
     * @param employeeId - ID на служителя
     * @return списък с всички седмични графици на служителя
     */
    @Query("SELECT ws FROM WeeklySchedule ws WHERE ws.employee.id = :employeeId ORDER BY ws.weekStartDate DESC")
    List<WeeklySchedule> findByEmployeeId(@Param("employeeId") Long employeeId);

    /**
     * Намира седмични графици за определен период
     * @param employeeId - ID на служителя
     * @param startDate - начална дата на периода
     * @param endDate - крайна дата на периода
     * @return списък със седмичните графици в периода
     */
    @Query("SELECT ws FROM WeeklySchedule ws WHERE ws.employee.id = :employeeId " +
            "AND ws.weekStartDate >= :startDate AND ws.weekStartDate <= :endDate " +
            "ORDER BY ws.weekStartDate ASC")
    List<WeeklySchedule> findByEmployeeIdAndDateRange(@Param("employeeId") Long employeeId,
                                                      @Param("startDate") LocalDate startDate,
                                                      @Param("endDate") LocalDate endDate);

    /**
     * Проверява дали съществува запис за служител и седмица
     * @param employeeId - ID на служителя
     * @param weekStartDate - начална дата на седмицата
     * @return true ако съществува запис
     */
    @Query("SELECT COUNT(ws) > 0 FROM WeeklySchedule ws WHERE ws.employee.id = :employeeId AND ws.weekStartDate = :weekStartDate")
    boolean existsByEmployeeIdAndWeekStartDate(@Param("employeeId") Long employeeId,
                                               @Param("weekStartDate") LocalDate weekStartDate);

    /**
     * Изтрива всички записи за конкретен служител
     * @param employeeId - ID на служителя
     */
    @Query("DELETE FROM WeeklySchedule ws WHERE ws.employee.id = :employeeId")
    void deleteByEmployeeId(@Param("employeeId") Long employeeId);

    /**
     * Намира всички седмици които съдържат дадена дата
     * @param date - датата за проверка
     * @return списък със седмичните графици които съдържат тази дата
     */
    @Query("SELECT ws FROM WeeklySchedule ws WHERE :date >= ws.weekStartDate AND :date <= ws.weekStartDate")
    List<WeeklySchedule> findWeeksContainingDate(@Param("date") LocalDate date);

    /**
     * Статистика - общо планувани часове за служител за период
     * @param employeeId - ID на служителя
     * @param startDate - начална дата
     * @param endDate - крайна дата
     * @return общо планувани часове за периода
     */
    @Query("SELECT COALESCE(SUM(ws.plannedHours), 0) FROM WeeklySchedule ws " +
            "WHERE ws.employee.id = :employeeId " +
            "AND ws.weekStartDate >= :startDate AND ws.weekStartDate <= :endDate")
    Double getTotalPlannedHoursForPeriod(@Param("employeeId") Long employeeId,
                                         @Param("startDate") LocalDate startDate,
                                         @Param("endDate") LocalDate endDate);
}
