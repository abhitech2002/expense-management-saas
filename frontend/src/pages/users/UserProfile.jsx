import { useState, useEffect } from 'react';
import { useAuth } from '../../Context/AuthContext';
import { User, Mail, Phone, Building, Calendar } from 'lucide-react';
import { formatDate, getInitials } from '../../utils/helpers';

function UserProfile() {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>

      {/* Profile Card */}
      <div className="card">
        <div className="flex items-center space-x-6 mb-6">
          <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-3xl font-medium text-primary-600">
              {getInitials(user?.firstName, user?.lastName)}
            </span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {user?.firstName} {user?.lastName}
            </h2>
            <p className="text-gray-600 capitalize">{user?.role}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center space-x-3 text-gray-700">
            <Mail className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-gray-700">
            <Phone className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">{user?.phone || 'Not provided'}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-gray-700">
            <Building className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Department</p>
              <p className="font-medium">{user?.department || 'Not assigned'}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-gray-700">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Joined</p>
              <p className="font-medium">{formatDate(user?.createdAt)}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <button className="btn-primary">Edit Profile</button>
        </div>
      </div>
    </div>
  );
}

export default UserProfile;
