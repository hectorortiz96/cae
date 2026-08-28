package com.cae.reports.config;

import com.cae.reports.service.JwtService;
import jakarta.annotation.Nonnull;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.servlet.HandlerExceptionResolver;

import java.io.IOException;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {
    //Handles exceptions gracefully (returns proper error responses)
    private final HandlerExceptionResolver handlerExceptionResolver;
    //Extracts data from JWT and validates tokens
    private final JwtService jwtService;
    //Loads user from database for authentication
    private final UserDetailsService userDetailsService;

    public JwtAuthFilter(
            JwtService jwtService,
            UserDetailsService userDetailsService,
            HandlerExceptionResolver handlerExceptionResolver
    ) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
        this.handlerExceptionResolver = handlerExceptionResolver;
    }

    @Override
    protected void doFilterInternal(
            @Nonnull HttpServletRequest request,
            @Nonnull HttpServletResponse response,
            @Nonnull FilterChain filterChain
    ) throws ServletException, IOException {
        //Step 1: Check for Authorization header
        final String authHeader = request.getHeader("Authorization");
        //If missing or doesn't start with "Bearer " → skip authentication, continue to next filter
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            //This allows public endpoints to work without a token
            filterChain.doFilter(request, response);
            return;
        }

        try {
            //Step 2: Extract the token and username
            //Removes "Bearer " prefix (7 characters)
            final String jwt = authHeader.substring(7);
            //Extract the username/email from the JWT payload
            final String username = jwtService.extractUsername(jwt);

            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

            //Step 3: Check if authentication is needed
            //Only proceed if we have a username AND user isn't already authenticated
            //Prevents re-authenticating on every request in the same session
            if (username != null && authentication == null) {
                //Step 4: Load user and validate token
                //Fetch user from database
                UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);

                //Verify token belongs to this user AND isn't expired
                if (jwtService.isTokenValid(jwt, userDetails)) {
                    //Step 5: Set authentication in security context
                    //Create authentication token with user details and authorities
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );
                    //Attach request details (IP address, session ID, etc.)
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    //Store in SecurityContextHolder → user is now authenticated for this request
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
            //Step 6: Continue filter chain
            //Pass request to next filter/controller
            filterChain.doFilter(request, response);
        } catch (Exception exception) {
            //Error Handling: If anything fails (invalid token, expired, etc.), delegate to exception resolver for proper error response.
            handlerExceptionResolver.resolveException(request, response, null, exception);
        }
    }
}
