package com.github.sidgawas.dmnex.modeller_service.mapper;

import org.springframework.data.domain.Page;
import org.springframework.stereotype.Component;

import com.github.sidgawas.dmnex.modeller_service.model.response.PaginationResponse;

@Component
public class PaginationMapper {

    public <T> PaginationResponse<T> toPaginationResponse(Page<T> page) {
        return PaginationResponse.<T>builder()
                .items(page.getContent())
                .page(page.getNumber())
                .size(page.getSize())
                .totalItems(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .hasNext(page.hasNext())
                .hasPrevious(page.hasPrevious())
                .build();
    }
}