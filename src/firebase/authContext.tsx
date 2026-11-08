import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile as firebaseUpdateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, testFirestoreConnection } from './config';
import { handleFirestoreError, OperationType } from './errors';
import { RoleType } from '../types';

export interface UserProfileData {
  userId: string;
  email: string;
  displayName: string;
  role: RoleType;
  status: 'pending' | 'approved' | 'rejected';
  mission?: string;
  photoURL?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfileData | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    pass: string,
    displayName: string,
    desiredRole: RoleType
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  registerProfile: (displayName: string, role: RoleType, mission?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch or sync user profile from Firestore
  const fetchProfile = async (firebaseUser: User): Promise<UserProfileData | null> => {
    const docPath = `users/${firebaseUser.uid}`;
    try {
      const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (snap.exists()) {
        const data = snap.data() as UserProfileData;
        setProfile(data);
        return data;
      } else {
        setProfile(null);
        return null;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, docPath);
    }
  };

  useEffect(() => {
    testFirestoreConnection();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          await fetchProfile(currentUser);
        } catch {
          // Handled or profile doesn't exist yet
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      const res = await signInWithPopup(auth, provider);
      const userDoc = await fetchProfile(res.user);
      // Auto-create initial profile if first time
      if (!userDoc) {
        await registerProfile(
          res.user.displayName || 'Utilisateur',
          'enseignant'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const res = await signInWithEmailAndPassword(auth, email, pass);
      await fetchProfile(res.user);
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (
    email: string,
    pass: string,
    displayName: string,
    desiredRole: RoleType
  ) => {
    setLoading(true);
    try {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      if (displayName) {
        await firebaseUpdateProfile(res.user, { displayName });
      }
      const newProfile: UserProfileData = {
        userId: res.user.uid,
        email: res.user.email || email,
        displayName: displayName || email.split('@')[0],
        role: desiredRole,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const docPath = `users/${res.user.uid}`;
      try {
        await setDoc(doc(db, 'users', res.user.uid), newProfile);
        setProfile(newProfile);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, docPath);
      }
    } finally {
      setLoading(false);
    }
  };

  const registerProfile = async (
    displayName: string,
    role: RoleType,
    mission?: string
  ) => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const docPath = `users/${uid}`;
    const newProfile: UserProfileData = {
      userId: uid,
      email: auth.currentUser.email || '',
      displayName: displayName || auth.currentUser.displayName || 'Utilisateur',
      role,
      status: 'pending',
      mission: mission || '',
      photoURL: auth.currentUser.photoURL || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, 'users', uid), newProfile);
      setProfile(newProfile);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, docPath);
    }
  };

  const logout = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (auth.currentUser) {
      await fetchProfile(auth.currentUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        logout,
        refreshProfile,
        registerProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
