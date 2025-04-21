import { db, serverTimestamp } from '../lib/firebase';
import { collection, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';

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

// Create a new pipeline document in Firebase
export const createPipeline = async (
  company: string,
  position: string,
  userId: string
): Promise<{ pipelineId: string; leadDocId: string }> => {
  try {
    // Create pipeline record
    const pipelineData = {
      name: company,
      position: position,
      time: serverTimestamp(),
      status: 'pending'
    };
    
    // Add to pipelines collection with auto-generated ID
    const pipelineRef = await addDoc(collection(db, 'pipelines'), pipelineData);
    const pipelineId = pipelineRef.id;
    
    // Create a lead record in the user document
    const leadData = {
      pipelineId: pipelineId,
      time: serverTimestamp(),
      cost: null, // Will update after backend response
      company: company,
      position: position
    };
    
    // Add to users/{userId}/lead collection with auto-generated ID
    const leadCollectionRef = collection(db, 'users', userId, 'leadSearch');
    const leadDocRef = await addDoc(leadCollectionRef, leadData);
    const leadDocId = leadDocRef.id;
    
    return { pipelineId, leadDocId };
  } catch (error) {
    console.error('Error creating pipeline:', error);
    throw error;
  }
};

// Update a pipeline with completed status and cost
export const updatePipelineCompletion = async (
  pipelineId: string,
  userId: string,
  leadDocId: string
): Promise<void> => {
  try {
    // Update pipeline status to completed
    const pipelineRef = doc(db, 'pipelines', pipelineId);
    await updateDoc(pipelineRef, {
      status: 'completed',
      cost: 1, // Cost is 1 credit for lead search
      completedAt: serverTimestamp()
    });
    
    // Update lead record with cost
    const leadRef = doc(db, 'users', userId, 'leadSearch', leadDocId);
    await updateDoc(leadRef, {
      cost: 1 // Update cost in user's lead record
    });
  } catch (error) {
    console.error('Error updating pipeline completion:', error);
    throw error;
  }
}; 