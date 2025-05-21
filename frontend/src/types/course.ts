export interface Course {
    title: string;
    instructor: string;
    duration: number;
    price: number;
    description: string;
    detailedDescription?: string;
    image: string;
    enrolledCount?: number;
    videos?: {
        title: string;
        url: string;
        description?: string;
        duration?: number;
        thumbnail?: string;
        order?: number;
    }[];
    documents?: {
        title: string;
        url: string;
        description?: string;
        type?: string;
        order?: number;
    }[];
    syllabus?: string;
    createdAt?: string;
    updatedAt?: string;
    _id?: string;
}

export interface CourseData {
    title: string;
    description: string;
    duration: number;
    instructor: string;
    image: string;
    price: number;
}
