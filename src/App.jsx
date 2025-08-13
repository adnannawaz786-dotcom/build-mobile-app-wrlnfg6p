import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Camera, List, Settings, Plus } from 'lucide-react';

// Main App Component
function App() {
  const [groceryItems, setGroceryItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load data from localStorage on app start
  useEffect(() => {
    const savedItems = localStorage.getItem('groceryItems');
    if (savedItems) {
      try {
        setGroceryItems(JSON.parse(savedItems));
      } catch (error) {
        console.error('Error loading saved items:', error);
      }
    }
    setLoading(false);
  }, []);

  // Save data to localStorage whenever items change
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('groceryItems', JSON.stringify(groceryItems));
    }
  }, [groceryItems, loading]);

  const addGroceryItem = (item) => {
    const newItem = {
      id: Date.now().toString(),
      ...item,
      createdAt: new Date().toISOString()
    };
    setGroceryItems(prev => [...prev, newItem]);
  };

  const updateGroceryItem = (id, updates) => {
    setGroceryItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, ...updates } : item
      )
    );
  };

  const deleteGroceryItem = (id) => {
    setGroceryItems(prev => prev.filter(item => item.id !== id));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your groceries...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route 
            path="/" 
            element={<Navigate to="/groceries" replace />} 
          />
          <Route 
            path="/groceries" 
            element={
              <GroceryList 
                items={groceryItems}
                onUpdateItem={updateGroceryItem}
                onDeleteItem={deleteGroceryItem}
              />
            } 
          />
          <Route 
            path="/camera" 
            element={
              <CameraCapture 
                onAddItem={addGroceryItem}
              />
            } 
          />
          <Route 
            path="/settings" 
            element={<Settings />} 
          />
        </Routes>
        
        <BottomNavigation />
        <Toaster position="top-center" richColors />
      </div>
    </Router>
  );
}

// Grocery List Component
function GroceryList({ items, onUpdateItem, onDeleteItem }) {
  const [editingItem, setEditingItem] = useState(null);
  const [sortBy, setSortBy] = useState('expiry');

  const sortedItems = [...items].sort((a, b) => {
    if (sortBy === 'expiry') {
      return new Date(a.expiryDate) - new Date(b.expiryDate);
    } else if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const getExpiryStatus = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'expired';
    if (diffDays <= 3) return 'expiring-soon';
    if (diffDays <= 7) return 'warning';
    return 'fresh';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'expired': return 'bg-red-100 border-red-300 text-red-800';
      case 'expiring-soon': return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'warning': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      default: return 'bg-green-100 border-green-300 text-green-800';
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">My Groceries</h1>
        
        <div className="flex gap-2 mb-4">
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="expiry">Sort by Expiry</option>
            <option value="name">Sort by Name</option>
            <option value="recent">Sort by Recent</option>
          </select>
        </div>
      </div>

      <div className="p-4 pb-20">
        {sortedItems.length === 0 ? (
          <div className="text-center py-12">
            <Camera className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No groceries yet</h3>
            <p className="text-gray-500 mb-6">Take a photo of your groceries to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedItems.map((item) => {
              const status = getExpiryStatus(item.expiryDate);
              const isEditing = editingItem === item.id;
              
              return (
                <div 
                  key={item.id} 
                  className={`p-4 rounded-lg border-2 ${getStatusColor(status)}`}
                >
                  {isEditing ? (
                    <EditItemForm 
                      item={item}
                      onSave={(updates) => {
                        onUpdateItem(item.id, updates);
                        setEditingItem(null);
                      }}
                      onCancel={() => setEditingItem(null)}
                    />
                  ) : (
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-lg">{item.name}</h3>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingItem(item.id)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => onDeleteItem(item.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <p className="text-sm opacity-75 mb-1">
                        Expires: {new Date(item.expiryDate).toLocaleDateString()}
                      </p>
                      {item.quantity && (
                        <p className="text-sm opacity-75">
                          Quantity: {item.quantity}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Edit Item Form Component
function EditItemForm({ item, onSave, onCancel }) {
  const [name, setName] = useState(item.name);
  const [expiryDate, setExpiryDate] = useState(item.expiryDate);
  const [quantity, setQuantity] = useState(item.quantity || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim() && expiryDate) {
      onSave({ name: name.trim(), expiryDate, quantity: quantity.trim() });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md"
        placeholder="Item name"
        required
      />
      <input
        type="date"
        value={expiryDate}
        onChange={(e) => setExpiryDate(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md"
        required
      />
      <input
        type="text"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md"
        placeholder="Quantity (optional)"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-400"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// Camera Capture Component
function CameraCapture({ onAddItem }) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [extractedItems, setExtractedItems] = useState([]);

  const handleFileCapture = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsCapturing(true);
    
    // Simulate OCR processing
    setTimeout(() => {
      const mockExtractedItems = [
        { name: 'Milk', expiryDate: '2024-01-15', quantity: '1L' },
        { name: 'Bread', expiryDate: '2024-01-12', quantity: '1 loaf' },
        { name: 'Eggs', expiryDate: '2024-01-20', quantity: '12 pack' }
      ];
      setExtractedItems(mockExtractedItems);
      setIsCapturing(false);
    }, 2000);
  };

  const handleAddItem = (item) => {
    onAddItem(item);
    setExtractedItems(prev => prev.filter(i => i !== item));
  };

  const handleAddAllItems = () => {
    extractedItems.forEach(item => onAddItem(item));
    setExtractedItems([]);
  };

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      <div className="p-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Scan Groceries</h1>
        
        <div className="space-y-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <label className="cursor-pointer">
              <span className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                Take Photo
              </span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileCapture}
                className="hidden"
              />
            </label>
            <p className="text-gray-500 text-sm mt-2">
              Or select from gallery
            </p>
          </div>

          {isCapturing && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Processing image...</p>
            </div>
          )}

          {extractedItems.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Found Items</h2>
                <button
                  onClick={handleAddAllItems}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                >
                  Add All
                </button>
              </div>
              
              <div className="space-y-3">
                {extractedItems.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-sm text-gray-600">
                          Expires: {new Date(item.expiryDate).toLocaleDateString()}
                        </p>
                        {item.quantity && (
                          <p className="text-sm text-gray-600">
                            Quantity: {item.quantity}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleAddItem(item)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Settings Component
function Settings() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [reminderDays, setReminderDays] = useState(3);

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      <div className="p-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
        
        <div className="space-y-6">
          <div className="border-b border-gray-200 pb-4">
            <h2 className="text-lg font-medium mb-4">Notifications</h2>
            <div className="flex items-center justify-between mb-4">
              <span>Enable expiry reminders</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationsEnabled}
                  onChange={(e) => setNotificationsEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            {notificationsEnabled && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Remind me {reminderDays} days before expiry
                </label>
                <input
                  type="range"
                  min="1"
                  max="7"
                  value={reminderDays}
                  onChange={(e) => setReminderDays(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            )}
          </div>

          <div className="border-b border-gray-200 pb-4">
            <h2 className="text-lg font-medium mb-4">Data</h2>
            <button className="w-full bg-red-600 text-white py-2 rounded-md hover:bg-red-700">
              Clear All Data
            </button>
          </div>

          <div>
            <h2 className="text-lg font-medium mb-4">About</h2>
            <p className="text-gray-600 text-sm">
              Grocery Tracker v1.0.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Bottom Navigation Component
function BottomNavigation() {
  const currentPath = window.location.pathname;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
      <div className="max-w-md mx-auto">
        <div className="flex justify-around py-2">
          <a
            href="/groceries"
            className={`flex flex-col items-center py-2 px-4 ${
              currentPath === '/groceries' ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            <List className="h-6 w-6" />
            <span className="text-xs mt-1">Groceries</span>
          </a>
          
          <a
            href="/camera"
            className={`flex flex-col items-center py-2 px-4 ${
              currentPath === '/camera' ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            <Camera className="h-6 w-6" />
            <span className="text-xs mt-1">Scan</span>
          </a>
          
          <a
            href="/settings"
            className={`flex flex-col items-center py-2 px-4 ${
              currentPath === '/settings' ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            <Settings className="h-6 w-6" />
            <span className="text-xs mt-1">Settings</span>
          </a>
        </div>
      </div>
    </nav>
  );
}

export default App;