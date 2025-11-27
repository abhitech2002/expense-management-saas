// ==========================================
// frontend/src/components/expenses/ExpenseForm.jsx
// ==========================================

import { useState } from "react";
import { X, Upload, FileText, Image as ImageIcon } from "lucide-react";
import {
  expenseCategories,
  currencyOptions,
  validateFile,
  formatFileSize,
  getTodayDate,
} from "../../utils/helpers";
import toast from "react-hot-toast";

function ExpenseForm({ onSubmit, onClose, initialData = null }) {
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    amount: initialData?.amount || "",
    currency: initialData?.currency || "USD",
    category: initialData?.category || "",
    expenseDate: initialData?.expenseDate
      ? new Date(initialData.expenseDate).toISOString().split("T")[0]
      : getTodayDate(),
    merchant: initialData?.merchant || "",
    project: initialData?.project || "",
  });

  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(
    initialData?.receipt?.url || null
  );
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    processFile(file);
  };

  const processFile = (file) => {
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setReceiptFile(file);

    // Create preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      // PDF - show icon instead of preview
      setReceiptPreview(null);
    }
  };

  const removeReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
  };

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = "Amount must be greater than 0";
    }

    if (!formData.category) {
      newErrors.category = "Category is required";
    }

    if (!formData.expenseDate) {
      newErrors.expenseDate = "Expense date is required";
    }

    // Check if date is in future
    if (new Date(formData.expenseDate) > new Date()) {
      newErrors.expenseDate = "Expense date cannot be in the future";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setLoading(true);

    try {
      await onSubmit(formData, receiptFile);
      toast.success(
        initialData
          ? "Expense updated successfully"
          : "Expense created successfully"
      );
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save expense");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {initialData ? "Edit Expense" : "Create New Expense"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Client lunch meeting"
              className={`input-field ${errors.title ? "border-red-500" : ""}`}
              disabled={loading}
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title}</p>
            )}
          </div>

          {/* Amount and Currency */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount *
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                className={`input-field ${
                  errors.amount ? "border-red-500" : ""
                }`}
                disabled={loading}
              />
              {errors.amount && (
                <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency
              </label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="input-field"
                disabled={loading}
              >
                {currencyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category and Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={`input-field ${
                  errors.category ? "border-red-500" : ""
                }`}
                disabled={loading}
              >
                <option value="">Select category</option>
                {expenseCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-red-500 text-sm mt-1">{errors.category}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expense Date *
              </label>
              <input
                type="date"
                name="expenseDate"
                value={formData.expenseDate}
                onChange={handleChange}
                max={getTodayDate()}
                className={`input-field ${
                  errors.expenseDate ? "border-red-500" : ""
                }`}
                disabled={loading}
              />
              {errors.expenseDate && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.expenseDate}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Additional details about the expense..."
              rows="3"
              className="input-field"
              disabled={loading}
            />
          </div>

          {/* Merchant and Project */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Merchant
              </label>
              <input
                type="text"
                name="merchant"
                value={formData.merchant}
                onChange={handleChange}
                placeholder="e.g., The Steakhouse"
                className="input-field"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project
              </label>
              <input
                type="text"
                name="project"
                value={formData.project}
                onChange={handleChange}
                placeholder="e.g., Project Apollo"
                className="input-field"
                disabled={loading}
              />
            </div>
          </div>

          {/* Receipt Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Receipt (Optional)
            </label>

            {!receiptFile && !receiptPreview ? (
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? "border-primary-500 bg-primary-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">
                  Drag and drop your receipt here, or click to browse
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  JPEG, PNG, or PDF (max 5MB)
                </p>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept="image/jpeg,image/jpg,image/png,application/pdf"
                  className="hidden"
                  id="receipt-upload"
                  disabled={loading}
                />
                <label
                  htmlFor="receipt-upload"
                  className="btn-primary inline-block cursor-pointer"
                >
                  Choose File
                </label>
              </div>
            ) : (
              <div className="border border-gray-300 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    {receiptPreview ? (
                      <ImageIcon className="w-8 h-8 text-primary-600" />
                    ) : (
                      <FileText className="w-8 h-8 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">
                        {receiptFile?.name || "Current receipt"}
                      </p>
                      {receiptFile && (
                        <p className="text-sm text-gray-500">
                          {formatFileSize(receiptFile.size)}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeReceipt}
                    className="text-red-600 hover:text-red-700"
                    disabled={loading}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {receiptPreview && (
                  <img
                    src={receiptPreview}
                    alt="Receipt preview"
                    className="w-full h-48 object-cover rounded"
                  />
                )}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading
                ? "Saving..."
                : initialData
                ? "Update Expense"
                : "Create Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ExpenseForm;
