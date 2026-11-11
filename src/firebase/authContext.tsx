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
  signInAsAdmin: () => void;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  registerProfile: (displayName: string, role: RoleType, mission?: string) => Promise<void>;
}

export interface PreconfiguredAccount {
  email: string;
  passwords: string[];
  role: RoleType;
  displayName: string;
  mission: string;
}

export const PRECONFIGURED_ACCOUNTS: Record<string, PreconfiguredAccount> = {
  'universite@-uhl.cg': {
    email: 'universite@-uhl.cg',
    passwords: ['uhl2026', 'uhl', 'surveillant', '123456'],
    role: 'surveillant',
    displayName: 'Surveillant Général (UHL)',
    mission: 'Accueil, guérite principale, contrôle des accès et badgeuse QR Code',
  },
  'universite@uhl.cg': {
    email: 'universite@uhl.cg',
    passwords: ['uhl2026', 'uhl', 'surveillant', '123456'],
    role: 'surveillant',
    displayName: 'Surveillant Général (UHL)',
    mission: 'Accueil, guérite principale, contrôle des accès et badgeuse QR Code',
  },
  'surveillant@-uhl.cg': {
    email: 'surveillant@-uhl.cg',
    passwords: ['uhl2026', 'uhl', 'surveillant', '123456'],
    role: 'surveillant',
    displayName: 'M. Gaston Ngoma (Surveillant Principal)',
    mission: 'Accueil, guérite principale, contrôle des accès et badgeuse QR Code',
  },
  'surveillant@universite-henrilopes.cg': {
    email: 'surveillant@universite-henrilopes.cg',
    passwords: ['uhl2026', 'uhl', 'surveillant', '123456'],
    role: 'surveillant',
    displayName: 'M. Gaston Ngoma (Surveillant Principal)',
    mission: 'Accueil, guérite principale, contrôle des accès et badgeuse QR Code',
  },
  'surveillant@uhl.cg': {
    email: 'surveillant@uhl.cg',
    passwords: ['uhl2026', 'uhl', 'surveillant', '123456'],
    role: 'surveillant',
    displayName: 'M. Gaston Ngoma (Surveillant Principal)',
    mission: 'Accueil, guérite principale, contrôle des accès et badgeuse QR Code',
  },
  'g.ngoma@universite-henrilopes.cg': {
    email: 'g.ngoma@universite-henrilopes.cg',
    passwords: ['uhl2026', 'uhl', 'surveillant', '123456'],
    role: 'surveillant',
    displayName: 'M. Gaston Ngoma',
    mission: 'Responsable guérite principale et badgeuse campus UHL',
  },
  'smithrabe35@gmail.com': {
    email: 'smithrabe35@gmail.com',
    passwords: ['uhl2026', 'admin2026', '123456'],
    role: 'admin',
    displayName: 'Administrateur Général (smithrabe35)',
    mission: 'Administration générale et supervision du campus UHL',
  },
  'admin@universite-henrilopes.cg': {
    email: 'admin@universite-henrilopes.cg',
    passwords: ['uhl2026', 'admin2026', '123456'],
    role: 'admin',
    displayName: 'Administrateur Général',
    mission: 'Administration générale de l’Université Henri Lopes',
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch or sync user profile from Firestore
  const fetchProfile = async (firebaseUser: User): Promise<UserProfileData | null> => {
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
      console.warn('Impossible de charger le profil Firestore:', err);
      return null;
    }
  };

  useEffect(() => {
    testFirestoreConnection();

    // Check for cached local session first
    const cachedSession = localStorage.getItem('uhl_active_user');
    if (cachedSession) {
      try {
        const parsed = JSON.parse(cachedSession);
        if (parsed?.user && parsed?.profile) {
          setUser(parsed.user);
          setProfile(parsed.profile);
        }
      } catch {
        localStorage.removeItem('uhl_active_user');
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const userDoc = await fetchProfile(currentUser);
          if (!userDoc) {
            const isSuperAdmin = currentUser.email === 'smithrabe35@gmail.com';
            await registerProfile(
              currentUser.displayName || currentUser.email?.split('@')[0] || 'Utilisateur',
              isSuperAdmin ? 'admin' : 'enseignant'
            );
          }
        } catch {
          // Handled gracefully
        }
      } else {
        // If no firebase user, check if we had a preconfigured user in localStorage
        const stored = localStorage.getItem('uhl_active_user');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed?.user && parsed?.profile) {
              setUser(parsed.user);
              setProfile(parsed.profile);
            } else {
              setUser(null);
              setProfile(null);
            }
          } catch {
            setUser(null);
            setProfile(null);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
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
      setUser(res.user);

      const isSuperAdmin = res.user.email === 'smithrabe35@gmail.com';
      const targetRole: RoleType = isSuperAdmin ? 'admin' : 'enseignant';
      const targetStatus = isSuperAdmin ? 'approved' : 'pending';

      try {
        const userDoc = await fetchProfile(res.user);
        if (!userDoc) {
          await registerProfile(
            res.user.displayName || res.user.email?.split('@')[0] || 'Utilisateur',
            targetRole,
            isSuperAdmin ? 'Administration générale de l’Université Henri Lopes' : 'Corps enseignant'
          );
        }
      } catch (profileErr) {
        console.warn('Profile fetch/creation deferred:', profileErr);
        const fallbackProfile: UserProfileData = {
          userId: res.user.uid,
          email: res.user.email || '',
          displayName: res.user.displayName || res.user.email?.split('@')[0] || 'Utilisateur',
          role: targetRole,
          status: targetStatus,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setProfile(fallbackProfile);
        localStorage.setItem('uhl_active_user', JSON.stringify({ user: res.user, profile: fallbackProfile }));
        localStorage.setItem('uhl_active_role', targetRole);
      }
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();

    // Check preconfigured access (e.g. surveillant role)
    const preconf = PRECONFIGURED_ACCOUNTS[cleanEmail];
    if (preconf) {
      if (!preconf.passwords.includes(cleanPass)) {
        setLoading(false);
        const err: any = new Error('Mot de passe incorrect pour cet accès.');
        err.code = 'auth/wrong-password';
        throw err;
      }

      const simulatedUid = `uhl-usr-${cleanEmail.replace(/[^a-z0-9]/g, '_')}`;
      const simulatedUser = {
        uid: simulatedUid,
        email: preconf.email,
        displayName: preconf.displayName,
        emailVerified: true,
      } as unknown as User;

      const profileData: UserProfileData = {
        userId: simulatedUid,
        email: preconf.email,
        displayName: preconf.displayName,
        role: preconf.role,
        status: 'approved',
        mission: preconf.mission,
        createdAt: '2026-09-01T00:00:00.000Z',
        updatedAt: new Date().toISOString(),
      };

      setUser(simulatedUser);
      setProfile(profileData);
      localStorage.setItem('uhl_active_user', JSON.stringify({ user: simulatedUser, profile: profileData }));
      localStorage.setItem('uhl_active_role', preconf.role);

      // Best effort background sync to Firestore
      try {
        await setDoc(doc(db, 'users', simulatedUid), profileData, { merge: true });
      } catch (e) {
        console.warn('Syncing preconfigured user to Firestore:', e);
      }

      setLoading(false);
      return;
    }

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
    const isSuperAdmin = auth.currentUser.email === 'smithrabe35@gmail.com';
    const computedRole: RoleType = isSuperAdmin ? 'admin' : role;
    const computedStatus = isSuperAdmin ? 'approved' : 'pending';
    const computedMission = mission || (isSuperAdmin ? 'Administration générale de l’Université Henri Lopes' : '');

    const newProfile: UserProfileData = {
      userId: uid,
      email: auth.currentUser.email || '',
      displayName: displayName || auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'Utilisateur',
      role: computedRole,
      status: computedStatus,
      mission: computedMission,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (auth.currentUser.photoURL) {
      newProfile.photoURL = String(auth.currentUser.photoURL).slice(0, 500);
    }
    try {
      await setDoc(doc(db, 'users', uid), newProfile);
      setProfile(newProfile);
    } catch (err) {
      console.warn('Erreur Firestore lors de setDoc registerProfile:', err);
      setProfile(newProfile);
      try {
        handleFirestoreError(err, OperationType.CREATE, docPath);
      } catch {
        // Silently handled so user flow is not interrupted
      }
    }
  };

  const signInAsAdmin = () => {
    const adminUser = {
      uid: 'admin-smithrabe35',
      email: 'smithrabe35@gmail.com',
      displayName: 'Administrateur Général (smithrabe35)',
      emailVerified: true,
    } as unknown as User;
    const adminProfile: UserProfileData = {
      userId: 'admin-smithrabe35',
      email: 'smithrabe35@gmail.com',
      displayName: 'Administrateur Général (smithrabe35)',
      role: 'admin',
      status: 'approved',
      mission: 'Administration générale et supervision du campus UHL',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setUser(adminUser);
    setProfile(adminProfile);
    localStorage.setItem('uhl_active_user', JSON.stringify({ user: adminUser, profile: adminProfile }));
    localStorage.setItem('uhl_active_role', 'admin');
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch {
      // Ignore
    }
    localStorage.removeItem('uhl_active_user');
    localStorage.removeItem('uhl_active_role');
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
        signInAsAdmin,
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
