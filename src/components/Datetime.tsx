import { useTranslations } from "@i18n/ui";
import { DEFAULT_LOCALE, getLangTag, type Locale } from "@i18n/utils";

interface DatetimesProps {
  pubDatetime: string | Date;
  modDatetime: string | Date | undefined | null;
}

interface Props extends DatetimesProps {
  size?: "sm" | "lg";
  className?: string;
  locale?: Locale;
}

export default function Datetime({
  pubDatetime,
  modDatetime,
  size = "sm",
  className = "",
  locale = DEFAULT_LOCALE,
}: Props) {
  const t = useTranslations(locale);

  return (
    <div
      className={`flex items-center space-x-2 text-skin-base/75 ${className}`.trim()}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`${
          size === "sm" ? "scale-90" : "scale-100"
        } inline-block h-6 w-6 min-w-[1.375rem] fill-skin-accent/85`}
        aria-hidden="true"
      >
        <path d="M7 11h2v2H7zm0 4h2v2H7zm4-4h2v2h-2zm0 4h2v2h-2zm4-4h2v2h-2zm0 4h2v2h-2z"></path>
        <path d="M5 22h14c1.103 0 2-.897 2-2V6c0-1.103-.897-2-2-2h-2V2h-2v2H9V2H7v2H5c-1.103 0-2 .897-2 2v14c0 1.103.897 2 2 2zM19 8l.001 12H5V8h14z"></path>
      </svg>
      {modDatetime && new Date(modDatetime) > new Date(pubDatetime) ? (
        <span
          className={`${size === "sm" ? "text-sm" : "text-base"} font-mono`}
        >
          {t("datetime.updated")}
        </span>
      ) : (
        <span className="sr-only">{t("datetime.published")}</span>
      )}
      <span className={`${size === "sm" ? "text-sm" : "text-base"} font-mono`}>
        <FormattedDatetime
          pubDatetime={pubDatetime}
          modDatetime={modDatetime}
          locale={locale}
        />
      </span>
    </div>
  );
}

const FormattedDatetime = ({
  pubDatetime,
  modDatetime,
  locale,
}: DatetimesProps & { locale: Locale }) => {
  const myDatetime = new Date(
    modDatetime && new Date(modDatetime) > new Date(pubDatetime)
      ? modDatetime
      : pubDatetime
  );

  const date = myDatetime.toLocaleDateString(getLangTag(locale), {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <>
      <time dateTime={myDatetime.toISOString()}>{date}</time>
    </>
  );
};
