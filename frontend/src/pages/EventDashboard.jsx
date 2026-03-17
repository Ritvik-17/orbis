import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Legend } from "recharts";

const AttendanceSection = ({ applications, id, getAccessToken }) => {
    const acceptedApps = applications.filter(app => app.status === 'ACCEPTED');
    const [attendanceMap, setAttendanceMap] = useState(() => {
        const map = {};
        acceptedApps.forEach(app => { map[app.id] = app.attendance || false; });
        return map;
    });
    const [search, setSearch] = useState('');
    const [loadingId, setLoadingId] = useState(null);

    const presentCount = Object.values(attendanceMap).filter(Boolean).length;
    const total = acceptedApps.length;
    const percentage = total ? Math.round((presentCount / total) * 100) : 0;

    const filtered = acceptedApps.filter(app =>
        app.userId.toLowerCase().includes(search.toLowerCase())
    );

    const handleToggle = async (app) => {
        const newVal = !attendanceMap[app.id];
        setAttendanceMap(prev => ({ ...prev, [app.id]: newVal }));
        setLoadingId(app.id);
        try {
            const token = await getAccessToken();
            await axios.patch(
                `${import.meta.env.VITE_API_URL}/api/events/${id}/attendance`,
                { applicationId: Number(app.id), attendance: newVal },
                {
                    headers: { Authorization: `Bearer ${token}` },
                    withCredentials: true
                }
            );
        } catch (err) {
            console.error('Failed to update attendance', err);
            setAttendanceMap(prev => ({ ...prev, [app.id]: !newVal }));
        } finally {
            setLoadingId(null);
        }
    };

    const pieData = [
        { name: 'Present', value: presentCount },
        { name: 'Absent', value: total - presentCount },
    ];
    const PIE_COLORS = ['#34D399', '#E5E7EB'];

    return (
        <div className="p-4 sm:p-8 bg-white shadow-lg rounded-lg">
            <div className="flex flex-col xl:flex-row gap-8">

                {/* Table */}
                <div className="flex-1 min-w-0">
                    <input
                        type="text"
                        placeholder="Search by User ID..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="mb-4 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                    />
                    <div className="overflow-x-auto shadow-lg rounded-lg">
                        <table className="w-full border-collapse bg-white shadow-md rounded-lg min-w-[500px]">
                            <thead>
                                <tr className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left font-semibold text-sm">User ID</th>
                                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left font-semibold text-sm">Name</th>
                                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left font-semibold text-sm">Username</th>
                                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-center font-semibold text-sm">Attendance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length ? filtered.map(app => (
                                    <tr key={app.id} className="border-b hover:bg-gray-100 even:bg-gray-50 transition duration-200">
                                        <td className="px-4 sm:px-6 py-3 sm:py-4 text-gray-500 text-xs font-mono truncate max-w-[120px]">{app.userId}</td>
                                        <td className="px-4 sm:px-6 py-3 sm:py-4 text-gray-800 text-sm">
                                            {app.userData.firstName} {app.userData.lastName}
                                        </td>
                                        <td className="px-4 sm:px-6 py-3 sm:py-4 text-gray-700 text-sm">
                                            @{app.user?.username || '—'}
                                        </td>
                                        <td className="px-4 sm:px-6 py-3 sm:py-4 text-center">
                                            {loadingId === app.id ? (
                                                <div className="inline-block w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <input
                                                    type="checkbox"
                                                    checked={attendanceMap[app.id] || false}
                                                    onChange={() => handleToggle(app)}
                                                    className="w-5 h-5 accent-indigo-600 cursor-pointer"
                                                />
                                            )}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="text-center py-8 text-gray-400 text-sm">
                                            No participants found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pie Chart */}
                <div className="w-full xl:w-64 flex flex-col items-center justify-start bg-gray-100 rounded-lg p-6 shadow-md">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Attendance</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={55}
                                outerRadius={80}
                                dataKey="value"
                                startAngle={90}
                                endAngle={-270}
                            >
                                {pieData.map((_, index) => (
                                    <Cell key={index} fill={PIE_COLORS[index]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="text-center mt-2">
                        <p className="text-4xl font-bold text-indigo-600">{percentage}%</p>
                        <p className="text-gray-500 text-sm mt-1">{presentCount} of {total} present</p>
                    </div>
                    <div className="flex gap-4 mt-4">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-400" />
                            <span className="text-sm text-gray-600">Present</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-gray-200 border border-gray-300" />
                            <span className="text-sm text-gray-600">Absent</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};


const EventDashboard = () => {

    const { id } = useParams();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user, getAccessToken } = useAuth();
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('overview');
    const [acceptedApps, setAcceptedApps] = useState([]);

    useEffect(() => {
        fetchEvent();
    }, [id]);

    const fetchEvent = async () => {
        try {
            setLoading(true);
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/events/${id}`,
                { withCredentials: true }
            );
            const eventResponse = response.data;
            setEvent(eventResponse);
            setAcceptedApps(eventResponse.applications.filter((app) => app.status === 'ACCEPTED'));
        } catch (err) {
            console.error('Error fetching event:', err);
            setError('Failed to load event details');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                    {error}
                </div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center text-gray-600">Event not found</div>
            </div>
        );
    }

    const handleSectionChange = (section) => {
        setActiveSection(section);
    };


    const ApplicationsTable = ({ applications }) => {
        const [selectedApp, setSelectedApp] = useState(null);

        const handleAccept = async () => {
            const token = await getAccessToken();
            await axios.put(
                `${import.meta.env.VITE_API_URL}/api/events/${id}/application`,
                { ...selectedApp, status: "ACCEPTED" },
                {
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                    withCredentials: true
                }
            );
            selectedApp.status = 'ACCEPTED';
            setAcceptedApps([...acceptedApps, selectedApp]);
            setSelectedApp(null);
        };

        const handleReject = async () => {
            const token = await getAccessToken();
            await axios.put(
                `${import.meta.env.VITE_API_URL}/api/events/${id}/application`,
                { ...selectedApp, status: "REJECTED" },
                {
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                    withCredentials: true
                }
            );
            selectedApp.status = 'REJECTED';
            setSelectedApp(null);
        };

        return (
            <div className="overflow-x-auto shadow-lg rounded-lg">
                <table className="w-full border-collapse bg-white shadow-md rounded-lg min-w-[500px]">
                    <thead>
                        <tr className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                            <th className="px-4 sm:px-6 py-3 sm:py-4 text-left font-semibold text-sm">Applicant Name</th>
                            <th className="px-4 sm:px-6 py-3 sm:py-4 text-left font-semibold text-sm">Team</th>
                            <th className="px-4 sm:px-6 py-3 sm:py-4 text-left font-semibold text-sm">Date</th>
                            <th className="px-4 sm:px-6 py-3 sm:py-4 text-left font-semibold text-sm">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {applications.map((app) => (
                            <tr
                                key={app.id}
                                className="border-b hover:bg-gray-100 even:bg-gray-50 cursor-pointer transition duration-200"
                                onClick={() => setSelectedApp(app)}
                            >
                                <td className="px-4 sm:px-6 py-3 sm:py-4 text-gray-800 text-sm">
                                    {app.userData.firstName + " " + app.userData.lastName}
                                </td>
                                <td className="px-4 sm:px-6 py-3 sm:py-4 text-gray-700 text-sm">{app.team ? app.team.name : "N/A"}</td>
                                <td className="px-4 sm:px-6 py-3 sm:py-4 text-gray-600 text-sm">
                                    {new Date(app.createdAt).toLocaleDateString()}
                                </td>
                                <td className={`px-4 sm:px-6 py-3 sm:py-4 font-medium text-sm ${
                                    app.status === "ACCEPTED" ? "text-green-600"
                                    : app.status === "PENDING" ? "text-yellow-600"
                                    : "text-red-600"
                                }`}>
                                    {app.status}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Modal */}
                {selectedApp && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-md z-50 p-4">
                        <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl relative p-6 sm:p-8">
                            <button
                                className="absolute top-4 left-4 text-gray-600 hover:text-gray-900 transition"
                                onClick={() => setSelectedApp(null)}
                            >
                                <ArrowLeft size={24} />
                            </button>

                            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-6 text-center">
                                Application Details
                            </h2>

                            <div className="space-y-3 sm:space-y-4">
                                <p className="text-sm sm:text-base">
                                    <span className="font-semibold text-gray-700">Name:</span>{" "}
                                    {selectedApp.userData.firstName} {selectedApp.userData.lastName}
                                </p>
                                <p className="text-sm sm:text-base">
                                    <span className="font-semibold text-gray-700">Team:</span>{" "}
                                    {selectedApp.team ? selectedApp.team.name : "N/A"}
                                </p>
                                <p className="text-sm sm:text-base">
                                    <span className="font-semibold text-gray-700">Date Applied:</span>{" "}
                                    {new Date(selectedApp.createdAt).toLocaleDateString()}
                                </p>
                                <p className="text-sm sm:text-base">
                                    <span className="font-semibold text-gray-700">Status:</span>{" "}
                                    <span className={`font-semibold ${
                                        selectedApp.status === "ACCEPTED" ? "text-green-600"
                                        : selectedApp.status === "PENDING" ? "text-yellow-600"
                                        : "text-red-600"
                                    }`}>
                                        {selectedApp.status}
                                    </span>
                                </p>
                            </div>

                            <div className="mt-6 sm:mt-8 flex justify-center gap-4 sm:gap-6">
                                <button
                                    className="bg-green-500 hover:bg-green-600 text-white font-semibold px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg shadow-md text-sm sm:text-base transition"
                                    onClick={handleAccept}
                                >
                                    Accept
                                </button>
                                <button
                                    className="bg-red-500 hover:bg-red-600 text-white font-semibold px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg shadow-md text-sm sm:text-base transition"
                                    onClick={handleReject}
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };


    const AcceptedTable = ({ applications }) => (
        <div className="overflow-x-auto shadow-lg rounded-lg">
            <table className="w-full border-collapse bg-white shadow-md rounded-lg min-w-[400px]">
                <thead>
                    <tr className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                        <th className="px-4 sm:px-6 py-3 sm:py-4 text-left font-semibold text-sm">Participant Name</th>
                        <th className="px-4 sm:px-6 py-3 sm:py-4 text-left font-semibold text-sm">Team</th>
                        <th className="px-4 sm:px-6 py-3 sm:py-4 text-left font-semibold text-sm">Date</th>
                    </tr>
                </thead>
                <tbody>
                    {applications.map((app) => (
                        <tr key={app.id} className="border-b hover:bg-gray-100 even:bg-gray-50 transition duration-200">
                            <td className="px-4 sm:px-6 py-3 sm:py-4 text-gray-800 text-sm">
                                {app.userData.firstName + " " + app.userData.lastName}
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4 text-gray-700 text-sm">{app.team ? app.team.name : "N/A"}</td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4 text-gray-600 text-sm">
                                {new Date(app.createdAt).toLocaleDateString()}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );


    const OverviewSection = ({ applications }) => {
        const totalApplications = applications.length;
        const accepted = applications.filter((app) => app.status === "ACCEPTED").length;
        const rejected = applications.filter((app) => app.status === "REJECTED").length;
        const pending = applications.filter((app) => app.status === "PENDING").length;

        const statusData = [
            { name: "Accepted", value: accepted },
            { name: "Rejected", value: rejected },
            { name: "Pending", value: pending },
        ];
        const COLORS = ["#34D399", "#EF4444", "#FACC15"];

        const applicationsOverTime = applications.reduce((acc, app) => {
            const date = new Date(app.createdAt).toLocaleDateString();
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {});
        const lineChartData = Object.entries(applicationsOverTime).map(([date, count]) => ({ date, count }));

        const teamData = applications.reduce((acc, app) => {
            const teamName = app.team ? app.team.name : "No Team";
            acc[teamName] = (acc[teamName] || 0) + 1;
            return acc;
        }, {});
        const barChartData = Object.entries(teamData).map(([team, count]) => ({ team, count }));

        return (
            <div className="p-4 sm:p-8 bg-white shadow-lg rounded-lg">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                    <div className="bg-gray-100 p-5 sm:p-6 rounded-lg text-center shadow-md">
                        <h3 className="text-sm sm:text-base font-semibold text-gray-700">Total Applications</h3>
                        <p className="text-2xl sm:text-3xl font-bold text-gray-900">{totalApplications}</p>
                    </div>
                    <div className="bg-green-100 p-5 sm:p-6 rounded-lg text-center shadow-md">
                        <h3 className="text-sm sm:text-base font-semibold text-green-700">Accepted</h3>
                        <p className="text-2xl sm:text-3xl font-bold text-green-600">{accepted}</p>
                    </div>
                    <div className="bg-red-100 p-5 sm:p-6 rounded-lg text-center shadow-md">
                        <h3 className="text-sm sm:text-base font-semibold text-red-700">Rejected</h3>
                        <p className="text-2xl sm:text-3xl font-bold text-red-600">{rejected}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                    <div className="bg-white p-4 sm:p-6 shadow-md rounded-lg">
                        <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-4">Application Status Breakdown</h3>
                        <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                                <Pie data={statusData} cx="50%" cy="50%" outerRadius={90} fill="#8884d8" dataKey="value" label>
                                    {statusData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="bg-white p-4 sm:p-6 shadow-md rounded-lg">
                        <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-4">Applications Over Time</h3>
                        <ResponsiveContainer width="100%" height={260}>
                            <LineChart data={lineChartData}>
                                <XAxis dataKey="date" stroke="#555" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="count" stroke="#4F46E5" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-4 sm:p-6 shadow-md rounded-lg mt-6 sm:mt-8">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-4">Applicants by Team</h3>
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={barChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="team" stroke="#555" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="count" fill="#6366F1" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        );
    };


    return (
        <>
<<<<<<< HEAD
            <div className="max-w-7xl mx-auto py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
=======
            <div className="max-w-7xl mx-auto pt-32 pb-16 px-4 sm:px-6 lg:px-8">
>>>>>>> community-module
                <div className="text-center">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900">{event.name}</h1>
                    <p className="mt-3 max-w-2xl mx-auto text-base sm:text-xl text-gray-500 sm:mt-4">{event.tagline}</p>
                </div>

<<<<<<< HEAD
                {/* Nav tabs — scrollable on mobile */}
                <div className="sticky top-16 bg-white py-3 sm:py-4 mt-6 sm:mt-8 z-10">
                    <nav className="flex justify-center">
                        <div className="flex space-x-2 sm:space-x-4 overflow-x-auto pb-1 px-2 scrollbar-hide">
                            {['overview', 'review', 'admin', 'attendance'].map(section => (
                                <button
                                    key={section}
                                    className={`px-3 sm:px-4 py-2 rounded-lg transition whitespace-nowrap text-sm sm:text-base capitalize flex-shrink-0 ${
                                        activeSection === section
                                            ? 'bg-black text-white'
                                            : 'bg-gray-200 text-black hover:bg-blue-200 hover:text-gray-800'
                                    }`}
                                    onClick={() => handleSectionChange(section)}
                                >
                                    {section.charAt(0).toUpperCase() + section.slice(1)}
                                </button>
                            ))}
                        </div>
=======
                <div className="sticky top-24 z-10 bg-white/80 backdrop-blur-sm px-6 py-4 mt-8 flex justify-center items-center space-x-4 w-auto">
                    <nav className="flex space-x-4">
                        <button
                            className={`px-4 py-2 rounded-lg transition ${
                            activeSection === 'overview'
                                ? 'bg-black text-white'
                                : 'bg-gray-200 text-black hover:bg-blue-200 hover:text-gray-800'
                            }`}
                            onClick={() => handleSectionChange('overview')}
                        >
                            Overview
                        </button>
                        <button
                            className={`px-4 py-2 rounded-lg transition ${
                            activeSection === 'review'
                                ? 'bg-black text-white'
                                : 'bg-gray-200 text-black hover:bg-blue-200 hover:text-gray-800'
                            }`}
                            onClick={() => handleSectionChange('review')}
                        >
                            Review
                        </button>
                        <button
                            className={`px-4 py-2 rounded-lg transition ${
                            activeSection === 'admin'
                                ? 'bg-black text-white'
                                : 'bg-gray-200 text-black hover:bg-blue-200 hover:text-gray-800'
                            }`}
                            onClick={() => handleSectionChange('admin')}
                        >
                            Admin
                        </button>
>>>>>>> community-module
                    </nav>
                </div>

                {/* Sections */}
                {activeSection === 'overview' && (
                    <div>
                        {event.applications.length
                            ? <OverviewSection applications={event.applications} />
                            : <p className="text-center text-gray-500 py-12">There's nothing to visualise :/</p>
                        }
                    </div>
                )}

                {activeSection === 'review' && (
                    <div>
                        {event.applications.length ? (
                            <div>
                                <div className="mb-4 font-semibold text-base sm:text-lg">
                                    Number of Applications: {event.applications.length}
                                </div>
                                <ApplicationsTable applications={event.applications} />
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 py-12">Applications not found!</p>
                        )}
                    </div>
                )}

                {activeSection === 'admin' && (
                    <div>
                        {acceptedApps.length ? (
                            <div>
                                <div className="mb-4 font-semibold text-base sm:text-lg">
                                    Number of Participants: {acceptedApps.length}
                                </div>
                                <AcceptedTable applications={acceptedApps} />
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 py-12">Go Accept Some Applicants!</p>
                        )}
                    </div>
                )}

                {activeSection === 'attendance' && (
                    <div>
                        {event.applications.filter(a => a.status === 'ACCEPTED').length ? (
                            <div>
                                <div className="mb-4 font-semibold text-base sm:text-lg">
                                    Number of Participants: {event.applications.filter(a => a.status === 'ACCEPTED').length}
                                </div>
                                <AttendanceSection
                                    applications={event.applications}
                                    id={id}
                                    getAccessToken={getAccessToken}
                                />
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 py-12">No accepted participants yet!</p>
                        )}
                    </div>
                )}

            </div>
        </>
    );
};

export default EventDashboard;