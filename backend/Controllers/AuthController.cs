using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SsoApi.Models;
using SsoApi.Services;
using System.Security.Claims;

namespace SsoApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ITokenValidationService _tokenValidationService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        ITokenValidationService tokenValidationService,
        ILogger<AuthController> logger)
    {
        _tokenValidationService = tokenValidationService;
        _logger = logger;
    }

    [HttpGet("validate")]
    [Authorize(AuthenticationSchemes = "MultiAuthSchemes")]
    public async Task<ActionResult<ValidateTokenResponse>> ValidateToken()
    {
        try
        {
            var token = GetTokenFromHeader();
            if (string.IsNullOrEmpty(token))
            {
                return Unauthorized(new ValidateTokenResponse
                {
                    IsValid = false,
                    Error = "No token provided"
                });
            }

            var provider = _tokenValidationService.GetProviderFromToken(token);
            var result = await _tokenValidationService.ValidateTokenAsync(token, provider);

            if (!result.IsValid)
            {
                return Unauthorized(new ValidateTokenResponse
                {
                    IsValid = false,
                    Error = result.Error
                });
            }

            return Ok(new ValidateTokenResponse
            {
                IsValid = true,
                Message = "Token is valid",
                User = new UserInfo
                {
                    UserId = result.UserId ?? "",
                    Email = result.Email ?? "",
                    Name = result.Name ?? "",
                    Provider = result.Provider ?? "",
                    Claims = result.Claims
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating token");
            return StatusCode(500, new ValidateTokenResponse
            {
                IsValid = false,
                Error = "Internal server error"
            });
        }
    }

    [HttpGet("user")]
    [Authorize(AuthenticationSchemes = "MultiAuthSchemes")]
    public ActionResult<UserInfo> GetCurrentUser()
    {
        try
        {
            var token = GetTokenFromHeader();
            if (string.IsNullOrEmpty(token))
            {
                return Unauthorized();
            }

            var provider = _tokenValidationService.GetProviderFromToken(token);
            var userId = User.FindFirst("sub")?.Value ?? User.FindFirst("oid")?.Value;
            var email = User.FindFirst("email")?.Value ?? User.FindFirst("preferred_username")?.Value;
            var name = User.FindFirst("name")?.Value;

            var claims = User.Claims.ToDictionary(c => c.Type, c => c.Value);

            return Ok(new UserInfo
            {
                UserId = userId ?? "",
                Email = email ?? "",
                Name = name ?? "",
                Provider = provider,
                Claims = claims
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user info");
            return StatusCode(500);
        }
    }

    [HttpPost("validate-external")]
    public async Task<ActionResult<ValidateTokenResponse>> ValidateExternalToken([FromBody] ValidateTokenRequest request)
    {
        try
        {
            if (string.IsNullOrEmpty(request.Token))
            {
                return BadRequest(new ValidateTokenResponse
                {
                    IsValid = false,
                    Error = "Token is required"
                });
            }

            var provider = string.IsNullOrEmpty(request.Provider)
                ? _tokenValidationService.GetProviderFromToken(request.Token)
                : request.Provider;

            var result = await _tokenValidationService.ValidateTokenAsync(request.Token, provider);

            if (!result.IsValid)
            {
                return Ok(new ValidateTokenResponse
                {
                    IsValid = false,
                    Error = result.Error
                });
            }

            return Ok(new ValidateTokenResponse
            {
                IsValid = true,
                Message = "Token is valid",
                User = new UserInfo
                {
                    UserId = result.UserId ?? "",
                    Email = result.Email ?? "",
                    Name = result.Name ?? "",
                    Provider = result.Provider ?? "",
                    Claims = result.Claims
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating external token");
            return StatusCode(500, new ValidateTokenResponse
            {
                IsValid = false,
                Error = "Internal server error"
            });
        }
    }

    [HttpGet("health")]
    public ActionResult<object> HealthCheck()
    {
        return Ok(new
        {
            status = "healthy",
            timestamp = DateTime.UtcNow,
            supportedProviders = new[] { "Azure", "Okta", "Auth0" }
        });
    }

    private string? GetTokenFromHeader()
    {
        var authHeader = Request.Headers.Authorization.ToString();
        if (string.IsNullOrEmpty(authHeader))
            return null;

        return authHeader.Replace("Bearer ", "");
    }
}

public class ValidateTokenRequest
{
    public string Token { get; set; } = string.Empty;
    public string? Provider { get; set; }
}
