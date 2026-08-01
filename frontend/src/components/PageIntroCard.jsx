function PageIntroCard({ title, description, children }) {
  return (
    <section className="card">
      <h2>{title}</h2>
      <p className="section-copy">{description}</p>
      {children}
    </section>
  );
}

export default PageIntroCard;
