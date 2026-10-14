import { AsyncPipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import {
  catchError,
  finalize,
  forkJoin,
  map,
  Observable,
  of,
  startWith,
  Subject,
  switchMap
} from 'rxjs';

import { ConfirmDialog } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import { CourseService } from '../../courses/course.service';
import { Student } from '../student.model';
import { StudentService } from '../student.service';

// I prepare course names for display without changing the student record.
interface StudentRow {
  student: Student;
  courseNames: string[];
}

type StudentsState =
  | { status: 'loading' }
  | { status: 'success'; rows: StudentRow[] }
  | { status: 'error'; message: string };

@Component({
  selector: 'app-student-list',
  imports: [AsyncPipe, RouterLink, ConfirmDialog],
  templateUrl: './student-list.html',
  styleUrl: './student-list.scss'
})
export class StudentList {
  private readonly studentService = inject(StudentService);
  private readonly courseService = inject(CourseService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly reload$ = new Subject<void>();

  protected readonly selectedStudent = signal<Student | null>(null);
  protected readonly deleting = signal(false);
  protected readonly deleteError = signal('');
  protected readonly successMessage = signal('');

  protected readonly state$: Observable<StudentsState> = this.reload$.pipe(
    startWith(undefined),
    switchMap(() =>
      // I wait for both responses so I can show course names for each student.
      forkJoin({
        students: this.studentService.getStudents(),
        courses: this.courseService.getCourses()
      }).pipe(
        map(({ students, courses }): StudentsState => {
          // I build this lookup once instead of searching courses repeatedly.
          const courseNames = new Map(
            courses.map((course) => [course.id, course.name])
          );

          return {
            status: 'success',
            rows: students.map((student) => ({
              student,

              // I show the stored ID if its course no longer exists.
              courseNames: student.courseIds.map(
                (id) => courseNames.get(id) ?? id
              )
            }))
          };
        }),
        startWith<StudentsState>({ status: 'loading' }),
        catchError(() =>
          of<StudentsState>({
            status: 'error',
            message: 'Unable to load students. Please try again.'
          })
        )
      )
    )
  );

  protected retry(): void {
    this.reload$.next();
  }

  protected requestDelete(student: Student): void {
    this.deleteError.set('');
    this.successMessage.set('');
    this.selectedStudent.set(student);
  }

  protected cancelDelete(): void {
    if (!this.deleting()) {
      this.selectedStudent.set(null);
      this.deleteError.set('');
    }
  }

  protected confirmDelete(): void {
    const student = this.selectedStudent();

    if (student === null || this.deleting()) {
      return;
    }

    this.deleting.set(true);
    this.deleteError.set('');

    this.studentService.deleteStudent(student.id).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.deleting.set(false))
    ).subscribe({
      next: () => {
        // I refresh the list after the server confirms deletion.
        this.selectedStudent.set(null);
        this.successMessage.set(`${student.name} was deleted.`);
        this.reload$.next();
      },
      error: () => {
        this.deleteError.set('Unable to delete the student. Please try again.');
      }
    });
  }
}