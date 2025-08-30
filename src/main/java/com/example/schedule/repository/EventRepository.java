package com.example.schedule.repository;

import com.example.schedule.dto.EventDto;
import com.example.schedule.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface EventRepository extends JpaRepository<Event, Long> {

    /**
     * АКТУАЛИЗИРАНО: Връща EventDto с правилните activity полета
     * Използва COALESCE за да обработи NULL activity стойности (за отпуски)
     */
    @Query("SELECT new com.example.schedule.dto.EventDto(" +
            "e.id, e.title, e.start, e.end, " +
            "a.id, a.name, e.leaveType, emp.name) " +
            "FROM Event e " +
            "JOIN e.employee emp " +
            "LEFT JOIN e.activity a") // LEFT JOIN защото activity може да е null за отпуски
    List<EventDto> findAllEventDtos();

    /**
     * АКТУАЛИЗИРАНО: Зарежда events с employee и activity данни
     */
    @Query("SELECT e FROM Event e " +
            "JOIN FETCH e.employee emp " +
            "LEFT JOIN FETCH e.activity a " + // LEFT JOIN за activity
            "WHERE emp.id = :employeeId")
    List<Event> findEventsByEmployeeIdWithEmployee(@Param("employeeId") Long employeeId);

    /**
     * НОВО: Зарежда всички events с employee и activity данни (за по-ефективни заявки)
     */
    @Query("SELECT e FROM Event e " +
            "JOIN FETCH e.employee emp " +
            "LEFT JOIN FETCH e.activity a")
    List<Event> findAllWithEmployeeAndActivity();

    /**
     * НОВО: Намира events по activity ID
     */
    @Query("SELECT e FROM Event e " +
            "JOIN FETCH e.employee emp " +
            "LEFT JOIN FETCH e.activity a " +
            "WHERE a.id = :activityId")
    List<Event> findEventsByActivityId(@Param("activityId") Long activityId);

    /**
     * НОВО: Намира events без activity (отпуски)
     */
    @Query("SELECT e FROM Event e " +
            "JOIN FETCH e.employee emp " +
            "WHERE e.activity IS NULL")
    List<Event> findEventsWithoutActivity();

    /**
     * LEGACY СЪВМЕСТИМОСТ: Намира events по activity име (за migration период)
     * БЕЛЕЖКА: Този метод ще се използва временно докато мигрираме данните
     */
    @Query("SELECT e FROM Event e " +
            "JOIN FETCH e.employee emp " +
            "LEFT JOIN FETCH e.activity a " +
            "WHERE a.name = :activityName")
    List<Event> findEventsByActivityName(@Param("activityName") String activityName);
}