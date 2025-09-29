// Database migration script to add missing columns to lessons table
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function migrateDatabase() {
  console.log('Starting database migration...');
  
  try {
    // Check current table structure
    console.log('Checking current lessons table structure...');
    const { data: currentColumns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'lessons')
      .eq('table_schema', 'public');
    
    if (columnsError) {
      console.error('Error checking table structure:', columnsError);
      return;
    }
    
    console.log('Current columns:', currentColumns.map(col => col.column_name));
    
    // Add missing columns one by one
    const columnsToAdd = [
      { name: 'description', type: 'TEXT' },
      { name: 'lichess_embed_url_2', type: 'TEXT' },
      { name: 'lichess_image_url', type: 'TEXT' },
      { name: 'lichess_image_url_2', type: 'TEXT' },
      { name: 'lichess_description', type: 'TEXT' },
      { name: 'lichess_description_2', type: 'TEXT' }
    ];
    
    for (const column of columnsToAdd) {
      const columnExists = currentColumns.some(col => col.column_name === column.name);
      
      if (!columnExists) {
        console.log(`Adding column: ${column.name}`);
        
        // Use RPC to execute SQL
        const { error } = await supabase.rpc('exec_sql', {
          sql: `ALTER TABLE public.lessons ADD COLUMN ${column.name} ${column.type};`
        });
        
        if (error) {
          console.error(`Error adding column ${column.name}:`, error);
        } else {
          console.log(`✅ Successfully added column: ${column.name}`);
        }
      } else {
        console.log(`Column ${column.name} already exists, skipping...`);
      }
    }
    
    // Verify final structure
    console.log('Verifying final table structure...');
    const { data: finalColumns, error: finalError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'lessons')
      .eq('table_schema', 'public');
    
    if (finalError) {
      console.error('Error verifying final structure:', finalError);
      return;
    }
    
    console.log('Final columns:', finalColumns.map(col => col.column_name));
    console.log('✅ Database migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

migrateDatabase();