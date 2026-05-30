package com.github.sidgawas.dmnex.modeller_service.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDateTime;

import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

import com.github.sidgawas.dmnex.modeller_service.entity.DmnEntity;
import com.github.sidgawas.dmnex.modeller_service.entity.DmnPublishedVersionEntity;
import com.github.sidgawas.dmnex.modeller_service.entity.WorkspaceEntity;
import com.github.sidgawas.dmnex.modeller_service.model.response.DmnPublishedVersionResponse;

class DmnPublishedVersionMapperTest {

    private final DmnPublishedVersionMapper mapper = Mappers.getMapper(DmnPublishedVersionMapper.class);

    @Test
    void toResponseShouldMapPublishedVersionFields() {
        WorkspaceEntity workspace = WorkspaceEntity.builder().id("workspace-1").name("Workspace").slug("workspace").build();
        DmnEntity dmn = DmnEntity.builder()
                .id("dmn-1")
                .workspace(workspace)
                .title("Risk Review")
                .description("Risk decision")
            .xml("<definitions id=\"risk\"/>")
                .build();

        DmnPublishedVersionEntity entity = DmnPublishedVersionEntity.builder()
                .id("pub-1")
                .dmn(dmn)
            .version(1)
                .title("Risk Review")
                .description("Risk decision")
                .xml("<definitions id=\"risk\"/>")
                .build();
        entity.setCreatedAt(LocalDateTime.parse("2026-05-12T10:15:30"));
        entity.setUpdatedAt(LocalDateTime.parse("2026-05-12T11:15:30"));
        entity.setCreatedBy("SYSTEM");
        entity.setUpdatedBy("SYSTEM");
        entity.setDeletedBy("SYSTEM");

        DmnPublishedVersionResponse response = mapper.toResponse(entity);

        assertThat(response.getId()).isEqualTo("pub-1");
        assertThat(response.getDmnId()).isEqualTo("dmn-1");
        assertThat(response.getWorkspaceId()).isEqualTo("workspace-1");
        assertThat(response.getVersion()).isEqualTo(1);
        assertThat(response.getTitle()).isEqualTo("Risk Review");
        assertThat(response.getDescription()).isEqualTo("Risk decision");
        assertThat(response.getXml()).isEqualTo("<definitions id=\"risk\"/>");
        assertThat(response.getCreatedAt()).isEqualTo(LocalDateTime.parse("2026-05-12T10:15:30"));
        assertThat(response.getUpdatedAt()).isEqualTo(LocalDateTime.parse("2026-05-12T11:15:30"));
        assertThat(response.getCreatedBy()).isEqualTo("SYSTEM");
        assertThat(response.getUpdatedBy()).isEqualTo("SYSTEM");
        assertThat(response.getDeletedBy()).isEqualTo("SYSTEM");
    }
}
