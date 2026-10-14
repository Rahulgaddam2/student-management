// I use this interface to keep the course data structure consistent.
export interface Course {
  readonly id: string;

  // I keep the course code separate from its internal ID.
  code: string;
  name: string;
  description: string;
}

// I leave out the ID when creating a course because JSON Server adds it.
export type CreateCourse = Omit<Course, 'id'>;