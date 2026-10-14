// I use this interface to keep the student data structure consistent.
export interface Student {
  readonly id: string;
  name: string;
  email: string;

  // I store course IDs here so one student can enroll in multiple courses.
  courseIds: string[];
}

// I leave out the ID when creating a student because JSON Server adds it.
export type CreateStudent = Omit<Student, 'id'>;