---
name: lombok-entities-and-dtos
description: "Use when creating or modifying JPA entities and DTO classes. Enforces Lombok library usage to eliminate boilerplate code (getters, setters, constructors, equals, hashCode, toString) and provides patterns for combining annotations safely."
applyTo: "src/main/java/**/*{Entity,Request,Response,Dto}.java"
---

# Lombok for Entities and DTOs

## Overview
This instruction ensures consistent and efficient use of the Lombok library across all entity and DTO classes in dmnex-modeller-service by reducing boilerplate code while maintaining clean, maintainable class definitions.

## Core Principles

### 1. Use @Data for Simple DTOs
For simple data transfer objects without complex relationships, use `@Data` to generate getters, setters, equals, hashCode, and toString.

**Why:**
- Eliminates 50+ lines of boilerplate code per class
- Automatically stays in sync when fields are added/removed
- Generated methods follow Java conventions
- Improves code readability

**Example - DO:**
```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private Long id;
    private String name;
    private String email;
}
```

**Example - DON'T:**
```java
public class UserResponse {
    private Long id;
    private String name;
    private String email;

    // ❌ Manual boilerplate code
    public UserResponse() {}

    public UserResponse(Long id, String name, String email) {
        this.id = id;
        this.name = name;
        this.email = email;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    // ... many more lines
}
```

### 2. Combine @Data with @Builder for Modern API
Always pair `@Data` with `@Builder` to enable fluent object construction while maintaining clean getters/setters.

**Rationale:**
- `@Data` provides getters/setters for traditional access
- `@Builder` enables fluent construction API
- Both together provide maximum flexibility
- No performance penalty

**Example - DO:**
```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserCreateRequest {
    @NotBlank(message = "Name is required")
    private String name;

    @Email(message = "Invalid email format")
    private String email;
}

// Usage with builder
UserCreateRequest request = UserCreateRequest.builder()
    .name("John Doe")
    .email("john@example.com")
    .build();

// Usage with setters
UserCreateRequest request2 = new UserCreateRequest();
request2.setName("Jane Doe");
request2.setEmail("jane@example.com");
```

**Example - DON'T:**
```java
@Data  // No builder - less flexible
public class UserCreateRequest {
    private String name;
    private String email;
}
```

### 3. Use @Getter/@Setter Separately for Partial Control
When you need getters and setters but not equals/hashCode/toString, use `@Getter` and `@Setter` individually.

**Why:**
- Fine-grained control over code generation
- Useful for entities with custom equals/hashCode logic
- Can exclude specific fields from generation

**Example - DO:**
```java
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Product {
    @Id
    @GeneratedValue
    private Long id;

    @Column(nullable = false)
    private String name;

    // Exclude sensitive fields from toString
    @Getter(AccessLevel.NONE)
    private String apiKey;
}
```

### 4. Handle JPA Entities with Relationships Carefully
For JPA entities with bidirectional relationships, exclude relationships from equals/hashCode/toString to avoid infinite loops.

**Rationale:**
- JPA entities often have circular references (User ↔ Orders)
- Including all fields in equals/hashCode can cause StackOverflowError
- Proper field exclusion maintains data integrity

**Example - DO:**
```java
@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    @Id
    @GeneratedValue
    private Long id;

    @Column(nullable = false)
    private String name;

    // Exclude from equals, hashCode, and toString to avoid circular references
    @OneToMany(mappedBy = "user")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Set<Order> orders;
}

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {
    @Id
    @GeneratedValue
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;  // Safe to include - ManyToOne is typically not circular

    @Column(nullable = false)
    private BigDecimal amount;
}
```

**Example - DON'T:**
```java
@Entity
@Data  // ❌ Includes orders in equals/hashCode/toString - circular reference!
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    private Long id;
    private String name;
    
    @OneToMany(mappedBy = "user")
    private Set<Order> orders;  // Can cause StackOverflowError
}
```

### 5. Use @EqualsAndHashCode Explicitly for Custom Logic
When you need custom equals/hashCode behavior, exclude fields using `@EqualsAndHashCode`.

**Pattern:**
```java
@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = {"id"})  // Only use ID for equality
public class User {
    @Id
    @GeneratedValue
    private Long id;

    @Column(nullable = false)
    private String email;

    @OneToMany(mappedBy = "user")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Set<Order> orders;
}
```

### 6. Required Annotation Combinations

#### For Simple DTOs and Request/Response Models:
```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private Long id;
    private String name;
    private String email;
}
```

#### For JPA Entities (without relationships):
```java
@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {
    @Id
    @GeneratedValue
    private Long id;

    @Column(nullable = false)
    private String name;

    private BigDecimal price;
}
```

#### For JPA Entities (with relationships):
```java
@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    @Id
    @GeneratedValue
    private Long id;

    @Column(nullable = false)
    private String name;

    @OneToMany(mappedBy = "user")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Set<Order> orders;
}
```

## When to Apply This

Apply these guidelines when:
- Creating new JPA entity classes
- Creating new DTO/Request/Response classes
- Refactoring existing classes with manual boilerplate
- Adding new fields to existing entity/DTO classes

## Common Patterns

### Pattern 1: Simple DTO with Validation
```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserCreateRequest {
    @NotBlank(message = "Name is required")
    @Length(min = 2, max = 100)
    private String name;

    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    @Length(min = 8)
    private String password;
}
```

### Pattern 2: Entity with Relationships
```java
@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Set<Order> orders = new HashSet<>();
}
```

### Pattern 3: Response DTO (Flattened from Entity)
```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private Long id;
    private String email;
    private LocalDateTime createdAt;
    private Integer orderCount;  // Calculated from mapper, not stored
}
```

### Pattern 4: Entity without @Data (Custom equals/hashCode)
```java
@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(of = {"email"})  // Use email as unique identifier
public class User {
    @Id
    @GeneratedValue
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @OneToMany(mappedBy = "user")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Set<Order> orders;
}
```

## Anti-Patterns to Avoid

1. **Using @Data without @NoArgsConstructor on DTOs**
   - ❌ `@Data public class UserResponse { ... }`
   - ✅ `@Data @NoArgsConstructor @AllArgsConstructor public class UserResponse { ... }`

2. **Forgetting @ToString.Exclude on circular references**
   - ❌ `@OneToMany private Set<Order> orders;`
   - ✅ `@OneToMany @ToString.Exclude @EqualsAndHashCode.Exclude private Set<Order> orders;`

3. **Using @Data on entities with custom equals logic**
   - ❌ `@Data @Entity public class User { ... }`
   - ✅ Use `@Getter @Setter @EqualsAndHashCode(of = {"id"})` instead

4. **Mixing manual getters with @Getter/@Setter**
   - ❌ Manually defining getters/setters alongside Lombok annotations
   - ✅ Use Lombok annotations exclusively or not at all

5. **Not excluding collection fields from equals/hashCode**
   - ❌ Including `@OneToMany` or `@ManyToMany` in equals
   - ✅ Always use `@EqualsAndHashCode.Exclude` on relationships

6. **Using @Data on value objects that need immutability**
   - ❌ `@Data public class Money { ... }`
   - ✅ Use `@Value` for immutable objects (generates final fields)

## Configuration

Ensure Lombok is properly configured in `build.gradle`:
```gradle
dependencies {
    compileOnly 'org.projectlombok:lombok'
    annotationProcessor 'org.projectlombok:lombok'
    testCompileOnly 'org.projectlombok:lombok'
    testAnnotationProcessor 'org.projectlombok:lombok'
}
```

## Best Practices

1. **Always include @NoArgsConstructor and @AllArgsConstructor with @Data**
   - Provides flexibility for frameworks and manual construction
   - JPA requires no-arg constructor

2. **Always include @Builder with @Data**
   - Enables modern fluent API for object construction
   - Maintains backward compatibility with setters

3. **Document exclusions clearly**
   - Use comments to explain why fields are excluded from equals/hashCode
   - Makes code reviews easier

4. **Use access level annotations when needed**
   - `@Getter(AccessLevel.PRIVATE)` for private getters
   - `@Setter(AccessLevel.PROTECTED)` for protected setters

## References

- [Lombok Official Documentation](https://projectlombok.org/features/all)
- [Lombok Annotations Reference](https://projectlombok.org/api/lombok/)
- [JPA Best Practices with Lombok](https://stackoverflow.com/questions/37663712/hibernate-with-lombok-best-practices)
