import { AsyncPipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import {
  catchError,
  finalize,
  map,
  Observable,
  of,
  startWith,
  Subject,
  switchMap
} from 'rxjs';

import { ConfirmDialog } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import { Course } from '../course.model';
import { CourseService } from '../course.service';

// I use one state so the screen shows loading, courses, or an error.
type CoursesState =
  | { status: 'loading' }
  | { status: 'success'; courses: Course[] }
  | { status: 'error'; message: string };

@Component({
  selector: 'app-course-list',
  imports: [AsyncPipe, RouterLink, ConfirmDialog],
  templateUrl: './course-list.html',
  styleUrl: './course-list.scss'
})
export class CourseList {
  private readonly courseService = inject(CourseService);
  private readonly destroyRef = inject(DestroyRef);

  // I send an event here when I need to load the list again.
  private readonly reload$ = new Subject<void>();

  // I keep the selected course here until the user confirms or cancels.
  protected readonly selectedCourse = signal<Course | null>(null);
  protected readonly deleting = signal(false);
  protected readonly deleteError = signal('');
  protected readonly successMessage = signal('');

  // I use the async pipe in HTML to subscribe to this stream.
  protected readonly state$: Observable<CoursesState> = this.reload$.pipe(
    // I trigger the first load without waiting for a Retry click.
    startWith(undefined),

    // I start a fresh request for each reload event.
    switchMap(() =>
      this.courseService.getCourses().pipe(
        map(
          (courses): CoursesState => ({
            status: 'success',
            courses
          })
        ),

        // I show loading while the API response is pending.
        startWith<CoursesState>({ status: 'loading' }),

        // I handle each request error here so another retry can still work.
        catchError(() =>
          of<CoursesState>({
            status: 'error',
            message: 'Unable to load courses. Please try again.'
          })
        )
      )
    )
  );

  protected retry(): void {
    this.reload$.next();
  }

  protected requestDelete(course: Course): void {
    this.deleteError.set('');
    this.successMessage.set('');

    // Setting this value makes the confirmation dialog appear.
    this.selectedCourse.set(course);
  }

  protected cancelDelete(): void {
    // I keep the dialog open while the delete request is running.
    if (!this.deleting()) {
      this.selectedCourse.set(null);
      this.deleteError.set('');
    }
  }

  protected confirmDelete(): void {
    const course = this.selectedCourse();

    // I avoid deletion without a selection or while already deleting.
    if (course === null || this.deleting()) {
      return;
    }

    this.deleting.set(true);
    this.deleteError.set('');

    this.courseService.deleteCourse(course.id).pipe(
      // I clean up this subscription if the component is destroyed.
      takeUntilDestroyed(this.destroyRef),

      // I clear the busy state when the request ends.
      finalize(() => this.deleting.set(false))
    ).subscribe({
      next: () => {
        // I close the dialog and refresh only after deletion succeeds.
        this.selectedCourse.set(null);
        this.successMessage.set(`${course.name} was deleted.`);
        this.reload$.next();
      },
      error: () => {
        // I keep the dialog open so the user can retry or cancel.
        this.deleteError.set('Unable to delete the course. Please try again.');
      }
    });
  }
}