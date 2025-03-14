'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toast';
import { authAPI } from '@/lib/api';

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  role: string;
  subscription: string;
  emailVerified: boolean;
  profilePicture?: string;
  createdAt?: string;
}

export default function SettingsPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordMode, setPasswordMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Try to fetch user from API
        const response = await authAPI.getCurrentUser();
        const userData = response.data.user;
        
        setUser({
          id: userData.id,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          company: userData.company || '',
          role: userData.role || 'user',
          subscription: userData.subscription || 'free',
          emailVerified: userData.emailVerified || false,
          profilePicture: userData.profilePicture || '',
          createdAt: userData.createdAt,
        });
        
        setFormData({
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          company: userData.company || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } catch (error) {
        console.error('Error fetching user profile:', error);
        
        // Fallback to mock data
        const mockUser = {
          id: 'user123',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          company: 'Acme Inc',
          role: 'user',
          subscription: 'pro',
          emailVerified: true,
          createdAt: '2023-03-10T12:00:00Z',
          profilePicture: 'https://ui-avatars.com/api/?name=John+Doe&background=0D8ABC&color=fff',
        };

        setUser(mockUser);
        setFormData({
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          email: mockUser.email,
          company: mockUser.company || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const profileData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        company: formData.company,
      };
      
      // Make API call to update profile
      const response = await authAPI.updateProfile(profileData);
      
      // Update local user state
      if (user) {
        setUser({
          ...user,
          ...profileData,
        });
      }
      
      toast({
        title: 'Success',
        message: 'Profile updated successfully',
        type: 'success',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        message: 'Failed to update profile',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: 'Error',
        message: 'New passwords do not match',
        type: 'error',
      });
      return;
    }
    
    setSaving(true);

    try {
      // Make API call to update password
      await authAPI.changePassword(formData.currentPassword, formData.newPassword);
      
      // Clear password fields
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      // Toggle back to profile mode
      setPasswordMode(false);
      
      toast({
        title: 'Success',
        message: 'Password updated successfully',
        type: 'success',
      });
    } catch (error) {
      console.error('Error updating password:', error);
      toast({
        title: 'Error',
        message: 'Failed to update password',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };
  
  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    const file = e.target.files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        message: 'Please select an image file (JPG, PNG, etc.)',
        type: 'error',
      });
      return;
    }
    
    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      toast({
        title: 'Error',
        message: 'Image file size must be less than 5MB',
        type: 'error',
      });
      return;
    }
    
    setUploadingImage(true);
    
    try {
      // Upload image to server using the API
      const response = await authAPI.uploadProfileImage(file);
      const profileImageUrl = response.data.profileImage.url;
      
      // Update user state with new profile picture
      if (user) {
        setUser({
          ...user,
          profilePicture: profileImageUrl,
        });
      }
      
      toast({
        title: 'Success',
        message: 'Profile picture updated successfully',
        type: 'success',
      });
    } catch (error) {
      console.error('Error uploading profile image:', error);
      toast({
        title: 'Error',
        message: 'Failed to upload profile picture',
        type: 'error',
      });
    } finally {
      setUploadingImage(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // Format date string to a readable format
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="py-10 px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-4">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold leading-tight text-gray-900">Settings</h1>
          <p className="mt-2 text-sm text-gray-500">
            Manage your account settings and preferences
          </p>
        </div>
      </div>

      <div className="mt-6 bg-white shadow sm:rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <div className="border-b border-gray-200 pb-5 flex justify-between items-center">
            <h2 className="text-lg font-medium leading-6 text-gray-900">
              {passwordMode ? 'Change Password' : 'Profile Information'}
            </h2>
            <button
              type="button"
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => setPasswordMode(!passwordMode)}
            >
              {passwordMode ? 'Edit Profile' : 'Change Password'}
            </button>
          </div>

          {!passwordMode ? (
            <div className="mt-6">
              <div className="flex flex-col sm:flex-row gap-6 mb-8">
                <div className="flex flex-col items-center">
                  <div className="relative rounded-full overflow-hidden h-24 w-24 mb-4 border-2 border-gray-200">
                    {uploadingImage ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                      </div>
                    ) : (
                      <Image
                        src={user?.profilePicture || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(`${user?.firstName || ''} ${user?.lastName || ''}`)}
                        alt="Profile"
                        width={96}
                        height={96}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      id="profilePicture"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleProfilePictureUpload}
                      disabled={uploadingImage}
                    />
                    <button
                      type="button"
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium focus:outline-none"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                    >
                      {uploadingImage ? 'Uploading...' : 'Change picture'}
                    </button>
                  </div>
                </div>

                <form className="flex-1 space-y-6" onSubmit={handleProfileUpdate}>
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                        First name
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="firstName"
                          id="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          required
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                        Last name
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="lastName"
                          id="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          required
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-4">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email address
                      </label>
                      <div className="mt-1 relative">
                        <input
                          type="email"
                          name="email"
                          id="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md bg-gray-100"
                          readOnly
                        />
                        {user?.emailVerified && (
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Verified
                            </span>
                          </div>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        Contact support to change your email address
                      </p>
                    </div>

                    <div className="sm:col-span-4">
                      <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                        Company (Optional)
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="company"
                          id="company"
                          value={formData.company}
                          onChange={handleChange}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      onClick={() => router.push('/dashboard')}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <form className="mt-6 space-y-6" onSubmit={handlePasswordUpdate}>
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-4">
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                    Current Password
                  </label>
                  <div className="mt-1">
                    <input
                      type="password"
                      name="currentPassword"
                      id="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      required
                    />
                  </div>
                </div>

                <div className="sm:col-span-4">
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <div className="mt-1">
                    <input
                      type="password"
                      name="newPassword"
                      id="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      required
                      minLength={8}
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Password must be at least 8 characters
                  </p>
                </div>

                <div className="sm:col-span-4">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm New Password
                  </label>
                  <div className="mt-1">
                    <input
                      type="password"
                      name="confirmPassword"
                      id="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => setPasswordMode(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Change Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <div className="mt-6 bg-white shadow sm:rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium leading-6 text-gray-900">Account Information</h2>
          <div className="mt-6 border-t border-gray-200 pt-6">
            <dl className="divide-y divide-gray-200">
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium text-gray-500">Account ID</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user?.id}</dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium text-gray-500">Subscription Plan</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 capitalize">
                  {user?.subscription}
                  <button
                    type="button"
                    className="ml-3 inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={() => router.push('/dashboard/subscription')}
                  >
                    Manage
                  </button>
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium text-gray-500">Account Type</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 capitalize">
                  {user?.role}
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium text-gray-500">Account Created</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {formatDate(user?.createdAt)}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white shadow sm:rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium leading-6 text-gray-900">Delete Account</h2>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>
              Once you delete your account, you will lose all data associated with it.
            </p>
          </div>
          <div className="mt-5">
            <button
              type="button"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm"
              onClick={() => {
                toast({
                  title: 'Info',
                  message: 'This action is disabled in the demo',
                  type: 'info',
                });
              }}
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}