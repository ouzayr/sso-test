using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;

namespace SsoApi.Services;

public class TokenValidationService : ITokenValidationService
{
    private readonly IConfiguration _configuration;
    private readonly JwtSecurityTokenHandler _tokenHandler;

    public TokenValidationService(IConfiguration configuration)
    {
        _configuration = configuration;
        _tokenHandler = new JwtSecurityTokenHandler();
    }

    public string GetProviderFromToken(string token)
    {
        try
        {
            var jwtToken = _tokenHandler.ReadJwtToken(token);
            var issuer = jwtToken.Issuer;

            if (issuer.Contains("microsoftonline.com") || issuer.Contains("login.windows.net"))
                return "Azure";
            if (issuer.Contains("okta.com"))
                return "Okta";
            if (issuer.Contains("auth0.com"))
                return "Auth0";

            return "Azure";
        }
        catch
        {
            return "Azure";
        }
    }

    public async Task<TokenValidationResult> ValidateTokenAsync(string token, string provider)
    {
        try
        {
            var validationParameters = GetValidationParameters(provider);
            var principal = _tokenHandler.ValidateToken(token, validationParameters, out var validatedToken);

            return new TokenValidationResult
            {
                IsValid = true,
                UserId = GetClaimValue(principal, "sub") ?? GetClaimValue(principal, "oid"),
                Email = GetClaimValue(principal, "email") ?? GetClaimValue(principal, "preferred_username"),
                Name = GetClaimValue(principal, "name"),
                Provider = provider,
                Claims = principal.Claims.ToDictionary(c => c.Type, c => c.Value)
            };
        }
        catch (Exception ex)
        {
            return new TokenValidationResult
            {
                IsValid = false,
                Error = ex.Message
            };
        }
    }

    private TokenValidationParameters GetValidationParameters(string provider)
    {
        return provider.ToLower() switch
        {
            "azure" => GetAzureValidationParameters(),
            "okta" => GetOktaValidationParameters(),
            "auth0" => GetAuth0ValidationParameters(),
            _ => throw new ArgumentException($"Unknown provider: {provider}")
        };
    }

    private TokenValidationParameters GetAzureValidationParameters()
    {
        var config = _configuration.GetSection("Azure");
        var tenantId = config["TenantId"];

        return new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = $"https://login.microsoftonline.com/{tenantId}/v2.0",
            ValidAudience = config["ClientId"],
            IssuerSigningKeyResolver = (token, securityToken, kid, parameters) =>
            {
                var client = new HttpClient();
                var response = client.GetStringAsync($"https://login.microsoftonline.com/{tenantId}/discovery/v2.0/keys").Result;
                var keys = new JsonWebKeySet(response);
                return keys.Keys;
            }
        };
    }

    private TokenValidationParameters GetOktaValidationParameters()
    {
        var config = _configuration.GetSection("Okta");
        var issuer = config["Issuer"];

        return new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = issuer,
            ValidAudience = "api://default",
            IssuerSigningKeyResolver = (token, securityToken, kid, parameters) =>
            {
                var client = new HttpClient();
                var response = client.GetStringAsync($"{issuer}/v1/keys").Result;
                var keys = new JsonWebKeySet(response);
                return keys.Keys;
            }
        };
    }

    private TokenValidationParameters GetAuth0ValidationParameters()
    {
        var config = _configuration.GetSection("Auth0");
        var domain = config["Domain"];

        return new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = $"https://{domain}/",
            ValidAudience = config["Audience"],
            IssuerSigningKeyResolver = (token, securityToken, kid, parameters) =>
            {
                var client = new HttpClient();
                var response = client.GetStringAsync($"https://{domain}/.well-known/jwks.json").Result;
                var keys = new JsonWebKeySet(response);
                return keys.Keys;
            }
        };
    }

    private string? GetClaimValue(ClaimsPrincipal principal, string claimType)
    {
        return principal.Claims.FirstOrDefault(c => c.Type == claimType)?.Value;
    }
}
