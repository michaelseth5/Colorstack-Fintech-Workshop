/**
 * Scrollable list of headline + source + date (workshop placeholder copy).
 * `articles` and `items` are aliases; at most `maxArticles` rows are shown.
 */
export default function NewsSection({
  items,
  articles,
  title = "Latest News",
  maxArticles = 4,
}) {
  const raw = articles ?? items ?? [];
  const visible = raw.slice(0, maxArticles);

  return (
    <section className="news-section panel-news-card news-panel-muted" aria-label={title}>
      <h3 className="news-section-heading">{title}</h3>
      {visible.length === 0 ? (
        <p className="panel-news-empty">
          No headlines loaded. Pick a ticker or check that the backend is running.
        </p>
      ) : (
        visible.map((item, index) => {
          const key = `${item.title}-${index}`;
          const inner = (
            <>
              <span className="news-title">{item.title}</span>
              <span className="news-meta">
                <span className="news-source">{item.source}</span>
                {item.date != null && item.date !== "" && (
                  <span className="news-date">{item.date}</span>
                )}
              </span>
            </>
          );
          if (item.link) {
            return (
              <a
                className="news-item news-item-link"
                key={key}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                {inner}
              </a>
            );
          }
          return (
            <div className="news-item" key={key}>
              {inner}
            </div>
          );
        })
      )}
    </section>
  );
}
