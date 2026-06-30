import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let firestore: Firestore | null = null;

export function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
}

export function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured. Set VITE_FIREBASE_* environment variables.');
  }
  if (!app) app = initializeApp(firebaseConfig);
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!auth) auth = getAuth(getFirebaseApp());
  return auth;
}

export function getFirebaseFirestore(): Firestore {
  if (!firestore) firestore = getFirestore(getFirebaseApp());
  return firestore;
}

export const COLLECTIONS = {
  organizations: 'organizations',
  branches: 'branches',
  patients: 'patients',
  appointments: 'appointments',
  services: 'services',
  doctors: 'doctors',
  leads: 'leads',
  notifications: 'notifications',
  waitlist: 'waitlist',
  auditLogs: 'auditLogs',
  settings: 'settings',
} as const;

export function orgCollection(orgId: string, collection: string) {
  return `${COLLECTIONS.organizations}/${orgId}/${collection}`;
}
