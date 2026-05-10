---
name: spring-rest-controller
description: "Use when creating or refactoring REST controllers. Enforces mandatory mapper usage for entity-to-API model conversion, prevents direct entity exposure in responses, and ensures consistent API layer practices."
applyTo: "src/main/java/**/*Controller.java"
---

# Spring REST Controller Guidelines

## Overview
This instruction ensures consistent, maintainable REST controller patterns in dmnex-modeller-service by enforcing the use of MapStruct mappers and preventing direct exposure of JPA entities in API responses.

## Core Principles

### 1. Always Extend BaseController and Inject Mappers
Every REST controller must extend `BaseController` and inject MapStruct mapper interfaces to convert between entities and API models.

**Why:**
- Provides centralized exception handling across all endpoints
- Prevents accidental exposure of internal database structure
- Maintains clean separation between database and API layers
- Makes controllers thin and focused on HTTP concerns
- Simplifies testing by centralizing mapping logic

**Example - DO:**
```java
@RestController
@RequestMapping("/api/v1/users")
public class UserController extends BaseController {
    private final UserService userService;
    private final UserMapper userMapper;

    public UserController(UserService userService, UserMapper userMapper) {
        this.userService = userService;
        this.userMapper = userMapper;
    }

    @PostMapping
    public ResponseEntity<UserResponse> createUser(@RequestBody @Valid UserCreateRequest request) {
        User entity = userMapper.toEntity(request);
        User saved = userService.save(entity);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(userMapper.toResponse(saved));
    }
}
```

**Example - DON'T:**
```java
@RestController
@RequestMapping("/api/v1/users")
public class UserController {
    // ❌ Does not extend BaseController (missing error handling)
    private final UserService userService;

    // ❌ Missing mapper injection
    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody User request) {
        // ❌ Accepting and returning JPA entity directly
        User saved = userService.save(request);
        return ResponseEntity.ok(saved);
    }
}
```

### 2. Never Return JPA Entities from API Endpoints
API responses must use dedicated Request/Response models, never raw JPA entities.

**Rationale:**
- JPA entities may contain internal implementation details (lazy loading proxies, Hibernate metadata)
- Database column names and structure should not leak into API contracts
- Allows independent API versioning from database schema changes
- Prevents accidental exposure of sensitive fields

**Example - DO:**
```java
@GetMapping("/{id}")
public ResponseEntity<UserResponse> getUserById(@PathVariable(name = "id") Long id) {
    User entity = userService.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    return ResponseEntity.ok(userMapper.toResponse(entity));
}
```

**Example - DON'T:**
```java
@GetMapping("/{id}")
public ResponseEntity<User> getUserById(@PathVariable Long id) {
    // ❌ Returns JPA entity directly
    return ResponseEntity.ok(userService.findById(id).orElseThrow());
}
```

### 3. Accept Request Models, Not Entities
Request body parameters should use `*Request` or `*CreateRequest`/`*UpdateRequest` classes, never raw entities.

**Why:**
- Allows validation rules specific to API input (e.g., password strength, required fields)
- Makes API contract explicit and independent of database structure
- Enables different validation for POST (create) vs PUT (update) operations

**Example - DO:**
```java
@PostMapping
public ResponseEntity<UserResponse> create(@RequestBody @Valid UserCreateRequest request) {
    // Validation happens before this method is called
    User entity = userMapper.toEntity(request);
    User saved = userService.save(entity);
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(userMapper.toResponse(saved));
}

@PutMapping("/{id}")
public ResponseEntity<UserResponse> update(
    @PathVariable(name = "id") Long id,
    @RequestBody @Valid UserUpdateRequest request) {
    User entity = userService.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    userMapper.updateEntityFromRequest(request, entity);
    User updated = userService.save(entity);
    return ResponseEntity.ok(userMapper.toResponse(updated));
}
```

**Example - DON'T:**
```java
@PostMapping
public ResponseEntity<User> create(@RequestBody User user) {
    // ❌ Accepts and returns entity directly
    return ResponseEntity.ok(userService.save(user));
}
```

### 4. Constructor Injection Over Field Injection
Use constructor injection (or records with `@Autowired` constructor) for all dependencies including mappers.

**Benefits:**
- Dependencies are immutable and thread-safe
- Makes dependencies explicit in the constructor signature
- Easier to test (no reflection needed)
- Better support for final fields

**Example - DO:**
```java
@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserService userService;
    private final UserMapper userMapper;

    public UserController(UserService userService, UserMapper userMapper) {
        this.userService = userService;
        this.userMapper = userMapper;
    }
}
```

**Example - DON'T:**
```java
@RestController
@RequestMapping("/api/users")
public class UserController {
    @Autowired
    private UserService userService;
    
    @Autowired
    private UserMapper userMapper;
    
    // ❌ Field injection makes dependencies mutable and harder to test
}
```

### 5. Consistent Response Wrapping
Use appropriate HTTP status codes and ResponseEntity for type-safe responses.

All REST APIs must be versioned by path immediately after `/api`, for example `/api/v1/users`.

List endpoints that can grow beyond trivial size must return paginated responses rather than raw lists. Prefer a shared pagination response model that includes items, page, size, total item count, and total page count.

**Pattern:**
- `200 OK` (default) — For successful GET, PUT operations
- `201 CREATED` — For successful POST operations that create resources
- `204 NO_CONTENT` — For successful DELETE operations
- `400 BAD_REQUEST` — For validation errors
- `404 NOT_FOUND` — For missing resources
- `409 CONFLICT` — For constraint violations

**Example - DO:**
```java
@PostMapping
public ResponseEntity<UserResponse> create(@RequestBody @Valid UserCreateRequest request) {
    User entity = userMapper.toEntity(request);
    User saved = userService.save(entity);
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(userMapper.toResponse(saved));
}

@GetMapping
public ResponseEntity<PaginationResponse<UserResponse>> getAll(
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size) {
    Page<User> entities = userService.findAll(page, size);
    return ResponseEntity.ok(PaginationResponse.<UserResponse>builder()
        .items(userMapper.toResponseList(entities.getContent()))
        .page(entities.getNumber())
        .size(entities.getSize())
        .totalItems(entities.getTotalElements())
        .totalPages(entities.getTotalPages())
        .build());
}

@DeleteMapping("/{id}")
public ResponseEntity<Void> delete(@PathVariable(name = "id") Long id) {
    userService.deleteById(id);
    return ResponseEntity.noContent().build();
}
```

### 6. Always Use `@Valid` for Request Validation
Enable Bean Validation on request models using `@Valid` annotation. Validation errors are automatically handled by BaseController.

### 7. Use Explicit `name` in `@RequestParam`
Always set the `name` attribute explicitly on `@RequestParam`.

Why:
- OpenAPI/Swagger generation may not reliably infer parameter names from compiled bytecode in all environments
- Explicit names make the HTTP contract unambiguous
- This avoids documentation drift when compiler or framework parameter-name discovery changes

**Example - DO:**
```java
@GetMapping
public ResponseEntity<PaginationResponse<UserResponse>> getAll(
        @RequestParam(name = "page", defaultValue = "0") int page,
        @RequestParam(name = "size", defaultValue = "20") int size,
        @RequestParam(name = "query", required = false) String query) {
    // ...
}
```

**Example - DON'T:**
```java
@GetMapping
public ResponseEntity<PaginationResponse<UserResponse>> getAll(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(required = false) String query) {
    // ...
}
```

### 8. Use Explicit `name` in Path Parameters
Always set path parameter names explicitly:
- for Spring MVC, use `@PathVariable(name = "...")`
- if `@PathParam` is used, set the value explicitly (for example `@PathParam("id")`)

Why:
- OpenAPI/Swagger parameter-name discovery can be inconsistent across build/runtime setups
- Explicit names remove ambiguity in routing and documentation

**Example - DO:**
```java
@GetMapping("/{id}")
public ResponseEntity<UserResponse> getById(@PathVariable(name = "id") Long id) {
    // ...
}
```

**Example - ALSO VALID WHEN USING `@PathParam`:**
```java
@GET
@Path("/{id}")
public Response getById(@PathParam("id") String id) {
    // ...
}
```

### 9. Version API Paths and Paginate List Endpoints
Controller-level `@RequestMapping` paths must follow the pattern `/api/v{n}/...`.

For list endpoints:
- use request parameters such as `page`, `size`, and optional filters/search terms when appropriate
- declare `@RequestParam(name = "...")` explicitly for every query parameter
- declare path parameter names explicitly (for example `@PathVariable(name = "id")`)
- return a paginated response object instead of a bare array
- keep sorting deterministic for stable paging

**Example - DO:**
```java
@RestController
@RequestMapping("/api/v1/workspaces")
public class WorkspaceController extends BaseController {

    @GetMapping
    public ResponseEntity<PaginationResponse<WorkspaceResponse>> listWorkspaces(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size,
            @RequestParam(name = "query", required = false) String query) {
        // return paginated results
    }
}
```

**Benefits:**
- Centralized validation logic via BaseController
- Consistent error responses with field-level details
- Reduces boilerplate validation code in business logic
- Automatic 400 BAD_REQUEST response for invalid input

**Example - DO:**
```java
@PostMapping
public ResponseEntity<UserResponse> create(@RequestBody @Valid UserCreateRequest request) {
    // Request is guaranteed to be valid at this point
    // Validation errors are caught and handled by BaseController
    User entity = userMapper.toEntity(request);
    User saved = userService.save(entity);
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(userMapper.toResponse(saved));
}
```

**Request class with validation:**
```java
public class UserCreateRequest {
    @NotBlank(message = "Name is required")
    @Length(min = 2, max = 100)
    private String name;

    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    @Length(min = 8, message = "Password must be at least 8 characters")
    private String password;
}
```

**Validation error response (automatic from BaseController):**
```json
{
  "status": 400,
  "message": "Validation failed",
  "timestamp": "2026-05-10T14:30:00",
  "errors": {
    "name": "Name is required",
    "email": "Invalid email format",
    "password": "Password must be at least 8 characters"
  }
}
```

## When to Apply This

Apply these guidelines when:
- Creating new REST controllers
- Adding new API endpoints to existing controllers
- Refactoring controllers that expose entities directly
- Reviewing pull requests with controller changes

## Common Endpoint Patterns

All patterns below assume the controller extends `BaseController`, which provides centralized exception handling.

### Pattern 1: Create Resource
```java
@PostMapping
public ResponseEntity<ProductResponse> create(@RequestBody @Valid ProductCreateRequest request) {
    Product entity = productMapper.toEntity(request);
    Product saved = productService.save(entity);
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(productMapper.toResponse(saved));
}
```

### Pattern 2: Get Single Resource
```java
@GetMapping("/{id}")
public ResponseEntity<ProductResponse> getById(@PathVariable(name = "id") Long id) {
    Product entity = productService.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
    return ResponseEntity.ok(productMapper.toResponse(entity));
}
```

### Pattern 3: Get All Resources (with Pagination)
```java
@GetMapping
public ResponseEntity<Page<ProductResponse>> getAll(
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "10") int size) {
    Page<Product> entities = productService.findAll(PageRequest.of(page, size));
    Page<ProductResponse> responses = entities.map(productMapper::toResponse);
    return ResponseEntity.ok(responses);
}
```

### Pattern 4: Update Resource
```java
@PutMapping("/{id}")
public ResponseEntity<ProductResponse> update(
    @PathVariable(name = "id") Long id,
    @RequestBody @Valid ProductUpdateRequest request) {
    Product entity = productService.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
    productMapper.updateEntityFromRequest(request, entity);
    Product updated = productService.save(entity);
    return ResponseEntity.ok(productMapper.toResponse(updated));
}
```

### Pattern 5: Delete Resource
```java
@DeleteMapping("/{id}")
public ResponseEntity<Void> delete(@PathVariable(name = "id") Long id) {
    productService.deleteById(id);
    return ResponseEntity.noContent().build();
}
```

## Complete Controller Example

```java
import com.github.sidgawas.dmnex.modeller_service.controller.BaseController;
import com.github.sidgawas.dmnex.modeller_service.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController extends BaseController {
    private final UserService userService;
    private final UserMapper userMapper;

    @PostMapping
    public ResponseEntity<UserResponse> create(@RequestBody @Valid UserCreateRequest request) {
        User entity = userMapper.toEntity(request);
        User saved = userService.save(entity);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(userMapper.toResponse(saved));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getById(@PathVariable(name = "id") Long id) {
        User entity = userService.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return ResponseEntity.ok(userMapper.toResponse(entity));
    }

    @GetMapping
    public ResponseEntity<List<UserResponse>> getAll() {
        List<User> entities = userService.findAll();
        return ResponseEntity.ok(userMapper.toResponseList(entities));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> update(
        @PathVariable(name = "id") Long id,
        @RequestBody @Valid UserUpdateRequest request) {
        User entity = userService.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        userMapper.updateEntityFromRequest(request, entity);
        User updated = userService.save(entity);
        return ResponseEntity.ok(userMapper.toResponse(updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable(name = "id") Long id) {
        userService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
```

## Anti-Patterns to Avoid

1. **Not extending BaseController**
   - ❌ `public class UserController { }`
   - ✅ `public class UserController extends BaseController { }`

2. **Returning entities directly**
   - ❌ `return ResponseEntity.ok(userService.findById(id))`
   - ✅ Map to response model first using mappers

3. **Accepting entities as request bodies**
   - ❌ `public void create(@RequestBody User user)`
   - ✅ Use dedicated `*Request` classes with `@Valid`

4. **Field injection for mappers**
   - ❌ `@Autowired private UserMapper mapper;`
   - ✅ Use constructor injection with `@RequiredArgsConstructor`

5. **Manual mapping in controllers**
   - ❌ Manual field-by-field conversion in controller methods
   - ✅ Always delegate to MapStruct mapper

6. **Missing HTTP status codes**
   - ❌ `return new ResponseEntity<>(response);` (defaults to 200)
   - ✅ Explicitly set `HttpStatus.CREATED` for POST, `noContent()` for DELETE

7. **Manual exception handling in controllers**
   - ❌ Try-catch blocks in controller methods
   - ✅ Throw exceptions and let BaseController handle them
   - ✅ ResourceNotFoundException → 404 NOT_FOUND
   - ✅ MethodArgumentNotValidException → 400 BAD_REQUEST with field errors

8. **Implicit path parameter names**
    - ❌ `@PathVariable Long id`
    - ✅ `@PathVariable(name = "id") Long id`
    - ✅ `@PathParam("id") String id` (when `@PathParam` is used)

## Centralized Exception Handling in BaseController

All controllers extending `BaseController` automatically handle these exceptions:

| Exception | HTTP Status | Response |
|-----------|------------|----------|
| `MethodArgumentNotValidException` | 400 BAD_REQUEST | Validation errors with field details |
| `ResourceNotFoundException` | 404 NOT_FOUND | Error message |
| `IllegalArgumentException` | 400 BAD_REQUEST | Error message |
| Other `Exception` | 500 INTERNAL_SERVER_ERROR | Generic error message (details hidden) |

**BaseController location:** `src/main/java/com/github/sidgawas/dmnex/modeller_service/controller/BaseController.java`
**ResourceNotFoundException location:** `src/main/java/com/github/sidgawas/dmnex/modeller_service/exception/ResourceNotFoundException.java`

## Integration with Entity Mapping

This instruction works in conjunction with [entity-mapping.instructions.md](entity-mapping.instructions.md). Ensure:
- All controllers extend `BaseController` for consistent error handling
- Controllers only use mappers from the dedicated `mapper` package
- Request/Response classes follow the naming convention from entity-mapping guide
- All entities remain isolated in the `entity` package
- ResourceNotFoundException is thrown for missing resources (handled by BaseController)

## References

- [Spring REST Documentation](https://spring.io/guides/gs/rest-service/)
- [HTTP Status Codes Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
- [Bean Validation Guide](https://beanvalidation.org/)
