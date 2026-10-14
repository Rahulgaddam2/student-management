import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Course, CreateCourse } from './course.model';

// I kept all API calls here so I can reuse them in the list and form.
@Injectable({ providedIn: 'root' })
export class CourseService {
  private readonly http = inject(HttpClient);
  private readonly url = 'http://localhost:3000/courses';

  // I use GET here to fetch all courses for the list.
  getCourses(): Observable<Course[]> {
    return this.http.get<Course[]>(this.url);
  }

  // I fetch one course using its ID to fill the edit form.
  getCourse(id: string): Observable<Course> {
    return this.http.get<Course>(
      `${this.url}/${encodeURIComponent(id)}`
    );
  }

  // I send the new course using POST. JSON Server generates its ID.
  createCourse(course: CreateCourse): Observable<Course> {
    return this.http.post<Course>(this.url, course);
  }

  // I use PATCH to update the given fields without changing the course ID.
  updateCourse(
    id: string,
    changes: Partial<CreateCourse>
  ): Observable<Course> {
    return this.http.patch<Course>(
      `${this.url}/${encodeURIComponent(id)}`,
      changes
    );
  }

  // I call this after the user confirms deletion in the course list.
  deleteCourse(id: string): Observable<void> {
    return this.http.delete<void>(
      `${this.url}/${encodeURIComponent(id)}`
    );
  }
}