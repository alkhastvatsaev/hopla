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
  where
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
