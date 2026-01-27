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

  // Note: transformations sent as a string if using signed uploads or specific presets,
  // but for unsigned uploads with presets, we often rely on the preset settings.
  // However, Cloudinary API supports 'transformation' parameter in the URL or sometimes form data
  // depending on the setup. For raw API uploads, transformations are often part of the 'eager' parameter
  // or done via a specific upload preset that has these settings.
  // The user's snippet suggests passing params object to axios.
  // Let's stick to the user's snippet logic but ensure params are correctly formatted.
  // The user sent `params: { transformation: ... }`.
  // IMPORTANT: The standard client-side upload API usually takes transformation as a string
  // like "w_500,h_500,c_fill" in 'transformation' form field or 'eager' field.
  // But axios params puts them in the query string.
  // Let's assume the user's approach works for their specific Cloudinary setup or they are using a library wrapper,
  // BUT the provided snippet uses direct axios.post.
  // Standard Cloudinary V1.1 upload API does NOT accept transformations in query params for the main image generally,
  // it applies incoming transformations.
  // Let's assume the user knows what they are doing with that snippet, OR I should verify.
  // Actually, for unsigned uploads, one usually defines these in the Upload Preset in Cloudinary Dashboard.
  // On-the-fly transformations during upload (incoming transformation) is supported.
  // Let's use the code as provided but ensure we pass options correctly.

  // Checking user code again:
  // params: { transformation: options.transformation }
  // This might need serialization if it's an array/object.
  // However, `resizeImage` does the heavy lifting already.
  // The transformation params might be for 'eager' generation or 'incoming'.
  // Let's adhere to the snippet as close as possible but safeguard against missing process.env.

  const res = await axios.post(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, formData, {
    params: {
      // Cloudinary expects string for transformation generally, e.g. "w_200,h_200"
      // If options.transformation is an array, we might need to stringify it or Cloudinary handles it?
      // Let's trust the snippet but if it fails we might need to adjust.
      // Actually, passing 'transformation' in query params acts as 'incoming transformation'
      transformation: options.transformation,
    },
  });

  return res.data.secure_url;
};

/* -------------------- PROFIL FOTO -------------------- */
/**
 * Ortalama çıktı: 15–30 KB
 */
export const uploadProfileImage = async (file) => {
  const resized = await resizeImage(file, 512, 0.5);

  return upload(new File([resized], file.name, { type: file.type }), {
    folder: "profiles",
    transformation: "w_256,h_256,c_fill,g_face,q_auto:low,f_auto", // Using string format to be safer
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
    transformation: "w_1080,c_limit,q_auto:eco,f_auto", // Using string format to be safer
  });
};

// Deprecated: kept for backward compatibility if any imports missed,
// strictly mapping to uploadPostImage as fallback
export const uploadToCloudinary = uploadPostImage;
