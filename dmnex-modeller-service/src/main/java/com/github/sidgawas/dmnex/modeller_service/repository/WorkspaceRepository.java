package com.github.sidgawas.dmnex.modeller_service.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.github.sidgawas.dmnex.modeller_service.entity.WorkspaceEntity;

public interface WorkspaceRepository extends JpaRepository<WorkspaceEntity, String> {

    Optional<WorkspaceEntity> findByIdAndIsDeletedFalse(String id);

    Page<WorkspaceEntity> findByIsDeletedFalse(Pageable pageable);

    Page<WorkspaceEntity> findByIsDeletedFalseAndNameContainingIgnoreCase(String name, Pageable pageable);

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, String id);
}
