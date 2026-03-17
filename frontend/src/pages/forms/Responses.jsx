import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../helpers/supabase";

export default function Responses() {
  const { formId } = useParams();
  // State to toggle between views
  const [viewMode, setViewMode] = useState("INDIVIDUAL"); // 'INDIVIDUAL' or 'SUMMARY'
  const [questions, setQuestions] = useState([]);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: questionData } = await supabase
      .from("questions")
      .select("*")
      .eq("form_id", formId);

    const { data: submissionData } = await supabase
      .from("submissions")
      .select("*")
      .eq("form_id", formId);
    const submissionIds = submissionData.map((item) => item.id);

    const { data: responseData } = await supabase
      .from("responses")
      .select("*")
      .in("submission_id", submissionIds);

    setQuestions(questionData);
    setResponses(responseData);
    setLoading(false);
  };

  // Group responses by submission_id using useMemo so it only calculates when responses change

  const groupedSubmissions = useMemo(() => {
    if (!responses) return {};

    return responses.reduce((acc, curr) => {
      // Assuming your response object has a 'submission_id' field
      const subId = curr.submission_id || "Unknown Submission";
      if (!acc[subId]) {
        acc[subId] = [];
      }
      acc[subId].push(curr);
      return acc;
    }, {});
  }, [responses]);


  if (loading) return <p>Loading...</p>;



  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 md:p-10 bg-white shadow-xl rounded-2xl border border-gray-100">
      {/* Page Header & View Toggle */}
      <div className="mb-8 border-b border-gray-200 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Responses Overview
          </h2>
          <p className="text-gray-500 mt-2">
            Reviewing {Object.keys(groupedSubmissions).length} total submissions.
          </p>
        </div>

        {/* View Toggles */}
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode("INDIVIDUAL")}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${viewMode === "INDIVIDUAL"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
              }`}
          >
            Individual
          </button>
          <button
            onClick={() => setViewMode("SUMMARY")}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${viewMode === "SUMMARY"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
              }`}
          >
            Summary by Question
          </button>
        </div>
      </div>

      {/* --- VIEW 1: INDIVIDUAL SUBMISSIONS --- */}
      {viewMode === "INDIVIDUAL" && (
        <div className="space-y-4">
          {Object.keys(groupedSubmissions).length === 0 ? (
            <div className="text-center text-gray-400 italic py-8 bg-gray-50 rounded-xl border border-gray-200">
              No submissions recorded yet.
            </div>
          ) : (
            Object.entries(groupedSubmissions).map(([subId, subResponses], index) => (
              <details
                key={subId}
                className="group p-6 bg-gray-50 border border-gray-200 rounded-xl transition-all open:bg-white open:shadow-md"
              >
                <summary className="flex items-center justify-between cursor-pointer focus:outline-none">
                  <span className="text-lg font-bold text-gray-800">
                    Submission #{index + 1}
                    <span className="ml-2 text-xs text-gray-400 font-normal hidden md:inline">
                      (ID: {subId})
                    </span>
                  </span>
                  <span className="text-indigo-600 group-open:rotate-180 transition-transform duration-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </summary>

                {/* Expanded Content */}
                <div className="mt-6 space-y-6 border-t border-gray-100 pt-6">
                  {questions.map((q) => {
                    // Find the user's answer for this specific question
                    const answerObj = subResponses.find((r) => r.question_id === q.id);

                    // Handle array answers safely (like checkboxes)
                    const displayAnswer = answerObj
                      ? (Array.isArray(answerObj.answer) ? answerObj.answer.join(", ") : String(answerObj.answer))
                      : <span className="text-gray-400 italic">No answer provided</span>;

                    return (
                      <div key={q.id}>
                        <h5 className="text-sm font-semibold text-gray-600 mb-1">
                          {q.question_text}
                        </h5>
                        <p className="text-gray-900 bg-gray-50 p-3 rounded-md border border-gray-100">
                          {displayAnswer}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </details>
            ))
          )}
        </div>
      )}

      {/* --- VIEW 2: SUMMARY BY QUESTION --- */}
      {viewMode === "SUMMARY" && (
        <div className="space-y-8">
          {questions.map((q) => {
            // Get all responses for this specific question
            const questionResponses = responses?.filter((r) => r.question_id === q.id) || [];

            // Determine if this is a choice-based question or open-ended text
            const isChoiceType = ["MCQ", "CHECKBOX", "DROPDOWN", "RATING"].includes(q.question_type);

            return (
              <div key={q.id} className="p-6 bg-gray-50 border border-gray-200 rounded-xl">
                {/* Header Area */}
                <div className="mb-4 pb-2 border-b border-gray-300 flex justify-between items-end">
                  <h4 className="text-xl font-bold text-gray-800 break-words w-3/4">
                    {q.question_text || "Untitled Question"}
                  </h4>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider bg-white px-2 py-1 rounded-md border border-gray-200">
                    {questionResponses.length} Responses
                  </span>
                </div>

                {/* Body Area: Check if we have answers first */}
                {questionResponses.length === 0 ? (
                  <div className="text-gray-400 italic py-2">
                    No responses recorded yet.
                  </div>
                ) : isChoiceType ? (

                  // ==========================================
                  // LOGIC FOR CHOICE TYPES (Aggregated Counts)
                  // ==========================================
                  <div className="space-y-3">
                    {(() => {
                      // 1. Initialize our counter object
                      const counts = {};

                      // Pre-fill zeros so even unselected options show up in the stats
                      if (q.question_type === "RATING") {
                        [5, 4, 3, 2, 1].forEach(star => counts[star] = 0); // Reverse order for ratings
                      } else if (q.options) {
                        q.options.forEach(opt => counts[opt] = 0);
                      }

                      // 2. Tally the actual responses
                      questionResponses.forEach(r => {
                        if (Array.isArray(r.answer)) {
                          // Checkboxes (Loop through the array of selections)
                          r.answer.forEach(val => {
                            counts[val] = (counts[val] || 0) + 1;
                          });
                        } else if (r.answer !== null && r.answer !== undefined) {
                          // MCQ, Dropdown, Rating (Single string/number)
                          counts[r.answer] = (counts[r.answer] || 0) + 1;
                        }
                      });

                      // 3. Render the counts as visual bars
                      const totalRespondents = questionResponses.length;

                      return Object.entries(counts).map(([option, count], idx) => {
                        // Calculate percentage based on total users who answered THIS question
                        const percentage = totalRespondents > 0
                          ? Math.round((count / totalRespondents) * 100)
                          : 0;

                        return (
                          <div key={idx} className="relative w-full bg-white border border-gray-200 rounded-lg p-3 overflow-hidden z-0 shadow-sm">
                            {/* Background Visual Percentage Bar */}
                            <div
                              className="absolute top-0 left-0 h-full bg-indigo-100 -z-10 transition-all duration-500 ease-out"
                              style={{ width: `${percentage}%` }}
                            />

                            {/* Text Content */}
                            <div className="flex justify-between items-center text-sm">
                              <span className="font-medium text-gray-800">
                                {q.question_type === "RATING" ? `${option} Stars` : option}
                              </span>
                              <span className="text-gray-700 font-semibold">
                                {count} <span className="text-xs font-normal text-gray-400 ml-1">({percentage}%)</span>
                              </span>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>

                ) : (

                  // ==========================================
                  // LOGIC FOR TEXT TYPES (List View)
                  // ==========================================
                  <ul className="space-y-3 max-h-64 overflow-y-auto pr-2">
                    {questionResponses.map((r, rIndex) => (
                      <li
                        key={r.id}
                        className={`pl-4 py-3 border-l-4 rounded-r-md border-indigo-400 text-gray-700 shadow-sm text-sm ${rIndex % 2 === 0 ? "bg-white" : "bg-gray-100"
                          }`}
                      >
                        {String(r.answer)}
                      </li>
                    ))}
                  </ul>

                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  )

}
