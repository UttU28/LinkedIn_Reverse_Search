import { db } from './firebase';
import { collection, getDocs, query, orderBy, limit, DocumentData, doc, getDoc } from 'firebase/firestore';

// Define interfaces for typed data
export interface SearchHistoryResult {
  id: string;
  type: 'single' | 'bulk' | 'recruiters' | 'team';
  status: string;
  inputMeta?: {
    name?: string;
    company?: string;
    position?: string;
    fileName?: string;
    companyUrl?: string;
    type?: string;
    totalRecords?: number;
    resultRefPath?: string;
  };
  totalRecords: number;
  resultRefPath?: string;
  createdAt: Date;
  completedAt?: Date;
}

// Keeping these for backward compatibility
export interface SingleSearchResult {
  id: string;
  searchName?: string;
  searchCompany?: string;
  searchPosition?: string;
  linkedinProfileUrl?: string | null;
  foundData?: number;
  timestamp?: Date;
  // Additional fields from the Firestore structure seen in the image
  name?: string;
  company?: string;
  position?: string;
  status?: string; 
  createdAt?: Date;
  completedAt?: Date;
  inputMeta?: {
    company?: string;
    type?: string;
    totalRecords?: number;
    resultRefPath?: string;
    status?: string;
  };
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
    console.log(`Fetching search history for user ID: ${userId}`);
    const result = {
      searchHistory: [] as SearchHistoryResult[],
      // For backward compatibility
      singleSearches: [] as SingleSearchResult[],
      bulkSearches: [] as BulkSearchResult[]
    };

    // Check if user ID is valid
    if (!userId) {
      console.error("Invalid user ID provided");
      return result;
    }

    // Fetch from consolidated searchHistory collection
    try {
      const searchHistoryRef = collection(db, 'users', userId, 'searchHistory');
      const searchHistoryQuery = query(searchHistoryRef, orderBy('createdAt', 'desc'), limit(20));
      const searchHistorySnapshot = await getDocs(searchHistoryQuery);
      
      console.log(`Found ${searchHistorySnapshot.docs.length} search history entries`);
      
      if (!searchHistorySnapshot.empty) {
        const searchHistoryData = searchHistorySnapshot.docs.map(doc => {
          const data = doc.data();
          console.log(`Processing search history doc: ${doc.id}`, data);
          
          // Convert to our internal format
          return {
            id: doc.id,
            type: data.type || 'single',
            status: data.status || 'pending',
            inputMeta: data.inputMeta || {},
            totalRecords: data.totalRecords || 0,
            resultRefPath: data.resultRefPath || '',
            createdAt: data.createdAt?.toDate() || new Date(),
            completedAt: data.completedAt?.toDate() || null
          } as SearchHistoryResult;
        });
        
        result.searchHistory = searchHistoryData;
        
        // For backward compatibility, categorize searches
        const singleSearches = searchHistoryData
          .filter(item => item.type === 'single')
          .map(item => ({
            id: item.id,
            searchName: item.inputMeta?.name || '',
            searchCompany: item.inputMeta?.company || '',
            searchPosition: item.inputMeta?.position || '',
            linkedinProfileUrl: null,
            foundData: item.completedAt ? 1 : 0,
            timestamp: item.createdAt,
            status: item.status
          })) as SingleSearchResult[];
        
        const bulkSearches = searchHistoryData
          .filter(item => item.type === 'bulk')
          .map(item => ({
            id: item.id,
            batchId: item.id,
            fileName: item.inputMeta?.fileName || 'Bulk Upload',
            totalData: item.totalRecords || 0,
            foundData: item.completedAt ? 1 : 0,
            timestamp: item.createdAt,
            status: item.status
          })) as BulkSearchResult[];
        
        result.singleSearches = singleSearches;
        result.bulkSearches = bulkSearches;
      }
    } catch (err) {
      console.error("Error fetching search history:", err);
    }

    console.log("Final search history result:", result);
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