using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using SsoApi.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularApp",
        builder =>
        {
            builder.WithOrigins("http://localhost:4200")
                   .AllowAnyMethod()
                   .AllowAnyHeader()
                   .AllowCredentials();
        });
});

// Add token validation service
builder.Services.AddSingleton<ITokenValidationService, TokenValidationService>();

// Configure JWT Authentication with multiple issuers
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer("Azure", options =>
{
    var azureConfig = builder.Configuration.GetSection("Azure");
    options.Authority = $"https://login.microsoftonline.com/{azureConfig["TenantId"]}";
    options.Audience = azureConfig["ClientId"];
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = $"https://login.microsoftonline.com/{azureConfig["TenantId"]}/v2.0",
        ValidAudience = azureConfig["ClientId"]
    };
})
.AddJwtBearer("Okta", options =>
{
    var oktaConfig = builder.Configuration.GetSection("Okta");
    options.Authority = oktaConfig["Issuer"];
    options.Audience = "api://default";
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = oktaConfig["Issuer"]
    };
})
.AddJwtBearer("Auth0", options =>
{
    var auth0Config = builder.Configuration.GetSection("Auth0");
    options.Authority = $"https://{auth0Config["Domain"]}/";
    options.Audience = auth0Config["Audience"];
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = $"https://{auth0Config["Domain"]}/",
        ValidAudience = auth0Config["Audience"]
    };
})
.AddPolicyScheme("MultiAuthSchemes", JwtBearerDefaults.AuthenticationScheme, options =>
{
    options.ForwardDefaultSelector = context =>
    {
        var authHeader = context.Request.Headers.Authorization.ToString();
        if (string.IsNullOrEmpty(authHeader))
            return "Azure";

        var token = authHeader.Replace("Bearer ", "");
        var tokenService = context.RequestServices.GetRequiredService<ITokenValidationService>();
        var provider = tokenService.GetProviderFromToken(token);

        return provider switch
        {
            "Azure" => "Azure",
            "Okta" => "Okta",
            "Auth0" => "Auth0",
            _ => "Azure"
        };
    };
});

builder.Services.AddAuthorization();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowAngularApp");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
