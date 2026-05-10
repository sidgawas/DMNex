---
name: entity-mapping
description: "Use when creating or modifying entity-to-DTO mappings in Java services. Enforces MapStruct library usage for reducing boilerplate, separation of JPA entities from API-level classes, and consistent package structure."
applyTo: "src/main/java/**/*{Entity,Request,Response}.java"
---

# Entity Mapping Guidelines

## Overview
This instruction ensures consistent, maintainable entity mapping patterns across the dmnex-modeller-service by leveraging MapStruct to reduce boilerplate code and maintaining clear separation between JPA entities and API-level classes.

## Core Principles

### 1. Always Use MapStruct for Entity Mapping
When mapping from JPA entities to API-level classes (DTOs, Request/Response objects), **use MapStruct** instead of manual mapping code.

**Why:**
- Eliminates boilerplate code
- Type-safe mappings verified at compile time
- Easy to maintain and refactor
- Automatic null handling and recursive mapping support

**Example - DO:**
```java
@Mapper(componentModel = "spring")
public interface UserMapper {
    UserResponse toResponse(User entity);
    User toEntity(UserRequest request);
    List<UserResponse> toResponseList(List<User> entities);
}
```

**Example - DON'T:**
```java
public class UserMapper {
    public UserResponse toResponse(User entity) {
        UserResponse response = new UserResponse();
        response.setId(entity.getId());
        response.setName(entity.getName());
        // ... many more lines of manual mapping
        return response;
    }
}
```

### 2. Separate JPA Entities from API-Level Classes
JPA entities and API-level classes must be different:
- **JPA Entities:** Database-focused, contain `@Entity`, `@Column`, `@OneToMany`, etc.
- **API-Level Classes:** Request/Response models with `@Request` or `@Response` suffix, contain only API-relevant fields

**Rationale:**
- Isolates database concerns from API contracts
- Prevents accidental exposure of internal database structure via API
- Allows independent evolution of database schema and API contracts
- Reduces tight coupling between layers

**Example - DO:**
```java
// JPA Entity (Database layer)
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    @OneToMany(mappedBy = "user")
    private Set<Order> orders;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
}

// API Response Model
public class UserResponse {
    private Long id;
    private String name;
    private Integer orderCount;
}
```

**Example - DON'T:**
```java
// Avoid exposing JPA entity directly in API responses
@RestController
public class UserController {
    @GetMapping("/{id}")
    public User getUser(@PathVariable Long id) {
        // Returns JPA entity directly - breaks separation of concerns
        return userRepository.findById(id).orElseThrow();
    }
}
```

### 3. Naming Convention for API-Level Classes
Use clear suffixes to distinguish API models:
- `*Request` for incoming request payloads
- `*Response` for outgoing response payloads
- `*Dto` for generic data transfer objects (only if neither Request nor Response fits)

**Examples:**
- `UserCreateRequest` (input for creating a user)
- `UserUpdateRequest` (input for updating a user)
- `UserResponse` (output returned to client)

### 4. Organize Mappers in Dedicated Package
Place all MapStruct mapper interfaces in a `mapper` package for clarity and maintainability.

**Structure:**
```
src/main/java/com/github/sidgawas/dmnex/modeller_service/
├── entity/
│   ├── User.java
│   ├── Order.java
├── model/
│   ├── request/
│   │   ├── UserCreateRequest.java
│   │   ├── UserUpdateRequest.java
│   ├── response/
│   │   ├── UserResponse.java
│   │   ├── OrderResponse.java
├── mapper/
│   ├── UserMapper.java
│   ├── OrderMapper.java
├── controller/
├── service/
```

### 5. MapStruct Configuration

Ensure all mappers follow this configuration pattern:

```java
@Mapper(componentModel = "spring")
public interface UserMapper {
    UserResponse toResponse(User entity);
    User toEntity(UserCreateRequest request);
    void updateEntityFromRequest(UserUpdateRequest request, @MappingTarget User entity);
    List<UserResponse> toResponseList(List<User> entities);
}
```

**Key settings:**
- `componentModel = "spring"`: Enables Spring dependency injection
- Use `@MappingTarget` for update operations (avoid creating new instances)
- Declare bidirectional mappings explicitly

## When to Apply This

Apply these guidelines when:
- Creating new JPA entities
- Adding new API request/response models
- Implementing entity-to-DTO conversions
- Refactoring existing manual mapping code

## Common Scenarios

### Scenario 1: Creating a New API Endpoint
```java
// 1. Define JPA Entity
@Entity
public class Product {
    @Id
    private Long id;
    private String name;
    private BigDecimal price;
}

// 2. Define Request/Response models
public class ProductCreateRequest {
    private String name;
    private BigDecimal price;
}

public class ProductResponse {
    private Long id;
    private String name;
    private BigDecimal price;
}

// 3. Create MapStruct mapper
@Mapper(componentModel = "spring")
public interface ProductMapper {
    ProductResponse toResponse(Product entity);
    Product toEntity(ProductCreateRequest request);
}

// 4. Use in controller
@RestController
@RequestMapping("/products")
public class ProductController {
    private final ProductService service;
    private final ProductMapper mapper;

    @PostMapping
    public ResponseEntity<ProductResponse> create(@RequestBody ProductCreateRequest request) {
        Product entity = mapper.toEntity(request);
        Product saved = service.save(entity);
        return ResponseEntity.ok(mapper.toResponse(saved));
    }
}
```

### Scenario 2: Updating an Entity
```java
@Mapper(componentModel = "spring")
public interface UserMapper {
    void updateEntityFromRequest(UserUpdateRequest request, @MappingTarget User entity);
}

// Usage in service:
public User update(Long id, UserUpdateRequest request) {
    User entity = repository.findById(id).orElseThrow();
    mapper.updateEntityFromRequest(request, entity);
    return repository.save(entity);
}
```

## Anti-Patterns to Avoid

1. **Mixing JPA entities in API responses**
   - ❌ `return userRepository.findById(id)` directly in a REST endpoint
   - ✅ Map to response model first

2. **Manual mapping for simple cases**
   - ❌ Use if-else for null checks or type conversions
   - ✅ Let MapStruct handle it

3. **API-level logic leaking into entities**
   - ❌ `@JsonIgnore` on entity fields
   - ✅ Use separate response models without those fields

4. **Scattered mappers**
   - ❌ Mapper code inside controllers or services
   - ✅ Keep mappers in dedicated `mapper` package

## Questions?
For MapStruct documentation, refer to the official [MapStruct guides](https://mapstruct.org/documentation/stable/reference/html/).
