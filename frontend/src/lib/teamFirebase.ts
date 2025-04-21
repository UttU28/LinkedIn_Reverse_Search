import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  serverTimestamp, 
  Timestamp
} from 'firebase/firestore';

// Interface for Team search
export interface TeamSearch {
  id?: string;
  url: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: Timestamp;
  teamUrl: string | null;
}

// Interface for user's company search record
export interface CompanySearchRecord {
  id?: string;
  teamId: string;
  timestamp: Timestamp;
  cost: number | null;
}

/**
 * Creates a new team search record in Firestore
 * @param url - Company URL to search
 * @returns The created team ID
 */
export const createTeamSearch = async (url: string): Promise<string> => {
  try {
    // Create a new team search document
    const teamData: Omit<TeamSearch, 'id'> = {
      url,
      status: 'pending',
      timestamp: serverTimestamp() as Timestamp,
      teamUrl: null
    };
    
    const teamRef = await addDoc(collection(db, 'teams'), teamData);
    
    return teamRef.id;
  } catch (error) {
    console.error('Error creating team search:', error);
    throw error;
  }
};

/**
 * Creates a company search record for the user
 * @param userId - User ID
 * @param teamId - Team search ID
 * @returns The created company search record ID
 */
export const createCompanySearchRecord = async (
  userId: string,
  teamId: string
): Promise<string> => {
  try {
    // Create a company search record for the user
    const companySearchData: Omit<CompanySearchRecord, 'id'> = {
      teamId,
      timestamp: serverTimestamp() as Timestamp,
      cost: null
    };
    
    const companySearchRef = await addDoc(
      collection(db, 'users', userId, 'companySearch'),
      companySearchData
    );
    
    return companySearchRef.id;
  } catch (error) {
    console.error('Error creating company search record:', error);
    throw error;
  }
};

/**
 * Updates the status of a team search
 * @param teamId - Team search ID
 * @param status - New status
 * @param teamUrl - Optional team URL if found
 */
export const updateTeamSearchStatus = async (
  teamId: string,
  status: 'completed' | 'failed',
  teamUrl: string | null = null
): Promise<void> => {
  try {
    const teamRef = doc(db, 'teams', teamId);
    
    await updateDoc(teamRef, {
      status,
      teamUrl,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating team search status:', error);
    throw error;
  }
};

/**
 * Updates the cost of a company search record
 * @param userId - User ID
 * @param companySearchId - Company search record ID
 * @param cost - Search cost
 */
export const updateCompanySearchCost = async (
  userId: string,
  companySearchId: string,
  cost: number
): Promise<void> => {
  try {
    const companySearchRef = doc(
      db, 'users', userId, 'companySearch', companySearchId
    );
    
    await updateDoc(companySearchRef, {
      cost,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating company search cost:', error);
    throw error;
  }
}; 