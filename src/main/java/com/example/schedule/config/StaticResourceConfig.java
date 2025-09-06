package com.example.schedule.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * КОНФИГУРАЦИЯ ЗА СТАТИЧНИ РЕСУРСИ
 *
 * Този клас конфигурира Spring Boot как да обслужва статичните файлове
 * (HTML, CSS, JavaScript, изображения)
 *
 * @author Schedule Management System
 * @version 1.0
 */
@Configuration
public class StaticResourceConfig implements WebMvcConfigurer {

    /**
     * Конфигурира mapping-ите за статичните ресурси
     *
     * Spring Boot по подразбиране търси статични файлове в:
     * - /static/
     * - /public/
     * - /resources/
     * - /META-INF/resources/
     *
     * Тази конфигурация добавя допълнителни правила ако са нужни
     */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Основно mapping за статични ресурси
        registry.addResourceHandler("/**")
                .addResourceLocations(
                        "classpath:/static/",
                        "classpath:/public/",
                        "classpath:/resources/",
                        "classpath:/META-INF/resources/"
                )
                .setCachePeriod(3600); // Кеширане за 1 час

        // Специално mapping за изображения
        registry.addResourceHandler("/images/**")
                .addResourceLocations("classpath:/static/images/")
                .setCachePeriod(86400); // Кеширане за 24 часа

        // Специално mapping за CSS файлове
        registry.addResourceHandler("/css/**")
                .addResourceLocations("classpath:/static/css/")
                .setCachePeriod(3600);

        // Специално mapping за JavaScript файлове
        registry.addResourceHandler("/js/**")
                .addResourceLocations("classpath:/static/js/")
                .setCachePeriod(3600);

        // WebJars support (за FullCalendar и други библиотеки)
        registry.addResourceHandler("/webjars/**")
                .addResourceLocations("classpath:/META-INF/resources/webjars/")
                .setCachePeriod(86400);

        System.out.println("📁 Static resource handlers configured successfully");
    }
}