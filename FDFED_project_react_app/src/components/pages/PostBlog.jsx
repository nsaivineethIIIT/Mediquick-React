import React, { useState, useEffect, useRef } from 'react';
// Import Quill CSS directly
import 'quill/dist/quill.snow.css'; 
// Assuming your extracted CSS is here. Update path if necessary.
import '../../assets/css/PostBlog.css'; 

const PostBlog = () => {
  const [title, setTitle] = useState('');
  const [theme, setTheme] = useState('');
  const [imageUrls, setImageUrls] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const quillRef = useRef(null);
  const quillInstance = useRef(null);

  const themeOptions = [
    { value: 'GENERAL HYGIENE TIPS', label: 'GENERAL HYGIENE TIPS' },
    { value: 'PREVENTIVE MEASURES', label: 'PREVENTIVE MEASURES' },
    { value: 'DISEASES AND CONDITIONS', label: 'DISEASES AND CONDITIONS' },
    { value: 'CHRONIC DISEASES', label: 'CHRONIC DISEASES' },
    { value: 'INFECTIOUS DISEASES', label: 'INFECTIOUS DISEASES' },
  ];

  // Initialize Quill editor using dynamic import (solves 'require is not defined')
  useEffect(() => {
    // Only run on the client side
    if (typeof window !== 'undefined') {
      import('quill').then(module => {
        const Quill = module.default;
        
        if (quillRef.current && !quillInstance.current) {
          quillInstance.current = new Quill(quillRef.current, {
            theme: 'snow',
            placeholder: 'Write your blog content here...',
            modules: {
              toolbar: [
                [{ header: [1, 2, 3, false] }],
                ['bold', 'italic', 'underline'],
                ['blockquote', 'code-block'],
                [{ list: 'ordered' }, { list: 'bullet' }],
                ['link', 'image'],
                ['clean'],
              ],
            },
          });
        }
      }).catch(err => console.error("Failed to load Quill:", err));
    }

    // Theme change effect for dynamic container styling (moved here for cleanup/simplicity)
    const container = document.querySelector('.container');
    if (container) {
      container.className = 'container';
      if (theme) {
        const themeClass = `theme-${theme.toLowerCase().replace(/ /g, '-')}`;
        container.classList.add(themeClass);
      }
    }

  }, [theme]); // Re-run effect when theme changes to update CSS class

  // Handle file input change and image preview
  const previewImages = (e) => {
    const files = Array.from(e.target.files);

    if (files.length > 5) {
      alert('You can upload a maximum of 5 images');
      e.target.value = null; 
      setUploadedFiles([]);
      setImagePreviews([]);
      return;
    }

    setUploadedFiles(files);
    
    // Create previews
    const previews = files.map(file => ({
      src: URL.createObjectURL(file),
      file: file,
    }));
    setImagePreviews(previews);
  };

  // Handle removing an image preview
  const removeImage = (indexToRemove) => {
    URL.revokeObjectURL(imagePreviews[indexToRemove].src);

    const newPreviews = imagePreviews.filter((_, index) => index !== indexToRemove);
    setImagePreviews(newPreviews);
    
    const newFiles = uploadedFiles.filter((_, index) => index !== indexToRemove);
    setUploadedFiles(newFiles);
  };

  // Form submission handler using Fetch API
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!quillInstance.current) {
        alert("Editor not ready. Please wait a moment and try again.");
        return;
    }

    const formData = new FormData();
    const content = quillInstance.current.root.innerHTML;

    formData.append('title', title);
    formData.append('theme', theme || 'Default');
    formData.append('content', content);
    formData.append('imageUrls', imageUrls);

    uploadedFiles.forEach(file => {
      formData.append('images', file);
    });

    try {
      const response = await fetch('http://localhost:3002/blog/submit', {
        method: 'POST',
        body: formData, // fetch handles 'Content-Type': 'multipart/form-data' automatically
        credentials: 'include', // Important for session/cookie handling
      });

      if (response.status === 302 || response.redirected) {
         // Assuming the backend redirects to /blog on success
         alert('Blog posted successfully!');
         window.location.href = '/blog';
         return;
      }
      
      if (!response.ok) {
        // Attempt to parse error message if available
        const errorText = await response.text();
        throw new Error(`Server responded with status ${response.status}. Details: ${errorText.substring(0, 100)}...`);
      }

      // If successful but didn't redirect (e.g., if response was 200/201 without JSON body)
      alert('Blog posted successfully!');
      window.location.href = '/blog';

    } catch (error) {
      console.error('Error posting blog:', error);
      alert(`Failed to post blog. Please check your inputs and server connection.`);
    }
  };

  return (
    <>
      <div 
        id="cross" 
        className="btn btn-outline-success" 
        onClick={() => window.history.back()}
      >
        <i className="fa-solid fa-xmark"></i>
      </div>

      <div className="container">
        <h2>Post a Blog</h2>

        <form onSubmit={handleSubmit}>
          <label htmlFor="themeSelector">Select Blog Theme:</label>
          <select 
            id="themeSelector" 
            name="theme" 
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
          >
            <option value="">Default</option>
            {themeOptions.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <label htmlFor="blogTitle">Blog Title:</label>
          <input
            type="text"
            id="blogTitle"
            name="title"
            placeholder="Enter blog title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <label htmlFor="blogContent">Blog Content:</label>
          <div id="editor" ref={quillRef}></div>

          <label htmlFor="imageUpload">Upload Images (Max 5):</label>
          <input
            type="file"
            id="imageUpload"
            name="images"
            accept="image/*"
            multiple
            onChange={previewImages}
          />

          <div className="image-preview-container" id="imagePreviewContainer">
            {imagePreviews.map((preview, index) => (
              <div className="image-preview-wrapper" key={index}>
                <img src={preview.src} alt={`Preview ${index}`} className="image-preview" />
                <button 
                  type="button" 
                  className="remove-image" 
                  onClick={() => removeImage(index)}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>

          <label htmlFor="imageUrls">Or add image URLs (one per line):</label>
          <textarea
            id="imageUrls"
            name="imageUrls"
            rows="3"
            placeholder="https://example.com/image1.jpg"
            className="form-control"
            value={imageUrls}
            onChange={(e) => setImageUrls(e.target.value)}
          ></textarea>

          <button className="submit-btn" type="submit">
            Post Blog
          </button>
        </form>
      </div>
    </>
  );
};

export default PostBlog;