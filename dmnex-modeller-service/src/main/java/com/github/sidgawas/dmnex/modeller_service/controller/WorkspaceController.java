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

import com.github.sidgawas.dmnex.modeller_service.mapper.PaginationMapper;
import com.github.sidgawas.dmnex.modeller_service.mapper.WorkspaceMapper;
import com.github.sidgawas.dmnex.modeller_service.model.request.WorkspaceCreateRequest;
import com.github.sidgawas.dmnex.modeller_service.model.response.PaginationResponse;
import com.github.sidgawas.dmnex.modeller_service.model.request.WorkspaceUpdateRequest;
import com.github.sidgawas.dmnex.modeller_service.model.response.WorkspaceResponse;
import com.github.sidgawas.dmnex.modeller_service.service.WorkspaceService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/workspaces")
public class WorkspaceController extends BaseController {

    private final WorkspaceService workspaceService;
    private final WorkspaceMapper workspaceMapper;
    private final PaginationMapper paginationMapper;

    public WorkspaceController(
            WorkspaceService workspaceService,
            WorkspaceMapper workspaceMapper,
            PaginationMapper paginationMapper) {
        this.workspaceService = workspaceService;
        this.workspaceMapper = workspaceMapper;
        this.paginationMapper = paginationMapper;
    }

    @PostMapping
    public ResponseEntity<WorkspaceResponse> createWorkspace(@RequestBody @Valid WorkspaceCreateRequest request) {
        WorkspaceResponse response = workspaceMapper.toResponse(workspaceService.create(request));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<PaginationResponse<WorkspaceResponse>> listWorkspaces(
            @RequestParam(defaultValue = "0", name = "page") int page,
            @RequestParam(defaultValue = "20", name = "size") int size,
            @RequestParam(required = false, name = "query") String query) {
        Page<WorkspaceResponse> responsePage = workspaceService.listAll(page, size, query)
                .map(workspaceMapper::toResponse);
        PaginationResponse<WorkspaceResponse> response = paginationMapper.toPaginationResponse(responsePage);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkspaceResponse> getWorkspaceById(@PathVariable(name = "id") String id) {
        WorkspaceResponse response = workspaceMapper.toResponse(workspaceService.getById(id));
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<WorkspaceResponse> updateWorkspace(
            @PathVariable(name = "id") String id,
            @RequestBody @Valid WorkspaceUpdateRequest request) {
        WorkspaceResponse response = workspaceMapper.toResponse(workspaceService.updateById(id, request));
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWorkspace(@PathVariable(name = "id") String id) {
        workspaceService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
