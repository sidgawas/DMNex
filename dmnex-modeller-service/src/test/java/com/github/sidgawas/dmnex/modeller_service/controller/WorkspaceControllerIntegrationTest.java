package com.github.sidgawas.dmnex.modeller_service.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;

import com.github.sidgawas.dmnex.modeller_service.entity.WorkspaceEntity;
import com.github.sidgawas.dmnex.modeller_service.repository.WorkspaceRepository;

import tools.jackson.databind.ObjectMapper;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:workspace-test;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.hibernate.ddl-auto=none",
    "spring.liquibase.enabled=false"
})
@AutoConfigureMockMvc
class WorkspaceControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private WorkspaceRepository workspaceRepository;

    @Test
    void createWorkspaceShouldReturnCreatedResponse() throws Exception {
        when(workspaceRepository.existsBySlugAndIsDeletedFalse(anyString())).thenReturn(false);
        when(workspaceRepository.save(any(WorkspaceEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(post("/api/v1/workspaces")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new CreatePayload("Risk Management"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.name").value("Risk Management"))
                .andExpect(jsonPath("$.slug").value("risk-management"))
                .andExpect(jsonPath("$.createdBy").value("SYSTEM"))
                .andExpect(jsonPath("$.updatedBy").value("SYSTEM"))
                .andExpect(jsonPath("$.deletedBy").value("SYSTEM"));
    }

    @Test
    void createWorkspaceShouldReturnBadRequestWhenNameMissing() throws Exception {
        mockMvc.perform(post("/api/v1/workspaces")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"   \"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.errors.name").isNotEmpty());
    }

    @Test
    void getWorkspaceShouldReturnNotFoundForMissingId() throws Exception {
        when(workspaceRepository.findByIdAndIsDeletedFalse("missing-id")).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/v1/workspaces/missing-id"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Workspace not found with id: missing-id"));
    }

    @Test
    void listWorkspaceShouldReturnPaginatedRecords() throws Exception {
        WorkspaceEntity first = WorkspaceEntity.builder().id("1").name("One").slug("one").build();
        first.setCreatedAt(LocalDateTime.now().minusHours(2));
        first.setUpdatedAt(LocalDateTime.now().minusHours(1));

        WorkspaceEntity second = WorkspaceEntity.builder().id("2").name("Two").slug("two").build();
        second.setCreatedAt(LocalDateTime.now().minusHours(4));
        second.setUpdatedAt(LocalDateTime.now().minusHours(3));
        PageRequest pageRequest = PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "updatedAt"));

        when(workspaceRepository.findByIsDeletedFalse(pageRequest))
            .thenReturn(new PageImpl<>(List.of(first, second), pageRequest, 2));

        mockMvc.perform(get("/api/v1/workspaces"))
                .andExpect(status().isOk())
            .andExpect(jsonPath("$.items[0].id").value("1"))
            .andExpect(jsonPath("$.items[1].id").value("2"))
            .andExpect(jsonPath("$.items[0].createdBy").value("SYSTEM"))
            .andExpect(jsonPath("$.items[0].updatedBy").value("SYSTEM"))
            .andExpect(jsonPath("$.items[0].deletedBy").value("SYSTEM"))
            .andExpect(jsonPath("$.page").value(0))
            .andExpect(jsonPath("$.size").value(20))
            .andExpect(jsonPath("$.totalItems").value(2))
            .andExpect(jsonPath("$.totalPages").value(1))
            .andExpect(jsonPath("$.hasNext").value(false))
            .andExpect(jsonPath("$.hasPrevious").value(false));
        }

        @Test
        void listWorkspaceShouldSearchByNameWhenQueryProvided() throws Exception {
        WorkspaceEntity first = WorkspaceEntity.builder().id("1").name("Risk Management").slug("risk-management").build();
        PageRequest pageRequest = PageRequest.of(1, 5, Sort.by(Sort.Direction.DESC, "updatedAt"));

        when(workspaceRepository.findByIsDeletedFalseAndNameContainingIgnoreCase("risk", pageRequest))
            .thenReturn(new PageImpl<>(List.of(first), pageRequest, 6));

        mockMvc.perform(get("/api/v1/workspaces")
            .queryParam("page", "1")
            .queryParam("size", "5")
            .queryParam("query", "risk"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.items[0].id").value("1"))
            .andExpect(jsonPath("$.page").value(1))
            .andExpect(jsonPath("$.size").value(5))
            .andExpect(jsonPath("$.totalItems").value(6))
            .andExpect(jsonPath("$.totalPages").value(2))
            .andExpect(jsonPath("$.hasNext").value(false))
            .andExpect(jsonPath("$.hasPrevious").value(true));
        }

        @Test
        void listWorkspaceShouldReturnBadRequestForInvalidPagination() throws Exception {
        mockMvc.perform(get("/api/v1/workspaces").queryParam("size", "0"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Size must be greater than 0."));
    }

    @Test
    void updateWorkspaceShouldReturnUpdatedPayload() throws Exception {
        WorkspaceEntity existing = WorkspaceEntity.builder().id("workspace-id").name("Old").slug("old").build();
        existing.setCreatedAt(LocalDateTime.now().minusDays(1));
        existing.setUpdatedAt(LocalDateTime.now().minusHours(1));

        when(workspaceRepository.findByIdAndIsDeletedFalse("workspace-id")).thenReturn(Optional.of(existing));
        when(workspaceRepository.existsBySlugAndIsDeletedFalseAndIdNot("new-name", "workspace-id")).thenReturn(false);
        when(workspaceRepository.save(any(WorkspaceEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(put("/api/v1/workspaces/workspace-id")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"New Name\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("workspace-id"))
                .andExpect(jsonPath("$.name").value("New Name"))
                .andExpect(jsonPath("$.slug").value("new-name"))
                .andExpect(jsonPath("$.createdBy").value("SYSTEM"))
                .andExpect(jsonPath("$.updatedBy").value("SYSTEM"))
                .andExpect(jsonPath("$.deletedBy").value("SYSTEM"));
    }

    @Test
    void deleteWorkspaceShouldReturnNoContent() throws Exception {
        WorkspaceEntity existing = WorkspaceEntity.builder().id("workspace-id").name("Delete").slug("delete").build();
        when(workspaceRepository.findByIdAndIsDeletedFalse("workspace-id")).thenReturn(Optional.of(existing));
        when(workspaceRepository.save(any(WorkspaceEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(delete("/api/v1/workspaces/workspace-id"))
                .andExpect(status().isNoContent());
    }

    private record CreatePayload(String name) {
    }
}
