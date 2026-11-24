import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client.js';

function ProjectCard({ project }) {
  return (
    <article className="explore-card">
      <div className="explore-card-top">
        <span className="pill pill-public">{project.status}</span>
        <span className="muted small">{project.categoryName || 'Uncategorized'}</span>
      </div>
      <h3><Link to={`/explore/${project.projectId}`}>{project.title}</Link></h3>
      <p>{project.description}</p>
      <div className="explore-meta">
        <span>By {project.studentName || 'Student'}</span>
        <span>{project.departmentName || 'Department not set'}</span>
      </div>
      <Link className="btn btn-ghost btn-sm" to={`/explore/${project.projectId}`}>View project</Link>
    </article>
  );
}

export default function ExplorePage() {
  const { id } = useParams();
  const isArchive = window.location.pathname === '/archive';
  const [projects, setProjects] = useState([]);
  const [project, setProject] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ search: '', department: '', category: '', status: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/departments').then(({ data }) => setDepartments(data.departments || data)).catch(() => {});
    api.get('/categories').then(({ data }) => setCategories(data.categories || data)).catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    if (id) {
      api.get(`/projects/public/${id}`)
        .then(({ data }) => { if (active) setProject(data.project); })
        .catch((err) => { if (active) setError(getErrorMessage(err, 'Project could not be loaded.')); })
        .finally(() => { if (active) setLoading(false); });
    } else {
      const endpoint = isArchive ? '/projects/archive' : '/projects/public';
      api.get(endpoint, { params: isArchive ? {} : Object.fromEntries(Object.entries(filters).filter(([, value]) => value)) })
        .then(({ data }) => { if (active) setProjects(data.projects || []); })
        .catch((err) => { if (active) setError(getErrorMessage(err, 'Projects could not be loaded.')); })
        .finally(() => { if (active) setLoading(false); });
    }
    return () => { active = false; };
  }, [id, isArchive, filters]);

  if (id) {
    return (
      <section className="section"><div className="container explore-wrap">
        <Link className="text-link" to="/explore">← Back to explore</Link>
        {loading ? <p className="muted">Loading project…</p> : error ? <p className="form-error">{error}</p> : project && (
          <article className="card public-project-detail">
            <span className="pill pill-public">{project.status}</span>
            <h1>{project.title}</h1>
            <p className="muted">{project.categoryName} · {project.departmentName}</p>
            <p className="project-description">{project.description}</p>
            <dl className="profile-list">
              <div><dt>Student</dt><dd>{project.studentName || 'Not available'}</dd></div>
              <div><dt>Supervisor</dt><dd>{project.teacherName || 'Not available'}</dd></div>
              <div><dt>Course</dt><dd>{project.courseCode ? `${project.courseCode} — ${project.courseTitle}` : 'Not available'}</dd></div>
              <div><dt>Semester</dt><dd>{project.semester || 'Not available'}</dd></div>
              <div><dt>Progress</dt><dd>{project.progressPercent}%</dd></div>
            </dl>
            <p className="muted small">Public project information only. Private repository files and review feedback are not displayed.</p>
          </article>
        )}
      </div></section>
    );
  }

  return (
    <section className="section"><div className="container explore-wrap">
      <div className="section-heading">
        <span className="eyebrow">Capstone Grid</span>
        <h1>{isArchive ? 'Project Archive' : 'Explore Projects'}</h1>
        <p className="muted">{isArchive ? 'Browse completed projects shared for future reference.' : 'Discover public capstone projects from students and departments.'}</p>
        <div className="explore-switch"><Link className={!isArchive ? 'active' : ''} to="/explore">All projects</Link><Link className={isArchive ? 'active' : ''} to="/archive">Archive</Link></div>
      </div>
      {!isArchive && <div className="card explore-filters">
        <label>Search projects, students or teachers<input value={filters.search} onChange={(e) => setFilters((old) => ({ ...old, search: e.target.value }))} placeholder="Search by keyword…" /></label>
        <label>Department<select value={filters.department} onChange={(e) => setFilters((old) => ({ ...old, department: e.target.value }))}><option value="">All departments</option>{departments.map((item) => <option key={item.department_id || item.departmentId} value={item.department_id || item.departmentId}>{item.name}</option>)}</select></label>
        <label>Category<select value={filters.category} onChange={(e) => setFilters((old) => ({ ...old, category: e.target.value }))}><option value="">All categories</option>{categories.map((item) => <option key={item.category_id || item.categoryId} value={item.category_id || item.categoryId}>{item.name}</option>)}</select></label>
        <label>Status<select value={filters.status} onChange={(e) => setFilters((old) => ({ ...old, status: e.target.value }))}><option value="">All statuses</option><option>Submitted</option><option>Under Review</option><option>Accepted</option></select></label>
      </div>}
      {error && <p className="form-error">{error}</p>}
      {loading ? <p className="muted">Loading projects…</p> : projects.length ? <div className="explore-grid">{projects.map((item) => <ProjectCard key={item.projectId} project={item} />)}</div> : <div className="card empty-state"><h3>No public projects found</h3><p className="muted">Try changing your search or filters. Only public projects are shown here.</p></div>}
    </div></section>
  );
}
