import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://uiucmdovylwgfileuhpg.supabase.co';
// Using service role key for admin operations
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpdWNtZG92eWx3Z2ZpbGV1aHBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMTY0NjExMSwiZXhwIjoyMDQ3MjIyMTExfQ.g7ZCelFz1A4BH7lBxwNlVvOeQl7UyktT5Tm6hGMDcto';

const supabase = createClient(supabaseUrl, serviceKey);

async function applySQLFix() {
  console.log('🔧 Applying SQL fix for activate_workflow...');
  
  try {
    // Read and execute the SQL fix
    const sqlFix = readFileSync('fix_activate_workflow.sql', 'utf8');
    
    const { error } = await supabase.rpc('query', { 
      query_text: sqlFix 
    });
    
    if (error) {
      console.error('❌ SQL execution error:', error);
      return false;
    }
    
    console.log('✅ SQL fix applied successfully');
    return true;
  } catch (error) {
    console.error('❌ Error applying SQL fix:', error);
    return false;
  }
}

async function testActivateWorkflow() {
  const workflowId = 'ec6c0032-32d5-4c49-a996-c954490c7efe';
  
  console.log('🚀 Testing activate_workflow RPC...');
  
  const { data: result, error } = await supabase
    .rpc('activate_workflow', { p_workflow: workflowId });
    
  if (error) {
    console.error('❌ Activate workflow error:', error);
    return false;
  } else {
    console.log('✅ Activate result:', result);
    return true;
  }
}

async function main() {
  console.log('🔍 Testing SQL fix for webhook activation...\n');
  
  // First test without fix
  console.log('1. Testing current state...');
  await testActivateWorkflow();
  
  console.log('\n2. Applying SQL fix...');
  const fixApplied = await applySQLFix();
  
  if (fixApplied) {
    console.log('\n3. Testing after fix...');
    await testActivateWorkflow();
  }
}

main().catch(console.error); 