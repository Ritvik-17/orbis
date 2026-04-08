import { useNavigate } from "react-router-dom";
import { supabase } from "../../helpers/supabase";
import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

const Forms = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [forms, setForms] = useState([]);

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    // Fetch form
    const { data: formdata, error } = await supabase.from("forms").select("*");

    if (error) {
      console.error("Error fetching forms:", error.message);
    }
    // Prevent setting to null to avoid `.map` crashes
    setForms(formdata || []);
  };
  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "1200px",
        margin: "0 auto",
        paddingTop: "60px",
      }}
    >
      <h1 style={{ marginBottom: "24px" }}>All Available Forms</h1>

      {/* Grid Layout for Forms */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "20px",
        }}
      >
        {forms?.map((form) => (
          <div
            key={form.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: "12px",
              padding: "20px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <h2 style={{ margin: "0 0 10px 0", fontSize: "1.25rem" }}>
                {form.title}
              </h2>
              <div className="flex items-" >
                <p
                  style={{
                    color: "#666",
                    fontSize: "0.9rem",
                    display: "inline",
                  }}
                >
                  {form.description}
                </p>
                <p
                  style={{
                    color: "#666",
                    fontSize: "0.9rem",
                    display: "inline",
                  }}
                >
                  {new Date(form.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
              {/* User Side Button: Fill Form */}
              {form.created_by !== (user?.auth0Id || user?.sub || user?.id) && (
                <button
                  onClick={() => navigate(`/forms/${form.id}`)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    backgroundColor: "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  Fill Form
                </button>
              )}

              {/* Admin Side Button: Check Responses */}
              {form.created_by === (user?.auth0Id || user?.sub || user?.id) && (
                <button
                  onClick={() => navigate(`/responses/${form.id}`)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    backgroundColor: "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  Check Responses
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Forms;
