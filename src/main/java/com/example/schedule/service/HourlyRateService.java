package com.example.schedule.service;

import com.example.schedule.entity.HourlyRate;
import com.example.schedule.repository.HourlyRateRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

/**
 * Service класа за бизнес логика свързана с HourlyRates
 * Подобен на ActivityService със същите функционалности
 */
@Service
@Transactional
public class HourlyRateService {

    @Autowired
    private HourlyRateRepository hourlyRateRepository;

    /**
     * Получава всички активни hourly rates за dropdown списъка
     * @return списък с активни ставки, подредени по display order и име
     */
    @Transactional(readOnly = true)
    public List<HourlyRate> getAllActiveHourlyRates() {
        System.out.println("💰 Getting all active hourly rates from database...");
        List<HourlyRate> rates = hourlyRateRepository.findAllActiveOrderedByDisplayOrderAndName();
        System.out.println("✅ Found " + rates.size() + " active hourly rates");

        // Debug логване
        rates.forEach(rate ->
                System.out.println("   💵 " + rate.getRateName() +
                        " - "  +
                        rate.getDailyHours() + "ч/ден (order: " + rate.getDisplayOrder() + ")")
        );

        return rates;
    }

    /**
     * Получава всички hourly rates (активни и неактивни)
     * @return списък с всички ставки
     */
    @Transactional(readOnly = true)
    public List<HourlyRate> getAllHourlyRates() {
        System.out.println("💰 Getting all hourly rates (active and inactive) from database...");
        List<HourlyRate> rates = hourlyRateRepository.findAll();
        System.out.println("✅ Found " + rates.size() + " total hourly rates");
        return rates;
    }

    /**
     * Получава hourly rate по ID
     * @param id ID на ставката
     * @return Optional с hourly rate
     */
    @Transactional(readOnly = true)
    public Optional<HourlyRate> getHourlyRateById(Long id) {
        System.out.println("🔍 Looking for hourly rate with ID: " + id);
        Optional<HourlyRate> rate = hourlyRateRepository.findById(id);

        if (rate.isPresent()) {
            System.out.println("✅ Found hourly rate: " + rate.get().getRateName());
        } else {
            System.out.println("❌ Hourly rate not found with ID: " + id);
        }

        return rate;
    }

    /**
     * Намира hourly rate по име (case-insensitive)
     * @param rateName името на ставката
     * @return Optional с hourly rate
     */
    @Transactional(readOnly = true)
    public Optional<HourlyRate> getHourlyRateByName(String rateName) {
        System.out.println("🔍 Looking for hourly rate with name: " + rateName);
        Optional<HourlyRate> rate = hourlyRateRepository.findByRateNameIgnoreCase(rateName);

        if (rate.isPresent()) {
            System.out.println("✅ Found hourly rate: " + rate.get().getRateName());
        } else {
            System.out.println("❌ Hourly rate not found with name: " + rateName);
        }

        return rate;
    }

    /**
     * Създава нова hourly rate
     * @param hourlyRate данните за новата ставка
     * @return създадената ставка
     */
    public HourlyRate createHourlyRate(HourlyRate hourlyRate) {
        System.out.println("➕ Creating new hourly rate: " + hourlyRate.getRateName());

        // Валидация
        if (hourlyRate.getRateName() == null || hourlyRate.getRateName().trim().isEmpty()) {
            throw new IllegalArgumentException("Hourly rate name cannot be empty");
        }

        if (hourlyRate.getDailyHours() == null || hourlyRate.getDailyHours() <= 0 || hourlyRate.getDailyHours() > 24) {
            throw new IllegalArgumentException("Daily hours must be between 1 and 24");
        }

        // Проверка за дублиращо се име
        if (hourlyRateRepository.existsByRateNameIgnoreCase(hourlyRate.getRateName())) {
            throw new IllegalArgumentException("Hourly rate with this name already exists");
        }

        // Автоматично задаване на display order ако не е зададен
        if (hourlyRate.getDisplayOrder() == null) {
            Integer maxOrder = hourlyRateRepository.findMaxDisplayOrder();
            hourlyRate.setDisplayOrder(maxOrder + 1);
        }

        HourlyRate savedRate = hourlyRateRepository.save(hourlyRate);
        System.out.println("✅ Hourly rate created successfully with ID: " + savedRate.getId());

        return savedRate;
    }

    /**
     * Актуализира съществуваща hourly rate
     * @param id ID на ставката за актуализиране
     * @param updatedRate новите данни
     * @return актуализираната ставка или null ако не е намерена
     */
    public HourlyRate updateHourlyRate(Long id, HourlyRate updatedRate) {
        System.out.println("🔄 Updating hourly rate with ID: " + id);

        Optional<HourlyRate> existingOpt = hourlyRateRepository.findById(id);
        if (existingOpt.isEmpty()) {
            System.out.println("❌ Hourly rate not found for update with ID: " + id);
            return null;
        }

        HourlyRate existing = existingOpt.get();

        // Валидация на новите данни
        if (updatedRate.getRateName() != null && !updatedRate.getRateName().trim().isEmpty()) {
            // Проверка дали новото име не се дублира (с изключение на текущата ставка)
            Optional<HourlyRate> duplicateCheck = hourlyRateRepository.findByRateNameIgnoreCase(updatedRate.getRateName());
            if (duplicateCheck.isPresent() && !duplicateCheck.get().getId().equals(id)) {
                throw new IllegalArgumentException("Hourly rate with this name already exists");
            }
            existing.setRateName(updatedRate.getRateName());
        }

        if (updatedRate.getDailyHours() != null) {
            if (updatedRate.getDailyHours() <= 0 || updatedRate.getDailyHours() > 24) {
                throw new IllegalArgumentException("Daily hours must be between 1 and 24");
            }
            existing.setDailyHours(updatedRate.getDailyHours());
        }

        if (updatedRate.getIsActive() != null) {
            existing.setIsActive(updatedRate.getIsActive());
        }

        if (updatedRate.getDisplayOrder() != null) {
            existing.setDisplayOrder(updatedRate.getDisplayOrder());
        }

        if (updatedRate.getDescription() != null) {
            existing.setDescription(updatedRate.getDescription());
        }

        HourlyRate savedRate = hourlyRateRepository.save(existing);
        System.out.println("✅ Hourly rate updated successfully: " + savedRate.getRateName());

        return savedRate;
    }

    /**
     * Мека деактивация на hourly rate (не я изтрива, само я маркира като неактивна)
     * @param id ID на ставката за деактивация
     * @return true ако е успешно деактивирана
     */
    public boolean deactivateHourlyRate(Long id) {
        System.out.println("🔒 Deactivating hourly rate with ID: " + id);

        Optional<HourlyRate> existingOpt = hourlyRateRepository.findById(id);
        if (existingOpt.isEmpty()) {
            System.out.println("❌ Hourly rate not found for deactivation with ID: " + id);
            return false;
        }

        HourlyRate existing = existingOpt.get();
        existing.setIsActive(false);
        hourlyRateRepository.save(existing);

        System.out.println("✅ Hourly rate deactivated successfully: " + existing.getRateName());
        return true;
    }

    /**
     * Активира отново hourly rate
     * @param id ID на ставката за активиране
     * @return true ако е успешно активирана
     */
    public boolean reactivateHourlyRate(Long id) {
        System.out.println("🔓 Reactivating hourly rate with ID: " + id);

        Optional<HourlyRate> existingOpt = hourlyRateRepository.findById(id);
        if (existingOpt.isEmpty()) {
            System.out.println("❌ Hourly rate not found for reactivation with ID: " + id);
            return false;
        }

        HourlyRate existing = existingOpt.get();
        existing.setIsActive(true);
        hourlyRateRepository.save(existing);

        System.out.println("✅ Hourly rate reactivated successfully: " + existing.getRateName());
        return true;
    }

    /**
     * Намира hourly rates по дневни часове
     * @param dailyHours броя дневни часове
     * @return списък със ставки за този брой часове
     */
    @Transactional(readOnly = true)
    public List<HourlyRate> getHourlyRatesByDailyHours(Integer dailyHours) {
        System.out.println("🔍 Looking for hourly rates with daily hours: " + dailyHours);
        List<HourlyRate> rates = hourlyRateRepository.findByDailyHoursAndIsActiveTrueOrderByDisplayOrderAscRateNameAsc(dailyHours);
        System.out.println("✅ Found " + rates.size() + " rates for " + dailyHours + " daily hours");
        return rates;
    }

    /**
     * Изтрива hourly rate напълно (ВНИМАНИЕ: използвай само ако няма свързани данни)
     * @param id ID на ставката за изтриване
     * @return true ако е успешно изтрита
     */
    @Transactional
    public boolean deleteHourlyRate(Long id) {
        System.out.println("🗑️ Attempting to delete hourly rate with ID: " + id);

        if (!hourlyRateRepository.existsById(id)) {
            System.out.println("❌ Hourly rate not found for deletion with ID: " + id);
            return false;
        }

        try {
            hourlyRateRepository.deleteById(id);
            System.out.println("✅ Hourly rate deleted successfully with ID: " + id);
            return true;
        } catch (Exception e) {
            System.err.println("❌ Error deleting hourly rate: " + e.getMessage());
            // Ако има constraint грешки (foreign key), опитваме мека деактивация
            System.out.println("🔄 Attempting soft delete instead...");
            return deactivateHourlyRate(id);
        }
    }
}