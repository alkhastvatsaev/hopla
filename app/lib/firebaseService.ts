import { db } from './firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc,
  query,
  orderBy,
  where,
  runTransaction,
} from 'firebase/firestore';

export async function getJobs() {
  const jobsCol = collection(db, 'jobs');
  const q = query(jobsCol, orderBy('timestamp', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function createJob(jobData: any) {
  const jobsCol = collection(db, 'jobs');
  const { status, ...rest } = jobData;
  const docRef = await addDoc(jobsCol, {
    ...rest,
    timestamp: Date.now(),
    status: status || 'open'
  });
  return { id: docRef.id };
}

export async function updateJob(id: string, updates: any) {
  const jobRef = doc(db, 'jobs', id);
  await updateDoc(jobRef, updates);
}

export async function getJob(id: string) {
  const jobRef = doc(db, 'jobs', id);
  const snapshot = await getDoc(jobRef);
  if (snapshot.exists()) {
    return { id: snapshot.id, ...snapshot.data() };
  }
  return null;
}

export async function getJobByPaymentIntent(paymentIntentId: string) {
  const jobsCol = collection(db, 'jobs');
  const snapshot = await getDocs(
    query(jobsCol, where('stripePaymentIntentId', '==', paymentIntentId)),
  );
  const match = snapshot.docs[0];
  return match ? { id: match.id, ...match.data() } : null;
}

export async function claimJob(
  id: string,
  driver: { id: string; name: string; photoUrl: string | null },
) {
  const jobRef = doc(db, 'jobs', id);
  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(jobRef);
    if (!snapshot.exists()) throw new Error('JOB_NOT_FOUND');
    if (snapshot.data().status !== 'open') throw new Error('JOB_ALREADY_CLAIMED');

    transaction.update(jobRef, {
      status: 'taken',
      driverId: driver.id,
      driverName: driver.name,
      driverPhotoUrl: driver.photoUrl,
    });
  });
}
