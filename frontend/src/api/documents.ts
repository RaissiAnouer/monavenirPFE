import client from './client';
import { Document } from '../types/document';

export const fetchDocuments = async (courseId: string): Promise<Document[]> => {
    try {
        const response = await client.get(`/courses/${courseId}/documents`);
        return response.data as Document[];
    } catch (error) {
        console.error('Error fetching documents:', error);
        
        if (error instanceof Error) {
            throw new Error(error.message || 'Failed to fetch documents');
        } else {
            throw new Error('Failed to fetch documents');
        }
    }
};

export const uploadDocument = async (courseId: string, documentData: FormData): Promise<Document> => {
  try {
    const response = await client.post(`/api/courses/${courseId}/documents`, documentData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data as Document;
  } catch (error: any) {
    console.error('Error uploading document:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to upload document');
  }
}; 