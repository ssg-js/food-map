import type { Place } from "@food-map/registration";
import { Icon } from "@/shared/ui/icon";
export function PlaceCandidateRow({
  place,
  selected,
  disabled,
  onSelect,
}: {
  place: Place;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={`candidate-row${selected ? " is-selected" : ""}`}
      aria-pressed={selected}
      disabled={disabled}
      onClick={onSelect}
    >
      <span className="candidate-copy">
        <span className="candidate-name">{place.name}</span>
        <span className="candidate-address">{place.address}</span>
      </span>
      <span className="candidate-check">
        {selected && <Icon name="check" width={16} height={16} />}
      </span>
    </button>
  );
}
