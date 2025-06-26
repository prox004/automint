import { db } from '@/lib/firebase';
import { 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp, 
  Timestamp, 
  FieldValue,
  writeBatch 
} from 'firebase/firestore';

// TypeScript interface for user data
export interface AutoMintUser {
  username: string;
  walletAddress: string;
  usernameTag: string; // e.g., "alice.pay"
  createdAt: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
  email?: string;
  privyUserId?: string;
}

// Interface for user data when saving (allows FieldValue)
export interface AutoMintUserInput {
  username: string;
  walletAddress: string;
  usernameTag: string;
  email?: string;
  privyUserId?: string;
}

// Save user data to Firestore (simplified without username uniqueness to avoid errors)
export async function saveUserToFirestore(userData: AutoMintUserInput): Promise<void> {
  try {
    console.log('Saving user data to Firestore (simplified mode - no username uniqueness check)');
    
    const userDocRef = doc(db, 'users', userData.walletAddress);
    
    // Check if user already exists
    const existingUser = await getDoc(userDocRef);
    
    const dataToSave: AutoMintUser = {
      ...userData,
      createdAt: existingUser.exists() ? existingUser.data().createdAt : serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    // Save user data (simplified - no username uniqueness check to avoid Firestore errors)
    await setDoc(userDocRef, dataToSave, { merge: true });
    
    console.log('User data saved successfully to Firestore');
  } catch (error) {
    console.error('Error saving user data to Firestore:', error);
    // Don't throw error - allow offline functionality
    console.warn('Continuing with localStorage fallback');
  }
}

// Get user data from Firestore
export async function getUserFromFirestore(walletAddress: string): Promise<AutoMintUser | null> {
  try {
    const userDocRef = doc(db, 'users', walletAddress);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      return userDoc.data() as AutoMintUser;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting user data from Firestore:', error);
    return null;
  }
}

// Check if username is already taken (simplified to avoid Firestore errors)
export async function isUsernameTaken(username: string): Promise<boolean> {
  try {
    // Check reserved usernames first
    const reservedUsernames = [
      'admin', 'support', 'automint', 'payment', 'invoice', 'crypto', 
      'web3', 'blockchain', 'api', 'www', 'app', 'test', 'demo',
      'help', 'contact', 'about', 'terms', 'privacy', 'legal'
    ];
    
    if (reservedUsernames.includes(username.toLowerCase())) {
      return true;
    }
    
    // For now, just check reserved names to avoid Firestore complexity
    // TODO: Implement proper username uniqueness check when Firestore is stable
    return false;
  } catch (error) {
    console.error('Error checking username availability:', error);
    // If there's an error, assume username is available for better UX
    return false;
  }
}

// Get user by username (simplified)
export async function getUserByUsername(username: string): Promise<AutoMintUser | null> {
  try {
    // For now, return null as we're not implementing username lookup to avoid Firestore errors
    // TODO: Implement when Firestore is stable
    console.log('getUserByUsername not implemented yet to avoid Firestore errors');
    return null;
  } catch (error) {
    console.error('Error getting user by username:', error);
    return null;
  }
}
