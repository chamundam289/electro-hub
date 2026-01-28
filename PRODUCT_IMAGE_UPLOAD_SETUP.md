# Product Image Upload System - Setup Guide

## Overview
The ElectroStore admin panel now includes a comprehensive image upload system for products using Supabase Storage. This system provides secure, scalable image storage with drag & drop functionality, progress tracking, and automatic file management.

## Features Implemented

### 1. ImageUpload Component (`src/components/ui/ImageUpload.tsx`)
- **Drag & Drop Support**: Users can drag images directly onto the upload area
- **File Validation**: Automatic validation for file type, size, and format
- **Progress Tracking**: Real-time upload progress with visual feedback
- **Image Preview**: Instant preview of uploaded images with hover actions
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **File Management**: Automatic file deletion when images are removed

### 2. ProductManagement Integration
- **Seamless Integration**: ImageUpload component integrated into product creation/editing forms
- **Database Storage**: Image URLs automatically saved to products table
- **Form Validation**: Image upload integrated with existing form validation

### 3. Supabase Storage Configuration
- **Secure Storage**: Images stored in dedicated 'product-images' bucket
- **Public Access**: Images publicly accessible via CDN URLs
- **RLS Policies**: Row Level Security policies for secure access control

## Setup Instructions

### Step 1: Run Storage Setup Script
Execute the following SQL script in your Supabase SQL editor:

```sql
-- Run the setup_product_images_storage.sql script
-- This creates the storage bucket and necessary policies
```

### Step 2: Verify Storage Bucket
1. Go to Supabase Dashboard → Storage
2. Confirm 'product-images' bucket exists
3. Check that the bucket is set to 'Public'

### Step 3: Test Upload Functionality
1. Navigate to Admin Panel → Product Management
2. Click "Add Product" or edit existing product
3. Use the image upload section to test:
   - Drag & drop an image
   - Click to browse and select image
   - Verify preview appears
   - Save product and confirm image URL is stored

## Technical Details

### File Specifications
- **Supported Formats**: JPEG, JPG, PNG, WebP
- **Maximum Size**: 5MB per image
- **Storage Location**: `products/{timestamp}-{random}.{extension}`
- **CDN Access**: Images served via Supabase CDN for fast loading

### Security Features
- **Authentication Required**: Only authenticated users can upload
- **File Validation**: Client-side and server-side validation
- **Unique Filenames**: Timestamp + random string prevents conflicts
- **Automatic Cleanup**: Old images deleted when replaced

### Error Handling
- **Bucket Not Found**: Clear error message with admin contact info
- **File Too Large**: Size limit notification with current limit
- **Invalid Format**: Supported format list displayed
- **Upload Failure**: Retry option with detailed error info

## Usage Guide

### For Administrators

#### Adding Product with Image:
1. Click "Add Product" button
2. Fill in product details
3. In "Product Image" section:
   - Drag image file onto upload area, OR
   - Click "Upload Image" button to browse files
4. Wait for upload completion (progress bar shows status)
5. Preview appears with Change/Remove options
6. Complete other product details and save

#### Editing Product Image:
1. Edit existing product
2. Current image displays in preview (if exists)
3. Hover over image to see Change/Remove buttons
4. Click "Change" to upload new image
5. Click "Remove" to delete current image
6. Save changes

### For Developers

#### Component Props:
```typescript
interface ImageUploadProps {
  onImageUploaded: (imageUrl: string) => void;  // Callback with uploaded URL
  currentImage?: string;                        // Existing image URL
  folder?: string;                             // Storage folder (default: 'products')
  maxSize?: number;                            // Max size in MB (default: 5)
  allowedTypes?: string[];                     // Allowed MIME types
  showPreview?: boolean;                       // Show image preview (default: true)
}
```

#### Integration Example:
```typescript
<ImageUpload
  onImageUploaded={(imageUrl) => setFormData({ ...formData, image_url: imageUrl })}
  currentImage={formData.image_url}
  folder="products"
  maxSize={5}
  allowedTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/webp']}
  showPreview={true}
/>
```

## Troubleshooting

### Common Issues:

1. **"Storage bucket not configured" Error**
   - Run the setup_product_images_storage.sql script
   - Verify bucket exists in Supabase Dashboard

2. **Upload Fails Silently**
   - Check browser console for errors
   - Verify Supabase connection and authentication
   - Confirm RLS policies are correctly set

3. **Images Not Displaying**
   - Check if bucket is set to 'Public'
   - Verify image URLs in database are correct
   - Test direct URL access in browser

4. **File Size Errors**
   - Default limit is 5MB
   - Adjust maxSize prop if needed
   - Consider image compression for large files

### Performance Optimization:
- Images are automatically optimized by Supabase CDN
- Consider implementing image resizing for thumbnails
- Use WebP format for better compression
- Implement lazy loading for product galleries

## Future Enhancements

### Planned Features:
1. **Multiple Images**: Support for product image galleries
2. **Image Compression**: Automatic client-side compression
3. **Thumbnail Generation**: Automatic thumbnail creation
4. **Bulk Upload**: Upload multiple images at once
5. **Image Editing**: Basic crop/resize functionality
6. **Alt Text**: SEO-friendly alt text management

### Integration Opportunities:
- Category image uploads
- Offer banner uploads
- Store logo/branding uploads
- User profile pictures
- Invoice/receipt attachments

## Support

For technical support or feature requests:
1. Check this documentation first
2. Review browser console for error messages
3. Verify Supabase configuration
4. Test with different image formats/sizes
5. Contact development team with specific error details

---

**Last Updated**: January 28, 2026
**Version**: 1.0.0
**Status**: Production Ready ✅