import { useRef, useState, type DragEvent, type ChangeEvent } from 'react';
import { uploadImage } from '../../lib/posts-api';

interface ImageUploadFieldProps {
  label: string;
  onChange: (value: string) => void;
  value: string;
}

const ACCEPTED_IMAGE_TYPES =
  'image/jpeg,image/jpg,image/png,image/gif,image/webp';

export default function ImageUploadField({
  label,
  onChange,
  value,
}: ImageUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function uploadSelectedFile(file: File) {
    try {
      setIsUploading(true);
      setError(null);
      const { url } = await uploadImage(file);
      onChange(url);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : 'Unable to upload image.',
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function handleFileInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    await uploadSelectedFile(file);
    event.target.value = '';
  }

  async function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();

    const file = event.dataTransfer.files?.[0];

    if (!file) {
      return;
    }

    await uploadSelectedFile(file);
  }

  return (
    <div className="admin-upload-field">
      <div
        className="admin-upload-field__dropzone"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => void handleDrop(event)}
      >
        <div className="admin-upload-field__copy">
          <span className="admin-upload-field__label">{label}</span>
          <p>
            Drag and drop an image here, or upload one from your device.
          </p>
        </div>

        <button
          className="admin-button"
          onClick={() => fileInputRef.current?.click()}
          type="button"
        >
          {isUploading ? 'Uploading…' : 'Upload Image'}
        </button>

        <input
          accept={ACCEPTED_IMAGE_TYPES}
          hidden
          onChange={(event) => void handleFileInputChange(event)}
          ref={fileInputRef}
          type="file"
        />
      </div>

      {value ? (
        <div className="admin-upload-field__preview">
          <img alt={`${label} preview`} src={value} />
          <a href={value} rel="noreferrer" target="_blank">
            Open image
          </a>
        </div>
      ) : null}

      <label className="admin-field">
        <span>Or paste image URL</span>
        <input
          className="admin-input"
          onChange={(event) => onChange(event.target.value)}
          placeholder="https://..."
          type="url"
          value={value}
        />
      </label>

      {error ? <p className="admin-upload-field__error">{error}</p> : null}
    </div>
  );
}
