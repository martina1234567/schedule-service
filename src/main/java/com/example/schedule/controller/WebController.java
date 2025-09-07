package com.example.schedule.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * WEB CONTROLLER ЗА HTML СТРАНИЦИ
 *
 * Този контролер обработва заявки към статичните HTML файлове
 * и осигурява правилно пренасочване без конфликти със Spring Security
 *
 * @author Schedule Management System
 * @version 2.1
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
     * ДОСТЪП ДО ГЛАВНОТО ПРИЛОЖЕНИЕ (ADMIN/MANAGER)
     * Този endpoint води към пълния календарен dashboard
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

    /**
     * ДОСТЪП ДО USER DASHBOARD
     * Опростена страница за потребители с USER роля
     */
    @GetMapping("/user-dashboard")
    public String userDashboard() {
        System.out.println("👤 User dashboard path accessed, redirecting to user-dashboard");
        return "redirect:/user-dashboard.html";
    }

    /**
     * ДОСТЪП ДО MY SCHEDULE (АЛТЕРНАТИВЕН ЗА USER)
     */
    @GetMapping("/my-schedule")
    public String mySchedule() {
        System.out.println("📋 My schedule path accessed, redirecting to user-dashboard");
        return "redirect:/user-dashboard.html";
    }
}