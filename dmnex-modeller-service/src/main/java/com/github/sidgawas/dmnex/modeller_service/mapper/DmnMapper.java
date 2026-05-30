package com.github.sidgawas.dmnex.modeller_service.mapper;

import java.util.List;

import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

import com.github.sidgawas.dmnex.modeller_service.entity.DmnEntity;
import com.github.sidgawas.dmnex.modeller_service.model.request.DmnCreateRequest;
import com.github.sidgawas.dmnex.modeller_service.model.request.DmnUpdateRequest;
import com.github.sidgawas.dmnex.modeller_service.model.response.DmnResponseLite;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface DmnMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "workspace", ignore = true)
    @Mapping(target = "title", expression = "java(request.getTitle() == null ? null : request.getTitle().trim())")
    @Mapping(target = "xml", expression = "java(request.getXml() == null ? null : request.getXml().trim())")
    @Mapping(target = "description", expression = "java(request.getDescription() == null ? null : request.getDescription().trim())")
    DmnEntity toEntity(DmnCreateRequest request);

    @Mapping(target = "workspaceId", expression = "java(entity.getWorkspace() == null ? null : entity.getWorkspace().getId())")
    DmnResponseLite toLiteResponse(DmnEntity entity);

    List<DmnResponseLite> toLiteResponseList(List<DmnEntity> entities);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "workspace", ignore = true)
    @Mapping(target = "title", expression = "java(request.getTitle() == null ? null : request.getTitle().trim())")
    @Mapping(target = "xml", expression = "java(request.getXml() == null ? null : request.getXml().trim())")
    @Mapping(target = "description", expression = "java(request.getDescription() == null ? null : request.getDescription().trim())")
    void updateEntityFromRequest(DmnUpdateRequest request, @MappingTarget DmnEntity entity);
}