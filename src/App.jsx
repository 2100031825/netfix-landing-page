import { useEffect, useMemo, useState } from 'react'
import './App.css'

const TMDB_BASE = 'https://api.themoviedb.org/3'
const IMG_BASE = 'https://image.tmdb.org/t/p'
const API_KEY = import.meta.env.VITE_TMDB_API_KEY

const rowsConfig = [
  { key: 'trending', title: 'Trending Now', endpoint: '/trending/all/week' },
  { key: 'topRated', title: 'Top Rated', endpoint: '/movie/top_rated' },
  { key: 'action', title: 'Action Movies', endpoint: '/discover/movie?with_genres=28' },
  { key: 'comedy', title: 'Comedy Movies', endpoint: '/discover/movie?with_genres=35' },
  { key: 'horror', title: 'Horror Movies', endpoint: '/discover/movie?with_genres=27' },
  { key: 'documentaries', title: 'Documentaries', endpoint: '/discover/movie?with_genres=99' },
]

const toArray = (payload) => Array.isArray(payload?.results) ? payload.results : []

const posterUrl = (movie, size = 'w342') =>
  movie?.poster_path ? `${IMG_BASE}/${size}${movie.poster_path}` : ''

const backdropUrl = (movie, size = 'w1280') =>
  movie?.backdrop_path ? `${IMG_BASE}/${size}${movie.backdrop_path}` : ''

const getTitle = (movie) => movie?.title || movie?.name || movie?.original_title || 'Untitled'

function App() {
  const [rows, setRows] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!API_KEY) {
      setError('Missing VITE_TMDB_API_KEY in .env')
      setLoading(false)
      return
    }

    const fetchRows = async () => {
      try {
        const requests = rowsConfig.map(async (row) => {
          const joinChar = row.endpoint.includes('?') ? '&' : '?'
          const url = `${TMDB_BASE}${row.endpoint}${joinChar}api_key=${API_KEY}`
          const response = await fetch(url)
          if (!response.ok) {
            throw new Error(`TMDB request failed with status ${response.status}`)
          }
          const json = await response.json()
          return [row.key, toArray(json)]
        })

        const data = Object.fromEntries(await Promise.all(requests))
        setRows(data)
      } catch (requestError) {
        setError(requestError.message || 'Unable to load movies from TMDB')
      } finally {
        setLoading(false)
      }
    }

    fetchRows()
  }, [])

  const heroMovie = useMemo(() => {
    const source = rows.trending || []
    return source.find((item) => item.backdrop_path) || source[0] || null
  }, [rows])

  return (
    <div className="app-shell">
      <header
        className="hero"
        style={{
          backgroundImage: heroMovie ? `url(${backdropUrl(heroMovie)})` : 'none',
        }}
      >
        <div className="hero-overlay" />
        <nav className="top-nav">
          <div className="brand">NETFLIX</div>
          <div className="nav-links">
            <span>Home</span>
            <span>TV Shows</span>
            <span>Movies</span>
            <span>My List</span>
          </div>
        </nav>
        <div className="hero-content">
          <h1>{heroMovie ? getTitle(heroMovie) : 'Netflix Style Landing Page'}</h1>
          <p>{heroMovie?.overview || 'Loading featured title from TMDB...'}</p>
          <div className="hero-actions">
            <button className="btn btn-play">Play</button>
            <button className="btn btn-info">More Info</button>
          </div>
        </div>
      </header>

      <main className="rows">
        {loading && <p className="status">Loading movies from TMDB...</p>}
        {error && <p className="status error">{error}</p>}

        {!loading && !error && rowsConfig.map((row) => (
          <section key={row.key} className="movie-row">
            <h2>{row.title}</h2>
            <div className="posters">
              {(rows[row.key] || []).slice(0, 18).map((movie) => (
                <article key={movie.id} className="poster-card" title={getTitle(movie)}>
                  {posterUrl(movie) ? (
                    <img
                      src={posterUrl(movie)}
                      alt={getTitle(movie)}
                      loading="lazy"
                    />
                  ) : (
                    <div className="poster-fallback">{getTitle(movie)}</div>
                  )}
                </article>
              ))}
            </div>
          </section>
        ))}
      </main>
      <div className="fade-bottom" />
    </div>
  )
}

export default App
