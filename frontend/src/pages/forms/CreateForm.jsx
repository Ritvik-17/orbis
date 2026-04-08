import { useState } from "react";
import { supabase } from "../../helpers/supabase";
import { useAuth } from "../../contexts/AuthContext";

export default function CreateForm() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState([
    { question_text: "", question_type: "TEXT", is_required: false },
  ]);

  const [shareLink, setShareLink] = useState(null);
  const [copied, setCopied] = useState(false);

  const [loading, setLoading] = useState(false);

  const addQuestion = () => {
    setQuestions([...questions, { question_text: "", question_type: "TEXT" }]);
  };

  const handleQuestionChange = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const removeQuestion = (index) => {
    if (questions.length > 1) {
      const updated = [...questions];
      updated.splice(index, 1);
      setQuestions(updated);
    } else {
      alert("You must have at least one question in the form.");
    }
  };

  const handleSubmit = async () => {
    if (!title) {
      alert("Title required");
      return;
    }

    setLoading(true);

    // 1️⃣ Insert form
    const createdBy = user?.auth0Id || user?.sub || user?.id || null;
    const { data: formData, error: formError } = await supabase
      .from("forms")
      .insert([{ title, description, created_by: createdBy }])
      .select();

    if (formError) {
      console.error(formError);
      alert("Error creating form");
      setLoading(false);
      return;
    }

    const formId = formData[0].id;

    // 2️⃣ Insert questions
    const formattedQuestions = questions.map((q) => ({
      form_id: formId,
      question_text: q.question_text,
      question_type: q.question_type,
      options:
        q.question_type === "MCQ" ||
          q.question_type === "CHECKBOX" ||
          q.question_type === "DROPDOWN"
          ? q.options
          : null,
      is_required: q.is_required,
    }));

    const { error: questionError } = await supabase
      .from("questions")
      .insert(formattedQuestions);

    if (questionError) {
      console.error(questionError);
      alert("Error saving questions");
    } else {
      alert("Form created successfully!");
      setTitle("");
      setDescription("");
      setQuestions([{ question_text: "", question_type: "TEXT" }]);
    }

    //creating shareable linkk
    const url = `${window.location.origin}/forms/${formId}`;
    setShareLink(url);
    setLoading(false);
  };

  const handleCopyLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    }
  };

  const handleSetOptionCount = (qIndex, targetCount) => {
    setQuestions((prevQuestions) => {
      const newQuestions = [...prevQuestions];
      const currentOptions = [...(newQuestions[qIndex].options || [])];
      const currentCount = currentOptions.length;

      if (targetCount > currentCount) {
        // Add empty strings for the difference
        const additions = Array(targetCount - currentCount).fill("");
        newQuestions[qIndex].options = [...currentOptions, ...additions];
      } else if (targetCount < currentCount) {
        // Remove from the end
        newQuestions[qIndex].options = currentOptions.slice(0, targetCount);
      }

      return newQuestions;
    });
  };

  // 1. Add a new empty option to a specific question
  const addOption = (qIndex) => {
    const updatedQuestions = [...questions]; // Copy the main array

    // Safety check: if options array doesn't exist yet, create it
    if (!updatedQuestions[qIndex].options) {
      updatedQuestions[qIndex].options = [];
    }

    // Add a blank string for the new option
    updatedQuestions[qIndex].options.push("");
    setQuestions(updatedQuestions);
  };

  // 2. Update the text of a specific option
  const handleOptionChange = (qIndex, optIndex, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[qIndex].options[optIndex] = value;
    setQuestions(updatedQuestions);
  };

  // 3. Remove an option
  const removeOption = (qIndex, optIndex) => {
    const updatedQuestions = [...questions];
    updatedQuestions[qIndex].options.splice(optIndex, 1); // Remove 1 item at optIndex
    setQuestions(updatedQuestions);
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 md:p-10 bg-white shadow-xl rounded-2xl border border-gray-100">
      {shareLink ? (
        //  --- SUCCESS SCREEN ---
        <div className="text-center py-10">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
            Form Created Successfully!
          </h2>
          <p className="text-gray-500 mb-8">
            Your form is live and ready to accept responses.
          </p>

          <div className="max-w-lg mx-auto bg-gray-50 p-4 rounded-xl border border-gray-200 flex items-center gap-3">
            <input
              type="text"
              readOnly
              value={shareLink}
              className="flex-grow bg-transparent text-gray-700 outline-none truncate"
            />
            <button
              onClick={handleCopyLink}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                copied
                  ? "bg-green-500 text-white"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                }`}
            >
              {copied ? "Copied!" : "Copy Link"}
            </button>
          </div>

          <div className="mt-8 flex justify-center gap-4">
            <button
              onClick={() => window.open(shareLink, "_blank")}
              className="text-indigo-600 font-semibold hover:text-indigo-800 transition-colors"
            >
              Preview Form ↗
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={() => {
                // Reset state to build another form
                setShareLink(null);
                setTitle("");
                setDescription("");
                // reset questions too...
              }}
              className="text-gray-600 font-semibold hover:text-gray-800 transition-colors"
            >
              Create Another Form
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* --- Form Details Section --- */}
          <div className="mb-8 border-b border-gray-200 pb-8">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-6">
              Create New Form
            </h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Form Title (e.g., Incident '26 Merch Drop)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 text-lg font-semibold rounded-lg border border-gray-300 text-gray-900 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              <textarea
                placeholder="Form Description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
              />
            </div>
          </div>

          {/* --- Questions Builder Section --- */}
          <div className="space-y-6 mb-8">
            <h3 className="text-xl font-bold text-gray-800">Questions</h3>

            {questions.map((q, qIndex) => (
              <div
                key={qIndex}
                className="p-6 bg-gray-50 border border-gray-200 rounded-xl relative group transition-all hover:shadow-md"
              >
                {/* Individual Question Card */}

                <div className="flex flex-col md:flex-row gap-4 mb-4">
                  {/* Question Text Input */}
                  <input
                    type="text"
                    placeholder="Question text..."
                    value={q.question_text}
                    onChange={(e) =>
                      handleQuestionChange(
                        qIndex,
                        "question_text",
                        e.target.value,
                      )
                    }
                    className="flex-grow px-4 py-3 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />

                  {/* Question Type Selector */}
                  <select
                    value={q.question_type}
                    onChange={(e) =>
                      handleQuestionChange(
                        qIndex,
                        "question_type",
                        e.target.value,
                      )
                    }
                    className="md:w-48 px-4 py-3 rounded-lg border border-gray-300 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="TEXT">Short Answer</option>
                    <option value="LONG_TEXT">Paragraph (Long Answer)</option>
                    <option value="MCQ">Multiple Choice (Radio)</option>
                    <option value="CHECKBOX">Checkboxes</option>
                    <option value="DROPDOWN">Dropdown Menu</option>
                    <option value="RATING">Star Rating</option>
                  </select>

                  {/* IS_REQUIRED & DELETE */}
                  <div className="flex items-center justify-between md:justify-end gap-2 mt-2 md:mt-0">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={q.is_required}
                        onChange={(e) =>
                          handleQuestionChange(
                            qIndex,
                            "is_required",
                            e.target.checked,
                          )
                        }
                      />
                      <span className="text-sm font-medium text-gray-600">
                        Required
                      </span>
                    </label>

                    <div className="w-px h-6 bg-gray-300 hidden md:block mx-1"></div>

                    <button
                      onClick={() => removeQuestion(qIndex)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete Question"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>

                </div>

                {/* --- Dynamic Options Builder --- */}

                {/* 1. Types that require Options (MCQ, Checkbox, Dropdown) */}
                {(q.question_type === "MCQ" ||
                  q.question_type === "CHECKBOX" ||
                  q.question_type === "DROPDOWN") && (
                    <div className="mt-4 pl-4 border-l-4 border-indigo-200 space-y-3">
                      <label className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
                        {q.question_type} Options
                      </label>
                      {/* Option Count Selector */}
                      <div className="flex items-center gap-4 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <label className="text-xs font-bold text-gray-500 uppercase">
                          Number of Choices:
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="20" // Optional limit to prevent UI breaking
                          value={q.options?.length || 0}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            handleSetOptionCount(qIndex, val);
                          }}
                          className="w-20 px-2 py-1 rounded border border-indigo-200 focus:ring-2 focus:ring-indigo-400 outline-none text-center font-semibold text-indigo-700"
                        />
                      </div>
                      {q.options?.map((option, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-3">
                          {/* Visual indicator of type */}
                          <div className="text-gray-400">
                            {q.question_type === "MCQ" && (
                              <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                            )}
                            {q.question_type === "CHECKBOX" && (
                              <div className="h-4 w-4 rounded border-2 border-gray-300" />
                            )}
                            {q.question_type === "DROPDOWN" && (
                              <span className="text-xs font-mono">
                                {optIndex + 1}.
                              </span>
                            )}
                          </div>

                          <input
                            type="text"
                            placeholder={`Option ${optIndex + 1}`}
                            value={option}
                            onChange={(e) =>
                              handleOptionChange(qIndex, optIndex, e.target.value)
                            }
                            className="flex-grow px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                          />
                          <button
                            onClick={() => removeOption(qIndex, optIndex)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </div>
                      ))}

                      <button
                        onClick={() => addOption(qIndex)}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-800 mt-2 flex items-center gap-1 transition-colors"
                      >
                        <span>+ Add Choice</span>
                      </button>
                    </div>
                  )}

                {/* 2. Long Answer Preview */}
                {q.question_type === "LONG_TEXT" && (
                  <div className="mt-4 px-4 py-3 bg-gray-100 border border-dashed border-gray-300 rounded-lg text-gray-400 italic text-sm">
                    User will see a multi-line text area here...
                  </div>
                )}

                {/* 3. Star Rating Preview */}
                {q.question_type === "RATING" && (
                  <div className="mt-4 flex gap-2 items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8 text-yellow-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <span className="ml-2 text-sm text-gray-500 font-medium">
                      (5-Star Scale)
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* --- Footer Actions --- */}
          <div className="pt-6 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
            <button
              onClick={addQuestion}
              className="w-full md:w-auto px-6 py-3 bg-white border-2 border-indigo-600 text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              + Add New Question
            </button>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`w-full md:w-auto px-8 py-3 text-white font-semibold rounded-xl shadow-md transition-all duration-200 flex justify-center items-center ${loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 hover:-translate-y-0.5 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 hover:shadow-lg"
                }`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                "Save Form"
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
