import React, { useState, useEffect } from "react";
import api from "../utils/api";




interface Student {
  id: number;
  name: string;
}

interface LibraryIssue {
  id: number;
  student: Student;
  title: string;
  author: string;
  isbn: string;
  dueDate: string;
  issuedAt: string;
}

export default function LibraryManagement() {
  const [students, setStudents] = useState<Student[]>([]);
  const [issues, setIssues] = useState<LibraryIssue[]>([]);
  const [form, setForm] = useState({
    studentId: "",
    title: "",
    author: "",
    isbn: "",
    dueDate: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Fetch students
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await api.get("/admin/students");
        setStudents(res.data);
      } catch (err) {
        console.error("Failed to fetch students:", err);
      }
    };
    fetchStudents();
  }, []);

  // Fetch issued books
  const fetchIssues = async () => {
    try {
      const res = await api.get("/admin/library/issues");
      setIssues(res.data);
    } catch (err) {
      console.error("Failed to fetch issues:", err);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Issue book
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await api.post("/admin/library/issue", {
        student: { id: Number(form.studentId) },
        title: form.title,
        author: form.author,
        isbn: form.isbn,
        dueDate: form.dueDate, // backend parses string to LocalDate
      });
      setMessage("Book issued successfully!");
      setForm({ studentId: "", title: "", author: "", isbn: "", dueDate: "" });
      fetchIssues();
    } catch (err: any) {
      console.error("Failed to issue book:", err);
      setMessage(err.response?.data || "Error issuing book");
    } finally {
      setLoading(false);
    }
  };

  // Delete issued book
  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this issued book?")) return;
    try {
      await api.delete(`/admin/library/${id}`);
      setMessage("Issued book deleted successfully");
      fetchIssues();
    } catch (err) {
      console.error("Failed to delete issued book:", err);
      setMessage("Error deleting issued book");
    }
  };

  return (
    <div className="tab-content">
      <h2>📚 Library Management</h2>

      {/* Book Issue Form */}
      <form onSubmit={handleSubmit} className="issue-form">
        <div className="form-group">
          <label>Student</label>
          <select
            name="studentId"
            value={form.studentId}
            onChange={handleChange}
            required
            style={{ color: "#000", backgroundColor: "#fff" }}
          >
            <option value="">Select a student</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name || `ID: ${s.id}`}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Book Title</label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            style={{ color: "#000", backgroundColor: "#fff" }}
          />
        </div>

        <div className="form-group">
          <label>Author</label>
          <input
            type="text"
            name="author"
            value={form.author}
            onChange={handleChange}
            required
            style={{ color: "#000", backgroundColor: "#fff" }}
          />
        </div>

        <div className="form-group">
          <label>ISBN</label>
          <input
            type="text"
            name="isbn"
            value={form.isbn}
            onChange={handleChange}
            required
            style={{ color: "#000", backgroundColor: "#fff" }}
          />
        </div>

        <div className="form-group">
          <label>Due Date</label>
          <input
            type="date"
            name="dueDate"
            value={form.dueDate}
            onChange={handleChange}
            required
            style={{ color: "#000", backgroundColor: "#fff" }}
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Issuing..." : "Issue Book"}
        </button>
        {message && <p className="message">{message}</p>}
      </form>

      {/* Issued Books Table */}
      <h3>Issued Books</h3>
      <table className="issues-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Student</th>
            <th>Title</th>
            <th>Author</th>
            <th>ISBN</th>
            <th>Due Date</th>
            <th>Issued At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {issues.map((issue) => (
            <tr key={issue.id}>
              <td>{issue.id}</td>
              <td>{issue.student?.name || `ID: ${issue.student?.id}`}</td>
              <td>{issue.title}</td>
              <td>{issue.author}</td>
              <td>{issue.isbn}</td>
              <td>{issue.dueDate}</td>
              <td>{issue.issuedAt ? new Date(issue.issuedAt).toLocaleDateString() : "-"}</td>
              <td>
                <button onClick={() => handleDelete(issue.id)} className="delete-button">
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
