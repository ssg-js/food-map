import { Icon } from "@/shared/ui/icon";
export function RegistrationSteps({ step }: { step: 1 | 2 | 3 }) {
  return (
    <ol className="registration-steps" aria-label="맛집 등록 단계">
      {["장소 검색", "카테고리 선택", "등록 완료"].map((label, index) => (
        <li
          key={label}
          className={
            step === index + 1
              ? "is-current"
              : step > index + 1
                ? "is-done"
                : ""
          }
          aria-current={step === index + 1 ? "step" : undefined}
        >
          <span className="step-number">
            {step > index + 1 ? (
              <Icon name="check" width={14} height={14} />
            ) : (
              index + 1
            )}
          </span>
          <span>{label}</span>
          {index < 2 && (
            <Icon name="arrow" className="step-arrow" width={14} height={14} />
          )}
        </li>
      ))}
    </ol>
  );
}
