package com.github.sidgawas.dmnex.modeller_service.service;

import org.springframework.stereotype.Component;

import io.hypersistence.tsid.TSID;

@Component
public class EntityIdGenerator {

    public String nextId() {
        return TSID.Factory.getTsid().toString();
    }
}
