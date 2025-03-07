import { v2 as cloudinary } from 'cloudinary';
import fs from 'node:fs';
// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadoncloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      console.error('No file path provided');
      return null;
    }

    // Check if file exists
    if (!fs.existsSync(localFilePath)) {
      console.error('File does not exist at path:', localFilePath);
      return null;
    }

    console.log('Attempting to upload file:', localFilePath);

    // Upload the file to cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: 'auto',
      folder: 'uploads',
    });
    console.log(response)

    // File has been uploaded successfully
    console.log('File uploaded successfully:', response.url);

    // if sucessfully upolded to cloudinary, delete the file from local storage
    // fs.unlinkSync(localFilePath);

    // Remove the locally saved temporary file
    fs.unlinkSync(localFilePath);

    

    return response;
  } catch (error) {
    console.error('Error in cloudinary upload:', error);
    // Remove the locally saved temporary file as the upload operation failed
    if (localFilePath && fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    return null;
  }
};

export const uploadToCloudinary = async (base64String, folder = '') => {
  try {
    if (!base64String) return null;

    // Upload the base64 string to cloudinary
    const result = await cloudinary.uploader.upload(base64String, {
      folder: folder,
      resource_type: 'auto',
      transformation: [{ width: 1000, crop: 'scale' }, { quality: 'auto' }],
    });

    // Return the secure URL
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return null;
  }
};
