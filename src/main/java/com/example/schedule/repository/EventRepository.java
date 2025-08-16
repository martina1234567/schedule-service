package com.example.schedule.repository;

import com.example.schedule.dto.EventDto;
import com.example.schedule.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface EventRepository extends JpaRepository<Event, Long> {
    @Query("SELECT new com.example.schedule.dto.EventDto(e.id, e.title, e.start, e.end, e.activity, e.leaveType, emp.name) " +
            "FROM Event e JOIN e.employee emp")
    List<EventDto> findAllEventDtos();
@Query("SELECT e FROM Event e JOIN FETCH e.employee emp WHERE emp.id = :employeeId")
List<Event> findEventsByEmployeeIdWithEmployee(@Param("employeeId") Long employeeId);


}
