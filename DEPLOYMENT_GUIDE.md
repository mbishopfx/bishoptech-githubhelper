# GitHub Agent Dashboard - Deployment Guide

A comprehensive guide to deploy your AI-powered GitHub repository management system to Vercel.

## 🚀 Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/github-agent-dashboard)

## 📋 Prerequisites

Before deployment, ensure you have:

- [x] **Vercel Account** - [Sign up](https://vercel.com/signup)
- [x] **Supabase Project** - [Create project](https://supabase.com/dashboard)
- [x] **OpenAI API Key** - [Get key](https://platform.openai.com/api-keys)
- [x] **GitHub Personal Access Token** - [Create token](https://github.com/settings/tokens)
- [x] **Slack App** (Optional) - [Create app](https://api.slack.com/apps)

## 🗄️ Database Setup

### 1. Create Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose organization and fill project details
4. Wait for setup to complete (~2 minutes)

### 2. Run Database Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy the contents of `/database/schema.sql`
3. Paste and execute the SQL
4. Verify tables are created successfully

### 3. Configure Row Level Security (RLS)

The schema automatically sets up RLS policies, but verify:

```sql
-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;
```

## 🔧 Environment Configuration

### 1. Required Environment Variables

Create these environment variables in your Vercel dashboard:

#### **OpenAI Configuration**
```bash
OPENAI_API_KEY=sk-your-openai-api-key-here
```

#### **Supabase Configuration**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### **GitHub Integration**
```bash
GITHUB_TOKEN=ghp_your-github-personal-access-token
```

#### **Authentication** (Optional)
```bash
NEXTAUTH_SECRET=your-nextauth-secret-key
NEXTAUTH_URL=https://your-domain.vercel.app
```

#### **Slack Integration** (Optional)
```bash
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
SLACK_SIGNING_SECRET=your-slack-signing-secret
```

### 2. Generate Secrets

```bash
# Generate NextAuth Secret
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 🚀 Vercel Deployment

### Method 1: Deploy with Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from project directory
cd github-agent-dashboard
vercel --prod

# Set environment variables
vercel env add OPENAI_API_KEY production
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# ... add all other variables
```

### Method 2: Deploy via GitHub

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Configure environment variables
   - Deploy

### Method 3: Deploy Button

Use the deploy button at the top of this guide for one-click deployment.

## ⚙️ Post-Deployment Configuration

### 1. Verify Deployment

Visit your deployed URL and check:
- [ ] Landing page loads correctly
- [ ] Dashboard redirects to overview
- [ ] Glassmorphic UI renders properly
- [ ] No console errors

### 2. Test API Endpoints

```bash
# Health check
curl https://your-app.vercel.app/api/health

# Test Slack webhook (should return endpoint info)
curl https://your-app.vercel.app/api/slack/events
```

### 3. Configure Slack Integration

If using Slack integration:

1. **Update Slack App Manifest**
   - Go to Dashboard → Settings → Slack
   - Generate manifest with your production URL
   - Update your Slack app configuration

2. **Set Webhook URLs**
   ```
   Request URL: https://your-app.vercel.app/api/slack/events
   ```

3. **Test Slack Commands**
   ```
   /repo-analyze owner/repository-name
   ```

## 🔐 Security Configuration

### 1. Supabase RLS Policies

Ensure your RLS policies are properly configured:

```sql
-- Example: Users can only see their own data
CREATE POLICY "Users can manage own repositories" 
ON repositories FOR ALL 
USING (auth.uid() = user_id);
```

### 2. API Rate Limiting

Consider adding rate limiting for production:

```typescript
// In your API routes
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});
```

### 3. Environment Security

- Never commit `.env` files
- Use Vercel's environment variables UI
- Rotate keys regularly
- Monitor API usage

## 📊 Monitoring & Analytics

### 1. Vercel Analytics

Enable Vercel Analytics:
```bash
npm install @vercel/analytics
```

Add to your app:
```typescript
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### 2. Error Monitoring

Consider integrating Sentry:
```bash
npm install @sentry/nextjs
```

### 3. Performance Monitoring

Monitor key metrics:
- API response times
- Database query performance
- User engagement
- Error rates

## 🔄 CI/CD Pipeline

### Automated Deployment

Set up automatic deployments:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 🐛 Troubleshooting

### Common Issues

#### **Build Failures**

```bash
# Check Node.js version
node --version  # Should be 18+

# Clear Next.js cache
rm -rf .next
npm run build
```

#### **Environment Variable Issues**

```bash
# Verify environment variables
vercel env ls

# Test locally
vercel dev
```

#### **Database Connection Issues**

```bash
# Test Supabase connection
curl -H "apikey: YOUR_ANON_KEY" \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     https://your-project.supabase.co/rest/v1/
```

#### **Slack Integration Issues**

1. Check webhook URL is accessible
2. Verify signing secret matches
3. Test with Slack's webhook tester

### Debug Mode

Enable debug logging:

```bash
# Add to environment variables
DEBUG=*
NEXT_DEBUG=1
```

## 📈 Performance Optimization

### 1. Next.js Optimizations

```javascript
// next.config.js
module.exports = {
  experimental: {
    optimizeCss: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  images: {
    formats: ['image/webp', 'image/avif'],
  },
};
```

### 2. Database Optimizations

```sql
-- Add indexes for better performance
CREATE INDEX CONCURRENTLY idx_repositories_user_updated 
ON repositories(user_id, updated_at DESC);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM repositories WHERE user_id = $1;
```

### 3. Caching Strategy

- Use Vercel's Edge Network
- Implement Redis caching for API responses
- Cache AI model responses when possible

## 🛡️ Backup & Recovery

### Database Backups

Supabase automatically backs up your database, but consider:

1. **Manual Backups**
   ```bash
   # Export via Supabase CLI
   supabase db dump --file backup.sql
   ```

2. **Automated Backups**
   - Set up scheduled backups
   - Store in multiple locations
   - Test recovery procedures

### Configuration Backups

- Export environment variables
- Document all integrations
- Keep deployment notes updated

## 📚 Additional Resources

- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Vercel Platform Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)

## 🆘 Support

Need help? Here's how to get support:

- 📧 **Email**: support@github-agent-dashboard.com
- 💬 **Discord**: [Join our community](https://discord.gg/github-agent)
- 📖 **Documentation**: [docs.github-agent-dashboard.com](https://docs.github-agent-dashboard.com)
- 🐛 **Issues**: [GitHub Issues](https://github.com/yourusername/github-agent-dashboard/issues)

---

**🎉 Congratulations!** Your GitHub Agent Dashboard is now deployed and ready to revolutionize how you manage your repositories with AI-powered insights and automation.
