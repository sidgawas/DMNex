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
public class WorkspaceUpdateRequest {

    @NotBlank(message = "Workspace name is required.")
    @Size(max = 255, message = "Workspace name must be less than 256 characters.")
    private String name;
}
