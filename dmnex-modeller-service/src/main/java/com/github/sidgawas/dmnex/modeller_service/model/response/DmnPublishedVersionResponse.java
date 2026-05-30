package com.github.sidgawas.dmnex.modeller_service.model.response;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DmnPublishedVersionResponse {
    private String id;
    private String dmnId;
    private String workspaceId;
    private Integer version;
    private String title;
    private String description;
    private String xml;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String updatedBy;
    private String deletedBy;
}
