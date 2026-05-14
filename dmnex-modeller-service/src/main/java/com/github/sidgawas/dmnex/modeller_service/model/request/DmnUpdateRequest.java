package com.github.sidgawas.dmnex.modeller_service.model.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DmnUpdateRequest {

    @NotBlank(message = "DMN title is required.")
    @Size(max = 255, message = "DMN title must be less than 256 characters.")
    private String title;

    @NotBlank(message = "DMN xml is required.")
    private String xml;

    @Size(max = 1000, message = "DMN description must be less than 1001 characters.")
    private String description;
}