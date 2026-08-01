/*
 * ServiceSearchForm — horizontal search bar used on the HomePage.
 * Receives filter state, validation errors, and handlers from the parent
 * so that this component stays purely presentational.
 */
function ServiceSearchForm({ filters, errors, onChange, onSubmit }) {
  return (
    <form className="search-bar" onSubmit={onSubmit} noValidate>
      {/* Service type — drop-down mapped to the category field in service data */}
      <label className="search-field">
        <span className="search-field-label">Service type</span>
        <select name="category" value={filters.category} onChange={onChange}>
          <option value="all">All services</option>
          <option value="barber">Barber</option>
          <option value="driving">Driving lessons</option>
          <option value="tutoring">Tutoring</option>
        </select>
      </label>

      {/* Location — free-text input; validated to be non-empty before search */}
      <label className="search-field">
        <span className="search-field-label">Location</span>
        <input
          name="location"
          type="text"
          placeholder="e.g. Dublin 8"
          value={filters.location}
          onChange={onChange}
          aria-describedby={errors.location ? "location-error" : undefined}
        />
        {errors.location && (
          <span id="location-error" className="error" role="alert">
            {errors.location}
          </span>
        )}
      </label>

      {/* Date — optional preference; rejects past dates in the parent handler */}
      <label className="search-field">
        <span className="search-field-label">Preferred date</span>
        <input
          name="date"
          type="date"
          value={filters.date}
          onChange={onChange}
          aria-describedby={errors.date ? "date-error" : undefined}
        />
        {errors.date && (
          <span id="date-error" className="error" role="alert">
            {errors.date}
          </span>
        )}
      </label>

      {/* Submit — triggers validation in the parent before showing results */}
      <button className="button button-primary search-submit" type="submit">
        Search
      </button>
    </form>
  );
}

export default ServiceSearchForm;
