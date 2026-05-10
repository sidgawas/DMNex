package com.github.sidgawas.dmnex.modeller_service.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

import com.github.sidgawas.dmnex.modeller_service.entity.WorkspaceEntity;
import com.github.sidgawas.dmnex.modeller_service.model.request.WorkspaceCreateRequest;
import com.github.sidgawas.dmnex.modeller_service.model.request.WorkspaceUpdateRequest;
import com.github.sidgawas.dmnex.modeller_service.model.response.WorkspaceResponse;

class WorkspaceMapperTest {

    private final WorkspaceMapper workspaceMapper = Mappers.getMapper(WorkspaceMapper.class);

    @Test
    void toEntityShouldMapAndTrimName() {
        WorkspaceCreateRequest request = WorkspaceCreateRequest.builder().name("  Risk Management  ").build();

        WorkspaceEntity entity = workspaceMapper.toEntity(request);

        assertThat(entity).isNotNull();
        assertThat(entity.getName()).isEqualTo("Risk Management");
        assertThat(entity.getId()).isNull();
        assertThat(entity.getSlug()).isNull();
    }

    @Test
    void toResponseShouldMapAllApiFields() {
        WorkspaceEntity entity = WorkspaceEntity.builder()
                .id("workspace-id")
                .name("Risk Management")
                .slug("risk-management")
                .build();
        entity.setCreatedAt(LocalDateTime.parse("2026-05-10T10:15:30"));
        entity.setUpdatedAt(LocalDateTime.parse("2026-05-10T11:15:30"));
        entity.setCreatedBy("SYSTEM");
        entity.setUpdatedBy("SYSTEM");
        entity.setDeletedBy("SYSTEM");

        WorkspaceResponse response = workspaceMapper.toResponse(entity);

        assertThat(response.getId()).isEqualTo("workspace-id");
        assertThat(response.getName()).isEqualTo("Risk Management");
        assertThat(response.getSlug()).isEqualTo("risk-management");
        assertThat(response.getCreatedAt()).isEqualTo(LocalDateTime.parse("2026-05-10T10:15:30"));
        assertThat(response.getUpdatedAt()).isEqualTo(LocalDateTime.parse("2026-05-10T11:15:30"));
        assertThat(response.getCreatedBy()).isEqualTo("SYSTEM");
        assertThat(response.getUpdatedBy()).isEqualTo("SYSTEM");
        assertThat(response.getDeletedBy()).isEqualTo("SYSTEM");
    }

    @Test
    void updateEntityFromRequestShouldUpdateNameOnly() {
        WorkspaceEntity entity = WorkspaceEntity.builder()
                .id("workspace-id")
                .name("Old Name")
                .slug("old-name")
                .build();

        WorkspaceUpdateRequest request = WorkspaceUpdateRequest.builder().name("  New Name  ").build();

        workspaceMapper.updateEntityFromRequest(request, entity);

        assertThat(entity.getName()).isEqualTo("New Name");
        assertThat(entity.getSlug()).isEqualTo("old-name");
        assertThat(entity.getId()).isEqualTo("workspace-id");
    }

    @Test
    void toResponseListShouldMapCollection() {
        WorkspaceEntity first = WorkspaceEntity.builder().id("1").name("One").slug("one").build();
        WorkspaceEntity second = WorkspaceEntity.builder().id("2").name("Two").slug("two").build();

        List<WorkspaceResponse> responses = workspaceMapper.toResponseList(List.of(first, second));

        assertThat(responses).hasSize(2);
        assertThat(responses.get(0).getId()).isEqualTo("1");
        assertThat(responses.get(1).getId()).isEqualTo("2");
    }
}
