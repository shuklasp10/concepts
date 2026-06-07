# Testing in Spring Boot

> Testing is not about proving code works — it's about catching regressions, documenting behavior, and enabling fearless refactoring. Spring Boot provides a rich testing ecosystem with test slices that boot only the parts of the context you need, keeping tests fast and focused.

---

## Testing Pyramid

```
           ┌─────────┐
           │   E2E   │  Few (slow, expensive, fragile)
           │  Tests  │  Full deployment, browser, external services
          ┌┴─────────┴┐
          │Integration │  Medium (boot partial Spring context)
          │   Tests    │  Real DB, real HTTP, real security
         ┌┴───────────┴┐
         │    Unit      │  Many (fast, isolated, no Spring context)
         │   Tests      │  Mock dependencies, test logic
         └──────────────┘
```

| Level | Speed | What's Tested | Tools |
|-------|-------|--------------|-------|
| **Unit** | ~ms | Single class in isolation | JUnit 5, Mockito |
| **Integration** | ~seconds | Components working together | `@SpringBootTest`, `@DataJpaTest`, `@WebMvcTest` |
| **E2E** | ~minutes | Entire application flow | TestRestTemplate, Selenium |

---

## Unit Testing with Mockito

### Testing a Service

```java
@ExtendWith(MockitoExtension.class)  // Enable Mockito annotations
class OrderServiceTest {
    
    @Mock  // Create a mock — no real implementation
    private OrderRepository orderRepo;
    
    @Mock
    private PaymentService paymentService;
    
    @InjectMocks  // Create OrderService with mocks injected
    private OrderService orderService;
    
    @Test
    void createOrder_success() {
        // Arrange
        CreateOrderRequest request = new CreateOrderRequest("item1", 2, 29.99);
        Order savedOrder = new Order(1L, "item1", 2, 29.99, OrderStatus.CREATED);
        
        when(orderRepo.save(any(Order.class))).thenReturn(savedOrder);
        when(paymentService.charge(anyDouble())).thenReturn(true);
        
        // Act
        Order result = orderService.createOrder(request);
        
        // Assert
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getStatus()).isEqualTo(OrderStatus.CREATED);
        
        // Verify interactions
        verify(orderRepo).save(any(Order.class));
        verify(paymentService).charge(29.99 * 2);
        verifyNoMoreInteractions(orderRepo, paymentService);
    }
    
    @Test
    void createOrder_paymentFails_throwsException() {
        when(paymentService.charge(anyDouble())).thenReturn(false);
        
        assertThatThrownBy(() -> orderService.createOrder(request))
            .isInstanceOf(PaymentFailedException.class)
            .hasMessageContaining("Payment declined");
        
        verify(orderRepo, never()).save(any());  // Order should NOT be saved
    }
}
```

### Key Mockito Methods

| Method | Purpose |
|--------|---------|
| `when(mock.method()).thenReturn(value)` | Stub a return value |
| `when(mock.method()).thenThrow(exception)` | Stub to throw |
| `verify(mock).method()` | Verify method was called |
| `verify(mock, times(2)).method()` | Verify called exactly N times |
| `verify(mock, never()).method()` | Verify never called |
| `any()`, `anyString()`, `anyLong()` | Argument matchers |
| `@Captor ArgumentCaptor<T>` | Capture argument passed to mock |

### Argument Captor — Inspecting What Was Passed

```java
@Captor
private ArgumentCaptor<Order> orderCaptor;

@Test
void createOrder_setsCorrectFields() {
    when(orderRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
    
    orderService.createOrder(request);
    
    verify(orderRepo).save(orderCaptor.capture());
    Order captured = orderCaptor.getValue();
    
    assertThat(captured.getAmount()).isEqualTo(59.98);
    assertThat(captured.getStatus()).isEqualTo(OrderStatus.CREATED);
}
```

---

## Integration Testing — Test Slices

### `@WebMvcTest` — Controller Layer Only

Boots only the web layer (controllers, filters, advice). Services and repos are mocked.

```java
@WebMvcTest(UserController.class)
class UserControllerTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @MockBean  // Spring mock — replaces bean in context
    private UserService userService;
    
    @Test
    void getUser_returns200() throws Exception {
        UserResponse user = new UserResponse(1L, "Alice", "alice@mail.com");
        when(userService.findById(1L)).thenReturn(user);
        
        mockMvc.perform(get("/api/users/1")
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("Alice"))
            .andExpect(jsonPath("$.email").value("alice@mail.com"));
    }
    
    @Test
    void createUser_invalidEmail_returns400() throws Exception {
        String body = """
            { "name": "Alice", "email": "invalid", "password": "12345678" }
            """;
        
        mockMvc.perform(post("/api/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.details.email").exists());
    }
    
    @Test
    void getUser_notFound_returns404() throws Exception {
        when(userService.findById(999L)).thenThrow(new EntityNotFoundException("User", 999L));
        
        mockMvc.perform(get("/api/users/999"))
            .andExpect(status().isNotFound());
    }
}
```

### `@DataJpaTest` — Repository Layer Only

Boots JPA-related components (entities, repositories, Hibernate). Uses embedded H2 by default.

```java
@DataJpaTest
class UserRepositoryTest {
    
    @Autowired
    private UserRepository userRepo;
    
    @Autowired
    private TestEntityManager entityManager;
    
    @Test
    void findByEmail_existingUser_returnsUser() {
        // Arrange — use TestEntityManager for direct DB inserts
        User user = new User("Alice", "alice@mail.com");
        entityManager.persistAndFlush(user);
        
        // Act
        Optional<User> found = userRepo.findByEmail("alice@mail.com");
        
        // Assert
        assertThat(found).isPresent();
        assertThat(found.get().getName()).isEqualTo("Alice");
    }
    
    @Test
    void findByEmail_nonExistent_returnsEmpty() {
        Optional<User> found = userRepo.findByEmail("nobody@mail.com");
        assertThat(found).isEmpty();
    }
}
```

### `@SpringBootTest` — Full Integration Test

Boots the entire application context. Use for end-to-end testing.

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class OrderIntegrationTest {
    
    @Autowired
    private TestRestTemplate restTemplate;
    
    @Autowired
    private OrderRepository orderRepo;
    
    @Test
    void createAndRetrieveOrder() {
        // Create
        CreateOrderRequest request = new CreateOrderRequest("Widget", 2, 29.99);
        ResponseEntity<OrderResponse> createResponse = restTemplate
            .postForEntity("/api/orders", request, OrderResponse.class);
        
        assertThat(createResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        Long orderId = createResponse.getBody().id();
        
        // Retrieve
        ResponseEntity<OrderResponse> getResponse = restTemplate
            .getForEntity("/api/orders/" + orderId, OrderResponse.class);
        
        assertThat(getResponse.getBody().itemName()).isEqualTo("Widget");
        
        // Verify in DB
        assertThat(orderRepo.findById(orderId)).isPresent();
    }
}
```

### Test Slice Summary

| Annotation | What's Loaded | Use For |
|-----------|--------------|---------|
| `@WebMvcTest` | Controllers, Filters, ControllerAdvice | Testing HTTP endpoints, validation, error handling |
| `@DataJpaTest` | Entities, Repos, Hibernate, H2 | Testing queries, custom repository methods |
| `@SpringBootTest` | EVERYTHING | Full integration tests, end-to-end flows |
| `@JsonTest` | Jackson ObjectMapper | Testing JSON serialization/deserialization |

---

## Testing with Testcontainers

For integration tests against real databases (not H2):

```java
@SpringBootTest
@Testcontainers
class UserServiceIntegrationTest {
    
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16")
        .withDatabaseName("testdb")
        .withUsername("test")
        .withPassword("test");
    
    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }
    
    @Autowired
    private UserService userService;
    
    @Test
    void createUser_persistsToRealPostgres() {
        UserResponse user = userService.create(new CreateUserRequest("Alice", "alice@mail.com", "password123"));
        assertThat(user.id()).isNotNull();
    }
}
```

---

## Testing Security

```java
@WebMvcTest(UserController.class)
class UserControllerSecurityTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @MockBean
    private UserService userService;
    
    @Test
    void getUsers_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/users"))
            .andExpect(status().isUnauthorized());
    }
    
    @Test
    @WithMockUser(roles = "ADMIN")
    void getUsers_asAdmin_returns200() throws Exception {
        when(userService.findAll()).thenReturn(List.of());
        
        mockMvc.perform(get("/api/users"))
            .andExpect(status().isOk());
    }
    
    @Test
    @WithMockUser(roles = "USER")
    void deleteUser_asUser_returns403() throws Exception {
        mockMvc.perform(delete("/api/users/1"))
            .andExpect(status().isForbidden());
    }
}
```

---

## Best Practices

### Test Naming Convention

```java
// Pattern: methodName_scenario_expectedResult
@Test
void createOrder_validRequest_returnsCreatedOrder() { ... }

@Test
void createOrder_duplicateEmail_throwsConflictException() { ... }

@Test
void findById_nonExistentId_returns404() { ... }
```

### Test Organization

```
src/test/java/com/myapp/
├── unit/
│   ├── service/
│   │   └── OrderServiceTest.java        ← Unit tests (Mockito)
│   └── util/
│       └── PriceCalculatorTest.java
├── integration/
│   ├── controller/
│   │   └── OrderControllerTest.java     ← @WebMvcTest
│   ├── repository/
│   │   └── OrderRepositoryTest.java     ← @DataJpaTest
│   └── OrderIntegrationTest.java        ← @SpringBootTest
└── resources/
    └── application-test.yml             ← Test-specific config
```

### Common Mistakes

```java
// ❌ Testing implementation details
verify(repo).save(any());  // Fragile — breaks if implementation changes

// ✅ Testing behavior/outcomes
assertThat(result.getStatus()).isEqualTo(OrderStatus.CREATED);

// ❌ Too much mocking — testing the mocks, not the code
when(a.method()).thenReturn(when(b.method()).thenReturn(...));

// ✅ If you need that many mocks, the class has too many dependencies — refactor

// ❌ No test for error cases
// ✅ Test validation errors, not-found cases, authorization failures, edge cases
```

---

## Interview Perspective

**Q: What is the difference between `@Mock` and `@MockBean`?**

`@Mock` (Mockito) creates a mock in isolation — no Spring context. Use in unit tests. `@MockBean` (Spring Boot) creates a mock AND replaces the actual bean in the Spring ApplicationContext. Use in integration tests (`@WebMvcTest`, `@SpringBootTest`) to override specific beans while keeping the rest of the context intact.

**Q: What are test slices? Why are they useful?**

Test slices (`@WebMvcTest`, `@DataJpaTest`, `@JsonTest`) boot only a subset of the Spring context needed for that layer. `@WebMvcTest` loads controllers and web config but not services or repos. This makes tests faster (partial boot) and focused (test one layer at a time). Use `@MockBean` to mock dependencies from other layers.

**Q: How do you test a REST controller in Spring Boot?**

Use `@WebMvcTest(MyController.class)` + `MockMvc`. Mock service dependencies with `@MockBean`. Use `mockMvc.perform(get/post/put/delete)` to simulate HTTP requests. Assert status codes with `status().isOk()`, response body with `jsonPath()`, headers with `header()`. Test success, validation errors, not-found, and security (with `@WithMockUser`).

**Q: How do you test against a real database instead of H2?**

Use Testcontainers — spins up a real PostgreSQL/MySQL in Docker for tests. Use `@Container` and `@DynamicPropertySource` to configure the datasource URL dynamically. The container starts before tests and stops after. This catches DB-specific issues that H2 misses (like PostgreSQL-specific syntax).

---

## Key Takeaways

- **Unit tests** (Mockito) for business logic — fast, isolated, no Spring context.
- **`@WebMvcTest`** for controllers — tests HTTP layer (status codes, validation, error handling) without booting the full app.
- **`@DataJpaTest`** for repositories — tests queries against embedded H2 or Testcontainers.
- **`@SpringBootTest`** for full integration — boots everything, tests end-to-end flows.
- **`@Mock`** for unit tests, **`@MockBean`** for integration tests (replaces bean in Spring context).
- **Testcontainers** for real database testing — catches DB-specific issues H2 misses.
- **Test behavior, not implementation.** Assert outcomes, not method calls.
- **Test naming:** `methodName_scenario_expectedResult`.
