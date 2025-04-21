import { db } from './firebase';
import { collection, getDocs, query, orderBy, limit, DocumentData, doc, getDoc } from 'firebase/firestore';

// Define interfaces for typed data
export interface SingleSearchResult {
  id: string;
  searchName: string;
  searchCompany: string;
  searchPosition: string;
  linkedinProfileUrl: string | null;
  foundData: number;
  timestamp: Date;
}

export interface BulkSearchResult {
  id: string;
  batchId: string;
  fileName: string;
  totalData: number;
  foundData: number;
  timestamp: Date;
  status: string;
}

export interface BatchData {
  userID: string;
  contactIds: string[];
  batchId: string;
  fileName: string;
  recordCount: number;
  status: string;
  successCount?: number;
  createdAt: Date;
  completedAt?: Date;
}

export interface ContactData {
  id: string;
  name: string;
  company: string;
  position: string;
  createdAt: any;
  [key: string]: any; // For any additional fields
}

// Function to fetch user's search history
export const fetchSearchHistory = async (userId: string) => {
  try {
    const result = {
      singleSearches: [] as SingleSearchResult[],
      bulkSearches: [] as BulkSearchResult[]
    };

    // Fetch single searches
    const singleSearchRef = collection(db, 'users', userId, 'singleSearch');
    const singleSearchQuery = query(singleSearchRef, orderBy('timestamp', 'desc'), limit(10));
    const singleSearchSnapshot = await getDocs(singleSearchQuery);
    const singleSearchData = singleSearchSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date(),
    })) as SingleSearchResult[];
    result.singleSearches = singleSearchData;

    // Fetch bulk searches
    const bulkSearchRef = collection(db, 'users', userId, 'bulkSearch');
    const bulkSearchQuery = query(bulkSearchRef, orderBy('timestamp', 'desc'), limit(10));
    const bulkSearchSnapshot = await getDocs(bulkSearchQuery);
    const bulkSearchData = bulkSearchSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date(),
    })) as BulkSearchResult[];
    result.bulkSearches = bulkSearchData;

    return result;
  } catch (error) {
    console.error('Error fetching search history:', error);
    throw error;
  }
};

// Function to fetch batch data by ID
export const fetchBatchData = async (batchDocId: string) => {
  try {
    const batchRef = doc(db, 'batches', batchDocId);
    const batchSnap = await getDoc(batchRef);
    
    if (batchSnap.exists()) {
      const batchData = {
        ...batchSnap.data(),
        createdAt: batchSnap.data().createdAt?.toDate() || new Date(),
        completedAt: batchSnap.data().completedAt?.toDate() || null
      } as BatchData;
      
      return batchData;
    } else {
      console.error('No batch found with ID:', batchDocId);
      return null;
    }
  } catch (error) {
    console.error('Error fetching batch data:', error);
    throw error;
  }
};

// Function to fetch contact data for each contact ID
export const fetchContactsData = async (contactIds: string[]) => {
  try {
    console.log(`Fetching data for ${contactIds.length} contacts...`);
    const contactsData: ContactData[] = [];
    
    // Fetch each contact data in sequence
    for (const contactId of contactIds) {
      try {
        const contactRef = doc(db, 'contacts', contactId);
        const contactSnap = await getDoc(contactRef);
        
        if (contactSnap.exists()) {
          const contactData = {
            id: contactId,
            ...contactSnap.data(),
            createdAt: contactSnap.data().createdAt?.toDate() || new Date()
          } as ContactData;
          
          contactsData.push(contactData);
        } else {
          console.log(`Contact ${contactId} not found in database`);
        }
      } catch (error) {
        console.error(`Error fetching contact ${contactId}:`, error);
      }
    }
    
    return contactsData;
  } catch (error) {
    console.error('Error fetching contacts data:', error);
    throw error;
  }
}; 