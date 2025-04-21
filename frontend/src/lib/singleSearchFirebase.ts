import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  serverTimestamp, 
  Timestamp,
  getDocs,
  query,
  orderBy,
  limit
} from 'firebase/firestore';

// Interface for Contact record
export interface Contact {
  id?: string;
  searchName: string;
  searchCompany: string;
  searchPosition: string;
  linkedinProfileUrl?: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: Timestamp;
  foundData?: boolean;
}

// Interface for SingleSearch record in user's collection
export interface SingleSearchRecord {
  id?: string;
  contactId: string;
  timestamp: Timestamp;
  status: 'pending' | 'completed' | 'failed';
  cost: number | null;
}

/**
 * Creates a new contact search in Firestore
 * @param userId User ID
 * @param searchName Name to search
 * @param searchCompany Company to search
 * @param searchPosition Position to search
 * @returns Object containing the contact ID and single search document ID
 */
export const createSingleSearch = async (
  userId: string,
  searchName: string,
  searchCompany: string,
  searchPosition: string
): Promise<{ contactId: string, singleSearchId: string }> => {
  try {
    // Create contact record
    const contactData: Omit<Contact, 'id'> = {
      searchName,
      searchCompany,
      searchPosition,
      status: 'pending',
      timestamp: serverTimestamp() as Timestamp
    };
    
    const contactRef = await addDoc(collection(db, 'contacts'), contactData);
    
    // Create single search record for the user
    const singleSearchData: Omit<SingleSearchRecord, 'id'> = {
      contactId: contactRef.id,
      timestamp: serverTimestamp() as Timestamp,
      status: 'pending',
      cost: null
    };
    
    const singleSearchRef = await addDoc(
      collection(db, 'users', userId, 'singleSearch'),
      singleSearchData
    );
    
    return { 
      contactId: contactRef.id,
      singleSearchId: singleSearchRef.id 
    };
  } catch (error) {
    console.error('Error creating single search:', error);
    throw error;
  }
};

/**
 * Updates the contact and single search record with completion status
 * @param contactId Contact ID to update
 * @param userId User ID
 * @param singleSearchId Single search document ID
 * @param linkedinProfileUrl LinkedIn profile URL if found
 * @param foundData Whether data was found
 */
export const updateSingleSearchCompletion = async (
  contactId: string,
  userId: string,
  singleSearchId: string,
  linkedinProfileUrl?: string,
  foundData?: boolean
): Promise<void> => {
  try {
    // Update contact status
    const contactRef = doc(db, 'contacts', contactId);
    await updateDoc(contactRef, {
      status: 'completed',
      linkedinProfileUrl,
      foundData: foundData || false,
      updatedAt: serverTimestamp()
    });
    
    // Update single search record
    const singleSearchRef = doc(db, 'users', userId, 'singleSearch', singleSearchId);
    await updateDoc(singleSearchRef, {
      status: 'completed',
      cost: 1, // Single search costs 1 credit
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating single search completion:', error);
    throw error;
  }
};

/**
 * Updates the contact and single search record as failed
 * @param contactId Contact ID to update
 * @param userId User ID
 * @param singleSearchId Single search document ID
 * @param reason Optional failure reason
 */
export const updateSingleSearchFailure = async (
  contactId: string,
  userId: string,
  singleSearchId: string,
  reason?: string
): Promise<void> => {
  try {
    // Update contact status
    const contactRef = doc(db, 'contacts', contactId);
    await updateDoc(contactRef, {
      status: 'failed',
      failureReason: reason || 'Unknown error',
      updatedAt: serverTimestamp()
    });
    
    // Update single search record
    const singleSearchRef = doc(db, 'users', userId, 'singleSearch', singleSearchId);
    await updateDoc(singleSearchRef, {
      status: 'failed',
      failureReason: reason || 'Unknown error',
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating single search failure:', error);
    throw error;
  }
};

/**
 * Gets recent single searches for a user
 * @param userId User ID
 * @param limitCount Number of records to return
 * @returns Array of single search records with contact data
 */
export const getRecentSingleSearches = async (
  userId: string,
  limitCount: number = 10
): Promise<(SingleSearchRecord & { contact?: Contact })[]> => {
  try {
    const singleSearchRef = collection(db, 'users', userId, 'singleSearch');
    const singleSearchQuery = query(
      singleSearchRef,
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(singleSearchQuery);
    const singleSearches = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as SingleSearchRecord[];
    
    // Get contact IDs from single searches
    const contactIds = singleSearches.map(ss => ss.contactId);
    
    // Get contact data for these IDs
    const contactData: Record<string, Contact> = {};
    
    // Query contacts batch by batch (Firestore 'in' queries are limited to 10 items)
    for (let i = 0; i < contactIds.length; i += 10) {
      const batch = contactIds.slice(i, i + 10);
      const contactsRef = collection(db, 'contacts');
      
      for (const contactId of batch) {
        try {
          const contactDoc = await doc(db, 'contacts', contactId);
          const contactSnapshot = await getDocs(contactsRef);
          contactSnapshot.docs.forEach(doc => {
            if (doc.id === contactId) {
              contactData[contactId] = {
                id: doc.id,
                ...doc.data()
              } as Contact;
            }
          });
        } catch (error) {
          console.error(`Error getting contact ${contactId}:`, error);
        }
      }
    }
    
    // Combine single search with contact data
    return singleSearches.map(ss => ({
      ...ss,
      contact: contactData[ss.contactId]
    }));
  } catch (error) {
    console.error('Error getting recent single searches:', error);
    throw error;
  }
}; 