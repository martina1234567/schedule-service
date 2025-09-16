package com.example.schedule.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

/**
 * SPRING SECURITY КОНФИГУРАЦИЯ
 *
 * Този клас конфигурира сигурността на приложението включително:
 * - CORS настройки за frontend достъп
 * - URL permissions и authentication правила
 * - Session management
 * - CSRF protection
 *
 * ЗАБЕЛЕЖКА: passwordEncoder Bean се дефинира в PasswordConfig.java
 *
 * @author Schedule Management System
 * @version 2.1
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    // ===============================
    // SECURITY FILTER CHAIN
    // ===============================

    /**
     * Основна конфигурация за HTTP Security
     *
     * Конфигурира достъпа до различни URL paths и настройките за сигурност.
     * За момента използваме permitAll() за да позволим достъп докато
     * разработваме функционалността. В production това трябва да се ограничи.
     *
     * @param http HttpSecurity конфигурационен обект
     * @return SecurityFilterChain
     * @throws Exception при конфигурационни грешки
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        System.out.println("🛡️ Configuring Security Filter Chain...");

        http
                // ===============================
                // CORS CONFIGURATION
                // ===============================
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // ===============================
                // CSRF PROTECTION
                // ===============================
                // За API endpoints обикновено се изключва CSRF
                // защото се разчита на tokens вместо session cookies
                .csrf(csrf -> csrf.disable())

                // ===============================
                // URL AUTHORIZATION RULES
                // ===============================
                .authorizeHttpRequests(authz -> authz
                        // Публични статични ресурси
                        .requestMatchers("/", "/index.html", "/login.html", "/registration.html").permitAll()
                        .requestMatchers("/css/**", "/js/**", "/images/**", "/fonts/**").permitAll()
                        .requestMatchers("/loginStyle.css", "/script.js").permitAll()

                        // API endpoints за автентикация - публично достъпни
                        .requestMatchers("/api/auth/login", "/api/auth/register").permitAll()
                        .requestMatchers("/api/auth/available-employees").permitAll()
                        .requestMatchers("/api/auth/health").permitAll()

                        // Utility endpoints - само за development (ще се премахнат в production)
                        .requestMatchers("/api/auth/hash-password", "/api/auth/test-password").permitAll()
                        .requestMatchers("/api/auth/all-employees-debug").permitAll()
                        .requestMatchers("/api/auth/employees-without-roles").permitAll()

                        // Web controller endpoints
                        .requestMatchers("/auth", "/register", "/app", "/calendar", "/dashboard").permitAll()

                        // ЗА МОМЕНТА - ПОЗВОЛЯВАМЕ ДОСТЪП ДО ВСИЧКИ /api/auth ENDPOINTS
                        .requestMatchers("/api/auth/**").permitAll()

                        // Admin endpoints - изискват ADMIN роля (в бъдеще)
                        //.requestMatchers("/api/auth/users/**").hasRole("ADMIN")
                        //.requestMatchers("/api/admin/**").hasRole("ADMIN")

                        // Manager endpoints - изискват ADMIN или MANAGER роля (в бъдеще)
                        //.requestMatchers("/api/schedules/manage/**").hasAnyRole("ADMIN", "MANAGER")

                        // User endpoints - изискват автентикация (в бъдеще)
                        //.requestMatchers("/api/schedules/**").hasAnyRole("ADMIN", "MANAGER", "USER")
                        //.requestMatchers("/api/user/**").authenticated()

                        // ЗА DEVELOPMENT - ПОЗВОЛЯВАМЕ ДОСТЪП ДО ВСИЧКИ ОСТАНАЛИ ЗАЯВКИ
                        .anyRequest().permitAll()
                )

                // ===============================
                // SESSION MANAGEMENT
                // ===============================
                // За REST API използваме stateless sessions
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                // ===============================
                // LOGIN/LOGOUT CONFIGURATION
                // ===============================
                // За момента използваме basic HTTP authentication
                // В бъдеще може да се добави JWT или session-based auth
                .httpBasic(basic -> basic.realmName("Schedule Management System"))

                // ===============================
                // EXCEPTION HANDLING
                // ===============================
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((request, response, authException) -> {
                            System.err.println("❌ Authentication failed: " + authException.getMessage());
                            response.setStatus(401);
                            response.setContentType("application/json");
                            response.getWriter().write("{\"error\":\"Authentication required\",\"message\":\"" +
                                    authException.getMessage() + "\"}");
                        })
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            System.err.println("❌ Access denied: " + accessDeniedException.getMessage());
                            response.setStatus(403);
                            response.setContentType("application/json");
                            response.getWriter().write("{\"error\":\"Access denied\",\"message\":\"" +
                                    accessDeniedException.getMessage() + "\"}");
                        })
                );

        System.out.println("✅ Security Filter Chain configured successfully");
        return http.build();
    }

    // ===============================
    // CORS CONFIGURATION
    // ===============================

    /**
     * CORS конфигурация за frontend достъп
     *
     * Позволява на frontend приложенията да правят заявки към API-то
     * от различни домейни, портове или протоколи.
     *
     * @return CorsConfigurationSource
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        System.out.println("🌐 Configuring CORS settings...");

        CorsConfiguration configuration = new CorsConfiguration();

        // Позволени origins (домейни)
        // В production това трябва да се ограничи до конкретните домейни
        configuration.setAllowedOriginPatterns(Arrays.asList("*"));

        // Позволени HTTP методи
        configuration.setAllowedMethods(Arrays.asList(
                "GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"
        ));

        // Позволени headers
        configuration.setAllowedHeaders(Arrays.asList(
                "Authorization", "Content-Type", "X-Requested-With", "Accept",
                "Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers"
        ));

        // Headers които могат да се четат от frontend
        configuration.setExposedHeaders(Arrays.asList(
                "Access-Control-Allow-Origin", "Access-Control-Allow-Credentials"
        ));

        // Позволяване на credentials (cookies, authorization headers)
        configuration.setAllowCredentials(true);

        // Max age за preflight requests (в секунди)
        configuration.setMaxAge(3600L);

        // Прилагане на конфигурацията към всички пътища
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        System.out.println("✅ CORS configuration applied to all endpoints");

        return source;
    }

    // ===============================
    // PRODUCTION SECURITY NOTES
    // ===============================

    /*
     * ВАЖНИ ЗАБЕЛЕЖКИ ЗА PRODUCTION:
     *
     * 1. CORS настройките трябва да се ограничат до конкретни домейни:
     *    configuration.setAllowedOrigins(Arrays.asList("https://yourdomain.com"));
     *
     * 2. CSRF protection трябва да се включи за form-based authentication:
     *    .csrf(csrf -> csrf.csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse()))
     *
     * 3. HTTPS трябва да се наложи:
     *    .requiresChannel(channel -> channel.anyRequest().requiresSecure())
     *
     * 4. Security headers трябва да се добавят:
     *    .headers(headers -> headers
     *        .frameOptions().sameOrigin()
     *        .contentTypeOptions().and()
     *        .xssProtection().and()
     *        .httpStrictTransportSecurity(hstsConfig -> hstsConfig
     *            .maxAgeInSeconds(31536000)
     *            .includeSubdomains(true)
     *        )
     *    )
     *
     * 5. Session timeout трябва да се конфигурира:
     *    .sessionManagement(session -> session
     *        .maximumSessions(1)
     *        .maxSessionsPreventsLogin(false)
     *        .sessionRegistry(sessionRegistry())
     *    )
     *
     * 6. Rate limiting трябва да се имплементира за API endpoints
     *
     * 7. Utility endpoints (/hash-password, /test-password) трябва да се премахнат
     */
}