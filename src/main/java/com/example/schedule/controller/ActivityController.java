package com.example.schedule.controller;

import com.example.schedule.entity.Activity;
import com.example.schedule.service.ActivityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

/**
 * REST Controller за управление на Activities
 * Предоставя endpoints за CRUD операции с activities
 */
@RestController
@RequestMapping("/api/activities")
@CrossOrigin(origins = "*") // Позволява CORS заявки от frontend-а
public class ActivityController {

    @Autowired
    private ActivityService activityService;

    /**
     * Получава всички активни activities за dropdown списъка
     * GET /api/activities
     * @return списък с активни activities
     */
    @GetMapping
    public ResponseEntity<List<Activity>> getAllActiveActivities() {
        try {
            List<Activity> activities = activityService.getAllActiveActivities();
            return ResponseEntity.ok(activities);
        } catch (Exception e) {
            System.err.println("❌ Error getting active activities: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Получава всички activities (активни и неактивни) за админ панел
     * GET /api/activities/all
     * @return списък с всички activities
     */
    @GetMapping("/all")
    public ResponseEntity<List<Activity>> getAllActivities() {
        try {
            List<Activity> activities = activityService.getAllActivities();
            return ResponseEntity.ok(activities);
        } catch (Exception e) {
            System.err.println("❌ Error getting all activities: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Получава activity по ID
     * GET /api/activities/{id}
     * @param id ID на activity
     * @return activity или 404
     */
    @GetMapping("/{id}")
    public ResponseEntity<Activity> getActivityById(@PathVariable Long id) {
        try {
            Optional<Activity> activity = activityService.getActivityById(id);
            return activity.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            System.err.println("❌ Error getting activity by ID: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Създава нова activity
     * POST /api/activities
     * @param activity данните за новата activity
     * @return създадената activity
     */
    @PostMapping
    public ResponseEntity<?> createActivity(@RequestBody Activity activity) {
        try {
            // Валидация
            if (activity.getName() == null || activity.getName().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Activity name is required");
            }

            Activity createdActivity = activityService.createActivity(activity);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdActivity);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            System.err.println("❌ Error creating activity: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error creating activity");
        }
    }

    /**
     * Актуализира съществуваща activity
     * PUT /api/activities/{id}
     * @param id ID на activity за актуализиране
     * @param activity новите данни
     * @return актуализираната activity
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateActivity(@PathVariable Long id, @RequestBody Activity activity) {
        try {
            // Валидация
            if (activity.getName() == null || activity.getName().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Activity name is required");
            }

            Activity updatedActivity = activityService.updateActivity(id, activity);
            if (updatedActivity != null) {
                return ResponseEntity.ok(updatedActivity);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            System.err.println("❌ Error updating activity: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error updating activity");
        }
    }

    /**
     * Изтрива activity (soft delete - маркира като неактивна)
     * DELETE /api/activities/{id}
     * @param id ID на activity за изтриване
     * @return празен отговор
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteActivity(@PathVariable Long id) {
        try {
            boolean deleted = activityService.deleteActivity(id);
            if (deleted) {
                return ResponseEntity.noContent().build();
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            System.err.println("❌ Error deleting activity: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error deleting activity");
        }
    }

    /**
     * Активира/деактивира activity
     * PATCH /api/activities/{id}/toggle-active
     * @param id ID на activity
     * @return актуализираната activity
     */
    @PatchMapping("/{id}/toggle-active")
    public ResponseEntity<?> toggleActivityStatus(@PathVariable Long id) {
        try {
            Activity activity = activityService.toggleActivityStatus(id);
            if (activity != null) {
                return ResponseEntity.ok(activity);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            System.err.println("❌ Error toggling activity status: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error toggling activity status");
        }
    }
}