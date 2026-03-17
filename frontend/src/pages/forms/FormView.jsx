import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../helpers/supabase";
export default function FormView() {
  //5 step
  const { id } = useParams();

  const [form, setForm] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchForm();
  }, []);

  const fetchForm = async () => {
    // Fetch form
    const { data: formData } = await supabase
      .from("forms")
      .select("*")
      .eq("id", id)
      .single(); //expects only one row

    // Fetch questions
    const { data: questionData } = await supabase
      .from("questions")
      .select("*")
      .eq("form_id", id);

    setForm(formData);
    setQuestions(questionData);
    setLoading(false);
  };

  const handleChange = (questionId, value) => {
    setAnswers({
      ...answers,
      [questionId]: value,
    });
  };

  const handleSubmit = async () => {
    const { data: submissionData, error: submissionError } = await supabase
      .from("submissions")
      .insert([{ form_id: id }])
      .select();

    console.log(submissionData);
    console.log(submissionError);
    if (submissionError) {
      alert("Error creating submission");
      return;
    }

    const submissionId = submissionData[0].id;

    //checking if all required responnses are fulfilled or not
    for(const q of questions){
      if(q.is_required){
        if(!answers[q.id]){
          alert("fill all required details");
          return;
        }
      }
    } 

    const formattedResponses = questions.map((q) => ({
      submission_id: submissionId,
      question_id: q.id,
      answer: answers[q.id] || "",
    }));

    const { error } = await supabase
      .from("responses")
      .insert(formattedResponses);

    if (error) {
      alert("Error submitting form");
      console.error(error);
    } else {
      alert("Form submitted successfully!");
      setAnswers({});
    }
  };

  if (loading) return <p>Loading...</p>;

  if (!form) return <p>Form not found</p>;

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 md:p-10 bg-white shadow-xl rounded-2xl border border-gray-100">
      {/* Header Section */}

      <div className="mb-8 border-b border-gray-200 pb-6">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
          {form.title}
        </h2>

        <p className="text-base text-gray-500">{form.description}</p>
      </div>

      {/* Questions Section */}

      {/* Inside your questions.map */}

      <div className="space-y-8">
        {questions.map((q) => (
          <div key={q.id} className="flex flex-col space-y-3">
            <label className="text-lg font-medium text-gray-800">
              {q.is_required
              ? <>
              {q.question_text} <span style={{ color: "red" }}>*</span>
               </>
                : q.question_text
                }
            </label>

             {/* 1. SHORT TEXT  */}
            {q.question_type === "TEXT" && (
              <input
                type="text"
                value={answers[q.id] || ""}
                onChange={(e) => handleChange(q.id, e.target.value)}
                placeholder="Type your answer..."
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
              />
            )}

            {/* 2. LONG TEXT (Paragraph) */}
            {q.question_type === "LONG_TEXT" && (
              <textarea
                rows={4}
                value={answers[q.id] || ""}
                onChange={(e) => handleChange(q.id, e.target.value)}
                placeholder="Type your long answer here..."
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm resize-none"
              />
            )}

            {/* 3. MCQ (Radio Buttons) */}
            {q.question_type === "MCQ" && (
              <div className="flex flex-col space-y-3 mt-2">
                {q.options?.map((option, index) => (
                  <label
                    key={index}
                    className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${answers[q.id] === option ? "border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600" : "border-gray-200 bg-white hover:bg-gray-50"}`}
                  >
                    <input
                      type="radio"
                      name={`question-${q.id}`}
                      value={option}
                      checked={answers[q.id] === option}
                      onChange={(e) => handleChange(q.id, e.target.value)}
                      className="w-5 h-5 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                    />
                    <span
                      className={`ml-3 ${answers[q.id] === option ? "text-indigo-900 font-medium" : "text-gray-700"}`}
                    >
                      {option}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {/* 4. CHECKBOXES (Multiple Selection) */}
            {q.question_type === "CHECKBOX" && (
              <div className="flex flex-col space-y-3 mt-2">
                {q.options?.map((option, index) => {
                  const currentAnswers = answers[q.id] || [];
                  const isChecked = currentAnswers.includes(option);

                  return (
                    <label
                      key={index}
                      className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${isChecked ? "border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600" : "border-gray-200 bg-white hover:bg-gray-50"}`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          const newValue = isChecked
                            ? currentAnswers.filter((item) => item !== option)
                            : [...currentAnswers, option];
                          handleChange(q.id, newValue);
                        }}
                        className="w-5 h-5 rounded text-indigo-600 border-gray-300 focus:ring-indigo-500"
                      />
                      <span
                        className={`ml-3 ${isChecked ? "text-indigo-900 font-medium" : "text-gray-700"}`}
                      >
                        {option}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}

            {/* 5. DROPDOWN MENU */}
            {q.question_type === "DROPDOWN" && (
              <select
                value={answers[q.id] || ""}
                onChange={(e) => handleChange(q.id, e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
              >
                <option value="" disabled>
                  Select an option
                </option>
                {q.options?.map((option, index) => (
                  <option key={index} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            )}

            {/* 6. STAR RATING */}
            {q.question_type === "RATING" && (
              <div className="flex items-center space-x-2 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleChange(q.id, star)}
                    className="focus:outline-none transform transition-transform hover:scale-110"
                  >
                    <svg
                      className={`h-10 w-10 ${star <= (answers[q.id] || 0) ? "text-yellow-400" : "text-gray-300"}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer / Submit Section */}

      <div className="mt-10 pt-6 border-t border-gray-200 flex justify-end">
        <button
          onClick={handleSubmit}
          className="w-full md:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 ease-in-out transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Submit Form
        </button>
      </div>
    </div>
  );
}
