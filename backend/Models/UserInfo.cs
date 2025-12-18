namespace SsoApi.Models;

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
