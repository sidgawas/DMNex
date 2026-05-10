package com.github.sidgawas.dmnex.modeller_service.util;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.Set;

import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Sort;

class SortBuilderTest {

    @Test
    void buildShouldCreateSortWhenFieldAndOrderAreValid() {
        SortBuilder sortBuilder = new SortBuilder(Sort.Direction.DESC, Set.of("name", "updatedAt"));

        Sort sort = sortBuilder.build("name", "asc");

        Sort.Order order = sort.getOrderFor("name");
        assertThat(order).isNotNull();
        assertThat(order.getDirection()).isEqualTo(Sort.Direction.ASC);
    }

    @Test
    void buildShouldUseDefaultDirectionWhenSortOrderMissing() {
        SortBuilder sortBuilder = new SortBuilder(Sort.Direction.DESC, Set.of("name"));

        Sort sort = sortBuilder.build("name", null);

        Sort.Order order = sort.getOrderFor("name");
        assertThat(order).isNotNull();
        assertThat(order.getDirection()).isEqualTo(Sort.Direction.DESC);
    }

    @Test
    void buildShouldRejectUnsupportedSortField() {
        SortBuilder sortBuilder = new SortBuilder(Sort.Direction.DESC, Set.of("name"));

        assertThatThrownBy(() -> sortBuilder.build("status", "asc"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Unsupported sortBy value: status");
    }

    @Test
    void buildShouldRejectInvalidSortOrder() {
        SortBuilder sortBuilder = new SortBuilder(Sort.Direction.DESC, Set.of("name"));

        assertThatThrownBy(() -> sortBuilder.build("name", "up"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("sortOrder must be either asc or desc.");
    }
}
