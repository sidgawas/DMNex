package com.github.sidgawas.dmnex.modeller_service.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mapstruct.factory.Mappers;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import com.github.sidgawas.dmnex.modeller_service.entity.DmnEntity;
import com.github.sidgawas.dmnex.modeller_service.entity.DmnPublishedVersionEntity;
import com.github.sidgawas.dmnex.modeller_service.entity.WorkspaceEntity;
import com.github.sidgawas.dmnex.modeller_service.exception.ResourceNotFoundException;
import com.github.sidgawas.dmnex.modeller_service.mapper.DmnMapper;
import com.github.sidgawas.dmnex.modeller_service.model.request.DmnCreateRequest;
import com.github.sidgawas.dmnex.modeller_service.model.request.DmnUpdateRequest;
import com.github.sidgawas.dmnex.modeller_service.repository.DmnPublishedVersionRepository;
import com.github.sidgawas.dmnex.modeller_service.repository.DmnRepository;
import com.github.sidgawas.dmnex.modeller_service.repository.WorkspaceRepository;

@ExtendWith(MockitoExtension.class)
class DmnServiceTest {

    @Mock
    private DmnRepository dmnRepository;

    @Mock
    private WorkspaceRepository workspaceRepository;

        @Mock
        private DmnPublishedVersionRepository dmnPublishedVersionRepository;

    @Mock
    private EntityIdGenerator entityIdGenerator;

    private DmnService dmnService;

    @BeforeEach
    void setUp() {
        DmnMapper dmnMapper = Mappers.getMapper(DmnMapper.class);
        dmnService = new DmnService(
                dmnRepository,
                dmnPublishedVersionRepository,
                workspaceRepository,
                dmnMapper,
                entityIdGenerator);
    }

    @Test
    void createShouldNormalizeTitleAndPersistXml() {
        WorkspaceEntity workspace = WorkspaceEntity.builder().id("workspace-1").name("Workspace").slug("workspace").build();
        when(workspaceRepository.findByIdAndIsDeletedFalse("workspace-1")).thenReturn(Optional.of(workspace));
        when(entityIdGenerator.nextId()).thenReturn("01JVZQ0YQYJ3A");
        when(workspaceRepository.save(any(WorkspaceEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(dmnRepository.save(any(DmnEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        DmnCreateRequest request = DmnCreateRequest.builder()
                .title("  Risk Review  ")
                .xml("  <definitions id=\"risk\"/>  ")
                .description("  Initial description  ")
                .build();

        DmnEntity created = dmnService.create("workspace-1", request);

        assertThat(created.getId()).isEqualTo("01JVZQ0YQYJ3A");
        assertThat(created.getTitle()).isEqualTo("Risk Review");
        assertThat(created.getXml()).isEqualTo("<definitions id=\"risk\"/>");
        assertThat(created.getDescription()).isEqualTo("Initial description");
        assertThat(created.getCreatedAt()).isNotNull();
        assertThat(created.getUpdatedAt()).isNotNull();
        assertThat(created.getIsDeleted()).isFalse();
        assertThat(created.getWorkspace().getId()).isEqualTo("workspace-1");
    }

    @Test
    void createShouldFailForBlankXml() {
        WorkspaceEntity workspace = WorkspaceEntity.builder().id("workspace-1").name("Workspace").slug("workspace").build();
        when(workspaceRepository.findByIdAndIsDeletedFalse("workspace-1")).thenReturn(Optional.of(workspace));

        DmnCreateRequest request = DmnCreateRequest.builder().title("Risk Review").xml("   ").build();

        assertThatThrownBy(() -> dmnService.create("workspace-1", request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("DMN xml is required.");

        verify(dmnRepository, never()).save(any(DmnEntity.class));
    }

    @Test
    void getByIdShouldThrowWhenWorkspaceMissing() {
        when(workspaceRepository.existsById("missing-workspace")).thenReturn(false);

        assertThatThrownBy(() -> dmnService.getById("missing-workspace", "dmn-1"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Workspace not found with id: missing-workspace");
    }

    @Test
    void listAllShouldReturnWorkspaceDmns() {
        DmnEntity first = DmnEntity.builder().id("dmn-1").title("First").xml("<definitions id=\"first\"/>").build();
        PageRequest pageRequest = PageRequest.of(
                0,
                20,
                Sort.by(Sort.Direction.DESC, "updatedAt").and(Sort.by(Sort.Direction.ASC, "id")));
        Page<DmnEntity> page = new PageImpl<>(List.of(first), pageRequest, 1);

        when(workspaceRepository.existsById("workspace-1")).thenReturn(true);
        when(dmnRepository.findByWorkspaceIdAndIsDeletedFalse("workspace-1", pageRequest)).thenReturn(page);

        Page<DmnEntity> list = dmnService.listAll("workspace-1", 0, 20, null, "updatedAt", "desc");

        assertThat(list.getContent()).containsExactly(first);
        assertThat(list.getTotalElements()).isEqualTo(1);
    }

    @Test
    void listAllShouldSearchByTitleWhenQueryProvided() {
        DmnEntity first = DmnEntity.builder().id("dmn-1").title("Risk Review").xml("<definitions id=\"risk\"/>")
                .build();
        PageRequest pageRequest = PageRequest.of(
                1,
                5,
                Sort.by(Sort.Direction.ASC, "title").and(Sort.by(Sort.Direction.ASC, "id")));
        Page<DmnEntity> page = new PageImpl<>(List.of(first), pageRequest, 6);

        when(workspaceRepository.existsById("workspace-1")).thenReturn(true);
        when(dmnRepository.findByWorkspaceIdAndIsDeletedFalseAndTitleContainingIgnoreCase("workspace-1", "risk", pageRequest))
                .thenReturn(page);

        Page<DmnEntity> list = dmnService.listAll("workspace-1", 1, 5, "  risk  ", "title", "asc");

        assertThat(list.getContent()).containsExactly(first);
        assertThat(list.getTotalElements()).isEqualTo(6);
    }

    @Test
        void updateByIdShouldRefreshTitleAndXml() {
        WorkspaceEntity workspace = WorkspaceEntity.builder().id("workspace-1").name("Workspace").slug("workspace").build();
        DmnEntity entity = DmnEntity.builder()
                .id("dmn-1")
                .workspace(workspace)
                .title("Old Title")
                                .xml("<definitions id=\"old\"/>")
                .build();
        entity.setCreatedAt(LocalDateTime.now().minusDays(1));
        entity.setUpdatedAt(LocalDateTime.now().minusDays(1));
        entity.setIsDeleted(false);

        when(workspaceRepository.existsById("workspace-1")).thenReturn(true);
        when(dmnRepository.findByIdAndWorkspaceIdAndIsDeletedFalse("dmn-1", "workspace-1")).thenReturn(Optional.of(entity));
        when(workspaceRepository.save(any(WorkspaceEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(dmnRepository.save(any(DmnEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        DmnUpdateRequest request = DmnUpdateRequest.builder()
                .title("  New Title  ")
                .xml("  <definitions id=\"new\"/>  ")
                .description("  Updated description  ")
                .build();

        DmnEntity updated = dmnService.updateById("workspace-1", "dmn-1", request);

        assertThat(updated.getTitle()).isEqualTo("New Title");
                assertThat(updated.getXml()).isEqualTo("<definitions id=\"new\"/>");
        assertThat(updated.getDescription()).isEqualTo("Updated description");
        assertThat(updated.getUpdatedAt()).isAfter(updated.getCreatedAt());
    }

    @Test
    void deleteByIdShouldSoftDeleteDmn() {
        WorkspaceEntity workspace = WorkspaceEntity.builder().id("workspace-1").name("Workspace").slug("workspace").build();
        DmnEntity entity = DmnEntity.builder()
                .id("dmn-1")
                .workspace(workspace)
                .title("To Delete")
                .xml("<definitions id=\"delete\"/>")
                .build();
        entity.setIsDeleted(false);

        when(workspaceRepository.existsById("workspace-1")).thenReturn(true);
        when(dmnRepository.findByIdAndWorkspaceIdAndIsDeletedFalse("dmn-1", "workspace-1")).thenReturn(Optional.of(entity));
        when(workspaceRepository.save(any(WorkspaceEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(dmnRepository.save(any(DmnEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        dmnService.deleteById("workspace-1", "dmn-1");

        ArgumentCaptor<DmnEntity> captor = ArgumentCaptor.forClass(DmnEntity.class);
        verify(dmnRepository).save(captor.capture());

        DmnEntity saved = captor.getValue();
        assertThat(saved.getIsDeleted()).isTrue();
        assertThat(saved.getDeletedAt()).isNotNull();
        assertThat(saved.getUpdatedAt()).isNotNull();
    }

    @Test
    void createShouldFailForBlankTitle() {
        WorkspaceEntity workspace = WorkspaceEntity.builder().id("workspace-1").name("Workspace").slug("workspace").build();
        when(workspaceRepository.findByIdAndIsDeletedFalse("workspace-1")).thenReturn(Optional.of(workspace));

        DmnCreateRequest request = DmnCreateRequest.builder().title("   ").build();

        assertThatThrownBy(() -> dmnService.create("workspace-1", request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("DMN title is required.");

        verify(dmnRepository, never()).save(any(DmnEntity.class));
    }

    @Test
    void publishShouldCreatePublishedVersionSnapshot() {
        WorkspaceEntity workspace = WorkspaceEntity.builder().id("workspace-1").name("Workspace").slug("workspace").build();
        DmnEntity dmn = DmnEntity.builder()
                .id("dmn-1")
                .workspace(workspace)
                .title("Risk Review")
                .description("Risk approval flow")
                .xml("<definitions id=\"risk\"/>")
                .build();

        when(workspaceRepository.existsById("workspace-1")).thenReturn(true);
        when(dmnRepository.findByIdAndWorkspaceIdAndIsDeletedFalse("dmn-1", "workspace-1")).thenReturn(Optional.of(dmn));
        when(dmnPublishedVersionRepository.findTopByDmnIdAndIsDeletedFalseOrderByVersionDesc("dmn-1"))
                .thenReturn(Optional.empty());
        when(entityIdGenerator.nextId()).thenReturn("01JVZQ0YQYJ3P");
        when(workspaceRepository.save(any(WorkspaceEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(dmnPublishedVersionRepository.save(any(DmnPublishedVersionEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        DmnPublishedVersionEntity published = dmnService.publish(
                "workspace-1",
                "dmn-1");

        assertThat(published.getId()).isEqualTo("01JVZQ0YQYJ3P");
        assertThat(published.getDmn().getId()).isEqualTo("dmn-1");
                assertThat(published.getVersion()).isEqualTo(1);
        assertThat(published.getTitle()).isEqualTo("Risk Review");
        assertThat(published.getDescription()).isEqualTo("Risk approval flow");
        assertThat(published.getXml()).isEqualTo("<definitions id=\"risk\"/>");
        assertThat(published.getCreatedAt()).isNotNull();
        assertThat(published.getUpdatedAt()).isNotNull();
        assertThat(published.getIsDeleted()).isFalse();
    }

    @Test
        void publishShouldIncrementVersionFromLatestPublished() {
        WorkspaceEntity workspace = WorkspaceEntity.builder().id("workspace-1").name("Workspace").slug("workspace").build();
        DmnEntity dmn = DmnEntity.builder()
                .id("dmn-1")
                .workspace(workspace)
                .title("Risk Review")
                .description("Risk approval flow")
                .xml("<definitions id=\"risk\"/>")
                .build();
        DmnPublishedVersionEntity latest = DmnPublishedVersionEntity.builder().id("pub-1").version(3).dmn(dmn).build();

        when(workspaceRepository.existsById("workspace-1")).thenReturn(true);
        when(dmnRepository.findByIdAndWorkspaceIdAndIsDeletedFalse("dmn-1", "workspace-1")).thenReturn(Optional.of(dmn));
        when(dmnPublishedVersionRepository.findTopByDmnIdAndIsDeletedFalseOrderByVersionDesc("dmn-1"))
                .thenReturn(Optional.of(latest));
        when(entityIdGenerator.nextId()).thenReturn("01JVZQ0YQYJ3Q");
        when(workspaceRepository.save(any(WorkspaceEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(dmnPublishedVersionRepository.save(any(DmnPublishedVersionEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        DmnPublishedVersionEntity published = dmnService.publish(
                "workspace-1",
                "dmn-1");

        assertThat(published.getVersion()).isEqualTo(4);
    }
}