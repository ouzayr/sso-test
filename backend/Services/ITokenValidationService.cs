namespace SsoApi.Services;

public interface ITokenValidationService
{
    string GetProviderFromToken(string token);
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
