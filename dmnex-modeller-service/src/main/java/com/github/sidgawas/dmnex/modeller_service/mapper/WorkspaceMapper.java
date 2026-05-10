package com.github.sidgawas.dmnex.modeller_service.mapper;

import java.util.List;

import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

import com.github.sidgawas.dmnex.modeller_service.entity.WorkspaceEntity;
import com.github.sidgawas.dmnex.modeller_service.model.request.WorkspaceCreateRequest;
import com.github.sidgawas.dmnex.modeller_service.model.request.WorkspaceUpdateRequest;
import com.github.sidgawas.dmnex.modeller_service.model.response.WorkspaceResponse;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface WorkspaceMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "slug", ignore = true)
    @Mapping(target = "name", expression = "java(request.getName() == null ? null : request.getName().trim())")
    WorkspaceEntity toEntity(WorkspaceCreateRequest request);

    WorkspaceResponse toResponse(WorkspaceEntity entity);

    List<WorkspaceResponse> toResponseList(List<WorkspaceEntity> entities);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "slug", ignore = true)
    @Mapping(target = "name", expression = "java(request.getName() == null ? null : request.getName().trim())")
    void updateEntityFromRequest(WorkspaceUpdateRequest request, @MappingTarget WorkspaceEntity entity);
}
