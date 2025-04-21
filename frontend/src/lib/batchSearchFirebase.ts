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
  limit,
  where
} from 'firebase/firestore';

// Interface for Batch record
export interface Batch {
  id?: string;
  fileName: string;
  timestamp: Timestamp;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalRecords: number;
  processedRecords?: number;
  foundRecords?: number;
  contactIds?: string[];
  error?: string;
}

// Interface for BulkSearch record in user's collection
export interface BulkSearchRecord {
  id?: string;
  batchId: string;
  timestamp: Timestamp;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  cost: number | null;
  fileName: string;
  totalRecords: number;
  foundRecords?: number;
}

/**
 * Creates a new batch search in Firestore
 * @param userId User ID
 * @param fileName File name
 * @param totalRecords Total number of records in the batch
 * @returns Object containing the batch ID and bulk search document ID
 */
export const createBatchSearch = async (
  userId: string,
  fileName: string,
  totalRecords: number
): Promise<{ batchId: string, bulkSearchId: string }> => {
  try {
    // Create batch record
    const batchData: Omit<Batch, 'id'> = {
      fileName,
      timestamp: serverTimestamp() as Timestamp,
      status: 'pending',
      totalRecords,
      processedRecords: 0,
      foundRecords: 0
    };
    
    const batchRef = await addDoc(collection(db, 'batches'), batchData);
    
    // Create bulk search record for the user
    const bulkSearchData: Omit<BulkSearchRecord, 'id'> = {
      batchId: batchRef.id,
      timestamp: serverTimestamp() as Timestamp,
      status: 'pending',
      cost: null,
      fileName,
      totalRecords
    };
    
    const bulkSearchRef = await addDoc(
      collection(db, 'users', userId, 'bulkSearch'),
      bulkSearchData
    );
    
    return { 
      batchId: batchRef.id,
      bulkSearchId: bulkSearchRef.id 
    };
  } catch (error) {
    console.error('Error creating batch search:', error);
    throw error;
  }
};

/**
 * Updates the batch processing status
 * @param batchId Batch ID to update
 * @param userId User ID
 * @param bulkSearchId Bulk search document ID
 * @param processedRecords Number of records processed so far
 * @param foundRecords Number of records found so far
 */
export const updateBatchProcessing = async (
  batchId: string,
  userId: string,
  bulkSearchId: string,
  processedRecords: number,
  foundRecords: number
): Promise<void> => {
  try {
    // Update batch status
    const batchRef = doc(db, 'batches', batchId);
    await updateDoc(batchRef, {
      status: 'processing',
      processedRecords,
      foundRecords,
      updatedAt: serverTimestamp()
    });
    
    // Update bulk search record
    const bulkSearchRef = doc(db, 'users', userId, 'bulkSearch', bulkSearchId);
    await updateDoc(bulkSearchRef, {
      status: 'processing',
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating batch processing:', error);
    throw error;
  }
};

/**
 * Updates the batch and bulk search record with completion status
 * @param batchId Batch ID to update
 * @param userId User ID
 * @param bulkSearchId Bulk search document ID
 * @param processedRecords Total records processed
 * @param foundRecords Total records found
 * @param contactIds Array of contact IDs that were found
 * @param cost Total cost in credits
 */
export const updateBatchCompletion = async (
  batchId: string,
  userId: string,
  bulkSearchId: string,
  processedRecords: number,
  foundRecords: number,
  contactIds: string[],
  cost: number
): Promise<void> => {
  try {
    // Update batch status
    const batchRef = doc(db, 'batches', batchId);
    await updateDoc(batchRef, {
      status: 'completed',
      processedRecords,
      foundRecords,
      contactIds,
      updatedAt: serverTimestamp()
    });
    
    // Update bulk search record
    const bulkSearchRef = doc(db, 'users', userId, 'bulkSearch', bulkSearchId);
    await updateDoc(bulkSearchRef, {
      status: 'completed',
      cost,
      foundRecords,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating batch completion:', error);
    throw error;
  }
};

/**
 * Updates the batch and bulk search record as failed
 * @param batchId Batch ID to update
 * @param userId User ID
 * @param bulkSearchId Bulk search document ID
 * @param errorMessage Error message
 */
export const updateBatchFailure = async (
  batchId: string,
  userId: string,
  bulkSearchId: string,
  errorMessage: string
): Promise<void> => {
  try {
    // Update batch status
    const batchRef = doc(db, 'batches', batchId);
    await updateDoc(batchRef, {
      status: 'failed',
      error: errorMessage,
      updatedAt: serverTimestamp()
    });
    
    // Update bulk search record
    const bulkSearchRef = doc(db, 'users', userId, 'bulkSearch', bulkSearchId);
    await updateDoc(bulkSearchRef, {
      status: 'failed',
      error: errorMessage,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating batch failure:', error);
    throw error;
  }
};

/**
 * Gets batch data by ID
 * @param batchId Batch ID
 * @returns Batch data
 */
export const getBatchData = async (batchId: string): Promise<Batch | null> => {
  try {
    const batchDoc = await doc(db, 'batches', batchId);
    const batchSnapshot = await getDocs(
      query(
        collection(db, 'batches'),
        where('__name__', '==', batchId)
      )
    );
    
    if (batchSnapshot.empty) {
      return null;
    }
    
    const batchData = batchSnapshot.docs[0].data();
    return {
      id: batchId,
      ...batchData
    } as Batch;
  } catch (error) {
    console.error('Error getting batch data:', error);
    throw error;
  }
};

/**
 * Gets recent bulk searches for a user
 * @param userId User ID
 * @param limitCount Number of records to return
 * @returns Array of bulk search records
 */
export const getRecentBulkSearches = async (
  userId: string,
  limitCount: number = 10
): Promise<BulkSearchRecord[]> => {
  try {
    const bulkSearchRef = collection(db, 'users', userId, 'bulkSearch');
    const bulkSearchQuery = query(
      bulkSearchRef,
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(bulkSearchQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as BulkSearchRecord[];
  } catch (error) {
    console.error('Error getting recent bulk searches:', error);
    throw error;
  }
}; 