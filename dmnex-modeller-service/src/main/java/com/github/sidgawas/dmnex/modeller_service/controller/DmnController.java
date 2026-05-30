package com.github.sidgawas.dmnex.modeller_service.controller;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.github.sidgawas.dmnex.modeller_service.entity.DmnEntity;
import com.github.sidgawas.dmnex.modeller_service.entity.DmnPublishedVersionEntity;
import com.github.sidgawas.dmnex.modeller_service.mapper.DmnMapper;
import com.github.sidgawas.dmnex.modeller_service.mapper.DmnPublishedVersionMapper;
import com.github.sidgawas.dmnex.modeller_service.mapper.PaginationMapper;
import com.github.sidgawas.dmnex.modeller_service.model.request.DmnCreateRequest;
import com.github.sidgawas.dmnex.modeller_service.model.request.DmnUpdateRequest;
import com.github.sidgawas.dmnex.modeller_service.model.response.DmnPublishedVersionResponse;
import com.github.sidgawas.dmnex.modeller_service.model.response.DmnResponse;
import com.github.sidgawas.dmnex.modeller_service.model.response.DmnResponseLite;
import com.github.sidgawas.dmnex.modeller_service.model.response.PaginationResponse;
import com.github.sidgawas.dmnex.modeller_service.service.DmnService;

import jakarta.validation.Valid;

import java.util.Optional;

@RestController
@RequestMapping("/api/v1/workspaces/{workspaceId}/dmns")
public class DmnController extends BaseController {

    private final DmnService dmnService;
    private final DmnMapper dmnMapper;
    private final DmnPublishedVersionMapper dmnPublishedVersionMapper;
    private final PaginationMapper paginationMapper;

    public DmnController(
            DmnService dmnService,
            DmnMapper dmnMapper,
            DmnPublishedVersionMapper dmnPublishedVersionMapper,
            PaginationMapper paginationMapper) {
        this.dmnService = dmnService;
        this.dmnMapper = dmnMapper;
        this.dmnPublishedVersionMapper = dmnPublishedVersionMapper;
        this.paginationMapper = paginationMapper;
    }

    @PostMapping
    public ResponseEntity<DmnResponse> createDmn(
            @PathVariable(name = "workspaceId") String workspaceId,
            @RequestBody @Valid DmnCreateRequest request) {
        DmnResponse response = toDetailResponse(dmnService.create(workspaceId, request));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<PaginationResponse<DmnResponseLite>> listDmns(
            @PathVariable(name = "workspaceId") String workspaceId,
            @RequestParam(defaultValue = "0", name = "page") int page,
            @RequestParam(defaultValue = "20", name = "size") int size,
            @RequestParam(required = false, name = "query") String query,
            @RequestParam(defaultValue = "updatedAt", name = "sortBy") String sortBy,
            @RequestParam(defaultValue = "desc", name = "sortOrder") String sortOrder) {
        Page<DmnResponseLite> responsePage = dmnService.listAll(workspaceId, page, size, query, sortBy, sortOrder)
                .map(this::toLiteResponse);
        PaginationResponse<DmnResponseLite> response = paginationMapper.toPaginationResponse(responsePage);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DmnResponse> getDmnById(
            @PathVariable(name = "workspaceId") String workspaceId,
            @PathVariable(name = "id") String id) {
        DmnResponse response = toDetailResponse(dmnService.getById(workspaceId, id));
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<DmnResponse> updateDmn(
            @PathVariable(name = "workspaceId") String workspaceId,
            @PathVariable(name = "id") String id,
            @RequestBody @Valid DmnUpdateRequest request) {
        DmnResponse response = toDetailResponse(dmnService.updateById(workspaceId, id, request));
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/publish")
    public ResponseEntity<DmnPublishedVersionResponse> publishDmn(
            @PathVariable(name = "workspaceId") String workspaceId,
            @PathVariable(name = "id") String id) {
        DmnPublishedVersionResponse response =
                dmnPublishedVersionMapper.toResponse(dmnService.publish(workspaceId, id));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDmn(
            @PathVariable(name = "workspaceId") String workspaceId,
            @PathVariable(name = "id") String id) {
        dmnService.deleteById(workspaceId, id);
        return ResponseEntity.noContent().build();
    }

    private DmnResponseLite toLiteResponse(DmnEntity entity) {
        DmnResponseLite liteResponse = dmnMapper.toLiteResponse(entity);
        Optional<DmnPublishedVersionEntity> latestPublished = getLatestPublishedVersionSafe(entity.getId());
        liteResponse.setPublishedVersionNumber(latestPublished.map(DmnPublishedVersionEntity::getVersion).orElse(null));
        liteResponse.setLastPublishedAt(latestPublished.map(DmnPublishedVersionEntity::getCreatedAt).orElse(null));
        return liteResponse;
    }

    private DmnResponse toDetailResponse(DmnEntity entity) {
        DmnResponseLite liteResponse = toLiteResponse(entity);
        Optional<DmnPublishedVersionEntity> latestPublished = getLatestPublishedVersionSafe(entity.getId());
        DmnPublishedVersionResponse publishedResponse = latestPublished
                .map(dmnPublishedVersionMapper::toResponse)
                .orElse(null);

        return DmnResponse.builder()
                .id(liteResponse.getId())
                .workspaceId(liteResponse.getWorkspaceId())
                .title(liteResponse.getTitle())
                .description(liteResponse.getDescription())
                .xml(liteResponse.getXml())
                .publishedVersionNumber(liteResponse.getPublishedVersionNumber())
                .lastPublishedAt(liteResponse.getLastPublishedAt())
                .publishedDmn(publishedResponse)
                .createdAt(liteResponse.getCreatedAt())
                .updatedAt(liteResponse.getUpdatedAt())
                .createdBy(liteResponse.getCreatedBy())
                .updatedBy(liteResponse.getUpdatedBy())
                .deletedBy(liteResponse.getDeletedBy())
                .build();
    }

    private Optional<DmnPublishedVersionEntity> getLatestPublishedVersionSafe(String dmnId) {
        Optional<DmnPublishedVersionEntity> latest = dmnService.getLatestPublishedVersion(dmnId);
        return latest == null ? Optional.empty() : latest;
    }
}