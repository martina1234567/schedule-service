package com.example.schedule.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

/**
 * ПОПРАВЕНА SPRING SECURITY КОНФИГУРАЦИЯ
 *
 * Този клас конфигурира Spring Security да:
 * 1. Позволява достъп до всички endpoints без аутентификация
 * 2. Деактивира автоматичния /login endpoint на Spring Security
 * 3. Позволява достъп до статичните ресурси (HTML, CSS, JS)
 * 4. Деактивира CSRF защитата за REST API-то
 *
 * @author Schedule Management System
 * @version 2.0
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    /**
     * Главна конфигурация на Spring Security
     * Тази конфигурация ефективно "изключва" Spring Security за нашето приложение
     * защото ние ще правим custom аутентификация
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // РАЗРЕШАВАМЕ ДОСТЪП ДО ВСИЧКО БЕЗ АУТЕНТИФИКАЦИЯ
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/**").permitAll()  // Всички URL-и са разрешени
                        .anyRequest().permitAll()            // Backup правило
                )

                // ДЕАКТИВИРАМЕ CSRF ЗАЩИТАТА
                // Нужно е за REST API заявки от frontend
                .csrf(csrf -> csrf.disable())

                // ДЕАКТИВИРАМЕ АВТОМАТИЧНАТА LOGIN ФОРМА НА SPRING SECURITY
                // Това предотвратява автоматичното пренасочване към /login
                .formLogin(form -> form.disable())

                // ДЕАКТИВИРАМЕ HTTP BASIC AUTHENTICATION
                .httpBasic(basic -> basic.disable())

                // ДЕАКТИВИРАМЕ LOGOUT ФУНКЦИОНАЛНОСТТА НА SPRING SECURITY
                .logout(logout -> logout.disable())

                // ДЕАКТИВИРАМЕ SESSION MANAGEMENT
                // Ние ще използваме stateless аутентификация с JWT токени
                .sessionManagement(session -> session.disable());

        return http.build();
    }
}