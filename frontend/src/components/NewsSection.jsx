/**
 * Scrollable list of headline + source rows (workshop placeholder copy).
 */
export default function NewsSection({ items, title = "Latest News" }) {
  return (
    <section className="news-section panel-news-card" aria-label={title}>
      <h3 className="panel-card-heading">{title}</h3>
      {items.length === 0 ? (
        <p className="panel-news-empty">Search a ticker to load headlines.</p>
      ) : (
        items.map((item, index) => (
          <div className="news-item" key={`${item.title}-${index}`}>
            <span className="news-title">{item.title}</span>
            <span className="news-source">{item.source}</span>
          </div>
        ))
      )}
    </section>
  );
}
