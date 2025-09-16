package com.example.schedule.controller;

import com.example.schedule.entity.HourlyRate;
import com.example.schedule.service.HourlyRateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

/**
 * REST Controller за управление на часови ставки
 * Подобен на ActivityController с CRUD операции
 */
@RestController
@RequestMapping("/api/hourly-rates")
@CrossOrigin(origins = "*") // Позволяваме CORS заявки от frontend
public class HourlyRateController {

    @Autowired
    private HourlyRateService hourlyRateService;

    /**
     * Получава всички активни hourly rates за dropdown
     * GET /api/hourly-rates/active
     * @return списък с активни ставки
     */
    @GetMapping("/active")
    public ResponseEntity<List<HourlyRate>> getActiveHourlyRates() {
        try {
            List<HourlyRate> rates = hourlyRateService.getAllActiveHourlyRates();
            return ResponseEntity.ok(rates);
        } catch (Exception e) {
            System.err.println("❌ Error fetching active hourly rates: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Получава всички hourly rates (за admin панел)
     * GET /api/hourly-rates
     * @return списък с всички ставки
     */
    @GetMapping
    public ResponseEntity<List<HourlyRate>> getAllHourlyRates() {
        try {
            List<HourlyRate> rates = hourlyRateService.getAllHourlyRates();
            return ResponseEntity.ok(rates);
        } catch (Exception e) {
            System.err.println("❌ Error fetching all hourly rates: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Получава hourly rate по ID
     * GET /api/hourly-rates/{id}
     * @param id ID на ставката
     * @return hourly rate или 404
     */
    @GetMapping("/{id}")
    public ResponseEntity<HourlyRate> getHourlyRateById(@PathVariable Long id) {
        Optional<HourlyRate> rate = hourlyRateService.getHourlyRateById(id);
        if (rate.isPresent()) {
            return ResponseEntity.ok(rate.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Създава нова hourly rate
     * POST /api/hourly-rates
     * @param hourlyRate данните за новата ставка
     * @return създадената ставка
     */
    @PostMapping
    public ResponseEntity<?> createHourlyRate(@RequestBody HourlyRate hourlyRate) {
        try {
            // Валидация на входните данни
            if (hourlyRate.getRateName() == null || hourlyRate.getRateName().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Rate name is required");
            }

            if (hourlyRate.getDailyHours() == null || hourlyRate.getDailyHours() <= 0 || hourlyRate.getDailyHours() > 24) {
                return ResponseEntity.badRequest().body("Daily hours must be between 1 and 24");
            }

            HourlyRate createdRate = hourlyRateService.createHourlyRate(hourlyRate);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdRate);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            System.err.println("❌ Error creating hourly rate: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error creating hourly rate");
        }
    }

    /**
     * Актуализира съществуваща hourly rate
     * PUT /api/hourly-rates/{id}
     * @param id ID на ставката за актуализиране
     * @param hourlyRate новите данни
     * @return актуализираната ставка
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateHourlyRate(@PathVariable Long id, @RequestBody HourlyRate hourlyRate) {
        try {
            // Валидация на входните данни
            if (hourlyRate.getRateName() != null && hourlyRate.getRateName().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Rate name cannot be empty");
            }

            if (hourlyRate.getDailyHours() != null &&
                    (hourlyRate.getDailyHours() <= 0 || hourlyRate.getDailyHours() > 24)) {
                return ResponseEntity.badRequest().body("Daily hours must be between 1 and 24");
            }

            HourlyRate updatedRate = hourlyRateService.updateHourlyRate(id, hourlyRate);
            if (updatedRate != null) {
                return ResponseEntity.ok(updatedRate);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            System.err.println("❌ Error updating hourly rate: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error updating hourly rate");
        }
    }

    /**
     * Деактивира hourly rate (soft delete)
     * DELETE /api/hourly-rates/{id}
     * @param id ID на ставката за деактивиране
     * @return потвърждение
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deactivateHourlyRate(@PathVariable Long id) {
        try {
            boolean deactivated = hourlyRateService.deactivateHourlyRate(id);
            if (deactivated) {
                return ResponseEntity.ok().body("Hourly rate deactivated successfully");
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            System.err.println("❌ Error deactivating hourly rate: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error deactivating hourly rate");
        }
    }

    /**
     * Активира отново hourly rate
     * POST /api/hourly-rates/{id}/reactivate
     * @param id ID на ставката за активиране
     * @return потвърждение
     */
    @PostMapping("/{id}/reactivate")
    public ResponseEntity<?> reactivateHourlyRate(@PathVariable Long id) {
        try {
            boolean reactivated = hourlyRateService.reactivateHourlyRate(id);
            if (reactivated) {
                return ResponseEntity.ok().body("Hourly rate reactivated successfully");
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            System.err.println("❌ Error reactivating hourly rate: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error reactivating hourly rate");
        }
    }

    /**
     * Търси hourly rates по дневни часове
     * GET /api/hourly-rates/by-daily-hours/{hours}
     * @param hours броя дневни часове
     * @return списък със ставки за този брой часове
     */
    @GetMapping("/by-daily-hours/{hours}")
    public ResponseEntity<List<HourlyRate>> getHourlyRatesByDailyHours(@PathVariable Integer hours) {
        try {
            List<HourlyRate> rates = hourlyRateService.getHourlyRatesByDailyHours(hours);
            return ResponseEntity.ok(rates);
        } catch (Exception e) {
            System.err.println("❌ Error fetching hourly rates by daily hours: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}