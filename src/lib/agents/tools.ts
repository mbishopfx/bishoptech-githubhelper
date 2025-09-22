import { DynamicTool } from '@langchain/core/tools';
import { Octokit } from '@octokit/rest';
import { db } from '@/lib/supabase';
import { Repository, TechStack, GitHubCommit, GitHubIssue, GitHubPullRequest } from '@/types/database';

// Initialize GitHub client
const github = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

// Tool: Fetch repository information from GitHub
export const githubFetchTool = new DynamicTool({
  name: 'github_fetch',
  description: 'Fetches detailed repository information from GitHub API including files, commits, issues, and PRs',
  func: async (input: string) => {
    try {
      const { owner, repo, details } = JSON.parse(input);
      const result: any = {};

      // Get basic repository info
      if (details.includes('basic') || details.includes('all')) {
        const { data } = await github.rest.repos.get({ owner, repo });
        result.repository = data;
      }

      // Get repository contents
      if (details.includes('files') || details.includes('all')) {
        const { data } = await github.rest.repos.getContent({ 
          owner, 
          repo, 
          path: '' 
        });
        result.files = data;
        
        // Get important files content (README, package.json, etc.)
        const importantFiles = ['README.md', 'package.json', 'requirements.txt', 'Dockerfile', '.env.example'];
        result.fileContents = {};
        
        for (const fileName of importantFiles) {
          try {
            const { data: fileData } = await github.rest.repos.getContent({
              owner,
              repo,
              path: fileName
            });
            
            if ('content' in fileData && fileData.content) {
              result.fileContents[fileName] = Buffer.from(fileData.content, 'base64').toString();
            }
          } catch (error) {
            // File doesn't exist, skip
          }
        }
      }

      // Get recent commits
      if (details.includes('commits') || details.includes('all')) {
        const { data } = await github.rest.repos.listCommits({ 
          owner, 
          repo, 
          per_page: 20 
        });
        result.commits = data;
      }

      // Get issues
      if (details.includes('issues') || details.includes('all')) {
        const { data } = await github.rest.issues.listForRepo({ 
          owner, 
          repo, 
          state: 'all',
          per_page: 50 
        });
        result.issues = data;
      }

      // Get pull requests
      if (details.includes('pulls') || details.includes('all')) {
        const { data } = await github.rest.pulls.list({ 
          owner, 
          repo, 
          state: 'all',
          per_page: 30 
        });
        result.pullRequests = data;
      }

      // Get languages
      if (details.includes('languages') || details.includes('all')) {
        const { data } = await github.rest.repos.listLanguages({ owner, repo });
        result.languages = data;
      }

      return JSON.stringify(result);
    } catch (error) {
      return JSON.stringify({ error: `GitHub API error: ${error}` });
    }
  }
});

// Tool: Analyze tech stack from repository files
export const techStackDetectorTool = new DynamicTool({
  name: 'tech_stack_detector',
  description: 'Analyzes repository files to detect technology stack, frameworks, and dependencies',
  func: async (input: string) => {
    try {
      const { files, fileContents } = JSON.parse(input);
      const techStack: TechStack = {
        frameworks: [],
        languages: [],
        databases: [],
        tools: [],
        deployment: [],
        testing: [],
        styling: [],
        apis: [],
      };

      // Analyze package.json for Node.js/JavaScript projects
      if (fileContents['package.json']) {
        const packageJson = JSON.parse(fileContents['package.json']);
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
        
        // Frameworks
        if (dependencies.react) techStack.frameworks.push('React');
        if (dependencies.next) techStack.frameworks.push('Next.js');
        if (dependencies.vue) techStack.frameworks.push('Vue.js');
        if (dependencies.angular) techStack.frameworks.push('Angular');
        if (dependencies.svelte) techStack.frameworks.push('Svelte');
        if (dependencies.express) techStack.frameworks.push('Express.js');
        if (dependencies.fastify) techStack.frameworks.push('Fastify');

        // Styling
        if (dependencies.tailwindcss) techStack.styling.push('Tailwind CSS');
        if (dependencies.sass || dependencies.scss) techStack.styling.push('SASS/SCSS');
        if (dependencies['styled-components']) techStack.styling.push('Styled Components');
        if (dependencies.emotion) techStack.styling.push('Emotion');

        // Testing
        if (dependencies.jest) techStack.testing.push('Jest');
        if (dependencies.cypress) techStack.testing.push('Cypress');
        if (dependencies.playwright) techStack.testing.push('Playwright');
        if (dependencies.vitest) techStack.testing.push('Vitest');

        // Tools
        if (dependencies.typescript) techStack.tools.push('TypeScript');
        if (dependencies.eslint) techStack.tools.push('ESLint');
        if (dependencies.prettier) techStack.tools.push('Prettier');
        if (dependencies.webpack) techStack.tools.push('Webpack');
        if (dependencies.vite) techStack.tools.push('Vite');

        // APIs/Libraries
        if (dependencies.axios) techStack.apis.push('Axios');
        if (dependencies['@supabase/supabase-js']) techStack.databases.push('Supabase');
        if (dependencies.prisma) techStack.databases.push('Prisma');
        if (dependencies.mongoose) techStack.databases.push('MongoDB (Mongoose)');
      }

      // Analyze requirements.txt for Python projects
      if (fileContents['requirements.txt']) {
        const requirements = fileContents['requirements.txt'].split('\n');
        requirements.forEach(req => {
          const pkg = req.split('==')[0].split('>=')[0].split('<=')[0].trim();
          if (pkg.includes('django')) techStack.frameworks.push('Django');
          if (pkg.includes('flask')) techStack.frameworks.push('Flask');
          if (pkg.includes('fastapi')) techStack.frameworks.push('FastAPI');
          if (pkg.includes('pytest')) techStack.testing.push('pytest');
          if (pkg.includes('sqlalchemy')) techStack.databases.push('SQLAlchemy');
        });
        techStack.languages.push('Python');
      }

      // Analyze Dockerfile
      if (fileContents['Dockerfile']) {
        techStack.deployment.push('Docker');
        const dockerfile = fileContents['Dockerfile'];
        if (dockerfile.includes('FROM node')) techStack.languages.push('Node.js');
        if (dockerfile.includes('FROM python')) techStack.languages.push('Python');
        if (dockerfile.includes('FROM golang')) techStack.languages.push('Go');
        if (dockerfile.includes('nginx')) techStack.deployment.push('Nginx');
      }

      // Analyze file extensions
      if (Array.isArray(files)) {
        files.forEach((file: any) => {
          const name = file.name || file.path || '';
          const ext = name.split('.').pop()?.toLowerCase();
          
          switch (ext) {
            case 'js':
            case 'jsx':
              if (!techStack.languages.includes('JavaScript')) {
                techStack.languages.push('JavaScript');
              }
              break;
            case 'ts':
            case 'tsx':
              if (!techStack.languages.includes('TypeScript')) {
                techStack.languages.push('TypeScript');
              }
              break;
            case 'py':
              if (!techStack.languages.includes('Python')) {
                techStack.languages.push('Python');
              }
              break;
            case 'go':
              if (!techStack.languages.includes('Go')) {
                techStack.languages.push('Go');
              }
              break;
            case 'java':
              if (!techStack.languages.includes('Java')) {
                techStack.languages.push('Java');
              }
              break;
            case 'rs':
              if (!techStack.languages.includes('Rust')) {
                techStack.languages.push('Rust');
              }
              break;
          }
        });
      }

      return JSON.stringify(techStack);
    } catch (error) {
      return JSON.stringify({ error: `Tech stack analysis error: ${error}` });
    }
  }
});

// Tool: Analyze code quality and repository health
export const codeQualityAssessorTool = new DynamicTool({
  name: 'code_quality_assessor',
  description: 'Assesses repository code quality, documentation, and overall health metrics',
  func: async (input: string) => {
    try {
      const { repository, files, fileContents, commits, issues, pullRequests } = JSON.parse(input);
      
      const assessment = {
        overall_score: 0,
        documentation_score: 0,
        activity_score: 0,
        maintenance_score: 0,
        community_score: 0,
        details: {
          has_readme: false,
          has_license: false,
          has_contributing: false,
          has_tests: false,
          has_ci: false,
          recent_commits: 0,
          open_issues_ratio: 0,
          pr_merge_rate: 0,
          bus_factor: 0,
        },
        recommendations: [] as string[],
      };

      // Documentation assessment
      let docScore = 0;
      if (fileContents['README.md']) {
        assessment.details.has_readme = true;
        docScore += 30;
        const readmeLength = fileContents['README.md'].length;
        if (readmeLength > 1000) docScore += 20;
        if (readmeLength > 3000) docScore += 10;
      }
      
      const hasLicense = files.some((f: any) => 
        (f.name || f.path || '').toLowerCase().includes('license')
      );
      if (hasLicense) {
        assessment.details.has_license = true;
        docScore += 20;
      }
      
      const hasContributing = files.some((f: any) => 
        (f.name || f.path || '').toLowerCase().includes('contributing')
      );
      if (hasContributing) {
        assessment.details.has_contributing = true;
        docScore += 15;
      }

      assessment.documentation_score = Math.min(docScore, 100);

      // Activity assessment
      let activityScore = 0;
      const now = new Date();
      const recentCommits = commits.filter((commit: GitHubCommit) => {
        const commitDate = new Date(commit.commit.author.date);
        const daysDiff = (now.getTime() - commitDate.getTime()) / (1000 * 3600 * 24);
        return daysDiff <= 30;
      });
      
      assessment.details.recent_commits = recentCommits.length;
      activityScore += Math.min(recentCommits.length * 5, 50);
      
      const lastCommitDate = commits.length > 0 ? new Date(commits[0].commit.author.date) : new Date(0);
      const daysSinceLastCommit = (now.getTime() - lastCommitDate.getTime()) / (1000 * 3600 * 24);
      
      if (daysSinceLastCommit <= 7) activityScore += 30;
      else if (daysSinceLastCommit <= 30) activityScore += 20;
      else if (daysSinceLastCommit <= 90) activityScore += 10;

      assessment.activity_score = Math.min(activityScore, 100);

      // Maintenance assessment
      let maintenanceScore = 0;
      const openIssues = issues.filter((issue: GitHubIssue) => issue.state === 'open').length;
      const totalIssues = issues.length;
      
      if (totalIssues > 0) {
        assessment.details.open_issues_ratio = openIssues / totalIssues;
        if (assessment.details.open_issues_ratio < 0.3) maintenanceScore += 40;
        else if (assessment.details.open_issues_ratio < 0.6) maintenanceScore += 20;
      }

      const mergedPRs = pullRequests.filter((pr: GitHubPullRequest) => pr.state === 'merged').length;
      const totalPRs = pullRequests.length;
      
      if (totalPRs > 0) {
        assessment.details.pr_merge_rate = mergedPRs / totalPRs;
        if (assessment.details.pr_merge_rate > 0.8) maintenanceScore += 30;
        else if (assessment.details.pr_merge_rate > 0.6) maintenanceScore += 20;
        else if (assessment.details.pr_merge_rate > 0.4) maintenanceScore += 10;
      }

      // Check for testing
      const hasTests = files.some((f: any) => {
        const path = f.name || f.path || '';
        return path.includes('test') || path.includes('spec') || path.endsWith('.test.js') || path.endsWith('.test.ts');
      });
      
      if (hasTests) {
        assessment.details.has_tests = true;
        maintenanceScore += 20;
      }

      // Check for CI/CD
      const hasCI = files.some((f: any) => {
        const path = f.name || f.path || '';
        return path.includes('.github/workflows') || path.includes('.gitlab-ci') || path.includes('jenkins');
      });
      
      if (hasCI) {
        assessment.details.has_ci = true;
        maintenanceScore += 10;
      }

      assessment.maintenance_score = Math.min(maintenanceScore, 100);

      // Community assessment
      let communityScore = 0;
      if (repository.stargazers_count > 100) communityScore += 20;
      if (repository.forks_count > 20) communityScore += 15;
      if (repository.open_issues_count > 0) communityScore += 10; // Shows engagement
      if (assessment.details.has_contributing) communityScore += 25;
      if (assessment.details.has_license) communityScore += 20;
      if (repository.description && repository.description.length > 50) communityScore += 10;

      assessment.community_score = Math.min(communityScore, 100);

      // Calculate overall score
      assessment.overall_score = Math.round(
        (assessment.documentation_score * 0.25 +
         assessment.activity_score * 0.25 +
         assessment.maintenance_score * 0.3 +
         assessment.community_score * 0.2)
      );

      // Generate recommendations
      if (!assessment.details.has_readme) {
        assessment.recommendations.push('Add a comprehensive README.md with project description, installation, and usage instructions');
      }
      if (!assessment.details.has_license) {
        assessment.recommendations.push('Add a LICENSE file to clarify usage permissions');
      }
      if (!assessment.details.has_tests) {
        assessment.recommendations.push('Add unit tests to improve code reliability');
      }
      if (!assessment.details.has_ci) {
        assessment.recommendations.push('Set up CI/CD pipeline for automated testing and deployment');
      }
      if (assessment.details.open_issues_ratio > 0.5) {
        assessment.recommendations.push('Address open issues to improve project health');
      }
      if (assessment.details.recent_commits < 5) {
        assessment.recommendations.push('Increase development activity with more regular commits');
      }

      return JSON.stringify(assessment);
    } catch (error) {
      return JSON.stringify({ error: `Code quality assessment error: ${error}` });
    }
  }
});

// Tool: Repository file analyzer
export const fileAnalyzerTool = new DynamicTool({
  name: 'file_analyzer',
  description: 'Analyzes repository files to understand structure, patterns, and important components',
  func: async (input: string) => {
    try {
      const { files, fileContents } = JSON.parse(input);
      
      const analysis = {
        structure: {
          total_files: 0,
          directories: [] as string[],
          file_types: {} as Record<string, number>,
          size_distribution: {
            small: 0, // < 100 lines
            medium: 0, // 100-500 lines
            large: 0, // 500-1000 lines
            huge: 0, // > 1000 lines
          },
        },
        patterns: {
          architectural_pattern: 'unknown',
          folder_structure: 'unknown',
          naming_convention: 'unknown',
        },
        important_files: [] as Array<{
          path: string;
          type: string;
          importance: number;
          reason: string;
        }>,
        insights: [] as string[],
      };

      if (Array.isArray(files)) {
        analysis.structure.total_files = files.length;
        
        files.forEach((file: any) => {
          const path = file.name || file.path || '';
          const parts = path.split('/');
          
          // Track directories
          if (parts.length > 1) {
            const dir = parts[0];
            if (!analysis.structure.directories.includes(dir)) {
              analysis.structure.directories.push(dir);
            }
          }
          
          // Track file types
          const ext = path.split('.').pop()?.toLowerCase() || 'unknown';
          analysis.structure.file_types[ext] = (analysis.structure.file_types[ext] || 0) + 1;
          
          // Analyze file content if available
          if (fileContents[path]) {
            const lines = fileContents[path].split('\n').length;
            if (lines < 100) analysis.structure.size_distribution.small++;
            else if (lines < 500) analysis.structure.size_distribution.medium++;
            else if (lines < 1000) analysis.structure.size_distribution.large++;
            else analysis.structure.size_distribution.huge++;
          }
        });

        // Detect architectural patterns
        const dirs = analysis.structure.directories;
        if (dirs.includes('src') && dirs.includes('components')) {
          analysis.patterns.architectural_pattern = 'Component-based (React/Vue)';
        } else if (dirs.includes('app') && dirs.includes('models') && dirs.includes('views')) {
          analysis.patterns.architectural_pattern = 'MVC (Ruby/Django)';
        } else if (dirs.includes('pages') && dirs.includes('api')) {
          analysis.patterns.architectural_pattern = 'Full-stack (Next.js)';
        } else if (dirs.includes('lib') && dirs.includes('bin')) {
          analysis.patterns.architectural_pattern = 'Library/CLI';
        }

        // Detect folder structure
        if (dirs.includes('src')) {
          analysis.patterns.folder_structure = 'Source-based';
        } else if (dirs.includes('app')) {
          analysis.patterns.folder_structure = 'App-based';
        } else if (dirs.includes('packages')) {
          analysis.patterns.folder_structure = 'Monorepo';
        } else {
          analysis.patterns.folder_structure = 'Flat/Simple';
        }

        // Identify important files
        const importantPatterns = [
          { pattern: /^README/i, type: 'documentation', importance: 10, reason: 'Main documentation' },
          { pattern: /package\.json$/, type: 'config', importance: 9, reason: 'Node.js dependencies' },
          { pattern: /Dockerfile$/, type: 'deployment', importance: 8, reason: 'Container configuration' },
          { pattern: /\.env/, type: 'config', importance: 7, reason: 'Environment configuration' },
          { pattern: /tsconfig\.json$/, type: 'config', importance: 6, reason: 'TypeScript configuration' },
          { pattern: /webpack\.config/, type: 'build', importance: 6, reason: 'Build configuration' },
          { pattern: /index\.(js|ts|jsx|tsx)$/, type: 'entry', importance: 8, reason: 'Entry point' },
          { pattern: /app\.(js|ts|jsx|tsx)$/, type: 'entry', importance: 8, reason: 'Main application' },
          { pattern: /main\.(js|ts)$/, type: 'entry', importance: 8, reason: 'Main entry point' },
          { pattern: /routes?\//i, type: 'routing', importance: 7, reason: 'Routing logic' },
          { pattern: /models?\//i, type: 'data', importance: 7, reason: 'Data models' },
          { pattern: /components?\//i, type: 'ui', importance: 6, reason: 'UI components' },
          { pattern: /utils?\//i, type: 'utility', importance: 5, reason: 'Utility functions' },
          { pattern: /test/i, type: 'testing', importance: 5, reason: 'Test files' },
        ];

        files.forEach((file: any) => {
          const path = file.name || file.path || '';
          importantPatterns.forEach(({ pattern, type, importance, reason }) => {
            if (pattern.test(path)) {
              analysis.important_files.push({ path, type, importance, reason });
            }
          });
        });

        // Sort by importance
        analysis.important_files.sort((a, b) => b.importance - a.importance);

        // Generate insights
        const topFileType = Object.entries(analysis.structure.file_types)
          .sort(([,a], [,b]) => b - a)[0];
        
        if (topFileType) {
          analysis.insights.push(`Primary file type: ${topFileType[0]} (${topFileType[1]} files)`);
        }

        if (analysis.patterns.architectural_pattern !== 'unknown') {
          analysis.insights.push(`Detected architecture: ${analysis.patterns.architectural_pattern}`);
        }

        const hasTests = files.some((f: any) => (f.name || f.path || '').includes('test'));
        if (hasTests) {
          analysis.insights.push('Project includes test files');
        } else {
          analysis.insights.push('No test files detected - consider adding tests');
        }

        const configFiles = analysis.important_files.filter(f => f.type === 'config').length;
        if (configFiles > 3) {
          analysis.insights.push('Complex configuration setup detected');
        }
      }

      return JSON.stringify(analysis);
    } catch (error) {
      return JSON.stringify({ error: `File analysis error: ${error}` });
    }
  }
});

// Export all tools as an array
export const allTools = [
  githubFetchTool,
  techStackDetectorTool,
  codeQualityAssessorTool,
  fileAnalyzerTool,
];
