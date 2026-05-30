package com.github.sidgawas.dmnex.modeller_service.controller;

import static org.mockito.ArgumentMatchers.any;
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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.github.sidgawas.dmnex.modeller_service.entity.DmnEntity;
import com.github.sidgawas.dmnex.modeller_service.entity.DmnPublishedVersionEntity;
import com.github.sidgawas.dmnex.modeller_service.entity.WorkspaceEntity;
import com.github.sidgawas.dmnex.modeller_service.repository.DmnPublishedVersionRepository;
import com.github.sidgawas.dmnex.modeller_service.repository.DmnRepository;
import com.github.sidgawas.dmnex.modeller_service.repository.WorkspaceRepository;

import tools.jackson.databind.ObjectMapper;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:dmn-test;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=none",
        "spring.liquibase.enabled=false"
})
@AutoConfigureMockMvc
class DmnControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private DmnRepository dmnRepository;

    @MockitoBean
    private WorkspaceRepository workspaceRepository;

        @MockitoBean
        private DmnPublishedVersionRepository dmnPublishedVersionRepository;

    @Test
    void createDmnShouldReturnCreatedResponse() throws Exception {
        WorkspaceEntity workspace = WorkspaceEntity.builder().id("workspace-1").name("Workspace").slug("workspace").build();
        when(workspaceRepository.findByIdAndIsDeletedFalse("workspace-1")).thenReturn(Optional.of(workspace));
        when(workspaceRepository.save(any(WorkspaceEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(dmnRepository.save(any(DmnEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(dmnPublishedVersionRepository.findTopByDmnIdAndIsDeletedFalseOrderByVersionDesc(any()))
                .thenReturn(Optional.empty());

        mockMvc.perform(post("/api/v1/workspaces/workspace-1/dmns")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new DmnPayload("Risk Review", "<definitions id=\"risk\"/>", "Initial description"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.workspaceId").value("workspace-1"))
                .andExpect(jsonPath("$.title").value("Risk Review"))
                .andExpect(jsonPath("$.description").value("Initial description"))
                .andExpect(jsonPath("$.xml").value("<definitions id=\"risk\"/>"))
                .andExpect(jsonPath("$.publishedVersionNumber").isEmpty())
                .andExpect(jsonPath("$.publishedDmn").isEmpty())
                .andExpect(jsonPath("$.createdBy").value("SYSTEM"))
                .andExpect(jsonPath("$.updatedBy").value("SYSTEM"))
                .andExpect(jsonPath("$.deletedBy").value("SYSTEM"));
    }

    @Test
    void createDmnShouldReturnBadRequestWhenTitleMissing() throws Exception {
        mockMvc.perform(post("/api/v1/workspaces/workspace-1/dmns")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"   \"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.errors.title").isNotEmpty());
    }

    @Test
    void getDmnShouldReturnNotFoundForMissingId() throws Exception {
        when(workspaceRepository.existsById("workspace-1")).thenReturn(true);
        when(dmnRepository.findByIdAndWorkspaceIdAndIsDeletedFalse("missing-id", "workspace-1")).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/v1/workspaces/workspace-1/dmns/missing-id"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message")
                        .value("DMN not found with id: missing-id in workspace: workspace-1"));
    }

    @Test
    void listDmnsShouldReturnPaginatedRecords() throws Exception {
        WorkspaceEntity workspace = WorkspaceEntity.builder().id("workspace-1").name("Workspace").slug("workspace").build();

        DmnEntity first = DmnEntity.builder()
                .id("dmn-1")
                .workspace(workspace)
                .title("Risk Review")
                .description("First description")
                .xml("<definitions id=\"first\"/>")
                .build();
        first.setCreatedAt(LocalDateTime.now().minusHours(2));
        first.setUpdatedAt(LocalDateTime.now().minusHours(1));

        DmnEntity second = DmnEntity.builder()
                .id("dmn-2")
                .workspace(workspace)
                .title("Eligibility")
                .description("Second description")
                .xml("<definitions id=\"second\"/>")
                .build();
        second.setCreatedAt(LocalDateTime.now().minusHours(4));
        second.setUpdatedAt(LocalDateTime.now().minusHours(3));

        PageRequest pageRequest = PageRequest.of(
                0,
                20,
                Sort.by(Sort.Direction.DESC, "updatedAt").and(Sort.by(Sort.Direction.ASC, "id")));

        when(workspaceRepository.existsById("workspace-1")).thenReturn(true);
        when(dmnRepository.findByWorkspaceIdAndIsDeletedFalse("workspace-1", pageRequest))
                .thenReturn(new PageImpl<>(List.of(first, second), pageRequest, 2));
        when(dmnPublishedVersionRepository.findTopByDmnIdAndIsDeletedFalseOrderByVersionDesc("dmn-1"))
                .thenReturn(Optional.empty());
        DmnPublishedVersionEntity latest = DmnPublishedVersionEntity.builder().id("pub-1").version(1).dmn(second).build();
        latest.setCreatedAt(LocalDateTime.parse("2026-05-15T08:30:00"));
        when(dmnPublishedVersionRepository.findTopByDmnIdAndIsDeletedFalseOrderByVersionDesc("dmn-2"))
                .thenReturn(Optional.of(latest));

        mockMvc.perform(get("/api/v1/workspaces/workspace-1/dmns"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].id").value("dmn-1"))
                .andExpect(jsonPath("$.items[1].id").value("dmn-2"))
                .andExpect(jsonPath("$.items[0].description").value("First description"))
                .andExpect(jsonPath("$.items[1].description").value("Second description"))
                .andExpect(jsonPath("$.items[0].xml").value("<definitions id=\"first\"/>"))
                .andExpect(jsonPath("$.items[1].xml").value("<definitions id=\"second\"/>"))
                .andExpect(jsonPath("$.items[0].publishedVersionNumber").isEmpty())
                .andExpect(jsonPath("$.items[1].publishedVersionNumber").value(1))
                .andExpect(jsonPath("$.items[0].lastPublishedAt").isEmpty())
                .andExpect(jsonPath("$.items[1].lastPublishedAt").value("2026-05-15T08:30:00"))
                .andExpect(jsonPath("$.items[0].workspaceId").value("workspace-1"))
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(20))
                .andExpect(jsonPath("$.totalItems").value(2))
                .andExpect(jsonPath("$.totalPages").value(1))
                .andExpect(jsonPath("$.hasNext").value(false))
                .andExpect(jsonPath("$.hasPrevious").value(false));
    }

    @Test
    void updateDmnShouldReturnUpdatedPayload() throws Exception {
        WorkspaceEntity workspace = WorkspaceEntity.builder().id("workspace-1").name("Workspace").slug("workspace").build();
        DmnEntity existing = DmnEntity.builder()
                .id("dmn-1")
                .workspace(workspace)
                .title("Old Title")
                .description("Old description")
                .xml("<definitions id=\"old\"/>")
                .build();
        existing.setCreatedAt(LocalDateTime.now().minusDays(1));
        existing.setUpdatedAt(LocalDateTime.now().minusHours(1));

        when(workspaceRepository.existsById("workspace-1")).thenReturn(true);
        when(dmnRepository.findByIdAndWorkspaceIdAndIsDeletedFalse("dmn-1", "workspace-1")).thenReturn(Optional.of(existing));
        when(workspaceRepository.save(any(WorkspaceEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(dmnRepository.save(any(DmnEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));
        DmnPublishedVersionEntity latest = DmnPublishedVersionEntity.builder().id("pub-1").version(2).dmn(existing).build();
        latest.setCreatedAt(LocalDateTime.parse("2026-05-16T09:45:00"));
        when(dmnPublishedVersionRepository.findTopByDmnIdAndIsDeletedFalseOrderByVersionDesc("dmn-1"))
                .thenReturn(Optional.of(latest));

        mockMvc.perform(put("/api/v1/workspaces/workspace-1/dmns/dmn-1")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"New Title\",\"xml\":\"<definitions id=\\\"new\\\"/>\",\"description\":\"Updated description\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("dmn-1"))
                .andExpect(jsonPath("$.workspaceId").value("workspace-1"))
                .andExpect(jsonPath("$.title").value("New Title"))
                .andExpect(jsonPath("$.description").value("Updated description"))
                .andExpect(jsonPath("$.xml").value("<definitions id=\"new\"/>"))
                .andExpect(jsonPath("$.publishedVersionNumber").value(2))
                .andExpect(jsonPath("$.lastPublishedAt").value("2026-05-16T09:45:00"))
                .andExpect(jsonPath("$.publishedDmn.id").value("pub-1"))
                .andExpect(jsonPath("$.publishedDmn.version").value(2));
    }

    @Test
    void publishDmnShouldReturnPublishedVersion() throws Exception {
        WorkspaceEntity workspace = WorkspaceEntity.builder().id("workspace-1").name("Workspace").slug("workspace").build();
        DmnEntity existing = DmnEntity.builder()
                .id("dmn-1")
                .workspace(workspace)
                .title("Risk Review")
                .description("Draft description")
                .xml("<definitions id=\"risk\"/>")
                .build();

        when(workspaceRepository.existsById("workspace-1")).thenReturn(true);
        when(dmnRepository.findByIdAndWorkspaceIdAndIsDeletedFalse("dmn-1", "workspace-1")).thenReturn(Optional.of(existing));
        when(dmnPublishedVersionRepository.findTopByDmnIdAndIsDeletedFalseOrderByVersionDesc("dmn-1"))
                .thenReturn(Optional.empty());
        when(workspaceRepository.save(any(WorkspaceEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(dmnPublishedVersionRepository.save(any(DmnPublishedVersionEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(post("/api/v1/workspaces/workspace-1/dmns/dmn-1/publish")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.dmnId").value("dmn-1"))
                .andExpect(jsonPath("$.workspaceId").value("workspace-1"))
                .andExpect(jsonPath("$.version").value(1))
                .andExpect(jsonPath("$.title").value("Risk Review"))
                .andExpect(jsonPath("$.description").value("Draft description"))
                .andExpect(jsonPath("$.xml").value("<definitions id=\"risk\"/>"));
    }

    @Test
    void deleteDmnShouldReturnNoContent() throws Exception {
        WorkspaceEntity workspace = WorkspaceEntity.builder().id("workspace-1").name("Workspace").slug("workspace").build();
        DmnEntity existing = DmnEntity.builder()
                .id("dmn-1")
                .workspace(workspace)
                .title("Delete")
                .xml("<definitions id=\"delete\"/>")
                .build();

        when(workspaceRepository.existsById("workspace-1")).thenReturn(true);
        when(dmnRepository.findByIdAndWorkspaceIdAndIsDeletedFalse("dmn-1", "workspace-1")).thenReturn(Optional.of(existing));
        when(workspaceRepository.save(any(WorkspaceEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(dmnRepository.save(any(DmnEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(delete("/api/v1/workspaces/workspace-1/dmns/dmn-1"))
                .andExpect(status().isNoContent());
    }

        private record DmnPayload(String title, String xml, String description) {
    }
}