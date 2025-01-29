import { useState } from 'react';
import { useDropzone } from 'react-dropzone';

const FileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState(null);

  const { getRootProps, getInputProps, acceptedFiles } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1
  });

  const handleUpload = async () => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    setUploadError('');
    setUploadProgress(0);
    setUploadedFile(null);

    try {
      // Step 1: Upload file to Supabase
      const res = await fetch('/api/generate-upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to generate upload URL');
      }

      const { url, token } = await res.json();
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          setUploadProgress(percentComplete);
        }
      });

      xhr.open('PUT', url, true);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
      
      // Update the error handling in handleUpload
      xhr.onload = async () => {
        if (xhr.status === 200) {
          try {
            const processRes = await fetch('/api/process-file', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                fileUrl: url.split('?')[0],
                fileType: file.type
              })
            });

            const response = await processRes.json();
            if (!processRes.ok) {
              throw new Error(response.message || 'Failed to process file');
            }

            setUploadedFile(file.name);
            alert(`Quiz questions generated: ${JSON.stringify(response.questions)}`);
          } catch (err) {
            setUploadError(err.message);
          }
        } else {
          setUploadError('File upload failed');
        }
      };

      xhr.onerror = () => {
        throw new Error('Upload failed');
      };
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="file-upload">
      <div {...getRootProps({ className: 'dropzone' })}>
        <input {...getInputProps()} />
        <p>Drag & drop file here, or click to select</p>
      </div>

      {acceptedFiles[0] && (
        <div className="file-preview">
          <p>Selected file: {acceptedFiles[0].name}</p>
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="upload-button"
          >
            {uploading ? 'Uploading...' : 'Upload File'}
          </button>

          {uploading && (
            <div className="progress-container">
              <div className="progress-bar">
                <div
                  className="progress"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="progress-text">{Math.round(uploadProgress)}%</p>
            </div>
          )}
        </div>
      )}

      {uploadedFile && (
        <p className="success">File uploaded successfully: {uploadedFile}</p>
      )}

      {uploadError && <p className="error">{uploadError}</p>}
    </div>
  );
};

export default FileUpload;