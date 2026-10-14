import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, finalize, of, switchMap } from 'rxjs';

import { CreateCourse } from '../course.model';
import { CourseService } from '../course.service';

@Component({
  selector: 'app-course-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './course-form.html',
  styleUrl: './course-form.scss'
})
export class CourseForm {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly courseService = inject(CourseService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  // I use the route ID to decide whether this is an add or edit form.
  protected readonly courseId = signal<string | null>(null);
  protected readonly loading = signal(true);
  protected readonly loadError = signal('');
  protected readonly saving = signal(false);
  protected readonly errorMessage = signal('');

  // I define the fields and validation together in the Reactive Form.
  protected readonly form = this.formBuilder.group({
    code: ['', [
      Validators.required,
      Validators.maxLength(20),
      Validators.pattern(/^[A-Za-z0-9-]+$/)
    ]],
    name: ['', [
      Validators.required,
      Validators.maxLength(100),
      Validators.pattern(/\S/)
    ]],
    description: ['', Validators.maxLength(500)]
  });

  constructor() {
    // I observe the route so the form loads the course matching its ID.
    this.route.paramMap.pipe(
      switchMap((params) => {
        const id = params.get('id');

        this.courseId.set(id);
        this.loading.set(true);
        this.loadError.set('');
        this.errorMessage.set('');
        this.form.reset();

        // There is no existing course to fetch when adding a new one.
        if (id === null) {
          this.loading.set(false);
          return of(null);
        }

        return this.courseService.getCourse(id).pipe(
          catchError(() => {
            this.loadError.set('Unable to load this course.');
            return of(null);
          }),
          finalize(() => this.loading.set(false))
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((course) => {
      if (course !== null) {
        // I fill all fields with the existing course details.
        this.form.setValue({
          code: course.code,
          name: course.name,
          description: course.description
        });
      }
    });
  }

  protected submit(): void {
    if (this.saving() || this.loading() || this.loadError()) {
      return;
    }

    // I show validation messages even if the user skipped a required field.
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const values = this.form.getRawValue();

    const course: CreateCourse = {
      code: values.code.trim().toUpperCase(),
      name: values.name.trim(),
      description: values.description.trim()
    };

    // I reuse the same form and choose the request based on the route ID.
    const id = this.courseId();
    const request$ = id === null
      ? this.courseService.createCourse(course)
      : this.courseService.updateCourse(id, course);

    this.errorMessage.set('');
    this.saving.set(true);

    request$.pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.saving.set(false))
    ).subscribe({
      next: () => {
        // I return to the list only after the server confirms the save.
        void this.router.navigate(['/courses']);
      },
      error: () => {
        // I leave the form values unchanged so the user can try again.
        this.errorMessage.set('Unable to save the course. Please try again.');
      }
    });
  }
}