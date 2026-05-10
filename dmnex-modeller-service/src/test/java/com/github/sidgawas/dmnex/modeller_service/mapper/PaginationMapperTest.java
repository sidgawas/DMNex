package com.github.sidgawas.dmnex.modeller_service.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import com.github.sidgawas.dmnex.modeller_service.model.response.PaginationResponse;
import com.github.sidgawas.dmnex.modeller_service.model.response.WorkspaceResponse;

class PaginationMapperTest {

    private final PaginationMapper paginationMapper = new PaginationMapper();

    @Test
    void toPaginationResponseShouldMapPageMetadataGenerically() {
        WorkspaceResponse first = WorkspaceResponse.builder().id("1").name("One").slug("one").build();
        PageImpl<WorkspaceResponse> page = new PageImpl<>(List.of(first), PageRequest.of(1, 5), 6);

        PaginationResponse<WorkspaceResponse> response = paginationMapper.toPaginationResponse(page);

        assertThat(response.getItems()).containsExactly(first);
        assertThat(response.getPage()).isEqualTo(1);
        assertThat(response.getSize()).isEqualTo(5);
        assertThat(response.getTotalItems()).isEqualTo(6);
        assertThat(response.getTotalPages()).isEqualTo(2);
        assertThat(response.isHasNext()).isFalse();
        assertThat(response.isHasPrevious()).isTrue();
    }
}