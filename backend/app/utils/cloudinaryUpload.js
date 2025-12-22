const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const cloudinary = require("../config/cloudinary");

async function uploadSingleImage(image, options = {}) {
  const defaultOptions = {
    folder: options.folder || "avatar",
    // transformation: [
    //   { width: 200, height: 200, crop: "fill", gravity: "auto" },
    //   { quality: "auto" },
    // ],
  };

  const uploadOptions = { ...defaultOptions, ...options };

  // Nếu là ảnh đã ở Cloudinary thì trả về object giả lập kết quả upload
  if (
    typeof image === "string" &&
    image.startsWith("https://res.cloudinary.com")
  ) {
    return { url: image, secure_url: image };
  }

  // Nếu là base64 string (có data:image prefix hoặc không)
  if (
    typeof image === "string" &&
    (image.startsWith("data:image") || image.length > 500)
  ) {
    try {
      const result = await cloudinary.uploader.upload(image, uploadOptions);
      return result;
    } catch (error) {
      throw new Error("Cloudinary upload failed: " + error.message);
    }
  }

  if (Buffer.isBuffer(image)) {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(uploadOptions, (error, result) => {
          if (error) {
            reject(new Error("Cloudinary upload failed: " + error.message));
          } else {
            resolve(result);
          }
        })
        .end(image);
    });
  } else if (typeof image === "string" && image.startsWith("http")) {
    try {
      const result = await cloudinary.uploader.upload(image, uploadOptions);
      return result;
    } catch (error) {
      throw new Error("Cloudinary upload failed: " + error.message);
    }
  } else {
    throw new Error(
      "Invalid image input. Must be a Buffer, base64 string, or URL."
    );
  }
}

async function uploadImages(image) {
  if (Array.isArray(image)) {
    const uploadPromises = image.map((img) => {
      if (Buffer.isBuffer(img)) return uploadSingleImage(img);
      if (img.buffer && Buffer.isBuffer(img.buffer))
        return uploadSingleImage(img.buffer);
      return uploadSingleImage(img); // for strings (URLs)
    });
    return Promise.all(uploadPromises);
  } else {
    if (image.buffer && Buffer.isBuffer(image.buffer)) {
      return uploadSingleImage(image.buffer);
    }
    return uploadSingleImage(image); // for single Buffer or URL string
  }
}

module.exports = { uploadImages, uploadSingleImage };
