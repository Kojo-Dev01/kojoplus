import AWS from 'aws-sdk';

// Configure AWS SDK for Wasabi
const s3 = new AWS.S3({
  endpoint: new AWS.Endpoint(process.env.WASABI_ENDPOINT || 'https://s3.wasabisys.com'),
  accessKeyId: process.env.WASABI_ACCESS_KEY_ID,
  secretAccessKey: process.env.WASABI_SECRET_ACCESS_KEY,
  region: process.env.WASABI_REGION || 'us-east-1',
  s3ForcePathStyle: true
});

const BUCKET_NAME = process.env.WASABI_BUCKET_NAME;

export const uploadToWasabi = async (file, folder = 'forecasts') => {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const fileName = `${folder}/${timestamp}-${randomString}.${fileExtension}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload parameters
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
      ACL: 'public-read', // Make file publicly accessible
      Metadata: {
        'original-name': file.name,
        'upload-timestamp': timestamp.toString()
      }
    };

    // Upload to Wasabi
    const result = await s3.upload(uploadParams).promise();

    return {
      success: true,
      url: result.Location,
      key: fileName,
      bucket: BUCKET_NAME
    };
  } catch (error) {
    console.error('Error uploading to Wasabi:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const deleteFromWasabi = async (key) => {
  try {
    const deleteParams = {
      Bucket: BUCKET_NAME,
      Key: key
    };

    await s3.deleteObject(deleteParams).promise();

    return {
      success: true,
      message: 'File deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting from Wasabi:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const generatePresignedUrl = async (key, expiresIn = 3600) => {
  try {
    const url = s3.getSignedUrl('getObject', {
      Bucket: BUCKET_NAME,
      Key: key,
      Expires: expiresIn
    });

    return {
      success: true,
      url
    };
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
