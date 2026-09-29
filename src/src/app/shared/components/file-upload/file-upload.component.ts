import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { validateFile, FileValidationResult } from '../../validators/file.validator';

export interface FileUploadEvent {
  file: File;
  previewUrl: string;
}

export interface FileUploadError {
  error: 'invalid_format' | 'exceeds_size';
}

@Component({
  selector: 'app-file-upload',
  imports: [CommonModule],
  templateUrl: './file-upload.component.html',
  styleUrl: './file-upload.component.scss'
})
export class FileUploadComponent {
  @Input() label = 'Subir imagen';
  @Input() acceptFormats = '.png,.jpg,.jpeg';

  @Output() fileSelected = new EventEmitter<FileUploadEvent>();
  @Output() fileError = new EventEmitter<FileUploadError>();

  previewUrl: string | null = null;
  fileName: string | null = null;
  isDragOver = false;
  errorMessage: string | null = null;

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }

  onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFile(input.files[0]);
    }
  }

  removeFile(): void {
    this.previewUrl = null;
    this.fileName = null;
    this.errorMessage = null;
  }

  private processFile(file: File): void {
    this.errorMessage = null;

    const result: FileValidationResult = validateFile(file);

    if (!result.valid) {
      this.previewUrl = null;
      this.fileName = null;

      if (result.error === 'invalid_format') {
        this.errorMessage = 'Formato no válido. Solo se permiten archivos PNG, JPG o JPEG.';
      } else if (result.error === 'exceeds_size') {
        this.errorMessage = 'El archivo excede el tamaño máximo de 5 MB.';
      }

      this.fileError.emit({ error: result.error! });
      return;
    }

    this.fileName = file.name;
    this.generatePreview(file);
    this.fileSelected.emit({ file, previewUrl: '' });
  }

  private generatePreview(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl = reader.result as string;
      // Re-emit with the actual preview URL
      this.fileSelected.emit({ file, previewUrl: this.previewUrl });
    };
    reader.readAsDataURL(file);
  }
}
