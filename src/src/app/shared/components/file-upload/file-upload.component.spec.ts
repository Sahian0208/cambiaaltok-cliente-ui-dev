import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FileUploadComponent, FileUploadEvent, FileUploadError } from './file-upload.component';

describe('FileUploadComponent', () => {
  let component: FileUploadComponent;
  let fixture: ComponentFixture<FileUploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileUploadComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FileUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show drop zone when no file is selected', () => {
    const dropZone = fixture.nativeElement.querySelector('.drop-zone');
    expect(dropZone).toBeTruthy();
  });

  it('should not show preview when no file is selected', () => {
    const preview = fixture.nativeElement.querySelector('.preview-container');
    expect(preview).toBeNull();
  });

  it('should emit fileError with invalid_format for non-image file', () => {
    const errorSpy = spyOn(component.fileError, 'emit');
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

    component.onFileInputChange({ target: { files: [file] } } as unknown as Event);

    expect(errorSpy).toHaveBeenCalledWith({ error: 'invalid_format' });
    expect(component.errorMessage).toContain('Formato no válido');
  });

  it('should emit fileError with exceeds_size for large file', () => {
    const errorSpy = spyOn(component.fileError, 'emit');
    // Create a file larger than 5 MB
    const largeContent = new ArrayBuffer(6 * 1024 * 1024);
    const file = new File([largeContent], 'large.png', { type: 'image/png' });

    component.onFileInputChange({ target: { files: [file] } } as unknown as Event);

    expect(errorSpy).toHaveBeenCalledWith({ error: 'exceeds_size' });
    expect(component.errorMessage).toContain('excede el tamaño máximo');
  });

  it('should emit fileSelected for valid PNG file', () => {
    const selectedSpy = spyOn(component.fileSelected, 'emit');
    const file = new File(['image-data'], 'test.png', { type: 'image/png' });

    component.onFileInputChange({ target: { files: [file] } } as unknown as Event);

    expect(selectedSpy).toHaveBeenCalled();
    expect(component.fileName).toBe('test.png');
  });

  it('should emit fileSelected for valid JPEG file', () => {
    const selectedSpy = spyOn(component.fileSelected, 'emit');
    const file = new File(['image-data'], 'photo.jpeg', { type: 'image/jpeg' });

    component.onFileInputChange({ target: { files: [file] } } as unknown as Event);

    expect(selectedSpy).toHaveBeenCalled();
    expect(component.fileName).toBe('photo.jpeg');
  });

  it('should clear error and preview on removeFile', () => {
    component.previewUrl = 'data:image/png;base64,abc';
    component.fileName = 'test.png';
    component.errorMessage = 'Some error';

    component.removeFile();

    expect(component.previewUrl).toBeNull();
    expect(component.fileName).toBeNull();
    expect(component.errorMessage).toBeNull();
  });

  it('should set isDragOver to true on dragover', () => {
    const event = new DragEvent('dragover');
    Object.defineProperty(event, 'preventDefault', { value: jasmine.createSpy() });
    Object.defineProperty(event, 'stopPropagation', { value: jasmine.createSpy() });

    component.onDragOver(event);

    expect(component.isDragOver).toBeTrue();
  });

  it('should set isDragOver to false on dragleave', () => {
    component.isDragOver = true;
    const event = new DragEvent('dragleave');
    Object.defineProperty(event, 'preventDefault', { value: jasmine.createSpy() });
    Object.defineProperty(event, 'stopPropagation', { value: jasmine.createSpy() });

    component.onDragLeave(event);

    expect(component.isDragOver).toBeFalse();
  });

  it('should process file on drop', () => {
    const file = new File(['image-data'], 'dropped.png', { type: 'image/png' });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);

    const event = new DragEvent('drop', { dataTransfer });
    Object.defineProperty(event, 'preventDefault', { value: jasmine.createSpy() });
    Object.defineProperty(event, 'stopPropagation', { value: jasmine.createSpy() });

    const selectedSpy = spyOn(component.fileSelected, 'emit');
    component.onDrop(event);

    expect(component.isDragOver).toBeFalse();
    expect(selectedSpy).toHaveBeenCalled();
    expect(component.fileName).toBe('dropped.png');
  });

  it('should not process if no files in input event', () => {
    const selectedSpy = spyOn(component.fileSelected, 'emit');
    const errorSpy = spyOn(component.fileError, 'emit');

    component.onFileInputChange({ target: { files: [] } } as unknown as Event);

    expect(selectedSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
