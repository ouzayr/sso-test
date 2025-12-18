# SSO Authentication Application

A complete Single Sign-On (SSO) solution with Angular frontend and .NET API backend, supporting **Azure AD**, **Okta**, and **Auth0** authentication providers.

## 📚 Documentation

- **[Setup Guide](SETUP_GUIDE.md)** - Step-by-step setup instructions for beginners
- **[Technical Guide](TECHNICAL_GUIDE.md)** - In-depth technical documentation and architecture
- **[Component Reference](COMPONENT_REFERENCE.md)** - Complete listing of all components and files
- **README** (this file) - Quick start and overview

## Features

### Frontend (Angular)
- Multi-provider SSO authentication (Azure AD, Okta, Auth0)
- Modern, responsive UI with gradient design
- Protected routes with authentication guards
- HTTP interceptor for automatic token injection
- User profile display
- API connectivity testing

### Backend (.NET 8 API)
- JWT token validation for all three providers
- Multi-scheme authentication support
- Automatic provider detection from token
- RESTful API endpoints for token validation
- Swagger documentation
- CORS configuration for Angular frontend

## Architecture

```
┌─────────────────┐         ┌──────────────────┐
│  Angular App    │────────▶│   .NET API       │
│  (Port 4200)    │         │   (Port 7001)    │
└─────────────────┘         └──────────────────┘
        │                            │
        │                            │
        ▼                            ▼
┌─────────────────────────────────────────────┐
│         SSO Providers                       │
├─────────────────────────────────────────────┤
│  • Azure AD                                 │
│  • Okta                                     │
│  • Auth0                                    │
└─────────────────────────────────────────────┘
```

## Prerequisites

- **Node.js** 18 or higher
- **.NET 8 SDK**
- An account with at least one SSO provider:
  - Azure AD (Microsoft Entra ID)
  - Okta
  - Auth0

## Quick Start

### 1. Clone and Setup

```bash
# Make setup script executable
chmod +x setup-environment.sh

# Run setup
./setup-environment.sh
```

This will:
- Check for required dependencies
- Create environment configuration files
- Install npm packages
- Restore .NET packages

### 2. Configure SSO Providers

Choose one or more providers to configure:

#### Option A: Azure AD (Microsoft Entra ID)

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App registrations** → **New registration**
3. Set up your app:
   - **Name**: SSO Angular App
   - **Redirect URI**: `http://localhost:4200`
   - Click **Register**
4. Note your **Application (client) ID** and **Directory (tenant) ID**
5. Go to **Authentication**:
   - Add `http://localhost:4200` as redirect URI
   - Enable **ID tokens** and **Access tokens**
6. Update configuration files with your credentials

#### Option B: Okta

1. Go to [Okta Developer Console](https://developer.okta.com)
2. Navigate to **Applications** → **Create App Integration**
3. Select **OIDC** and **Single-Page Application**
4. Configure:
   - **Sign-in redirect URIs**: `http://localhost:4200/login/callback`
   - **Sign-out redirect URIs**: `http://localhost:4200`
   - **Assignments**: Allow everyone or specific groups
5. Note your **Client ID** and **Okta domain**
6. Update configuration files with your credentials

#### Option C: Auth0

1. Go to [Auth0 Dashboard](https://manage.auth0.com)
2. Navigate to **Applications** → **Create Application**
3. Select **Single Page Web Applications**
4. Configure:
   - **Allowed Callback URLs**: `http://localhost:4200`
   - **Allowed Logout URLs**: `http://localhost:4200`
   - **Allowed Web Origins**: `http://localhost:4200`
5. Note your **Domain** and **Client ID**
6. Create an **API** in Auth0 and note the **Audience**
7. Update configuration files with your credentials

### 3. Update Configuration Files

#### Frontend Configuration
Edit `frontend/src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'https://localhost:7001/api',

  azure: {
    clientId: 'your-azure-client-id',
    authority: 'https://login.microsoftonline.com/your-tenant-id',
    redirectUri: 'http://localhost:4200',
    postLogoutRedirectUri: 'http://localhost:4200'
  },

  okta: {
    clientId: 'your-okta-client-id',
    issuer: 'https://your-domain.okta.com/oauth2/default',
    redirectUri: 'http://localhost:4200/login/callback',
    postLogoutRedirectUri: 'http://localhost:4200',
    scopes: ['openid', 'profile', 'email']
  },

  auth0: {
    domain: 'your-domain.auth0.com',
    clientId: 'your-auth0-client-id',
    redirectUri: window.location.origin,
    audience: 'your-api-audience'
  }
};
```

#### Backend Configuration
Edit `backend/appsettings.Development.json`:

```json
{
  "Azure": {
    "TenantId": "your-azure-tenant-id",
    "ClientId": "your-azure-client-id"
  },
  "Okta": {
    "Issuer": "https://your-domain.okta.com/oauth2/default",
    "ClientId": "your-okta-client-id"
  },
  "Auth0": {
    "Domain": "your-domain.auth0.com",
    "Audience": "your-api-audience",
    "ClientId": "your-auth0-client-id"
  }
}
```

### 4. Run the Application

```bash
# Make start script executable
chmod +x start-dev.sh

# Start both frontend and backend
./start-dev.sh
```

Or run them separately:

```bash
# Terminal 1 - Backend
cd backend
dotnet run

# Terminal 2 - Frontend
cd frontend
npm start
```

### 5. Access the Application

- **Frontend**: http://localhost:4200
- **Backend API**: https://localhost:7001
- **Swagger UI**: https://localhost:7001/swagger

## Project Structure

```
sso-test/
├── frontend/                    # Angular application
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   │   ├── login/      # Login page with provider selection
│   │   │   │   └── home/       # Protected home page
│   │   │   ├── guards/
│   │   │   │   └── auth.guard.ts
│   │   │   ├── interceptors/
│   │   │   │   └── auth.interceptor.ts
│   │   │   ├── models/
│   │   │   │   └── user.model.ts
│   │   │   └── services/
│   │   │       ├── auth.service.ts
│   │   │       ├── azure-auth.service.ts
│   │   │       ├── okta-auth.service.ts
│   │   │       └── auth0-auth.service.ts
│   │   └── environments/
│   │       └── environment.template.ts
│   ├── package.json
│   └── angular.json
│
├── backend/                     # .NET API
│   ├── Controllers/
│   │   └── AuthController.cs   # Authentication endpoints
│   ├── Models/
│   │   └── UserInfo.cs
│   ├── Services/
│   │   ├── ITokenValidationService.cs
│   │   └── TokenValidationService.cs
│   ├── Program.cs
│   ├── appsettings.json
│   └── SsoApi.csproj
│
├── docker-compose.yml           # Docker orchestration
├── setup-environment.sh         # Environment setup script
├── start-dev.sh                # Development server script
└── README.md
```

## API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/auth/validate` | Validate current JWT token | Yes |
| GET | `/api/auth/user` | Get current user info | Yes |
| POST | `/api/auth/validate-external` | Validate external token | No |
| GET | `/api/auth/health` | Health check | No |

### Example API Calls

#### Validate Token
```bash
curl -X GET "https://localhost:7001/api/auth/validate" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Get User Info
```bash
curl -X GET "https://localhost:7001/api/auth/user" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Validate External Token
```bash
curl -X POST "https://localhost:7001/api/auth/validate-external" \
  -H "Content-Type: application/json" \
  -d '{"token": "YOUR_JWT_TOKEN", "provider": "Azure"}'
```

## How It Works

### Authentication Flow

1. **User Login**:
   - User selects SSO provider (Azure AD, Okta, or Auth0)
   - Frontend redirects to provider's login page
   - User authenticates with provider

2. **Token Acquisition**:
   - Provider redirects back to app with authorization code
   - Frontend exchanges code for JWT tokens
   - Tokens stored in localStorage

3. **API Requests**:
   - HTTP interceptor adds JWT token to all API requests
   - Backend validates token using provider's public keys
   - Backend returns user info and protected resources

4. **Token Validation**:
   - Backend automatically detects provider from token issuer
   - Uses appropriate validation parameters for each provider
   - Fetches public keys from provider's JWKS endpoint
   - Validates signature, expiration, and claims

### Multi-Provider Support

The backend uses policy-based authentication schemes to support multiple providers:

```csharp
.AddPolicyScheme("MultiAuthSchemes", JwtBearerDefaults.AuthenticationScheme, options =>
{
    options.ForwardDefaultSelector = context =>
    {
        // Automatically detect and route to correct provider
        var provider = tokenService.GetProviderFromToken(token);
        return provider; // "Azure", "Okta", or "Auth0"
    };
});
```

## Docker Deployment

Build and run with Docker Compose:

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Security Considerations

- All tokens are validated server-side
- HTTPS enforced in production
- CORS configured to specific origins
- Token expiration validated
- Signature verification using provider's public keys
- No sensitive credentials in frontend code

## Troubleshooting

### Frontend Issues

**Problem**: "Cannot read properties of undefined"
- Ensure environment.ts is created from template
- Verify all required config values are set

**Problem**: "CORS error"
- Check backend is running on correct port (7001)
- Verify CORS settings in backend/Program.cs

### Backend Issues

**Problem**: "Unable to obtain configuration from..."
- Verify internet connection (needs to fetch JWKS)
- Check provider configuration values are correct

**Problem**: "IDX10501: Signature validation failed"
- Token may be expired
- Audience/Issuer mismatch with configuration
- Verify provider credentials

### Provider-Specific Issues

**Azure AD**:
- Ensure app registration has correct redirect URIs
- Enable ID tokens in Authentication settings
- Grant necessary API permissions

**Okta**:
- Verify authorization server is "default" or correct custom server
- Check trusted origins in Okta dashboard
- Ensure app is assigned to users/groups

**Auth0**:
- Create and configure API in Auth0 dashboard
- Set correct audience in both frontend and backend
- Enable RS256 algorithm for API

## Development

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm start

# Build for production
npm run build

# Run tests
npm test
```

### Backend Development

```bash
cd backend

# Restore packages
dotnet restore

# Run development server
dotnet run

# Build release
dotnet build -c Release

# Run tests
dotnet test
```

## Technologies Used

### Frontend
- **Angular 17** - Framework
- **@azure/msal-angular** - Azure AD authentication
- **@okta/okta-angular** - Okta authentication
- **@auth0/auth0-angular** - Auth0 authentication
- **RxJS** - Reactive programming

### Backend
- **.NET 8** - Framework
- **Microsoft.AspNetCore.Authentication.JwtBearer** - JWT validation
- **Microsoft.Identity.Web** - Azure AD integration
- **System.IdentityModel.Tokens.Jwt** - Token handling
- **Swashbuckle** - API documentation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - feel free to use this project for learning and development.

## Support

For issues and questions:
- Check the troubleshooting section
- Review provider documentation
- Open an issue in the repository

## Additional Resources

- [Azure AD Documentation](https://docs.microsoft.com/en-us/azure/active-directory/)
- [Okta Developer Docs](https://developer.okta.com/docs/)
- [Auth0 Documentation](https://auth0.com/docs)
- [Angular Documentation](https://angular.io/docs)
- [.NET Documentation](https://docs.microsoft.com/en-us/dotnet/)