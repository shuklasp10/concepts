# Spring Security

> Spring Security is a powerful, customizable authentication and access-control framework. Its architecture is built on a chain of servlet filters that intercept every request. Understanding this filter chain — not just annotations — is what lets you debug auth issues, implement custom flows, and secure production APIs.

---

## How Spring Security Works — The Big Picture

```
HTTP Request
     │
     ▼
┌─────────────────────────────────────────────────────────┐
│                 Security Filter Chain                     │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ 1. CorsFilter                                     │   │
│  │    Handle CORS preflight (OPTIONS)                │   │
│  ├──────────────────────────────────────────────────┤   │
│  │ 2. CsrfFilter                                     │   │
│  │    Validate CSRF tokens (for form-based apps)     │   │
│  ├──────────────────────────────────────────────────┤   │
│  │ 3. UsernamePasswordAuthenticationFilter           │   │
│  │    OR JwtAuthenticationFilter (custom)            │   │
│  │    → Extract credentials → Authenticate            │   │
│  ├──────────────────────────────────────────────────┤   │
│  │ 4. ExceptionTranslationFilter                     │   │
│  │    Catches AuthenticationException → 401           │   │
│  │    Catches AccessDeniedException → 403             │   │
│  ├──────────────────────────────────────────────────┤   │
│  │ 5. AuthorizationFilter                            │   │
│  │    Check permissions (role, authority)              │   │
│  └──────────────────────────────────────────────────┘   │
│                         │                                │
│                    All passed ✅                          │
│                         │                                │
└─────────────────────────┼───────────────────────────────┘
                          ▼
                   DispatcherServlet → Controller
```

### Mental Model

Security is like an **airport security checkpoint**:
1. **Check your ticket** (CORS — are you allowed to be here?).
2. **Show your passport** (Authentication — who are you?).
3. **Check the boarding pass** (Authorization — are you allowed on THIS flight?).
4. **If anything fails** → Denied entry (401/403).

---

## Security Configuration (Spring Boot 3+)

### Basic Setup

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())  // Disable for stateless REST APIs
            .sessionManagement(session -> 
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()        // Public
                .requestMatchers("/api/admin/**").hasRole("ADMIN")  // Admin only
                .requestMatchers(HttpMethod.GET, "/api/products/**").permitAll()
                .anyRequest().authenticated()                       // Everything else → auth required
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);  // Cost factor 12
    }
    
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) 
            throws Exception {
        return config.getAuthenticationManager();
    }
}
```

---

## Authentication — "Who Are You?"

### The Authentication Flow

```
Client sends credentials (login request)
       │
       ▼
┌──────────────────────────┐
│ AuthenticationFilter      │  Extract credentials from request
└──────────┬───────────────┘
           ▼
┌──────────────────────────┐
│ AuthenticationManager     │  Delegates to providers
│ (ProviderManager)        │
└──────────┬───────────────┘
           ▼
┌──────────────────────────┐
│ AuthenticationProvider    │  DaoAuthenticationProvider (username/password)
│                          │  JwtAuthenticationProvider (JWT tokens)
│                          │  OAuth2LoginAuthenticationProvider (OAuth2)
└──────────┬───────────────┘
           ▼
┌──────────────────────────┐
│ UserDetailsService        │  Load user from DB
│ loadUserByUsername()      │  Return UserDetails (username, password, authorities)
└──────────┬───────────────┘
           ▼
┌──────────────────────────┐
│ PasswordEncoder           │  Compare submitted password with stored hash
│ BCrypt.matches()          │  (bcrypt internally handles salt)
└──────────┬───────────────┘
           │
    ┌──────┴──────┐
    │             │
  Match ✅     Mismatch ❌
    │             │
    ▼             ▼
 Create       Throw
 Authentication  AuthenticationException
 token           → 401 Unauthorized
    │
    ▼
Store in SecurityContextHolder
(available throughout the request)
```

### UserDetailsService Implementation

```java
@Service
public class CustomUserDetailsService implements UserDetailsService {
    
    private final UserRepository userRepo;
    
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepo.findByEmail(email)
            .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
        
        return org.springframework.security.core.userdetails.User.builder()
            .username(user.getEmail())
            .password(user.getPasswordHash())  // BCrypt hash from DB
            .roles(user.getRole().name())       // ADMIN, USER, etc.
            .build();
    }
}
```

---

## JWT Authentication — Stateless API Security

### How JWT Works

```
1. Login:
   Client → POST /api/auth/login { email, password }
   Server → Verify credentials → Generate JWT → Return token
   
2. Subsequent Requests:
   Client → GET /api/users (Header: Authorization: Bearer <token>)
   Server → Extract token → Validate signature → Extract user → Process request

JWT Structure:
┌────────────┐.┌────────────┐.┌────────────┐
│   Header   │ │   Payload  │ │  Signature │
│ {          │ │ {          │ │  HMAC-SHA256│
│  "alg":    │ │  "sub":    │ │  (header + │
│  "HS256",  │ │  "userId", │ │   payload +│
│  "typ":    │ │  "role":   │ │   secret)  │
│  "JWT"     │ │  "ADMIN",  │ │            │
│ }          │ │  "exp":    │ │            │
│            │ │  1719878400│ │            │
└────────────┘ └────────────┘ └────────────┘
   Base64        Base64         Verify
   encoded       encoded        integrity
```

### JWT Service

```java
@Service
public class JwtService {
    
    @Value("${app.jwt.secret}")
    private String secretKey;
    
    @Value("${app.jwt.expiration}")
    private long expirationMs;  // e.g., 900000 (15 min)
    
    public String generateToken(UserDetails userDetails) {
        return Jwts.builder()
            .subject(userDetails.getUsername())
            .claim("role", userDetails.getAuthorities().toString())
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + expirationMs))
            .signWith(getSigningKey())
            .compact();
    }
    
    public String extractUsername(String token) {
        return getClaims(token).getSubject();
    }
    
    public boolean isTokenValid(String token, UserDetails userDetails) {
        String username = extractUsername(token);
        return username.equals(userDetails.getUsername()) && !isExpired(token);
    }
    
    private boolean isExpired(String token) {
        return getClaims(token).getExpiration().before(new Date());
    }
    
    private Claims getClaims(String token) {
        return Jwts.parser()
            .verifyWith(getSigningKey())
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }
    
    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(secretKey));
    }
}
```

### JWT Authentication Filter

```java
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                     HttpServletResponse response,
                                     FilterChain filterChain) throws ServletException, IOException {
        
        String authHeader = request.getHeader("Authorization");
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);  // No token → continue (might be public endpoint)
            return;
        }
        
        String token = authHeader.substring(7);
        String username = jwtService.extractUsername(token);
        
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
            
            if (jwtService.isTokenValid(token, userDetails)) {
                UsernamePasswordAuthenticationToken authToken =
                    new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }
        
        filterChain.doFilter(request, response);
    }
}
```

### Auth Controller

```java
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    
    private final AuthenticationManager authManager;
    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    
    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        authManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );
        
        UserDetails user = userDetailsService.loadUserByUsername(request.email());
        String token = jwtService.generateToken(user);
        
        return new AuthResponse(token);
    }
}
```

### Refresh Token Pattern

```
Access Token: Short-lived (15 min), sent in Authorization header
Refresh Token: Long-lived (7 days), stored in httpOnly cookie or DB

Flow:
1. Login → receive access token + refresh token
2. API calls use access token in Authorization header
3. Access token expires → 401
4. Client sends refresh token to /api/auth/refresh
5. Server validates refresh token → issues new access token
6. If refresh token is expired → user must log in again

Why:
- Access tokens are short-lived → minimal damage if stolen
- Refresh tokens can be revoked (stored in DB, check on use)
- Reduces database lookups (access token is self-contained)
```

---

## Authorization — "What Can You Do?"

### Method-Level Security

```java
@Configuration
@EnableMethodSecurity  // Enable @PreAuthorize, @PostAuthorize
public class MethodSecurityConfig {}
```

```java
@Service
public class UserService {
    
    @PreAuthorize("hasRole('ADMIN')")
    public List<User> findAllUsers() { ... }
    
    @PreAuthorize("hasRole('ADMIN') or #id == authentication.principal.id")
    public User findById(Long id) { ... }  // Admin or yourself
    
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public void deleteUser(Long id) { ... }
    
    @PostAuthorize("returnObject.createdBy == authentication.name")
    public Document getDocument(Long id) { ... }  // Check AFTER retrieval
}
```

### Role vs Authority

| Concept | Convention | Usage |
|---------|-----------|-------|
| **Role** | Prefixed with `ROLE_` | `hasRole('ADMIN')` → checks for `ROLE_ADMIN` |
| **Authority** | Any string | `hasAuthority('user:write')` → checks for exact `user:write` |

```java
// Role — coarse-grained
.requestMatchers("/api/admin/**").hasRole("ADMIN")

// Authority — fine-grained
.requestMatchers(HttpMethod.DELETE, "/api/users/**").hasAuthority("user:delete")
.requestMatchers(HttpMethod.PUT, "/api/users/**").hasAuthority("user:update")
```

### Getting the Current User

```java
@GetMapping("/me")
public UserResponse getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
    return userService.findByEmail(userDetails.getUsername());
}

// Or from anywhere in the code
SecurityContext context = SecurityContextHolder.getContext();
Authentication auth = context.getAuthentication();
String username = auth.getName();
```

---

## CSRF Protection

### When to Enable/Disable

| App Type | CSRF | Why |
|---------|------|-----|
| REST API with JWT | **Disable** | JWT in Authorization header — browsers don't auto-send custom headers |
| REST API with cookies | **Enable** | Cookies are auto-sent — vulnerable to CSRF |
| Server-rendered (Thymeleaf) | **Enable** | Form submissions use cookies |

```java
// For stateless REST APIs with JWT
http.csrf(csrf -> csrf.disable());

// For cookie-based apps — CSRF token auto-included in forms
http.csrf(csrf -> csrf
    .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse()));
```

---

## CORS Configuration in Security

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http.cors(cors -> cors.configurationSource(corsConfigSource()));
    // ... other config
    return http.build();
}

@Bean
public CorsConfigurationSource corsConfigSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(List.of("https://myapp.com", "http://localhost:3000"));
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(List.of("*"));
    config.setAllowCredentials(true);
    config.setMaxAge(3600L);
    
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/api/**", config);
    return source;
}
```

> **Important:** When using Spring Security, configure CORS in the Security config (`http.cors()`), not just in `WebMvcConfigurer`. The Security filter chain runs BEFORE MVC — CORS must be handled at the security level.

---

## Password Security

### BCrypt — How It Works

```java
// Registration
String rawPassword = "mypassword123";
String hash = passwordEncoder.encode(rawPassword);
// "$2a$12$LJ3m4ys3Gz2k8f3cK.../..." — includes algorithm, cost factor, salt, and hash

// Login verification
boolean matches = passwordEncoder.matches(rawPassword, hash);
// BCrypt extracts the salt from the stored hash and re-hashes — no separate salt storage needed
```

**Why BCrypt:**
- **Adaptive** — increase cost factor as hardware gets faster.
- **Built-in salt** — each hash has a unique random salt.
- **Intentionally slow** — prevents brute-force (cost 12 ≈ 250ms per hash).

---

## Interview Perspective

**Q: How does the Spring Security filter chain work?**

Every HTTP request passes through a chain of security filters (typically 15+). Key filters: CorsFilter (CORS), CsrfFilter (CSRF tokens), AuthenticationFilter (extract and validate credentials), ExceptionTranslationFilter (convert auth exceptions to 401/403), AuthorizationFilter (check permissions). Filters execute in order; if any rejects, the request is blocked. Custom filters (like JWT) are inserted at specific positions in the chain.

**Q: Explain JWT authentication in Spring Security.**

Login: client sends credentials → AuthenticationManager verifies → JwtService generates a signed token containing user ID, role, and expiration → returns token. Subsequent requests: JwtAuthenticationFilter extracts token from Authorization header → validates signature and expiration → loads UserDetails → sets Authentication in SecurityContextHolder → request proceeds. JWT is stateless — no server-side session.

**Q: What is the difference between authentication and authorization?**

Authentication = "Who are you?" — verifying identity (login, JWT validation). Authorization = "What can you do?" — checking permissions after identity is confirmed. Spring Security handles authentication via AuthenticationManager/Provider chain, and authorization via `authorizeHttpRequests()` and `@PreAuthorize`. A 401 means "not authenticated," 403 means "authenticated but not authorized."

**Q: How do you secure a REST API with Spring Security?**

Disable CSRF (stateless API), set session policy to STATELESS, configure endpoint permissions (permitAll for public, hasRole for protected), add JWT filter before UsernamePasswordAuthenticationFilter, implement UserDetailsService to load users from DB, use BCrypt for password hashing, configure CORS at the security level.

**Q: When should CSRF be enabled or disabled?**

Disable for stateless REST APIs using JWT in Authorization headers — browsers don't auto-send custom headers, so CSRF attacks aren't possible. Enable for any app using cookie-based authentication — browsers auto-send cookies, making the app vulnerable to cross-site request forgery.

---

## Key Takeaways

- **Security = Filter Chain.** Every request passes through 15+ filters before reaching your controller.
- **JWT for REST APIs:** Stateless, no server-side session, self-contained. Use short-lived access tokens + refresh tokens.
- **Always use BCrypt** (cost 12+) for password hashing. Never store plaintext or use MD5/SHA.
- **Disable CSRF for stateless REST APIs.** Enable for cookie-based auth.
- **Configure CORS in Security config,** not just MVC — Security filters run first.
- **`@PreAuthorize`** for method-level authorization. Supports SpEL expressions for fine-grained control.
- **`SecurityContextHolder`** stores the current user's Authentication for the duration of the request.
- **`@Transactional` internal call problem** also applies to `@PreAuthorize` — AOP proxy is bypassed on self-calls.
