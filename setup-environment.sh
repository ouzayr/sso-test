#!/bin/bash

echo "SSO Application Environment Setup"
echo "=================================="
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

# Check for .NET
if ! command -v dotnet &> /dev/null; then
    echo ".NET is not installed. Please install .NET 8 SDK."
    exit 1
fi

echo "Creating environment configuration files..."

# Frontend environment
if [ ! -f "frontend/src/environments/environment.ts" ]; then
    cp frontend/src/environments/environment.template.ts frontend/src/environments/environment.ts
    echo "Created frontend/src/environments/environment.ts"
    echo "Please update this file with your SSO provider credentials."
fi

# Backend appsettings
if [ ! -f "backend/appsettings.Development.json" ]; then
    cat > backend/appsettings.Development.json << 'EOF'
{
  "Logging": {
    "LogLevel": {
      "Default": "Debug",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "Urls": "https://localhost:7001;http://localhost:5001",
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
EOF
    echo "Created backend/appsettings.Development.json"
    echo "Please update this file with your SSO provider credentials."
fi

echo ""
echo "Installing dependencies..."

# Install frontend dependencies
cd frontend
echo "Installing Angular dependencies..."
npm install
cd ..

# Restore backend dependencies
cd backend
echo "Restoring .NET dependencies..."
dotnet restore
cd ..

echo ""
echo "Setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure your SSO providers (Azure AD, Okta, Auth0)"
echo "2. Update frontend/src/environments/environment.ts with your credentials"
echo "3. Update backend/appsettings.Development.json with your credentials"
echo "4. Run './start-dev.sh' to start the development servers"
