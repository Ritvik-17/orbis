import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ClubCard = ({ club, onClick }) => (
  <div
    className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer"
    onClick={() => onClick(club)}
  >
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-2">{club.name}</h2>
      <p className="text-gray-600 mb-2">{club.description || 'No description provided.'}</p>
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">View Projects →</span>
      </div>
    </div>
  </div>
);

const ParallaxColumn = ({ clubs, speed, onClick }) => {
  const colRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!colRef.current) return;
      colRef.current.style.transform = `translateY(${window.scrollY * speed}px)`;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return (
    <div ref={colRef} className="flex flex-col gap-4 will-change-transform">
      {clubs.map(club => (
        <ClubCard key={club.id} club={club} onClick={onClick} />
      ))}
    </div>
  );
};

const ProjectShowcase = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
    
    axios.get(`${apiUrl}/api/clubs`)
      .then(res => {
        if (Array.isArray(res.data)) {
          setClubs(res.data);
        } else {
          setClubs([]);
        }
      })
      .catch(err => {
        console.error('Error fetching clubs:', err);
        setClubs([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const col1 = clubs.filter((_, i) => i % 3 === 0);
  const col2 = clubs.filter((_, i) => i % 3 === 1);
  const col3 = clubs.filter((_, i) => i % 3 === 2);

  const handleClubClick = (club) => {
    navigate(`/projects/${club.id}`, { state: { club } });
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(0,0,0,0.03) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />
        <div className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(0,0,0,0.07) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(0,0,0,0.07) 1px, transparent 1px)
            `,
            backgroundSize: '200px 200px',
          }}
        />
        <div className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at 50% 50%, transparent 0%, rgba(255,255,255,0.7) 100%)',
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10 text-center">
        <h1 className="text-3xl sm:text-5xl font-normal text-gray-900 mb-4 leading-tight tracking-tight">
          Built by Students.
        </h1>
        <p className="text-base sm:text-xl text-gray-500 font-light max-w-xl mx-auto">
          Explore projects built by clubs across campus
        </p>
      </div>

      <div className="relative z-10 border-t border-gray-100 mb-10" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="animate-spin rounded-full h-8 w-8 border-t border-b border-gray-400" />
          </div>
        ) : clubs.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-gray-400 font-light text-sm">No clubs found yet.</p>
          </div>
        ) : (
          <>
            {isMobile && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {clubs.map(club => (
                  <ClubCard key={club.id} club={club} onClick={handleClubClick} />
                ))}
              </div>
            )}

            {!isMobile && (
              <div
                className="grid grid-cols-3 gap-4"
                style={{ height: '860px', overflow: 'hidden' }}
              >
                <ParallaxColumn clubs={col1} speed={-0.5} onClick={handleClubClick} />
                <ParallaxColumn clubs={col2} speed={-0.1} onClick={handleClubClick} />
                <ParallaxColumn clubs={col3} speed={-0.6} onClick={handleClubClick} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProjectShowcase;