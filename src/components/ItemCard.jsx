import { useState } from 'react';
import { Calendar, Edit2, Trash2, AlertTriangle, Check, X } from 'lucide-react';
import { format, isAfter, isBefore, addDays } from 'date-fns';

const ItemCard = ({ item, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(item.name);
  const [editedExpiryDate, setEditedExpiryDate] = useState(item.expiryDate);

  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) return 'unknown';
    
    const today = new Date();
    const expiry = new Date(expiryDate);
    const threeDaysFromNow = addDays(today, 3);
    
    if (isBefore(expiry, today)) {
      return 'expired';
    } else if (isBefore(expiry, threeDaysFromNow)) {
      return 'expiring-soon';
    } else {
      return 'fresh';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'expired':
        return 'border-red-500 bg-red-50';
      case 'expiring-soon':
        return 'border-yellow-500 bg-yellow-50';
      case 'fresh':
        return 'border-green-500 bg-green-50';
      default:
        return 'border-gray-300 bg-white';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'expired':
      case 'expiring-soon':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default:
        return <Calendar className="w-4 h-4 text-gray-600" />;
    }
  };

  const handleSave = () => {
    if (editedName.trim() && editedExpiryDate) {
      onUpdate(item.id, {
        ...item,
        name: editedName.trim(),
        expiryDate: editedExpiryDate
      });
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditedName(item.name);
    setEditedExpiryDate(item.expiryDate);
    setIsEditing(false);
  };

  const formatExpiryDate = (date) => {
    if (!date) return 'No expiry date';
    try {
      return format(new Date(date), 'MMM dd, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const status = getExpiryStatus(item.expiryDate);

  return (
    <div className={`rounded-lg border-2 p-4 mb-3 transition-all duration-200 ${getStatusColor(status)}`}>
      {isEditing ? (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Item Name
            </label>
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter item name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expiry Date
            </label>
            <input
              type="date"
              value={editedExpiryDate}
              onChange={(e) => setEditedExpiryDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-2 justify-end">
            <button
              onClick={handleCancel}
              className="px-3 py-2 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200 flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!editedName.trim() || !editedExpiryDate}
              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 flex items-center gap-1"
            >
              <Check className="w-4 h-4" />
              Save
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {item.name}
            </h3>
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              {getStatusIcon(status)}
              <span>
                Expires: {formatExpiryDate(item.expiryDate)}
              </span>
            </div>
            
            {status === 'expired' && (
              <div className="mt-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Expired
                </span>
              </div>
            )}
            
            {status === 'expiring-soon' && (
              <div className="mt-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Expires Soon
                </span>
              </div>
            )}
            
            {item.addedAt && (
              <div className="mt-1 text-xs text-gray-500">
                Added: {format(new Date(item.addedAt), 'MMM dd, yyyy')}
              </div>
            )}
          </div>
          
          <div className="flex gap-2 ml-4">
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              title="Edit item"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => onDelete(item.id)}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              title="Delete item"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemCard;