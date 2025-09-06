package com.example.schedule.service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

/**
 * ПОПРАВЕНО SPRING BOOT ПРИЛОЖЕНИЕ (в service папка)
 * Сканира всички необходими пакети
 */
@SpringBootApplication
@EnableJpaRepositories(basePackages = "com.example.schedule.repository")
@EntityScan(basePackages = "com.example.schedule.entity")
@ComponentScan(basePackages = {
		"com.example.schedule.controller",
		"com.example.schedule.service",      // Сканираме service пакета (където сме)
		"com.example.schedule.repository",   // Сканираме repository пакета
		"com.example.schedule.config",
		"com.example.schedule.exception"     // Сканираме exception пакета
})
public class ScheduleApplication {

	public static void main(String[] args) {
		System.out.println("🚀 Стартиране на Schedule Application...");
		SpringApplication.run(ScheduleApplication.class, args);
		System.out.println("✅ Schedule Application стартирано успешно!");
	}
}