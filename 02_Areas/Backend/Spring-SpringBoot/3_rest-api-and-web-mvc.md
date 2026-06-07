# REST API & Web MVC

> Spring MVC provides a powerful, annotation-driven model for building REST APIs. Understanding the request lifecycle — from the moment an HTTP request hits the embedded server to when the JSON response leaves — is critical for debugging, performance tuning, and building robust APIs.

---

## Request Lifecycle — The Complete Flow

```
HTTP Request (from client)
       │
       ▼
┌──────────────────────┐
│   Embedded Tomcat     │  1. Accepts TCP connection
│   (Servlet Container) │  2. Creates HttpServletRequest/Response
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│   Filter Chain        │  3. Servlet Filters (CORS, Security, Logging)
│   (javax.servlet)     │     Execute in order: Filter1 → Filter2 → ...
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│   DispatcherServlet   │  4. The FRONT CONTROLLER
│   (Single entry point)│     Receives ALL requests
└──────────┬───────────┘
           │
           ├── 5. HandlerMapping: Find the right controller method
           │       (@GetMapping("/users/{id}") → UserController.getUser())
           │
           ├── 6. HandlerInterceptor.preHandle() (before controller)
           │
           ├── 7. ArgumentResolvers: Convert request data → method params
           │       @PathVariable, @RequestBody, @RequestParam → Java objects
           │
           ▼
┌──────────────────────┐
│   Controller Method   │  8. YOUR CODE executes
│   @RestController     │     Calls service → repository → returns data
└──────────┬───────────┘
           │
           ├── 9. ReturnValueHandlers: Convert return value → response
           │       Object → Jackson → JSON
           │
           ├── 10. HandlerInterceptor.postHandle() (after controller)
           │
           ▼
┌──────────────────────┐
│   Response sent back  │  11. Filters execute in reverse order
│   through Filter Chain│  12. Response written to client
└──────────────────────┘
```

### Key Component: DispatcherServlet

> Every Spring MVC request goes through ONE servlet — the `DispatcherServlet`. It's the **Front Controller** pattern. It dispatches to the right handler, manages the entire request processing pipeline, and handles errors.

---

## Building REST Controllers

### Basic CRUD Controller

```java
@RestController  // @Controller + @ResponseBody
@RequestMapping("/api/v1/users")
public class UserController {
    
    private final UserService userService;
    
    public UserController(UserService userService) {
        this.userService = userService;
    }
    
    @GetMapping
    public List<UserResponse> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return userService.findAll(page, size);
    }
    
    @GetMapping("/{id}")
    public UserResponse getUser(@PathVariable Long id) {
        return userService.findById(id);
    }
    
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)  // 201 instead of default 200
    public UserResponse createUser(@Valid @RequestBody CreateUserRequest request) {
        return userService.create(request);
    }
    
    @PutMapping("/{id}")
    public UserResponse updateUser(@PathVariable Long id, 
                                    @Valid @RequestBody UpdateUserRequest request) {
        return userService.update(id, request);
    }
    
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)  // 204
    public void deleteUser(@PathVariable Long id) {
        userService.delete(id);
    }
}
```

### Request Data Binding Annotations

| Annotation | Source | Example |
|-----------|--------|---------|
| `@PathVariable` | URL path | `/users/{id}` → `@PathVariable Long id` |
| `@RequestParam` | Query string | `?page=2` → `@RequestParam int page` |
| `@RequestBody` | HTTP body (JSON) | `{ "name": "Alice" }` → `@RequestBody CreateUserRequest req` |
| `@RequestHeader` | HTTP header | `Authorization: Bearer xxx` → `@RequestHeader String authorization` |
| `@CookieValue` | Cookie | `@CookieValue String sessionId` |
| `@ModelAttribute` | Form data / query params → object | Binds multiple params to POJO |

---

## Request & Response DTOs

### Why DTOs Matter

```java
// ❌ DON'T expose entities directly
@GetMapping("/{id}")
public User getUser(@PathVariable Long id) {
    return userRepo.findById(id).orElseThrow();
    // Exposes passwordHash, internal IDs, lazy-loaded associations (N+1 queries!)
}

// ✅ Use DTOs — control what's exposed
@GetMapping("/{id}")
public UserResponse getUser(@PathVariable Long id) {
    return userService.findById(id);  // Returns UserResponse DTO
}
```

```java
// Request DTO — what the client sends
public record CreateUserRequest(
    @NotBlank(message = "Name is required")
    String name,
    
    @Email(message = "Invalid email format")
    @NotBlank
    String email,
    
    @Size(min = 8, message = "Password must be at least 8 characters")
    String password
) {}

// Response DTO — what the client receives
public record UserResponse(
    Long id,
    String name,
    String email,
    LocalDateTime createdAt
) {
    public static UserResponse from(User entity) {
        return new UserResponse(
            entity.getId(),
            entity.getName(),
            entity.getEmail(),
            entity.getCreatedAt()
        );
    }
}
```

---

## Validation

### Bean Validation (Jakarta Validation)

```java
@PostMapping
public UserResponse create(@Valid @RequestBody CreateUserRequest request) {
    // If validation fails, Spring throws MethodArgumentNotValidException
    // BEFORE your code runs
}
```

### Common Validation Annotations

| Annotation | Purpose |
|-----------|---------|
| `@NotNull` | Not null (allows empty string) |
| `@NotBlank` | Not null, not empty, not whitespace (for Strings) |
| `@NotEmpty` | Not null, not empty (for collections/strings) |
| `@Size(min, max)` | Length/size constraint |
| `@Min` / `@Max` | Numeric bounds |
| `@Email` | Email format |
| `@Pattern(regexp)` | Custom regex pattern |
| `@Past` / `@Future` | Date constraints |
| `@Positive` / `@PositiveOrZero` | Numeric constraints |

### Custom Validator

```java
// Custom annotation
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = UniqueEmailValidator.class)
public @interface UniqueEmail {
    String message() default "Email already exists";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

// Validator implementation
@Component
public class UniqueEmailValidator implements ConstraintValidator<UniqueEmail, String> {
    private final UserRepository userRepo;
    
    @Override
    public boolean isValid(String email, ConstraintValidatorContext context) {
        return email != null && !userRepo.existsByEmail(email);
    }
}
```

---

## Global Exception Handling

### `@ControllerAdvice` — Centralized Error Handling

```java
@RestControllerAdvice  // @ControllerAdvice + @ResponseBody
public class GlobalExceptionHandler {
    
    // Validation errors (400)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
            errors.put(error.getField(), error.getDefaultMessage())
        );
        return new ErrorResponse("VALIDATION_FAILED", "Invalid request", errors);
    }
    
    // Entity not found (404)
    @ExceptionHandler(EntityNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handleNotFound(EntityNotFoundException ex) {
        return new ErrorResponse("NOT_FOUND", ex.getMessage(), null);
    }
    
    // Business logic errors (409)
    @ExceptionHandler(BusinessException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ErrorResponse handleBusiness(BusinessException ex) {
        return new ErrorResponse(ex.getErrorCode(), ex.getMessage(), null);
    }
    
    // Catch-all (500)
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ErrorResponse handleUnexpected(Exception ex) {
        log.error("Unexpected error", ex);
        return new ErrorResponse("INTERNAL_ERROR", "Something went wrong", null);
    }
}

// Consistent error response shape
public record ErrorResponse(
    String code,
    String message,
    Map<String, String> details
) {}
```

### Error Response Strategy

```
Client sends bad request
       │
       ▼
Controller method (never reached if validation fails)
       │
       ▼
Exception thrown
       │
       ├── MethodArgumentNotValidException → 400 + field errors
       ├── EntityNotFoundException         → 404 + entity info
       ├── AccessDeniedException           → 403 + message
       ├── BusinessException               → 409 + error code
       └── Exception (unexpected)          → 500 + generic message
                                              (log full stack trace)
```

---

## Content Negotiation

### How Jackson Serialization Works

```
Controller returns Java Object
       │
       ▼
HttpMessageConverter (Jackson's MappingJackson2HttpMessageConverter)
       │
       ├── Checks Accept header: application/json → serialize to JSON
       ├── Uses ObjectMapper to convert object → JSON string
       ├── Respects @JsonIgnore, @JsonProperty, @JsonFormat
       └── Sets Content-Type: application/json in response
```

### Jackson Customization

```java
@Configuration
public class JacksonConfig {
    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());  // Java 8 date/time support
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        mapper.setSerializationInclusion(JsonInclude.Include.NON_NULL);  // Skip null fields
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        return mapper;
    }
}
```

```java
// Per-field customization
public record UserResponse(
    Long id,
    
    @JsonProperty("full_name")  // JSON key name
    String name,
    
    @JsonIgnore  // Never serialize
    String internalNote,
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    LocalDateTime createdAt
) {}
```

---

## Pagination and Sorting

```java
@GetMapping
public Page<UserResponse> getUsers(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(defaultValue = "createdAt") String sortBy,
        @RequestParam(defaultValue = "desc") String direction) {
    
    Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
    Pageable pageable = PageRequest.of(page, size, sort);
    
    return userRepo.findAll(pageable).map(UserResponse::from);
}
```

**Response:**
```json
{
  "content": [{ "id": 1, "name": "Alice" }, ...],
  "totalElements": 150,
  "totalPages": 8,
  "number": 0,
  "size": 20,
  "first": true,
  "last": false
}
```

---

## Interceptors and Filters

### Filter vs Interceptor

```
Request → [Filter1] → [Filter2] → DispatcherServlet → [Interceptor.preHandle] → Controller
Response ← [Filter2] ← [Filter1] ← DispatcherServlet ← [Interceptor.postHandle] ← Controller
```

| Aspect | Filter | Interceptor |
|--------|--------|-------------|
| Level | Servlet (javax.servlet) | Spring MVC |
| Scope | ALL requests (including static) | Only DispatcherServlet requests |
| Access to | HttpServletRequest/Response | Handler method, ModelAndView |
| Use for | CORS, Security, Logging, Compression | Auth, logging, request timing |

### Custom Interceptor

```java
@Component
public class RequestTimingInterceptor implements HandlerInterceptor {
    
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, 
                             Object handler) {
        request.setAttribute("startTime", System.currentTimeMillis());
        return true;  // Continue processing (false = block request)
    }
    
    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response,
                                Object handler, Exception ex) {
        long startTime = (long) request.getAttribute("startTime");
        long duration = System.currentTimeMillis() - startTime;
        log.info("{} {} - {}ms", request.getMethod(), request.getRequestURI(), duration);
    }
}

// Register interceptor
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new RequestTimingInterceptor())
                .addPathPatterns("/api/**")
                .excludePathPatterns("/api/health");
    }
}
```

---

## CORS Configuration

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("https://myapp.com", "http://localhost:3000")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);  // Preflight cache duration
    }
}
```

---

## Interview Perspective

**Q: Explain the request lifecycle in Spring MVC.**

Request → Servlet Filters → DispatcherServlet (front controller) → HandlerMapping (find controller method) → Interceptors preHandle → ArgumentResolvers (bind `@PathVariable`, `@RequestBody` to method params) → Controller executes → ReturnValueHandlers (serialize to JSON via Jackson) → Interceptors postHandle → Response through Filters.

**Q: How do you handle global exceptions in Spring Boot?**

Use `@RestControllerAdvice` with `@ExceptionHandler` methods for each exception type. Return a consistent error response shape with code, message, and details. Handle specific exceptions (validation, not found, business) with appropriate HTTP status codes. Include a catch-all `@ExceptionHandler(Exception.class)` for unexpected errors — log the full stack trace but return a generic message to the client.

**Q: What is the difference between `@Controller` and `@RestController`?**

`@Controller` returns view names (for server-side rendering). Methods return `String` that maps to a template. `@RestController` = `@Controller` + `@ResponseBody`. Every method's return value is serialized directly to the response body (JSON). Use `@Controller` for MVC + templates, `@RestController` for REST APIs.

**Q: How does request validation work? What happens when validation fails?**

Add `@Valid` before `@RequestBody` parameter. Spring invokes the Jakarta Bean Validator before the controller method. If validation fails, `MethodArgumentNotValidException` is thrown and the controller method never executes. Handle it in `@RestControllerAdvice` to return a 400 response with field-level error details.

**Q: Why should you use DTOs instead of exposing entities directly?**

Entities contain sensitive fields (passwordHash), internal IDs, and lazy-loaded associations (triggers N+1 queries). DTOs control what's exposed, decouple the API contract from the database schema, prevent over-fetching, and allow independent API versioning. Use `record` classes for immutable DTOs.

---

## Key Takeaways

- **DispatcherServlet** is the front controller — ALL requests go through it.
- **`@RestController`** = `@Controller` + `@ResponseBody`. Returns JSON, not views.
- **`@Valid` + `@RequestBody`** for declarative request validation. Fails before controller code runs.
- **`@RestControllerAdvice`** for centralized exception handling. Consistent error response shape across the API.
- **Never expose entities directly.** Use DTOs (Records) for request/response shaping.
- **Filters** operate at the Servlet level (all requests). **Interceptors** operate at the Spring MVC level (controller requests only).
- **Pagination** — use Spring Data's `Pageable`/`Page` for standardized paging responses.
- **Jackson** handles serialization/deserialization. Customize with `@JsonProperty`, `@JsonIgnore`, `@JsonFormat`.
