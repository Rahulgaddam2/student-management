import { Routes } from '@angular/router';

import { CourseForm } from './features/courses/course-form/course-form';
import { CourseList } from './features/courses/course-list/course-list';
import { StudentForm } from './features/students/student-form/student-form';
import { StudentList } from './features/students/student-list/student-list';

export const routes: Routes = [
  // I open the course list when the user visits the home URL.
  {
    path: '',
    redirectTo: 'courses',
    pathMatch: 'full'
  },

  // I use the same form component for adding and editing courses.
  {
    path: 'courses/new',
    component: CourseForm
  },
  {
    path: 'courses/:id/edit',
    component: CourseForm
  },
  {
    path: 'courses',
    component: CourseList
  },

  // I use the same form component for adding and editing students.
  {
    path: 'students/new',
    component: StudentForm
  },
  {
    path: 'students/:id/edit',
    component: StudentForm
  },
  {
    path: 'students',
    component: StudentList
  },

  // I keep this last so unknown URLs go to the course list.
  {
    path: '**',
    redirectTo: 'courses'
  }
];