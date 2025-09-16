package com.example.schedule.service;

import com.example.schedule.entity.Activity;
import com.example.schedule.repository.ActivityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Service класа за бизнес логика свързана с Activities
 * Съдържа методи за CRUD операции и валидация
 */
@Service
@Transactional
public class ActivityService {

    @Autowired
    private ActivityRepository activityRepository;

    /**
     * Получава всички активни activities за dropdown списъка
     * @return списък с активни activities, подредени по display order и име
     */
    @Transactional(readOnly = true)
    public List<Activity> getAllActiveActivities() {
        System.out.println("📋 Getting all active activities from database...");
        List<Activity> activities = activityRepository.findAllActiveOrderedByDisplayOrderAndName();
        System.out.println("✅ Found " + activities.size() + " active activities");

        // Debug логване
        activities.forEach(activity ->
                System.out.println("   🎯 " + activity.getName() + " (order: " + activity.getDisplayOrder() + ")")
        );

        return activities;
    }

    /**
     * Получава всички activities (активни и неактивни)
     * @return списък с всички activities
     */
    @Transactional(readOnly = true)
    public List<Activity> getAllActivities() {
        System.out.println("📋 Getting all activities (active and inactive) from database...");
        List<Activity> activities = activityRepository.findAll();
        System.out.println("✅ Found " + activities.size() + " total activities");
        return activities;
    }

    /**
     * Получава activity по ID
     * @param id ID на activity
     * @return Optional с activity
     */
    @Transactional(readOnly = true)
    public Optional<Activity> getActivityById(Long id) {
        System.out.println("🔍 Getting activity by ID: " + id);
        return activityRepository.findById(id);
    }

    /**
     * Създава нова activity
     * @param activity данните за новата activity
     * @return създадената activity
     * @throws IllegalArgumentException ако activity с такова име вече съществува
     */
    public Activity createActivity(Activity activity) {
        System.out.println("➕ Creating new activity: " + activity.getName());

        // Валидация - проверяваме дали вече съществува activity с това име
        if (activityRepository.existsByNameIgnoreCase(activity.getName())) {
            throw new IllegalArgumentException("Activity with name '" + activity.getName() + "' already exists");
        }

        // Ако не е зададен display order, поставяме в края
        if (activity.getDisplayOrder() == null) {
            Integer maxOrder = activityRepository.findMaxDisplayOrder();
            activity.setDisplayOrder(maxOrder != null ? maxOrder + 1 : 1);
        }

        // Ако не е зададен isActive, поставяме true
        if (activity.getIsActive() == null) {
            activity.setIsActive(true);
        }

        Activity savedActivity = activityRepository.save(activity);
        System.out.println("✅ Successfully created activity: " + savedActivity.getName() + " with ID: " + savedActivity.getId());

        return savedActivity;
    }

    /**
     * Актуализира съществуваща activity
     * @param id ID на activity за актуализиране
     * @param activityData новите данни
     * @return актуализираната activity или null ако не е намерена
     */
    public Activity updateActivity(Long id, Activity activityData) {
        System.out.println("✏️ Updating activity with ID: " + id);

        Optional<Activity> existingActivityOpt = activityRepository.findById(id);
        if (existingActivityOpt.isEmpty()) {
            System.out.println("❌ Activity with ID " + id + " not found");
            return null;
        }

        Activity existingActivity = existingActivityOpt.get();

        // Проверяваме дали новото име не е заето от друга activity
        if (!existingActivity.getName().equalsIgnoreCase(activityData.getName())) {
            if (activityRepository.existsByNameIgnoreCase(activityData.getName())) {
                throw new IllegalArgumentException("Activity with name '" + activityData.getName() + "' already exists");
            }
        }

        // Актуализираме полетата
        existingActivity.setName(activityData.getName());
        existingActivity.setDescription(activityData.getDescription());

        if (activityData.getIsActive() != null) {
            existingActivity.setIsActive(activityData.getIsActive());
        }

        if (activityData.getDisplayOrder() != null) {
            existingActivity.setDisplayOrder(activityData.getDisplayOrder());
        }

        Activity updatedActivity = activityRepository.save(existingActivity);
        System.out.println("✅ Successfully updated activity: " + updatedActivity.getName());

        return updatedActivity;
    }

    /**
     * Изтрива activity (soft delete - маркира като неактивна)
     * @param id ID на activity за изтриване
     * @return true ако е изтрита успешно
     */
    public boolean deleteActivity(Long id) {
        System.out.println("🗑️ Deleting (deactivating) activity with ID: " + id);

        Optional<Activity> activityOpt = activityRepository.findById(id);
        if (activityOpt.isEmpty()) {
            System.out.println("❌ Activity with ID " + id + " not found");
            return false;
        }

        Activity activity = activityOpt.get();
        activity.setIsActive(false); // Soft delete - просто маркираме като неактивна

        activityRepository.save(activity);
        System.out.println("✅ Successfully deactivated activity: " + activity.getName());

        return true;
    }

    /**
     * Активира/деактивира activity
     * @param id ID на activity
     * @return актуализираната activity или null ако не е намерена
     */
    public Activity toggleActivityStatus(Long id) {
        System.out.println("🔄 Toggling status for activity with ID: " + id);

        Optional<Activity> activityOpt = activityRepository.findById(id);
        if (activityOpt.isEmpty()) {
            System.out.println("❌ Activity with ID " + id + " not found");
            return null;
        }

        Activity activity = activityOpt.get();
        activity.setIsActive(!activity.getIsActive());

        Activity updatedActivity = activityRepository.save(activity);
        System.out.println("✅ Successfully toggled activity status: " + updatedActivity.getName() +
                " (now " + (updatedActivity.getIsActive() ? "active" : "inactive") + ")");

        return updatedActivity;
    }

    /**
     * Намира activity по име (case-insensitive)
     * @param name името на activity
     * @return Optional с activity
     */
    @Transactional(readOnly = true)
    public Optional<Activity> getActivityByName(String name) {
        return activityRepository.findByNameIgnoreCase(name);
    }
}