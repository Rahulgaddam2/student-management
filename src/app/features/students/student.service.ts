import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { CreateStudent, Student } from './student.model';

// I kept student API calls here so I can reuse them in the list and form.
@Injectable({ providedIn: 'root' })
export class StudentService {
  private readonly http = inject(HttpClient);
  private readonly url = 'http://localhost:3000/students';

  // I use GET to fetch all students for the list.
  getStudents(): Observable<Student[]> {
    return this.http.get<Student[]>(this.url);
  }

  // I fetch one student using their ID to fill the edit form.
  getStudent(id: string): Observable<Student> {
    return this.http.get<Student>(
      `${this.url}/${encodeURIComponent(id)}`
    );
  }

  // I send the student's details and selected course IDs together.
  createStudent(student: CreateStudent): Observable<Student> {
    return this.http.post<Student>(this.url, student);
  }

  // I use PATCH to update details or replace the selected course IDs.
  updateStudent(
    id: string,
    changes: Partial<CreateStudent>
  ): Observable<Student> {
    return this.http.patch<Student>(
      `${this.url}/${encodeURIComponent(id)}`,
      changes
    );
  }

  // I call this after the user confirms deletion in the student list.
  deleteStudent(id: string): Observable<void> {
    return this.http.delete<void>(
      `${this.url}/${encodeURIComponent(id)}`
    );
  }
}