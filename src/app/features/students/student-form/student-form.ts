import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, finalize, forkJoin, of, switchMap } from 'rxjs';

import { ConfirmDialog } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import { Course } from '../../courses/course.model';
import { CourseService } from '../../courses/course.service';
import { CreateStudent } from '../student.model';
import { StudentService } from '../student.service';

type StudentTab = 'details' | 'enrollment';

@Component({
  selector: 'app-student-form',
  imports: [ReactiveFormsModule, RouterLink, ConfirmDialog],
  templateUrl: './student-form.html',
  styleUrl: './student-form.scss'
})
export class StudentForm {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly studentService = inject(StudentService);
  private readonly courseService = inject(CourseService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly studentId = signal<string | null>(null);
  protected readonly courses = signal<Course[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal('');
  protected readonly saving = signal(false);
  protected readonly errorMessage = signal('');

  // I keep the current tab separate from the tab waiting for confirmation.
  protected readonly activeTab = signal<StudentTab>('details');
  protected readonly pendingTab = signal<StudentTab | null>(null);

  // I use one form for both tabs so switching tabs keeps the values.
  protected readonly form = this.formBuilder.group({
    name: ['', [
      Validators.required,
      Validators.maxLength(100),
      Validators.pattern(/\S/)
    ]],
    email: ['', [
      Validators.required,
      Validators.email,
      Validators.maxLength(254)
    ]],
    courseIds: this.formBuilder.control<string[]>([])
  });

  constructor() {
    this.route.paramMap.pipe(
      switchMap((params) => {
        const id = params.get('id');

        this.studentId.set(id);
        this.loading.set(true);
        this.loadError.set('');
        this.errorMessage.set('');
        this.activeTab.set('details');
        this.pendingTab.set(null);
        this.form.reset();

        // I load available courses and the existing student together.
        // For a new student, only the course request is needed.
        return forkJoin({
          courses: this.courseService.getCourses(),
          student: id === null
            ? of(null)
            : this.studentService.getStudent(id)
        }).pipe(
          catchError(() => {
            this.loadError.set('Unable to load the student form.');
            return of(null);
          }),
          finalize(() => this.loading.set(false))
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((result) => {
      if (result === null) {
        return;
      }

      this.courses.set(result.courses);

      if (result.student !== null) {
        // I restore the student's details and existing course selections.
        this.form.setValue({
          name: result.student.name,
          email: result.student.email,
          courseIds: result.student.courseIds
        });
      }
    });
  }

  protected requestTab(tab: StudentTab): void {
    if (tab === this.activeTab() || this.saving()) {
      return;
    }

    // I ask for confirmation when the user has changed the form.
    if (this.form.dirty) {
      this.pendingTab.set(tab);
    } else {
      this.activeTab.set(tab);
    }
  }

  protected resolveTab(confirmed: boolean): void {
    const tab = this.pendingTab();
    this.pendingTab.set(null);

    // I switch only after confirmation. Cancelling keeps the current tab.
    if (confirmed && tab !== null) {
      this.activeTab.set(tab);
    }
  }

  protected toggleCourse(id: string, checked: boolean): void {
    const control = this.form.controls.courseIds;

    // I add checked IDs and remove unchecked IDs from the selected array.
    // The Set avoids adding the same course ID twice.
    control.setValue(
      checked
        ? [...new Set([...control.value, id])]
        : control.value.filter((selectedId) => selectedId !== id)
    );

    // I mark checkbox changes as edits because I update this control myself.
    control.markAsDirty();
  }

  protected submit(): void {
    if (this.saving() || this.loading() || this.loadError()) {
      return;
    }

    this.form.markAllAsTouched();

    if (this.form.invalid) {
      // I reveal the details tab so the user can correct invalid fields.
      this.activeTab.set('details');
      return;
    }

    const values = this.form.getRawValue();

    // I send details and all selected course IDs in one student record.
    const student: CreateStudent = {
      name: values.name.trim(),
      email: values.email.trim(),
      courseIds: values.courseIds
    };

    const id = this.studentId();
    const request$ = id === null
      ? this.studentService.createStudent(student)
      : this.studentService.updateStudent(id, student);

    this.errorMessage.set('');
    this.saving.set(true);

    request$.pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.saving.set(false))
    ).subscribe({
      next: () => {
        void this.router.navigate(['/students']);
      },
      error: () => {
        this.errorMessage.set('Unable to save the student. Please try again.');
      }
    });
  }
}