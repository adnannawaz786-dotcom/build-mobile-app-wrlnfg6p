import React, { useState, useRef, useCallback } from 'react';
import { Camera, RotateCcw, Check, X, Upload, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CameraPage = ({ onAddItems }) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedItems, setExtractedItems] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCapturing(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please check permissions.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageData);
    stopCamera();
    processImage(imageData);
  }, [stopCamera]);

  const handleFileUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target.result;
      setCapturedImage(imageData);
      processImage(imageData);
    };
    reader.readAsDataURL(file);
  }, []);

  const processImage = async (imageData) => {
    setIsProcessing(true);
    
    try {
      // Simulate OCR processing with mock data
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockExtractedItems = [
        {
          id: Date.now() + Math.random(),
          name: 'Milk',
          expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          confidence: 0.95
        },
        {
          id: Date.now() + Math.random() + 1,
          name: 'Bread',
          expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          confidence: 0.88
        },
        {
          id: Date.now() + Math.random() + 2,
          name: 'Yogurt',
          expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          confidence: 0.92
        }
      ];

      setExtractedItems(mockExtractedItems);
      setShowResults(true);
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Failed to process image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const updateItem = (id, field, value) => {
    setExtractedItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const removeItem = (id) => {
    setExtractedItems(prev => prev.filter(item => item.id !== id));
  };

  const saveItems = () => {
    if (onAddItems) {
      onAddItems(extractedItems);
    }
    navigate('/');
  };

  const resetCapture = () => {
    setCapturedImage(null);
    setExtractedItems([]);
    setShowResults(false);
    setIsProcessing(false);
  };

  if (showResults) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Review Extracted Items</h2>
              <p className="text-sm text-gray-600 mt-1">
                Edit the extracted information before saving
              </p>
            </div>

            {capturedImage && (
              <div className="p-4 border-b">
                <img 
                  src={capturedImage} 
                  alt="Captured" 
                  className="w-full h-32 object-cover rounded-lg"
                />
              </div>
            )}

            <div className="p-4 space-y-4">
              {extractedItems.map((item) => (
                <div key={item.id} className="border rounded-lg p-3 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Item name"
                      />
                      <input
                        type="date"
                        value={item.expiryDate}
                        onChange={(e) => updateItem(item.id, 'expiryDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="ml-2 p-2 text-red-500 hover:bg-red-50 rounded-md"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-xs text-gray-500">
                    Confidence: {Math.round(item.confidence * 100)}%
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t space-y-3">
              <button
                onClick={saveItems}
                disabled={extractedItems.length === 0}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <Check className="w-5 h-5 mr-2" />
                Save Items ({extractedItems.length})
              </button>
              
              <button
                onClick={resetCapture}
                className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg font-medium hover:bg-gray-300 flex items-center justify-center"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Take Another Photo
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center max-w-sm w-full">
          {capturedImage && (
            <img 
              src={capturedImage} 
              alt="Processing" 
              className="w-full h-32 object-cover rounded-lg mb-4"
            />
          )}
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Processing Image</h3>
          <p className="text-sm text-gray-600">
            Extracting item names and expiry dates...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 relative">
      {isCapturing ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />
          
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/50 to-transparent">
            <div className="flex items-center justify-center space-x-6">
              <button
                onClick={stopCamera}
                className="p-4 bg-gray-800/80 text-white rounded-full hover:bg-gray-700/80"
              >
                <X className="w-6 h-6" />
              </button>
              
              <button
                onClick={capturePhoto}
                className="p-6 bg-white rounded-full shadow-lg hover:bg-gray-100"
              >
                <Camera className="w-8 h-8 text-gray-900" />
              </button>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-4 bg-gray-800/80 text-white rounded-full hover:bg-gray-700/80"
              >
                <Upload className="w-6 h-6" />
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center max-w-sm w-full">
            <Camera className="w-16 h-16 mx-auto mb-6 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Scan Your Groceries
            </h2>
            <p className="text-gray-600 mb-8">
              Take a photo of your grocery items to automatically extract names and expiry dates
            </p>
            
            <div className="space-y-4">
              <button
                onClick={startCamera}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center"
              >
                <Camera className="w-5 h-5 mr-2" />
                Open Camera
              </button>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg font-medium hover:bg-gray-300 flex items-center justify-center"
              >
                <Upload className="w-5 h-5 mr-2" />
                Upload Photo
              </button>
            </div>
          </div>
        </div>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
};

export default CameraPage;