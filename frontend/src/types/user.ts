export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  username: string;
  role: string;
  grade?: string;
  createdAt: string;
  enrolledCourses?: any[];
} 