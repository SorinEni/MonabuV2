import { getCountryFlag } from "@utils/avatar";

export function CountryCell({ ip, countryCode, countryName }) {
  const flag = getCountryFlag(countryCode);
  if (!ip && !flag)
    return <span style={{ color: "var(--text-faint)", fontSize: 12 }}>—</span>;
  return (
    <div className="country-cell">
      {flag && (
        <span className="country-cell__flag" title={countryName || countryCode}>
          {flag}
        </span>
      )}
      <div className="country-cell__info">
        {countryName && <span className="country-cell__name">{countryName}</span>}
        {ip && <span className="country-cell__ip">{ip}</span>}
      </div>
    </div>
  );
}
