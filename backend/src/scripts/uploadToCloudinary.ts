import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';

// Load environment variables from .env
dotenv.config({ path: path.join(__dirname, '../../.env') });

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

// Get directory from CLI argument or default to backend/uploads
const customDir = process.argv[2];
const targetDir = customDir
  ? path.resolve(process.cwd(), customDir)
  : path.resolve(__dirname, '../../uploads');

// Get Cloudinary target folder from CLI argument or env or default
const cloudinaryFolder = process.argv[3] || process.env.CLOUDINARY_FOLDER || 'devflow_uploads';

function validateCredentials() {
  const missing = [];
  if (!cloudName || cloudName === 'your_cloud_name') missing.push('CLOUDINARY_CLOUD_NAME');
  if (!apiKey || apiKey === 'your_api_key') missing.push('CLOUDINARY_API_KEY');
  if (!apiSecret || apiSecret === 'your_api_secret') missing.push('CLOUDINARY_API_SECRET');

  if (missing.length > 0) {
    console.error('\n❌ Missing Cloudinary Credentials!');
    console.error(`Please provide the following missing environment variable(s): ${missing.join(', ')}`);
    console.error('\nHow to provide credentials:');
    console.error('1. Open backend/.env');
    console.error('2. Add or update the following values:\n');
    console.error('   CLOUDINARY_CLOUD_NAME=your_actual_cloud_name');
    console.error('   CLOUDINARY_API_KEY=your_actual_api_key');
    console.error('   CLOUDINARY_API_SECRET=your_actual_api_secret');
    console.error('   CLOUDINARY_FOLDER=devflow_uploads  (optional)\n');
    console.error('Alternatively, pass them inline when executing the script:');
    console.error('   CLOUDINARY_CLOUD_NAME=xxx CLOUDINARY_API_KEY=yyy CLOUDINARY_API_SECRET=zzz npm run upload:cloudinary\n');
    return false;
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  return true;
}

function getAllFiles(dirPath: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dirPath)) return fileList;

  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      getAllFiles(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  }

  return fileList;
}

async function runUpload() {
  console.log('----------------------------------------------------');
  console.log('🚀 DevFlow - Local Media to Cloudinary Copy Utility');
  console.log('----------------------------------------------------');

  if (!validateCredentials()) {
    process.exit(1);
  }

  if (!fs.existsSync(targetDir)) {
    console.error(`❌ Source directory does not exist: ${targetDir}`);
    console.error('Please specify a valid local folder path, e.g.:');
    console.error('   npm run upload:cloudinary ./uploads/documents devflow_docs');
    process.exit(1);
  }

  console.log(`📁 Source Local Directory : ${targetDir}`);
  console.log(`☁️ Target Cloudinary Folder : ${cloudinaryFolder}`);

  const allFiles = getAllFiles(targetDir);

  if (allFiles.length === 0) {
    console.log('\n⚠️ No media or document files found in the source directory.');
    process.exit(0);
  }

  console.log(`\nFound ${allFiles.length} file(s) to process...\n`);

  let successCount = 0;
  let failCount = 0;
  const results: { file: string; url?: string; error?: string }[] = [];

  for (let i = 0; i < allFiles.length; i++) {
    const file = allFiles[i];
    const relativePath = path.relative(targetDir, file);
    console.log(`[${i + 1}/${allFiles.length}] Uploading: ${relativePath}...`);

    try {
      const uploadResult = await cloudinary.uploader.upload(file, {
        folder: cloudinaryFolder,
        resource_type: 'auto',
        use_filename: true,
        unique_filename: true,
      });

      console.log(`   ✅ Success! URL: ${uploadResult.secure_url}`);
      successCount++;
      results.push({ file: relativePath, url: uploadResult.secure_url });
    } catch (err: any) {
      console.error(`   ❌ Failed: ${err?.message || err}`);
      failCount++;
      results.push({ file: relativePath, error: err?.message || String(err) });
    }
  }

  console.log('\n----------------------------------------------------');
  console.log('📊 Upload Summary');
  console.log('----------------------------------------------------');
  console.log(`Total Files Processed : ${allFiles.length}`);
  console.log(`Successfully Uploaded: ${successCount}`);
  console.log(`Failed               : ${failCount}`);

  if (successCount > 0) {
    console.log('\nUploaded URLs:');
    results
      .filter((r) => r.url)
      .forEach((r) => console.log(`  • ${r.file} -> ${r.url}`));
  }
}

runUpload();
