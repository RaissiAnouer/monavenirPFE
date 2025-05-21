import client from './client';
import { Course } from '../types/course';

// Get all courses
export const getCourses = async (): Promise<Course[]> => {
  try {
    const response = await client.get('/api/courses');
    return response.data as Course[];
  } catch (error: any) {
    console.error('Error fetching courses:', error.response?.data || error.message);
    throw error;
  }
};

// Get a single course by ID
export const getCourseById = async (id: string): Promise<Course> => {
  try {
    // Validate ID format before making the request
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      throw new Error('Invalid course ID format');
    }
    
    const response = await client.get(`/api/courses/${id}`);
    return response.data as Course;
  } catch (error: any) {
    console.error('Error fetching course details:', error.response?.data || error.message);
    throw error;
  }
};

// Create a new course
export const createCourse = async (courseData: FormData): Promise<Course> => {
  try {
    const response = await client.post('/api/courses', courseData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data as Course;
  } catch (error: any) {
    console.error('Error creating course:', error.response?.data || error.message);
    throw error;
  }
};

// Update an existing course
export const updateCourse = async (id: string, courseData: FormData): Promise<Course> => {
  try {
    const response = await client.put(`/api/courses/${id}`, courseData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data as Course;
  } catch (error: any) {
    console.error('Error updating course:', error.response?.data || error.message);
    throw error;
  }
};

// Delete a course
export const deleteCourse = async (id: string): Promise<void> => {
  try {
    console.log('Deleting course with ID:', id);
    // The backend route is specified correctly, but there might be an issue with case sensitivity or ID format
    // Adding additional validation before making the request
    if (!id || id.trim() === '') {
      throw new Error('Invalid course ID provided');
    }
    
    const response = await client.delete(`/api/courses/${id}`);
    console.log('Course deleted successfully:', response.data);
  } catch (error: any) {
    console.error('Error deleting course:', error.response?.data || error.message || error);
    throw error;
  }
};

// Enroll in a course
export const enrollInCourse = async (courseId: string): Promise<any> => {
  try {
    const response = await client.post(`/api/courses/${courseId}/enroll`);
    return response.data;
  } catch (error: any) {
    console.error('Error enrolling in course:', error.response?.data || error.message);
    throw error;
  }
};

// Get enrolled courses for the current user
export const getEnrolledCourses = async (): Promise<Course[]> => {
  try {
    const response = await client.get('/api/user/enrolled-courses');
    return response.data as Course[];
  } catch (error: any) {
    console.error('Error fetching enrolled courses:', error.response?.data || error.message);
    throw error;
  }
};

// Add this function to your existing API functions
export const addCourse = async (courseData: FormData): Promise<Course> => {
  try {
    const response = await client.post('/api/courses', courseData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data as Course; // Ensure the response is typed correctly
  } catch (error: any) {
    console.error('Error adding course:', error.response?.data || error.message);
    throw error;
  }
};

// Update course content (description, syllabus)
export const updateCourseContent = async (id: string, data: { detailedDescription?: string; syllabus?: string }): Promise<Course> => {
  try {
    const response = await client.patch(`/api/courses/${id}/content`, data);
    return response.data as Course;
  } catch (error: any) {
    console.error('Error updating course content:', error.response?.data || error.message);
    throw error;
  }
};

// Add video to course with enhanced error handling and thumbnail support
export const addCourseVideo = async (courseId: string, data: FormData): Promise<Course> => {
  try {
    // Validate inputs
    if (!courseId) {
      throw new Error('Course ID is required');
    }
    
    if (!data.get('title')) {
      throw new Error('Video title is required');
    }
    
    // Check if we have either a video file or a video URL
    const videoFile = data.get('video');
    const videoUrl = data.get('videoUrl');
    
    if (!videoFile && !videoUrl) {
      throw new Error('Either a video file or a video URL is required');
    }
    
    // Create a new FormData object with only the necessary fields
    const formData = new FormData();
    
    // Add title
    formData.append('title', data.get('title') as string);
    
    // Add description if present
    const description = data.get('description');
    if (description) {
      formData.append('description', description as string);
    }
    
    // Add duration if present
    const duration = data.get('duration');
    if (duration) {
      formData.append('duration', duration as string);
    }
    
    // Add video file if present
    if (videoFile) {
      formData.append('video', videoFile);
    } else if (videoUrl) {
      // Add video URL if no file
      formData.append('videoUrl', videoUrl as string);
    }
    
    // Add thumbnail file if present
    const thumbnailFile = data.get('thumbnail');
    if (thumbnailFile) {
      formData.append('thumbnail', thumbnailFile);
    }
    
    // Add thumbnail URL if present and no file
    const thumbnailUrl = data.get('thumbnailUrl');
    if (!thumbnailFile && thumbnailUrl) {
      formData.append('thumbnailUrl', thumbnailUrl as string);
    }
    
    console.log('Uploading video to course:', courseId);
    
    // Make the API request with progress tracking
    interface VideoUploadResponse {
      success: boolean;
      message: string;
      course: Course;
    }
    
    const response = await client.post<VideoUploadResponse>(`/api/courses/${courseId}/videos`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
    
    if (!response.data || !response.data.course) {
      throw new Error('Invalid response from server');
    }
    
    return response.data.course;
  } catch (error: any) {
    console.error('Error uploading video:', error);
    
    // Extract the error message from the response if available
    const errorMessage = error.response?.data?.message || error.message || 'Failed to upload video';
    throw new Error(errorMessage);
  }
};

// Add document to course
export const addCourseDocument = async (courseId: string, data: FormData): Promise<Course> => {
  try {
    // Ensure only required fields are sent
    const simplifiedData = new FormData();
    simplifiedData.append('title', data.get('title') as string);
    
    // Add document file if present
    const documentFile = data.get('document');
    if (documentFile) {
      simplifiedData.append('document', documentFile);
    }
    
    const response = await client.post(`/api/courses/${courseId}/documents`, simplifiedData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data as Course;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to upload document');
  }
};

// Remove video from course
export const removeCourseVideo = async (courseId: string, videoIndex: number): Promise<Course> => {
  try {
    const response = await client.delete(`/api/courses/${courseId}/videos/${videoIndex}`);
    return response.data as Course;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to delete video');
  }
};

// Remove document from course
export const removeCourseDocument = async (courseId: string, documentIndex: number): Promise<Course> => {
  try {
    const response = await client.delete(`/api/courses/${courseId}/documents/${documentIndex}`);
    return response.data as Course;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to delete document');
  }
};

// Get a course by title
export const getCourseByTitle = async (title: string): Promise<Course> => {
  try {
    const response = await client.get(`/api/courses/${title}`);
    return response.data as Course;
  } catch (error: any) {
    console.error('Error fetching course details:', error.response?.data || error.message);
    throw error;
  }
};

// Add a function to delete a course by title
export const deleteCourseByTitle = async (title: string): Promise<void> => {
  try {
    console.log('Deleting course with title:', title);
    if (!title) {
      throw new Error('Course title is required');
    }
    
    // First fetch the course by title to get its ID
    const course = await getCourseByTitle(title);
    if (!course || !course._id) {
      throw new Error('Course not found or invalid course data');
    }
    
    // Then delete the course using its ID
    await client.delete(`/api/courses/${course._id}`);
    console.log('Course deleted successfully');
  } catch (error: any) {
    console.error('Error deleting course by title:', error.response?.data || error.message || error);
    throw error;
  }
};