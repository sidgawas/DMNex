package com.github.sidgawas.dmnex.modeller_service.entity;

import com.github.sidgawas.dmnex.modeller_service.entity.base.AuditableEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
        name = "dmn_published_versions",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_dmn_published_versions_dmn_version_is_deleted",
                        columnNames = { "dmn_id", "version", "is_deleted" })
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DmnPublishedVersionEntity extends AuditableEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false, length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "dmn_id", nullable = false)
    private DmnEntity dmn;

    @Column(name = "version", nullable = false)
    private Integer version;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "xml", nullable = false, columnDefinition = "TEXT")
    private String xml;
}
