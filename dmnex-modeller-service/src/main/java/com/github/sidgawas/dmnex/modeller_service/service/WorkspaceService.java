package com.github.sidgawas.dmnex.modeller_service.service;

import java.time.LocalDateTime;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.github.sidgawas.dmnex.modeller_service.entity.WorkspaceEntity;
import com.github.sidgawas.dmnex.modeller_service.exception.ResourceNotFoundException;
import com.github.sidgawas.dmnex.modeller_service.mapper.WorkspaceMapper;
import com.github.sidgawas.dmnex.modeller_service.model.request.WorkspaceCreateRequest;
import com.github.sidgawas.dmnex.modeller_service.model.request.WorkspaceUpdateRequest;
import com.github.sidgawas.dmnex.modeller_service.repository.WorkspaceRepository;

@Service
public class WorkspaceService {

    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMapper workspaceMapper;
    private final EntityIdGenerator entityIdGenerator;

    public WorkspaceService(
            WorkspaceRepository workspaceRepository,
            WorkspaceMapper workspaceMapper,
            EntityIdGenerator entityIdGenerator) {
        this.workspaceRepository = workspaceRepository;
        this.workspaceMapper = workspaceMapper;
        this.entityIdGenerator = entityIdGenerator;
    }

    @Transactional
    public WorkspaceEntity create(WorkspaceCreateRequest request) {
        String normalizedName = normalizeName(request.getName());
        LocalDateTime now = LocalDateTime.now();

        WorkspaceEntity entity = workspaceMapper.toEntity(request);
        entity.setId(entityIdGenerator.nextId());
        entity.setName(normalizedName);
        entity.setSlug(generateUniqueSlug(normalizedName, null));
        entity.setCreatedAt(now);
        entity.setUpdatedAt(now);
        entity.setIsDeleted(Boolean.FALSE);

        return workspaceRepository.save(entity);
    }

    @Transactional(readOnly = true)
    public WorkspaceEntity getById(String id) {
        return workspaceRepository
                .findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found with id: " + id));
    }

    @Transactional(readOnly = true)
    public Page<WorkspaceEntity> listAll(int page, int size, String query) {
        validatePagination(page, size);

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt"));
        String normalizedQuery = normalizeQuery(query);

        if (normalizedQuery == null) {
            return workspaceRepository.findByIsDeletedFalse(pageable);
        }

        return workspaceRepository.findByIsDeletedFalseAndNameContainingIgnoreCase(normalizedQuery, pageable);
    }

    @Transactional
    public WorkspaceEntity updateById(String id, WorkspaceUpdateRequest request) {
        WorkspaceEntity entity = getById(id);
        String normalizedName = normalizeName(request.getName());
        LocalDateTime now = LocalDateTime.now();

        workspaceMapper.updateEntityFromRequest(request, entity);
        entity.setName(normalizedName);
        entity.setSlug(generateUniqueSlug(normalizedName, id));
        entity.setUpdatedAt(now);

        return workspaceRepository.save(entity);
    }

    @Transactional
    public void deleteById(String id) {
        WorkspaceEntity entity = getById(id);
        LocalDateTime now = LocalDateTime.now();

        entity.setIsDeleted(Boolean.TRUE);
        entity.setDeletedAt(now);
        entity.setUpdatedAt(now);

        workspaceRepository.save(entity);
    }

    private String normalizeName(String rawName) {
        if (rawName == null) {
            throw new IllegalArgumentException("Workspace name is required.");
        }

        String normalized = rawName.trim();

        if (normalized.isEmpty()) {
            throw new IllegalArgumentException("Workspace name is required.");
        }

        return normalized;
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

    private String generateUniqueSlug(String name, String currentWorkspaceId) {
        String baseSlug = slugify(name);

        if (baseSlug.isBlank()) {
            baseSlug = "workspace";
        }

        String candidate = baseSlug;
        int counter = 2;

        while (slugExists(candidate, currentWorkspaceId)) {
            candidate = baseSlug + "-" + counter;
            counter += 1;
        }

        return candidate;
    }

    private boolean slugExists(String slug, String currentWorkspaceId) {
        if (currentWorkspaceId == null) {
            return workspaceRepository.existsBySlugAndIsDeletedFalse(slug);
        }

        return workspaceRepository.existsBySlugAndIsDeletedFalseAndIdNot(slug, currentWorkspaceId);
    }

    private String slugify(String value) {
        return value
                .trim()
                .toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "");
    }
}
