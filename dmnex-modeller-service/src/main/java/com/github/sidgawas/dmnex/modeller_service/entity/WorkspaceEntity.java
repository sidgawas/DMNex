package com.github.sidgawas.dmnex.modeller_service.entity;

import com.github.sidgawas.dmnex.modeller_service.entity.base.AuditableEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
        name = "workspaces",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_workspaces_slug_is_deleted", columnNames = { "slug", "is_deleted" })
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkspaceEntity extends AuditableEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false, length = 36)
    private String id;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "slug", nullable = false, length = 255)
    private String slug;
}
