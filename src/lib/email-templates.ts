// GitHub Helper Dashboard-themed email templates

export const REPOSITORY_REPORT_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>{{repository_name}} Development Report</title>
    <style>
        /* Reset and base styles */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
            line-height: 1.6; 
            color: #e1e5f2; 
            background: linear-gradient(135deg, #0f1419 0%, #1a202c 25%, #2d3748 50%, #1a202c 75%, #0f1419 100%);
            margin: 0;
            padding: 20px;
            min-height: 100vh;
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        
        /* Container - Dashboard themed */
        .email-container {
            max-width: 800px;
            margin: 0 auto;
            background: rgba(20, 24, 35, 0.8);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 
                0 8px 32px rgba(0, 0, 0, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.1),
                inset 0 -1px 0 rgba(255, 255, 255, 0.05);
        }
        
        /* Header - Dashboard style */
        .header {
            background: rgba(30, 41, 59, 0.6);
            backdrop-filter: blur(20px);
            padding: 40px 30px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            position: relative;
        }
        
        .logo-container {
            text-align: center;
            margin-bottom: 20px;
        }
        
        .logo {
            width: 120px;
            height: 40px;
            background: #ffffff;
            border-radius: 8px;
            padding: 8px 16px;
            display: inline-block;
        }
        
        .header-title {
            text-align: center;
            font-size: 32px;
            font-weight: 700;
            color: #ffffff;
            margin-bottom: 8px;
            letter-spacing: -0.025em;
        }
        
        .header-subtitle {
            text-align: center;
            color: #94a3b8;
            font-size: 16px;
            font-weight: 500;
        }
        
        /* Content area */
        .content {
            padding: 40px 30px;
        }
        
        .section {
            margin-bottom: 40px;
        }
        
        .section-header {
            margin-bottom: 24px;
        }
        
        .section-title {
            font-size: 24px;
            font-weight: 600;
            color: #ffffff;
            margin-bottom: 8px;
            letter-spacing: -0.025em;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .section-icon {
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
        }
        
        .section-description {
            color: #94a3b8;
            font-size: 14px;
        }
        
        /* Stats Grid - Dashboard style */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: rgba(20, 24, 35, 0.7);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 16px;
            padding: 24px;
            transition: all 0.2s ease;
        }
        
        .stat-card:hover {
            transform: translateY(-2px);
            box-shadow: 
                0 12px 40px rgba(0, 0, 0, 0.4),
                0 0 20px rgba(59, 130, 246, 0.2);
        }
        
        .stat-header {
            display: flex;
            items: center;
            justify-content: space-between;
            margin-bottom: 16px;
        }
        
        .stat-icon {
            width: 40px;
            height: 40px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            color: #ffffff;
        }
        
        .stat-value {
            font-size: 28px;
            font-weight: 800;
            color: #ffffff;
            line-height: 1;
            margin-bottom: 4px;
        }
        
        .stat-label {
            font-size: 12px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 600;
        }
        
        .stat-change {
            font-size: 11px;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: 500;
        }
        
        .stat-change.positive {
            color: #10b981;
            background: rgba(16, 185, 129, 0.1);
        }
        
        /* Content Cards */
        .content-card {
            background: rgba(30, 41, 59, 0.5);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 20px;
        }
        
        .content-text {
            color: #e1e5f2;
            font-size: 15px;
            line-height: 1.7;
            margin-bottom: 16px;
        }
        
        .content-text strong {
            color: #ffffff;
            font-weight: 600;
        }
        
        .highlight-box {
            background: rgba(59, 130, 246, 0.1);
            border: 1px solid rgba(59, 130, 246, 0.2);
            border-radius: 12px;
            padding: 16px;
            margin: 20px 0;
        }
        
        .highlight-text {
            color: #93c5fd;
            font-size: 14px;
            font-weight: 500;
        }
        
        /* Technology Grid */
        .tech-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 16px;
        }
        
        .tech-item {
            background: rgba(51, 65, 85, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 16px;
            text-align: center;
            transition: all 0.2s ease;
        }
        
        .tech-item:hover {
            border-color: rgba(59, 130, 246, 0.3);
            background: rgba(59, 130, 246, 0.05);
        }
        
        .tech-name {
            color: #ffffff;
            font-weight: 600;
            margin-bottom: 4px;
            font-size: 14px;
        }
        
        .tech-percentage {
            color: #3b82f6;
            font-weight: 700;
            font-size: 18px;
        }
        
        /* Team Grid */
        .team-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
        }
        
        .team-card {
            background: rgba(20, 24, 35, 0.7);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            transition: all 0.2s ease;
        }
        
        .team-card:hover {
            transform: translateY(-2px);
            border-color: rgba(59, 130, 246, 0.3);
        }
        
        .team-avatar {
            width: 48px;
            height: 48px;
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-weight: 700;
            font-size: 18px;
            margin: 0 auto 12px;
        }
        
        .team-name {
            color: #ffffff;
            font-weight: 600;
            margin-bottom: 6px;
            font-size: 14px;
        }
        
        .team-stats {
            color: #94a3b8;
            font-size: 12px;
        }
        
        /* List styles */
        .feature-list {
            list-style: none;
            padding: 0;
            margin: 16px 0;
        }
        
        .feature-list li {
            color: #e1e5f2;
            padding: 8px 0;
            padding-left: 24px;
            position: relative;
            font-size: 14px;
        }
        
        .feature-list li::before {
            content: '→';
            position: absolute;
            left: 0;
            color: #3b82f6;
            font-weight: bold;
        }
        
        /* Footer */
        .footer {
            background: rgba(15, 20, 25, 0.8);
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            padding: 30px;
            text-align: center;
        }
        
        .footer-title {
            color: #ffffff;
            font-weight: 600;
            margin-bottom: 8px;
        }
        
        .footer-text {
            color: #94a3b8;
            font-size: 14px;
            line-height: 1.6;
            margin-bottom: 20px;
        }
        
        .footer-divider {
            height: 1px;
            background: rgba(255, 255, 255, 0.1);
            margin: 20px 0;
        }
        
        .copyright {
            color: #64748b;
            font-size: 12px;
        }
        
        /* Responsive */
        @media only screen and (max-width: 600px) {
            .email-container {
                margin: 10px;
                border-radius: 16px;
            }
            
            .header, .content, .footer {
                padding-left: 20px;
                padding-right: 20px;
            }
            
            .stats-grid, .tech-grid, .team-grid {
                grid-template-columns: 1fr;
            }
            
            .header-title {
                font-size: 24px;
            }
            
            .section-title {
                font-size: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <div class="logo-container">
                <div class="logo">
                    <!-- Using text logo that matches your site -->
                    <div style="color: #1a202c; font-weight: 700; font-size: 16px; line-height: 24px;">GitHub Helper</div>
                </div>
            </div>
            <h1 class="header-title">Development Report</h1>
            <p class="header-subtitle">{{repository_name}} • {{period_start}} to {{period_end}}</p>
        </div>
        
        <div class="content">
            <!-- Executive Summary -->
            <div class="section">
                <div class="section-header">
                    <h2 class="section-title">
                        <div class="section-icon">📊</div>
                        Executive Summary
                    </h2>
                    <p class="section-description">Here's what happened with your repository this week</p>
                </div>
                
                <div class="content-card">
                    <div class="content-text">
                        <strong>{{repository_name}}</strong> has seen solid development activity this period. The team made <strong>{{commit_count}} commits</strong> with <strong>{{total_lines_changed}} lines changed</strong>, successfully resolving <strong>{{issues_resolved}} issues</strong> and merging <strong>{{prs_merged}} pull requests</strong>.
                    </div>
                    <div class="content-text">
                        Code quality metrics remain strong with a <strong>{{maintainability_index}}%</strong> maintainability index and <strong>{{test_coverage}}%</strong> test coverage. The security score is at <strong>{{security_score}}%</strong> with technical debt maintained at <strong>{{technical_debt_ratio}}%</strong>.
                    </div>
                    
                    <div class="highlight-box">
                        <div class="highlight-text">
                            ⭐ Key Achievement: Maintained excellent code quality while delivering {{avg_commits_per_day}} commits per day on average.
                        </div>
                    </div>
                </div>
            </div>

            <!-- Key Metrics -->
            <div class="section">
                <div class="section-header">
                    <h2 class="section-title">
                        <div class="section-icon">📈</div>
                        Key Performance Metrics
                    </h2>
                    <p class="section-description">Development activity and code quality indicators</p>
                </div>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-header">
                            <div class="stat-icon" style="background: linear-gradient(135deg, #3b82f6, #1d4ed8);">📝</div>
                        </div>
                        <div class="stat-value">{{commit_count}}</div>
                        <div class="stat-label">Commits</div>
                        <div class="stat-change positive">{{avg_commits_per_day}}/day avg</div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-header">
                            <div class="stat-icon" style="background: linear-gradient(135deg, #10b981, #059669);">⚡</div>
                        </div>
                        <div class="stat-value">{{total_lines_changed}}</div>
                        <div class="stat-label">Lines Changed</div>
                        <div class="stat-change positive">+{{total_lines_added}} -{{total_lines_removed}}</div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-header">
                            <div class="stat-icon" style="background: linear-gradient(135deg, #8b5cf6, #7c3aed);">🐛</div>
                        </div>
                        <div class="stat-value">{{issues_resolved}}</div>
                        <div class="stat-label">Issues Resolved</div>
                        <div class="stat-change positive">Excellent progress</div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-header">
                            <div class="stat-icon" style="background: linear-gradient(135deg, #f59e0b, #d97706);">🔀</div>
                        </div>
                        <div class="stat-value">{{prs_merged}}</div>
                        <div class="stat-label">PRs Merged</div>
                        <div class="stat-change positive">Strong collaboration</div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-header">
                            <div class="stat-icon" style="background: linear-gradient(135deg, #ef4444, #dc2626);">📊</div>
                        </div>
                        <div class="stat-value">{{lines_of_code}}</div>
                        <div class="stat-label">Total Lines</div>
                        <div class="stat-change positive">High-quality codebase</div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-header">
                            <div class="stat-icon" style="background: linear-gradient(135deg, #06b6d4, #0891b2);">🛡️</div>
                        </div>
                        <div class="stat-value">{{maintainability_index}}%</div>
                        <div class="stat-label">Maintainability</div>
                        <div class="stat-change positive">Excellent health</div>
                    </div>
                </div>
            </div>

            <!-- Technology Stack -->
            <div class="section">
                <div class="section-header">
                    <h2 class="section-title">
                        <div class="section-icon">🔧</div>
                        Technology Stack
                    </h2>
                    <p class="section-description">Language composition and technology distribution</p>
                </div>
                
                <div class="tech-grid">
                    {{#each language_breakdown}}
                    <div class="tech-item">
                        <div class="tech-name">{{language}}</div>
                        <div class="tech-percentage">{{percentage}}%</div>
                    </div>
                    {{/each}}
                </div>
            </div>

            <!-- Team Performance -->
            <div class="section">
                <div class="section-header">
                    <h2 class="section-title">
                        <div class="section-icon">👥</div>
                        Team Performance
                    </h2>
                    <p class="section-description">Top contributors and collaboration metrics</p>
                </div>
                
                <div class="content-card">
                    <div class="content-text">
                        Our development team shows strong collaborative patterns with <strong>{{total_contributors}} total contributors</strong> and <strong>{{active_contributors}} actively participating</strong>. The bus factor of <strong>{{bus_factor}}</strong> indicates healthy knowledge distribution.
                    </div>
                </div>
                
                <div class="team-grid">
                    {{#each top_contributors}}
                    <div class="team-card">
                        <div class="team-avatar">{{author.[0]}}</div>
                        <div class="team-name">{{author}}</div>
                        <div class="team-stats">{{commit_count}} commits • {{lines_added}} lines</div>
                    </div>
                    {{/each}}
                </div>
            </div>

            <!-- Key Focus Areas -->
            <div class="section">
                <div class="section-header">
                    <h2 class="section-title">
                        <div class="section-icon">🎯</div>
                        Development Focus
                    </h2>
                    <p class="section-description">Most active files and development priorities</p>
                </div>
                
                <div class="content-card">
                    <div class="content-text">
                        <strong>Active Development Areas:</strong> The following components received the most attention, indicating current development priorities:
                    </div>
                    <ul class="feature-list">
                        {{#each most_active_files}}
                        <li>{{this}}</li>
                        {{/each}}
                    </ul>
                    <div class="content-text">
                        This activity pattern shows focused development on core functionality and system improvements.
                    </div>
                </div>
            </div>

            <!-- Recommendations -->
            {{#if recommendations}}
            <div class="section">
                <div class="section-header">
                    <h2 class="section-title">
                        <div class="section-icon">💡</div>
                        Recommendations
                    </h2>
                    <p class="section-description">Strategic suggestions for continued improvement</p>
                </div>
                
                <div class="content-card">
                    <ul class="feature-list">
                        {{#each recommendations}}
                        <li>{{this}}</li>
                        {{/each}}
                    </ul>
                </div>
            </div>
            {{/if}}
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <h3 class="footer-title">{{company_name}}</h3>
            <p class="footer-text">
                This automated development report helps you stay informed about your team's progress and make data-driven decisions.
            </p>
            
            <div class="footer-divider"></div>
            
            <p class="copyright">
                © 2024 {{company_name}}. All rights reserved.<br>
                Powered by GitHub Helper AI Assistant
            </p>
        </div>
    </div>
</body>
</html>`;

export const ALERT_EMAIL_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{alert_type}} Alert - {{repository_name}}</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: linear-gradient(135deg, #0f1419 0%, #1a202c 25%, #2d3748 50%, #1a202c 75%, #0f1419 100%);
            color: #e1e5f2;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: rgba(20, 24, 35, 0.8); 
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 16px; 
            overflow: hidden; 
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        .header { 
            background: rgba(239, 68, 68, 0.1); 
            border-bottom: 1px solid rgba(239, 68, 68, 0.2);
            padding: 30px; 
            text-align: center; 
            color: #ffffff; 
        }
        .content { 
            padding: 30px; 
        }
        .alert-box { 
            background: rgba(239, 68, 68, 0.1); 
            border-left: 4px solid #ef4444; 
            padding: 20px; 
            border-radius: 0 8px 8px 0; 
            margin: 20px 0; 
        }
        .footer { 
            background: rgba(15, 20, 25, 0.8); 
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            color: #94a3b8; 
            padding: 20px; 
            text-align: center; 
            font-size: 14px; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚨 Alert Notification</h1>
            <p>{{repository_name}} • {{timestamp}}</p>
        </div>
        <div class="content">
            <div class="alert-box">
                <h2>{{alert_type}} Alert</h2>
                <p>{{alert_message}}</p>
            </div>
            <p>Please review and take appropriate action.</p>
        </div>
        <div class="footer">
            <p>© 2024 {{company_name}} • Powered by GitHub Helper</p>
        </div>
    </div>
</body>
</html>`;

export const EMAIL_TEMPLATES = {
  repository_report: REPOSITORY_REPORT_TEMPLATE,
  alert: ALERT_EMAIL_TEMPLATE
};

// Email template renderer utility
export class EmailTemplateRenderer {
  static render(template: string, variables: Record<string, any>): string {
    let rendered = template;
    
    // Simple Handlebars-like variable replacement
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, String(value));
    });
    
    // Handle each loops (basic implementation)
    rendered = rendered.replace(/{{#each (\w+)}}([\s\S]*?){{\/each}}/g, (match, arrayName, content) => {
      const array = variables[arrayName];
      if (!Array.isArray(array)) return '';
      
      return array.map((item, index) => {
        let itemContent = content;
        
        // Replace {{this}} with the item itself (if primitive)
        if (typeof item !== 'object') {
          itemContent = itemContent.replace(/{{this}}/g, String(item));
        } else {
          // Replace {{property}} with item.property
          Object.entries(item).forEach(([prop, val]) => {
            const propRegex = new RegExp(`{{${prop}}}`, 'g');
            itemContent = itemContent.replace(propRegex, String(val));
          });
        }
        
        return itemContent;
      }).join('');
    });
    
    // Handle conditional blocks (basic implementation)
    rendered = rendered.replace(/{{#if (\w+)}}([\s\S]*?){{\/if}}/g, (match, variableName, content) => {
      const value = variables[variableName];
      return (value && (Array.isArray(value) ? value.length > 0 : true)) ? content : '';
    });
    
    return rendered;
  }
}