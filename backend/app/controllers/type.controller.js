const Type = require("../models/type");
const { uploadImages } = require("../utils/cloudinaryUpload");

exports.createType = async (req, res) => {
  try {
    const {
      name,
      capacity,
      maxGuest,
      extraBedAllowed,
      extraBedPrice,
      description,
      pricePerNight,
    } = req.body;

    if (!name)
      return res
        .status(400)
        .json({ success: false, message: "Name is required" });
    if (!capacity)
      return res
        .status(400)
        .json({ success: false, message: "Capacity is required" });
    if (!maxGuest)
      return res
        .status(400)
        .json({ success: false, message: "Max guest is required" });
    if (!pricePerNight)
      return res
        .status(400)
        .json({ success: false, message: "Price per night is required" });

    const type = new Type({
      name,
      capacity,
      maxGuest,
      extraBedAllowed: extraBedAllowed || false,
      extraBedPrice: extraBedPrice || 0,
      description,
      pricePerNight,
    });

    await type.save();

    res.status(201).json({ success: true, type });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllTypes = async (req, res) => {
  try {
    const types = await Type.find();
    res.status(200).json({ success: true, types });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTypeById = async (req, res) => {
  try {
    const typeId = req.params.id;
    const type = await Type.findById(typeId);
    if (!type) {
      return res
        .status(404)
        .json({ success: false, message: "Type not found" });
    }
    res.status(200).json({ success: true, type });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateType = async (req, res) => {
  try {
    const typeId = req.params.id;
    const updatedData = req.body;

    const type = await Type.findById(typeId);
    if (!type) {
      return res
        .status(404)
        .json({ success: false, message: "Type not found" });
    }

    Object.assign(type, updatedData);

    await type.save();

    res.status(200).json({ success: true, type });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteType = async (req, res) => {
  try {
    const typeId = req.params.id;
    const type = await Type.findByIdAndDelete(typeId);

    if (!type) {
      return res
        .status(404)
        .json({ success: false, message: "Type not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Type deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.uploadTypeImages = async (req, res, next) => {
  const typeId = req.params.id;

  try {
    const type = await Type.findById(typeId);
    if (!type) {
      return next(new ApiError(404, "Type not found"));
    }

    let files = req.files || [];
    let imageUrls = req.body.imageUrls || [];
    let alts = req.body.alts || [];
    let captions = req.body.captions || [];

    if (typeof imageUrls === "string") imageUrls = [imageUrls];
    if (typeof alts === "string") alts = [alts];
    if (typeof captions === "string") captions = [captions];

    let uploadedFileImages = [];
    if (files.length > 0) {
      uploadedFileImages = await Promise.all(
        files.map((file) => uploadImages(file.buffer))
      );
    }

    let uploadedUrlImages = [];
    if (imageUrls.length > 0) {
      uploadedUrlImages = await Promise.all(
        imageUrls.map((url) => uploadImages(url))
      );
    }

    const allUploaded = [...uploadedFileImages, ...uploadedUrlImages];

    const imagesMeta = [];
    let altIdx = 0;
    let captionIdx = 0;

    allUploaded.forEach((img, idx) => {
      imagesMeta.push({
        url: img.url,
        isPrimary: idx === 0,
        alt: alts[altIdx] || "",
        caption: captions[captionIdx] || "",
      });
      altIdx++;
      captionIdx++;
    });

    type.images = imagesMeta;
    console.log("Updated type images:", type.images);
    await type.save();

    res.status(200).json({ success: true, type });
  } catch (error) {
    console.error("Error uploading type images:", error);
    next(new ApiError(500, "Server error uploading type images"));
  }
};

exports.getTypeByName = async (req, res) => {
  try {
    const typeName = req.params.name;
    const type = await Type.findOne({
      name: { $regex: new RegExp(`^${typeName}$`, "i") },
    });
    if (!type) {
      return res
        .status(404)
        .json({ success: false, message: "Type not found" });
    }
    res.status(200).json({ success: true, type });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
