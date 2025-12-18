# SSO Implementation - Complete Setup Guide for Beginners

This guide will walk you through every step of setting up this SSO application, from prerequisites to running the application successfully.

## Table of Contents
1. [Understanding the Prerequisites](#understanding-the-prerequisites)
2. [Installing Required Software](#installing-required-software)
3. [Understanding SSO Providers](#understanding-sso-providers)
4. [Setting Up Azure AD](#setting-up-azure-ad)
5. [Setting Up Okta](#setting-up-okta)
6. [Setting Up Auth0](#setting-up-auth0)
7. [Configuring the Application](#configuring-the-application)
8. [Running the Application](#running-the-application)
9. [Testing Your Implementation](#testing-your-implementation)
10. [Common Issues and Solutions](#common-issues-and-solutions)

---

## Understanding the Prerequisites

### What is SSO?
Single Sign-On (SSO) allows users to log in once and access multiple applications without re-entering credentials. Think of it like using "Sign in with Google" - you authenticate with Google once, and then can access various apps using that same authentication.

### What You Need
Before starting, you need:

1. **Node.js 18+**: Runtime for the Angular frontend
2. **.NET 8 SDK**: Runtime for the backend API
3. **An SSO Provider Account**: At least one of Azure AD, Okta, or Auth0
4. **A Code Editor**: VS Code is recommended
5. **Git**: For version control
6. **A Terminal/Command Line**: To run commands

---

## Installing Required Software

### Step 1: Install Node.js

**Why we need it**: Node.js runs our Angular application.

**Windows**:
1. Download from https://nodejs.org/en/download/
2. Run the installer (.msi file)
3. Accept all defaults and click "Next" through the wizard
4. Verify installation:
   ```bash
   node --version
   npm --version
   ```

**Mac**:
1. Using Homebrew (recommended):
   ```bash
   brew install node@18
   ```
2. Or download from https://nodejs.org/
3. Verify installation:
   ```bash
   node --version
   npm --version
   ```

**Linux (Ubuntu/Debian)**:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
npm --version
```

### Step 2: Install .NET 8 SDK

**Why we need it**: .NET 8 runs our backend API and validates tokens.

**Windows**:
1. Download from https://dotnet.microsoft.com/download/dotnet/8.0
2. Click "Download .NET SDK x64"
3. Run the installer
4. Verify installation:
   ```bash
   dotnet --version
   ```

**Mac**:
```bash
brew install dotnet@8
dotnet --version
```

**Linux (Ubuntu)**:
```bash
wget https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
sudo dpkg -i packages-microsoft-prod.deb
sudo apt-get update
sudo apt-get install -y dotnet-sdk-8.0
dotnet --version
```

### Step 3: Install Git (if not already installed)

**Check if you have it**:
```bash
git --version
```

If not installed:
- **Windows**: Download from https://git-scm.com/download/win
- **Mac**: `brew install git`
- **Linux**: `sudo apt-get install git`

### Step 4: Install VS Code (Optional but Recommended)

Download from https://code.visualstudio.com/

**Recommended Extensions**:
- Angular Language Service
- C# (for .NET)
- ESLint
- Prettier

---

## Understanding SSO Providers

### What is an SSO Provider?

An SSO provider is a trusted service that handles user authentication. Instead of managing passwords yourself, you delegate authentication to these services.

### The Three Providers We Support

1. **Azure AD (Microsoft Entra ID)**
   - Best for: Enterprise/corporate environments
   - Free tier: Yes (with Microsoft account)
   - Used by: Organizations using Microsoft 365

2. **Okta**
   - Best for: Businesses of all sizes
   - Free tier: Developer account (free)
   - Used by: Many SaaS companies

3. **Auth0**
   - Best for: Developers and startups
   - Free tier: Up to 7,000 users
   - Used by: Modern web applications

**For this tutorial, we'll set up all three, but you only need ONE to get started.**

---

## Setting Up Azure AD

### Step 1: Create a Microsoft Account
If you don't have one, sign up at https://signup.live.com/

### Step 2: Access Azure Portal
1. Go to https://portal.azure.com
2. Sign in with your Microsoft account
3. If prompted, select "Azure Active Directory" from the services

### Step 3: Register Your Application

1. **Navigate to App Registrations**:
   - In the Azure Portal, search for "Azure Active Directory" in the top search bar
   - Click "App registrations" in the left sidebar
   - Click "New registration"

2. **Fill in Application Details**:
   ```
   Name: SSO Angular Application
   Supported account types: Accounts in this organizational directory only
   Redirect URI:
     - Platform: Single-page application (SPA)
     - URI: http://localhost:4200
   ```
   - Click "Register"

3. **Note Your Credentials**:
   After registration, you'll see an overview page. Copy these values:
   ```
   Application (client) ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   Directory (tenant) ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   ```
   **SAVE THESE!** You'll need them later.

### Step 4: Configure Authentication

1. Click "Authentication" in the left sidebar
2. Under "Implicit grant and hybrid flows", check:
   - ✅ Access tokens
   - ✅ ID tokens
3. Under "Supported account types", select:
   - ✅ Accounts in this organizational directory only
4. Click "Save" at the top

### Step 5: Configure API Permissions

1. Click "API permissions" in the left sidebar
2. You should see "Microsoft Graph" with "User.Read" permission
3. This is sufficient for our application
4. Click "Grant admin consent" (if you have admin rights)

### Step 6: Save Your Configuration

Create a file to save your credentials:
```
Azure AD Configuration:
-----------------------
Tenant ID: [your-tenant-id]
Client ID: [your-client-id]
Authority: https://login.microsoftonline.com/[your-tenant-id]
Redirect URI: http://localhost:4200
```

---

## Setting Up Okta

### Step 1: Create Okta Developer Account

1. Go to https://developer.okta.com/signup/
2. Fill in your information:
   ```
   Email: your-email@example.com
   First name: Your Name
   Last name: Your Name
   Country: Your Country
   ```
3. Click "Sign Up"
4. Check your email and verify your account
5. Set your password

### Step 2: Access Okta Dashboard

1. After verification, you'll be redirected to your Okta domain
2. Your domain will look like: `https://dev-12345678.okta.com`
3. **SAVE THIS DOMAIN!** You'll need it later

### Step 3: Create an Application

1. In the Okta Admin Console, click "Applications" in the left sidebar
2. Click "Create App Integration"
3. Select these options:
   ```
   Sign-in method: OIDC - OpenID Connect
   Application type: Single-Page Application
   ```
4. Click "Next"

### Step 4: Configure Application Settings

Fill in the following:
```
App integration name: SSO Angular App
Grant type:
  ✅ Authorization Code
  ✅ Refresh Token (optional)

Sign-in redirect URIs:
  http://localhost:4200/login/callback

Sign-out redirect URIs:
  http://localhost:4200

Controlled access:
  ○ Allow everyone in your organization to access
  or
  ○ Limit access to selected groups
```

Click "Save"

### Step 5: Note Your Credentials

After saving, you'll see the application details:
```
Client ID: 0oa*********************
Okta domain: https://dev-12345678.okta.com
```

### Step 6: Configure Authorization Server

1. Go to "Security" → "API" in the left sidebar
2. You should see "default" authorization server
3. Click "default"
4. Note the "Issuer URI": `https://dev-12345678.okta.com/oauth2/default`

### Step 7: Save Your Configuration

```
Okta Configuration:
-------------------
Okta Domain: dev-12345678.okta.com
Client ID: [your-client-id]
Issuer: https://dev-12345678.okta.com/oauth2/default
Redirect URI: http://localhost:4200/login/callback
```

---

## Setting Up Auth0

### Step 1: Create Auth0 Account

1. Go to https://auth0.com/signup
2. Sign up with:
   - Email and password, or
   - Sign in with Google/GitHub
3. Fill in your information
4. Verify your email

### Step 2: Create a Tenant

1. After signup, you'll be asked to create a tenant
2. Choose a tenant domain:
   ```
   Tenant domain: your-app-name (becomes your-app-name.auth0.com)
   Region: Choose closest to you
   ```
3. Click "Create"

### Step 3: Create an Application

1. In the Auth0 Dashboard, click "Applications" → "Applications"
2. Click "Create Application"
3. Fill in:
   ```
   Name: SSO Angular App
   Choose an application type: Single Page Web Applications
   ```
4. Click "Create"

### Step 4: Configure Application Settings

1. Click the "Settings" tab
2. Scroll down to "Application URIs" section
3. Fill in:
   ```
   Allowed Callback URLs:
     http://localhost:4200

   Allowed Logout URLs:
     http://localhost:4200

   Allowed Web Origins:
     http://localhost:4200
   ```
4. Scroll to the bottom and click "Save Changes"

### Step 5: Note Your Credentials

At the top of the Settings page, you'll see:
```
Domain: your-app-name.auth0.com
Client ID: ****************************
```

### Step 6: Create an API

1. Go to "Applications" → "APIs"
2. Click "Create API"
3. Fill in:
   ```
   Name: SSO API
   Identifier: https://api.sso-app.com (can be any unique identifier)
   Signing Algorithm: RS256
   ```
4. Click "Create"
5. **Note the "Identifier"** - this is your **Audience**

### Step 7: Save Your Configuration

```
Auth0 Configuration:
--------------------
Domain: your-app-name.auth0.com
Client ID: [your-client-id]
Audience: https://api.sso-app.com
Redirect URI: http://localhost:4200
```

---

## Configuring the Application

Now that you have credentials from at least one provider, let's configure the application.

### Step 1: Clone/Navigate to the Project

```bash
cd /path/to/sso-test
```

### Step 2: Run Setup Script

```bash
# Make the script executable
chmod +x setup-environment.sh

# Run it
./setup-environment.sh
```

**What this script does**:
- Checks for Node.js and .NET
- Creates environment configuration files
- Installs npm packages
- Restores .NET packages

You should see output like:
```
SSO Application Environment Setup
==================================
Creating environment configuration files...
Created frontend/src/environments/environment.ts
Created backend/appsettings.Development.json

Installing dependencies...
Installing Angular dependencies...
Restoring .NET dependencies...

Setup complete!
```

### Step 3: Configure Frontend

1. Open `frontend/src/environments/environment.ts` in your code editor

2. **If you're using Azure AD**, update the azure section:
   ```typescript
   azure: {
     clientId: 'paste-your-azure-client-id-here',
     authority: 'https://login.microsoftonline.com/paste-your-tenant-id-here',
     redirectUri: 'http://localhost:4200',
     postLogoutRedirectUri: 'http://localhost:4200'
   },
   ```

3. **If you're using Okta**, update the okta section:
   ```typescript
   okta: {
     clientId: 'paste-your-okta-client-id-here',
     issuer: 'https://dev-12345678.okta.com/oauth2/default',
     redirectUri: 'http://localhost:4200/login/callback',
     postLogoutRedirectUri: 'http://localhost:4200',
     scopes: ['openid', 'profile', 'email']
   },
   ```

4. **If you're using Auth0**, update the auth0 section:
   ```typescript
   auth0: {
     domain: 'your-app-name.auth0.com',
     clientId: 'paste-your-auth0-client-id-here',
     redirectUri: window.location.origin,
     audience: 'https://api.sso-app.com'
   }
   ```

5. Save the file

### Step 4: Configure Backend

1. Open `backend/appsettings.Development.json`

2. Update with your credentials:

   **For Azure AD**:
   ```json
   "Azure": {
     "TenantId": "paste-your-azure-tenant-id-here",
     "ClientId": "paste-your-azure-client-id-here"
   }
   ```

   **For Okta**:
   ```json
   "Okta": {
     "Issuer": "https://dev-12345678.okta.com/oauth2/default",
     "ClientId": "paste-your-okta-client-id-here"
   }
   ```

   **For Auth0**:
   ```json
   "Auth0": {
     "Domain": "your-app-name.auth0.com",
     "Audience": "https://api.sso-app.com",
     "ClientId": "paste-your-auth0-client-id-here"
   }
   ```

3. Save the file

---

## Running the Application

### Option 1: Run Both Apps with One Command

```bash
# Make the script executable (if not already done)
chmod +x start-dev.sh

# Start both frontend and backend
./start-dev.sh
```

You should see:
```
Starting SSO Application in Development Mode
=============================================
Starting .NET API backend on https://localhost:7001...
Starting Angular frontend on http://localhost:4200...

Application started!
Frontend: http://localhost:4200
Backend: https://localhost:7001
API Docs: https://localhost:7001/swagger
```

### Option 2: Run Separately (Recommended for Development)

**Terminal 1 - Backend**:
```bash
cd backend
dotnet run
```

You should see:
```
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: https://localhost:7001
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: http://localhost:5001
```

**Terminal 2 - Frontend**:
```bash
cd frontend
npm start
```

You should see:
```
** Angular Live Development Server is listening on localhost:4200 **
✔ Compiled successfully.
```

---

## Testing Your Implementation

### Step 1: Access the Application

1. Open your browser
2. Navigate to: http://localhost:4200
3. You should be redirected to the login page

### Step 2: Test SSO Login

1. **You'll see three login buttons**:
   - "Sign in with Azure AD" (blue)
   - "Sign in with Okta" (blue)
   - "Sign in with Auth0" (orange)

2. **Click the provider you configured** (e.g., "Sign in with Azure AD")

3. **What happens next**:
   - Browser redirects to the provider's login page
   - You'll see the provider's login form (Microsoft, Okta, or Auth0)
   - Enter your credentials
   - Provider asks for consent (first time only)
   - You're redirected back to the app

4. **You should land on the home page** showing:
   ```
   Dashboard

   User Information
   Name: John Doe
   Email: john@example.com
   User ID: [some-id]
   Provider: azure
   ```

### Step 3: Test API Connection

1. On the home page, click "Test API Connection"
2. You should see a success message:
   ```
   Success! API validated your token
   {
     "isValid": true,
     "message": "Token is valid",
     "user": {
       "userId": "...",
       "email": "...",
       "name": "...",
       "provider": "azure"
     }
   }
   ```

### Step 4: Test Logout

1. Click the "Logout" button
2. You should be:
   - Logged out from the application
   - Redirected to the login page
   - Optionally logged out from the SSO provider

---

## Common Issues and Solutions

### Issue 1: "Cannot find module '@angular/core'"

**Problem**: npm packages not installed

**Solution**:
```bash
cd frontend
npm install
```

### Issue 2: "CORS Error" in Browser Console

**Problem**: Backend not running or running on wrong port

**Solution**:
1. Check backend is running: `cd backend && dotnet run`
2. Verify it's on port 7001
3. Check backend/Program.cs has correct CORS configuration

### Issue 3: "Redirect URI mismatch"

**Problem**: The redirect URI in your provider doesn't match the app

**Solution**:
- Azure AD: Check Authentication → Redirect URIs
- Okta: Check Application → General Settings → Sign-in redirect URIs
- Auth0: Check Application → Settings → Allowed Callback URLs

### Issue 4: "IDX10501: Signature validation failed"

**Problem**: Token validation failing in backend

**Solution**:
1. Check backend configuration matches provider credentials
2. Ensure internet connection (backend needs to fetch public keys)
3. Verify Tenant ID, Client ID, Issuer are correct

### Issue 5: Angular App Doesn't Load

**Problem**: Port 4200 already in use

**Solution**:
```bash
# Find process using port 4200
lsof -ti:4200

# Kill the process
kill -9 [process-id]

# Or use a different port
ng serve --port 4300
```

### Issue 6: Backend Certificate Error

**Problem**: Development HTTPS certificate not trusted

**Solution**:
```bash
# Trust the development certificate
dotnet dev-certs https --trust

# Or run on HTTP only
cd backend
dotnet run --urls "http://localhost:5001"
```

Then update frontend environment.ts:
```typescript
apiUrl: 'http://localhost:5001/api'
```

### Issue 7: "Authentication failed. Please try again."

**Problem**: Provider configuration mismatch

**Debugging steps**:
1. Open browser DevTools (F12)
2. Check Console for errors
3. Look in Network tab for failed requests
4. Verify credentials in environment.ts match your provider dashboard

**Common causes**:
- Wrong Client ID
- Wrong Tenant ID (Azure)
- Wrong Issuer URL (Okta)
- Wrong Domain (Auth0)

### Issue 8: Okta "The client is not authorized to use this authorization server"

**Problem**: Trying to use wrong authorization server

**Solution**:
- Use the "default" authorization server
- Issuer should be: `https://your-domain.okta.com/oauth2/default`
- Or create a custom authorization server

### Issue 9: Auth0 Login Popup is Blank

**Problem**: Incorrect Auth0 configuration

**Solution**:
1. Check Auth0 Dashboard → Applications → Your App → Settings
2. Verify:
   - Allowed Callback URLs: `http://localhost:4200`
   - Allowed Logout URLs: `http://localhost:4200`
   - Allowed Web Origins: `http://localhost:4200`
3. Make sure to click "Save Changes"

---

## Next Steps

Now that your application is running:

1. **Explore the Code**:
   - Read the TECHNICAL_GUIDE.md for detailed explanations
   - Look at the Angular services in `frontend/src/app/services/`
   - Check the .NET controllers in `backend/Controllers/`

2. **Customize the UI**:
   - Modify `frontend/src/styles.css` for global styles
   - Update component styles in component CSS files

3. **Add Features**:
   - Add more protected routes
   - Implement role-based access control
   - Add user profile management

4. **Deploy**:
   - Update redirect URIs in provider dashboards
   - Configure environment variables for production
   - Use Docker for deployment

---

## Getting Help

If you're stuck:

1. **Check the logs**:
   - Frontend: Browser DevTools Console (F12)
   - Backend: Terminal where `dotnet run` is running

2. **Review documentation**:
   - TECHNICAL_GUIDE.md for architecture details
   - README.md for overview
   - Provider documentation (links in README)

3. **Common resources**:
   - Azure AD: https://docs.microsoft.com/azure/active-directory/
   - Okta: https://developer.okta.com/docs/
   - Auth0: https://auth0.com/docs
   - Angular: https://angular.io/docs
   - .NET: https://docs.microsoft.com/dotnet/

---

## Congratulations!

You've successfully set up a complete SSO authentication system! You now understand:
- How SSO providers work
- How to configure OAuth 2.0 / OIDC applications
- How Angular handles authentication
- How .NET validates JWT tokens
- How frontend and backend communicate securely

Keep exploring and building!
