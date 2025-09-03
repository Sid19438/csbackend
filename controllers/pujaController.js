const Puja = require("../models/Puja");

// Temporary in-memory storage for testing without MongoDB
let tempPujas = [];
let tempPujaIdCounter = 1;

// Get all pujas
exports.getPujas = async (req, res) => {
  try {
    const pujas = await Puja.find().sort({ createdAt: -1 });
    res.json(pujas);
  } catch (err) {
    // Return temporary data if MongoDB is not connected
    console.log("MongoDB not connected, returning temporary data");
    res.json(tempPujas);
  }
};

// Get single puja by ID
exports.getPuja = async (req, res) => {
  try {
    const puja = await Puja.findById(req.params.id);
    if (!puja) {
      return res.status(404).json({ message: "Puja not found" });
    }
    res.json(puja);
  } catch (err) {
    // Try to find in temporary storage
    const tempPuja = tempPujas.find(p => p._id === req.params.id);
    if (!tempPuja) {
      return res.status(404).json({ message: "Puja not found" });
    }
    res.json(tempPuja);
  }
};

// Create new puja
exports.createPuja = async (req, res) => {
  try {
    const newPuja = new Puja(req.body);
    await newPuja.save();
    res.status(201).json(newPuja);
  } catch (err) {
    if (err.code === 11000) {
      res.status(400).json({ message: "A puja with this name already exists" });
    } else {
      console.log("MongoDB not connected, using temporary storage");
      // Create puja in temporary storage
      const tempPuja = {
        _id: `temp_puja_${tempPujaIdCounter++}`,
        ...req.body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        reviews: req.body.reviews || 0,
        rating: req.body.rating || 5,
        isActive: req.body.isActive !== undefined ? req.body.isActive : true
      };
      
      tempPujas.push(tempPuja);
      res.status(201).json(tempPuja);
    }
  }
};

// Update puja
exports.updatePuja = async (req, res) => {
  try {
    const updatedPuja = await Puja.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedPuja) {
      return res.status(404).json({ message: "Puja not found" });
    }
    res.json(updatedPuja);
  } catch (err) {
    if (err.code === 11000) {
      res.status(400).json({ message: "A puja with this name already exists" });
    } else {
      // Update in temporary storage
      const index = tempPujas.findIndex(p => p._id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ message: "Puja not found" });
      }
      
      tempPujas[index] = {
        ...tempPujas[index],
        ...req.body,
        updatedAt: new Date().toISOString()
      };
      
      res.json(tempPujas[index]);
    }
  }
};

// Delete puja
exports.deletePuja = async (req, res) => {
  try {
    const puja = await Puja.findByIdAndDelete(req.params.id);
    if (!puja) {
      return res.status(404).json({ message: "Puja not found" });
    }
    res.json({ message: "Puja deleted successfully" });
  } catch (err) {
    // Delete from temporary storage
    const index = tempPujas.findIndex(p => p._id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ message: "Puja not found" });
    }
    
    tempPujas.splice(index, 1);
    res.json({ message: "Puja deleted successfully" });
  }
};

// Toggle puja active status
exports.togglePujaStatus = async (req, res) => {
  try {
    const puja = await Puja.findById(req.params.id);
    if (!puja) {
      return res.status(404).json({ message: "Puja not found" });
    }
    
    puja.isActive = !puja.isActive;
    await puja.save();
    
    res.json({ 
      message: `Puja ${puja.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: puja.isActive 
    });
  } catch (err) {
    // Toggle in temporary storage
    const index = tempPujas.findIndex(p => p._id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ message: "Puja not found" });
    }
    
    tempPujas[index].isActive = !tempPujas[index].isActive;
    
    res.json({ 
      message: `Puja ${tempPujas[index].isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: tempPujas[index].isActive 
    });
  }
};
