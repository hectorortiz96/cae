package com.cae.reports.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

//Typical Flow
//Login: User authenticates → generateToken() creates JWT → returned to client
//Requests: Client sends JWT in header → extractUsername() identifies user → isTokenValid() verifies authenticity
//Expiry: After 1 hour, isTokenExpired() returns true → user must re-authenticate

@Service
public class JwtService {
    @Value("${security.jwt.secret-key}")
    private String secretKey;

    @Value("${security.jwt.expiration-time}")
    private long jwtExpiration;

    //Creates a JWT with just the user info
    public String generateToken(UserDetails userDetails) {
        return generateToken(new HashMap<>(), userDetails);
    }

    //Creates a JWT with extra custom claims
    public String generateToken(Map<String, Object> extraClaims, UserDetails userDetails) {
        return buildToken(extraClaims, userDetails, jwtExpiration);
    }

    public long getExpirationTime() {
        return jwtExpiration;
    }

    //Core builder that constructs the actual JWT
    //Token Structure Built:
    // Header: { alg: HS256 }
    // Payload: {
    //    sub: "username",          // Subject (from UserDetails)
    //    iat: 1234567890,          // Issued at timestamp
    //    exp: 1234571490,          // Expiration timestamp
    //    ...extraClaims            // Any additional data
    // }
    // Signature: HMAC-SHA256(header + payload, secretKey)
    private String buildToken(
            Map<String, Object> extraClaims,
            UserDetails userDetails,
            long expiration
    ) {
        return Jwts
                .builder()
                .setClaims(extraClaims)
                .setSubject(userDetails.getUsername())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSignInKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    //Checks if token belongs to user AND isn't expired
    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername())) && !isTokenExpired(token);
    }

    //Checks if current time is past expiration
    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    //Extracts username from token
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    // Generic method to extract any claim from the token using a resolver function
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    //Extracts expiration date from token
    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    //Parses the JWT and retrieves all claims (payload data)
    private Claims extractAllClaims(String token) {
        return Jwts
                .parserBuilder()
                .setSigningKey(getSignInKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private Key getSignInKey() {
        //Decode Base64 string
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        //Create HMAC key
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
