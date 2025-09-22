#!/usr/bin/env node

import { Octokit } from '@octokit/rest';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testGitHub() {
  console.log('🔍 Testing GitHub Token...\n');
  
  const token = process.env.GITHUB_TOKEN;
  console.log('Token found:', token ? `${token.substring(0, 20)}...` : 'NOT FOUND');
  
  if (!token || token === 'your_github_token_here') {
    console.log('❌ GitHub token not configured properly');
    process.exit(1);
  }

  try {
    const octokit = new Octokit({ auth: token });
    
    console.log('🔗 Connecting to GitHub...');
    const { data: user } = await octokit.rest.users.getAuthenticated();
    
    console.log(`✅ Connected as: ${user.login} (${user.name})`);
    console.log(`📊 Public repos: ${user.public_repos}, Private repos: ${user.total_private_repos}`);
    
    console.log('\n📁 Fetching repositories...');
    const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
      visibility: 'all',
      sort: 'updated',
      per_page: 50,
    });
    
    console.log(`Found ${repos.length} repositories`);
    
    // Look for bishoptech-website
    const bishoptechRepo = repos.find(repo => 
      repo.name.toLowerCase().includes('bishoptech') && 
      repo.name.toLowerCase().includes('website')
    );
    
    if (bishoptechRepo) {
      console.log(`\n🎯 Found bishoptech-website: ${bishoptechRepo.full_name}`);
      
      // Get latest commit
      console.log('🔍 Getting latest commit...');
      const { data: commits } = await octokit.rest.repos.listCommits({
        owner: bishoptechRepo.owner.login,
        repo: bishoptechRepo.name,
        per_page: 1,
      });
      
      if (commits.length > 0) {
        const commit = commits[0];
        console.log('\n📝 Latest commit:');
        console.log(`   SHA: ${commit.sha.substring(0, 8)}`);
        console.log(`   Message: ${commit.commit.message.split('\n')[0]}`);
        console.log(`   Author: ${commit.commit.author.name}`);
        console.log(`   Date: ${new Date(commit.commit.author.date).toLocaleString()}`);
        console.log(`   URL: ${commit.html_url}`);
      }
    } else {
      console.log('\n❌ bishoptech-website repository not found');
      console.log('Available repositories:');
      repos.slice(0, 10).forEach(repo => {
        console.log(`   - ${repo.name} (${repo.private ? 'private' : 'public'})`);
      });
    }
    
    console.log('\n✅ GitHub token test completed successfully!');
    
  } catch (error) {
    console.error('❌ GitHub API Error:', error.message);
    if (error.status === 401) {
      console.log('🔑 Check your GitHub token permissions and validity');
    }
    process.exit(1);
  }
}

testGitHub();
