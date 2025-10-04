import React, { useState, useRef, useEffect } from 'react';
import { Upload,X} from 'lucide-react';
import './FileUpload.css';

const FileUpload = ({isOpen,onClose}) => {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  useEffect(()=>{
    setFiles([]);
  },[isOpen])

  // Simulated Supabase upload function
  const uploadToSupabase = async (file, index) => {
    // Simulate upload progress
    const totalSteps = 100;
    for (let i = 0; i <= totalSteps; i++) {
      await new Promise(resolve => setTimeout(resolve, 30));
      
      setFiles(prevFiles => {
        const newFiles = [...prevFiles];
        newFiles[index] = {
          ...newFiles[index],
          progress: i,
          status: i === 100 ? 'completed' : 'uploading'
        };
        return newFiles;
      });
    }

    // In real implementation, use Supabase:
    // const { data, error } = await supabase.storage
    //   .from('your-bucket')
    //   .upload(`uploads/${file.name}`, file, {
    //     onUploadProgress: (progress) => {
    //       const percentage = (progress.loaded / progress.total) * 100;
    //       setFiles(prevFiles => {
    //         const newFiles = [...prevFiles];
    //         newFiles[index].progress = percentage;
    //         return newFiles;
    //       });
    //     }
    //   });
  };

  const handleFiles = (newFiles) => {
    const fileArray = Array.from(newFiles).map(file => ({
      file,
      name: file.name,
      size: formatFileSize(file.size),
      progress: 0,
      status: 'pending'
    }));

    const startIndex = files.length;
    setFiles(prev => [...prev, ...fileArray]);

    // Start uploading each file
    fileArray.forEach((_, index) => {
      uploadToSupabase(fileArray[index].file, startIndex + index);
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
  if (!isOpen) return null;
  return (
    <div className="fileUploadOverLay">
        <div className="file-upload-container">
            <div className="upload-card">
                <span className='material-symbols-outlined closeButton'
                    onClick={onClose}
                >close</span>
                <div
                    className={`drop-zone ${isDragging ? 'dragging' : ''}${files.length<=0?'fullDropBox':'halfDropBox'}`}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={handleButtonClick}
                >
                <span class="upload-icon material-symbols-outlined">upload</span>
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
                    <h4 className="files-title">Uploaded Files ({files.length})</h4>
                    <div className="files-list">
                    {files.map((fileItem, index) => (
                        <div key={index} className="file-item">
                            <div className="fileIconSection" title='Uploaded file'>
                                <span class="material-symbols-outlined">docs</span>
                            </div>
                            <div className="fileBody">
                                <div className="fileDetails">
                                    <div className="details">
                                        <div className="file-name">{fileItem.name}</div>
                                        <div className="file-size">{fileItem.size}/ {fileItem.progress}%</div>
                                    </div>
                                    <div className="CloseAction">
                                        <button
                                            className="remove-button"
                                            onClick={() => removeFile(index)}>
                                            <X size={18} />
                                            </button>
                                    </div>
                                </div>
                                <div className="progressArea">
                                    <div className="progress-bar-container">
                                        <div className="progress-bar-fill"
                                            style={{ width: `${fileItem.progress}%` }}
                                        />  
                                    </div>
                                    <div className="progressIcon">
                                        {fileItem.status === 'completed' && (
                                            <span class="status-icon success material-symbols-outlined">check_circle</span>)}
                                        {fileItem.status === 'error' && (
                                            <span class="status-icon error material-symbols-outlined">cancel</span>)}
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
        <div className={files.length<1?'sendButtonAreaHidden':'sendButtonArea'}>
            
            <button className="sendbutton">
                {files.length<2?'send file':`send ${files.length} files`}
                <span class="material-symbols-outlined">rocket_launch</span>
            </button>
        </div>
    </div>
    
  );
};

export default FileUpload;