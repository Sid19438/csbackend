const Astrologer = require("../models/Astrologer");

// Temporary in-memory storage for testing without MongoDB
let tempAstrologers = [];
let tempIdCounter = 1;

// Get all astrologers
exports.getAstrologers = async (req, res) => {
  try {
    const astrologers = await Astrologer.find().sort({ createdAt: -1 });
    res.json(astrologers);
  } catch (err) {
    // Return temporary data if MongoDB is not connected
    console.log("MongoDB not connected, returning temporary data");
    res.json(tempAstrologers);
  }
};

// Get single astrologer by ID
exports.getAstrologer = async (req, res) => {
  try {
    const astrologer = await Astrologer.findById(req.params.id);
    if (!astrologer) {
      return res.status(404).json({ message: "Astrologer not found" });
    }
    res.json(astrologer);
  } catch (err) {
    // Try to find in temporary storage
    const tempAstrologer = tempAstrologers.find(a => a._id === req.params.id);
    if (!tempAstrologer) {
      return res.status(404).json({ message: "Astrologer not found" });
    }
    res.json(tempAstrologer);
  }
};

// Create new astrologer
exports.createAstrologer = async (req, res) => {
  try {
    const newAstrologer = new Astrologer(req.body);
    await newAstrologer.save();
    res.status(201).json(newAstrologer);
  } catch (err) {
    if (err.code === 11000) {
      res.status(400).json({ message: "An astrologer with this name already exists" });
    } else {
      console.log("MongoDB not connected, using temporary storage");
      // Create astrologer in temporary storage
      const tempAstrologer = {
        _id: `temp_${tempIdCounter++}`,
        ...req.body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        reviews: req.body.reviews || 0,
        rating: req.body.rating || 5,
        isActive: req.body.isActive !== undefined ? req.body.isActive : true
      };
      
      tempAstrologers.push(tempAstrologer);
      res.status(201).json(tempAstrologer);
    }
  }
};

// Update astrologer
exports.updateAstrologer = async (req, res) => {
  try {
    const updatedAstrologer = await Astrologer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedAstrologer) {
      return res.status(404).json({ message: "Astrologer not found" });
    }
    res.json(updatedAstrologer);
  } catch (err) {
    if (err.code === 11000) {
      res.status(400).json({ message: "An astrologer with this name already exists" });
    } else {
      // Update in temporary storage
      const index = tempAstrologers.findIndex(a => a._id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ message: "Astrologer not found" });
      }
      
      tempAstrologers[index] = {
        ...tempAstrologers[index],
        ...req.body,
        updatedAt: new Date().toISOString()
      };
      
      res.json(tempAstrologers[index]);
    }
  }
};

// Delete astrologer
exports.deleteAstrologer = async (req, res) => {
  try {
    const astrologer = await Astrologer.findByIdAndDelete(req.params.id);
    if (!astrologer) {
      return res.status(404).json({ message: "Astrologer not found" });
    }
    res.json({ message: "Astrologer deleted successfully" });
  } catch (err) {
    // Delete from temporary storage
    const index = tempAstrologers.findIndex(a => a._id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ message: "Astrologer not found" });
    }
    
    tempAstrologers.splice(index, 1);
    res.json({ message: "Astrologer deleted successfully" });
  }
};

// Toggle astrologer active status
exports.toggleAstrologerStatus = async (req, res) => {
  try {
    const astrologer = await Astrologer.findById(req.params.id);
    if (!astrologer) {
      return res.status(404).json({ message: "Astrologer not found" });
    }
    
    astrologer.isActive = !astrologer.isActive;
    await astrologer.save();
    
    res.json({ 
      message: `Astrologer ${astrologer.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: astrologer.isActive 
    });
  } catch (err) {
    // Toggle in temporary storage
    const index = tempAstrologers.findIndex(a => a._id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ message: "Astrologer not found" });
    }
    
    tempAstrologers[index].isActive = !tempAstrologers[index].isActive;
    
    res.json({ 
      message: `Astrologer ${tempAstrologers[index].isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: tempAstrologers[index].isActive 
    });
  }
};

// Legacy product methods (keeping for backward compatibility)
const Product = require("../models/DataModel");

exports.createProduct = async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedProduct)
      return res.status(404).json({ message: "Product not found" });
    res.json(updatedProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
