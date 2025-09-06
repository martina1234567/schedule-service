package com.example.schedule.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * ПОПРАВЕН WEB CONTROLLER ЗА HTML СТРАНИЦИ
 *
 * Този контролер обработва заявки към статичните HTML файлове
 * и осигурява правилно пренасочване без конфликти със Spring Security
 *
 * @author Schedule Management System
 * @version 2.0
 */
@Controller
public class WebController {

    /**
     * ROOT PATH - пренасочва към login страницата
     * Това е първата страница която потребителят вижда
     */
    @GetMapping("/")
    public String home() {
        System.out.println("🏠 Root path accessed, redirecting to login");
        return "redirect:/login.html";
    }

    /**
     * АЛТЕРНАТИВЕН ДОСТЪП ДО LOGIN СТРАНИЦАТА
     * Този endpoint пренасочва към статичния HTML файл
     * ВАЖНО: Не използваме "/login" защото Spring Security може да го прехване
     */
    @GetMapping("/auth")
    public String auth() {
        System.out.println("🔐 Auth path accessed, redirecting to login");
        return "redirect:/login.html";
    }

    /**
     * ДОСТЪП ДО REGISTRATION СТРАНИЦАТА
     */
    @GetMapping("/register")
    public String register() {
        System.out.println("📝 Register path accessed, redirecting to registration");
        return "redirect:/registration.html";
    }

    /**
     * ДОСТЪП ДО ГЛАВНОТО ПРИЛОЖЕНИЕ
     * Този endpoint води към календарната система
     */
    @GetMapping("/app")
    public String app() {
        System.out.println("📅 App path accessed, redirecting to index");
        return "redirect:/index.html";
    }

    /**
     * ДОСТЪП ДО КАЛЕНДАРА (АЛТЕРНАТИВЕН)
     */
    @GetMapping("/calendar")
    public String calendar() {
        System.out.println("📅 Calendar path accessed, redirecting to index");
        return "redirect:/index.html";
    }

    /**
     * ДОСТЪП ДО DASHBOARD (АЛТЕРНАТИВЕН)
     */
    @GetMapping("/dashboard")
    public String dashboard() {
        System.out.println("📊 Dashboard path accessed, redirecting to index");
        return "redirect:/index.html";
    }
}