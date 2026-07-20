const User = require('../models/User');
const logger = require('../utils/logger');

const getAddresses = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      success: true,
      addresses: user.addresses || [],
    });
  } catch (error) {
    next(error);
  }
};

const addAddress = async (req, res, next) => {
  try {
    const { street, city, state, zipCode, country, isDefault } = req.body;

    if (!street || !city || !state || !zipCode || !country) {
      return res.status(400).json({ success: false, message: 'All address fields are required' });
    }

    // Pin code format validation (checks for standard Indian pin codes or global postal codes)
    const pinRegex = /^[1-9][0-9]{5}$|^[0-9]{5}(-[0-9]{4})?$/;
    if (!pinRegex.test(zipCode.trim())) {
      return res.status(400).json({ success: false, message: 'Invalid pin/postal code format' });
    }

    const user = await User.findById(req.user.id);
    const newAddress = {
      street: street.trim(),
      city: city.trim(),
      state: state.trim(),
      zipCode: zipCode.trim(),
      country: country.trim(),
      isDefault: isDefault || false,
    };

    // If marked default, set all others to false
    if (newAddress.isDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    } else if (user.addresses.length === 0) {
      // First address should be default
      newAddress.isDefault = true;
    }

    user.addresses.push(newAddress);
    await user.save();

    logger.info(`Address added for user ${user.email}`);

    res.status(201).json({
      success: true,
      addresses: user.addresses,
    });
  } catch (error) {
    next(error);
  }
};

const editAddress = async (req, res, next) => {
  try {
    const { addressId } = req.params;
    const { street, city, state, zipCode, country, isDefault } = req.body;

    const pinRegex = /^[1-9][0-9]{5}$|^[0-9]{5}(-[0-9]{4})?$/;
    if (zipCode && !pinRegex.test(zipCode.trim())) {
      return res.status(400).json({ success: false, message: 'Invalid pin/postal code format' });
    }

    const user = await User.findById(req.user.id);
    const address = user.addresses.id(addressId);

    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    if (street) address.street = street.trim();
    if (city) address.city = city.trim();
    if (state) address.state = state.trim();
    if (zipCode) address.zipCode = zipCode.trim();
    if (country) address.country = country.trim();
    if (isDefault !== undefined) address.isDefault = isDefault;

    // Handle default address assignment
    if (address.isDefault) {
      user.addresses.forEach((addr) => {
        if (addr._id.toString() !== addressId) {
          addr.isDefault = false;
        }
      });
    }

    await user.save();
    logger.info(`Address ${addressId} updated for user ${user.email}`);

    res.json({
      success: true,
      addresses: user.addresses,
    });
  } catch (error) {
    next(error);
  }
};

const deleteAddress = async (req, res, next) => {
  try {
    const { addressId } = req.params;
    const user = await User.findById(req.user.id);

    const addressIndex = user.addresses.findIndex((addr) => addr._id.toString() === addressId);
    if (addressIndex === -1) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    const wasDefault = user.addresses[addressIndex].isDefault;
    user.addresses.splice(addressIndex, 1);

    // If we deleted the default address, set another one as default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    logger.info(`Address ${addressId} deleted for user ${user.email}`);

    res.json({
      success: true,
      addresses: user.addresses,
    });
  } catch (error) {
    next(error);
  }
};

const setDefaultAddress = async (req, res, next) => {
  try {
    const { addressId } = req.params;
    const user = await User.findById(req.user.id);

    let addressFound = false;
    user.addresses.forEach((addr) => {
      if (addr._id.toString() === addressId) {
        addr.isDefault = true;
        addressFound = true;
      } else {
        addr.isDefault = false;
      }
    });

    if (!addressFound) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    await user.save();
    logger.info(`Default address updated to ${addressId} for user ${user.email}`);

    res.json({
      success: true,
      addresses: user.addresses,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAddresses,
  addAddress,
  editAddress,
  deleteAddress,
  setDefaultAddress,
};
