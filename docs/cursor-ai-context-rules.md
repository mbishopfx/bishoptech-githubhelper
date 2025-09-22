# Cursor AI Context Enhancement Rules

## Overview
These rules help AI assistants better understand your codebase, development patterns, and project context. Add these to your `.cursorrules` file for enhanced AI collaboration.

## Project Context Rules

### Architecture Understanding
```markdown
# Project Architecture
This is a Next.js 15 application with the following key components:

## Tech Stack
- Framework: Next.js 15 with TypeScript
- AI/ML: OpenAI GPT-4o, LangChain, LangGraph
- Database: Supabase (PostgreSQL)
- Styling: Tailwind CSS, Framer Motion
- APIs: GitHub API (Octokit), RESTful endpoints
- Authentication: Single-user system with API keys
- Deployment: Vercel

## System Architecture
- Single-User Personal System (not multi-tenant)
- API-first design with comprehensive endpoints
- Real-time streaming AI responses
- GitHub repository integration for analysis
- AI-powered task generation and project management

## Key Patterns
- All API routes use single-user authentication
- Glassmorphic UI design with dark theme
- Streaming responses for AI interactions
- Repository-aware AI context
- Environment-based configuration
```

### Development Guidelines
```markdown
# Development Guidelines

## Code Style
- Use TypeScript for all new code
- Prefer server components over client components
- Use Tailwind CSS for styling with custom glassmorphic classes
- Implement proper error handling with try-catch blocks
- Use environment variables for all configuration

## File Organization
- API routes in `/src/app/api/` with proper versioning (`/v1/`)
- UI components in `/src/app/dashboard/`
- Utilities and helpers in `/src/lib/`
- Database schemas in `/database/` directory
- Documentation in `/docs/` directory

## Database Patterns
- Use Supabase client with Row Level Security (RLS)
- Single user ID: `550e8400-e29b-41d4-a716-446655440000`
- Proper error handling for database operations
- Use typed database queries with TypeScript

## AI Integration Patterns
- Stream responses for better UX
- Provide comprehensive context to AI models
- Use repository data for AI analysis
- Implement proper rate limiting for AI services
```

### API Design Rules
```markdown
# API Design Standards

## Endpoint Structure
- Use `/api/v1/` for all public API endpoints
- RESTful design with proper HTTP methods
- Consistent response format with success/error handling
- Include rate limiting and authentication headers

## Response Format
All API responses should follow this structure:
```json
{
  "success": true/false,
  "data": {...},
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "status": 400
  },
  "timestamp": "ISO 8601 timestamp",
  "api_version": "1.0"
}
```

## Authentication
- Single-user system (no userId parameters needed)
- API keys supported for external integrations
- CORS enabled for cross-origin requests
- Rate limiting: 10,000 requests/day for personal use

## Error Handling
- Use proper HTTP status codes
- Provide descriptive error messages
- Include error codes for programmatic handling
- Log errors with sufficient context for debugging
```

## AI Assistance Rules

### Context Awareness
```markdown
# AI Context Guidelines

When providing assistance:
1. Remember this is a single-user personal system
2. All repositories belong to the same user (BishopTech/mbishopfx)
3. System is branded as "GitHub Helper" not "GitHub Agent Dashboard"
4. Focus on personal productivity and project management
5. Maintain glassmorphic dark theme consistency
6. Consider GitHub API integration for repository data

## Project Goals
- Personal AI-powered project management
- Cursor IDE integration for development workflows
- Repository analysis and intelligent insights
- Automated task generation and tracking
- Professional deployment capability

## User Preferences
- Dark theme with glassmorphic elements
- Streaming responses for AI interactions
- Minimal configuration complexity
- Professional but personal branding
- Integration with existing development tools
```

### Code Generation Guidelines
```markdown
# Code Generation Best Practices

## UI Components
- Use Tailwind CSS with glassmorphic design patterns
- Implement Framer Motion animations for interactions
- Follow Next.js 15 best practices
- Use TypeScript for all components
- Implement proper loading and error states

## API Endpoints
- Include proper error handling
- Use single-user authentication pattern
- Implement rate limiting considerations
- Follow RESTful conventions
- Provide comprehensive API documentation

## Database Operations
- Use Supabase client with proper error handling
- Implement proper TypeScript typing
- Consider performance implications
- Use single-user filtering where appropriate
- Implement proper data validation

## AI Integration
- Provide comprehensive context to AI models
- Implement streaming for better user experience
- Use repository data for enhanced analysis
- Consider token limits and costs
- Implement proper fallback handling
```

## Debugging and Maintenance

### Common Issues
```markdown
# Troubleshooting Guidelines

## Common Patterns
- Check single-user configuration if authentication fails
- Verify environment variables are properly set
- Ensure API keys have sufficient permissions
- Check rate limits if AI features fail
- Verify database connectivity and RLS policies

## Debugging Tools
- Use browser developer tools for client-side issues
- Check Vercel logs for deployment issues
- Monitor API response times and error rates
- Use Supabase dashboard for database queries
- Check OpenAI usage and rate limits

## Performance Monitoring
- Monitor API response times
- Check database query performance
- Track AI token usage and costs
- Monitor Vercel deployment metrics
- Watch for rate limiting issues
```

### Deployment Considerations
```markdown
# Deployment Best Practices

## Vercel Configuration
- Use environment variables for all secrets
- Configure proper CORS headers
- Set up custom domains if needed
- Monitor deployment logs and metrics
- Use proper caching strategies

## Database Management
- Regular backups of Supabase data
- Monitor database performance metrics
- Keep schemas updated with migrations
- Use proper indexing for performance
- Monitor storage usage and costs

## Security Considerations
- Rotate API keys regularly
- Use environment variables for secrets
- Implement proper CORS policies
- Monitor for unusual API usage patterns
- Keep dependencies updated
```

These rules provide comprehensive context for AI assistants to understand your project structure, development patterns, and maintenance requirements.
