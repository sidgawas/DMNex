package com.github.sidgawas.dmnex.modeller_service.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;

@Configuration
public class OpenApiConfiguration {

    @Bean
    public OpenAPI dmnexOpenApi(
            @Value("${spring.application.name}") String applicationName,
            @Value("${info.app.version:v1}") String apiVersion) {
        return new OpenAPI()
                .info(new Info()
                        .title(applicationName)
                        .version(apiVersion)
                        .description("API documentation for dmnex-modeller-service."));
    }
}