package com.github.sidgawas.dmnex.modeller_service.service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
import com.github.sidgawas.dmnex.modeller_service.util.SortBuilder;

@Service
public class DmnService {

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
            "id",
            "title",
            "createdAt",
            "updatedAt");

    private final DmnRepository dmnRepository;
    private final DmnPublishedVersionRepository dmnPublishedVersionRepository;
    private final WorkspaceRepository workspaceRepository;
    private final DmnMapper dmnMapper;
    private final EntityIdGenerator entityIdGenerator;
    private final SortBuilder sortBuilder;

    public DmnService(
            DmnRepository dmnRepository,
            DmnPublishedVersionRepository dmnPublishedVersionRepository,
            WorkspaceRepository workspaceRepository,
            DmnMapper dmnMapper,
            EntityIdGenerator entityIdGenerator) {
        this.dmnRepository = dmnRepository;
        this.dmnPublishedVersionRepository = dmnPublishedVersionRepository;
        this.workspaceRepository = workspaceRepository;
        this.dmnMapper = dmnMapper;
        this.entityIdGenerator = entityIdGenerator;
        this.sortBuilder = new SortBuilder(Sort.Direction.DESC, ALLOWED_SORT_FIELDS);
    }

    @Transactional
    public DmnEntity create(String workspaceId, DmnCreateRequest request) {
        WorkspaceEntity workspace = getWorkspaceById(workspaceId);
        String normalizedTitle = normalizeTitle(request.getTitle());
        String normalizedXml = normalizeXml(request.getXml());
        String normalizedDescription = normalizeDescription(request.getDescription());
        LocalDateTime now = LocalDateTime.now();

        DmnEntity entity = dmnMapper.toEntity(request);
        entity.setId(entityIdGenerator.nextId());
        entity.setWorkspace(workspace);
        entity.setTitle(normalizedTitle);
        entity.setXml(normalizedXml);
        entity.setDescription(normalizedDescription);
        entity.setCreatedAt(now);
        entity.setUpdatedAt(now);
        entity.setIsDeleted(Boolean.FALSE);

        workspace.setUpdatedAt(now);
        workspaceRepository.save(workspace);

        return dmnRepository.save(entity);
    }

    @Transactional(readOnly = true)
    public DmnEntity getById(String workspaceId, String id) {
        verifyWorkspaceExists(workspaceId);

        return dmnRepository
                .findByIdAndWorkspaceIdAndIsDeletedFalse(id, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "DMN not found with id: " + id + " in workspace: " + workspaceId));
    }

    @Transactional(readOnly = true)
    public Page<DmnEntity> listAll(String workspaceId, int page, int size, String query, String sortBy, String sortOrder) {
        verifyWorkspaceExists(workspaceId);
        validatePagination(page, size);

        Pageable pageable = PageRequest.of(page, size, buildSort(sortBy, sortOrder));
        String normalizedQuery = normalizeQuery(query);

        if (normalizedQuery == null) {
            return dmnRepository.findByWorkspaceIdAndIsDeletedFalse(workspaceId, pageable);
        }

        return dmnRepository.findByWorkspaceIdAndIsDeletedFalseAndTitleContainingIgnoreCase(
                workspaceId,
                normalizedQuery,
                pageable);
    }

    @Transactional
    public DmnEntity updateById(String workspaceId, String id, DmnUpdateRequest request) {
        DmnEntity entity = getById(workspaceId, id);
        String normalizedTitle = normalizeTitle(request.getTitle());
        String normalizedXml = normalizeXml(request.getXml());
        String normalizedDescription = normalizeDescription(request.getDescription());
        LocalDateTime now = LocalDateTime.now();

        dmnMapper.updateEntityFromRequest(request, entity);
        entity.setTitle(normalizedTitle);
        entity.setXml(normalizedXml);
        entity.setDescription(normalizedDescription);
        entity.setUpdatedAt(now);

        WorkspaceEntity workspace = entity.getWorkspace();
        workspace.setUpdatedAt(now);
        workspaceRepository.save(workspace);

        return dmnRepository.save(entity);
    }

    @Transactional
    public void deleteById(String workspaceId, String id) {
        DmnEntity entity = getById(workspaceId, id);
        LocalDateTime now = LocalDateTime.now();

        entity.setIsDeleted(Boolean.TRUE);
        entity.setDeletedAt(now);
        entity.setUpdatedAt(now);

        WorkspaceEntity workspace = entity.getWorkspace();
        workspace.setUpdatedAt(now);
        workspaceRepository.save(workspace);

        dmnRepository.save(entity);
    }

    @Transactional
    public DmnPublishedVersionEntity publish(String workspaceId, String id) {
        DmnEntity dmn = getById(workspaceId, id);
        int nextVersion = dmnPublishedVersionRepository
                .findTopByDmnIdAndIsDeletedFalseOrderByVersionDesc(id)
                .map(existing -> existing.getVersion() + 1)
                .orElse(1);

        LocalDateTime now = LocalDateTime.now();

        DmnPublishedVersionEntity publishedVersion = DmnPublishedVersionEntity.builder()
                .id(entityIdGenerator.nextId())
                .dmn(dmn)
                .version(nextVersion)
                .title(dmn.getTitle())
                .description(dmn.getDescription())
                .xml(dmn.getXml())
                .build();
        publishedVersion.setIsDeleted(Boolean.FALSE);
        publishedVersion.setCreatedAt(now);
        publishedVersion.setUpdatedAt(now);

        WorkspaceEntity workspace = dmn.getWorkspace();
        workspace.setUpdatedAt(now);
        workspaceRepository.save(workspace);

        return dmnPublishedVersionRepository.save(publishedVersion);
    }

    @Transactional(readOnly = true)
    public Optional<DmnPublishedVersionEntity> getLatestPublishedVersion(String dmnId) {
        return dmnPublishedVersionRepository.findTopByDmnIdAndIsDeletedFalseOrderByVersionDesc(dmnId);
    }

    private void verifyWorkspaceExists(String workspaceId) {
        if (!workspaceRepository.existsById(workspaceId)) {
            throw new ResourceNotFoundException("Workspace not found with id: " + workspaceId);
        }
    }

    private WorkspaceEntity getWorkspaceById(String workspaceId) {
        return workspaceRepository
                .findByIdAndIsDeletedFalse(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found with id: " + workspaceId));
    }

    private Sort buildSort(String sortBy, String sortOrder) {
        return sortBuilder.build(sortBy, sortOrder).and(Sort.by(Sort.Direction.ASC, "id"));
    }

    private String normalizeTitle(String rawTitle) {
        if (rawTitle == null) {
            throw new IllegalArgumentException("DMN title is required.");
        }

        String normalized = rawTitle.trim();

        if (normalized.isEmpty()) {
            throw new IllegalArgumentException("DMN title is required.");
        }

        return normalized;
    }

    private String normalizeXml(String rawXml) {
        if (rawXml == null) {
            throw new IllegalArgumentException("DMN xml is required.");
        }

        String normalized = rawXml.trim();

        if (normalized.isEmpty()) {
            throw new IllegalArgumentException("DMN xml is required.");
        }

        return normalized;
    }

    private String normalizeDescription(String rawDescription) {
        if (rawDescription == null) {
            return null;
        }

        String normalized = rawDescription.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private String normalizeQuery(String rawQuery) {
        if (rawQuery == null) {
            return null;
        }

        String normalized = rawQuery.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private void validatePagination(int page, int size) {
        if (page < 0) {
            throw new IllegalArgumentException("Page must be greater than or equal to 0.");
        }

        if (size < 1) {
            throw new IllegalArgumentException("Size must be greater than 0.");
        }
    }
}