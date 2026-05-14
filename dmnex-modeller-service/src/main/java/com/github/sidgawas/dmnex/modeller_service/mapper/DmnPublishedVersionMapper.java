package com.github.sidgawas.dmnex.modeller_service.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

import com.github.sidgawas.dmnex.modeller_service.entity.DmnPublishedVersionEntity;
import com.github.sidgawas.dmnex.modeller_service.model.response.DmnPublishedVersionResponse;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface DmnPublishedVersionMapper {

    @Mapping(target = "dmnId", expression = "java(entity.getDmn() == null ? null : entity.getDmn().getId())")
    @Mapping(
            target = "workspaceId",
            expression = "java(entity.getDmn() == null || entity.getDmn().getWorkspace() == null ? null : entity.getDmn().getWorkspace().getId())")
    DmnPublishedVersionResponse toResponse(DmnPublishedVersionEntity entity);
}
