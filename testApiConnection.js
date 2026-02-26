#!/usr/bin/env node

/**
 * Simple API connection test for Mission Control backend
 * Run with: node testApiConnection.js
 */

const axios = require('axios');

const BASE_URL = process.env.OPENCLAW_URL || 'https://your-openclaw-host:3001';
const API_BASE = `${BASE_URL}/api`;

async function testEndpoint(url, method = 'GET', data = null) {
  try {
    console.log(`\n🔍 Testing ${method} ${url}`);
    
    const config = {
      method: method.toLowerCase(),
      url,
      timeout: 5000,
      validateStatus: () => true, // Don't throw on error status codes
    };
    
    if (data) {
      config.data = data;
      config.headers = { 'Content-Type': 'application/json' };
    }
    
    const response = await axios(config);
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
    
    return {
      success: response.status < 400,
      status: response.status,
      data: response.data
    };
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    if (error.code === 'ECONNREFUSED') {
      console.log('   💡 Server appears to be down');
    }
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 Mission Control API Connection Test\n');
  console.log(`Testing server at: ${BASE_URL}`);
  
  const tests = [
    // Basic server connectivity
    { name: 'Server Root', url: BASE_URL },
    { name: 'API Root', url: API_BASE },
    
    // Health check
    { name: 'Health Check', url: `${API_BASE}/health` },
    
    // Auth endpoints
    { name: 'Auth Login (GET)', url: `${API_BASE}/auth/login` },
    { name: 'Auth Login (POST)', url: `${API_BASE}/auth/login`, method: 'POST', data: { username: 'test', password: 'test' } },
    
    // Tasks endpoint (requires auth)
    { name: 'Tasks List', url: `${API_BASE}/tasks` },
    
    // Agents endpoint
    { name: 'Agents List', url: `${API_BASE}/agents` },
  ];
  
  const results = [];
  
  for (const test of tests) {
    console.log(`\n📋 ${test.name}`);
    console.log('─'.repeat(50));
    
    const result = await testEndpoint(
      test.url, 
      test.method || 'GET', 
      test.data
    );
    
    results.push({
      ...test,
      ...result
    });
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful: ${successful.length}/${results.length}`);
  console.log(`❌ Failed: ${failed.length}/${results.length}`);
  
  if (failed.length > 0) {
    console.log('\n❌ Failed Tests:');
    failed.forEach(test => {
      console.log(`   - ${test.name}: ${test.error || `Status ${test.status}`}`);
    });
  }
  
  if (successful.length > 0) {
    console.log('\n✅ Successful Tests:');
    successful.forEach(test => {
      console.log(`   - ${test.name}: Status ${test.status}`);
    });
  }
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  
  const serverDown = results.some(r => r.error && r.error.includes('ECONNREFUSED'));
  if (serverDown) {
    console.log('   - Start the Mission Control backend server and set OPENCLAW_URL');
    return;
  }
  
  const authRequired = results.some(r => r.status === 401);
  if (authRequired) {
    console.log('   - Tasks endpoint requires authentication');
    console.log('   - Implement proper login flow in the mobile app');
  }
  
  const notFound = results.filter(r => r.status === 404);
  if (notFound.length > 0) {
    console.log(`   - ${notFound.length} endpoints returned 404 - may need backend updates`);
  }
  
  console.log('\n🎯 NEXT STEPS:');
  console.log('   1. Ensure backend server is running with proper endpoints');
  console.log('   2. Implement authentication flow in mobile app');
  console.log('   3. Test task creation and fetching with valid auth');
  console.log('   4. Add error handling for network connectivity issues');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testEndpoint, BASE_URL, API_BASE };
