import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI, postsAPI, friendsAPI } from '../api/api';
import UserAvatar from '../components/common/UserAvatar';

const Profile = ({ initialEditMode = false }) => {
  const { id } = useParams();
  const { user: auth0User, isLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(initialEditMode);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    profile: {},
    education: [],
    experience: [],
    skills: [],
    socialProfiles: [],
    projects: []
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        let userData;
        
        if (!id) {
          // Fetch current user's profile
          userData = await authAPI.getCurrentUser();
          setIsOwnProfile(true);
        } else {
          // Fetch specific user's public profile
          userData = await postsAPI.getUserProfile(id);
          // Check if it's the current user by ID (need to fetch current user's ID first or have it in AuthContext)
          const currentUser = await authAPI.getCurrentUser();
          setIsOwnProfile(currentUser.id === id);
        }

        setProfile(userData);
        if (setIsOwnProfile) {
          setFormData({
            profile: userData.profile || {},
            education: userData.education || [],
            experience: userData.experience || [],
            skills: userData.skills || [],
            socialProfiles: userData.socialProfiles || [],
            projects: userData.projects || [],
          });
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    if (auth0User) {
      fetchProfile();
    }
  }, [auth0User, id]);

  if (isLoading || loading) {
    return (
      <div className="container mx-auto px-4 pt-32 pb-12 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-gray-500 font-medium">Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return <div className="container mx-auto px-4 pt-32 pb-12 text-red-500">{error}</div>;
  }

  const handleChange = (e, section, index = null) => {
    const { name, value } = e.target;
    setFormData(prevState => {
      if (index !== null) {
        const newArray = [...prevState[section]];
        newArray[index] = { ...newArray[index], [name]: value };
        return { ...prevState, [section]: newArray };
      } else {
        return { ...prevState, [section]: { ...prevState[section], [name]: value } };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log("Submitting form data:", formData);
      
      // Use authAPI instead of profileAPI since the endpoint might be different
      const response = await authAPI.updateUser(formData);
      
      setProfile(response);
      setIsEditing(false);
      console.log("Profile updated successfully", response);
      // Show success message
      alert('Profile updated successfully!');
      
      // If we were on the edit page, navigate back to profile
      if (initialEditMode) {
        navigate('/profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  const addItem = (section) => {
    setFormData(prevState => ({
      ...prevState,
      [section]: [...prevState[section], {}]
    }));
  };

  const removeItem = (section, index) => {
    setFormData(prevState => ({
      ...prevState,
      [section]: prevState[section].filter((_, i) => i !== index)
    }));
  };

  const renderField = (field) => (field ? field : '-');

  const renderName = (firstName, lastName) => {
    if(firstName && lastName) {
      return firstName + ' ' + lastName;
    } else if(firstName) {
      return firstName;
    } else {
      return '-';
    }
  }

  // Function to toggle edit mode
  const toggleEdit = () => {
    console.log("Toggle edit mode, current state:", isEditing);
    setIsEditing(!isEditing);
  };

  // Check if profile is complete
  const isProfileComplete = profile?.profile?.firstName && 
    profile?.profile?.lastName && 
    profile?.profile?.bio && 
    profile?.profile?.phone;

  return (
    <div className="container mx-auto px-4 pt-32 pb-12">
      <div className="max-w-4xl mx-auto">
        {!isEditing ? (
          <div className="mt-8">
            {!isProfileComplete && (
              <div className="mb-8 p-4 bg-yellow-50 rounded-lg">
                <p className="text-yellow-800 mb-2">
                  Your profile is incomplete. Please fill in all required fields.
                </p>
              </div>
            )}
            
            <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <UserAvatar 
                  user={profile} 
                  className="w-32 h-32 text-4xl border-4 border-white shadow-xl"
                />
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-3xl font-bold">{renderName(profile.profile?.firstName, profile.profile?.lastName) || profile.username}</h1>
                  <p className="text-gray-500 font-medium">{profile.role} • {profile.status}</p>
                  {isOwnProfile && <p className="text-xs text-indigo-600 mt-1 font-bold uppercase tracking-wider">Your Profile</p>}
                </div>
              </div>
              
              <div className="flex flex-wrap justify-center gap-3">
                {isOwnProfile ? (
                  <button 
                    onClick={toggleEdit}
                    className="px-6 py-2.5 rounded-full text-sm font-medium bg-black text-white hover:bg-gray-900 cursor-pointer transition shadow-lg shadow-gray-200"
                  >
                    {isProfileComplete ? 'Edit Profile' : 'Complete Profile'}
                  </button>
                ) : (
                  <>
                    <Link
                      to={`/inbox?user=${profile.id}`}
                      className="px-6 py-2.5 rounded-full text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-lg shadow-indigo-100"
                    >
                      Message
                    </Link>
                    {profile.role === 'ORGANIZER' && (
                      <button 
                        onClick={async () => {
                          try {
                            await friendsAPI.followOrganizer(profile.id);
                            alert('Following organizer!');
                          } catch (err) {
                            alert(err.response?.data?.error || 'Failed to follow');
                          }
                        }}
                        className="px-6 py-2.5 rounded-full text-sm font-bold bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 transition"
                      >
                        Follow
                      </button>
                    )}
                    <button 
                      onClick={async () => {
                        try {
                          await friendsAPI.sendRequest(profile.id);
                          alert('Friend request sent!');
                        } catch (err) {
                          alert(err.response?.data?.error || 'Failed to send request');
                        }
                      }}
                      className="px-6 py-2.5 rounded-full text-sm font-bold border border-gray-200 bg-white hover:bg-gray-50 transition"
                    >
                      Add Friend
                    </button>
                  </>
                )}
              </div>
            </div>
            
            {/* Basic Info */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Email</label>
                  <p className="mt-1">{profile?.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Username</label>
                  <p className="mt-1">{profile?.username}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Role</label>
                  <p className="mt-1">{profile?.role}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Status</label>
                  <p className="mt-1">{profile?.status}</p>
                </div>
              </div>
            </div>

            {/* Profile Details */}
            {profile?.profile && (
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Profile Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Name</label>
                    <p className="mt-1">{renderName(profile.profile.firstName, profile.profile.lastName)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Gender</label>
                    <p className="mt-1">{profile.profile.gender || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Phone</label>
                    <p className="mt-1">{profile.profile.phone || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Location</label>
                    <p className="mt-1">
                      {profile.profile.city && profile.profile.country 
                        ? `${profile.profile.city}, ${profile.profile.country}`
                        : '-'}
                    </p>
                  </div>
                  {profile.profile.bio && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-600">Bio</label>
                      <p className="mt-1 whitespace-pre-wrap">{profile.profile.bio}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Education */}
            {profile?.education?.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Education</h2>
                {profile.education.map((edu, index) => (
                  <div key={index} className="mb-4 last:mb-0 border-b last:border-0 pb-4 last:pb-0">
                    <h3 className="font-medium">{edu.institutionName}</h3>
                    <p className="text-sm text-gray-600">
                      {edu.degree} in {edu.fieldOfStudy}
                    </p>
                    <p className="text-sm text-gray-500">
                      {edu.startDate && `${new Date(edu.startDate).getFullYear()} - `}
                      {edu.endDate ? new Date(edu.endDate).getFullYear() : 'Present'}
                    </p>
                    {edu.grade && (
                      <p className="text-sm text-gray-500">Grade: {edu.grade}</p>
                    )}
                    {edu.activities && (
                      <p className="text-sm text-gray-500 mt-1">{edu.activities}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Experience */}
            {profile?.experience?.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Experience</h2>
                {profile.experience.map((exp, index) => (
                  <div key={index} className="mb-4 last:mb-0 border-b last:border-0 pb-4 last:pb-0">
                    <h3 className="font-medium">{exp.position}</h3>
                    <p className="text-sm text-gray-600">{exp.company}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(exp.startDate).toLocaleDateString()} - 
                      {exp.endDate ? new Date(exp.endDate).toLocaleDateString() : 'Present'}
                    </p>
                    {exp.location && (
                      <p className="text-sm text-gray-500">{exp.location}</p>
                    )}
                    {exp.description && (
                      <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{exp.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Skills */}
            {profile?.skills?.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, index) => (
                    <span 
                      key={index}
                      className={`px-3 py-1 rounded-full text-sm ${
                        skill.expertiseLevel === 'EXPERT' 
                          ? 'bg-green-100 text-green-800'
                          : skill.expertiseLevel === 'INTERMEDIATE'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {skill.skillName}
                      <span className="ml-1 text-xs">
                        ({skill.expertiseLevel.toLowerCase()})
                        {skill.yearsOfExp && ` • ${skill.yearsOfExp}y`}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Social Profiles */}
            {profile?.socialProfiles?.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Social Profiles</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile.socialProfiles.map((social, index) => (
                    <a
                      key={index}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                    >
                      {/* You can add icons based on platform */}
                      <span>{social.platform}</span>
                      <span className="text-sm truncate">{social.url}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-8">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold">
                {isProfileComplete ? 'Edit Profile' : 'Complete Your Profile'}
              </h1>
              <button 
                onClick={toggleEdit}
                className="px-6 py-2.5 rounded-full text-sm font-medium text-gray-600 hover:text-black cursor-pointer"
              >
                Cancel
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow-xl rounded-2xl p-8">
              {/* Basic Information */}
              <div>
                <h3 className="text-xl font-semibold mb-3">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="firstName"
                    value={formData.profile.firstName || ''}
                    onChange={(e) => handleChange(e, 'profile')}
                    placeholder="First Name"
                    className="w-full px-3 py-2 border rounded"
                  />
                  <input
                    type="text"
                    name="lastName"
                    value={formData.profile.lastName || ''}
                    onChange={(e) => handleChange(e, 'profile')}
                    placeholder="Last Name"
                    className="w-full px-3 py-2 border rounded"
                  />
                  <input
                    type="text"
                    name="phone"
                    value={formData.profile.phone || ''}
                    onChange={(e) => handleChange(e, 'profile')}
                    placeholder="Phone"
                    className="w-full px-3 py-2 border rounded"
                  />
                  <select
                    name="gender"
                    value={formData.profile.gender || ''}
                    onChange={(e) => handleChange(e, 'profile')}
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="">Select Gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                    <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                  </select>
                  <input
                    type="text"
                    name="country"
                    value={formData.profile.country || ''}
                    onChange={(e) => handleChange(e, 'profile')}
                    placeholder="Country"
                    className="w-full px-3 py-2 border rounded"
                  />
                  <input
                    type="text"
                    name="city"
                    value={formData.profile.city || ''}
                    onChange={(e) => handleChange(e, 'profile')}
                    placeholder="City"
                    className="w-full px-3 py-2 border rounded"
                  />
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture URL</label>
                    <input
                      type="text"
                      name="avatarUrl"
                      value={formData.profile.avatarUrl || ''}
                      onChange={(e) => handleChange(e, 'profile')}
                      placeholder="https://example.com/avatar.jpg"
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>
                </div>
                <textarea
                  name="bio"
                  value={formData.profile.bio || ''}
                  onChange={(e) => handleChange(e, 'profile')}
                  placeholder="Bio"
                  className="w-full px-3 py-2 border rounded mt-4"
                  rows="4"
                />
              </div>
              
              {/* Education */}
              <div>
                <h3 className="text-xl font-semibold mb-3">Education</h3>
                {formData.education.map((edu, index) => (
                  <div key={index} className="mb-6 p-4 border rounded-lg bg-gray-50">
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        name="institutionName"
                        value={edu.institutionName || ''}
                        onChange={(e) => handleChange(e, 'education', index)}
                        placeholder="Institution Name"
                        className="w-full px-3 py-2 border rounded"
                      />
                      <input
                        type="text"
                        name="fieldOfStudy"
                        value={edu.fieldOfStudy || ''}
                        onChange={(e) => handleChange(e, 'education', index)}
                        placeholder="Field of Study"
                        className="w-full px-3 py-2 border rounded"
                      />
                      <select
                        name="degree"
                        value={edu.degree || ''}
                        onChange={(e) => handleChange(e, 'education', index)}
                        className="w-full px-3 py-2 border rounded"
                      >
                        <option value="">Select Degree</option>
                        <option value="HIGH_SCHOOL">High School</option>
                        <option value="ASSOCIATE">Associate</option>
                        <option value="BACHELOR">Bachelor</option>
                        <option value="MASTER">Master</option>
                        <option value="PHD">PhD</option>
                      </select>
                      <input
                        type="text"
                        name="grade"
                        value={edu.grade || ''}
                        onChange={(e) => handleChange(e, 'education', index)}
                        placeholder="Grade/GPA"
                        className="w-full px-3 py-2 border rounded"
                      />
                      <input
                        type="date"
                        name="startDate"
                        value={edu.startDate || ''}
                        onChange={(e) => handleChange(e, 'education', index)}
                        className="w-full px-3 py-2 border rounded"
                      />
                      <input
                        type="date"
                        name="endDate"
                        value={edu.endDate || ''}
                        onChange={(e) => handleChange(e, 'education', index)}
                        className="w-full px-3 py-2 border rounded"
                      />
                      <div className="col-span-2">
                        <textarea
                          name="activities"
                          value={edu.activities || ''}
                          onChange={(e) => handleChange(e, 'education', index)}
                          placeholder="Activities and Societies"
                          className="w-full px-3 py-2 border rounded"
                          rows="2"
                        />
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => removeItem('education', index)}
                      className="mt-2 text-red-500 hover:text-red-700"
                    >
                      Remove Education
                    </button>
                  </div>
                ))}
                <button 
                  type="button" 
                  onClick={() => addItem('education')}
                  className="text-blue-500 hover:text-blue-700"
                >
                  + Add Education
                </button>
              </div>

              {/* Experience */}
              <div>
                <h3 className="text-xl font-semibold mb-3">Experience</h3>
                {formData.experience.map((exp, index) => (
                  <div key={index} className="mb-4">
                    <input
                      type="text"
                      name="company"
                      value={exp.company || ''}
                      onChange={(e) => handleChange(e, 'experience', index)}
                      placeholder="Company"
                      className="w-full px-3 py-2 border rounded mb-2"
                    />
                    <input
                      type="text"
                      name="position"
                      value={exp.position || ''}
                      onChange={(e) => handleChange(e, 'experience', index)}
                      placeholder="Position"
                      className="w-full px-3 py-2 border rounded mb-2"
                    />
                    <input
                      type="date"
                      name="startDate"
                      value={exp.startDate || ''}
                      onChange={(e) => handleChange(e, 'experience', index)}
                      className="w-full px-3 py-2 border rounded mb-2"
                    />
                    <input
                      type="date"
                      name="endDate"
                      value={exp.endDate || ''}
                      onChange={(e) => handleChange(e, 'experience', index)}
                      className="w-full px-3 py-2 border rounded mb-2"
                    />
                    <button type="button" onClick={() => removeItem('experience', index)} className="text-red-500">Remove</button>
                  </div>
                ))}
                <button type="button" onClick={() => addItem('experience')} className="text-blue-500">Add Experience</button>
              </div>

              {/* Skills */}
              <div>
                <h3 className="text-xl font-semibold mb-3">Skills</h3>
                {formData.skills.map((skill, index) => (
                  <div key={index} className="mb-4">
                    <input
                      type="text"
                      name="skillName"
                      value={skill.skillName || ''}
                      onChange={(e) => handleChange(e, 'skills', index)}
                      placeholder="Skill Name"
                      className="w-full px-3 py-2 border rounded mb-2"
                    />
                    <select
                      name="expertiseLevel"
                      value={skill.expertiseLevel || ''}
                      onChange={(e) => handleChange(e, 'skills', index)}
                      className="w-full px-3 py-2 border rounded mb-2"
                    >
                      <option value="">Select Expertise Level</option>
                      <option value="BEGINNER">Beginner</option>
                      <option value="INTERMEDIATE">Intermediate</option>
                      <option value="EXPERT">Expert</option>
                    </select>
                    <button type="button" onClick={() => removeItem('skills', index)} className="text-red-500">Remove</button>
                  </div>
                ))}
                <button type="button" onClick={() => addItem('skills')} className="text-blue-500">Add Skill</button>
              </div>

              {/* Social Profiles */}
              <div>
                <h3 className="text-xl font-semibold mb-3">Social Profiles</h3>
                {formData.socialProfiles.map((profile, index) => (
                  <div key={index} className="mb-4">
                    <select
                      name="platform"
                      value={profile.platform || ''}
                      onChange={(e) => handleChange(e, 'socialProfiles', index)}
                      className="w-full px-3 py-2 border rounded mb-2"
                    >
                      <option value="">Select Platform</option>
                      <option value="GITHUB">GitHub</option>
                      <option value="LINKEDIN">LinkedIn</option>
                      <option value="TWITTER">Twitter</option>
                      <option value="PORTFOLIO">Portfolio</option>
                      <option value="OTHER">Other</option>
                    </select>
                    <input
                      type="url"
                      name="url"
                      value={profile.url || ''}
                      onChange={(e) => handleChange(e, 'socialProfiles', index)}
                      placeholder="Profile URL"
                      className="w-full px-3 py-2 border rounded mb-2"
                    />
                    <button type="button" onClick={() => removeItem('socialProfiles', index)} className="text-red-500">Remove</button>
                  </div>
                ))}
                <button type="button" onClick={() => addItem('socialProfiles')} className="text-blue-500">Add Social Profile</button>
              </div>

              <div className="flex justify-end mt-6">
                <button 
                  type="submit"
                  className="px-6 py-2.5 rounded-full text-sm font-medium bg-black text-white hover:bg-gray-900"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;


