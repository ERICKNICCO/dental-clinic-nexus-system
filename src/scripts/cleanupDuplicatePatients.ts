import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
initializeApp({
  credential: applicationDefault(),
});

const db = getFirestore();

// Helper functions to normalize data for comparison
const normalize = (str: string) => str.trim().toLowerCase().replace(/\s+/g, '');
const normalizePhone = (phone: string) => phone.trim().replace(/\s+/g, '');

async function deleteDuplicatePatients() {
  console.log('Starting duplicate patient cleanup...');
  const snapshot = await db.collection('patients').get();
  const seen = new Map();
  let deletedCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const nameKey = normalize(data.name || '');
    const phoneKey = normalizePhone(data.phone || '');
    const uniqueKey = `${nameKey}-${phoneKey}`;

    if (seen.has(uniqueKey)) {
      console.log(`Deleting duplicate: ${data.name} (${data.phone})`);
      await db.collection('patients').doc(doc.id).delete();
      deletedCount++;
    } else {
      seen.set(uniqueKey, doc.id);
    }
  }

  console.log(`✅ Duplicate cleanup complete. Deleted ${deletedCount} duplicate patients.`);
}

// Run the cleanup
deleteDuplicatePatients().catch(error => {
  console.error('Error during cleanup:', error);
  process.exit(1);
}); 