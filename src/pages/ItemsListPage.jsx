import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Edit2, Trash2, AlertCircle, Plus, Settings, Calendar } from 'lucide-react';
import { format, isAfter, isBefore, addDays } from 'date-fns';

const ItemsListPage = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', expiryDate: '' });
  const [filter, setFilter] = useState('all'); // all, expiring, expired
  const [sortBy, setSortBy] = useState('expiry'); // expiry, name, added

  // Load items from localStorage on component mount
  useEffect(() => {
    const savedItems = localStorage.getItem('groceryItems');
    if (savedItems) {
      try {
        const parsedItems = JSON.parse(savedItems);
        setItems(parsedItems);
      } catch (error) {
        console.error('Error loading items:', error);
      }
    }
  }, []);

  // Save items to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('groceryItems', JSON.stringify(items));
  }, [items]);

  // Helper function to get expiry status
  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) return 'unknown';
    
    const expiry = new Date(expiryDate);
    const today = new Date();
    const threeDaysFromNow = addDays(today, 3);
    
    if (isBefore(expiry, today)) return 'expired';
    if (isBefore(expiry, threeDaysFromNow)) return 'expiring';
    return 'fresh';
  };

  // Filter and sort items
  const getFilteredAndSortedItems = () => {
    let filteredItems = items;

    // Apply filter
    if (filter === 'expiring') {
      filteredItems = items.filter(item => {
        const status = getExpiryStatus(item.expiryDate);
        return status === 'expiring';
      });
    } else if (filter === 'expired') {
      filteredItems = items.filter(item => {
        const status = getExpiryStatus(item.expiryDate);
        return status === 'expired';
      });
    }

    // Apply sort
    return filteredItems.sort((a, b) => {
      if (sortBy === 'expiry') {
        if (!a.expiryDate && !b.expiryDate) return 0;
        if (!a.expiryDate) return 1;
        if (!b.expiryDate) return -1;
        return new Date(a.expiryDate) - new Date(b.expiryDate);
      } else if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'added') {
        return new Date(b.dateAdded) - new Date(a.dateAdded);
      }
      return 0;
    });
  };

  const handleUpdateItem = (itemId, updatedData) => {
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId ? { ...item, ...updatedData } : item
      )
    );
  };

  const handleDeleteItem = (itemId) => {
    setItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };

  const startEditing = (item) => {
    setEditingItem(item.id);
    setEditForm({
      name: item.name,
      expiryDate: item.expiryDate || ''
    });
  };

  const saveEdit = () => {
    if (editForm.name.trim()) {
      handleUpdateItem(editingItem, {
        name: editForm.name.trim(),
        expiryDate: editForm.expiryDate || null
      });
    }
    setEditingItem(null);
    setEditForm({ name: '', expiryDate: '' });
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditForm({ name: '', expiryDate: '' });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'expired':
        return 'bg-red-100 border-red-200 text-red-800';
      case 'expiring':
        return 'bg-yellow-100 border-yellow-200 text-yellow-800';
      case 'fresh':
        return 'bg-green-100 border-green-200 text-green-800';
      default:
        return 'bg-gray-100 border-gray-200 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    if (status === 'expired' || status === 'expiring') {
      return <AlertCircle className="w-4 h-4" />;
    }
    return <Calendar className="w-4 h-4" />;
  };

  const filteredAndSortedItems = getFilteredAndSortedItems();
  const expiredCount = items.filter(item => getExpiryStatus(item.expiryDate) === 'expired').length;
  const expiringCount = items.filter(item => getExpiryStatus(item.expiryDate) === 'expiring').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">My Groceries</h1>
            <button
              onClick={() => navigate('/settings')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
          
          {/* Stats */}
          <div className="flex gap-4 mt-3 text-sm">
            <span className="text-gray-600">
              Total: <span className="font-medium">{items.length}</span>
            </span>
            {expiringCount > 0 && (
              <span className="text-yellow-600">
                Expiring: <span className="font-medium">{expiringCount}</span>
              </span>
            )}
            {expiredCount > 0 && (
              <span className="text-red-600">
                Expired: <span className="font-medium">{expiredCount}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="max-w-md mx-auto px-4 py-3 bg-white border-b">
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('expiring')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === 'expiring'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Expiring Soon
          </button>
          <button
            onClick={() => setFilter('expired')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === 'expired'
                ? 'bg-red-100 text-red-800'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Expired
          </button>
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="expiry">Sort by Expiry Date</option>
          <option value="name">Sort by Name</option>
          <option value="added">Sort by Date Added</option>
        </select>
      </div>

      {/* Items List */}
      <div className="max-w-md mx-auto px-4 py-4">
        {filteredAndSortedItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Camera className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {items.length === 0 ? 'No items yet' : 'No items match your filter'}
            </h3>
            <p className="text-gray-600 mb-6">
              {items.length === 0 
                ? 'Take a photo of your groceries to get started'
                : 'Try adjusting your filter settings'
              }
            </p>
            {items.length === 0 && (
              <button
                onClick={() => navigate('/camera')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Camera className="w-4 h-4" />
                Take Photo
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAndSortedItems.map((item) => {
              const status = getExpiryStatus(item.expiryDate);
              const isEditing = editingItem === item.id;

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-lg border-2 transition-all ${getStatusColor(status)}`}
                >
                  {isEditing ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Item name"
                      />
                      <input
                        type="date"
                        value={editForm.expiryDate}
                        onChange={(e) => setEditForm({ ...editForm, expiryDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={saveEdit}
                          className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-1">{item.name}</h3>
                          <div className="flex items-center gap-2 text-sm">
                            {getStatusIcon(status)}
                            <span>
                              {item.expiryDate
                                ? `Expires ${format(new Date(item.expiryDate), 'MMM dd, yyyy')}`
                                : 'No expiry date'
                              }
                            </span>
                          </div>
                          {item.dateAdded && (
                            <p className="text-xs text-gray-500 mt-1">
                              Added {format(new Date(item.dateAdded), 'MMM dd, yyyy')}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1 ml-3">
                          <button
                            onClick={() => startEditing(item)}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-white/50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-white/50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => navigate('/camera')}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
};

export default ItemsListPage;