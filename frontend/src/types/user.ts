export interface User { 
  id: string;
  name: string; // Make name required
  email: string;
  phone: string;
  username: string; // Make username required
  role: 'student' | 'teacher';
  grade?: string; // Optional for students
  createdAt: string;
  enrolledCourses: { id: string; title: string; enrollmentDate: string }[];
}