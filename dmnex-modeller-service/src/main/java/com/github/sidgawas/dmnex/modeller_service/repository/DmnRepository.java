package com.github.sidgawas.dmnex.modeller_service.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.github.sidgawas.dmnex.modeller_service.entity.DmnEntity;

public interface DmnRepository extends JpaRepository<DmnEntity, String> {

    Optional<DmnEntity> findByIdAndWorkspaceIdAndIsDeletedFalse(String id, String workspaceId);

    List<DmnEntity> findByWorkspaceIdAndIsDeletedFalse(String workspaceId);

    Page<DmnEntity> findByWorkspaceIdAndIsDeletedFalse(String workspaceId, Pageable pageable);

    Page<DmnEntity> findByWorkspaceIdAndIsDeletedFalseAndTitleContainingIgnoreCase(
            String workspaceId,
            String title,
            Pageable pageable);
}