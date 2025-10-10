import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import './FileUpload.css';

const FileUpload = ({ isOpen, onClose, recipientEclipseId, onFilesSent }) => {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setFiles([]);
  }, [isOpen]);

  const uploadToSupabase = async (file, index) => {
    try {
      const formData = new FormData();
      formData.append('file', file.file);

      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        setFiles(prevFiles => {
          const newFiles = [...prevFiles];
          newFiles[index] = {
            ...newFiles[index],
            status: 'error',
            errorMessage: 'Not authenticated'
          };
          return newFiles;
        });
        return;
      }

      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentage = Math.round((e.loaded / e.total) * 100);
          setFiles(prevFiles => {
            const newFiles = [...prevFiles];
            newFiles[index] = {
              ...newFiles[index],
              progress: percentage,
              status: percentage === 100 ? 'processing' : 'uploading'
            };
            return newFiles;
          });
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          console.log('Upload successful:', response);
          setFiles(prevFiles => {
            const newFiles = [...prevFiles];
            newFiles[index] = {
              ...newFiles[index],
              progress: 100,
              status: 'completed',
              fileUrl: response.data.fileUrl,
              storagePath: response.data.storagePath,
              fileType: response.data.fileType,
              fileSize: response.data.fileSize
            };
            return newFiles;
          });
        } else {
          let errorMessage = 'Upload failed';
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            errorMessage = errorResponse.message || errorMessage;
            console.error('Upload error:', errorResponse);
          } catch (e) {
            console.error(`Failed to parse error response ${e}`);
          }

          setFiles(prevFiles => {
            const newFiles = [...prevFiles];
            newFiles[index] = {
              ...newFiles[index],
              status: 'error',
              errorMessage: errorMessage
            };
            return newFiles;
          });
        }
      });

      xhr.addEventListener('error', () => {
        console.error('Network error during upload');
        setFiles(prevFiles => {
          const newFiles = [...prevFiles];
          newFiles[index] = {
            ...newFiles[index],
            status: 'error',
            errorMessage: 'Network error'
          };
          return newFiles;
        });
      });

      xhr.open('POST', 'http://localhost:5001/api/files/upload');
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);

    } catch (error) {
      console.error('Upload error:', error);
      setFiles(prevFiles => {
        const newFiles = [...prevFiles];
        newFiles[index] = {
          ...newFiles[index],
          status: 'error',
          errorMessage: error.message
        };
        return newFiles;
      });
    }
  };

  const handleFiles = (newFiles) => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = (hours % 12) || 12;
    const day = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear();
    const date = `${day}-${month}-${year}`;
    const time = `${formattedHours}:${minutes}${ampm}`;
    const fileArray = Array.from(newFiles).map(file => ({
      file,
      name: `Eclipse-chat-${time}-${date}`,
      size: formatFileSize(file.size),
      rawSize: file.size,
      progress: 0,
      status: 'pending'
    }));

    const startIndex = files.length;
    setFiles(prev => [...prev, ...fileArray]);

    fileArray.forEach((_, index) => {
      uploadToSupabase(fileArray[index], startIndex + index);
    });
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFiles(droppedFiles);
    }
  };

  const handleFileSelect = (e) => {
    const selectedFiles = e.target.files;
    if (selectedFiles.length > 0) {
      handleFiles(selectedFiles);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleSendFiles = async () => {
    const completedFiles = files.filter(f => f.status === 'completed');
    const uploadingFiles = files.filter(f => f.status === 'uploading' || f.status === 'processing');
    
    if (uploadingFiles.length > 0) {
      alert('Please wait for all files to finish uploading');
      return;
    }

    if (completedFiles.length === 0) {
      alert('No files uploaded successfully');
      return;
    }

    if (!recipientEclipseId) {
      alert('No recipient selected');
      return;
    }

    setIsSending(true);

    try {
      const token = localStorage.getItem('token');
      
      // Prepare file data to send
      const filesToSend = completedFiles.map(f => ({
        fileName: f.name,
        fileSize: f.rawSize,
        fileType: f.fileType,
        fileUrl: f.fileUrl,
        storagePath: f.storagePath
      }));

      // Call the new sendFiles endpoint
      const response = await fetch('http://localhost:5001/api/files/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          recipientEclipseId,
          files: filesToSend
        })
      });

      const result = await response.json();

      if (response.ok) {
        console.log('Files sent successfully:', result);
        if (onFilesSent) {
          onFilesSent(completedFiles);
        }
        setTimeout(() => {
          onClose();
          setIsSending(false);
          setFiles([]);
        }, 500);
      } else {
        console.error('Failed to send files:', result);
        alert(result.message || 'Failed to send files');
        setIsSending(false);
      }
    } catch (error) {
      console.error('Error sending files:', error);
      alert('Failed to send files');
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  const completedCount = files.filter(f => f.status === 'completed').length;
  const uploadingCount = files.filter(f => f.status === 'uploading' || f.status === 'processing').length;
  const allFilesProcessed = files.length > 0 && uploadingCount === 0;
  const showSendButton = allFilesProcessed && completedCount > 0;

  return (
    <div className="fileUploadOverLay">
      <div className="file-upload-container">
        <div className="upload-card">
          <span className='material-symbols-outlined closeButton' onClick={onClose}>
            close
          </span>
          <div
            className={`drop-zone ${isDragging ? 'dragging' : ''} ${files.length <= 0 ? 'fullDropBox' : 'halfDropBox'}`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleButtonClick}>
            <span className="upload-icon material-symbols-outlined">upload</span>
            <h3 className="drop-title">Drag & Drop Files Here</h3>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <p className="drop-subtitle">
              Click to open file upload window
            </p>
          </div>
          {files.length > 0 && (
            <div className="files-display">
              <h4 className="files-title">
                Files ({files.length}) 
              </h4>
              <div className="files-list">
                {files.map((fileItem, index) => (
                  <div key={index} className="file-item">
                    <div className="fileIconSection" title='Uploaded file'>
                      <span className="material-symbols-outlined">description</span>
                    </div>
                    <div className="fileBody">
                      <div className="fileDetails">
                        <div className="details">
                          <div className="file-name">{fileItem.name}</div>
                          <div className="file-size">
                            {fileItem.size} / {fileItem.progress}%
                            {fileItem.errorMessage && (
                              <span style={{ color: '#ef4444', marginLeft: '8px', fontSize: '0.85em' }}>
                                {fileItem.errorMessage}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="CloseAction">
                          <button
                            className="remove-button"
                            onClick={() => removeFile(index)}
                          >
                            <X size={18} />
                          </button>
                        </div>
                      </div>
                      <div className="progressArea">
                        <div className="progress-bar-container">
                          <div 
                            className="progress-bar-fill"
                            style={{ 
                              width: `${fileItem.progress}%`,
                              backgroundColor: fileItem.status === 'error' ? '#ef4444' : undefined
                            }}
                          />
                        </div>
                        <div className="progressIcon">
                          {fileItem.status === 'completed' && (
                            <span className="status-icon success material-symbols-outlined">check_circle</span>
                          )}
                          {fileItem.status === 'error' && (
                            <span className="status-icon error material-symbols-outlined">cancel</span>
                          )}
                          {(fileItem.status === 'uploading' || fileItem.status === 'processing') && (
                            <span className="status-icon uploading material-symbols-outlined spinning">sync</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className={showSendButton ? 'sendButtonArea' : 'sendButtonAreaHidden'}>
        <button 
          className="sendbutton" 
          onClick={handleSendFiles}
          disabled={isSending}
          style={{
            opacity: isSending ? 0.5 : 1,
            cursor: isSending ? 'not-allowed' : 'pointer'
          }}
        >
          {isSending ? 'Sending...' : completedCount < 2 ? 'send file' : `send ${completedCount} files`}
          <span className="material-symbols-outlined">rocket_launch</span>
        </button>
      </div>
    </div>
  );
};

export default FileUpload;