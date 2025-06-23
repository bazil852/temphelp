import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uiucmdovylwgfileuhpg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpdWNtZG92eWx3Z2ZpbGV1aHBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE2NDYxMTEsImV4cCI6MjA0NzIyMjExMX0.Hx57N55YK5Pp5tKkvDStcGFWKzAtzmJNlIqlqaGN9FA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testWebhookUrl() {
  const workflowId = 'ec6c0032-32d5-4c49-a996-c954490c7efe';
  
  console.log('🚀 Testing activate_workflow to check webhook URL...');
  
  const { data: result, error } = await supabase
    .rpc('activate_workflow', { p_workflow: workflowId });
    
  if (error) {
    console.error('❌ Activate workflow error:', error);
  } else {
    console.log('✅ Activate result:', result);
    console.log('🔗 URL type:', typeof result.url);
    console.log('🔗 URL value:', result.url);
    console.log('🔗 URL length:', result.url?.length);
    
    if (result.url) {
      if (result.url.startsWith('http')) {
        console.log('✅ URL is complete with domain');
      } else {
        console.log('❌ URL is missing domain - this is the issue!');
        console.log('Expected: https://uiucmdovylwgfileuhpg.supabase.co' + result.url);
      }
    }
  }
}

testWebhookUrl().catch(console.error); 