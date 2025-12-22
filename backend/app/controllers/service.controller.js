const Service = require("../models/service");
const { uploadImages } = require("../utils/cloudinaryUpload");
const ApiError = require("../utils/api-error");

exports.createService = async (req, res, next) => {
  try {
    const serviceData = req.body;
    const newService = new Service(serviceData);
    await newService.save();
    res.status(201).json({ success: true, service: newService });
  } catch (error) {
    console.error("Error creating service:", error);
    next(new ApiError(500, "Server error creating service"));
  }
};

exports.getAllServices = async (req, res, next) => {
  try {
    const services = await Service.find().sort({ name: 1 });
    res.status(200).json({ success: true, services });
  } catch (error) {
    console.error("Error fetching services:", error);
    next(new ApiError(500, "Error fetching services"));
  }
};

exports.updateService = async (req, res, next) => {
  const serviceId = req.params.id;
  const serviceData = req.body;

  try {
    const updatedService = await Service.findByIdAndUpdate(
      serviceId,
      serviceData,
      { new: true, runValidators: true }
    );

    if (!updatedService) {
      return next(new ApiError(404, "Service not found"));
    }

    res.status(200).json({ success: true, service: updatedService });
  } catch (error) {
    console.error("Error updating service:", error);
    next(new ApiError(500, "Server error updating service"));
  }
};

exports.deleteService = async (req, res, next) => {
  const serviceId = req.params.id;

  try {
    const deletedService = await Service.findByIdAndDelete(serviceId);

    if (!deletedService) {
      return next(new ApiError(404, "Service not found"));
    }

    res
      .status(200)
      .json({ success: true, message: "Service deleted successfully" });
  } catch (error) {
    console.error("Error deleting service:", error);
    next(new ApiError(500, "Server error deleting service"));
  }
};

exports.getServiceById = async (req, res, next) => {
  const serviceId = req.params.id;
  try {
    const service = await Service.findById(serviceId);
    if (!service) {
      return next(new ApiError(404, "Service not found"));
    }
    res.status(200).json({ success: true, service });
  } catch (error) {
    console.error("Error fetching service:", error);
    next(new ApiError(500, "Server error fetching service"));
  }
};

exports.getTransportationService = async (req, res, next) => {
  try {
    const service = await Service.find({ category: "transportation" });
    res.status(200).json({ success: true, service: service || [] });
  } catch (error) {
    console.error("Error fetching Transportation service:", error);
    next(new ApiError(500, "Server error fetching Transportation service"));
  }
};

exports.getNonRoomService = async (req, res, next) => {
  try {
    const service = await Service.find({ forEachRoom: false });
    res.status(200).json({ success: true, service: service || [] });
  } catch (error) {
    console.error("Error fetching Non Room service:", error);
    next(new ApiError(500, "Server error fetching Non Room service"));
  }
};

exports.uploadServiceImages = async (req, res, next) => {
  const serviceId = req.params.id;
  // req.files: array of uploaded files (from multer)
  // req.body.imageUrls: array of image URLs (from formData)
  // req.body.alts, req.body.captions: array of alt/caption (from formData)

  try {
    const service = await Service.findById(serviceId);
    if (!service) {
      return next(new ApiError(404, "Service not found"));
    }

    // Chuẩn hóa dữ liệu đầu vào
    let files = req.files || [];
    let imageUrls = req.body.imageUrls || [];
    let alts = req.body.alts || [];
    let captions = req.body.captions || [];

    // Nếu chỉ có 1 url/alt/caption thì sẽ là string, cần chuyển thành mảng
    if (typeof imageUrls === "string") imageUrls = [imageUrls];
    if (typeof alts === "string") alts = [alts];
    if (typeof captions === "string") captions = [captions];

    // Upload files lên Cloudinary
    let uploadedFileImages = [];
    if (files.length > 0) {
      // files là mảng file từ multer
      uploadedFileImages = await Promise.all(
        files.map((file) => uploadImages(file.buffer))
      );
    }

    // Upload URLs lên Cloudinary
    let uploadedUrlImages = [];
    if (imageUrls.length > 0) {
      uploadedUrlImages = await Promise.all(
        imageUrls.map((url) => uploadImages(url))
      );
    }

    // Gộp tất cả ảnh lại
    const allUploaded = [...uploadedFileImages, ...uploadedUrlImages];

    // Gán alt/caption đúng thứ tự (ưu tiên alt/caption theo thứ tự images gửi lên)
    const imagesMeta = [];
    let altIdx = 0;
    let captionIdx = 0;

    allUploaded.forEach((img, idx) => {
      imagesMeta.push({
        url: img.url,
        isPrimary: idx === 0, // ảnh đầu tiên là chính, bạn có thể sửa lại logic này
        alt: alts[altIdx] || "",
        caption: captions[captionIdx] || "",
      });
      altIdx++;
      captionIdx++;
    });

    service.images = imagesMeta;
    console.log("Updated service images:", service.images);
    await service.save();

    res.status(200).json({ success: true, service });
  } catch (error) {
    console.error("Error uploading service images:", error);
    next(new ApiError(500, "Server error uploading service images"));
  }
};
