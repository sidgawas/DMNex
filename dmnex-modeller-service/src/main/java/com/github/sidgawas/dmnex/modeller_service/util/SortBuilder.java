package com.github.sidgawas.dmnex.modeller_service.util;

import java.util.Set;

import org.springframework.data.domain.Sort;

public class SortBuilder {

    private final Sort.Direction defaultDirection;
    private final Set<String> allowedSortFields;

    public SortBuilder(Sort.Direction defaultDirection, Set<String> allowedSortFields) {
        if (defaultDirection == null) {
            throw new IllegalArgumentException("defaultDirection is required.");
        }

        if (allowedSortFields == null || allowedSortFields.isEmpty()) {
            throw new IllegalArgumentException("allowedSortFields is required.");
        }

        this.defaultDirection = defaultDirection;
        this.allowedSortFields = allowedSortFields;
    }

    public Sort build(String sortBy, String sortOrder) {
        if (sortBy == null || sortBy.isBlank()) {
            throw new IllegalArgumentException("sortBy is required.");
        }

        String normalizedSortBy = sortBy.trim();
        if (!allowedSortFields.contains(normalizedSortBy)) {
            throw new IllegalArgumentException("Unsupported sortBy value: " + normalizedSortBy);
        }

        Sort.Direction direction;
        try {
            direction = sortOrder == null
                    ? defaultDirection
                    : Sort.Direction.fromString(sortOrder.trim());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("sortOrder must be either asc or desc.");
        }

        return Sort.by(direction, normalizedSortBy);
    }
}
