import fs from 'fs';
import path from 'path';

const pdfDir = process.argv[2] || path.join(process.cwd(), 'pdfs');
const baseURL = process.env.APP_URL || 'http://localhost:3000';
const embeddingProvider = process.env.EMBEDDING_PROVIDER || 'openai';
const embeddingModel = process.env.EMBEDDING_MODEL || 'text-embedding-3-large';

if (!fs.existsSync(pdfDir)) {
  console.error(`Directory ${pdfDir} does not exist.`);
  process.exit(1);
}

async function upload(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);
  const formData = new FormData();
  formData.append('files', new File([fileBuffer], fileName));
  formData.append('embedding_model_provider', embeddingProvider);
  formData.append('embedding_model', embeddingModel);

  const res = await fetch(`${baseURL}/api/uploads`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Upload failed');
  }

  const data = await res.json();
  console.log(
    `Uploaded ${fileName} -> ${data.files.map((f) => f.fileId).join(', ')}`,
  );
}

(async () => {
  const files = fs
    .readdirSync(pdfDir)
    .filter((f) => ['pdf', 'docx', 'txt'].includes(f.split('.').pop()));

  for (const f of files) {
    try {
      await upload(path.join(pdfDir, f));
    } catch (err) {
      console.error(`Failed to upload ${f}:`, err.message);
    }
  }
})();
