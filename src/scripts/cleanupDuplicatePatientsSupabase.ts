import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper functions to normalize data for comparison
const normalize = (str: string) => str.trim().toLowerCase().replace(/\s+/g, '');
const normalizePhone = (phone: string) => phone.trim().replace(/\s+/g, '');

interface Patient {
  id: string;
  patient_id: string;
  name: string;
  email?: string;
  phone?: string;
  date_of_birth: string;
  gender: string;
  address: string;
  emergency_contact: string;
  emergency_phone: string;
  insurance?: string;
  last_visit?: string;
  next_appointment?: string;
  patient_type: 'cash' | 'insurance';
  created_at: string;
  updated_at: string;
}

async function cleanupDuplicatePatients() {
  console.log('🔥 Starting Supabase duplicate patient cleanup...');
  
  try {
    // Fetch all patients
    const { data: patients, error } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Error fetching patients:', error);
      return;
    }

    console.log(`📊 Found ${patients?.length || 0} patients to check`);

    if (!patients || patients.length === 0) {
      console.log('✅ No patients found');
      return;
    }

    const seen = new Map<string, Patient>();
    const duplicates: Patient[] = [];
    let processedCount = 0;

    for (const patient of patients) {
      const nameKey = normalize(patient.name || '');
      const phoneKey = normalizePhone(patient.phone || '');
      const emailKey = normalize(patient.email || '');
      
      // Create unique keys for different matching strategies
      const namePhoneKey = `${nameKey}-${phoneKey}`;
      const nameEmailKey = `${nameKey}-${emailKey}`;
      const phoneEmailKey = `${phoneKey}-${emailKey}`;

      // Check for duplicates using multiple strategies
      const isDuplicate = seen.has(namePhoneKey) || 
                         seen.has(nameEmailKey) || 
                         seen.has(phoneEmailKey) ||
                         (nameKey && nameKey.length > 2 && seen.has(nameKey)) ||
                         (phoneKey && phoneKey.length > 5 && seen.has(phoneKey)) ||
                         (emailKey && emailKey.length > 5 && seen.has(emailKey));

      if (isDuplicate) {
        console.log(`🔍 Found duplicate: ${patient.name} (${patient.phone}) - ID: ${patient.id}`);
        duplicates.push(patient);
      } else {
        // Store this patient as the "original" for future comparisons
        seen.set(namePhoneKey, patient);
        seen.set(nameEmailKey, patient);
        seen.set(phoneEmailKey, patient);
        if (nameKey && nameKey.length > 2) seen.set(nameKey, patient);
        if (phoneKey && phoneKey.length > 5) seen.set(phoneKey, patient);
        if (emailKey && emailKey.length > 5) seen.set(emailKey, patient);
      }
      
      processedCount++;
      if (processedCount % 10 === 0) {
        console.log(`📈 Processed ${processedCount}/${patients.length} patients...`);
      }
    }

    console.log(`\n📊 Analysis complete:`);
    console.log(`   - Total patients: ${patients.length}`);
    console.log(`   - Unique patients: ${Math.round(seen.size / 6)}`); // Approximate, since we store multiple keys
    console.log(`   - Duplicates found: ${duplicates.length}`);

    if (duplicates.length === 0) {
      console.log('✅ No duplicates found!');
      return;
    }

    // Show duplicates before deletion
    console.log('\n🔍 Duplicates to be deleted:');
    duplicates.forEach((patient, index) => {
      console.log(`   ${index + 1}. ${patient.name} (${patient.phone}) - ID: ${patient.id}`);
    });

    // Ask for confirmation
    console.log('\n⚠️  WARNING: This will permanently delete duplicate patients.');
    console.log('   Make sure you have a backup before proceeding.');
    
    // For safety, we'll require manual confirmation
    console.log('\n🔒 To proceed with deletion, uncomment the deletion code in the script.');
    console.log('   This prevents accidental data loss.');

    // Uncomment the following code to actually delete duplicates:
    /*
    console.log('\n🗑️  Starting deletion...');
    let deletedCount = 0;
    
    for (const duplicate of duplicates) {
      try {
        // First, update any appointments that reference this duplicate
        const { error: appointmentError } = await supabase
          .from('appointments')
          .update({ patient_id: null })
          .eq('patient_id', duplicate.id);
        
        if (appointmentError) {
          console.warn(`⚠️  Warning updating appointments for ${duplicate.name}:`, appointmentError);
        }

        // Delete related records first
        await supabase
          .from('medical_history')
          .delete()
          .eq('patient_id', duplicate.id);
        
        await supabase
          .from('treatment_notes')
          .delete()
          .eq('patient_id', duplicate.id);
        
        await supabase
          .from('consultations')
          .delete()
          .eq('patient_id', duplicate.id);

        // Delete the patient
        const { error } = await supabase
          .from('patients')
          .delete()
          .eq('id', duplicate.id);

        if (error) {
          console.error(`❌ Error deleting ${duplicate.name}:`, error);
        } else {
          console.log(`✅ Deleted: ${duplicate.name} (${duplicate.phone})`);
          deletedCount++;
        }
      } catch (error) {
        console.error(`❌ Error processing ${duplicate.name}:`, error);
      }
    }

    console.log(`\n✅ Cleanup complete! Deleted ${deletedCount} duplicate patients.`);
    */

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

// Run the cleanup
cleanupDuplicatePatients().catch(error => {
  console.error('❌ Error during cleanup:', error);
  process.exit(1);
}); 