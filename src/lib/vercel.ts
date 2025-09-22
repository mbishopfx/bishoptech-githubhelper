// Vercel API integration for deployment and domain detection
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface VercelProject {
  id: string;
  name: string;
  accountId: string;
  createdAt: number;
  updatedAt: number;
  link?: {
    type: 'github';
    repo: string;
    repoId: number;
    org?: string;
  };
  targets?: {
    production?: {
      id: string;
      url: string;
      alias?: string[];
    };
  };
  latestDeployments?: VercelDeployment[];
}

interface VercelDeployment {
  uid: string;
  name: string;
  url: string;
  created: number;
  source: 'git' | 'cli' | 'import';
  state: 'BUILDING' | 'ERROR' | 'INITIALIZING' | 'QUEUED' | 'READY' | 'CANCELED';
  readyState: 'READY' | 'ERROR';
  type: 'LAMBDAS';
  creator: {
    uid: string;
    username?: string;
  };
  inspectorUrl?: string;
  meta?: {
    githubCommitSha?: string;
    githubCommitMessage?: string;
    githubCommitAuthor?: string;
    githubCommitRef?: string;
    githubRepo?: string;
  };
  target?: 'production' | 'staging';
  aliasAssigned?: boolean;
  aliasError?: any;
  isRollbackCandidate?: boolean;
  buildingAt?: number;
  ready?: number;
  checksState?: 'registered' | 'running' | 'completed';
  checksConclusion?: 'succeeded' | 'failed' | 'skipped' | 'canceled';
}

interface VercelDomain {
  name: string;
  apexName: string;
  projectId: string;
  redirect?: string;
  redirectStatusCode?: number;
  gitBranch?: string;
  updatedAt?: number;
  createdAt?: number;
  verified: boolean;
  verification?: Array<{
    type: string;
    domain: string;
    value: string;
    reason: string;
  }>;
}

export class VercelAPI {
  private apiKey: string | null;
  private baseURL = 'https://api.vercel.com';

  constructor() {
    this.apiKey = process.env.VERCEL_API_TOKEN || null;
    if (!this.apiKey) {
      console.log('🔧 VERCEL_API_TOKEN not configured - deployment detection will be disabled');
    }
  }

  private async makeRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
    if (!this.apiKey) {
      throw new Error('Vercel API token not configured');
    }

    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        throw new Error(`Vercel API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error(`Vercel API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Get all projects for the authenticated user
  async getProjects(): Promise<VercelProject[]> {
    if (!this.apiKey) {
      console.log('Vercel API not configured - returning empty projects list');
      return [];
    }
    try {
      const response = await this.makeRequest<{ projects: VercelProject[] }>('/v9/projects');
      return response.projects;
    } catch (error) {
      console.error('Failed to fetch Vercel projects:', error);
      return [];
    }
  }

  // Get a specific project by ID
  async getProject(projectId: string): Promise<VercelProject | null> {
    try {
      return await this.makeRequest<VercelProject>(`/v9/projects/${projectId}`);
    } catch (error) {
      console.error(`Failed to fetch Vercel project ${projectId}:`, error);
      return null;
    }
  }

  // Get deployments for a project
  async getDeployments(projectId: string, limit: number = 20): Promise<VercelDeployment[]> {
    try {
      const response = await this.makeRequest<{ deployments: VercelDeployment[] }>(
        `/v6/deployments?projectId=${projectId}&limit=${limit}`
      );
      return response.deployments;
    } catch (error) {
      console.error(`Failed to fetch deployments for project ${projectId}:`, error);
      return [];
    }
  }

  // Get domains for a project
  async getDomains(projectId: string): Promise<VercelDomain[]> {
    try {
      const response = await this.makeRequest<{ domains: VercelDomain[] }>(
        `/v9/projects/${projectId}/domains`
      );
      return response.domains;
    } catch (error) {
      console.error(`Failed to fetch domains for project ${projectId}:`, error);
      return [];
    }
  }

  // Find Vercel project by GitHub repository
  async findProjectByGitHubRepo(githubRepo: string): Promise<VercelProject | null> {
    try {
      const projects = await this.getProjects();
      
      // Look for exact GitHub repo match
      const project = projects.find(p => 
        p.link?.type === 'github' && 
        (p.link.repo === githubRepo || p.name === githubRepo.split('/')[1])
      );

      if (project) {
        // Get additional deployment and domain info
        const [deployments, domains] = await Promise.all([
          this.getDeployments(project.id, 5),
          this.getDomains(project.id)
        ]);

        return {
          ...project,
          latestDeployments: deployments,
          domains
        };
      }

      return null;
    } catch (error) {
      console.error(`Failed to find project for GitHub repo ${githubRepo}:`, error);
      return null;
    }
  }

  // Get deployment status and URLs for a repository
  async getRepositoryDeploymentInfo(githubRepo: string): Promise<{
    isDeployed: boolean;
    projectId?: string;
    productionUrl?: string;
    previewUrls?: string[];
    domains?: string[];
    latestDeployment?: {
      url: string;
      status: string;
      createdAt: string;
      commitSha?: string;
    };
  }> {
    if (!this.apiKey) {
      console.log(`Vercel API not configured - skipping deployment detection for ${githubRepo}`);
      return { isDeployed: false };
    }
    
    try {
      const project = await this.findProjectByGitHubRepo(githubRepo);
      
      if (!project) {
        return { isDeployed: false };
      }

      const productionDeployment = project.latestDeployments?.find(d => d.target === 'production');
      const domains = project.domains?.map(d => d.name) || [];
      
      // Get primary production URL
      let productionUrl = productionDeployment?.url;
      if (productionUrl && !productionUrl.startsWith('http')) {
        productionUrl = `https://${productionUrl}`;
      }

      // If we have custom domains, prefer the first verified one
      const customDomain = project.domains?.find(d => d.verified && !d.name.includes('.vercel.app'));
      if (customDomain) {
        productionUrl = `https://${customDomain.name}`;
      }

      const previewUrls = project.latestDeployments
        ?.filter(d => d.target !== 'production' && d.readyState === 'READY')
        .map(d => `https://${d.url}`)
        .slice(0, 3) || [];

      return {
        isDeployed: true,
        projectId: project.id,
        productionUrl,
        previewUrls,
        domains,
        latestDeployment: productionDeployment ? {
          url: `https://${productionDeployment.url}`,
          status: productionDeployment.readyState,
          createdAt: new Date(productionDeployment.created).toISOString(),
          commitSha: productionDeployment.meta?.githubCommitSha
        } : undefined
      };
    } catch (error) {
      console.error(`Failed to get deployment info for ${githubRepo}:`, error);
      return { isDeployed: false };
    }
  }

  // Cache deployment information in database
  async cacheDeploymentInfo(repositoryId: string, deploymentInfo: any): Promise<void> {
    try {
      const cacheKey = `deployment_info_${repositoryId}`;
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // Cache for 1 hour

      await supabase
        .from('analysis_cache')
        .upsert({
          repository_id: repositoryId,
          analysis_type: 'deployment',
          cache_key: cacheKey,
          cached_data: deploymentInfo,
          expires_at: expiresAt.toISOString()
        }, {
          onConflict: 'repository_id,analysis_type,cache_key'
        });
    } catch (error) {
      console.error('Failed to cache deployment info:', error);
    }
  }

  // Get cached deployment information
  async getCachedDeploymentInfo(repositoryId: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('analysis_cache')
        .select('cached_data')
        .eq('repository_id', repositoryId)
        .eq('analysis_type', 'deployment')
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        return null;
      }

      return data.cached_data;
    } catch (error) {
      console.error('Failed to get cached deployment info:', error);
      return null;
    }
  }

  // Get comprehensive deployment info with caching
  async getComprehensiveDeploymentInfo(repositoryId: string, githubRepo: string): Promise<any> {
    // Try cache first
    const cached = await this.getCachedDeploymentInfo(repositoryId);
    if (cached) {
      console.log(`Using cached deployment info for ${githubRepo}`);
      return cached;
    }

    // Fetch fresh data
    console.log(`Fetching fresh deployment info for ${githubRepo}`);
    const deploymentInfo = await this.getRepositoryDeploymentInfo(githubRepo);
    
    // Cache the results
    await this.cacheDeploymentInfo(repositoryId, deploymentInfo);
    
    return deploymentInfo;
  }
}

// Export singleton instance
export const vercelAPI = new VercelAPI();

// Helper functions for recap integration
export async function getRepositoryDeploymentStatus(repository: any): Promise<{
  isDeployed: boolean;
  productionUrl?: string;
  deploymentPlatform?: string;
  lastDeployment?: {
    date: string;
    status: string;
    commitSha?: string;
  };
}> {
  try {
    // First try Vercel
    const vercelInfo = await vercelAPI.getComprehensiveDeploymentInfo(
      repository.id,
      repository.full_name
    );

    if (vercelInfo.isDeployed) {
      return {
        isDeployed: true,
        productionUrl: vercelInfo.productionUrl,
        deploymentPlatform: 'Vercel',
        lastDeployment: vercelInfo.latestDeployment ? {
          date: vercelInfo.latestDeployment.createdAt,
          status: vercelInfo.latestDeployment.status,
          commitSha: vercelInfo.latestDeployment.commitSha
        } : undefined
      };
    }

    // TODO: Add other deployment platforms (Netlify, GitHub Pages, etc.)
    
    return { isDeployed: false };
  } catch (error) {
    console.error('Error checking deployment status:', error);
    return { isDeployed: false };
  }
}

export async function getAllRepositoryDeployments(): Promise<Record<string, any>> {
  try {
    const { data: repositories } = await supabase
      .from('repositories')
      .select('id, full_name, name')
      .eq('is_active', true);

    if (!repositories) {
      return {};
    }

    const deployments: Record<string, any> = {};
    
    // Process in batches to avoid rate limiting
    for (const repo of repositories) {
      try {
        const deploymentInfo = await vercelAPI.getComprehensiveDeploymentInfo(
          repo.id,
          repo.full_name
        );
        deployments[repo.id] = deploymentInfo;
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to get deployment info for ${repo.full_name}:`, error);
        deployments[repo.id] = { isDeployed: false };
      }
    }

    return deployments;
  } catch (error) {
    console.error('Error getting all repository deployments:', error);
    return {};
  }
}
