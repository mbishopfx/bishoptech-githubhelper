#!/usr/bin/env node
/**
 * Test OpenAI API connection and response
 */

const { ChatOpenAI } = require('@langchain/openai');
const { HumanMessage } = require('@langchain/core/messages');
require('dotenv').config({ path: '.env.local' });

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testOpenAI() {
  log('\n🧪 Testing OpenAI API Connection\n', colors.blue);

  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    log('❌ OPENAI_API_KEY not found in environment', colors.red);
    return;
  }

  log(`✅ API Key found: ${apiKey.substring(0, 20)}...${apiKey.substring(apiKey.length - 4)}`, colors.green);

  try {
    // Test basic OpenAI connection
    const llm = new ChatOpenAI({
      model: 'gpt-4o',
      temperature: 0.3,
      maxTokens: 500,
      apiKey: apiKey,
    });

    log('🔗 Testing basic chat completion...', colors.blue);
    
    const testMessage = new HumanMessage(`
You are a helpful AI assistant for a GitHub repository dashboard.

Repository: bishoptech-qr
Description: TypeScript project for QR code generation
Language: TypeScript
Stars: 0 | Forks: 0 | Issues: 0

USER QUESTION: What does this repository do?

Please provide a helpful response about what this TypeScript QR code repository does.
`);

    const startTime = Date.now();
    const response = await llm.invoke([testMessage]);
    const endTime = Date.now();

    log(`✅ OpenAI Response (${endTime - startTime}ms):`, colors.green);
    log(`${response.content}`, colors.reset);
    log(`\n📊 Response Stats:`, colors.blue);
    log(`- Type: ${typeof response.content}`, colors.reset);
    log(`- Length: ${response.content.length} characters`, colors.reset);
    log(`- Tokens (estimated): ${Math.ceil(response.content.length / 4)}`, colors.reset);

  } catch (error) {
    log(`❌ OpenAI Test Failed: ${error.message}`, colors.red);
    
    if (error.message.includes('401')) {
      log('🔑 API Key appears to be invalid or expired', colors.yellow);
    } else if (error.message.includes('quota')) {
      log('💳 API quota exceeded', colors.yellow);
    } else if (error.message.includes('rate')) {
      log('🚦 Rate limit hit', colors.yellow);
    } else {
      log(`🔍 Error details: ${error.stack}`, colors.yellow);
    }
  }
}

testOpenAI();
