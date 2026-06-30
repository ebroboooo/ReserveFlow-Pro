import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, writeBatch, type DocumentData,
} from 'firebase/firestore';
import { getFirebaseFirestore, isFirebaseConfigured } from '../firebase/config';

export function orgPath(orgId: string, subcollection: string) {
  return `organizations/${orgId}/${subcollection}`;
}

export async function fsGetAll<T>(orgId: string, subcollection: string): Promise<T[]> {
  if (!isFirebaseConfigured()) return [];
  const db = getFirebaseFirestore();
  const snap = await getDocs(collection(db, orgPath(orgId, subcollection)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as T);
}

export async function fsGetById<T>(orgId: string, subcollection: string, id: string): Promise<T | null> {
  if (!isFirebaseConfigured()) return null;
  const db = getFirebaseFirestore();
  const snap = await getDoc(doc(db, orgPath(orgId, subcollection), id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as T;
}

export async function fsCreate<T extends DocumentData>(
  orgId: string, subcollection: string, data: T
): Promise<T & { id: string }> {
  const db = getFirebaseFirestore();
  const ref = await addDoc(collection(db, orgPath(orgId, subcollection)), data);
  return { ...data, id: ref.id } as T & { id: string };
}

export async function fsUpdate<T>(
  orgId: string, subcollection: string, id: string, data: Partial<T>
): Promise<T> {
  const db = getFirebaseFirestore();
  const ref = doc(db, orgPath(orgId, subcollection), id);
  await updateDoc(ref, data as DocumentData);
  const updated = await getDoc(ref);
  return { id: updated.id, ...updated.data() } as T;
}

export async function fsDelete(orgId: string, subcollection: string, id: string): Promise<boolean> {
  const db = getFirebaseFirestore();
  await deleteDoc(doc(db, orgPath(orgId, subcollection), id));
  return true;
}

export async function fsQuery<T>(
  orgId: string, subcollection: string,
  field: string, op: '==' | '>=' | '<=', value: unknown
): Promise<T[]> {
  if (!isFirebaseConfigured()) return [];
  const db = getFirebaseFirestore();
  const q = query(collection(db, orgPath(orgId, subcollection)), where(field, op, value));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as T);
}

export async function fsMarkAllRead(orgId: string): Promise<void> {
  if (!isFirebaseConfigured()) return;
  const db = getFirebaseFirestore();
  const snap = await getDocs(
    query(collection(db, orgPath(orgId, 'notifications')), where('read', '==', false))
  );
  const batch = writeBatch(db);
  snap.docs.forEach(d => batch.update(d.ref, { read: true }));
  await batch.commit();
}

export { orderBy, query, where, collection, getFirebaseFirestore, isFirebaseConfigured };
