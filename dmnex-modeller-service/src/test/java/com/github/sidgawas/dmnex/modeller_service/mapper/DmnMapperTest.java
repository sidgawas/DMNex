package com.github.sidgawas.dmnex.modeller_service.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

import com.github.sidgawas.dmnex.modeller_service.entity.DmnEntity;
import com.github.sidgawas.dmnex.modeller_service.entity.WorkspaceEntity;
import com.github.sidgawas.dmnex.modeller_service.model.request.DmnCreateRequest;
import com.github.sidgawas.dmnex.modeller_service.model.request.DmnUpdateRequest;
import com.github.sidgawas.dmnex.modeller_service.model.response.DmnResponseLite;

class DmnMapperTest {

    private final DmnMapper dmnMapper = Mappers.getMapper(DmnMapper.class);

    @Test
    void toEntityShouldMapAndTrimFields() {
        DmnCreateRequest request = DmnCreateRequest.builder()
                .title("  Risk Review  ")
            .xml("  <definitions id=\"risk\"/>  ")
                .description("  Initial risk decision model  ")
                .build();

        DmnEntity entity = dmnMapper.toEntity(request);

        assertThat(entity).isNotNull();
        assertThat(entity.getTitle()).isEqualTo("Risk Review");
        assertThat(entity.getXml()).isEqualTo("<definitions id=\"risk\"/>");
        assertThat(entity.getDescription()).isEqualTo("Initial risk decision model");
        assertThat(entity.getId()).isNull();
        assertThat(entity.getWorkspace()).isNull();
        assertThat(entity.getXml()).isNotNull();
    }

    @Test
    void toLiteResponseShouldMapAllApiFields() {
        WorkspaceEntity workspace = WorkspaceEntity.builder().id("workspace-1").name("Workspace").slug("workspace").build();
        DmnEntity entity = DmnEntity.builder()
                .id("dmn-1")
                .workspace(workspace)
                .title("Risk Review")
                .description("Initial risk decision model")
                .xml("<definitions id=\"risk\"/>")
                .build();
        entity.setCreatedAt(LocalDateTime.parse("2026-05-10T10:15:30"));
        entity.setUpdatedAt(LocalDateTime.parse("2026-05-10T11:15:30"));
        entity.setCreatedBy("SYSTEM");
        entity.setUpdatedBy("SYSTEM");
        entity.setDeletedBy("SYSTEM");

        DmnResponseLite response = dmnMapper.toLiteResponse(entity);

        assertThat(response.getId()).isEqualTo("dmn-1");
        assertThat(response.getWorkspaceId()).isEqualTo("workspace-1");
        assertThat(response.getTitle()).isEqualTo("Risk Review");
        assertThat(response.getDescription()).isEqualTo("Initial risk decision model");
        assertThat(response.getXml()).isEqualTo("<definitions id=\"risk\"/>");
        assertThat(response.getCreatedAt()).isEqualTo(LocalDateTime.parse("2026-05-10T10:15:30"));
        assertThat(response.getUpdatedAt()).isEqualTo(LocalDateTime.parse("2026-05-10T11:15:30"));
        assertThat(response.getCreatedBy()).isEqualTo("SYSTEM");
        assertThat(response.getUpdatedBy()).isEqualTo("SYSTEM");
        assertThat(response.getDeletedBy()).isEqualTo("SYSTEM");
    }

    @Test
    void updateEntityFromRequestShouldUpdateMutableFieldsOnly() {
        WorkspaceEntity workspace = WorkspaceEntity.builder().id("workspace-1").name("Workspace").slug("workspace").build();
        DmnEntity entity = DmnEntity.builder()
                .id("dmn-1")
                .workspace(workspace)
                .title("Old Title")
                .xml("<definitions id=\"old\"/>")
                .description("Old description")
                .build();

        DmnUpdateRequest request = DmnUpdateRequest.builder()
                .title("  New Title  ")
                .xml("  <definitions id=\"new\"/>  ")
                .description("  Updated description  ")
                .build();

        dmnMapper.updateEntityFromRequest(request, entity);

        assertThat(entity.getTitle()).isEqualTo("New Title");
    assertThat(entity.getXml()).isEqualTo("<definitions id=\"new\"/>");
        assertThat(entity.getDescription()).isEqualTo("Updated description");
        assertThat(entity.getWorkspace().getId()).isEqualTo("workspace-1");
        assertThat(entity.getId()).isEqualTo("dmn-1");
    }

    @Test
    void toLiteResponseListShouldMapCollection() {
        DmnEntity first = DmnEntity.builder()
            .id("1")
            .title("One")
            .xml("<definitions id=\"one\"/>")
            .description("First")
            .build();
        DmnEntity second = DmnEntity.builder()
            .id("2")
            .title("Two")
            .xml("<definitions id=\"two\"/>")
            .description("Second")
            .build();

        List<DmnResponseLite> responses = dmnMapper.toLiteResponseList(List.of(first, second));

        assertThat(responses).hasSize(2);
        assertThat(responses.get(0).getId()).isEqualTo("1");
        assertThat(responses.get(0).getXml()).isEqualTo("<definitions id=\"one\"/>");
        assertThat(responses.get(0).getDescription()).isEqualTo("First");
        assertThat(responses.get(1).getId()).isEqualTo("2");
        assertThat(responses.get(1).getXml()).isEqualTo("<definitions id=\"two\"/>");
        assertThat(responses.get(1).getDescription()).isEqualTo("Second");
    }
}