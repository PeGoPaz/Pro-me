/*
 * A row of toggleable chips for multi-select fields — counties, test centres,
 * licence categories. Far easier on a phone than a <select multiple>, which is
 * where most instructors will be filling this in.
 */
function ChipGroup({ options, selected, onToggle, label }) {
  return (
    <div className="ob-chips" role="group" aria-label={label}>
      {options.map((option) => {
        const isOn = selected.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            className={`ob-chip ${isOn ? "ob-chip-on" : ""}`}
            aria-pressed={isOn}
            onClick={() => onToggle(option.value)}
            title={option.hint}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export default ChipGroup;
