package com.github.sidgawas.dmnex.modeller_service.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.github.sidgawas.dmnex.modeller_service.entity.DmnPublishedVersionEntity;

public interface DmnPublishedVersionRepository extends JpaRepository<DmnPublishedVersionEntity, String> {

    Optional<DmnPublishedVersionEntity> findTopByDmnIdAndIsDeletedFalseOrderByVersionDesc(String dmnId);
}
