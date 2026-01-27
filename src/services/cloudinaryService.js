import axios from "axios";

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

/* -------------------- CLIENT SIDE RESIZE -------------------- */
const resizeImage = (file, maxWidth, quality) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;

      img.onload = () => {
        let { width, height } = img;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => (blob ? resolve(blob) : reject("Resize failed")), file.type, quality);
      };

      img.onerror = (error) => reject(error);
    };

    reader.onerror = reject;
  });
};

/* -------------------- BASE UPLOAD -------------------- */
const upload = async (file, options) => {
  if (!file) return null;

  if (!CLOUD_NAME || !UPLOAD_PRESET || CLOUD_NAME === "your_cloud_name") {
    console.error("Cloudinary configuration is missing!");
    throw new Error("Cloudinary configuration is missing. Please check your .env file.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  if (options.folder) {
    formData.append("folder", options.folder);
  }

  try {
    const res = await axios.post(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, formData);
    return res.data.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error details:", error.response?.data || error.message);
    throw error;
  }
};

/* -------------------- PROFIL FOTO -------------------- */
/**
 * Ortalama çıktı: 15–30 KB
 */
export const uploadProfileImage = async (file) => {
  const resized = await resizeImage(file, 512, 0.5);

  return upload(new File([resized], file.name, { type: file.type }), {
    folder: "profiles",
  });
};

/* -------------------- POST IMAGE -------------------- */
/**
 * Ortalama çıktı: 80–200 KB
 */
export const uploadPostImage = async (file) => {
  const resized = await resizeImage(file, 1280, 0.6);

  return upload(new File([resized], file.name, { type: file.type }), {
    folder: "posts",
  });
};

// Deprecated: kept for backward compatibility if any imports missed,
// strictly mapping to uploadPostImage as fallback
export const uploadToCloudinary = uploadPostImage;
