const Item = require('../models/Item');

// Obtener todos los items
exports.getAllItems = async (req, res) => {
  try {
    const items = await Item.find();
    res.json(items);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener items', error: error.message });
  }
};

// Obtener un item por ID
exports.getItemById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ mensaje: 'Item no encontrado' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener item', error: error.message });
  }
};

// Crear un nuevo item
exports.createItem = async (req, res) => {
  try {
    const nuevoItem = new Item(req.body);
    const itemGuardado = await nuevoItem.save();
    res.status(201).json(itemGuardado);
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al crear item', error: error.message });
  }
};

// Actualizar un item
exports.updateItem = async (req, res) => {
  try {
    const itemActualizado = await Item.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!itemActualizado) {
      return res.status(404).json({ mensaje: 'Item no encontrado' });
    }
    res.json(itemActualizado);
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al actualizar item', error: error.message });
  }
};

// Eliminar un item
exports.deleteItem = async (req, res) => {
  try {
    const itemEliminado = await Item.findByIdAndDelete(req.params.id);
    if (!itemEliminado) {
      return res.status(404).json({ mensaje: 'Item no encontrado' });
    }
    res.json({ mensaje: 'Item eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar item', error: error.message });
  }
};
