# Component Reference Guide

A comprehensive listing of all components, services, and files in the SSO application.

## Table of Contents
- [Frontend Components](#frontend-components)
- [Backend Components](#backend-components)
- [Configuration Files](#configuration-files)
- [Scripts and Utilities](#scripts-and-utilities)

---

## Frontend Components

### Angular Application Structure

```
frontend/src/app/
├── components/           # UI Components
├── services/            # Business logic and API communication
├── guards/              # Route protection
├── interceptors/        # HTTP request/response handling
├── models/              # TypeScript interfaces and types
├── app.module.ts        # Main application module
├── app.component.ts     # Root component
└── app-routing.module.ts # Routing configuration
```

### Components

#### 1. Login Component
**Location**: `frontend/src/app/components/login/`

**Files**:
- `login.component.ts` - Component logic (116 lines)
- `login.component.html` - Template with provider selection UI (52 lines)
- `login.component.css` - Component-specific styles (10 lines)

**Purpose**: Provides SSO provider selection and handles OAuth callbacks

**Key Methods**:
```typescript
ngOnInit()                              // Handle OAuth callback on component load
loginWith(provider: SsoProvider)        // Initiate login with selected provider
```

**Features**:
- Three SSO provider buttons (Azure AD, Okta, Auth0)
- Loading state during authentication
- Error handling and display
- OAuth callback handling
- Automatic redirect after successful login

**Dependencies**:
- `AuthService` - Authentication orchestration
- `Router` - Navigation
- `ActivatedRoute` - Route parameter access

---

#### 2. Home Component
**Location**: `frontend/src/app/components/home/`

**Files**:
- `home.component.ts` - Component logic (68 lines)
- `home.component.html` - Dashboard UI (70 lines)
- `home.component.css` - Styles (12 lines)

**Purpose**: Protected dashboard showing user info and API testing

**Key Methods**:
```typescript
ngOnInit()                   // Initialize component and subscribe to user changes
testApiConnection()          // Test API with token validation
logout()                     // Log out current user
getProviderDisplayName()     // Format provider name for display
```

**Features**:
- Display user information (name, email, ID, provider)
- API connection testing
- Response display (formatted JSON)
- Error handling
- Logout functionality
- Features list

**Dependencies**:
- `AuthService` - User state and logout
- `HttpClient` - API communication
- `User` model - Type safety

---

### Services

#### 1. Auth Service (Main Orchestrator)
**Location**: `frontend/src/app/services/auth.service.ts` (142 lines)

**Purpose**: Central authentication service that orchestrates all SSO providers

**Key Properties**:
```typescript
currentUserSubject: BehaviorSubject<User | null>    // Internal state
currentUser: Observable<User | null>                // Public observable
currentUserValue: User | null                       // Getter for current value
currentProvider: SsoProvider | null                 // Active provider
```

**Key Methods**:
```typescript
login(provider: SsoProvider): Promise<void>
  // Initiates login flow with specified provider
  // Delegates to provider-specific service
  // Stores provider choice in localStorage

handleCallback(): Promise<void>
  // Handles OAuth redirect callback
  // Exchanges code for tokens
  // Extracts user information
  // Updates application state
  // Navigates to home page

logout(): Promise<void>
  // Clears local storage
  // Calls provider-specific logout
  // Resets user state
  // Redirects to login page

getAccessToken(): Promise<string | null>
  // Retrieves current access token
  // Delegates to provider-specific service
  // Handles token refresh if needed

isAuthenticated(): boolean
  // Returns true if user is logged in
  // Checks currentUserValue
```

**State Management**:
- Uses RxJS `BehaviorSubject` for reactive state
- Persists to localStorage for session continuity
- Emits updates to all subscribers automatically

**Provider Routing**:
```typescript
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
```

---

#### 2. Azure Auth Service
**Location**: `frontend/src/app/services/azure-auth.service.ts` (98 lines)

**Purpose**: Handles Azure AD (Microsoft Entra ID) authentication using MSAL

**Dependencies**:
- `@azure/msal-browser` - Microsoft Authentication Library

**Configuration**:
```typescript
{
  auth: {
    clientId: environment.azure.clientId,
    authority: environment.azure.authority,
    redirectUri: environment.azure.redirectUri
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false
  }
}
```

**Key Methods**:
```typescript
login(): Promise<void>
  // Initiates redirect to Azure AD
  // Requests scopes: openid, profile, email, User.Read

handleCallback(): Promise<User | null>
  // Processes redirect from Azure AD
  // Handles both new logins and existing sessions
  // Extracts account information
  // Returns User object with Azure-specific claims

logout(): Promise<void>
  // Logs out from Azure AD
  // Clears MSAL cache
  // Redirects to Azure logout endpoint

getAccessToken(): Promise<string | null>
  // Gets token from cache or refreshes
  // Uses acquireTokenSilent for seamless renewal
  // Falls back to interactive login if needed
```

**Azure-Specific Claims**:
- `localAccountId` → User ID
- `username` → Email
- `name` → Display name

---

#### 3. Okta Auth Service
**Location**: `frontend/src/app/services/okta-auth.service.ts` (85 lines)

**Purpose**: Handles Okta authentication using Okta Auth JS SDK

**Dependencies**:
- `@okta/okta-auth-js` - Okta Authentication SDK

**Configuration**:
```typescript
{
  clientId: environment.okta.clientId,
  issuer: environment.okta.issuer,
  redirectUri: environment.okta.redirectUri,
  scopes: environment.okta.scopes,
  pkce: true,
  tokenManager: {
    storage: 'localStorage'
  }
}
```

**Key Methods**:
```typescript
login(): Promise<void>
  // Redirects to Okta login page
  // Uses PKCE flow for security
  // Preserves original URI for post-login redirect

handleCallback(): Promise<User | null>
  // Checks if current request is login redirect
  // Processes login redirect
  // Fetches user info from /userinfo endpoint
  // Extracts and stores access token

logout(): Promise<void>
  // Calls Okta signOut
  // Clears token manager
  // Redirects to post-logout URI

getAccessToken(): Promise<string | null>
  // Retrieves token from token manager
  // Returns cached token if valid
  // Token manager handles refresh automatically
```

**Okta-Specific Features**:
- PKCE (Proof Key for Code Exchange) enabled by default
- Token Manager for automatic refresh
- UserInfo endpoint integration

---

#### 4. Auth0 Auth Service
**Location**: `frontend/src/app/services/auth0-auth.service.ts` (112 lines)

**Purpose**: Handles Auth0 authentication using Auth0 SPA JS SDK

**Dependencies**:
- `@auth0/auth0-spa-js` - Auth0 Single Page Application SDK

**Configuration**:
```typescript
{
  domain: environment.auth0.domain,
  clientId: environment.auth0.clientId,
  authorizationParams: {
    redirect_uri: environment.auth0.redirectUri,
    audience: environment.auth0.audience
  },
  cacheLocation: 'localstorage',
  useRefreshTokens: true
}
```

**Key Methods**:
```typescript
initAuth0(): Promise<void>
  // Dynamically imports Auth0 SDK
  // Creates Auth0 client with configuration
  // Called on service initialization

login(): Promise<void>
  // Redirects to Auth0 Universal Login
  // Passes app state for post-login navigation
  // Uses redirect flow (not popup)

handleCallback(): Promise<User | null>
  // Detects OAuth callback (code and state params)
  // Exchanges code for tokens
  // Cleans up URL (removes query params)
  // Gets user from /userinfo
  // Stores access token

logout(): Promise<void>
  // Calls Auth0 logout
  // Redirects to returnTo URL
  // Clears Auth0 cache

getAccessToken(): Promise<string | null>
  // Gets token silently (from cache or refresh)
  // Auth0 SDK handles refresh tokens automatically
  // Returns valid access token
```

**Auth0-Specific Features**:
- Universal Login page
- Automatic refresh token rotation
- Audience parameter for API access
- Dynamic SDK loading to reduce bundle size

---

### Guards

#### Auth Guard
**Location**: `frontend/src/app/guards/auth.guard.ts` (27 lines)

**Purpose**: Protects routes from unauthorized access

**Interface**: Implements `CanActivate`

**Logic**:
```typescript
canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean
  1. Check if user is logged in (currentUserValue)
  2. If logged in, return true (allow access)
  3. If not logged in:
     - Save intended URL as returnUrl
     - Redirect to login page
     - Return false (block access)
```

**Usage in Routes**:
```typescript
{
  path: 'home',
  component: HomeComponent,
  canActivate: [AuthGuard]  // Applied here
}
```

**Flow**:
```
User navigates to /home
  ↓
Angular router calls canActivate()
  ↓
Guard checks authentication
  ↓
┌─────────────────┬─────────────────┐
│ Authenticated   │ Not Authenticated│
│ return true     │ return false     │
│ Allow access    │ Redirect /login  │
└─────────────────┴─────────────────┘
```

---

### Interceptors

#### Auth Interceptor
**Location**: `frontend/src/app/interceptors/auth.interceptor.ts` (28 lines)

**Purpose**: Automatically adds JWT token to all outgoing HTTP requests

**Interface**: Implements `HttpInterceptor`

**Logic**:
```typescript
intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>>
  1. Get access token from AuthService
  2. If token exists:
     - Clone request
     - Add Authorization header: "Bearer {token}"
  3. Pass modified request to next handler
  4. Return observable for response
```

**Request Transformation**:
```
Original Request:
GET /api/auth/validate
Headers: {
  Content-Type: application/json
}

After Interceptor:
GET /api/auth/validate
Headers: {
  Content-Type: application/json,
  Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
}
```

**Registration**:
```typescript
// app.module.ts
providers: [
  {
    provide: HTTP_INTERCEPTORS,
    useClass: AuthInterceptor,
    multi: true  // Allows multiple interceptors
  }
]
```

**Why Async?**:
- Token retrieval may require refresh
- Uses RxJS operators for async handling
- `from()` converts Promise to Observable
- `switchMap()` chains token retrieval with request

---

### Models

#### User Model
**Location**: `frontend/src/app/models/user.model.ts` (19 lines)

**Interfaces**:

```typescript
export interface User {
  id: string;              // Unique user identifier (sub claim)
  email: string;           // User's email address
  name: string;            // User's display name
  provider: SsoProvider;   // Which SSO provider was used
  roles?: string[];        // Optional: user roles for RBAC
}

export enum SsoProvider {
  Azure = 'azure',
  Okta = 'okta',
  Auth0 = 'auth0'
}

export interface AuthToken {
  accessToken: string;     // JWT access token
  idToken?: string;        // OIDC ID token (optional)
  expiresAt: number;       // Unix timestamp of expiration
  provider: SsoProvider;   // Token provider
}
```

**Usage**:
- Type safety across the application
- IntelliSense support in IDE
- Runtime enum values for provider selection

---

### Module Configuration

#### App Module
**Location**: `frontend/src/app/app.module.ts` (36 lines)

**Imports**:
```typescript
BrowserModule           // Core Angular platform
AppRoutingModule        // Application routes
HttpClientModule        // HTTP client for API calls
FormsModule            // Template-driven forms
```

**Declarations**:
```typescript
AppComponent           // Root component
LoginComponent         // Login page
HomeComponent         // Dashboard page
```

**Providers**:
```typescript
{
  provide: HTTP_INTERCEPTORS,
  useClass: AuthInterceptor,
  multi: true
}
```

**Bootstrap**:
```typescript
AppComponent  // Entry component
```

---

#### App Routing Module
**Location**: `frontend/src/app/app-routing.module.ts` (21 lines)

**Routes**:
```typescript
const routes: Routes = [
  // Redirect root to home
  { path: '', redirectTo: '/home', pathMatch: 'full' },

  // Login route (public)
  { path: 'login', component: LoginComponent },

  // OAuth callback route (public)
  { path: 'login/callback', component: LoginComponent },

  // Home route (protected)
  {
    path: 'home',
    component: HomeComponent,
    canActivate: [AuthGuard]
  },

  // Catch-all redirect
  { path: '**', redirectTo: '/home' }
];
```

---

## Backend Components

### ASP.NET Core API Structure

```
backend/
├── Controllers/         # API endpoints
├── Services/           # Business logic
├── Models/             # Data transfer objects
├── Properties/         # Launch settings
├── Program.cs          # Application entry point
├── appsettings.json    # Configuration
└── SsoApi.csproj      # Project definition
```

### Controllers

#### Auth Controller
**Location**: `backend/Controllers/AuthController.cs` (172 lines)

**Route**: `/api/auth`

**Dependencies**:
- `ITokenValidationService` - Token validation logic
- `ILogger<AuthController>` - Logging

**Endpoints**:

##### 1. Validate Token
```csharp
[HttpGet("validate")]
[Authorize(AuthenticationSchemes = "MultiAuthSchemes")]
```

**Purpose**: Validate JWT token and return user info

**Flow**:
1. Extract token from Authorization header
2. Detect provider from token issuer
3. Validate token using provider-specific parameters
4. Return validation result with user info

**Response**:
```json
{
  "isValid": true,
  "message": "Token is valid",
  "user": {
    "userId": "user-123",
    "email": "user@example.com",
    "name": "John Doe",
    "provider": "azure",
    "claims": { ... }
  }
}
```

##### 2. Get Current User
```csharp
[HttpGet("user")]
[Authorize(AuthenticationSchemes = "MultiAuthSchemes")]
```

**Purpose**: Get current authenticated user's information

**Flow**:
1. Access User.Claims (populated by authentication middleware)
2. Extract relevant claims (sub, email, name)
3. Return user info

**Response**:
```json
{
  "userId": "user-123",
  "email": "user@example.com",
  "name": "John Doe",
  "provider": "azure",
  "claims": { ... }
}
```

##### 3. Validate External Token
```csharp
[HttpPost("validate-external")]
```

**Purpose**: Validate a token from external source (no auth required)

**Request**:
```json
{
  "token": "eyJ...",
  "provider": "azure"  // optional
}
```

**Flow**:
1. Receive token and optional provider
2. Auto-detect provider if not specified
3. Validate token
4. Return result

**Use Case**: Third-party integrations, testing, token inspection

##### 4. Health Check
```csharp
[HttpGet("health")]
```

**Purpose**: API health check endpoint

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:30:00Z",
  "supportedProviders": ["Azure", "Okta", "Auth0"]
}
```

**Helper Methods**:
```csharp
private string? GetTokenFromHeader()
  // Extracts token from Authorization header
  // Removes "Bearer " prefix
  // Returns null if no header present
```

---

### Services

#### Token Validation Service
**Location**: `backend/Services/TokenValidationService.cs` (164 lines)

**Purpose**: Core token validation and provider detection logic

**Dependencies**:
- `IConfiguration` - Access to appsettings.json
- `JwtSecurityTokenHandler` - JWT parsing and validation

**Key Methods**:

##### 1. Get Provider From Token
```csharp
public string GetProviderFromToken(string token)
```

**Purpose**: Auto-detect SSO provider from token issuer

**Logic**:
```csharp
Read JWT without validation
  ↓
Extract issuer claim
  ↓
Match issuer pattern:
  ├─ Contains "microsoftonline.com" → Azure
  ├─ Contains "okta.com" → Okta
  ├─ Contains "auth0.com" → Auth0
  └─ Default → Azure
```

**Examples**:
- `https://login.microsoftonline.com/xxx/v2.0` → Azure
- `https://dev-12345.okta.com/oauth2/default` → Okta
- `https://your-app.auth0.com/` → Auth0

##### 2. Validate Token Async
```csharp
public async Task<TokenValidationResult> ValidateTokenAsync(string token, string provider)
```

**Purpose**: Validate JWT token with provider-specific parameters

**Process**:
```
1. Get validation parameters for provider
   ├─ Azure parameters
   ├─ Okta parameters
   └─ Auth0 parameters

2. Validate token
   ├─ Verify signature (using JWKS public key)
   ├─ Check expiration (exp claim)
   ├─ Verify issuer (iss claim)
   ├─ Verify audience (aud claim)
   └─ Check not before (nbf claim)

3. Extract claims
   ├─ sub → userId
   ├─ email → email
   ├─ name → name
   └─ All claims → dictionary

4. Return result
   ├─ Success: TokenValidationResult with user info
   └─ Failure: TokenValidationResult with error
```

**Error Handling**:
```csharp
try {
    // Validation logic
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
```

##### 3. Get Validation Parameters (Provider-Specific)

**Azure AD**:
```csharp
private TokenValidationParameters GetAzureValidationParameters()
{
    return new TokenValidationParameters {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,

        ValidIssuer = $"https://login.microsoftonline.com/{tenantId}/v2.0",
        ValidAudience = config["Azure:ClientId"],

        IssuerSigningKeyResolver = (token, securityToken, kid, parameters) => {
            // Fetch public keys from Azure's JWKS endpoint
            var keysUrl = $"https://login.microsoftonline.com/{tenantId}/discovery/v2.0/keys";
            var keysJson = httpClient.GetStringAsync(keysUrl).Result;
            return new JsonWebKeySet(keysJson).Keys;
        }
    };
}
```

**Okta**:
```csharp
private TokenValidationParameters GetOktaValidationParameters()
{
    return new TokenValidationParameters {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,

        ValidIssuer = config["Okta:Issuer"],
        ValidAudience = "api://default",

        IssuerSigningKeyResolver = (token, securityToken, kid, parameters) => {
            var keysUrl = $"{issuer}/v1/keys";
            var keysJson = httpClient.GetStringAsync(keysUrl).Result;
            return new JsonWebKeySet(keysJson).Keys;
        }
    };
}
```

**Auth0**:
```csharp
private TokenValidationParameters GetAuth0ValidationParameters()
{
    return new TokenValidationParameters {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,

        ValidIssuer = $"https://{domain}/",
        ValidAudience = config["Auth0:Audience"],

        IssuerSigningKeyResolver = (token, securityToken, kid, parameters) => {
            var keysUrl = $"https://{domain}/.well-known/jwks.json";
            var keysJson = httpClient.GetStringAsync(keysUrl).Result;
            return new JsonWebKeySet(keysJson).Keys;
        }
    };
}
```

**Helper Method**:
```csharp
private string? GetClaimValue(ClaimsPrincipal principal, string claimType)
  // Extracts claim value from principal
  // Returns null if claim not found
  // Handles different claim type formats
```

---

#### Token Validation Service Interface
**Location**: `backend/Services/ITokenValidationService.cs` (21 lines)

**Purpose**: Define contract for token validation service

**Interface**:
```csharp
public interface ITokenValidationService
{
    string GetProviderFromToken(string token);
    Task<TokenValidationResult> ValidateTokenAsync(string token, string provider);
}
```

**Result Model**:
```csharp
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

---

### Models

#### User Info Model
**Location**: `backend/Models/UserInfo.cs` (17 lines)

**Data Transfer Objects**:

```csharp
public class UserInfo
{
    public string UserId { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Provider { get; set; } = string.Empty;
    public Dictionary<string, string>? Claims { get; set; }
}

public class ValidateTokenResponse
{
    public bool IsValid { get; set; }
    public UserInfo? User { get; set; }
    public string? Message { get; set; }
    public string? Error { get; set; }
}
```

**Purpose**:
- Standardize API responses
- Provide type safety
- Enable JSON serialization

---

### Application Configuration

#### Program.cs
**Location**: `backend/Program.cs` (112 lines)

**Purpose**: Configure and bootstrap the ASP.NET Core application

**Configuration Steps**:

1. **Service Registration**:
```csharp
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSingleton<ITokenValidationService, TokenValidationService>();
```

2. **CORS Configuration**:
```csharp
builder.Services.AddCors(options => {
    options.AddPolicy("AllowAngularApp", builder => {
        builder.WithOrigins("http://localhost:4200")
               .AllowAnyMethod()
               .AllowAnyHeader()
               .AllowCredentials();
    });
});
```

3. **Authentication Configuration**:
```csharp
builder.Services.AddAuthentication(options => {
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer("Azure", azureOptions)
.AddJwtBearer("Okta", oktaOptions)
.AddJwtBearer("Auth0", auth0Options)
.AddPolicyScheme("MultiAuthSchemes", JwtBearerDefaults.AuthenticationScheme, options => {
    options.ForwardDefaultSelector = context => {
        // Auto-detect provider from token
        var token = ExtractToken(context);
        var provider = tokenService.GetProviderFromToken(token);
        return provider; // "Azure", "Okta", or "Auth0"
    };
});
```

4. **Middleware Pipeline**:
```csharp
app.UseHttpsRedirection();
app.UseCors("AllowAngularApp");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
```

**Execution Order**:
```
Request
  ↓
1. UseHttpsRedirection    (HTTP → HTTPS redirect)
  ↓
2. UseCors                (CORS policy enforcement)
  ↓
3. UseAuthentication      (JWT validation)
  ↓
4. UseAuthorization       (Permission checking)
  ↓
5. Controller             (Endpoint logic)
  ↓
Response
```

---

## Configuration Files

### Frontend Configuration

#### 1. package.json
**Location**: `frontend/package.json` (39 lines)

**Dependencies**:
```json
{
  "@angular/core": "^17.0.0",
  "@azure/msal-angular": "^3.0.0",
  "@azure/msal-browser": "^3.0.0",
  "@okta/okta-angular": "^6.3.0",
  "@okta/okta-auth-js": "^7.5.0",
  "@auth0/auth0-angular": "^2.2.3",
  "rxjs": "~7.8.0"
}
```

**Scripts**:
```json
{
  "start": "ng serve",
  "build": "ng build",
  "watch": "ng build --watch --configuration development",
  "test": "ng test"
}
```

#### 2. angular.json
**Location**: `frontend/angular.json` (77 lines)

**Key Configurations**:
- Output path: `dist/sso-angular-frontend`
- Development server port: 4200
- Production optimizations
- Asset management

#### 3. tsconfig.json
**Location**: `frontend/tsconfig.json` (29 lines)

**Compiler Options**:
```json
{
  "target": "ES2022",
  "module": "ES2022",
  "strict": true,
  "experimentalDecorators": true
}
```

#### 4. Environment Template
**Location**: `frontend/src/environments/environment.template.ts` (30 lines)

**Structure**:
```typescript
export const environment = {
  production: false,
  apiUrl: 'https://localhost:7001/api',
  azure: { /* config */ },
  okta: { /* config */ },
  auth0: { /* config */ }
};
```

---

### Backend Configuration

#### 1. SsoApi.csproj
**Location**: `backend/SsoApi.csproj` (17 lines)

**Target Framework**: .NET 8.0

**NuGet Packages**:
```xml
<PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="8.0.0" />
<PackageReference Include="Microsoft.Identity.Web" Version="2.15.0" />
<PackageReference Include="System.IdentityModel.Tokens.Jwt" Version="7.0.0" />
<PackageReference Include="Swashbuckle.AspNetCore" Version="6.5.0" />
```

#### 2. appsettings.json
**Location**: `backend/appsettings.json` (20 lines)

**Structure**:
```json
{
  "Logging": { ... },
  "AllowedHosts": "*",
  "Azure": {
    "TenantId": "YOUR_AZURE_TENANT_ID",
    "ClientId": "YOUR_AZURE_CLIENT_ID"
  },
  "Okta": {
    "Issuer": "https://YOUR_OKTA_DOMAIN/oauth2/default",
    "ClientId": "YOUR_OKTA_CLIENT_ID"
  },
  "Auth0": {
    "Domain": "YOUR_AUTH0_DOMAIN.auth0.com",
    "Audience": "YOUR_AUTH0_AUDIENCE",
    "ClientId": "YOUR_AUTH0_CLIENT_ID"
  }
}
```

#### 3. launchSettings.json
**Location**: `backend/Properties/launchSettings.json` (27 lines)

**Launch Profiles**:
- HTTPS profile: `https://localhost:7001`
- HTTP profile: `http://localhost:5001`

---

## Scripts and Utilities

### 1. Setup Environment Script
**Location**: `setup-environment.sh` (71 lines)

**Purpose**: Initialize development environment

**Actions**:
1. Check for Node.js and .NET
2. Create environment configuration files
3. Install npm packages
4. Restore .NET packages

**Usage**:
```bash
chmod +x setup-environment.sh
./setup-environment.sh
```

### 2. Start Development Script
**Location**: `start-dev.sh` (27 lines)

**Purpose**: Start both frontend and backend servers

**Actions**:
1. Start .NET API in background
2. Start Angular dev server
3. Display URLs
4. Handle graceful shutdown

**Usage**:
```bash
chmod +x start-dev.sh
./start-dev.sh
```

---

## Docker Configuration

### 1. docker-compose.yml
**Location**: `docker-compose.yml` (20 lines)

**Services**:
- `frontend`: Angular app (port 4200)
- `backend`: .NET API (ports 7001, 5001)

### 2. Frontend Dockerfile
**Location**: `frontend/Dockerfile` (14 lines)

**Multi-stage build**:
1. Build stage: Compile Angular app
2. Runtime stage: Serve with nginx

### 3. Backend Dockerfile
**Location**: `backend/Dockerfile` (16 lines)

**Multi-stage build**:
1. Build stage: Compile .NET app
2. Runtime stage: Run with ASP.NET runtime

### 4. nginx.conf
**Location**: `frontend/nginx.conf` (15 lines)

**Configuration**: Serve SPA with fallback to index.html

---

## Documentation Files

### 1. README.md
**Location**: `README.md` (458 lines)

**Sections**:
- Quick start guide
- Project structure
- API documentation
- Deployment instructions

### 2. SETUP_GUIDE.md
**Location**: `SETUP_GUIDE.md` (1000+ lines)

**Sections**:
- Step-by-step setup for beginners
- Provider registration guides
- Troubleshooting common issues

### 3. TECHNICAL_GUIDE.md
**Location**: `TECHNICAL_GUIDE.md` (1500+ lines)

**Sections**:
- Architecture deep dive
- OAuth 2.0 / OIDC explanation
- Component documentation
- Security best practices

### 4. COMPONENT_REFERENCE.md
**Location**: `COMPONENT_REFERENCE.md` (This file)

**Purpose**: Complete listing of all components

---

## Summary Statistics

### Frontend
- **Components**: 2 (Login, Home)
- **Services**: 4 (Auth, Azure, Okta, Auth0)
- **Guards**: 1 (AuthGuard)
- **Interceptors**: 1 (AuthInterceptor)
- **Models**: 1 (User, SsoProvider, AuthToken)
- **Total Lines**: ~800 lines

### Backend
- **Controllers**: 1 (AuthController)
- **Services**: 1 (TokenValidationService)
- **Models**: 1 (UserInfo, ValidateTokenResponse)
- **Configuration**: 1 (Program.cs)
- **Total Lines**: ~450 lines

### Configuration & Scripts
- **Config Files**: 8
- **Scripts**: 2
- **Docker Files**: 3
- **Documentation**: 4 files (~3000+ lines)

### Total Project
- **TypeScript/C# Code**: ~1250 lines
- **Configuration**: ~300 lines
- **Documentation**: ~3000+ lines
- **HTML/CSS**: ~150 lines
- **Total**: ~4700+ lines

---

## Component Dependencies Graph

```
Frontend:
─────────
AppComponent
  └─> Router Outlet
        ├─> LoginComponent
        │     └─> AuthService
        │           ├─> AzureAuthService
        │           ├─> OktaAuthService
        │           └─> Auth0AuthService
        │
        └─> HomeComponent
              ├─> AuthService
              └─> HttpClient
                    └─> AuthInterceptor
                          └─> AuthService

Backend:
────────
Program.cs
  ├─> AuthController
  │     └─> TokenValidationService
  │           └─> IConfiguration
  │
  └─> Middleware Pipeline
        ├─> CORS
        ├─> Authentication (Multi-Scheme)
        │     ├─> Azure JWT Bearer
        │     ├─> Okta JWT Bearer
        │     └─> Auth0 JWT Bearer
        └─> Authorization
```

---

This reference guide provides a complete catalog of all components in the SSO application. For implementation details, see the TECHNICAL_GUIDE.md. For setup instructions, see SETUP_GUIDE.md.
