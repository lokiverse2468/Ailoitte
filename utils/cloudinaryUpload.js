const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');

const uploadToCloudinary = (buffer, folder = 'products') => {
  return new Promise((resolve, reject) => {
    if (!cloudinary.config().cloud_name || cloudinary.config().cloud_name === 'dummy_cloud_name') {
      return reject(new Error('Cloudinary is not configured. Please set up Cloudinary credentials in .env file'));
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'image',
        transformation: [
          { width: 800, height: 800, crop: 'limit' },
          { quality: 'auto' }
        ]
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    );

    const stream = Readable.from(buffer);
    stream.pipe(uploadStream);
  });
};

const deleteFromCloudinary = async (imageUrl) => {
  try {
    const urlParts = imageUrl.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');
    if (uploadIndex === -1) {
      throw new Error('Invalid Cloudinary URL');
    }
    
    const afterUpload = urlParts.slice(uploadIndex + 1).join('/');
    const publicId = afterUpload.split('.')[0];
    
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary
};

