# SSO Implementation - Technical Guide

A comprehensive technical guide explaining how SSO authentication works and how each component in this application contributes to the overall system.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Understanding OAuth 2.0 and OpenID Connect](#understanding-oauth-20-and-openid-connect)
3. [Frontend Architecture](#frontend-architecture)
4. [Backend Architecture](#backend-architecture)
5. [Authentication Flow](#authentication-flow)
6. [Token Management](#token-management)
7. [Security Considerations](#security-considerations)
8. [Component Deep Dive](#component-deep-dive)
9. [Advanced Topics](#advanced-topics)

---

## Architecture Overview

### System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    User's Browser                             │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────────────────────────────────────┐      │
│  │         Angular SPA (Port 4200)                    │      │
│  │                                                     │      │
│  │  ┌──────────────┐  ┌──────────────┐               │      │
│  │  │   Login      │  │    Home      │               │      │
│  │  │  Component   │  │  Component   │               │      │
│  │  └──────────────┘  └──────────────┘               │      │
│  │                                                     │      │
│  │  ┌─────────────────────────────────────────────┐  │      │
│  │  │         Authentication Services             │  │      │
│  │  │  ┌──────┐  ┌──────┐  ┌──────┐              │  │      │
│  │  │  │Azure │  │Okta  │  │Auth0 │              │  │      │
│  │  │  │Auth  │  │Auth  │  │Auth  │              │  │      │
│  │  │  └──────┘  └──────┘  └──────┘              │  │      │
│  │  └─────────────────────────────────────────────┘  │      │
│  │                                                     │      │
│  │  ┌─────────────────────────────────────────────┐  │      │
│  │  │      Auth Guard + HTTP Interceptor          │  │      │
│  │  └─────────────────────────────────────────────┘  │      │
│  └────────────────────────────────────────────────────┘      │
│                          │                                    │
│                          │ HTTP + JWT Token                  │
│                          ▼                                    │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│              .NET 8 Web API (Port 7001)                      │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────────────────────────────────────┐      │
│  │            Authentication Middleware               │      │
│  │  ┌──────────────────────────────────────────────┐ │      │
│  │  │      Multi-Scheme JWT Authentication         │ │      │
│  │  │   (Azure AD | Okta | Auth0)                  │ │      │
│  │  └──────────────────────────────────────────────┘ │      │
│  └────────────────────────────────────────────────────┘      │
│                          │                                    │
│                          ▼                                    │
│  ┌────────────────────────────────────────────────────┐      │
│  │           AuthController                           │      │
│  │  - /api/auth/validate                             │      │
│  │  - /api/auth/user                                 │      │
│  │  - /api/auth/validate-external                    │      │
│  └────────────────────────────────────────────────────┘      │
│                          │                                    │
│                          ▼                                    │
│  ┌────────────────────────────────────────────────────┐      │
│  │      TokenValidationService                        │      │
│  │  - Provider Detection                              │      │
│  │  - Token Validation                                │      │
│  │  - JWKS Key Resolution                             │      │
│  └────────────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────────────┘

                          │
                          │ HTTPS
                          ▼

┌──────────────────────────────────────────────────────────────┐
│                   SSO Providers                              │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │  Azure AD   │  │    Okta     │  │   Auth0     │          │
│  │             │  │             │  │             │          │
│  │ - OAuth 2.0 │  │ - OAuth 2.0 │  │ - OAuth 2.0 │          │
│  │ - OIDC      │  │ - OIDC      │  │ - OIDC      │          │
│  │ - JWKS      │  │ - JWKS      │  │ - JWKS      │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└──────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend**:
- **Angular 17**: Progressive web framework
- **TypeScript**: Typed superset of JavaScript
- **RxJS**: Reactive Extensions for JavaScript
- **Provider SDKs**: @azure/msal-browser, @okta/okta-auth-js, @auth0/auth0-spa-js

**Backend**:
- **.NET 8**: Cross-platform framework
- **ASP.NET Core**: Web API framework
- **JWT Bearer Authentication**: Token validation middleware
- **Microsoft.Identity.Web**: Azure AD integration

---

## Understanding OAuth 2.0 and OpenID Connect

### What is OAuth 2.0?

OAuth 2.0 is an **authorization framework** that allows third-party applications to access user data without exposing credentials.

**Key Concepts**:

1. **Resource Owner**: The user who owns the data
2. **Client**: Your application (Angular app)
3. **Authorization Server**: The SSO provider (Azure AD, Okta, Auth0)
4. **Resource Server**: Your API (the .NET backend)

### What is OpenID Connect (OIDC)?

OIDC is an **authentication layer** built on top of OAuth 2.0. While OAuth 2.0 handles authorization, OIDC handles authentication and provides user identity information.

**OIDC adds**:
- **ID Token**: Contains user identity claims
- **UserInfo Endpoint**: Provides additional user information
- **Standardized Claims**: email, name, sub (subject/user ID)

### OAuth 2.0 Flow (Authorization Code Flow with PKCE)

```
┌─────────┐                                           ┌───────────┐
│ Browser │                                           │ SSO       │
│         │                                           │ Provider  │
└────┬────┘                                           └─────┬─────┘
     │                                                      │
     │ 1. User clicks "Sign in with Azure"                 │
     │                                                      │
     │ 2. Redirect to SSO provider login page              │
     │─────────────────────────────────────────────────────>│
     │    /authorize?                                       │
     │    client_id=xxx&                                    │
     │    redirect_uri=http://localhost:4200&              │
     │    response_type=code&                               │
     │    code_challenge=xxx (PKCE)                         │
     │                                                      │
     │                     3. User enters credentials       │
     │                     4. User grants consent           │
     │                                                      │
     │ 5. Redirect back with authorization code            │
     │<─────────────────────────────────────────────────────│
     │    http://localhost:4200?code=AUTH_CODE             │
     │                                                      │
     │ 6. Exchange code for tokens                         │
     │─────────────────────────────────────────────────────>│
     │    POST /token                                       │
     │    code=AUTH_CODE&                                   │
     │    code_verifier=xxx (PKCE)                          │
     │                                                      │
     │ 7. Return tokens                                    │
     │<─────────────────────────────────────────────────────│
     │    {                                                 │
     │      "access_token": "eyJ...",                      │
     │      "id_token": "eyJ...",                          │
     │      "refresh_token": "xxx",                        │
     │      "expires_in": 3600                             │
     │    }                                                 │
     │                                                      │
```

### JWT (JSON Web Token) Structure

A JWT consists of three parts separated by dots: `header.payload.signature`

**Example JWT**:
```
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZW1haWwiOiJqb2huQGV4YW1wbGUuY29tIiwiaWF0IjoxNTE2MjM5MDIyfQ.signature_here
```

**Decoded**:

1. **Header** (Algorithm and Token Type):
```json
{
  "alg": "RS256",      // RSA Signature with SHA-256
  "typ": "JWT",        // Type: JWT
  "kid": "key-id-123"  // Key ID (which key to use for verification)
}
```

2. **Payload** (Claims):
```json
{
  "sub": "1234567890",              // Subject (user ID)
  "name": "John Doe",               // User's name
  "email": "john@example.com",      // User's email
  "iss": "https://provider.com",    // Issuer (who created the token)
  "aud": "your-client-id",          // Audience (who this token is for)
  "exp": 1735689600,                // Expiration timestamp
  "iat": 1735686000                 // Issued at timestamp
}
```

3. **Signature** (Verification):
```
RSASHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  privateKey
)
```

**How Signature Verification Works**:
1. Provider signs token with their **private key**
2. Provider publishes **public key** at JWKS endpoint
3. Your backend fetches public key
4. Backend verifies signature using public key
5. If signature valid, token is authentic and hasn't been tampered with

---

## Frontend Architecture

### Component Structure

```
frontend/src/app/
│
├── components/
│   ├── login/
│   │   ├── login.component.ts        # Login page logic
│   │   ├── login.component.html      # Login page UI
│   │   └── login.component.css       # Login page styles
│   │
│   └── home/
│       ├── home.component.ts         # Home page logic
│       ├── home.component.html       # Home page UI
│       └── home.component.css        # Home page styles
│
├── services/
│   ├── auth.service.ts               # Main auth orchestrator
│   ├── azure-auth.service.ts         # Azure AD specific logic
│   ├── okta-auth.service.ts          # Okta specific logic
│   └── auth0-auth.service.ts         # Auth0 specific logic
│
├── guards/
│   └── auth.guard.ts                 # Route protection
│
├── interceptors/
│   └── auth.interceptor.ts           # HTTP request interceptor
│
├── models/
│   └── user.model.ts                 # TypeScript interfaces
│
├── app-routing.module.ts             # Route configuration
├── app.module.ts                     # App configuration
└── app.component.ts                  # Root component
```

### Service Layer Architecture

#### 1. Main Auth Service (`auth.service.ts`)

**Purpose**: Orchestrates authentication across all providers

**Key Responsibilities**:
```typescript
export class AuthService {
  // Current user observable
  public currentUser: Observable<User | null>;

  // Login with any provider
  async login(provider: SsoProvider): Promise<void>

  // Handle OAuth callback
  async handleCallback(): Promise<void>

  // Logout from current provider
  async logout(): Promise<void>

  // Get access token for API calls
  async getAccessToken(): Promise<string | null>

  // Check if user is authenticated
  isAuthenticated(): boolean
}
```

**How it works**:
```typescript
// Example: Login process
async login(provider: SsoProvider): Promise<void> {
  // 1. Save chosen provider
  this.currentProvider = provider;
  localStorage.setItem('ssoProvider', provider);

  // 2. Delegate to provider-specific service
  switch (provider) {
    case SsoProvider.Azure:
      await this.azureAuth.login();
      break;
    case SsoProvider.Okta:
      await this.oktaAuth.login();
      break;
    case SsoProvider.Auth0:
      await this.auth0Auth.login();
      break;
  }
}
```

#### 2. Provider-Specific Services

Each provider has its own service that wraps the provider's SDK:

**Azure Auth Service** (`azure-auth.service.ts`):
```typescript
export class AzureAuthService {
  private msalInstance: PublicClientApplication;

  constructor() {
    // Initialize MSAL (Microsoft Authentication Library)
    this.msalInstance = new PublicClientApplication({
      auth: {
        clientId: environment.azure.clientId,
        authority: environment.azure.authority,
        redirectUri: environment.azure.redirectUri
      }
    });
  }

  async login(): Promise<void> {
    // Redirect to Azure AD login
    await this.msalInstance.loginRedirect({
      scopes: ['openid', 'profile', 'email', 'User.Read']
    });
  }

  async handleCallback(): Promise<User | null> {
    // Handle redirect from Azure AD
    const response = await this.msalInstance.handleRedirectPromise();

    if (response) {
      // Extract user info from response
      return {
        id: response.account.localAccountId,
        email: response.account.username,
        name: response.account.name,
        provider: 'azure'
      };
    }
    return null;
  }

  async getAccessToken(): Promise<string | null> {
    // Get token silently (from cache or refresh)
    const response = await this.msalInstance.acquireTokenSilent({
      scopes: ['openid', 'profile', 'email'],
      account: this.msalInstance.getAllAccounts()[0]
    });
    return response.accessToken;
  }
}
```

**Why separate services?**
- Each provider has different SDK initialization
- Different authentication flows
- Different token formats and claims
- Easier to maintain and test
- Can enable/disable providers independently

### Guards and Interceptors

#### Auth Guard (`auth.guard.ts`)

**Purpose**: Protect routes from unauthorized access

```typescript
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const currentUser = this.authService.currentUserValue;

    if (currentUser) {
      // User is logged in, allow access
      return true;
    }

    // User is not logged in, redirect to login
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }
}
```

**How it's used in routing**:
```typescript
const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: 'home',
    component: HomeComponent,
    canActivate: [AuthGuard]  // ← Guard applied here
  }
];
```

**What happens**:
1. User tries to navigate to `/home`
2. Angular calls `canActivate()` before navigation
3. If returns `true`, navigation proceeds
4. If returns `false`, navigation is cancelled and user redirected

#### Auth Interceptor (`auth.interceptor.ts`)

**Purpose**: Automatically add JWT token to all HTTP requests

```typescript
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {

    // Get token asynchronously
    return from(this.authService.getAccessToken()).pipe(
      switchMap(token => {
        if (token) {
          // Clone request and add Authorization header
          request = request.clone({
            setHeaders: {
              Authorization: `Bearer ${token}`
            }
          });
        }

        // Continue with modified request
        return next.handle(request);
      })
    );
  }
}
```

**How it works**:
```
Without Interceptor:
──────────────────────
http.get('/api/auth/validate')
  ↓
Request sent WITHOUT token
  ↓
401 Unauthorized ❌


With Interceptor:
─────────────────
http.get('/api/auth/validate')
  ↓
Interceptor catches request
  ↓
Gets token from AuthService
  ↓
Adds: Authorization: Bearer eyJ...
  ↓
Request sent WITH token
  ↓
200 OK ✓
```

**Registered in app.module.ts**:
```typescript
providers: [
  {
    provide: HTTP_INTERCEPTORS,
    useClass: AuthInterceptor,
    multi: true  // Allow multiple interceptors
  }
]
```

### State Management

**How user state is managed**:

```typescript
// 1. BehaviorSubject holds current state
private currentUserSubject: BehaviorSubject<User | null>;

// 2. Observable exposes state to components
public currentUser: Observable<User | null>;

// 3. Components subscribe to changes
this.authService.currentUser.subscribe(user => {
  this.currentUser = user;  // Updates automatically when user changes
});

// 4. Service updates state
this.currentUserSubject.next(user);  // All subscribers notified
```

**Persistence across page refreshes**:
```typescript
// On login, save to localStorage
localStorage.setItem('currentUser', JSON.stringify(user));
localStorage.setItem('ssoProvider', provider);
localStorage.setItem('accessToken', token);

// On app initialization, restore from localStorage
const storedUser = localStorage.getItem('currentUser');
if (storedUser) {
  this.currentUserSubject.next(JSON.parse(storedUser));
}
```

---

## Backend Architecture

### Project Structure

```
backend/
│
├── Controllers/
│   └── AuthController.cs           # API endpoints
│
├── Services/
│   ├── ITokenValidationService.cs  # Interface
│   └── TokenValidationService.cs   # Implementation
│
├── Models/
│   └── UserInfo.cs                 # Data models
│
├── Properties/
│   └── launchSettings.json         # Launch configuration
│
├── Program.cs                      # App configuration
├── appsettings.json                # Configuration
└── SsoApi.csproj                   # Project file
```

### Dependency Injection and Middleware Pipeline

#### Program.cs - Application Configuration

```csharp
var builder = WebApplication.CreateBuilder(args);

// 1. Add Services to DI Container
// ─────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Register our custom service
builder.Services.AddSingleton<ITokenValidationService, TokenValidationService>();

// 2. Configure CORS
// ─────────────────
builder.Services.AddCors(options => {
    options.AddPolicy("AllowAngularApp", builder => {
        builder.WithOrigins("http://localhost:4200")
               .AllowAnyMethod()
               .AllowAnyHeader()
               .AllowCredentials();
    });
});

// 3. Configure Authentication
// ────────────────────────────
builder.Services
    .AddAuthentication(options => {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer("Azure", options => { /* Azure config */ })
    .AddJwtBearer("Okta", options => { /* Okta config */ })
    .AddJwtBearer("Auth0", options => { /* Auth0 config */ })
    .AddPolicyScheme("MultiAuthSchemes", JwtBearerDefaults.AuthenticationScheme, options => {
        // Provider detection logic
    });

var app = builder.Build();

// 4. Configure Middleware Pipeline
// ─────────────────────────────────
app.UseHttpsRedirection();    // Force HTTPS
app.UseCors("AllowAngularApp"); // Enable CORS
app.UseAuthentication();       // Enable authentication
app.UseAuthorization();        // Enable authorization
app.MapControllers();          // Map controller routes

app.Run();
```

**Middleware Pipeline Execution Order**:
```
Request
  │
  ├─> UseHttpsRedirection    (Redirect HTTP to HTTPS)
  │
  ├─> UseCors                (Handle CORS preflight)
  │
  ├─> UseAuthentication      (Validate JWT token)
  │     │
  │     ├─> Read Authorization header
  │     ├─> Extract JWT token
  │     ├─> Validate signature
  │     ├─> Validate expiration
  │     └─> Create ClaimsPrincipal
  │
  ├─> UseAuthorization       (Check if user has permission)
  │
  └─> Controller Action      (Execute endpoint logic)
        │
        └─> Response
```

### Multi-Scheme Authentication

**The Problem**:
We need to validate tokens from three different providers, each with different:
- Issuers
- Audiences
- Signing keys

**The Solution**: Policy Scheme with Dynamic Forwarding

```csharp
.AddPolicyScheme("MultiAuthSchemes", JwtBearerDefaults.AuthenticationScheme, options =>
{
    options.ForwardDefaultSelector = context =>
    {
        // 1. Extract token from request
        var authHeader = context.Request.Headers.Authorization.ToString();
        var token = authHeader.Replace("Bearer ", "");

        // 2. Detect provider from token
        var tokenService = context.RequestServices
            .GetRequiredService<ITokenValidationService>();
        var provider = tokenService.GetProviderFromToken(token);

        // 3. Forward to appropriate scheme
        return provider switch {
            "Azure" => "Azure",
            "Okta" => "Okta",
            "Auth0" => "Auth0",
            _ => "Azure"  // Default
        };
    };
});
```

**How Provider Detection Works**:
```csharp
public string GetProviderFromToken(string token)
{
    // Parse JWT without validation
    var jwtToken = _tokenHandler.ReadJwtToken(token);

    // Read issuer claim
    var issuer = jwtToken.Issuer;

    // Match issuer to provider
    if (issuer.Contains("microsoftonline.com"))
        return "Azure";
    if (issuer.Contains("okta.com"))
        return "Okta";
    if (issuer.Contains("auth0.com"))
        return "Auth0";

    return "Azure";  // Default
}
```

**Example Token Issuers**:
- Azure: `https://login.microsoftonline.com/{tenant-id}/v2.0`
- Okta: `https://dev-12345.okta.com/oauth2/default`
- Auth0: `https://your-app.auth0.com/`

### Token Validation Service

**Interface** (`ITokenValidationService.cs`):
```csharp
public interface ITokenValidationService
{
    // Detect provider from token issuer
    string GetProviderFromToken(string token);

    // Validate token and extract claims
    Task<TokenValidationResult> ValidateTokenAsync(string token, string provider);
}

public class TokenValidationResult
{
    public bool IsValid { get; set; }
    public string? UserId { get; set; }
    public string? Email { get; set; }
    public string? Name { get; set; }
    public string? Provider { get; set; }
    public Dictionary<string, string>? Claims { get; set; }
    public string? Error { get; set; }
}
```

**Implementation** (`TokenValidationService.cs`):
```csharp
public async Task<TokenValidationResult> ValidateTokenAsync(string token, string provider)
{
    try {
        // 1. Get validation parameters for provider
        var validationParameters = GetValidationParameters(provider);

        // 2. Validate token
        var principal = _tokenHandler.ValidateToken(
            token,
            validationParameters,
            out var validatedToken
        );

        // 3. Extract claims
        return new TokenValidationResult {
            IsValid = true,
            UserId = GetClaimValue(principal, "sub"),
            Email = GetClaimValue(principal, "email"),
            Name = GetClaimValue(principal, "name"),
            Provider = provider,
            Claims = principal.Claims.ToDictionary(c => c.Type, c => c.Value)
        };
    }
    catch (Exception ex) {
        return new TokenValidationResult {
            IsValid = false,
            Error = ex.Message
        };
    }
}
```

**Provider-Specific Validation Parameters**:
```csharp
private TokenValidationParameters GetAzureValidationParameters()
{
    var tenantId = _configuration["Azure:TenantId"];

    return new TokenValidationParameters {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,

        ValidIssuer = $"https://login.microsoftonline.com/{tenantId}/v2.0",
        ValidAudience = _configuration["Azure:ClientId"],

        // Dynamically fetch signing keys from Azure's JWKS endpoint
        IssuerSigningKeyResolver = (token, securityToken, kid, parameters) => {
            var client = new HttpClient();
            var jwksJson = client
                .GetStringAsync($"https://login.microsoftonline.com/{tenantId}/discovery/v2.0/keys")
                .Result;
            var keys = new JsonWebKeySet(jwksJson);
            return keys.Keys;
        }
    };
}
```

**Why IssuerSigningKeyResolver?**
```
Traditional approach:
────────────────────
Hard-code public key
  ↓
Provider rotates keys
  ↓
Your app breaks ❌
  ↓
Manual update required


Dynamic approach:
─────────────────
Fetch keys from JWKS endpoint
  ↓
Provider rotates keys
  ↓
Your app automatically uses new keys ✓
  ↓
No manual intervention needed
```

### Controller Implementation

**AuthController** (`Controllers/AuthController.cs`):

```csharp
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ITokenValidationService _tokenValidationService;

    // 1. Validate endpoint (requires authentication)
    [HttpGet("validate")]
    [Authorize(AuthenticationSchemes = "MultiAuthSchemes")]
    public async Task<ActionResult<ValidateTokenResponse>> ValidateToken()
    {
        // Token already validated by middleware
        // Just extract user info and return

        var token = GetTokenFromHeader();
        var provider = _tokenValidationService.GetProviderFromToken(token);
        var result = await _tokenValidationService.ValidateTokenAsync(token, provider);

        return Ok(new ValidateTokenResponse {
            IsValid = result.IsValid,
            User = new UserInfo {
                UserId = result.UserId,
                Email = result.Email,
                Name = result.Name,
                Provider = result.Provider
            }
        });
    }

    // 2. Get user info (requires authentication)
    [HttpGet("user")]
    [Authorize(AuthenticationSchemes = "MultiAuthSchemes")]
    public ActionResult<UserInfo> GetCurrentUser()
    {
        // Access claims from authenticated user
        var userId = User.FindFirst("sub")?.Value;
        var email = User.FindFirst("email")?.Value;
        var name = User.FindFirst("name")?.Value;

        return Ok(new UserInfo {
            UserId = userId,
            Email = email,
            Name = name
        });
    }

    // 3. Validate external token (no authentication required)
    [HttpPost("validate-external")]
    public async Task<ActionResult<ValidateTokenResponse>> ValidateExternalToken(
        [FromBody] ValidateTokenRequest request)
    {
        var provider = string.IsNullOrEmpty(request.Provider)
            ? _tokenValidationService.GetProviderFromToken(request.Token)
            : request.Provider;

        var result = await _tokenValidationService
            .ValidateTokenAsync(request.Token, provider);

        return Ok(new ValidateTokenResponse {
            IsValid = result.IsValid,
            User = result.IsValid ? new UserInfo { /*...*/ } : null,
            Error = result.Error
        });
    }

    // 4. Health check (no authentication required)
    [HttpGet("health")]
    public ActionResult<object> HealthCheck()
    {
        return Ok(new {
            status = "healthy",
            timestamp = DateTime.UtcNow,
            supportedProviders = new[] { "Azure", "Okta", "Auth0" }
        });
    }
}
```

**[Authorize] Attribute Explained**:
```csharp
[Authorize(AuthenticationSchemes = "MultiAuthSchemes")]
```

This tells ASP.NET Core:
1. Require authentication for this endpoint
2. Use "MultiAuthSchemes" to validate
3. Return 401 Unauthorized if token invalid
4. Populate `User` property with claims if valid

---

## Authentication Flow

### Complete Flow Diagram

```
┌────────┐                 ┌─────────┐                 ┌─────────┐                 ┌─────────┐
│ User   │                 │ Angular │                 │  SSO    │                 │  .NET   │
│        │                 │   App   │                 │ Provider│                 │   API   │
└───┬────┘                 └────┬────┘                 └────┬────┘                 └────┬────┘
    │                           │                           │                           │
    │ 1. Navigate to app        │                           │                           │
    │ ──────────────────────────>│                           │                           │
    │                           │                           │                           │
    │                           │ 2. Check for auth         │                           │
    │                           │    (localStorage)         │                           │
    │                           │                           │                           │
    │ 3. Show login page        │                           │                           │
    │ <──────────────────────────│                           │                           │
    │                           │                           │                           │
    │ 4. Click "Sign in with    │                           │                           │
    │    Azure AD"              │                           │                           │
    │ ──────────────────────────>│                           │                           │
    │                           │                           │                           │
    │                           │ 5. Redirect to Azure      │                           │
    │                           │    login page             │                           │
    │                           │ ──────────────────────────>│                           │
    │                           │                           │                           │
    │                           │ 6. Show login form        │                           │
    │ <──────────────────────────────────────────────────────│                           │
    │                           │                           │                           │
    │ 7. Enter credentials      │                           │                           │
    │ ──────────────────────────────────────────────────────>│                           │
    │                           │                           │                           │
    │                           │                           │ 8. Validate credentials   │
    │                           │                           │    and create tokens      │
    │                           │                           │                           │
    │                           │ 9. Redirect with code     │                           │
    │ <──────────────────────────────────────────────────────│                           │
    │                           │                           │                           │
    │                           │ 10. Exchange code for     │                           │
    │                           │     tokens                │                           │
    │                           │ ──────────────────────────>│                           │
    │                           │                           │                           │
    │                           │ 11. Return access_token,  │                           │
    │                           │     id_token              │                           │
    │                           │ <──────────────────────────│                           │
    │                           │                           │                           │
    │                           │ 12. Store tokens in       │                           │
    │                           │     localStorage          │                           │
    │                           │                           │                           │
    │ 13. Show home page        │                           │                           │
    │ <──────────────────────────│                           │                           │
    │                           │                           │                           │
    │ 14. Click "Test API       │                           │                           │
    │     Connection"           │                           │                           │
    │ ──────────────────────────>│                           │                           │
    │                           │                           │                           │
    │                           │ 15. GET /api/auth/validate│                           │
    │                           │    Authorization: Bearer  │                           │
    │                           │    eyJ...                 │                           │
    │                           │ ──────────────────────────────────────────────────────>│
    │                           │                           │                           │
    │                           │                           │                           │ 16. Extract token
    │                           │                           │                           │     from header
    │                           │                           │                           │
    │                           │                           │                           │ 17. Detect provider
    │                           │                           │                           │     from issuer
    │                           │                           │                           │
    │                           │                           │ 18. Fetch JWKS            │
    │                           │                           │ <─────────────────────────│
    │                           │                           │                           │
    │                           │                           │ 19. Return public keys    │
    │                           │                           │ ──────────────────────────>│
    │                           │                           │                           │
    │                           │                           │                           │ 20. Validate signature
    │                           │                           │                           │     expiration, etc.
    │                           │                           │                           │
    │                           │ 21. Return user info      │                           │
    │                           │ <──────────────────────────────────────────────────────│
    │                           │    {                      │                           │
    │                           │      "isValid": true,     │                           │
    │                           │      "user": {...}        │                           │
    │                           │    }                      │                           │
    │                           │                           │                           │
    │ 22. Display success       │                           │                           │
    │ <──────────────────────────│                           │                           │
    │                           │                           │                           │
```

### Step-by-Step Breakdown

#### Phase 1: Initial Login

**Step 1-3: App Initialization**
```typescript
// Angular checks localStorage for existing session
ngOnInit() {
  const storedUser = localStorage.getItem('currentUser');
  if (storedUser) {
    // User already logged in, navigate to home
    this.router.navigate(['/home']);
  } else {
    // Show login page
  }
}
```

**Step 4-5: Login Initiation**
```typescript
// User clicks "Sign in with Azure AD"
async loginWith(provider: SsoProvider) {
  await this.authService.login(provider);
  // This redirects browser to:
  // https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize?
  //   client_id=xxx&
  //   response_type=code&
  //   redirect_uri=http://localhost:4200&
  //   scope=openid profile email&
  //   code_challenge=xxx
}
```

**Step 6-8: User Authentication at Provider**
- Provider shows login form
- User enters credentials
- Provider validates credentials
- Provider shows consent screen (first time only)
- User grants permissions

**Step 9-11: Token Exchange**
```typescript
// Browser redirected to: http://localhost:4200?code=AUTH_CODE

// Angular detects callback
async handleCallback() {
  // SDK automatically exchanges code for tokens
  const response = await this.msalInstance.handleRedirectPromise();

  // Tokens received:
  // - access_token: Used for API calls
  // - id_token: Contains user identity
  // - refresh_token: Get new access tokens
}
```

#### Phase 2: API Communication

**Step 14-15: Making API Request**
```typescript
// Component makes HTTP request
testApiConnection() {
  this.http.get(`${environment.apiUrl}/auth/validate`).subscribe();
}

// HTTP Interceptor adds token automatically
intercept(request: HttpRequest<any>, next: HttpHandler) {
  const token = await this.authService.getAccessToken();

  request = request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next.handle(request);
}
```

**Step 16-20: Backend Validation**
```csharp
// Request arrives at backend
[HttpGet("validate")]
[Authorize(AuthenticationSchemes = "MultiAuthSchemes")]
public async Task<ActionResult> ValidateToken()
{
    // Middleware has already:
    // 1. Extracted token from Authorization header
    // 2. Detected provider (Azure/Okta/Auth0)
    // 3. Fetched provider's public keys
    // 4. Validated signature
    // 5. Checked expiration
    // 6. Populated User claims

    // We can now safely access user info
    var userId = User.FindFirst("sub")?.Value;
    var email = User.FindFirst("email")?.Value;

    return Ok(new { isValid = true, userId, email });
}
```

**Step 21-22: Display Results**
```typescript
// Angular receives response
this.http.get('/api/auth/validate').subscribe(
  response => {
    this.apiResponse = response;
    // Display success message
  },
  error => {
    this.error = 'API validation failed';
  }
);
```

---

## Token Management

### Token Storage

**Where tokens are stored**:
```typescript
// Frontend (Angular)
localStorage.setItem('accessToken', token);
localStorage.setItem('ssoProvider', 'azure');
localStorage.setItem('currentUser', JSON.stringify(user));
```

**Security considerations**:
- ✓ localStorage persists across browser restarts
- ✓ Accessible only to same origin
- ✗ Vulnerable to XSS (Cross-Site Scripting)
- ✗ Not accessible to httpOnly cookies

**Best practices**:
1. Always use HTTPS in production
2. Implement Content Security Policy (CSP)
3. Sanitize user input to prevent XSS
4. Consider using httpOnly cookies for sensitive apps

### Token Lifecycle

```
Token Creation (at Provider)
  │
  ├─> Created with expiration (e.g., 1 hour)
  │
  ├─> Signed with provider's private key
  │
  └─> Sent to application
        │
        ├─> Stored in localStorage
        │
        ├─> Used for API calls
        │     │
        │     ├─> Backend validates each time
        │     └─> Checks expiration
        │
        ├─> Token expires
        │     │
        │     └─> Two options:
        │           ├─> 1. Use refresh token to get new access token
        │           └─> 2. Re-authenticate user
        │
        └─> User logs out
              │
              └─> Token removed from storage
```

### Token Refresh

**Azure AD (MSAL)**:
```typescript
async getAccessToken(): Promise<string> {
  const account = this.msalInstance.getAllAccounts()[0];

  try {
    // Try to get token silently (from cache or refresh)
    const response = await this.msalInstance.acquireTokenSilent({
      scopes: ['openid', 'profile', 'email'],
      account: account
    });
    return response.accessToken;
  } catch (error) {
    // Token expired and refresh failed, need to re-authenticate
    await this.msalInstance.loginRedirect();
  }
}
```

**Okta**:
```typescript
async getAccessToken(): Promise<string> {
  const tokenResponse = await this.oktaAuth.tokenManager.get('accessToken');

  if (this.oktaAuth.tokenManager.hasExpired(tokenResponse)) {
    // Token expired, renew it
    await this.oktaAuth.tokenManager.renew('accessToken');
    return (await this.oktaAuth.tokenManager.get('accessToken')).accessToken;
  }

  return tokenResponse.accessToken;
}
```

**Auth0**:
```typescript
async getAccessToken(): Promise<string> {
  // Auth0 SDK handles refresh automatically
  return await this.auth0Client.getTokenSilently({
    cacheMode: 'on' // Use cached token if valid
  });
}
```

---

## Security Considerations

### 1. HTTPS in Production

**Why it matters**:
- Tokens transmitted over HTTP can be intercepted
- Man-in-the-middle attacks possible
- Provider callbacks rejected if not HTTPS

**Implementation**:
```csharp
// Force HTTPS redirect
app.UseHttpsRedirection();

// In production environment
if (app.Environment.IsProduction())
{
    app.UseHsts(); // HTTP Strict Transport Security
}
```

### 2. CORS Configuration

**Current configuration**:
```csharp
builder.Services.AddCors(options => {
    options.AddPolicy("AllowAngularApp", builder => {
        builder.WithOrigins("http://localhost:4200") // Specific origin
               .AllowAnyMethod()
               .AllowAnyHeader()
               .AllowCredentials();
    });
});
```

**Production configuration**:
```csharp
builder.Services.AddCors(options => {
    options.AddPolicy("Production", builder => {
        builder.WithOrigins("https://your-production-domain.com")
               .WithMethods("GET", "POST") // Only needed methods
               .WithHeaders("Authorization", "Content-Type") // Only needed headers
               .AllowCredentials();
    });
});
```

### 3. Token Validation

**What we validate**:
```csharp
new TokenValidationParameters {
    ValidateIssuer = true,           // Check token is from correct provider
    ValidateAudience = true,         // Check token is for our app
    ValidateLifetime = true,         // Check token hasn't expired
    ValidateIssuerSigningKey = true, // Verify signature
    ClockSkew = TimeSpan.FromMinutes(5) // Allow 5 min clock difference
}
```

**Why each validation matters**:
- **Issuer**: Prevents tokens from other providers
- **Audience**: Prevents tokens meant for other apps
- **Lifetime**: Prevents use of expired tokens
- **Signature**: Ensures token hasn't been tampered with

### 4. XSS Prevention

**Angular's built-in protection**:
```typescript
// Angular automatically sanitizes
<div>{{userInput}}</div> // XSS protected

// Manual sanitization when needed
import { DomSanitizer } from '@angular/platform-browser';

constructor(private sanitizer: DomSanitizer) {}

safeHtml = this.sanitizer.sanitize(SecurityContext.HTML, userInput);
```

**Best practices**:
- Never use `innerHTML` with user input
- Always sanitize data from external sources
- Use Angular's built-in protections

### 5. CSRF Protection

**Not needed for this app because**:
- We use JWT tokens (not cookies)
- Tokens sent in Authorization header (not automatically like cookies)
- Angular doesn't automatically send tokens

**If using cookies**:
```csharp
// Would need CSRF protection
builder.Services.AddAntiforgery(options => {
    options.HeaderName = "X-CSRF-TOKEN";
});
```

### 6. Content Security Policy

**Add to index.html**:
```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self';
               script-src 'self' 'unsafe-inline';
               style-src 'self' 'unsafe-inline';
               connect-src 'self' https://login.microsoftonline.com https://*.okta.com https://*.auth0.com;">
```

---

## Component Deep Dive

### Frontend Components

#### Login Component

**Template** (`login.component.html`):
```html
<div class="container">
  <div class="card">
    <!-- Loading state -->
    <div *ngIf="loading" class="loading">
      <p>Authenticating...</p>
    </div>

    <!-- Error state -->
    <div *ngIf="error" class="error">
      {{ error }}
    </div>

    <!-- Login buttons -->
    <div *ngIf="!loading">
      <button (click)="loginWith(SsoProvider.Azure)">
        Sign in with Azure AD
      </button>

      <button (click)="loginWith(SsoProvider.Okta)">
        Sign in with Okta
      </button>

      <button (click)="loginWith(SsoProvider.Auth0)">
        Sign in with Auth0
      </button>
    </div>
  </div>
</div>
```

**Component Logic** (`login.component.ts`):
```typescript
export class LoginComponent implements OnInit {
  loading = false;
  error = '';
  SsoProvider = SsoProvider; // Make enum available in template

  async ngOnInit() {
    // Check if returning from OAuth callback
    if (window.location.search.includes('code=') ||
        window.location.hash.includes('access_token')) {
      this.loading = true;
      try {
        await this.authService.handleCallback();
        // User redirected to home by auth service
      } catch (error) {
        this.error = 'Authentication failed';
      }
      this.loading = false;
    }
  }

  async loginWith(provider: SsoProvider) {
    this.loading = true;
    this.error = '';

    try {
      await this.authService.login(provider);
      // Browser redirects, component destroyed
    } catch (error) {
      this.error = `Failed to login with ${provider}`;
      this.loading = false;
    }
  }
}
```

#### Home Component

**Template** (`home.component.html`):
```html
<div class="container">
  <div class="card">
    <!-- User info section -->
    <div *ngIf="currentUser">
      <h2>User Information</h2>
      <div>Name: {{ currentUser.name }}</div>
      <div>Email: {{ currentUser.email }}</div>
      <div>Provider: {{ currentUser.provider }}</div>
    </div>

    <!-- API test section -->
    <button (click)="testApiConnection()" [disabled]="loading">
      {{ loading ? 'Testing...' : 'Test API Connection' }}
    </button>

    <div *ngIf="apiResponse">
      <pre>{{ apiResponse | json }}</pre>
    </div>

    <!-- Logout button -->
    <button (click)="logout()">Logout</button>
  </div>
</div>
```

**Component Logic** (`home.component.ts`):
```typescript
export class HomeComponent implements OnInit {
  currentUser: User | null = null;
  apiResponse: any = null;
  loading = false;

  ngOnInit() {
    // Subscribe to user changes
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
    });
  }

  async testApiConnection() {
    this.loading = true;
    try {
      // HTTP interceptor adds token automatically
      const response = await this.http
        .get(`${environment.apiUrl}/auth/validate`)
        .toPromise();
      this.apiResponse = response;
    } catch (error) {
      this.error = 'API call failed';
    }
    this.loading = false;
  }

  async logout() {
    await this.authService.logout();
    // User redirected to login by auth service
  }
}
```

### Backend Components

#### Token Validation Deep Dive

**JWT Validation Process**:
```csharp
public async Task<TokenValidationResult> ValidateTokenAsync(string token, string provider)
{
    try {
        // 1. Get provider-specific validation parameters
        var parameters = GetValidationParameters(provider);

        // 2. Validate token
        //    This checks:
        //    - Signature (using public key from JWKS)
        //    - Expiration (exp claim)
        //    - Not before (nbf claim)
        //    - Issuer (iss claim)
        //    - Audience (aud claim)
        var principal = _tokenHandler.ValidateToken(
            token,
            parameters,
            out var validatedToken
        );

        // 3. Token is valid, extract claims
        var claims = principal.Claims.ToDictionary(
            c => c.Type,
            c => c.Value
        );

        return new TokenValidationResult {
            IsValid = true,
            UserId = claims.GetValueOrDefault("sub"),
            Email = claims.GetValueOrDefault("email"),
            Name = claims.GetValueOrDefault("name"),
            Provider = provider,
            Claims = claims
        };
    }
    catch (SecurityTokenExpiredException ex) {
        return new TokenValidationResult {
            IsValid = false,
            Error = "Token has expired"
        };
    }
    catch (SecurityTokenInvalidSignatureException ex) {
        return new TokenValidationResult {
            IsValid = false,
            Error = "Invalid token signature"
        };
    }
    catch (Exception ex) {
        return new TokenValidationResult {
            IsValid = false,
            Error = ex.Message
        };
    }
}
```

**JWKS Key Resolution**:
```csharp
IssuerSigningKeyResolver = (token, securityToken, kid, parameters) =>
{
    // 1. Build JWKS endpoint URL
    var jwksUrl = $"https://login.microsoftonline.com/{tenantId}/discovery/v2.0/keys";

    // 2. Fetch keys (cached by framework)
    var httpClient = new HttpClient();
    var jwksJson = await httpClient.GetStringAsync(jwksUrl);

    // 3. Parse JSON Web Key Set
    var keySet = new JsonWebKeySet(jwksJson);

    // 4. Return all keys (framework picks matching kid)
    return keySet.Keys;
}
```

**Example JWKS Response**:
```json
{
  "keys": [
    {
      "kty": "RSA",
      "use": "sig",
      "kid": "key-2024-01",
      "n": "0vx7agoebGcQSuuPiLJXZptN9nndrQmbXEps2aiAFb...",
      "e": "AQAB"
    },
    {
      "kty": "RSA",
      "use": "sig",
      "kid": "key-2024-02",
      "n": "xjlCRBqkqXJzx6oXQ3p2Qdn9tZ8jMCqUgdjBdCBBYk...",
      "e": "AQAB"
    }
  ]
}
```

---

## Advanced Topics

### 1. Role-Based Access Control (RBAC)

**Add roles to tokens**:

Providers can include roles in tokens:
```json
{
  "sub": "user-123",
  "email": "user@example.com",
  "roles": ["admin", "user"]
}
```

**Backend authorization**:
```csharp
[HttpGet("admin")]
[Authorize(Roles = "admin")]
public ActionResult AdminOnly()
{
    return Ok("Admin content");
}
```

**Frontend role checking**:
```typescript
export class RoleGuard implements CanActivate {
  canActivate(route: ActivatedRouteSnapshot): boolean {
    const requiredRole = route.data['role'];
    const userRoles = this.authService.currentUserValue?.roles || [];

    return userRoles.includes(requiredRole);
  }
}

// Usage
{
  path: 'admin',
  component: AdminComponent,
  canActivate: [AuthGuard, RoleGuard],
  data: { role: 'admin' }
}
```

### 2. Token Refresh Strategies

**Strategy 1: Proactive Refresh**
```typescript
// Refresh token before expiration
setInterval(async () => {
  const token = await this.getAccessToken();
  const decoded = jwt_decode(token);
  const expiresIn = decoded.exp * 1000 - Date.now();

  // Refresh if less than 5 minutes remaining
  if (expiresIn < 5 * 60 * 1000) {
    await this.refreshToken();
  }
}, 60000); // Check every minute
```

**Strategy 2: On-Demand Refresh**
```typescript
// Refresh only when API call fails
intercept(req: HttpRequest<any>, next: HttpHandler) {
  return next.handle(req).pipe(
    catchError(error => {
      if (error.status === 401) {
        // Token expired, refresh and retry
        return from(this.authService.refreshToken()).pipe(
          switchMap(() => {
            // Retry original request with new token
            const newReq = this.addToken(req);
            return next.handle(newReq);
          })
        );
      }
      return throwError(error);
    })
  );
}
```

### 3. Multi-Tenancy

**Support multiple tenants**:
```typescript
// Environment configuration
export const environment = {
  tenants: {
    'tenant1': {
      azure: { clientId: 'xxx', tenantId: 'yyy' }
    },
    'tenant2': {
      azure: { clientId: 'aaa', tenantId: 'bbb' }
    }
  }
};

// Tenant selection
selectTenant(tenantId: string) {
  const config = environment.tenants[tenantId];
  this.initializeMsal(config.azure);
}
```

### 4. Offline Support

**Store tokens for offline use**:
```typescript
// Service worker caching
self.addEventListener('fetch', event => {
  if (event.request.headers.has('Authorization')) {
    // Cache API responses
    event.respondWith(
      caches.match(event.request)
        .then(response => response || fetch(event.request))
    );
  }
});
```

### 5. Session Management

**Track active sessions**:
```csharp
public class SessionService
{
    private readonly Dictionary<string, Session> _sessions = new();

    public void CreateSession(string userId, string token)
    {
        _sessions[userId] = new Session {
            UserId = userId,
            Token = token,
            CreatedAt = DateTime.UtcNow,
            LastActivity = DateTime.UtcNow
        };
    }

    public void InvalidateSession(string userId)
    {
        _sessions.Remove(userId);
    }

    public bool IsSessionValid(string userId)
    {
        if (!_sessions.ContainsKey(userId))
            return false;

        var session = _sessions[userId];
        var timeout = TimeSpan.FromHours(24);

        return DateTime.UtcNow - session.LastActivity < timeout;
    }
}
```

---

## Conclusion

This technical guide covered:

1. **Architecture**: How frontend and backend communicate
2. **OAuth 2.0/OIDC**: The protocols that power SSO
3. **Frontend**: Angular services, guards, and interceptors
4. **Backend**: Multi-scheme authentication and token validation
5. **Security**: Best practices for token handling
6. **Advanced**: RBAC, refresh strategies, and more

### Key Takeaways

- SSO delegates authentication to trusted providers
- JWT tokens are self-contained and signed
- Public key cryptography enables distributed validation
- Frontend handles OAuth flow, backend validates tokens
- Security requires HTTPS, validation, and proper token storage

### Next Steps for Learners

1. **Experiment**: Try different providers and configurations
2. **Debug**: Use browser DevTools and backend logs
3. **Extend**: Add features like profile management
4. **Deploy**: Learn about production configurations
5. **Read Specs**: Study OAuth 2.0 RFC and OIDC specifications

### Resources

- OAuth 2.0: https://oauth.net/2/
- OpenID Connect: https://openid.net/connect/
- JWT: https://jwt.io/
- Angular Security: https://angular.io/guide/security
- ASP.NET Core Security: https://docs.microsoft.com/aspnet/core/security/

Happy learning!
