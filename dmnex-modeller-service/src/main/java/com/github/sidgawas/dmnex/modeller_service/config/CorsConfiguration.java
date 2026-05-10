package com.github.sidgawas.dmnex.modeller_service.config;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfiguration implements WebMvcConfigurer {

    private final List<String> allowedOriginPatterns;
    private final List<String> allowedMethods;
    private final List<String> allowedHeaders;

    public CorsConfiguration(
            @Value("${app.cors.allowed-origin-patterns:*}") List<String> allowedOriginPatterns,
            @Value("${app.cors.allowed-methods:GET,POST,PUT,PATCH,DELETE,OPTIONS}") List<String> allowedMethods,
            @Value("${app.cors.allowed-headers:*}") List<String> allowedHeaders) {
        this.allowedOriginPatterns = allowedOriginPatterns;
        this.allowedMethods = allowedMethods;
        this.allowedHeaders = allowedHeaders;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns(allowedOriginPatterns.toArray(String[]::new))
                .allowedMethods(allowedMethods.toArray(String[]::new))
                .allowedHeaders(allowedHeaders.toArray(String[]::new));
    }
}
