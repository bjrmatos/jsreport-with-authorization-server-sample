// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

using IdentityModel;
using IdentityServer4;
using IdentityServer4.Models;
using IdentityServer4.Test;
using System.Collections.Generic;
using System.Security.Claims;
using System;
using System.IO;
using System.Security.Cryptography.X509Certificates;

namespace AuthorizationServer
{
    public class Config
    {
        internal static X509Certificate2 GetSigningCertificate()
        {
	    var fileName = Path.Combine(Directory.GetCurrentDirectory(), "../cert.pfx");

            if(!File.Exists(fileName)) {
                throw new FileNotFoundException("Signing Certificate is missing!");
            }

            var cert = new X509Certificate2(fileName);
            return cert;
        }

        // scopes define the resources in your system
        public static IEnumerable<IdentityResource> GetIdentityResources()
        {
            return new List<IdentityResource>
            {
                new IdentityResources.OpenId(),
                new IdentityResources.Profile(),
                new IdentityResources.Email()
            };
        }

        public static IEnumerable<ApiResource> GetApiResources()
        {
	    var secret = new Secret("secret".Sha256());

            return new List<ApiResource>
            {
		        new ApiResource("jsreport", "JavaScript based reporting platform") { ApiSecrets = new List<Secret> { secret }, UserClaims = new List<string> {"username"} }
            };
        }

        // clients want to access resources (aka scopes)
        public static IEnumerable<Client> GetClients()
        {
            var authorizationServer = "jsreport-sample.com";
            return new List<Client>
            {
                // JavaScript Client
                new Client
                {
                    ClientId = "js_oidc",
                    ClientName = "WebApp JavaScript Client",
                    AllowedGrantTypes = GrantTypes.Implicit,
                    AllowAccessTokensViaBrowser = true,


                    RedirectUris = { $"http://{authorizationServer}:5005/callback.html" },
                    PostLogoutRedirectUris = { $"http://{authorizationServer}:5005/index.html" },
                    AllowedCorsOrigins = { $"http://{authorizationServer}:5005" },

                    AllowedScopes =
                    {
                        IdentityServerConstants.StandardScopes.OpenId,
                        IdentityServerConstants.StandardScopes.Profile,
                        IdentityServerConstants.StandardScopes.Email,
                        "jsreport"
                    }
                }
            };
        }

        public static List<TestUser> GetUsers()
        {
            return new List<TestUser>
            {
                new TestUser
                {
                    SubjectId = "1",
                    Username = "admin",
                    Password = "password",

                    Claims = new List<Claim>
                    {
			            new Claim("username", "admin"),
                        new Claim("name", "Admin"),
                        new Claim("website", "https://admin.com")
                    }
                }
            };
        }
    }
}
