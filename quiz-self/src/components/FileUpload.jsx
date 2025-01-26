import { useState } from 'react';
import { useDropzone } from 'react-dropzone';

const FileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

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
    try {
      // Get signed URL from backend
      const res = await fetch('/api/generate-upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type
        })
      });
      
      const { url, token } = await res.json();
      
      // Upload file to Supabase
      const uploadRes = await fetch(url, {
        method: 'PUT',
        body: file,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': file.type
        }
      });

      if (!uploadRes.ok) throw new Error('Upload failed');
      alert('File uploaded successfully!');
    } catch (err) {
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
        </div>
      )}
      
      {uploadError && <p className="error">{uploadError}</p>}
    </div>
  );
};

export default FileUpload;