import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  serverTimestamp, 
  Timestamp,
  query,
  orderBy,
  limit,
  getDocs,
  where
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
  status: 'pending' | 'completed' | 'failed';
}

// Combined interface for displaying history
export interface CombinedTeamSearchItem {
  id: string;
  url: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: Timestamp;
  teamUrl: string | null;
  companySearchId: string;
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
      cost: null,
      status: 'pending'
    };
    
    const companySearchRef = await addDoc(
      collection(db, 'users', userId, 'teamSearch'),
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
 * Updates the user's company search record with a new status
 * @param userId - User ID
 * @param companySearchId - Company search record ID
 * @param status - New status
 */
export const updateCompanySearchStatus = async (
  userId: string,
  companySearchId: string,
  status: 'completed' | 'failed'
): Promise<void> => {
  try {
    const companySearchRef = doc(
      db, 'users', userId, 'teamSearch', companySearchId
    );
    
    await updateDoc(companySearchRef, {
      status,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating company search status:', error);
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
      db, 'users', userId, 'teamSearch', companySearchId
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

/**
 * Gets recent team searches for a user
 * @param userId User ID
 * @param limitCount Number of records to return
 * @returns Array of combined team search records
 */
export const getRecentTeamSearches = async (
  userId: string,
  limitCount: number = 10
): Promise<CombinedTeamSearchItem[]> => {
  try {
    // Get user's company search history
    const companySearchRef = collection(db, 'users', userId, 'teamSearch');
    const companySearchQuery = query(
      companySearchRef,
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    const companySearchSnapshot = await getDocs(companySearchQuery);
    const companySearches = companySearchSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as CompanySearchRecord[];
    
    // Get the team IDs from the company searches
    const teamIds = companySearches.map(search => search.teamId);
    
    if (teamIds.length === 0) {
      return [];
    }
    
    // Get the team search details
    const teamsRef = collection(db, 'teams');
    const teamsQuery = query(
      teamsRef,
      where('__name__', 'in', teamIds)
    );
    
    const teamsSnapshot = await getDocs(teamsQuery);
    const teamSearchMap = new Map<string, TeamSearch>();
    
    teamsSnapshot.docs.forEach(doc => {
      teamSearchMap.set(doc.id, {
        id: doc.id,
        ...doc.data()
      } as TeamSearch);
    });
    
    // Combine the data
    const combinedData = companySearches
      .filter(cs => teamSearchMap.has(cs.teamId)) // Filter out any without team data
      .map(cs => {
        const teamSearch = teamSearchMap.get(cs.teamId)!;
        return {
          id: teamSearch.id || '',           // Ensure id is always a string
          url: teamSearch.url,
          status: cs.status, // Use status from companySearch
          timestamp: cs.timestamp || teamSearch.timestamp,
          teamUrl: teamSearch.teamUrl,
          companySearchId: cs.id || ''       // Ensure companySearchId is always a string
        } as CombinedTeamSearchItem;
      });
    
    // Sort by timestamp (descending)
    combinedData.sort((a, b) => {
      const aTime = a.timestamp?.toMillis() || 0;
      const bTime = b.timestamp?.toMillis() || 0;
      return bTime - aTime;
    });
    
    return combinedData;
  } catch (error) {
    console.error('Error getting recent team searches:', error);
    throw error;
  }
}; 