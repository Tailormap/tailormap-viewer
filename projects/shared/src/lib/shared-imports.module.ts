import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatTreeModule } from '@angular/material/tree';

@NgModule({
  exports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatMenuModule,
    MatCheckboxModule,
    MatRadioModule,
    MatTreeModule,
  ],
})
export class SharedImportsModule { }
