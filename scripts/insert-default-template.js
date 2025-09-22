const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function insertDefaultTemplate() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
  }
  
  console.log('🔗 Connecting to Supabase...');
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  console.log('📧 Inserting default email template...');
  
  // Read the template from the email-templates.ts file
  const templateHtml = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{repository_name}} Repository Report</title>
    <!-- Professional Email CSS - Comprehensive styling for enterprise reports -->
    <style>
        /* Base Styles */
        body, table, td, p, div, span {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        
        body {
            background-color: #f8fafc;
            color: #1a202c;
            font-size: 16px;
        }
        
        /* Layout Container */
        .email-container {
            max-width: 800px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        
        /* Header Section */
        .header {
            background: linear-gradient(135deg, #1a202c 0%, #2d3748 50%, #4a5568 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
            position: relative;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(45deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
        }
        
        .header-content {
            position: relative;
            z-index: 2;
        }
        
        .logo {
            max-width: 180px;
            height: auto;
            margin-bottom: 20px;
            filter: brightness(1.1);
        }
        
        .header h1 {
            color: white;
            margin: 0;
            font-size: 32px;
            font-weight: 700;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        .header .subtitle {
            color: rgba(255, 255, 255, 0.85);
            margin: 10px 0 0;
            font-size: 18px;
            font-weight: 400;
        }
        
        /* Content Section */
        .content {
            padding: 40px 30px;
        }
        
        .section {
            margin-bottom: 40px;
        }
        
        .section-title {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 24px;
            font-weight: 700;
            color: #1a202c;
            margin-bottom: 24px;
            padding-bottom: 12px;
            border-bottom: 3px solid #e2e8f0;
        }
        
        .section-emoji {
            font-size: 28px;
        }
        
        /* Metrics Grid */
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .metric-card {
            background: linear-gradient(135deg, #f8fafc, #f1f5f9);
            border-radius: 12px;
            padding: 24px;
            text-align: center;
            border: 1px solid #e2e8f0;
            border-left: 4px solid {{primary_color}};
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        
        .metric-card::before {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            width: 40px;
            height: 40px;
            background: linear-gradient(45deg, {{primary_color}}, rgba(59, 130, 246, 0.3));
            border-radius: 0 12px 0 40px;
        }
        
        .metric-value {
            font-size: 36px;
            font-weight: 800;
            color: {{primary_color}};
            margin-bottom: 8px;
            text-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .metric-label {
            font-size: 14px;
            font-weight: 600;
            color: #4a5568;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .metric-sublabel {
            font-size: 12px;
            color: #718096;
            margin-top: 4px;
        }
        
        /* Activity Metrics */
        .activity-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 15px;
            margin-bottom: 25px;
        }
        
        .activity-card {
            background: linear-gradient(135deg, #fef5e7, #fed7aa);
            border-radius: 10px;
            padding: 20px;
            text-align: center;
            border-left: 4px solid #f59e0b;
        }
        
        .activity-value {
            font-size: 28px;
            font-weight: 700;
            color: #92400e;
            margin-bottom: 5px;
        }
        
        .activity-label {
            font-size: 13px;
            font-weight: 600;
            color: #b45309;
            text-transform: uppercase;
        }
        
        /* Language Breakdown */
        .language-breakdown {
            background: #f7fafc;
            border-radius: 12px;
            padding: 25px;
            border: 1px solid #e2e8f0;
        }
        
        .language-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            font-weight: 600;
        }
        
        .language-name {
            color: #2d3748;
        }
        
        .language-percentage {
            color: {{primary_color}};
            font-weight: 700;
        }
        
        .language-bar {
            height: 8px;
            background-color: #e2e8f0;
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 15px;
        }
        
        .language-bar-fill {
            height: 100%;
            background: linear-gradient(90deg, {{primary_color}}, #6366f1);
            border-radius: 4px;
            transition: width 0.3s ease;
        }
        
        /* Quality Metrics */
        .quality-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
            gap: 18px;
            margin-bottom: 25px;
        }
        
        .quality-card {
            background: linear-gradient(135deg, #eff6ff, #dbeafe);
            border-radius: 10px;
            padding: 18px;
            text-align: center;
            border-left: 4px solid #3b82f6;
            position: relative;
        }
        
        .quality-score {
            font-size: 24px;
            font-weight: 700;
            color: #1e40af;
            margin-bottom: 5px;
        }
        
        .quality-metric {
            font-size: 12px;
            font-weight: 600;
            color: #3730a3;
            text-transform: uppercase;
        }
        
        /* File Activity List */
        .file-list {
            background: #f9fafb;
            border-radius: 10px;
            padding: 20px;
            border: 1px solid #e5e7eb;
        }
        
        .file-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #e5e7eb;
            font-family: 'Courier New', monospace;
            font-size: 14px;
        }
        
        .file-item:last-child {
            border-bottom: none;
        }
        
        .file-name {
            color: #374151;
            font-weight: 600;
        }
        
        .file-changes {
            color: {{primary_color}};
            font-weight: 700;
            font-size: 12px;
        }
        
        /* Contributors */
        .contributors-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 25px;
        }
        
        .contributor-card {
            background: linear-gradient(135deg, #f0fdf4, #dcfce7);
            border-radius: 10px;
            padding: 18px;
            border-left: 4px solid #16a34a;
        }
        
        .contributor-name {
            font-weight: 700;
            color: #166534;
            font-size: 16px;
            margin-bottom: 8px;
        }
        
        .contributor-stats {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: #15803d;
        }
        
        .contributor-stat {
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        
        .stat-number {
            font-weight: 700;
            font-size: 14px;
        }
        
        .stat-label {
            font-size: 10px;
            text-transform: uppercase;
            margin-top: 2px;
        }
        
        /* Collaboration Metrics */
        .collaboration-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 15px;
            margin-bottom: 25px;
        }
        
        .collaboration-card {
            background: linear-gradient(135deg, #fef3c7, #fed7aa);
            border-radius: 8px;
            padding: 16px;
            text-align: center;
            border-left: 4px solid #d97706;
        }
        
        .collaboration-value {
            font-size: 22px;
            font-weight: 700;
            color: #92400e;
            margin-bottom: 5px;
        }
        
        .collaboration-label {
            font-size: 11px;
            font-weight: 600;
            color: #b45309;
            text-transform: uppercase;
        }
        
        /* Summary Section */
        .summary-box {
            background: linear-gradient(135deg, #fef3c7, #fde68a);
            border-radius: 12px;
            padding: 25px;
            border-left: 5px solid #f59e0b;
            margin-bottom: 25px;
            position: relative;
        }
        
        .summary-box::before {
            content: '📝';
            position: absolute;
            top: 15px;
            right: 20px;
            font-size: 24px;
        }
        
        .summary-text {
            color: #92400e;
            font-size: 16px;
            line-height: 1.7;
            font-weight: 500;
        }
        
        /* Recommendations */
        .recommendations-list {
            background: #f0f9ff;
            border-radius: 12px;
            padding: 25px;
            border-left: 5px solid #0ea5e9;
        }
        
        .recommendations-list ul {
            margin: 0;
            padding-left: 20px;
        }
        
        .recommendations-list li {
            color: #0c4a6e;
            margin-bottom: 12px;
            font-weight: 500;
            line-height: 1.6;
        }
        
        .recommendations-list li::marker {
            color: #0ea5e9;
        }
        
        /* Footer */
        .footer {
            background: #1a202c;
            color: white;
            padding: 30px;
            text-align: center;
            font-size: 14px;
        }
        
        .footer p {
            margin: 5px 0;
            color: #cbd5e0;
        }
        
        .footer .powered-by {
            font-weight: 600;
            color: {{primary_color}};
        }
        
        /* Responsive Design */
        @media (max-width: 600px) {
            .email-container {
                margin: 10px;
                border-radius: 8px;
            }
            
            .header, .content {
                padding: 20px 15px;
            }
            
            .metrics-grid {
                grid-template-columns: 1fr;
                gap: 15px;
            }
            
            .header h1 {
                font-size: 24px;
            }
            
            .section-title {
                font-size: 20px;
            }
            
            .logo {
                max-width: 120px;
            }
        }
        
        /* Print Styles */
        @media print {
            .email-container {
                box-shadow: none;
                border: 1px solid #e2e8f0;
            }
            
            .header {
                background: #1a202c !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="header-content">
                <img src="{{logo_url}}" alt="{{company_name}}" class="logo">
                <h1>📊 Repository Report</h1>
                <p class="subtitle">{{repository_name}} • {{period_start}} - {{period_end}}</p>
            </div>
        </div>
        
        <div class="content">
            <!-- Repository Overview Section -->
            <div class="section">
                <h2 class="section-title">
                    <span class="section-emoji">🏗️</span>
                    Repository Overview
                </h2>
                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-value">{{total_size_kb}}</div>
                        <div class="metric-label">Repository Size</div>
                        <div class="metric-sublabel">KB</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">{{lines_of_code}}</div>
                        <div class="metric-label">Lines of Code</div>
                        <div class="metric-sublabel">Total</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">{{file_count}}</div>
                        <div class="metric-label">Files</div>
                        <div class="metric-sublabel">Count</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">{{complexity_score}}</div>
                        <div class="metric-label">Complexity</div>
                        <div class="metric-sublabel">Score</div>
                    </div>
                </div>
            </div>

            <!-- Development Activity Section -->
            <div class="section">
                <h2 class="section-title">
                    <span class="section-emoji">⚡</span>
                    Development Activity
                </h2>
                <div class="activity-grid">
                    <div class="activity-card">
                        <div class="activity-value">{{commit_count}}</div>
                        <div class="activity-label">Commits</div>
                    </div>
                    <div class="activity-card">
                        <div class="activity-value">{{total_lines_changed}}</div>
                        <div class="activity-label">Lines Changed</div>
                    </div>
                    <div class="activity-card">
                        <div class="activity-value">{{issues_resolved}}</div>
                        <div class="activity-label">Issues Resolved</div>
                    </div>
                    <div class="activity-card">
                        <div class="activity-value">{{prs_merged}}</div>
                        <div class="activity-label">PRs Merged</div>
                    </div>
                    <div class="activity-card">
                        <div class="activity-value">{{avg_commits_per_day}}</div>
                        <div class="activity-label">Avg Daily Commits</div>
                    </div>
                </div>
            </div>

            <!-- Language Breakdown Section -->
            <div class="section">
                <h2 class="section-title">
                    <span class="section-emoji">🧬</span>
                    Technology Stack
                </h2>
                <div class="language-breakdown">
                    {{#each language_breakdown}}
                    <div class="language-item">
                        <span class="language-name">{{language}}</span>
                        <span class="language-percentage">{{percentage}}%</span>
                    </div>
                    <div class="language-bar">
                        <div class="language-bar-fill" style="width: {{percentage}}%"></div>
                    </div>
                    {{/each}}
                </div>
            </div>

            <!-- Code Quality Section -->
            <div class="section">
                <h2 class="section-title">
                    <span class="section-emoji">💎</span>
                    Code Quality Metrics
                </h2>
                <div class="quality-grid">
                    <div class="quality-card">
                        <div class="quality-score">{{maintainability_index}}</div>
                        <div class="quality-metric">Maintainability</div>
                    </div>
                    <div class="quality-card">
                        <div class="quality-score">{{test_coverage}}%</div>
                        <div class="quality-metric">Test Coverage</div>
                    </div>
                    <div class="quality-card">
                        <div class="quality-score">{{security_score}}%</div>
                        <div class="quality-metric">Security Score</div>
                    </div>
                    <div class="quality-card">
                        <div class="quality-score">{{technical_debt_ratio}}%</div>
                        <div class="quality-metric">Technical Debt</div>
                    </div>
                </div>
            </div>

            <!-- Most Active Files Section -->
            <div class="section">
                <h2 class="section-title">
                    <span class="section-emoji">📁</span>
                    Most Active Files
                </h2>
                <div class="file-list">
                    {{#each most_active_files}}
                    <div class="file-item">
                        <span class="file-name">{{this}}</span>
                        <span class="file-changes">Modified</span>
                    </div>
                    {{/each}}
                </div>
            </div>

            <!-- Development Team Impact -->
            <div class="section">
                <h2 class="section-title">
                    <span class="section-emoji">👥</span>
                    Development Team Impact
                </h2>
                <div class="contributors-grid">
                    {{#each top_contributors}}
                    <div class="contributor-card">
                        <div class="contributor-name">{{author}}</div>
                        <div class="contributor-stats">
                            <div class="contributor-stat">
                                <span class="stat-number">{{commit_count}}</span>
                                <span class="stat-label">Commits</span>
                            </div>
                            <div class="contributor-stat">
                                <span class="stat-number">{{lines_added}}</span>
                                <span class="stat-label">Added</span>
                            </div>
                            <div class="contributor-stat">
                                <span class="stat-number">{{lines_removed}}</span>
                                <span class="stat-label">Removed</span>
                            </div>
                        </div>
                    </div>
                    {{/each}}
                </div>
            </div>

            <!-- Team Collaboration Metrics -->
            <div class="section">
                <h2 class="section-title">
                    <span class="section-emoji">🤝</span>
                    Team Collaboration
                </h2>
                <div class="collaboration-grid">
                    <div class="collaboration-card">
                        <div class="collaboration-value">{{total_contributors}}</div>
                        <div class="collaboration-label">Total Contributors</div>
                    </div>
                    <div class="collaboration-card">
                        <div class="collaboration-value">{{active_contributors}}</div>
                        <div class="collaboration-label">Active Contributors</div>
                    </div>
                    <div class="collaboration-card">
                        <div class="collaboration-value">{{bus_factor}}</div>
                        <div class="collaboration-label">Bus Factor</div>
                    </div>
                    <div class="collaboration-card">
                        <div class="collaboration-value">{{activity_score}}%</div>
                        <div class="collaboration-label">Activity Score</div>
                    </div>
                </div>
            </div>

            <!-- Executive Summary -->
            <div class="section">
                <h2 class="section-title">
                    <span class="section-emoji">📋</span>
                    Executive Summary
                </h2>
                <div class="summary-box">
                    <p class="summary-text">{{summary}}</p>
                </div>
            </div>

            <!-- Recommendations -->
            <div class="section">
                <h2 class="section-title">
                    <span class="section-emoji">🎯</span>
                    Strategic Recommendations
                </h2>
                <div class="recommendations-list">
                    <ul>
                        {{#each recommendations}}
                        <li>{{this}}</li>
                        {{/each}}
                    </ul>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p><strong class="powered-by">Generated by {{company_name}}</strong></p>
            <p>Powered by GitHub Helper • Professional Repository Analytics</p>
            <p>Report generated on {{period_end}}</p>
        </div>
    </div>
</body>
</html>`;

  const { data, error } = await supabase
    .from('email_templates')
    .upsert({
      user_id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Repository Comprehensive Report',
      type: 'repository_report',
      subject: '📊 Repository Report: {{repository_name}} - {{period_start}}',
      html_content: templateHtml,
      text_content: 'Repository Report for {{repository_name}} - Please view HTML version for full details.',
      variables: [
        'repository_name', 'period_start', 'period_end', 'total_size_kb', 'lines_of_code', 
        'file_count', 'complexity_score', 'commit_count', 'total_lines_changed', 'issues_resolved', 
        'prs_merged', 'avg_commits_per_day', 'language_breakdown', 'maintainability_index', 
        'test_coverage', 'security_score', 'technical_debt_ratio', 'most_active_files', 
        'top_contributors', 'total_contributors', 'active_contributors', 'bus_factor', 
        'activity_score', 'summary', 'recommendations', 'company_name', 'logo_url', 'primary_color'
      ],
      is_active: true
    }, {
      onConflict: 'user_id,name'
    });

  if (error) {
    console.error('❌ Error inserting template:', error);
    process.exit(1);
  }

  console.log('✅ Default email template inserted successfully!');
  console.log('📧 Template ID:', data.id);
}

insertDefaultTemplate().catch(console.error);
