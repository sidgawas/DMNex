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
public class DmnResponseLite {
    private String id;
    private String workspaceId;
    private String title;
    private String description;
    private String xml;
    private Integer publishedVersionNumber;
    private LocalDateTime lastPublishedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String updatedBy;
    private String deletedBy;
}
