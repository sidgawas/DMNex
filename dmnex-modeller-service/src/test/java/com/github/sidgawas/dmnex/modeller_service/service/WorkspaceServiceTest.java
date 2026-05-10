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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.mapstruct.factory.Mappers;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.github.sidgawas.dmnex.modeller_service.entity.WorkspaceEntity;
import com.github.sidgawas.dmnex.modeller_service.exception.ResourceNotFoundException;
import com.github.sidgawas.dmnex.modeller_service.mapper.WorkspaceMapper;
import com.github.sidgawas.dmnex.modeller_service.model.request.WorkspaceCreateRequest;
import com.github.sidgawas.dmnex.modeller_service.model.request.WorkspaceUpdateRequest;
import com.github.sidgawas.dmnex.modeller_service.repository.WorkspaceRepository;

@ExtendWith(MockitoExtension.class)
class WorkspaceServiceTest {

    @Mock
    private WorkspaceRepository workspaceRepository;

    @Mock
    private EntityIdGenerator entityIdGenerator;

    private WorkspaceService workspaceService;

    @BeforeEach
    void setUp() {
        WorkspaceMapper workspaceMapper = Mappers.getMapper(WorkspaceMapper.class);
        workspaceService = new WorkspaceService(workspaceRepository, workspaceMapper, entityIdGenerator);
    }

    @Test
    void createShouldNormalizeNameAndGenerateSlug() {
        when(entityIdGenerator.nextId()).thenReturn("01JVZQ0YQYJ3A");
        when(workspaceRepository.existsBySlug("risk-management")).thenReturn(false);
        when(workspaceRepository.save(any(WorkspaceEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        WorkspaceCreateRequest request = WorkspaceCreateRequest.builder().name("  Risk Management  ").build();

        WorkspaceEntity created = workspaceService.create(request);

        assertThat(created.getId()).isEqualTo("01JVZQ0YQYJ3A");
        assertThat(created.getName()).isEqualTo("Risk Management");
        assertThat(created.getSlug()).isEqualTo("risk-management");
        assertThat(created.getCreatedAt()).isNotNull();
        assertThat(created.getUpdatedAt()).isNotNull();
        assertThat(created.getIsDeleted()).isFalse();
    }

    @Test
    void createShouldAddSlugSuffixWhenBaseSlugExists() {
        when(entityIdGenerator.nextId()).thenReturn("01JVZQ0YQYJ3B");
        when(workspaceRepository.existsBySlug("risk-management")).thenReturn(true);
        when(workspaceRepository.existsBySlug("risk-management-2")).thenReturn(false);
        when(workspaceRepository.save(any(WorkspaceEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        WorkspaceCreateRequest request = WorkspaceCreateRequest.builder().name("Risk Management").build();

        WorkspaceEntity created = workspaceService.create(request);

        assertThat(created.getSlug()).isEqualTo("risk-management-2");
    }

    @Test
    void createShouldAddSlugSuffixWhenMatchingSlugExistsOnlyOnDeletedWorkspace() {
        when(entityIdGenerator.nextId()).thenReturn("01JVZQ0YQYJ3C");
        when(workspaceRepository.existsBySlug("risk-management")).thenReturn(true);
        when(workspaceRepository.existsBySlug("risk-management-2")).thenReturn(false);
        when(workspaceRepository.save(any(WorkspaceEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        WorkspaceCreateRequest request = WorkspaceCreateRequest.builder().name("Risk Management").build();

        WorkspaceEntity created = workspaceService.create(request);

        assertThat(created.getSlug()).isEqualTo("risk-management-2");
    }

    @Test
    void getByIdShouldThrowWhenWorkspaceNotFound() {
        when(workspaceRepository.findByIdAndIsDeletedFalse("missing-id")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> workspaceService.getById("missing-id"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("missing-id");
    }

    @Test
    void listAllShouldReturnPaginatedActiveWorkspacesWhenQueryMissing() {
        WorkspaceEntity first = WorkspaceEntity.builder().id("1").name("First").slug("first").build();
        WorkspaceEntity second = WorkspaceEntity.builder().id("2").name("Second").slug("second").build();
        PageRequest pageRequest = PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "updatedAt"));
        Page<WorkspaceEntity> page = new PageImpl<>(List.of(first, second), pageRequest, 2);

        when(workspaceRepository.findByIsDeletedFalse(pageRequest)).thenReturn(page);

        Page<WorkspaceEntity> list = workspaceService.listAll(0, 20, null);

        assertThat(list.getContent()).containsExactly(first, second);
        assertThat(list.getTotalElements()).isEqualTo(2);
    }

    @Test
    void listAllShouldSearchByNameWhenQueryProvided() {
        WorkspaceEntity first = WorkspaceEntity.builder().id("1").name("Risk Management").slug("risk-management").build();
        PageRequest pageRequest = PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "updatedAt"));
        Page<WorkspaceEntity> page = new PageImpl<>(List.of(first), pageRequest, 1);

        when(workspaceRepository.findByIsDeletedFalseAndNameContainingIgnoreCase("risk", pageRequest)).thenReturn(page);

        Page<WorkspaceEntity> list = workspaceService.listAll(0, 10, "  risk  ");

        assertThat(list.getContent()).containsExactly(first);
        assertThat(list.getTotalElements()).isEqualTo(1);
    }

    @Test
    void listAllShouldFailWhenPageIsNegative() {
        assertThatThrownBy(() -> workspaceService.listAll(-1, 20, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Page must be greater than or equal to 0.");

        verify(workspaceRepository, never()).findByIsDeletedFalse(any());
    }

    @Test
    void updateByIdShouldRefreshNameAndSlug() {
        WorkspaceEntity entity = WorkspaceEntity.builder()
                .id("workspace-id")
                .name("Old Name")
                .slug("old-name")
                .build();
        entity.setCreatedAt(LocalDateTime.now().minusDays(1));
        entity.setUpdatedAt(LocalDateTime.now().minusDays(1));
        entity.setIsDeleted(false);

        when(workspaceRepository.findByIdAndIsDeletedFalse("workspace-id")).thenReturn(Optional.of(entity));
        when(workspaceRepository.existsBySlugAndIdNot("new-name", "workspace-id")).thenReturn(false);
        when(workspaceRepository.save(any(WorkspaceEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        WorkspaceUpdateRequest request = WorkspaceUpdateRequest.builder().name("  New Name  ").build();

        WorkspaceEntity updated = workspaceService.updateById("workspace-id", request);

        assertThat(updated.getName()).isEqualTo("New Name");
        assertThat(updated.getSlug()).isEqualTo("new-name");
        assertThat(updated.getUpdatedAt()).isAfter(updated.getCreatedAt());
    }

    @Test
    void deleteByIdShouldSoftDeleteWorkspace() {
        WorkspaceEntity entity = WorkspaceEntity.builder()
                .id("workspace-id")
                .name("To Delete")
                .slug("to-delete")
                .build();
        entity.setIsDeleted(false);

        when(workspaceRepository.findByIdAndIsDeletedFalse("workspace-id")).thenReturn(Optional.of(entity));
        when(workspaceRepository.save(any(WorkspaceEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        workspaceService.deleteById("workspace-id");

        ArgumentCaptor<WorkspaceEntity> captor = ArgumentCaptor.forClass(WorkspaceEntity.class);
        verify(workspaceRepository).save(captor.capture());

        WorkspaceEntity saved = captor.getValue();
        assertThat(saved.getIsDeleted()).isTrue();
        assertThat(saved.getDeletedAt()).isNotNull();
        assertThat(saved.getUpdatedAt()).isNotNull();
    }

    @Test
    void createShouldFailForBlankName() {
        WorkspaceCreateRequest request = WorkspaceCreateRequest.builder().name("   ").build();

        assertThatThrownBy(() -> workspaceService.create(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Workspace name is required.");

        verify(workspaceRepository, never()).save(any(WorkspaceEntity.class));
    }
}
