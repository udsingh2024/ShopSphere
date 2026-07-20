const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const {
  getAddresses,
  addAddress,
  editAddress,
  deleteAddress,
  setDefaultAddress,
} = require('../controllers/address.controller');

router.get('/', protect, getAddresses);
router.post('/', protect, addAddress);
router.put('/:addressId', protect, editAddress);
router.delete('/:addressId', protect, deleteAddress);
router.put('/:addressId/default', protect, setDefaultAddress);

module.exports = router;
