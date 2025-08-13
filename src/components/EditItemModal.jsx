import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, Package } from 'lucide-react';

const EditItemModal = ({ isOpen, onClose, item, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    expiryDate: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        expiryDate: item.expiryDate || ''
      });
      setErrors({});
    }
  }, [item]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Item name is required';
    }
    
    if (!formData.expiryDate) {
      newErrors.expiryDate = 'Expiry date is required';
    } else {
      const selectedDate = new Date(formData.expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.expiryDate = 'Expiry date cannot be in the past';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      const updatedItem = {
        ...item,
        name: formData.name.trim(),
        expiryDate: formData.expiryDate
      };
      onSave(updatedItem);
      onClose();
    }
  };

  const handleCancel = () => {
    setFormData({
      name: item?.name || '',
      expiryDate: item?.expiryDate || ''
    });
    setErrors({});
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={handleCancel}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Edit Item
          </h2>
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Item Name Field */}
          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-gray-700">
              <Package className="w-4 h-4 mr-2" />
              Item Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              onKeyDown={handleKeyDown}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                errors.name 
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
              }`}
              placeholder="Enter item name"
              autoFocus
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Expiry Date Field */}
          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-gray-700">
              <Calendar className="w-4 h-4 mr-2" />
              Expiry Date
            </label>
            <input
              type="date"
              value={formData.expiryDate}
              onChange={(e) => handleInputChange('expiryDate', e.target.value)}
              onKeyDown={handleKeyDown}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                errors.expiryDate 
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
              }`}
              min={new Date().toISOString().split('T')[0]}
            />
            {errors.expiryDate && (
              <p className="text-sm text-red-600 mt-1">{errors.expiryDate}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditItemModal;