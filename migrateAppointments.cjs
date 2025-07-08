const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// TODO: Replace with your actual Supabase project URL and anon key
const supabase = createClient(
  'https://YOUR_PROJECT.supabase.co',
  'YOUR_SUPABASE_ANON_KEY'
);

// Load Firestore data
const firestoreData = JSON.parse(fs.readFileSync('appointments.json', 'utf8'));

// Helper to flatten Firestore appointment
function transformAppointment(doc) {
  return {
    // Use Firestore doc ID or generate a new UUID if needed
    id: doc.id || undefined,
    patient_email: doc.patient?.email || doc.email || null,
    patient_name: doc.patient?.name || doc.name || null,
    patient_phone: doc.patient?.phone || null,
    treatment: doc.treatment || doc.treatment_type || null,
    dentist: doc.dentist || doc.doctor || null,
    status: doc.status || null,
    date: doc.date || null,
    time: doc.time || null,
    notes: doc.notes || null,
    created_at: doc.createdAt || new Date().toISOString(),
    // Add more fields as needed
  };
}

async function migrate() {
  for (const [docId, doc] of Object.entries(firestoreData)) {
    const appointment = transformAppointment({ ...doc, id: docId });
    const { error } = await supabase.from('appointments').insert([appointment]);
    if (error) {
      console.error(`Error inserting appointment ${docId}:`, error.message);
    } else {
      console.log(`Inserted appointment ${docId}`);
    }
  }
}

migrate();