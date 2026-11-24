import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { initialsOf } from '../components/Navbar.jsx';

function formatDate(value) {
  return new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

export default function CommunityPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [opinions, setOpinions] = useState({});
  const [opinionDrafts, setOpinionDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');

  async function loadPosts() {
    setError('');
    try {
      const response = await api.get('/posts');
      setPosts(response.data.posts);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Could not load community posts.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadPosts(); }, []);

  async function loadOpinions(postId) {
    try {
      const response = await api.get(`/posts/${postId}/opinions`);
      setOpinions((current) => ({ ...current, [postId]: response.data.opinions }));
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Could not load opinions.'));
    }
  }

  async function publishPost(event) {
    event.preventDefault();
    if (!content.trim() && !image) {
      setError('Write something or select an image before publishing.');
      return;
    }
    const formData = new FormData();
    formData.append('content', content);
    if (image) formData.append('image', image);
    setPublishing(true);
    setError('');
    try {
      await api.post('/posts', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setContent('');
      setImage(null);
      event.target.reset();
      await loadPosts();
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Could not publish your post.'));
    } finally {
      setPublishing(false);
    }
  }

  async function addOpinion(event, postId) {
    event.preventDefault();
    const opinion = (opinionDrafts[postId] || '').trim();
    if (!opinion) return;
    try {
      const response = await api.post(`/posts/${postId}/opinions`, { opinion });
      setOpinions((current) => ({
        ...current,
        [postId]: [...(current[postId] || []), response.data.opinion]
      }));
      setOpinionDrafts((current) => ({ ...current, [postId]: '' }));
      setPosts((current) => current.map((post) => post.postId === postId
        ? { ...post, opinionCount: post.opinionCount + 1 }
        : post));
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Could not add your opinion.'));
    }
  }

  return (
    <section className="section community-section">
      <div className="container community-container">
        <div className="community-heading">
          <div>
            <span className="eyebrow">Capstone Grid</span>
            <h1>Community</h1>
            <p className="muted">Share updates, photos and ideas with the Capstone Grid community.</p>
          </div>
          <span className="community-count">{posts.length} {posts.length === 1 ? 'post' : 'posts'}</span>
        </div>

        {error && <div className="alert alert-error" role="alert">{error}</div>}

        {user ? (
          <form className="community-composer" onSubmit={publishPost}>
            <div className="community-composer-top">
              <span className="avatar" aria-hidden="true">{initialsOf(user.name)}</span>
              <div><strong>{user.name}</strong><small>{user.role}</small></div>
            </div>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              maxLength={2000}
              rows={3}
              placeholder="What's happening with your capstone work?"
              aria-label="Post text"
            />
            <div className="community-composer-actions">
              <label className="btn btn-outline btn-sm community-file-label">
                Add photo
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setImage(event.target.files?.[0] || null)} />
              </label>
              <span className="muted small">{image ? image.name : 'JPG, PNG or WEBP · max 5 MB'}</span>
              <button className="btn btn-primary btn-sm" type="submit" disabled={publishing}>
                {publishing ? 'Publishing…' : 'Publish post'}
              </button>
            </div>
          </form>
        ) : (
          <div className="community-signin">
            <p>Log in to publish a post or share your opinion.</p>
            <Link className="btn btn-primary btn-sm" to="/login">Log in</Link>
          </div>
        )}

        <div className="community-feed">
          {loading ? <p className="muted center">Loading community posts…</p> : posts.length === 0 ? (
            <div className="empty-state"><h3>No posts yet</h3><p>Be the first to share something with the community.</p></div>
          ) : posts.map((post) => (
            <article className="community-post" key={post.postId}>
              <div className="community-post-author">
                <span className="avatar" aria-hidden="true">{initialsOf(post.authorName)}</span>
                <div><strong>{post.authorName}</strong><small>{post.authorRole} · {formatDate(post.createdAt)}</small></div>
              </div>
              {post.content && <p className="community-post-content">{post.content}</p>}
              {post.hasImage && (
                <img className="community-post-image" src={`${api.defaults.baseURL}/posts/${post.postId}/image`} alt={`Photo shared by ${post.authorName}`} loading="lazy" />
              )}
              <div className="community-post-meta">{post.opinionCount} {post.opinionCount === 1 ? 'opinion' : 'opinions'}</div>
              <div className="community-opinions">
                <button className="community-opinion-toggle" type="button" onClick={() => loadOpinions(post.postId)}>
                  View opinions
                </button>
                {opinions[post.postId] && (
                  <div className="community-opinion-list">
                    {opinions[post.postId].length === 0 ? <p className="muted small">No opinions yet.</p> : opinions[post.postId].map((item) => (
                      <div className="community-opinion" key={item.opinionId}>
                        <strong>{item.authorName}</strong><small>{item.authorRole}</small>
                        <p>{item.opinion}</p>
                      </div>
                    ))}
                  </div>
                )}
                {user ? (
                  <form className="community-opinion-form" onSubmit={(event) => addOpinion(event, post.postId)}>
                    <input
                      value={opinionDrafts[post.postId] || ''}
                      onChange={(event) => setOpinionDrafts((current) => ({ ...current, [post.postId]: event.target.value }))}
                      maxLength={1000}
                      placeholder="Share your opinion…"
                      aria-label="Write an opinion"
                    />
                    <button className="btn btn-primary btn-sm" type="submit" disabled={!(opinionDrafts[post.postId] || '').trim()}>Comment</button>
                  </form>
                ) : <p className="muted small">Log in to share an opinion.</p>}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
