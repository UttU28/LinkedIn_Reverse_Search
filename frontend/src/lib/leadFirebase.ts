import { db, serverTimestamp } from '../lib/firebase';
import { collection, addDoc, updateDoc, doc, Timestamp, getDocs, query, orderBy, limit } from 'firebase/firestore';

export interface PipelineItem {
  id?: string;
  name: string;
  position: string;
  time: Timestamp;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  cost?: number;
}

export interface LeadSearchRecord {
  pipelineId: string;
  time: Timestamp;
  cost: number | null;
  company: string;
  position: string;
}

// Interface for Pipeline record
export interface Pipeline {
  id?: string;
  company: string;
  position: string; 
  userID: string;
  timestamp: Timestamp;
  status: 'pending' | 'completed' | 'failed';
}

// Interface for Lead record
export interface LeadRecord {
  id?: string;
  pipelineId: string;
  timestamp: Timestamp;
  status: 'pending' | 'completed' | 'failed';
  results?: any[];
}

// Create a new pipeline document in Firebase
export const createPipeline = async (
  company: string,
  position: string,
  userId: string
): Promise<{ pipelineId: string; leadDocId: string }> => {
  try {
    // Create pipeline
    const pipelineData: Omit<Pipeline, 'id'> = {
      company,
      position,
      userID: userId,
      timestamp: serverTimestamp() as Timestamp,
      status: 'pending'
    };
    
    const pipelineRef = await addDoc(collection(db, 'pipelines'), pipelineData);
    
    // Create lead search record
    const leadData: Omit<LeadRecord, 'id'> = {
      pipelineId: pipelineRef.id,
      timestamp: serverTimestamp() as Timestamp,
      status: 'pending'
    };
    
    const leadRef = await addDoc(
      collection(db, 'users', userId, 'leadSearch'),
      leadData
    );
    
    return { 
      pipelineId: pipelineRef.id,
      leadDocId: leadRef.id 
    };
  } catch (error) {
    console.error('Error creating pipeline:', error);
    throw error;
  }
};

// Update a pipeline with completed status and cost
export const updatePipelineCompletion = async (
  pipelineId: string,
  userId: string,
  leadDocId: string,
  results?: any[]
): Promise<void> => {
  try {
    // Update pipeline status
    const pipelineRef = doc(db, 'pipelines', pipelineId);
    await updateDoc(pipelineRef, {
      status: 'completed',
      updatedAt: serverTimestamp()
    });
    
    // Update lead search record
    const leadRef = doc(db, 'users', userId, 'leadSearch', leadDocId);
    await updateDoc(leadRef, {
      status: 'completed',
      results: results || [],
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating pipeline completion:', error);
    throw error;
  }
};

/**
 * Updates the pipeline and lead search record as failed
 * @param pipelineId Pipeline ID to update
 * @param userID User ID
 * @param leadDocId Lead search document ID
 * @param reason Optional failure reason
 */
export const updatePipelineFailure = async (
  pipelineId: string,
  userID: string,
  leadDocId: string,
  reason?: string
): Promise<void> => {
  try {
    // Update pipeline status
    const pipelineRef = doc(db, 'pipelines', pipelineId);
    await updateDoc(pipelineRef, {
      status: 'failed',
      failureReason: reason || 'Unknown error',
      updatedAt: serverTimestamp()
    });
    
    // Update lead search record
    const leadRef = doc(db, 'users', userID, 'leadSearch', leadDocId);
    await updateDoc(leadRef, {
      status: 'failed',
      failureReason: reason || 'Unknown error',
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating pipeline failure:', error);
    throw error;
  }
};

/**
 * Gets recent lead searches for a user
 * @param userID User ID
 * @param limitCount Number of records to return
 * @returns Array of lead search records
 */
export const getRecentLeadSearches = async (
  userID: string,
  limitCount: number = 10
): Promise<LeadRecord[]> => {
  try {
    const leadSearchRef = collection(db, 'users', userID, 'leadSearch');
    const leadSearchQuery = query(
      leadSearchRef,
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(leadSearchQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as LeadRecord[];
  } catch (error) {
    console.error('Error getting recent lead searches:', error);
    throw error;
  }
}; 